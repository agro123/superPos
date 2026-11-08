import { Copy, Mail, MessageCircle, QrCode, Share2 } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/shared/hooks/useToast';
import { t } from '@/shared/lib/i18n';
import {
  emailComposeUrl,
  whatsappUrl,
  whatsappWebUrl,
  type EmailProvider,
} from '@/shared/lib/share';
import { Button, FormField, Input, Modal, Text } from '@/shared/ui';
import { shareCatalogText } from '../domain/order';
import { CatalogQr } from './CatalogQr';

export interface ShareCatalogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  title: string;
  highlights: readonly string[];
  email: { provider: EmailProvider; customUrl: string | null };
}

/** Compartir el catálogo: enlace, WhatsApp (app o navegador), correo y QR para mostrar en el celular. */
export function ShareCatalogDialog({
  open,
  onOpenChange,
  url,
  title,
  highlights,
  email,
}: ShareCatalogDialogProps) {
  const toast = useToast();
  const [to, setTo] = useState('');
  const [bigQr, setBigQr] = useState(false);
  const text = shareCatalogText(title, url, highlights);
  const subject = t('storefront.emailSubject', { title });
  const canNativeShare = typeof navigator.share === 'function';
  const external = { target: '_blank', rel: 'noopener noreferrer' } as const;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={t('storefront.shareTitle')}
      description={url}
    >
      {bigQr ? (
        <button
          type="button"
          onClick={() => {
            setBigQr(false);
          }}
          className="flex w-full flex-col items-center gap-3 py-4"
          aria-label={t('storefront.qrClose')}
        >
          <CatalogQr url={url} label={t('storefront.qrAlt', { title })} size={320} />
          <Text variant="strong">{title}</Text>
          <Text variant="caption">{t('storefront.qrHint')}</Text>
        </button>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col items-center gap-2">
            <CatalogQr url={url} label={t('storefront.qrAlt', { title })} size={200} />
            <Button
              variant="outline"
              leftIcon={<QrCode aria-hidden className="size-5" />}
              onClick={() => {
                setBigQr(true);
              }}
            >
              {t('storefront.showQr')}
            </Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              variant="outline"
              leftIcon={<Copy aria-hidden className="size-5" />}
              onClick={() => {
                void navigator.clipboard.writeText(url).then(
                  () => {
                    toast({ title: t('storefront.copied'), tone: 'success' });
                  },
                  () => {
                    toast({ title: url, tone: 'info' });
                  },
                );
              }}
            >
              {t('storefront.copyLink')}
            </Button>
            {canNativeShare ? (
              <Button
                variant="outline"
                leftIcon={<Share2 aria-hidden className="size-5" />}
                onClick={() => {
                  void navigator.share({ title, text, url }).catch(() => undefined);
                }}
              >
                {t('storefront.nativeShare')}
              </Button>
            ) : null}
            <Button asChild>
              <a href={whatsappUrl(text)} {...external}>
                <MessageCircle aria-hidden className="size-5" />
                {t('storefront.whatsapp')}
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href={whatsappWebUrl(text)} {...external}>
                {t('storefront.whatsappWeb')}
              </a>
            </Button>
          </div>
          <FormField label={t('storefront.emailTo')} optional>
            {(control) => (
              <Input
                {...control}
                type="email"
                value={to}
                onChange={(event) => {
                  setTo(event.target.value);
                }}
              />
            )}
          </FormField>
          <Button variant="outline" asChild>
            <a
              href={emailComposeUrl(email.provider, { to, subject, body: text }, email.customUrl)}
              {...external}
            >
              <Mail aria-hidden className="size-5" />
              {t('storefront.emailWith', { provider: t(`storefront.provider.${email.provider}`) })}
            </a>
          </Button>
        </div>
      )}
    </Modal>
  );
}
