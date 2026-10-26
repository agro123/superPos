import { cn } from '@/shared/lib/cn';
import { t } from '@/shared/lib/i18n';

export interface CategoryChipsProps {
  categories: readonly { id: string; name: string }[];
  selected: string | null;
  onSelect: (categoryId: string | null) => void;
}

/** Filtro de categorías del POS (botones conmutables, desplazables en horizontal). */
export function CategoryChips({ categories, selected, onSelect }: CategoryChipsProps) {
  const chip = (id: string | null, label: string) => (
    <li key={id ?? 'all'}>
      <button
        type="button"
        aria-pressed={selected === id}
        onClick={() => {
          onSelect(id);
        }}
        className={cn(
          'min-h-touch rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-colors',
          selected === id
            ? 'border-primary bg-primary text-primary-fg'
            : 'border-border bg-surface text-text hover:bg-surface-muted',
        )}
      >
        {label}
      </button>
    </li>
  );
  return (
    <ul aria-label={t('pos.categories')} className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {chip(null, t('pos.allCategories'))}
      {categories.map((category) => chip(category.id, category.name))}
    </ul>
  );
}
