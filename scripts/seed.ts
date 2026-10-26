/**
 * Siembra los emuladores con 2 negocios de ejemplo (tienda y cafetería).
 * Uso: `pnpm emulators` en una terminal y `pnpm seed` en otra (o `pnpm test:e2e`).
 * SOLO apunta al emulador: aborta ante un proyecto real (scripts/seedGuard.ts, L13).
 */
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import {
  getFirestore,
  Timestamp,
  type DocumentData,
  type Firestore,
} from 'firebase-admin/firestore';
import { defaultTaxRates } from '../src/features/business/domain/settings';
import {
  BUSINESSES,
  buildSales,
  INVITATION,
  PLATFORM_ADMINS,
  SEED_PASSWORD,
  USERS,
  type SeedBusiness,
} from './seedData';
import { resolveSeedTarget } from './seedGuard';

const target = resolveSeedTarget(process.env);
process.env.FIRESTORE_EMULATOR_HOST = target.firestoreHost;
process.env.FIREBASE_AUTH_EMULATOR_HOST = target.authHost;

const app = initializeApp({ projectId: target.projectId });
const db = getFirestore(app);
const auth = getAuth(app);
const now = new Date();

const audit = (uid: string, at: Date = now) => ({
  createdAt: Timestamp.fromDate(at),
  updatedAt: Timestamp.fromDate(at),
  createdBy: uid,
  schemaVersion: 1,
});

async function clearEmulators(): Promise<void> {
  const firestoreUrl = `http://${target.firestoreHost}/emulator/v1/projects/${target.projectId}/databases/(default)/documents`;
  const authUrl = `http://${target.authHost}/emulator/v1/projects/${target.projectId}/accounts`;
  for (const url of [firestoreUrl, authUrl]) {
    const response = await fetch(url, { method: 'DELETE' });
    if (!response.ok) throw new Error(`No se pudo limpiar ${url}: ${response.status}`);
  }
}

/** Escribe en lotes de 400 operaciones (límite de Firestore: 500). */
async function writeAll(firestore: Firestore, writes: [string, DocumentData][]): Promise<void> {
  for (let i = 0; i < writes.length; i += 400) {
    const batch = firestore.batch();
    for (const [path, data] of writes.slice(i, i + 400)) batch.set(firestore.doc(path), data);
    await batch.commit();
  }
}

function businessWrites(business: SeedBusiness): [string, DocumentData][] {
  const owner = business.members.find((member) => member.role === 'admin')?.uid ?? 'seed';
  const base = `businesses/${business.id}`;
  const writes: [string, DocumentData][] = [
    [
      base,
      {
        name: business.name,
        type: business.type,
        currency: 'COP',
        timezone: 'America/Bogota',
        ownerUid: owner,
        plan: business.plan,
        status: business.status,
        ...audit(owner),
      },
    ],
    [`${base}/settings/modules`, { ...business.modules, ...audit(owner) }],
    [
      `${base}/settings/taxes`,
      { pricesIncludeTax: true, defaultRateBps: 1900, rates: defaultTaxRates(), ...audit(owner) },
    ],
    [`${base}/settings/paymentMethods`, { enabled: ['cash', 'card', 'transfer'], ...audit(owner) }],
  ];

  for (const member of business.members) {
    const user = USERS.find((candidate) => candidate.uid === member.uid);
    if (!user) continue;
    writes.push([
      `${base}/members/${member.uid}`,
      {
        displayName: user.displayName,
        email: user.email,
        role: member.role,
        extraPermissions: [],
        status: 'active',
        ...audit(owner),
      },
    ]);
  }

  business.categories.forEach((category, index) => {
    writes.push([
      `${base}/categories/${category.id}`,
      { name: category.name, color: category.color, sortOrder: index, ...audit(owner) },
    ]);
  });

  for (const product of business.products) {
    writes.push([
      `${base}/products/${product.id}`,
      {
        name: product.name,
        sku: product.id.toUpperCase(),
        barcode: product.barcode,
        categoryId: product.categoryId,
        priceMinor: product.priceMinor,
        costMinor: Math.round(product.priceMinor * 0.6),
        taxRateBps: product.taxRateBps,
        trackStock: product.trackStock,
        lowStockThreshold: product.lowStockThreshold,
        active: true,
        stock: product.stock,
        imageUrl: null,
        ...audit(owner),
      },
    ]);
    if (product.trackStock && product.stock > 0) {
      writes.push([
        `${base}/inventoryMovements/initial-${product.id}`,
        {
          productId: product.id,
          type: 'purchase',
          quantityDelta: product.stock,
          reason: 'Inventario inicial',
          saleId: null,
          ...audit(owner),
        },
      ]);
    }
  }

  business.customers.forEach((name, index) => {
    writes.push([
      `${base}/customers/customer-${index + 1}`,
      {
        name,
        documentId: null,
        phone: `300${String(1000000 + index * 7919).slice(0, 7)}`,
        email: null,
        notes: null,
        ...audit(owner),
      },
    ]);
  });

  writes.push([
    `${base}/suppliers/supplier-1`,
    {
      name: 'Distribuidora del Valle',
      phone: '6023334455',
      email: 'pedidos@distrivalle.test',
      ...audit(owner),
    },
  ]);

  const sales = buildSales(business, now, 14, business.type === 'cafe' ? 9 : 6);
  for (const sale of sales) {
    writes.push([
      `${base}/sales/${sale.id}`,
      {
        type: 'sale',
        number: sale.number,
        deviceCode: 'SEED',
        lines: sale.lines,
        subtotalMinor: sale.subtotalMinor,
        discountMinor: sale.discountMinor,
        taxMinor: sale.taxMinor,
        totalMinor: sale.totalMinor,
        payments: [
          {
            method: sale.method,
            amountMinor: sale.totalMinor,
            status: 'captured',
            reference: null,
          },
        ],
        changeMinor: 0,
        customerId: null,
        cashShiftId: null,
        voidedSaleId: null,
        voidReason: null,
        occurredAt: Timestamp.fromDate(sale.occurredAt),
        ...audit(sale.createdBy, sale.occurredAt),
      },
    ]);
  }

  // Una anulación de ejemplo: documento nuevo de tipo `void` (las ventas son inmutables).
  const voided = sales[2];
  if (voided) {
    writes.push([
      `${base}/sales/${voided.id}-void`,
      {
        type: 'void',
        number: `${voided.number}-A`,
        deviceCode: 'SEED',
        lines: voided.lines,
        subtotalMinor: voided.subtotalMinor,
        discountMinor: voided.discountMinor,
        taxMinor: voided.taxMinor,
        totalMinor: voided.totalMinor,
        payments: [],
        changeMinor: 0,
        customerId: null,
        cashShiftId: null,
        voidedSaleId: voided.id,
        voidReason: 'Producto equivocado',
        occurredAt: Timestamp.fromDate(new Date(voided.occurredAt.getTime() + 300_000)),
        ...audit(owner, voided.occurredAt),
      },
    ]);
  }

  const yesterday = new Date(now.getTime() - 86_400_000);
  writes.push([
    `${base}/cashShifts/shift-yesterday`,
    {
      status: 'closed',
      deviceCode: 'SEED',
      openedBy: owner,
      openedAt: Timestamp.fromDate(new Date(yesterday.getTime() - 9 * 3_600_000)),
      openingFloatMinor: 10_000_000,
      closedBy: owner,
      closedAt: Timestamp.fromDate(yesterday),
      countedCashMinor: 31_250_000,
      expectedCashMinor: 31_300_000,
      notes: 'Faltante menor',
      ...audit(owner, yesterday),
    },
  ]);
  return writes;
}

async function main(): Promise<void> {
  console.info(`Sembrando ${target.projectId} en ${target.firestoreHost} / ${target.authHost}`);
  await clearEmulators();

  for (const user of USERS) {
    await auth.createUser({
      uid: user.uid,
      email: user.email,
      password: SEED_PASSWORD,
      displayName: user.displayName,
      emailVerified: true,
    });
  }
  for (const uid of PLATFORM_ADMINS) await auth.setCustomUserClaims(uid, { platformAdmin: true });

  const writes: [string, DocumentData][] = USERS.map((user) => [
    `users/${user.uid}`,
    {
      displayName: user.displayName,
      email: user.email,
      businessIds: BUSINESSES.filter((business) =>
        business.members.some((member) => member.uid === user.uid),
      ).map((business) => business.id),
      ...audit(user.uid),
    },
  ]);
  for (const business of BUSINESSES) writes.push(...businessWrites(business));

  const invitedBusiness = BUSINESSES.find((business) => business.id === INVITATION.businessId);
  writes.push([
    `businesses/${INVITATION.businessId}/invitations/${INVITATION.email}`,
    {
      email: INVITATION.email,
      role: INVITATION.role,
      extraPermissions: [],
      businessId: INVITATION.businessId,
      businessName: invitedBusiness?.name ?? '',
      ...audit('rosa'),
    },
  ]);

  await writeAll(db, writes);
  console.info(
    `Listo: ${USERS.length} usuarios, ${BUSINESSES.length} negocios, ${writes.length} documentos.`,
  );
  console.info(
    `Usuarios: ${USERS.map((user) => user.email).join(', ')} · contraseña: ${SEED_PASSWORD}`,
  );
  console.info(`Super administradores: ${PLATFORM_ADMINS.join(', ')}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
