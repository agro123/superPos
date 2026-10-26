import { Package, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { useToastStore } from '@/shared/hooks/useToast';
import {
  Button,
  ConfirmDialog,
  DropdownMenu,
  EmptyState,
  FormField,
  Input,
  PermissionGate,
  QuantityStepper,
  SearchBar,
  StatCard,
  SyncStatusBadge,
  Tabs,
} from '@/shared/ui';
import { Specimen } from './Specimen';

export function MoleculesSection() {
  const [search, setSearch] = useState('');
  const [quantity, setQuantity] = useState(2);
  const [confirm, setConfirm] = useState(false);
  const show = useToastStore((state) => state.show);
  return (
    <>
      <Specimen name="FormField" note="con ayuda, opcional y con error">
        <div className="grid w-full gap-4 sm:grid-cols-3">
          <FormField label="Nombre" hint="Como aparece en el ticket">
            {(c) => <Input {...c} />}
          </FormField>
          <FormField label="SKU" optional>
            {(c) => <Input {...c} />}
          </FormField>
          <FormField label="Email" error="Escribe un email válido">
            {(c) => <Input {...c} defaultValue="ana@" />}
          </FormField>
        </div>
      </Specimen>
      <Specimen name="SearchBar / QuantityStepper">
        <SearchBar value={search} onValueChange={setSearch} shortcut="F2" className="w-72" />
        <QuantityStepper value={quantity} onValueChange={setQuantity} min={1} itemName="Café" />
      </Specimen>
      <Specimen name="StatCard" note="normal, con tendencia y en carga">
        <div className="grid w-full gap-3 sm:grid-cols-3">
          <StatCard label="Ventas de hoy" value="$ 245.000" />
          <StatCard
            label="Tickets"
            value="38"
            trend={{ label: '+12 % vs. ayer', tone: 'success' }}
          />
          <StatCard label="Ticket promedio" value="$ 6.400" loading />
        </div>
      </Specimen>
      <Specimen name="SyncStatusBadge" note="los 4 estados">
        <SyncStatusBadge state="online" pendingCount={0} />
        <SyncStatusBadge state="offline" pendingCount={3} />
        <SyncStatusBadge state="syncing" pendingCount={2} />
        <SyncStatusBadge state="error" pendingCount={1} />
      </Specimen>
      <Specimen name="EmptyState" note="vacío y error">
        <div className="grid w-full gap-3 sm:grid-cols-2">
          <EmptyState
            icon={<Package />}
            title="Sin productos"
            description="Crea el primero."
            action={<Button>Crear producto</Button>}
          />
          <EmptyState
            tone="danger"
            icon={<ShoppingCart />}
            title="No pudimos cargar"
            action={<Button variant="outline">Reintentar</Button>}
          />
        </div>
      </Specimen>
      <Specimen name="Tabs / DropdownMenu / PermissionGate">
        <Tabs
          label="Ejemplo"
          items={[
            { value: 'a', label: 'Productos', content: <p>Panel A</p> },
            { value: 'b', label: 'Categorías', content: <p>Panel B</p> },
          ]}
        />
        <DropdownMenu
          trigger={<Button variant="outline">Menú</Button>}
          heading="ana@superpos.test"
          items={[
            { id: 'a', label: 'Acción', onSelect: () => undefined },
            { id: 'b', label: 'Eliminar', tone: 'danger', onSelect: () => undefined },
          ]}
        />
        <PermissionGate
          allowed={false}
          fallback={<span className="text-sm text-text-muted">(sin permiso)</span>}
        >
          <Button>Oculto</Button>
        </PermissionGate>
      </Specimen>
      <Specimen name="ConfirmDialog / Toast">
        <Button
          variant="danger"
          onClick={() => {
            setConfirm(true);
          }}
        >
          Abrir confirmación
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            show({
              title: 'Guardado',
              description: 'Se sincronizará al volver la conexión.',
              tone: 'success',
            });
          }}
        >
          Mostrar toast
        </Button>
        <ConfirmDialog
          open={confirm}
          onOpenChange={setConfirm}
          title="¿Vaciar el carrito?"
          tone="danger"
          confirmLabel="Vaciar"
          onConfirm={() => {
            setConfirm(false);
          }}
        />
      </Specimen>
    </>
  );
}
