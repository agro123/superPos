/** API pública de la feature catalog (productos y categorías). */
export {
  catalogWrites,
  registerCatalogOutboxHandlers,
  useCategories,
  useProducts,
} from './application/useCatalog';
export { sortCategories, type Category } from './domain/category';
export { findByBarcode, type Product } from './domain/product';
export { stockLevelOf, type StockLevel } from './domain/stockLevel';
export { ProductImportPanel } from './ui/ProductImportPanel';

export const catalogPages = {
  catalog: () => import('./pages/CatalogPage'),
};
