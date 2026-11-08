import { useState } from 'react';
import { useCurrentUser } from '@/features/auth';
import type { Product } from '@/features/catalog';
import { formatNumber } from '@/shared/lib/formatters';
import { t } from '@/shared/lib/i18n';
import { Button, FormField, Input, Modal, NumberInput, Select, Text } from '@/shared/ui';
import { recordStockChange } from '../application/useInventory';
import type { Supplier } from '../domain/stock';
import { stockChangeInputSchema, stockDelta, type StockChangeMode } from '../domain/stockChange';

export interface StockChangeDialogProps {
  businessId: string;
  /** Producto y tipo de cambio; `null` cierra el diálogo. */
  target: { product: Product; mode: StockChangeMode } | null;
  suppliers: readonly Supplier[];
  onClose: () => void;
  onSaved: () => void;
}

/** Entrada de mercancía o ajuste por conteo físico (stock + bitácora en un batch). */
export function StockChangeDialog({
  businessId,
  target,
  suppliers,
  onClose,
  onSaved,
}: StockChangeDialogProps) {
  const user = useCurrentUser();
  const [quantity, setQuantity] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [supplierId, setSupplierId] = useState('none');
  const mode = target?.mode ?? 'purchase';
  const parsed = stockChangeInputSchema.safeParse({
    mode,
    quantity: quantity ?? Number.NaN,
    reason,
    supplierId: supplierId === 'none' ? null : supplierId,
  });
  const delta =
    target && quantity !== null ? stockDelta(mode, quantity, target.product.stock) : null;
  const close = () => {
    setQuantity(null);
    setReason('');
    setSupplierId('none');
    onClose();
  };

  return (
    <Modal
      open={target !== null}
      onOpenChange={(open) => {
        if (!open) close();
      }}
      title={t(mode === 'purchase' ? 'inventory.purchaseTitle' : 'inventory.adjustTitle', {
        name: target?.product.name ?? '',
      })}
      description={t('inventory.currentStock', { count: formatNumber(target?.product.stock ?? 0) })}
      footer={
        <Button
          disabled={!parsed.success || delta === 0}
          onClick={() => {
            if (!target || !parsed.success || delta === null || delta === 0) return;
            recordStockChange(
              businessId,
              {
                productId: target.product.id,
                mode,
                delta,
                reason: parsed.data.reason,
                supplierId: parsed.data.supplierId,
              },
              user.uid,
            );
            onSaved();
            close();
          }}
        >
          {t('common.save')}
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <FormField label={t(mode === 'purchase' ? 'inventory.received' : 'inventory.counted')}>
          {(control) => (
            <NumberInput {...control} min={0} value={quantity} onValueChange={setQuantity} />
          )}
        </FormField>
        {mode === 'purchase' ? (
          <FormField label={t('inventory.supplier')} optional>
            {(control) => (
              <Select
                {...control}
                value={supplierId}
                onValueChange={setSupplierId}
                options={[
                  { value: 'none', label: t('inventory.noSupplier') },
                  ...suppliers.map((s) => ({ value: s.id, label: s.name })),
                ]}
              />
            )}
          </FormField>
        ) : null}
        <FormField label={t('inventory.reason')} optional={mode === 'purchase'}>
          {(control) => (
            <Input
              {...control}
              maxLength={200}
              placeholder={t(
                mode === 'purchase' ? 'inventory.reasonPurchase' : 'inventory.reasonAdjust',
              )}
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
              }}
            />
          )}
        </FormField>
        {delta !== null && delta !== 0 ? (
          <Text variant="strong" role="status">
            {t('inventory.deltaPreview', {
              delta: `${delta > 0 ? '+' : ''}${formatNumber(delta)}`,
              total: formatNumber(target ? target.product.stock + delta : 0),
            })}
          </Text>
        ) : null}
      </div>
    </Modal>
  );
}
