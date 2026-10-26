import { Settings } from 'lucide-react';
import { AuthLayout, Logo, PosLayout, SettingsLayout } from '@/shared/ui';
import { Specimen } from './Specimen';

/** Las plantillas se muestran en miniatura: definen distribución, no datos. */
export function TemplatesSection() {
  const box = (label: string) => (
    <div className="flex h-full min-h-24 items-center justify-center rounded-md border border-dashed border-border-strong text-sm text-text-subtle">
      {label}
    </div>
  );
  return (
    <>
      <Specimen name="AuthLayout">
        <div className="h-96 w-full overflow-auto rounded-md border border-border">
          <AuthLayout title="Inicia sesión" brand={<Logo />}>
            {box('formulario')}
          </AuthLayout>
        </div>
      </Specimen>
      <Specimen name="PosLayout" note="catálogo + carrito; en móvil, carrito en hoja inferior">
        <div className="h-80 w-full overflow-hidden rounded-md border border-border [&>div]:h-full">
          <PosLayout
            catalog={box('catálogo')}
            cart={box('carrito')}
            cartSummary="2 artículos"
            cartOpen={false}
            onCartOpenChange={() => undefined}
          />
        </div>
      </Specimen>
      <Specimen name="SettingsLayout">
        <div className="w-full rounded-md border border-border">
          <SettingsLayout
            header={<p className="font-semibold">Configuración</p>}
            items={[{ to: '/', label: 'Negocio', icon: <Settings /> }]}
          >
            {box('sección')}
          </SettingsLayout>
        </div>
      </Specimen>
      <p className="text-sm text-text-muted">
        AppShell es el layout de toda la app autenticada (barra lateral + barra superior +
        contenido).
      </p>
    </>
  );
}
