import { AlertTriangle, UserRound } from 'lucide-react';
import { t } from '@/shared/lib/i18n';
import { Button } from '@/shared/ui';

export interface CartCustomerProps {
  /** Nombre del cliente de la orden, o `null` (consumidor final). */
  name: string | null;
  /** Saldo fiado ya formateado si el cliente debe. */
  debtLabel: string | null;
  onPick: () => void;
}

/** Cliente de la orden en el carrito, con aviso de saldo pendiente para el cajero. */
export function CartCustomer({ name, debtLabel, onPick }: CartCustomerProps) {
  return (
    <div className="flex flex-col gap-2 py-2">
      <Button
        variant="outline"
        size="sm"
        leftIcon={<UserRound aria-hidden className="size-4" />}
        onClick={onPick}
        className="self-start"
      >
        {name ? t('pos.customer.label', { name }) : t('pos.customer.add')}
      </Button>
      {name && debtLabel ? (
        <p
          role="status"
          className="flex items-start gap-2 rounded-md bg-danger-soft p-2 text-sm text-danger-soft-fg"
        >
          <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span>
            {t('pos.customer.debt', { name, amount: debtLabel })}
            <br />
            {t('pos.customer.debtHint')}
          </span>
        </p>
      ) : null}
    </div>
  );
}
