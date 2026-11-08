import { useState } from 'react';
import type { CurrencyCode } from '@/shared/domain/money';
import { formatMoney } from '@/shared/lib/formatters';
import { t } from '@/shared/lib/i18n';
import { whatsappUrl } from '@/shared/lib/share';
import { Button, FormField, Input, Modal, Text } from '@/shared/ui';
import { deliveryOrderMessage, orderTotal, type OrderLine } from '../domain/order';

export interface OrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeName: string;
  whatsapp: string;
  lines: readonly OrderLine[];
  currency: CurrencyCode;
}

/**
 * Pedido a domicilio: no se guarda en el sistema; abre el WhatsApp del cliente con el mensaje
 * listo para enviarlo al número de la tienda.
 */
export function OrderDialog({
  open,
  onOpenChange,
  storeName,
  whatsapp,
  lines,
  currency,
}: OrderDialogProps) {
  const [contact, setContact] = useState({ name: '', address: '', notes: '' });
  const money = (amount: Parameters<typeof formatMoney>[0]) => formatMoney(amount, currency);
  const message = deliveryOrderMessage(storeName, lines, contact, money);
  const field = (key: keyof typeof contact) => (event: { target: { value: string } }) => {
    setContact({ ...contact, [key]: event.target.value });
  };
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={t('storefront.orderTitle')}
      description={t('storefront.orderHint')}
      footer={
        <Button asChild size="lg" fullWidth>
          <a href={whatsappUrl(message, whatsapp)} target="_blank" rel="noopener noreferrer">
            {t('storefront.sendOrder')}
          </a>
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <ul className="flex flex-col gap-1 text-sm">
          {lines.map((line) => (
            <li key={line.name} className="flex justify-between gap-2">
              <span>{`${String(line.quantity)} × ${line.name}`}</span>
            </li>
          ))}
        </ul>
        <Text variant="strong">{t('storefront.total', { amount: money(orderTotal(lines)) })}</Text>
        <FormField label={t('storefront.yourName')} optional>
          {(control) => (
            <Input {...control} autoComplete="name" value={contact.name} onChange={field('name')} />
          )}
        </FormField>
        <FormField label={t('storefront.address')} optional>
          {(control) => (
            <Input
              {...control}
              autoComplete="street-address"
              value={contact.address}
              onChange={field('address')}
            />
          )}
        </FormField>
        <FormField label={t('storefront.notes')} optional>
          {(control) => <Input {...control} value={contact.notes} onChange={field('notes')} />}
        </FormField>
      </div>
    </Modal>
  );
}
