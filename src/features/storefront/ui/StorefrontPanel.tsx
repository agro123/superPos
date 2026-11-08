import { ExternalLink, Share2 } from 'lucide-react';
import { useState } from 'react';
import { useCurrentUser } from '@/features/auth';
import { useActiveBusiness } from '@/features/business';
import { stockLevelOf, useProducts } from '@/features/catalog';
import { useToast } from '@/shared/hooks/useToast';
import { t } from '@/shared/lib/i18n';
import { normalizeWhatsapp } from '@/shared/lib/share';
import { Button, FormField, Input, Select, Skeleton, Switch, Text } from '@/shared/ui';
import { saveStorefrontSettings, useStorefrontSettings } from '../application/useStorefront';
import {
  catalogUrl,
  EMAIL_PROVIDERS,
  storefrontSettingsSchema,
  type StorefrontSettings,
} from '../domain/storefront';
import { ProductVisibilityList } from './ProductVisibilityList';
import { CatalogShareLauncher } from './CatalogShareLauncher';

/** Configuración del catálogo público (requiere `settings.manage`; publica `catalog.manage`). */
export function StorefrontPanel() {
  const { business } = useActiveBusiness();
  const user = useCurrentUser();
  const toast = useToast();
  const stored = useStorefrontSettings(business.id, business.name);
  const products = useProducts(business.id);
  const [draft, setDraft] = useState<StorefrontSettings | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  if (stored.loading || products.isPending) return <Skeleton className="h-96" />;

  const active = (products.data ?? []).filter((p) => p.active);
  // Al publicar por primera vez se proponen todos los productos activos.
  const base =
    draft ??
    (stored.exists
      ? stored.settings
      : { ...stored.settings, visibleProductIds: active.map((p) => p.id) });
  const phoneText = phone ?? base.whatsapp ?? '';
  const whatsapp = phoneText.trim() ? normalizeWhatsapp(phoneText) : null;
  const candidate = { ...base, whatsapp };
  const parsed = storefrontSettingsSchema.safeParse(candidate);
  const set = (patch: Partial<StorefrontSettings>) => {
    setDraft({ ...base, ...patch });
  };
  const url = catalogUrl(window.location.origin, base.slug);

  return (
    <div className="flex flex-col gap-5">
      <label className="flex items-center gap-3 text-sm font-medium text-text">
        <Switch
          checked={base.enabled}
          onCheckedChange={(enabled) => {
            set({ enabled });
          }}
        />
        {t('storefront.enabled')}
      </label>
      <FormField
        label={t('storefront.slug')}
        hint={url}
        error={
          /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(base.slug)
            ? undefined
            : t('storefront.slugInvalid')
        }
      >
        {(control) => (
          <Input
            {...control}
            value={base.slug}
            onChange={(e) => {
              set({ slug: e.target.value.toLowerCase() });
            }}
          />
        )}
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t('storefront.titleLabel')}>
          {(control) => (
            <Input
              {...control}
              maxLength={80}
              value={base.title}
              onChange={(e) => {
                set({ title: e.target.value });
              }}
            />
          )}
        </FormField>
        <FormField
          label={t('storefront.whatsappLabel')}
          hint={t('storefront.whatsappHelp')}
          optional
          error={phoneText.trim() && !whatsapp ? t('storefront.whatsappInvalid') : undefined}
        >
          {(control) => (
            <Input
              {...control}
              type="tel"
              value={phoneText}
              onChange={(e) => {
                setPhone(e.target.value);
                setDraft(base);
              }}
            />
          )}
        </FormField>
      </div>
      <FormField label={t('storefront.descriptionLabel')} optional>
        {(control) => (
          <Input
            {...control}
            maxLength={300}
            value={base.description ?? ''}
            onChange={(e) => {
              set({ description: e.target.value || null });
            }}
          />
        )}
      </FormField>
      <label className="flex items-center gap-3 text-sm text-text">
        <Switch
          checked={base.showOutOfStock}
          onCheckedChange={(showOutOfStock) => {
            set({ showOutOfStock });
          }}
        />
        {t('storefront.showOutOfStock')}
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t('storefront.emailProvider')} hint={t('storefront.emailProviderHelp')}>
          {(control) => (
            <Select
              {...control}
              value={base.emailProvider}
              onValueChange={(value) => {
                const provider = EMAIL_PROVIDERS.find((p) => p === value);
                if (provider) set({ emailProvider: provider });
              }}
              options={EMAIL_PROVIDERS.map((p) => ({
                value: p,
                label: t(`storefront.provider.${p}`),
              }))}
            />
          )}
        </FormField>
        {base.emailProvider === 'custom' ? (
          <FormField
            label={t('storefront.emailCustomUrl')}
            hint={t('storefront.emailCustomHelp')}
            error={
              base.emailCustomUrl?.startsWith('https://')
                ? undefined
                : t('storefront.emailCustomInvalid')
            }
          >
            {(control) => (
              <Input
                {...control}
                type="url"
                value={base.emailCustomUrl ?? ''}
                onChange={(e) => {
                  set({ emailCustomUrl: e.target.value || null });
                }}
              />
            )}
          </FormField>
        ) : null}
      </div>
      <ProductVisibilityList
        products={active.map((p) => ({
          id: p.id,
          name: p.name,
          priceMinor: p.priceMinor,
          outOfStock: stockLevelOf(p) === 'out',
        }))}
        visible={new Set(base.visibleProductIds)}
        currency={business.currency}
        onChange={(visible) => {
          set({ visibleProductIds: [...visible] });
        }}
      />
      {stored.exists && stored.settings.enabled ? null : (
        <Text variant="caption">{t('storefront.publishHint')}</Text>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={!parsed.success || (base.emailProvider === 'custom' && !base.emailCustomUrl)}
          onClick={() => {
            if (!parsed.success) return;
            saveStorefrontSettings(
              business.id,
              parsed.data,
              stored.exists
                ? { slug: stored.settings.slug, published: stored.settings.enabled }
                : null,
              user.uid,
            );
            setDraft(null);
            setPhone(null);
            toast({ title: t('storefront.saved'), tone: 'success' });
          }}
        >
          {t('common.save')}
        </Button>
        {stored.exists && stored.settings.enabled ? (
          <>
            <Button
              variant="outline"
              leftIcon={<Share2 aria-hidden className="size-5" />}
              onClick={() => {
                setSharing(true);
              }}
            >
              {t('storefront.share')}
            </Button>
            <Button variant="ghost" asChild>
              <a
                href={catalogUrl(window.location.origin, stored.settings.slug)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink aria-hidden className="size-5" />
                {t('storefront.open')}
              </a>
            </Button>
          </>
        ) : null}
      </div>
      <CatalogShareLauncher open={sharing} onOpenChange={setSharing} />
    </div>
  );
}
