/**
 * Recetas de clases reutilizadas por varios átomos. Son tokens compuestos:
 * viven aquí para que ningún átomo tenga que importar otro átomo.
 */
export const inputClasses =
  'min-h-touch w-full rounded-md border border-border-strong bg-surface px-3 text-base text-text placeholder:text-text-subtle transition-colors duration-(--sp-duration-fast) focus-visible:border-primary disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-70 aria-invalid:border-danger';

export const popoverClasses =
  'z-(--sp-z-dropdown) min-w-(--radix-popper-anchor-width) overflow-hidden rounded-md border border-border bg-surface p-1 text-text shadow-md';

export const menuItemClasses =
  'flex min-h-touch cursor-default items-center gap-2 rounded-sm px-3 text-base outline-none select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:bg-surface-muted';
