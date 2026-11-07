import { MonitorSmartphone, Wallet } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useCurrentUser } from '@/features/auth';
import { useActiveBusiness } from '@/features/business';
import { useCurrentShift } from '@/features/cash';
import { useWorkerSession } from '@/features/terminals';
import { useCurrentMember } from '@/features/users';
import { findByBarcode, useCategories, useProducts, type Product } from '@/features/catalog';
import { useBarcodeScanner } from '@/shared/hooks/useBarcodeScanner';
import { useHotkey } from '@/shared/hooks/useHotkey';
import { useOnlineStatus } from '@/shared/hooks/useSyncSummary';
import { useToast } from '@/shared/hooks/useToast';
import { formatMoney, formatNumber } from '@/shared/lib/formatters';
import { plural, t } from '@/shared/lib/i18n';
import { Button, EmptyState, PosLayout, Skeleton } from '@/shared/ui';
import { useCartStore } from '../application/cartStore';
import { useCart } from '../application/useCart';
import { useCheckout } from '../application/useCheckout';
import { remainingStock } from '../domain/cart';
import { saleStatusMachine, type SaleStatus } from '../domain/sale';
import { OrderTabs } from '../ui/OrderTabs';
import { PaymentPanel } from '../ui/PaymentPanel';
import { PosCart } from '../ui/PosCart';
import { PosCatalog } from '../ui/PosCatalog';

/** Punto de venta. Exige un turno de caja abierto en este dispositivo (ADR 0009). */
export default function PosPage() {
  const { business, taxes, paymentMethods } = useActiveBusiness();
  const products = useProducts(business.id);
  const categories = useCategories(business.id);
  const cart = useCart(business.id, taxes.pricesIncludeTax);
  const actions = useCartStore();
  const toast = useToast();
  const online = useOnlineStatus();
  const [cartOpen, setCartOpen] = useState(false);
  const [status, setStatus] = useState<SaleStatus>('draft');
  const user = useCurrentUser();
  const navigate = useNavigate();
  const current = useCurrentShift(business.id);
  const shift = current.shift?.status === 'open' ? current.shift : null;
  const member = useCurrentMember();
  const workerSession = useWorkerSession();
  // Las reglas rechazan ventas de empleados sin un terminal activo; aquí se avisa antes.
  const needsTerminal = member?.role !== 'admin' && !workerSession;
  const checkout = useCheckout({
    businessId: business.id,
    deviceCode: current.deviceCode,
    cashShiftId: shift?.id ?? '',
    terminalId: workerSession?.terminalId ?? null,
    uid: user.uid,
    tracksStock: (productId) => products.data?.find((p) => p.id === productId)?.trackStock ?? false,
  });

  /** Agrega si hay stock; devuelve `false` (con aviso) si el producto está agotado o al tope. */
  const add = (product: Product): boolean => {
    const cartProduct = {
      id: product.id,
      name: product.name,
      priceMinor: product.priceMinor,
      taxRateBps: product.taxRateBps,
      ...(product.trackStock ? { stock: Math.max(0, product.stock) } : {}),
    };
    if (remainingStock(cart.lines, cartProduct) <= 0) {
      toast({
        title:
          cartProduct.stock === 0
            ? t('pos.outOfStock', { name: product.name })
            : t('pos.stockLimit', {
                name: product.name,
                count: formatNumber(cartProduct.stock ?? 0),
              }),
        tone: 'warning',
      });
      return false;
    }
    actions.add(business.id, cartProduct);
    return true;
  };

  const addByCode = (code: string, candidates: readonly Product[]) => {
    const product =
      findByBarcode(products.data ?? [], code) ??
      (candidates.length === 1 ? candidates[0] : undefined);
    if (product) {
      if (!add(product)) return;
      toast({ title: t('pos.added', { name: product.name }), tone: 'success' });
    } else if (code.trim()) {
      toast({ title: t('pos.barcodeNotFound', { code: code.trim() }), tone: 'warning' });
    }
  };

  const goTo = (next: SaleStatus) => {
    if (saleStatusMachine.canTransition(status, next)) setStatus(next);
  };

  useBarcodeScanner((code) => {
    addByCode(code, []);
  });
  useHotkey('F9', () => {
    if (shift && cart.lines.length > 0) goTo('awaiting_payment');
  });

  if (needsTerminal) {
    return (
      <div className="p-4 md:p-6">
        <h1 className="sr-only">{t('pos.title')}</h1>
        <EmptyState
          icon={<MonitorSmartphone />}
          title={t('terminal.notTerminal')}
          description={t('terminal.notTerminalHint')}
          action={
            <Button onClick={() => void navigate('/terminal')}>{t('terminal.goToTerminal')}</Button>
          }
        />
      </div>
    );
  }
  if (current.loading) return <Skeleton className="m-4 h-64" />;
  if (!shift) {
    return (
      <div className="p-4 md:p-6">
        <h1 className="sr-only">{t('pos.title')}</h1>
        <EmptyState
          icon={<Wallet />}
          title={current.shift ? t('pos.shiftClosing') : t('pos.shiftRequired')}
          description={t('pos.shiftRequiredHint')}
          action={<Button onClick={() => void navigate('/cash')}>{t('pos.goToCash')}</Button>}
        />
      </div>
    );
  }

  const itemCount = formatNumber(cart.totals.itemCount);
  return (
    <>
      <h1 className="sr-only">{t('pos.title')}</h1>
      <PosLayout
        cartOpen={cartOpen}
        onCartOpenChange={setCartOpen}
        cartSummary={`${plural(cart.totals.itemCount, 'ui.cart.itemsOne', 'ui.cart.items', { count: itemCount })} · ${formatMoney(cart.totals.total, business.currency)}`}
        catalog={
          <PosCatalog
            products={products.data ?? []}
            categories={categories.data ?? []}
            loading={products.isPending}
            currency={business.currency}
            onAdd={(product) => {
              add(product);
            }}
            onSubmitSearch={addByCode}
          />
        }
        cart={
          <PosCart
            lines={cart.lines}
            totals={cart.totals}
            currency={business.currency}
            onQuantityChange={(productId, quantity) => {
              actions.setQuantity(business.id, productId, quantity);
            }}
            onRemove={(productId) => {
              actions.remove(business.id, productId);
            }}
            onClear={() => {
              actions.clear(business.id);
            }}
            onCheckout={() => {
              setCartOpen(false);
              goTo('awaiting_payment');
            }}
            header={
              <OrderTabs
                orders={cart.orders}
                activeId={cart.activeOrderId}
                onSelect={(orderId) => {
                  actions.selectOrder(business.id, orderId);
                }}
                onOpen={() => {
                  actions.openOrder(business.id);
                }}
                onClose={(orderId) => {
                  actions.closeOrder(business.id, orderId);
                }}
              />
            }
          />
        }
      />
      <PaymentPanel
        open={status === 'awaiting_payment'}
        onOpenChange={(open) => {
          if (!open) goTo('draft');
        }}
        total={cart.totals.total}
        currency={business.currency}
        methods={paymentMethods}
        online={online}
        onConfirm={(method, tendered) => {
          const result = checkout(cart.lines, cart.totals, [{ method, amount: tendered }]);
          if (!result.ok) {
            toast({ title: t('errors.validation'), tone: 'danger' });
            return;
          }
          const sale = result.value;
          toast({
            title: t('pos.recorded', { number: sale.number }),
            description:
              sale.changeMinor > 0
                ? t('pos.changeDue', { amount: formatMoney(sale.changeMinor, business.currency) })
                : online
                  ? undefined
                  : t('common.savedOffline'),
            tone: 'success',
          });
          actions.closeOrder(business.id, cart.activeOrderId);
          goTo('draft');
        }}
      />
    </>
  );
}
