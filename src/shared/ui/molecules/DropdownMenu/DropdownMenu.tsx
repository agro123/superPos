import { DropdownMenu as RadixDropdownMenu } from 'radix-ui';
import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { menuItemClasses, popoverClasses } from '../../tokens/recipes';

export interface DropdownMenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  tone?: 'default' | 'danger';
  disabled?: boolean;
}

export interface DropdownMenuProps {
  /** Elemento enfocable que abre el menú (p. ej. un `IconButton`). */
  trigger: ReactNode;
  items: readonly DropdownMenuItem[];
  /** Encabezado opcional del menú (p. ej. el email del usuario). */
  heading?: ReactNode;
  align?: 'start' | 'center' | 'end';
}

/** Menú de acciones accesible (Radix): flechas, Enter y Escape. */
export function DropdownMenu({ trigger, items, heading, align = 'end' }: DropdownMenuProps) {
  return (
    <RadixDropdownMenu.Root>
      <RadixDropdownMenu.Trigger asChild>{trigger}</RadixDropdownMenu.Trigger>
      <RadixDropdownMenu.Portal>
        <RadixDropdownMenu.Content
          align={align}
          sideOffset={6}
          className={cn(popoverClasses, 'min-w-56')}
        >
          {heading ? (
            <>
              <RadixDropdownMenu.Label className="px-3 py-2 text-xs text-text-subtle">
                {heading}
              </RadixDropdownMenu.Label>
              <RadixDropdownMenu.Separator className="my-1 h-px bg-border" />
            </>
          ) : null}
          {items.map((item) => (
            <RadixDropdownMenu.Item
              key={item.id}
              disabled={item.disabled}
              onSelect={item.onSelect}
              className={cn(
                menuItemClasses,
                item.tone === 'danger' && 'text-danger',
                '[&_svg]:size-4',
              )}
            >
              {item.icon}
              {item.label}
            </RadixDropdownMenu.Item>
          ))}
        </RadixDropdownMenu.Content>
      </RadixDropdownMenu.Portal>
    </RadixDropdownMenu.Root>
  );
}
