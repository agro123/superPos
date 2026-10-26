import { useId, type ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { t } from '@/shared/lib/i18n';

/** Props que `FormField` entrega al control para enlazar label, ayuda y error. */
export interface FormFieldControlProps {
  id: string;
  'aria-describedby': string | undefined;
  invalid: boolean;
}

export interface FormFieldProps {
  label: string;
  /** Texto de ayuda bajo el campo. */
  hint?: string;
  /** Mensaje de error de validación; activa `aria-invalid` en el control. */
  error?: string | undefined;
  /** Muestra "(Opcional)" junto al label. */
  optional?: boolean;
  id?: string;
  className?: string;
  /** Render prop: recibe `id`, `aria-describedby` e `invalid` para el control. */
  children: (control: FormFieldControlProps) => ReactNode;
}

/** Label + control + ayuda + error, con las relaciones ARIA correctas. */
export function FormField({
  label,
  hint,
  error,
  optional = false,
  id,
  className,
  children,
}: FormFieldProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={controlId} className="text-sm font-medium text-text">
        {label}
        {optional ? (
          <span className="ml-1 font-normal text-text-subtle">({t('ui.optional')})</span>
        ) : null}
      </label>
      {children({ id: controlId, 'aria-describedby': describedBy, invalid: Boolean(error) })}
      {hint ? (
        <p id={hintId} className="text-xs text-text-subtle">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
