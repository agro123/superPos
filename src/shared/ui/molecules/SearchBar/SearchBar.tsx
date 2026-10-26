import { Search, X } from 'lucide-react';
import type { KeyboardEvent, Ref } from 'react';
import { cn } from '@/shared/lib/cn';
import { t } from '@/shared/lib/i18n';
import { IconButton } from '../../atoms/IconButton';
import { Input } from '../../atoms/Input';
import { Kbd } from '../../atoms/Kbd';

export interface SearchBarProps {
  value: string;
  onValueChange: (value: string) => void;
  /** Se llama con Enter (p. ej. para agregar por código de barras). */
  onSubmit?: (value: string) => void;
  /** Nombre accesible del campo. */
  label?: string;
  placeholder?: string;
  /** Atajo de teclado que se muestra como pista ("F2"). */
  shortcut?: string;
  className?: string;
  ref?: Ref<HTMLInputElement>;
}

/** Campo de búsqueda con botón para limpiar y pista de atajo. */
export function SearchBar({
  value,
  onValueChange,
  onSubmit,
  label = t('ui.search'),
  placeholder = t('ui.searchPlaceholder'),
  shortcut,
  className,
  ref,
}: SearchBarProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') onSubmit?.(value);
    if (event.key === 'Escape' && value) onValueChange('');
  };

  return (
    <div role="search" className={cn('relative flex items-center', className)}>
      <Search aria-hidden className="pointer-events-none absolute left-3 size-5 text-text-subtle" />
      <Input
        ref={ref}
        type="search"
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={(event) => {
          onValueChange(event.target.value);
        }}
        onKeyDown={handleKeyDown}
        className="pr-12 pl-10 [&::-webkit-search-cancel-button]:hidden"
      />
      <div className="absolute right-1 flex items-center">
        {value ? (
          <IconButton
            label={t('ui.clearSearch')}
            icon={<X />}
            onClick={() => {
              onValueChange('');
            }}
          />
        ) : shortcut ? (
          <Kbd className="mr-2 hidden md:inline-flex">{shortcut}</Kbd>
        ) : null}
      </div>
    </div>
  );
}
