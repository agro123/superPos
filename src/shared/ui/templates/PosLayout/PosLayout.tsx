import { ShoppingCart } from 'lucide-react';
import type { ReactNode } from 'react';
import { t } from '@/shared/lib/i18n';
import { Button } from '../../atoms/Button';
import { Drawer } from '../../organisms/Drawer';

export interface PosLayoutProps {
  /** Búsqueda, categorías y grilla de productos. */
  catalog: ReactNode;
  /** Carrito (normalmente `<CartPanel />`). */
  cart: ReactNode;
  /** Resumen del carrito para el botón inferior en móvil ("3 artículos · $ 12.000"). */
  cartSummary: string;
  cartOpen: boolean;
  onCartOpenChange: (open: boolean) => void;
}

/**
 * Pantalla de venta: catálogo + carrito lateral en tablet/escritorio, carrito en hoja inferior en móvil.
 * Bajo `lg` reserva 4rem para la barra de pestañas inferior del `AppShell`.
 */
export function PosLayout({
  catalog,
  cart,
  cartSummary,
  cartOpen,
  onCartOpenChange,
}: PosLayoutProps) {
  return (
    <div className="flex h-[calc(100dvh-8rem)] min-h-0 lg:h-[calc(100dvh-4rem)]">
      <div className="flex min-w-0 flex-1 flex-col gap-4 overflow-y-auto p-4 pb-24 md:pb-4">
        {catalog}
      </div>
      <aside className="hidden w-96 shrink-0 border-l border-border md:block">{cart}</aside>
      <div className="fixed inset-x-0 bottom-16 z-(--sp-z-sticky) border-t border-border bg-surface p-3 md:hidden">
        <Button
          size="lg"
          fullWidth
          leftIcon={<ShoppingCart aria-hidden className="size-5" />}
          onClick={() => {
            onCartOpenChange(true);
          }}
        >
          {t('ui.cart.view')} · {cartSummary}
        </Button>
      </div>
      <Drawer
        open={cartOpen}
        onOpenChange={onCartOpenChange}
        title={t('ui.cart.title')}
        side="bottom"
        hideHeader
      >
        {cart}
      </Drawer>
    </div>
  );
}
