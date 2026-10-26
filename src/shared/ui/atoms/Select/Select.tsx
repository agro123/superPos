import { Check, ChevronDown } from 'lucide-react';
import { Select as RadixSelect } from 'radix-ui';
import { cn } from '@/shared/lib/cn';
import { t } from '@/shared/lib/i18n';
import { inputClasses, menuItemClasses, popoverClasses } from '../../tokens/recipes';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  options: readonly SelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  /** Se asigna al disparador para asociarlo con un `<label htmlFor>`. */
  id?: string;
  name?: string;
  disabled?: boolean;
  invalid?: boolean;
  'aria-label'?: string;
  'aria-describedby'?: string;
  className?: string;
}

/** Lista desplegable accesible (Radix Select) para elegir una opción. */
export function Select({
  options,
  placeholder = t('ui.selectPlaceholder'),
  invalid = false,
  className,
  id,
  'aria-label': ariaLabel,
  'aria-describedby': describedBy,
  ...rootProps
}: SelectProps) {
  return (
    <RadixSelect.Root {...rootProps}>
      <RadixSelect.Trigger
        id={id}
        aria-label={ariaLabel}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        className={cn(inputClasses, 'flex items-center justify-between gap-2 text-left', className)}
      >
        <RadixSelect.Value placeholder={placeholder} />
        <RadixSelect.Icon>
          <ChevronDown aria-hidden className="size-4 text-text-subtle" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content position="popper" sideOffset={4} className={popoverClasses}>
          <RadixSelect.Viewport>
            {options.map((option) => (
              <RadixSelect.Item
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className={cn(menuItemClasses, 'justify-between')}
              >
                <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                <RadixSelect.ItemIndicator>
                  <Check aria-hidden className="size-4 text-primary" />
                </RadixSelect.ItemIndicator>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}
