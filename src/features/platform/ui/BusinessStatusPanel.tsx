import { Ban, RotateCcw, ShieldCheck, Trash2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { businessStatusMachine, type Business, type BusinessStatus } from '@/features/business';
import { t, type MessageKey } from '@/shared/lib/i18n';
import { Button, ConfirmDialog, Heading, Text } from '@/shared/ui';
import { StatusBadge } from './StatusBadge';

const HINTS: Record<BusinessStatus, MessageKey> = {
  active: 'platform.status.activeHint',
  blocked: 'platform.status.blockedHint',
  deleted: 'platform.status.deletedHint',
};

interface Action {
  to: BusinessStatus;
  label: MessageKey;
  icon: ReactNode;
  variant: 'secondary' | 'danger';
}

/** Acción que lleva a cada estado, según desde dónde se parte. */
function actionFor(from: BusinessStatus, to: BusinessStatus): Action {
  if (to === 'blocked')
    return { to, label: 'platform.status.block', icon: <Ban />, variant: 'secondary' };
  if (to === 'deleted')
    return { to, label: 'platform.status.delete', icon: <Trash2 />, variant: 'danger' };
  return from === 'deleted'
    ? { to, label: 'platform.status.restore', icon: <RotateCcw />, variant: 'secondary' }
    : { to, label: 'platform.status.unblock', icon: <ShieldCheck />, variant: 'secondary' };
}

export interface BusinessStatusPanelProps {
  business: Business;
  onChange: (to: BusinessStatus) => void;
}

/** Estado de la cuenta y transiciones permitidas por `businessStatusMachine`, con confirmación. */
export function BusinessStatusPanel({ business, onChange }: BusinessStatusPanelProps) {
  const [pending, setPending] = useState<BusinessStatus | null>(null);
  const actions = businessStatusMachine
    .nextStates(business.status)
    .map((to) => actionFor(business.status, to));

  return (
    <section aria-labelledby="status-title" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <Heading id="status-title" level={2} size="md">
          {t('platform.status.title')}
        </Heading>
        <StatusBadge status={business.status} />
      </div>
      <Text variant="muted">{t(HINTS[business.status])}</Text>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <Button
            key={action.to}
            variant={action.variant}
            leftIcon={action.icon}
            onClick={() => {
              setPending(action.to);
            }}
          >
            {t(action.label)}
          </Button>
        ))}
      </div>
      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
        title={pending ? t(`platform.status.confirm.${pending}`, { name: business.name }) : ''}
        description={pending ? t(`platform.status.confirm.${pending}Hint`) : undefined}
        confirmLabel={pending ? t(actionFor(business.status, pending).label) : undefined}
        tone={pending === 'active' ? 'primary' : 'danger'}
        onConfirm={() => {
          if (pending) onChange(pending);
          setPending(null);
        }}
      />
    </section>
  );
}
