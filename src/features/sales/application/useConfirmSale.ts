import type { CurrencyCode } from '@/shared/domain/money';
import type { Tender } from '@/shared/domain/payment';
import { useToast } from '@/shared/hooks/useToast';
import { formatMoney } from '@/shared/lib/formatters';
import { t } from '@/shared/lib/i18n';
import type { CartView } from './useCart';
import type { useCheckout } from './useCheckout';
import { useCartStore } from './cartStore';

interface ConfirmSaleOptions {
  checkout: ReturnType<typeof useCheckout>;
  cart: CartView;
  businessId: string;
  currency: CurrencyCode;
  online: boolean;
}

/** Registra la venta de la orden activa, avisa (vuelto, fiado, offline) y cierra la orden. */
export function useConfirmSale({
  checkout,
  cart,
  businessId,
  currency,
  online,
}: ConfirmSaleOptions) {
  const toast = useToast();
  const closeOrder = useCartStore((state) => state.closeOrder);
  return (tenders: Tender[]): boolean => {
    const result = checkout(cart.lines, cart.totals, tenders, cart.customerId);
    if (!result.ok) {
      toast({ title: t('errors.validation'), description: result.error.message, tone: 'danger' });
      return false;
    }
    const sale = result.value;
    const notes = [
      sale.changeMinor > 0
        ? t('pos.changeDue', { amount: formatMoney(sale.changeMinor, currency) })
        : null,
      sale.creditMinor > 0
        ? t('pos.creditDue', { amount: formatMoney(sale.creditMinor, currency) })
        : null,
      online ? null : t('common.savedOffline'),
    ].filter((note) => note !== null);
    toast({
      title: t('pos.recorded', { number: sale.number }),
      description: notes.length > 0 ? notes.join(' · ') : undefined,
      tone: 'success',
    });
    closeOrder(businessId, cart.activeOrderId);
    return true;
  };
}
