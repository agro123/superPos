import {
  CURRENCY_MINOR_UNITS,
  fromMajorUnits,
  type CurrencyCode,
  type Money,
} from '@/shared/domain/money';
import { productInputSchema, type ValidProductInput } from './product';

/** Columnas de la plantilla (en este orden). Solo `nombre` y `precio` son obligatorias. */
export const IMPORT_COLUMNS = [
  'nombre',
  'precio',
  'costo',
  'categoria',
  'sku',
  'codigo_barras',
  'impuesto_porcentaje',
  'controla_stock',
  'stock_inicial',
  'alerta_stock',
  'activo',
] as const;
type Column = (typeof IMPORT_COLUMNS)[number];

/** Filas de ejemplo de la plantilla. */
export const IMPORT_EXAMPLES: readonly (string | number)[][] = [
  ['Arroz 500 g', 3200, 2500, 'Despensa', 'ARR-500', '7701001000011', 0, 'si', 40, 5, 'si'],
  ['Tinto', 2000, '', 'Cafés', '', '', 0, 'no', '', '', 'si'],
];

export interface ImportCandidate {
  /** Fila del archivo (1 = encabezado), para mensajes. */
  row: number;
  input: ValidProductInput;
  /** Nombre de categoría tal como viene (se crea si no existe). */
  categoryName: string | null;
}

export interface ImportIssue {
  row: number;
  name: string;
  message: string;
}

export interface ImportPlan {
  toCreate: ImportCandidate[];
  duplicates: ImportIssue[];
  errors: ImportIssue[];
  /** Categorías que no existen y se crearán. */
  newCategories: string[];
}

const key = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

/** Número en formato local ("3.200", "3200,50", "$ 1.500") a número; `null` si vacío o inválido. */
export function parseLocalNumber(raw: string, decimals: number): number | null {
  const text = raw.replace(/[^\d.,-]/g, '');
  if (!text) return null;
  let normalized = text;
  if (decimals === 0) normalized = text.replace(/[.,]/g, '');
  else {
    const last = Math.max(text.lastIndexOf('.'), text.lastIndexOf(','));
    const decimalsPart = last >= 0 ? text.slice(last + 1) : '';
    // Un separador seguido de 3 dígitos es de miles ("3.200"), salvo que sea el único decimal posible.
    normalized =
      last >= 0 && decimalsPart.length !== 3
        ? `${text.slice(0, last).replace(/[.,]/g, '')}.${decimalsPart}`
        : text.replace(/[.,]/g, '');
  }
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

const parseBool = (raw: string, fallback: boolean) => {
  const value = key(raw);
  if (['si', 'sí', 'true', '1', 'x', 'yes'].includes(value)) return true;
  if (['no', 'false', '0'].includes(value)) return false;
  return fallback;
};

export interface ExistingProduct {
  name: string;
  sku: string | null;
  barcode: string | null;
}

/**
 * Convierte las filas del archivo en productos a crear. Un producto ya existe (y se omite) si
 * coincide el código de barras, el SKU o el nombre (sin tildes ni mayúsculas) con uno del catálogo
 * o con una fila anterior del mismo archivo.
 */
export function planProductImport(
  rows: readonly (readonly string[])[],
  options: {
    currency: CurrencyCode;
    existing: readonly ExistingProduct[];
    categories: readonly { name: string }[];
  },
): ImportPlan {
  const [header = [], ...body] = rows;
  const index = new Map(header.map((title, i) => [key(title).replace(/ /g, '_'), i]));
  const cell = (row: readonly string[], column: Column) => {
    const i = index.get(column);
    return i === undefined ? '' : (row[i] ?? '').trim();
  };
  const decimals = CURRENCY_MINOR_UNITS[options.currency];
  const money = (raw: string): Money | null => {
    const value = parseLocalNumber(raw, decimals);
    return value === null || value < 0 ? null : fromMajorUnits(value, options.currency);
  };
  const seen = { names: new Set<string>(), skus: new Set<string>(), barcodes: new Set<string>() };
  for (const p of options.existing) {
    seen.names.add(key(p.name));
    if (p.sku) seen.skus.add(key(p.sku));
    if (p.barcode) seen.barcodes.add(p.barcode.trim());
  }
  const knownCategories = new Set(options.categories.map((c) => key(c.name)));
  const plan: ImportPlan = { toCreate: [], duplicates: [], errors: [], newCategories: [] };

  if (!index.has('nombre') || !index.has('precio')) {
    plan.errors.push({ row: 1, name: '', message: 'missingColumns' });
    return plan;
  }
  body.forEach((row, i) => {
    const rowNumber = i + 2;
    const name = cell(row, 'nombre');
    const sku = cell(row, 'sku') || null;
    const barcode = cell(row, 'codigo_barras') || null;
    if (
      seen.barcodes.has(barcode ?? '\0') ||
      seen.skus.has(key(sku ?? '\0')) ||
      seen.names.has(key(name))
    ) {
      plan.duplicates.push({ row: rowNumber, name, message: 'duplicate' });
      return;
    }
    const price = money(cell(row, 'precio'));
    const taxPercent = parseLocalNumber(cell(row, 'impuesto_porcentaje'), 2) ?? 0;
    const stock = parseLocalNumber(cell(row, 'stock_inicial'), 3);
    const parsed = productInputSchema.safeParse({
      name,
      sku,
      barcode,
      categoryId: null,
      priceMinor: price ?? Number.NaN,
      costMinor: cell(row, 'costo') ? (money(cell(row, 'costo')) ?? Number.NaN) : null,
      taxRateBps: Math.round(taxPercent * 100),
      trackStock: parseBool(cell(row, 'controla_stock'), stock !== null),
      lowStockThreshold: parseLocalNumber(cell(row, 'alerta_stock'), 3) ?? 0,
      active: parseBool(cell(row, 'activo'), true),
      initialStock: stock ?? 0,
    });
    if (!parsed.success) {
      const field = parsed.error.issues[0]?.path[0];
      plan.errors.push({
        row: rowNumber,
        name,
        message: typeof field === 'string' ? field : 'invalid',
      });
      return;
    }
    const categoryName = cell(row, 'categoria') || null;
    if (categoryName && !knownCategories.has(key(categoryName))) {
      knownCategories.add(key(categoryName));
      plan.newCategories.push(categoryName);
    }
    seen.names.add(key(name));
    if (sku) seen.skus.add(key(sku));
    if (barcode) seen.barcodes.add(barcode);
    plan.toCreate.push({ row: rowNumber, input: parsed.data, categoryName });
  });
  return plan;
}
