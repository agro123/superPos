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
    <li key={id ?? 'all'} className="shrink-0 snap-start">
      <button
        type="button"
        aria-pressed={selected === id}
        onClick={() => {
          onSelect(id);
        }}
        className={cn(
          'inline-flex min-h-touch max-w-48 items-center rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-colors',
          selected === id
            ? 'border-primary bg-primary text-primary-fg'
            : 'border-border bg-surface text-text hover:bg-surface-muted',
        )}
      >
        <span className="truncate">{label}</span>
      </button>
    </li>
  );
  return (
    <ul
      aria-label={t('pos.categories')}
      className="-mx-4 flex shrink-0 snap-x [scrollbar-width:none] gap-2 overflow-x-auto px-4 pb-1 [&::-webkit-scrollbar]:hidden"
    >
      {chip(null, t('pos.allCategories'))}
      {categories.map((category) => chip(category.id, category.name))}
    </ul>
  );
}
