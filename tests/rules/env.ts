import { readFileSync } from 'node:fs';
import {
  initializeTestEnvironment,
  type RulesTestContext,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, serverTimestamp, setDoc, Timestamp, type Firestore } from 'firebase/firestore';

export const BID = 'b1';
export const OWNER = 'owner';
export const EMPLOYEE = 'emp';
export const CASHIER_PLUS = 'emp-plus';
export const OUTSIDER = 'outsider';
export const INVITEE_EMAIL = 'invitee@example.co';

export async function createEnv(): Promise<RulesTestEnvironment> {
  return initializeTestEnvironment({
    projectId: 'demo-superpos-rules',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
}

/** Contexto autenticado con email verificado. */
export function as(env: RulesTestEnvironment, uid: string, email = `${uid}@example.co`): Firestore {
  const context: RulesTestContext = env.authenticatedContext(uid, { email, email_verified: true });
  return context.firestore() as unknown as Firestore;
}

/** Terminal POS: sesión anónima de Firebase Auth de la instalación. */
export const TERMINAL = 'term1';
export const REVOKED_TERMINAL = 'term-revoked';

export function asTerminal(env: RulesTestEnvironment, uid: string = TERMINAL): Firestore {
  const context = env.authenticatedContext(uid, { firebase: { sign_in_provider: 'anonymous' } });
  return context.firestore() as unknown as Firestore;
}

export const terminalData = (overrides: Record<string, unknown> = {}) => ({
  deviceUuid: '0b6f2c1e-6a8e-4c39-9d1a-2f3e4d5c6b7a',
  deviceType: 'tablet',
  name: 'Caja principal',
  status: 'active',
  idleLockMinutes: 5,
  pairingRequestId: 'a'.repeat(64),
  registeredBy: OWNER,
  authorizedAt: Timestamp.fromMillis(Date.UTC(2026, 0, 1)),
  lastSeenAt: null,
  revokedAt: null,
  ...overrides,
});

/** Super administrador de la plataforma (custom claim asignado por el Admin SDK). */
export const PLATFORM_ADMIN = 'soporte';

export function asPlatformAdmin(env: RulesTestEnvironment): Firestore {
  const context = env.authenticatedContext(PLATFORM_ADMIN, {
    email: 'soporte@example.co',
    email_verified: true,
    platformAdmin: true,
  });
  return context.firestore() as unknown as Firestore;
}

/** Campos de auditoría válidos para una creación. */
export function newAudit(uid: string) {
  return {
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: uid,
    schemaVersion: 1,
  };
}

const pastAudit = (uid: string) => ({
  createdAt: Timestamp.fromMillis(Date.UTC(2026, 0, 1)),
  updatedAt: Timestamp.fromMillis(Date.UTC(2026, 0, 1)),
  createdBy: uid,
  schemaVersion: 1,
});

export const member = (
  uid: string,
  role: 'admin' | 'employee',
  extraPermissions: string[] = [],
) => ({
  displayName: uid,
  email: `${uid}@example.co`,
  role,
  extraPermissions,
  status: 'active',
  ...pastAudit(OWNER),
});

export const productData = (overrides: Record<string, unknown> = {}) => ({
  name: 'Café',
  sku: null,
  barcode: '7701',
  categoryId: null,
  priceMinor: 350000,
  costMinor: null,
  taxRateBps: 1900,
  trackStock: true,
  lowStockThreshold: 5,
  active: true,
  stock: 10,
  imageUrl: null,
  ...overrides,
});

export const saleData = (overrides: Record<string, unknown> = {}) => ({
  type: 'sale',
  number: 'CAJA1-000001',
  deviceCode: 'CAJA1',
  lines: [
    {
      productId: 'p1',
      name: 'Café',
      unitPriceMinor: 350000,
      quantity: 1,
      taxRateBps: 1900,
      discountMinor: 0,
      voided: false,
    },
  ],
  subtotalMinor: 294118,
  discountMinor: 0,
  taxMinor: 55882,
  totalMinor: 350000,
  payments: [{ method: 'cash', amountMinor: 350000, status: 'captured', reference: null }],
  changeMinor: 0,
  customerId: null,
  cashShiftId: null,
  terminalId: TERMINAL,
  voidedSaleId: null,
  voidReason: null,
  occurredAt: Timestamp.fromMillis(Date.now() - 60_000),
  ...overrides,
});

export const shiftData = (overrides: Record<string, unknown> = {}) => ({
  status: 'open',
  deviceCode: 'CAJA1',
  openedBy: EMPLOYEE,
  openedAt: Timestamp.fromMillis(Date.UTC(2026, 0, 1)),
  openingFloatMinor: 5000000,
  closedBy: null,
  closedAt: null,
  countedCashMinor: null,
  expectedCashMinor: null,
  notes: null,
  ...overrides,
});

/** Negocio b1: dueño admin, empleado, empleado con permisos extra y datos base. */
export async function seed(env: RulesTestEnvironment): Promise<void> {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore() as unknown as Firestore;
    const at = (path: string) => doc(db, `businesses/${BID}/${path}`);
    await setDoc(doc(db, `businesses/${BID}`), {
      name: 'Tienda Uno',
      type: 'store',
      currency: 'COP',
      timezone: 'America/Bogota',
      ownerUid: OWNER,
      ...pastAudit(OWNER),
    });
    await setDoc(at(`members/${OWNER}`), member(OWNER, 'admin'));
    await setDoc(at(`members/${EMPLOYEE}`), member(EMPLOYEE, 'employee'));
    await setDoc(
      at(`members/${CASHIER_PLUS}`),
      member(CASHIER_PLUS, 'employee', [
        'sales.void',
        'cash.close',
        'catalog.manage',
        'inventory.adjust',
      ]),
    );
    await setDoc(at('settings/modules'), {
      restaurant: true,
      customers: true,
      ...pastAudit(OWNER),
    });
    await setDoc(at(`posTerminals/${TERMINAL}`), { ...terminalData(), ...pastAudit(OWNER) });
    await setDoc(at(`posTerminals/${REVOKED_TERMINAL}`), {
      ...terminalData({ status: 'revoked', revokedAt: Timestamp.fromMillis(Date.UTC(2026, 0, 2)) }),
      ...pastAudit(OWNER),
    });
    await setDoc(at('products/p1'), { ...productData(), ...pastAudit(OWNER) });
    await setDoc(at('categories/c1'), {
      name: 'Bebidas',
      color: 'primary',
      sortOrder: 0,
      ...pastAudit(OWNER),
    });
    await setDoc(at('sales/s1'), { ...saleData(), ...pastAudit(EMPLOYEE) });
    await setDoc(at('cashShifts/shift1'), { ...shiftData(), ...pastAudit(EMPLOYEE) });
    await setDoc(at('customers/cu1'), {
      name: 'Ana',
      documentId: null,
      phone: null,
      email: null,
      notes: null,
      ...pastAudit(EMPLOYEE),
    });
    await setDoc(at('restaurantTables/t1'), {
      name: 'Mesa 1',
      zoneId: 'z1',
      seats: 4,
      status: 'free',
      ...pastAudit(OWNER),
    });
    await setDoc(at(`invitations/${INVITEE_EMAIL}`), {
      email: INVITEE_EMAIL,
      role: 'employee',
      extraPermissions: [],
      businessId: BID,
      businessName: 'Tienda Uno',
      ...pastAudit(OWNER),
    });
  });
}
