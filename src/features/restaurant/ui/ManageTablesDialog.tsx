import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { t } from '@/shared/lib/i18n';
import {
  Button,
  FormField,
  IconButton,
  Input,
  Modal,
  NumberInput,
  Select,
  Text,
} from '@/shared/ui';
import { restaurantWrites } from '../application/useRestaurant';
import type { Table, Zone } from '../domain/restaurant';

export interface ManageTablesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  uid: string;
  zones: readonly Zone[];
  tables: readonly Table[];
}

/** Configurar zonas y mesas (requiere `settings.manage`). */
export function ManageTablesDialog({
  open,
  onOpenChange,
  businessId,
  uid,
  zones,
  tables,
}: ManageTablesDialogProps) {
  const [zoneName, setZoneName] = useState('');
  const [tableName, setTableName] = useState('');
  const [seats, setSeats] = useState<number | null>(4);
  const [zoneId, setZoneId] = useState('');
  const selectedZone = zones.some((z) => z.id === zoneId) ? zoneId : (zones[0]?.id ?? '');

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={t('restaurant.manage')} size="lg">
      <div className="flex flex-col gap-6">
        <section aria-labelledby="zones" className="flex flex-col gap-2">
          <h3 id="zones" className="text-base font-semibold text-text">
            {t('restaurant.zones')}
          </h3>
          <Text variant="caption">
            {zones.map((z) => z.name).join(' · ') || t('restaurant.noZones')}
          </Text>
          <form
            className="flex flex-wrap items-end gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!zoneName.trim()) return;
              restaurantWrites.createZone(
                businessId,
                zoneName.trim().slice(0, 40),
                zones.length,
                uid,
              );
              setZoneName('');
            }}
          >
            <FormField label={t('restaurant.zoneName')} className="flex-1">
              {(control) => (
                <Input
                  {...control}
                  maxLength={40}
                  placeholder={t('restaurant.zonePlaceholder')}
                  value={zoneName}
                  onChange={(e) => {
                    setZoneName(e.target.value);
                  }}
                />
              )}
            </FormField>
            <Button type="submit" variant="outline" disabled={!zoneName.trim()}>
              {t('restaurant.addZone')}
            </Button>
          </form>
        </section>
        <section aria-labelledby="tables-config" className="flex flex-col gap-2">
          <h3 id="tables-config" className="text-base font-semibold text-text">
            {t('restaurant.tables')}
          </h3>
          {zones.length === 0 ? (
            <Text variant="muted">{t('restaurant.zoneFirst')}</Text>
          ) : (
            <form
              className="grid gap-2 sm:grid-cols-[1fr_6rem_1fr_auto] sm:items-end"
              onSubmit={(event) => {
                event.preventDefault();
                if (!tableName.trim() || !seats || !selectedZone) return;
                restaurantWrites.createTable(
                  businessId,
                  { name: tableName.trim().slice(0, 20), zoneId: selectedZone, seats },
                  uid,
                );
                setTableName('');
              }}
            >
              <FormField label={t('restaurant.tableName')}>
                {(control) => (
                  <Input
                    {...control}
                    maxLength={20}
                    placeholder="Mesa 1"
                    value={tableName}
                    onChange={(e) => {
                      setTableName(e.target.value);
                    }}
                  />
                )}
              </FormField>
              <FormField label={t('restaurant.seatsLabel')}>
                {(control) => (
                  <NumberInput
                    {...control}
                    min={1}
                    max={50}
                    value={seats}
                    onValueChange={setSeats}
                  />
                )}
              </FormField>
              <FormField label={t('restaurant.zone')}>
                {(control) => (
                  <Select
                    {...control}
                    value={selectedZone}
                    onValueChange={setZoneId}
                    options={zones.map((z) => ({ value: z.id, label: z.name }))}
                  />
                )}
              </FormField>
              <Button type="submit" variant="outline" disabled={!tableName.trim() || !seats}>
                {t('restaurant.addTable')}
              </Button>
            </form>
          )}
          <ul className="flex flex-col divide-y divide-border rounded-md border border-border">
            {tables.map((table) => (
              <li
                key={table.id}
                className="flex items-center justify-between gap-2 px-3 py-1 text-sm"
              >
                <span>
                  {table.name} · {zones.find((z) => z.id === table.zoneId)?.name ?? '—'} ·{' '}
                  {t('restaurant.seats', { count: String(table.seats) })}
                </span>
                <IconButton
                  label={t('restaurant.deleteTable', { name: table.name })}
                  icon={<Trash2 />}
                  variant="danger"
                  disabled={table.status === 'occupied'}
                  onClick={() => {
                    restaurantWrites.deleteTable(businessId, table.id);
                  }}
                />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Modal>
  );
}
