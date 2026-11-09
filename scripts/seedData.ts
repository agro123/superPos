import type { BusinessPlan, BusinessStatus } from '../src/features/business/domain/business';
import type { Role } from '../src/features/users/domain/permissions';
import { calculateTotals } from '../src/features/sales/domain/totals';
import { money } from '../src/shared/domain/money';

/** Contraseña común de los usuarios del emulador. Solo para desarrollo local. */
export const SEED_PASSWORD = 'superpos123';

export interface SeedUser {
  uid: string;
  email: string;
  displayName: string;
}

export interface SeedProduct {
  id: string;
  name: string;
  categoryId: string;
  priceMinor: number;
  taxRateBps: number;
  stock: number;
  lowStockThreshold: number;
  barcode: string | null;
  trackStock: boolean;
}

export interface SeedBusiness {
  id: string;
  name: string;
  type: 'store' | 'cafe';
  members: { uid: string; role: Role }[];
  categories: { id: string; name: string; color: string }[];
  products: SeedProduct[];
  customers: string[];
  modules: { restaurant: boolean; customers: boolean };
  plan: BusinessPlan;
  status: BusinessStatus;
}

export const USERS: SeedUser[] = [
  { uid: 'rosa', email: 'rosa@superpos.test', displayName: 'Rosa Martínez' },
  { uid: 'carlos', email: 'carlos@superpos.test', displayName: 'Carlos Pérez' },
  { uid: 'ana', email: 'ana@superpos.test', displayName: 'Ana Ríos' },
  { uid: 'luis', email: 'luis@superpos.test', displayName: 'Luis Gómez' },
  { uid: 'invitado', email: 'invitado@superpos.test', displayName: 'Invitado Demo' },
  { uid: 'soporte', email: 'soporte@superpos.test', displayName: 'Soporte SuperPOS' },
];

/** Usuarios con el custom claim `platformAdmin` (super administrador, ADR 0010). */
export const PLATFORM_ADMINS = ['soporte'];

const p = (
  id: string,
  name: string,
  categoryId: string,
  pesos: number,
  stock: number,
  options: Partial<
    Pick<SeedProduct, 'taxRateBps' | 'barcode' | 'trackStock' | 'lowStockThreshold'>
  > = {},
): SeedProduct => ({
  id,
  name,
  categoryId,
  priceMinor: pesos * 100,
  stock,
  taxRateBps: options.taxRateBps ?? 1900,
  barcode: options.barcode ?? null,
  trackStock: options.trackStock ?? true,
  lowStockThreshold: options.lowStockThreshold ?? 5,
});

export const BUSINESSES: SeedBusiness[] = [
  {
    id: 'tienda-rosa',
    name: 'Minimercado Doña Rosa',
    type: 'store',
    members: [
      { uid: 'rosa', role: 'admin' },
      { uid: 'carlos', role: 'employee' },
      { uid: 'ana', role: 'employee' },
    ],
    categories: [
      { id: 'despensa', name: 'Despensa', color: 'warning' },
      { id: 'bebidas', name: 'Bebidas', color: 'info' },
      { id: 'aseo', name: 'Aseo', color: 'success' },
      { id: 'snacks', name: 'Snacks', color: 'danger' },
    ],
    products: [
      p('arroz', 'Arroz 500 g', 'despensa', 3200, 40, { taxRateBps: 0, barcode: '7701001000011' }),
      p('aceite', 'Aceite 1 L', 'despensa', 12500, 12, {
        taxRateBps: 500,
        barcode: '7701001000028',
      }),
      p('azucar', 'Azúcar 1 kg', 'despensa', 4800, 3, {
        taxRateBps: 500,
        barcode: '7701001000035',
      }),
      p('huevos', 'Huevos AA x 12', 'despensa', 9800, 20, { taxRateBps: 0 }),
      p('leche', 'Leche entera 1 L', 'bebidas', 4500, 24, {
        taxRateBps: 0,
        barcode: '7701001000042',
      }),
      p('gaseosa', 'Gaseosa 1.5 L', 'bebidas', 5200, 2, { barcode: '7701001000059' }),
      p('agua', 'Agua 600 ml', 'bebidas', 2000, 48, { barcode: '7701001000066' }),
      p('jabon', 'Jabón de baño', 'aseo', 3500, 15),
      p('detergente', 'Detergente 1 kg', 'aseo', 11900, 0),
      p('papel', 'Papel higiénico x 4', 'aseo', 8900, 10),
      p('papas', 'Papas fritas 45 g', 'snacks', 2500, 30),
      p('chocolatina', 'Chocolatina', 'snacks', 1800, 4),
      p('bolsa', 'Bolsa plástica', 'snacks', 100, 0, { trackStock: false, taxRateBps: 0 }),
    ],
    customers: ['Marta Lucía Ospina', 'Jorge Restrepo', 'Ferretería El Tornillo'],
    modules: { restaurant: false, customers: true },
    // Premium: reportes, I.A., roles, 3 cupos (2 ocupados: Carlos y Ana).
    plan: 'premium',
    status: 'active',
  },
  {
    id: 'cafe-esquina',
    name: 'Café La Esquina',
    type: 'cafe',
    members: [
      { uid: 'ana', role: 'admin' },
      { uid: 'luis', role: 'employee' },
    ],
    categories: [
      { id: 'cafes', name: 'Cafés', color: 'warning' },
      { id: 'frias', name: 'Bebidas frías', color: 'info' },
      { id: 'panaderia', name: 'Panadería', color: 'success' },
      { id: 'postres', name: 'Postres', color: 'danger' },
    ],
    products: [
      p('tinto', 'Tinto', 'cafes', 2000, 0, { trackStock: false, taxRateBps: 0 }),
      p('americano', 'Americano', 'cafes', 4500, 0, { trackStock: false, taxRateBps: 0 }),
      p('capuchino', 'Capuchino', 'cafes', 6500, 0, { trackStock: false, taxRateBps: 0 }),
      p('latte', 'Latte', 'cafes', 7000, 0, { trackStock: false, taxRateBps: 0 }),
      p('limonada', 'Limonada de coco', 'frias', 9500, 0, { trackStock: false }),
      p('frappe', 'Frappé de café', 'frias', 11000, 0, { trackStock: false }),
      p('jugo', 'Jugo natural', 'frias', 7500, 0, { trackStock: false }),
      p('croissant', 'Croissant', 'panaderia', 5500, 18, { lowStockThreshold: 6 }),
      p('pandebono', 'Pandebono', 'panaderia', 2500, 4, { lowStockThreshold: 10 }),
      p('almojabana', 'Almojábana', 'panaderia', 2800, 25),
      p('brownie', 'Brownie', 'postres', 6000, 8, { lowStockThreshold: 3 }),
      p('cheesecake', 'Cheesecake', 'postres', 12000, 2, { lowStockThreshold: 3 }),
    ],
    customers: ['Valentina Cárdenas', 'Andrés Mejía'],
    modules: { restaurant: true, customers: true },
    // Gratis: 1 cupo (Luis), sin reportes ni roles personalizados.
    plan: 'free',
    status: 'active',
  },
];

/** Invitación pendiente para probar el flujo de aceptación. */
export const INVITATION = {
  businessId: 'tienda-rosa',
  email: 'invitado@superpos.test',
  role: 'employee' as Role,
};

/** PRNG determinista (mulberry32) para que el seed siempre genere los mismos datos. */
export function createRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface SeedSale {
  id: string;
  number: string;
  occurredAt: Date;
  createdBy: string;
  lines: {
    productId: string;
    name: string;
    unitPriceMinor: number;
    quantity: number;
    taxRateBps: number;
    discountMinor: number;
    voided: boolean;
  }[];
  subtotalMinor: number;
  taxMinor: number;
  discountMinor: number;
  totalMinor: number;
  method: 'cash' | 'card' | 'transfer';
}

/** Ventas de ejemplo de los últimos `days` días, con totales calculados por el dominio. */
export function buildSales(
  business: SeedBusiness,
  now: Date,
  days: number,
  perDay: number,
): SeedSale[] {
  const random = createRandom(business.id.length * 7919);
  const pick = <T>(items: readonly T[]): T => items[Math.floor(random() * items.length)] as T;
  const sellers = business.members.map((member) => member.uid);
  const sales: SeedSale[] = [];
  let sequence = 0;

  for (let day = days - 1; day >= 0; day -= 1) {
    const count = Math.max(1, Math.round(perDay * (0.5 + random())));
    for (let i = 0; i < count; i += 1) {
      sequence += 1;
      const occurredAt = new Date(
        now.getTime() - day * 86_400_000 - Math.floor(random() * 10 * 3_600_000),
      );
      const lines = Array.from({ length: 1 + Math.floor(random() * 3) }, () => {
        const product = pick(business.products);
        return {
          productId: product.id,
          name: product.name,
          unitPriceMinor: product.priceMinor,
          quantity: 1 + Math.floor(random() * 3),
          taxRateBps: product.taxRateBps,
          discountMinor: 0,
          voided: false,
        };
      });
      const totals = calculateTotals(
        lines.map((line) => ({
          ...line,
          unitPrice: money(line.unitPriceMinor),
          discount: money(0),
        })),
        { pricesIncludeTax: true },
      );
      sales.push({
        id: `${business.id}-sale-${sequence}`,
        number: `SEED-${String(sequence).padStart(6, '0')}`,
        occurredAt,
        createdBy: pick(sellers),
        lines,
        subtotalMinor: totals.subtotal,
        taxMinor: totals.taxTotal,
        discountMinor: totals.discountTotal,
        totalMinor: totals.total,
        method: pick(['cash', 'cash', 'card', 'transfer'] as const),
      });
    }
  }
  return sales;
}
