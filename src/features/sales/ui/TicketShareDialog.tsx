import { Download, FileText, Image as ImageIcon, Mail, MessageCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useToast } from '@/shared/hooks/useToast';
import { downloadBlob } from '@/shared/lib/exportFiles';
import { t } from '@/shared/lib/i18n';
import {
  canShareFile,
  receiptText,
  renderReceiptPdf,
  renderReceiptPng,
  type ReceiptView,
} from '@/shared/lib/receipt';
import {
  emailComposeUrl,
  normalizeWhatsapp,
  whatsappUrl,
  whatsappWebUrl,
  type EmailProvider,
} from '@/shared/lib/share';
import { Button, FormField, Input, Modal, Skeleton, Text } from '@/shared/ui';

export interface TicketShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipt: ReceiptView;
  fileName: string;
  /** Contacto del cliente de la venta, si lo hay (prellena WhatsApp y correo). */
  customer: { phone: string | null; email: string | null } | null;
  email: { provider: EmailProvider; customUrl: string | null };
}

/**
 * Ticket como imagen o PDF. En el celular se comparte el archivo con la hoja nativa (WhatsApp,
 * Gmail…); los enlaces `wa.me` y de correo no adjuntan archivos, así que envían el ticket en texto.
 */
export function TicketShareDialog({
  open,
  onOpenChange,
  receipt,
  fileName,
  customer,
  email,
}: TicketShareDialogProps) {
  const toast = useToast();
  const [preview, setPreview] = useState<string | null>(null);
  const [phone, setPhone] = useState(customer?.phone ?? '');
  const [to, setTo] = useState(customer?.email ?? '');
  const text = receiptText(receipt);
  const external = { target: '_blank', rel: 'noopener noreferrer' } as const;

  useEffect(() => {
    if (!open) return;
    let url: string | null = null;
    void renderReceiptPng(receipt).then((blob) => {
      url = URL.createObjectURL(blob);
      setPreview(url);
    });
    return () => {
      if (url) URL.revokeObjectURL(url);
      setPreview(null);
    };
  }, [open, receipt]);

  const share = async (kind: 'png' | 'pdf') => {
    try {
      const blob =
        kind === 'png' ? await renderReceiptPng(receipt) : await renderReceiptPdf(receipt);
      const file = new File([blob], `${fileName}.${kind}`, { type: blob.type });
      if (canShareFile(file)) await navigator.share({ files: [file], title: receipt.title });
      else downloadBlob(blob, file.name);
    } catch (error) {
      // Cancelar la hoja nativa no es un error para el usuario.
      if (error instanceof DOMException && error.name === 'AbortError') return;
      toast({ title: t('sales.shareFailed'), tone: 'danger' });
    }
  };
  const target = normalizeWhatsapp(phone);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={t('sales.shareTicket')}
      description={receipt.subtitle}
      size="lg"
    >
      <div className="grid gap-4 md:grid-cols-[16rem_1fr]">
        <div className="flex justify-center">
          {preview ? (
            <img
              src={preview}
              alt={t('sales.ticketPreview')}
              className="w-64 rounded-md border border-border"
            />
          ) : (
            <Skeleton className="h-80 w-64" />
          )}
        </div>
        <div className="flex flex-col gap-3">
          <Text variant="strong">{t('sales.shareFile')}</Text>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              leftIcon={<ImageIcon aria-hidden className="size-5" />}
              onClick={() => void share('png')}
            >
              {t('sales.shareImage')}
            </Button>
            <Button
              variant="outline"
              leftIcon={<FileText aria-hidden className="size-5" />}
              onClick={() => void share('pdf')}
            >
              {t('sales.sharePdf')}
            </Button>
          </div>
          <Text variant="caption">{t('sales.shareFileHint')}</Text>
          <Text variant="strong">{t('sales.shareText')}</Text>
          <FormField label={t('sales.customerWhatsapp')} optional>
            {(control) => (
              <Input
                {...control}
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                }}
              />
            )}
          </FormField>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button asChild>
              <a href={whatsappUrl(text, target)} {...external}>
                <MessageCircle aria-hidden className="size-5" />
                {t('storefront.whatsapp')}
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href={whatsappWebUrl(text, target)} {...external}>
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
                onChange={(e) => {
                  setTo(e.target.value);
                }}
              />
            )}
          </FormField>
          <Button variant="outline" asChild>
            <a
              href={emailComposeUrl(
                email.provider,
                { to, subject: receipt.subtitle ?? receipt.title, body: text },
                email.customUrl,
              )}
              {...external}
            >
              <Mail aria-hidden className="size-5" />
              {t('storefront.emailWith', { provider: t(`storefront.provider.${email.provider}`) })}
            </a>
          </Button>
          <Button
            variant="ghost"
            leftIcon={<Download aria-hidden className="size-5" />}
            onClick={() => {
              void renderReceiptPdf(receipt).then((b) => {
                downloadBlob(b, `${fileName}.pdf`);
              });
            }}
          >
            {t('sales.downloadPdf')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
