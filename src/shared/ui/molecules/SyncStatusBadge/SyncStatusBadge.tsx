import { AlertTriangle, CloudOff, RefreshCw, Wifi } from 'lucide-react';
import type { SyncState } from '@/shared/domain/sync';
import { t } from '@/shared/lib/i18n';
import { Badge, type BadgeTone } from '../../atoms/Badge';

export interface SyncStatusBadgeProps {
  state: SyncState;
  /** Cambios pendientes; `null` si se desconoce el número. */
  pendingCount: number | null;
  className?: string;
}

const tones: Record<SyncState, BadgeTone> = {
  online: 'success',
  offline: 'warning',
  syncing: 'info',
  error: 'danger',
};

function labelFor(state: SyncState, pendingCount: number | null): string {
  if (state === 'syncing') {
    return pendingCount
      ? t('ui.sync.syncing', { count: pendingCount })
      : t('ui.sync.syncingUnknown');
  }
  const base = t(`ui.sync.${state}`);
  return state === 'offline' && pendingCount ? `${base} · ${pendingCount}` : base;
}

/** Indicador global de conexión y sincronización (en línea, sin conexión, sincronizando, error). */
export function SyncStatusBadge({ state, pendingCount, className }: SyncStatusBadgeProps) {
  const icon = {
    online: <Wifi />,
    offline: <CloudOff />,
    syncing: <RefreshCw className="animate-spin motion-reduce:animate-none" />,
    error: <AlertTriangle />,
  }[state];
  return (
    <span role="status" aria-live="polite" className={className}>
      <Badge tone={tones[state]} icon={icon}>
        {labelFor(state, pendingCount)}
      </Badge>
    </span>
  );
}
