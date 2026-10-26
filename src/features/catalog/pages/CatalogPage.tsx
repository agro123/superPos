import { t } from '@/shared/lib/i18n';
import { PageHeader, Tabs } from '@/shared/ui';
import { CategoriesTab } from '../ui/CategoriesTab';
import { ProductsTab } from '../ui/ProductsTab';

export default function CatalogPage() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <PageHeader title={t('catalog.title')} description={t('catalog.description')} />
      <Tabs
        label={t('catalog.tabs')}
        items={[
          { value: 'products', label: t('catalog.products'), content: <ProductsTab /> },
          { value: 'categories', label: t('catalog.categories'), content: <CategoriesTab /> },
        ]}
      />
    </div>
  );
}
