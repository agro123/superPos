import { ImageOff } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { Badge, type BadgeTone } from '../../atoms/Badge';
import { Skeleton } from '../../atoms/Skeleton';

export interface ProductGridItem {
  id: string;
  name: string;
  priceLabel: string;
  imageUrl?: string | null;
  badge?: { label: string; tone: BadgeTone };
  disabled?: boolean;
}

export interface ProductGridProps {
  /** Nombre accesible de la grilla. */
  label: string;
  items: readonly ProductGridItem[];
  onSelect: (id: string) => void;
  loading?: boolean;
  emptyState?: ReactNode;
  className?: string;
}

/** Grilla táctil de productos: un toque agrega al carrito. */
export function ProductGrid({
  label,
  items,
  onSelect,
  loading = false,
  emptyState,
  className,
}: ProductGridProps) {
  if (loading) {
    return (
      <div className={cn('grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-3', className)}>
        {Array.from({ length: 8 }, (_, index) => (
          <Skeleton key={index} className="h-36" />
        ))}
      </div>
    );
  }
  if (items.length === 0) return <>{emptyState}</>;
  return (
    <ul
      aria-label={label}
      className={cn('grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-3', className)}
    >
      {items.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            disabled={item.disabled}
            onClick={() => {
              onSelect(item.id);
            }}
            className="flex h-full w-full flex-col overflow-hidden rounded-lg border border-border bg-surface text-left shadow-sm transition-[transform,box-shadow] duration-(--sp-duration-fast) hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
          >
            <span className="flex aspect-[4/3] w-full items-center justify-center bg-surface-muted text-text-subtle">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt="" loading="lazy" className="size-full object-cover" />
              ) : (
                <ImageOff aria-hidden className="size-6" />
              )}
            </span>
            <span className="flex flex-1 flex-col gap-1 p-3">
              <span className="line-clamp-2 text-sm font-medium text-text">{item.name}</span>
              <span className="mt-auto flex items-center justify-between gap-1">
                <span className="text-base font-semibold text-text tabular-nums">
                  {item.priceLabel}
                </span>
                {item.badge ? <Badge tone={item.badge.tone}>{item.badge.label}</Badge> : null}
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
