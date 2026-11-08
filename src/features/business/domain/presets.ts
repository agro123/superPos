import type { PaymentMethod } from '@/shared/domain/payment';
import type { BusinessType } from './business';
import type { ModuleId } from './settings';

export type PresetColor = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export interface PresetCategory {
  name: string;
  color: PresetColor;
}

export interface PresetProduct {
  name: string;
  /** Precio sugerido en unidades mayores (pesos); editable antes de crear. */
  price: number;
  /** Nombre de una categoría del mismo preset. */
  category: string;
  trackStock: boolean;
  stock: number;
}

/** Configuración sugerida según el tipo de negocio (todo editable en el asistente). */
export const PRESET_TIPS = [
  'storeCredit',
  'storeBarcode',
  'cafeUntracked',
  'cafeOrders',
  'restaurantTables',
  'restaurantWaiters',
  'otherImport',
] as const;
export type PresetTip = (typeof PRESET_TIPS)[number];

export interface BusinessPreset {
  categories: readonly PresetCategory[];
  sampleProducts: readonly PresetProduct[];
  modules: Readonly<Record<ModuleId, boolean>>;
  paymentMethods: readonly PaymentMethod[];
  taxes: { pricesIncludeTax: boolean; defaultRateBps: number };
  /** Claves de las plantillas de roles (`users`) que conviene crear. */
  rolePresets: readonly ('cashier' | 'stock' | 'waiter' | 'supervisor')[];
  /** Base de efectivo sugerida para abrir caja (unidades mayores). */
  suggestedFloat: number;
  /** Consejos propios del tipo (texto en `setup.tip.<clave>`). */
  tips: readonly PresetTip[];
}

const COMMON_PAYMENTS: readonly PaymentMethod[] = ['cash', 'card', 'transfer', 'wallet'];

export const BUSINESS_PRESETS: Readonly<Record<BusinessType, BusinessPreset>> = {
  store: {
    categories: [
      { name: 'Despensa', color: 'warning' },
      { name: 'Bebidas', color: 'info' },
      { name: 'Lácteos', color: 'primary' },
      { name: 'Aseo', color: 'success' },
      { name: 'Snacks', color: 'danger' },
    ],
    sampleProducts: [
      { name: 'Arroz 500 g', price: 3200, category: 'Despensa', trackStock: true, stock: 24 },
      { name: 'Aceite 1 L', price: 12500, category: 'Despensa', trackStock: true, stock: 12 },
      { name: 'Gaseosa 1.5 L', price: 5200, category: 'Bebidas', trackStock: true, stock: 12 },
      { name: 'Agua 600 ml', price: 2000, category: 'Bebidas', trackStock: true, stock: 24 },
      { name: 'Leche entera 1 L', price: 4500, category: 'Lácteos', trackStock: true, stock: 12 },
      { name: 'Jabón de baño', price: 3500, category: 'Aseo', trackStock: true, stock: 10 },
      { name: 'Papas fritas', price: 2500, category: 'Snacks', trackStock: true, stock: 20 },
    ],
    modules: { customers: true, restaurant: false },
    paymentMethods: COMMON_PAYMENTS,
    taxes: { pricesIncludeTax: true, defaultRateBps: 1900 },
    rolePresets: ['cashier', 'stock'],
    suggestedFloat: 100000,
    tips: ['storeCredit', 'storeBarcode'],
  },
  cafe: {
    categories: [
      { name: 'Cafés', color: 'warning' },
      { name: 'Bebidas frías', color: 'info' },
      { name: 'Panadería', color: 'primary' },
      { name: 'Postres', color: 'danger' },
    ],
    sampleProducts: [
      { name: 'Tinto', price: 2000, category: 'Cafés', trackStock: false, stock: 0 },
      { name: 'Capuchino', price: 6500, category: 'Cafés', trackStock: false, stock: 0 },
      { name: 'Latte', price: 7000, category: 'Cafés', trackStock: false, stock: 0 },
      { name: 'Jugo natural', price: 7500, category: 'Bebidas frías', trackStock: false, stock: 0 },
      { name: 'Croissant', price: 5500, category: 'Panadería', trackStock: true, stock: 12 },
      { name: 'Porción de torta', price: 8000, category: 'Postres', trackStock: true, stock: 8 },
    ],
    modules: { customers: true, restaurant: false },
    paymentMethods: COMMON_PAYMENTS,
    taxes: { pricesIncludeTax: true, defaultRateBps: 800 },
    rolePresets: ['cashier', 'waiter'],
    suggestedFloat: 80000,
    tips: ['cafeUntracked', 'cafeOrders'],
  },
  restaurant: {
    categories: [
      { name: 'Entradas', color: 'success' },
      { name: 'Platos fuertes', color: 'danger' },
      { name: 'Bebidas', color: 'info' },
      { name: 'Postres', color: 'warning' },
    ],
    sampleProducts: [
      { name: 'Empanadas (3)', price: 6000, category: 'Entradas', trackStock: false, stock: 0 },
      {
        name: 'Bandeja paisa',
        price: 28000,
        category: 'Platos fuertes',
        trackStock: false,
        stock: 0,
      },
      {
        name: 'Almuerzo del día',
        price: 16000,
        category: 'Platos fuertes',
        trackStock: false,
        stock: 0,
      },
      { name: 'Limonada', price: 6000, category: 'Bebidas', trackStock: false, stock: 0 },
      { name: 'Gaseosa personal', price: 4000, category: 'Bebidas', trackStock: true, stock: 24 },
      { name: 'Flan de caramelo', price: 7000, category: 'Postres', trackStock: true, stock: 10 },
    ],
    modules: { customers: true, restaurant: true },
    paymentMethods: COMMON_PAYMENTS,
    // Impoconsumo del 8 % en restaurantes.
    taxes: { pricesIncludeTax: true, defaultRateBps: 800 },
    rolePresets: ['cashier', 'waiter', 'supervisor'],
    suggestedFloat: 150000,
    tips: ['restaurantTables', 'restaurantWaiters'],
  },
  other: {
    categories: [
      { name: 'Productos', color: 'primary' },
      { name: 'Servicios', color: 'info' },
    ],
    sampleProducts: [
      {
        name: 'Producto de ejemplo',
        price: 10000,
        category: 'Productos',
        trackStock: true,
        stock: 10,
      },
      {
        name: 'Servicio de ejemplo',
        price: 20000,
        category: 'Servicios',
        trackStock: false,
        stock: 0,
      },
    ],
    modules: { customers: true, restaurant: false },
    paymentMethods: ['cash', 'card', 'transfer'],
    taxes: { pricesIncludeTax: true, defaultRateBps: 1900 },
    rolePresets: ['cashier'],
    suggestedFloat: 100000,
    tips: ['otherImport'],
  },
};

export const presetFor = (type: BusinessType): BusinessPreset => BUSINESS_PRESETS[type];
