import { Home, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import {
  AppSidebar,
  Button,
  CartPanel,
  DataTable,
  Drawer,
  Modal,
  Numpad,
  PageHeader,
  PaymentSheet,
  ProductGrid,
  TopBar,
  TourOverlay,
} from '@/shared/ui';
import { Specimen } from './Specimen';

const rows = Array.from({ length: 12 }, (_, i) => ({
  id: String(i),
  name: `Producto ${i + 1}`,
  stock: (i * 7) % 23,
}));

export function OrganismsSection() {
  const [numpad, setNumpad] = useState('');
  const [open, setOpen] = useState<'modal' | 'drawer' | 'payment' | null>(null);
  const [tour, setTour] = useState<number | null>(null);
  return (
    <>
      <Specimen name="TopBar / AppSidebar">
        <div className="w-full overflow-hidden rounded-md border border-border">
          <TopBar
            businessName="Café La Esquina"
            user={{ name: 'Ana Ríos', email: 'ana@superpos.test' }}
            sync={{ state: 'syncing', pendingCount: 2 }}
            userMenuItems={[]}
          />
          <div className="h-56 w-64 border-r border-border">
            <AppSidebar
              brand="Café La Esquina"
              sections={[
                {
                  id: 'a',
                  items: [
                    { to: '/', label: 'Inicio', icon: <Home />, end: true },
                    { to: '/pos', label: 'Vender', icon: <ShoppingCart /> },
                  ],
                },
              ]}
            />
          </div>
        </div>
      </Specimen>
      <Specimen name="TourOverlay">
        <div className="flex gap-2">
          <Button
            data-tour="demo-tour"
            onClick={() => {
              setTour(0);
            }}
          >
            Iniciar tour
          </Button>
        </div>
        <TourOverlay
          open={tour !== null}
          index={tour ?? 0}
          onIndexChange={setTour}
          onClose={() => {
            setTour(null);
          }}
          steps={[
            { target: 'demo-tour', title: 'Este botón', body: 'Así se resalta un elemento real.' },
            { title: 'Sin elemento', body: 'Si el paso no tiene ancla, el globo va centrado.' },
          ]}
          labels={{
            next: 'Siguiente',
            back: 'Atrás',
            skip: 'Saltar',
            done: 'Terminar',
            progress: (c, t) => `Paso ${String(c)} de ${String(t)}`,
          }}
        />
      </Specimen>
      <Specimen name="PageHeader">
        <PageHeader
          title="Productos"
          description="Tu catálogo"
          backTo={{ to: '/', label: 'Inicio' }}
          actions={<Button>Nuevo</Button>}
        />
      </Specimen>
      <Specimen name="DataTable" note="búsqueda, orden y paginación en cliente">
        <div className="w-full">
          <DataTable
            caption="Ejemplo"
            columns={[
              { id: 'name', header: 'Nombre', cell: (r) => r.name, sortValue: (r) => r.name },
              {
                id: 'stock',
                header: 'Stock',
                cell: (r) => r.stock,
                sortValue: (r) => r.stock,
                align: 'right',
              },
            ]}
            rows={rows}
            getRowId={(r) => r.id}
            searchText={(r) => r.name}
            pageSize={5}
          />
        </div>
      </Specimen>
      <Specimen name="ProductGrid" note="normal, agotado, en carga">
        <div className="grid w-full gap-4 md:grid-cols-2">
          <ProductGrid
            label="Productos"
            onSelect={() => undefined}
            items={[
              { id: '1', name: 'Capuchino', priceLabel: '$ 6.500' },
              {
                id: '2',
                name: 'Cheesecake',
                priceLabel: '$ 12.000',
                badge: { label: 'Agotado', tone: 'danger' },
              },
            ]}
          />
          <ProductGrid label="Cargando" items={[]} onSelect={() => undefined} loading />
        </div>
      </Specimen>
      <Specimen name="CartPanel / Numpad">
        <div className="h-[28rem] w-80 overflow-hidden rounded-md border border-border">
          <CartPanel
            lines={[
              {
                id: '1',
                name: 'Capuchino',
                quantity: 2,
                unitPriceLabel: '2 × $ 6.500',
                totalLabel: '$ 13.000',
              },
            ]}
            totals={[{ label: 'Total', value: '$ 13.000', emphasis: true }]}
            onQuantityChange={() => undefined}
            onRemove={() => undefined}
            onCheckout={() => undefined}
            checkoutLabel="Cobrar $ 13.000"
          />
        </div>
        <Numpad value={numpad} onValueChange={setNumpad} className="w-64" />
      </Specimen>
      <Specimen name="Modal / Drawer / PaymentSheet">
        <Button
          variant="outline"
          onClick={() => {
            setOpen('modal');
          }}
        >
          Modal
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setOpen('drawer');
          }}
        >
          Drawer
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setOpen('payment');
          }}
        >
          PaymentSheet
        </Button>
        <Modal
          open={open === 'modal'}
          onOpenChange={() => {
            setOpen(null);
          }}
          title="Abrir caja"
          description="Cuenta el efectivo inicial"
          footer={<Button>Abrir</Button>}
        >
          <p>Contenido del modal</p>
        </Modal>
        <Drawer
          open={open === 'drawer'}
          onOpenChange={() => {
            setOpen(null);
          }}
          title="Detalle"
        >
          <p className="p-4">Contenido del cajón</p>
        </Drawer>
        <PaymentSheet
          open={open === 'payment'}
          onOpenChange={() => {
            setOpen(null);
          }}
          totalLabel="$ 13.000"
          methods={[
            { value: 'cash', label: 'Efectivo', icon: null },
            { value: 'card', label: 'Tarjeta', icon: null },
          ]}
          method="cash"
          onMethodChange={() => undefined}
          tenderedLabel="$ 20.000"
          summary={{ label: 'Cambio', value: '$ 7.000', tone: 'success' }}
          keypad={<Numpad value={numpad} onValueChange={setNumpad} />}
          confirmLabel="Confirmar cobro"
          onConfirm={() => {
            setOpen(null);
          }}
        />
      </Specimen>
    </>
  );
}
