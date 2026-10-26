import { Tabs as RadixTabs } from 'radix-ui';
import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

export interface TabItem {
  value: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  items: readonly TabItem[];
  /** Nombre accesible de la lista de pestañas. */
  label: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

/** Pestañas accesibles (flechas para moverse, Tab para entrar al panel). */
export function Tabs({ items, label, value, defaultValue, onValueChange, className }: TabsProps) {
  return (
    <RadixTabs.Root
      value={value}
      defaultValue={defaultValue ?? items[0]?.value}
      onValueChange={onValueChange}
      className={cn('flex flex-col gap-4', className)}
    >
      <RadixTabs.List
        aria-label={label}
        className="flex gap-1 overflow-x-auto overflow-y-hidden border-b border-border"
      >
        {items.map((item) => (
          <RadixTabs.Trigger
            key={item.value}
            value={item.value}
            disabled={item.disabled}
            className="min-h-touch border-b-2 border-transparent px-4 text-sm font-medium whitespace-nowrap text-text-muted hover:text-text disabled:opacity-50 data-[state=active]:border-primary data-[state=active]:text-primary"
          >
            {item.label}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
      {items.map((item) => (
        <RadixTabs.Content key={item.value} value={item.value}>
          {item.content}
        </RadixTabs.Content>
      ))}
    </RadixTabs.Root>
  );
}
