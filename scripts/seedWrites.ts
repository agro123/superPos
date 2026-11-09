/**
 * Documentos de ejemplo (2 negocios ficticios) que comparten el seed del emulador y la carga de
 * demostración (`scripts/demo.ts`). Sin datos reales (L13).
 */
import { Timestamp, type DocumentData } from 'firebase-admin/firestore';
import { defaultTaxRates } from '../src/features/business/domain/settings';
import { BUSINESSES, buildSales, INVITATION, USERS, type SeedBusiness } from './seedData';

export type SeedWrite = [string, DocumentData];

export function buildSeedWrites(now: Date): SeedWrite[] {
  const audit = (uid: string, at: Date = now) => ({
    createdAt: Timestamp.fromDate(at),
    updatedAt: Timestamp.fromDate(at),
    createdBy: uid,
    schemaVersion: 1,
  });

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
      [
        `${base}/settings/paymentMethods`,
        { enabled: ['cash', 'card', 'transfer'], ...audit(owner) },
      ],
      // Negocios de ejemplo ya configurados: no muestran el asistente.
      [
        `${base}/settings/setup`,
        {
          completedSteps: [],
          skippedSteps: [],
          dismissedAt: null,
          completedAt: Timestamp.fromDate(now),
          ...audit(owner),
        },
      ],
    ];

    // Cupos de trabajador (seats/1..3): cada empleado ocupa uno; el plan gratis admite solo el 1.
    let nextSeat = 1;
    for (const member of business.members) {
      const user = USERS.find((candidate) => candidate.uid === member.uid);
      if (!user) continue;
      const seatId = member.role === 'admin' ? null : String(nextSeat++);
      if (seatId) writes.push([`${base}/seats/${seatId}`, { uid: member.uid, ...audit(owner) }]);
      writes.push([
        `${base}/members/${member.uid}`,
        {
          displayName: user.displayName,
          email: user.email,
          role: member.role,
          extraPermissions: [],
          status: 'active',
          seatId,
          ...audit(owner),
        },
      ]);
      // El tour ya se vio (las pruebas e2e no lo esperan); se prueba con un negocio nuevo.
      writes.push([`${base}/tourProgress/${member.uid}`, { status: 'done', ...audit(member.uid) }]);
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
            supplierId: null,
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
    // Una venta fiada al primer cliente (con un abono parcial más abajo) para ver la cartera.
    const creditSale = business.customers.length > 0 ? sales[1] : undefined;
    for (const sale of sales) {
      const fiada = sale === creditSale;
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
              method: fiada ? 'credit' : sale.method,
              amountMinor: sale.totalMinor,
              status: 'captured',
              reference: null,
            },
          ],
          changeMinor: 0,
          creditMinor: fiada ? sale.totalMinor : 0,
          customerId: fiada ? 'customer-1' : null,
          cashShiftId: null,
          terminalId: null,
          voidedSaleId: null,
          voidReason: null,
          occurredAt: Timestamp.fromDate(sale.occurredAt),
          ...audit(sale.createdBy, sale.occurredAt),
        },
      ]);
    }

    if (creditSale) {
      writes.push([
        `${base}/creditPayments/abono-1`,
        {
          customerId: 'customer-1',
          amountMinor: Math.floor(creditSale.totalMinor / 2),
          method: 'cash',
          cashShiftId: 'shift-yesterday',
          occurredAt: Timestamp.fromDate(new Date(creditSale.occurredAt.getTime() + 3_600_000)),
          ...audit(owner, creditSale.occurredAt),
        },
      ]);
    }

    // Una anulación de ejemplo: documento nuevo de tipo `void` (las ventas son inmutables).
    const voided = sales[2];
    if (voided) {
      writes.push([
        `${base}/sales/void-${voided.id}`,
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
          creditMinor: 0,
          customerId: null,
          cashShiftId: null,
          terminalId: null,
          voidedSaleId: voided.id,
          voidReason: 'Producto equivocado',
          occurredAt: Timestamp.fromDate(new Date(voided.occurredAt.getTime() + 300_000)),
          ...audit(owner, voided.occurredAt),
        },
      ]);
    }

    // Restaurante: zonas y mesas de ejemplo para el tablero y la cocina.
    if (business.modules.restaurant) {
      const zones = [
        { id: 'salon', name: 'Salón', tables: ['Mesa 1', 'Mesa 2', 'Mesa 3', 'Mesa 4'] },
        { id: 'terraza', name: 'Terraza', tables: ['Mesa 5', 'Mesa 6'] },
      ];
      zones.forEach((zone, sortOrder) => {
        writes.push([
          `${base}/restaurantZones/${zone.id}`,
          { name: zone.name, sortOrder, ...audit(owner) },
        ]);
        for (const name of zone.tables) {
          const id = name.toLowerCase().replace(' ', '-');
          writes.push([
            `${base}/restaurantTables/${id}`,
            { name, zoneId: zone.id, seats: 4, status: 'free', ...audit(owner) },
          ]);
        }
      });
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

  return writes;
}
