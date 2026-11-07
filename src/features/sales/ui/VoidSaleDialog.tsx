import { useState } from 'react';
import { t } from '@/shared/lib/i18n';
import { Button, FormField, Input, Modal, Text } from '@/shared/ui';

export interface VoidSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saleNumber: string;
  onConfirm: (reason: string) => void;
}

/** Confirma la anulación con un motivo obligatorio (queda en el documento `void`). */
export function VoidSaleDialog({ open, onOpenChange, saleNumber, onConfirm }: VoidSaleDialogProps) {
  const [reason, setReason] = useState('');
  const valid = reason.trim().length >= 3;
  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next) setReason('');
        onOpenChange(next);
      }}
      title={t('sales.voidTitle', { number: saleNumber })}
      description={t('sales.voidHint')}
      footer={
        <Button
          variant="danger"
          disabled={!valid}
          onClick={() => {
            onConfirm(reason.trim());
            setReason('');
          }}
        >
          {t('sales.void')}
        </Button>
      }
    >
      <FormField label={t('sales.voidReasonLabel')}>
        {(control) => (
          <Input
            {...control}
            maxLength={200}
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
            }}
          />
        )}
      </FormField>
      <Text variant="caption">{t('sales.voidStock')}</Text>
    </Modal>
  );
}
