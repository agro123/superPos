import { useActiveBusiness } from '@/features/business';
import { useProducts } from '@/features/catalog';
import { t } from '@/shared/lib/i18n';
import { Modal, Text } from '@/shared/ui';
import { useStorefrontSettings } from '../application/useStorefront';
import { catalogUrl } from '../domain/storefront';
import { ShareCatalogDialog } from './ShareCatalogDialog';

export interface CatalogShareLauncherProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Compartir/QR desde cualquier pantalla (menú de usuario): lee la configuración del negocio. */
export function CatalogShareLauncher({ open, onOpenChange }: CatalogShareLauncherProps) {
  const { business } = useActiveBusiness();
  const { settings } = useStorefrontSettings(business.id, business.name);
  const products = useProducts(business.id);
  if (!settings.enabled) {
    return (
      <Modal open={open} onOpenChange={onOpenChange} title={t('storefront.shareTitle')}>
        <Text variant="muted">{t('storefront.notPublished')}</Text>
      </Modal>
    );
  }
  const visible = new Set(settings.visibleProductIds);
  return (
    <ShareCatalogDialog
      open={open}
      onOpenChange={onOpenChange}
      url={catalogUrl(window.location.origin, settings.slug)}
      title={settings.title}
      highlights={(products.data ?? [])
        .filter((p) => p.active && visible.has(p.id))
        .map((p) => p.name)}
      email={{ provider: settings.emailProvider, customUrl: settings.emailCustomUrl }}
    />
  );
}
