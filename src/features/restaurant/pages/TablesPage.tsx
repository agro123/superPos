import { UtensilsCrossed } from 'lucide-react';
import { t } from '@/shared/lib/i18n';
import { EmptyState, PageHeader } from '@/shared/ui';

/** Marcador del módulo restaurante: la ruta solo existe si el módulo está activo. */
export default function TablesPage() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <PageHeader title={t('restaurant.title')} description={t('restaurant.description')} />
      <EmptyState
        icon={<UtensilsCrossed />}
        title={t('restaurant.placeholder')}
        description={t('restaurant.placeholderHint')}
      />
    </div>
  );
}
