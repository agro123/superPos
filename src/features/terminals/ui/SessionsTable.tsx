import { History } from 'lucide-react';
import type { Synced } from '@/shared/domain/live';
import { formatDateTime } from '@/shared/lib/formatters';
import { t } from '@/shared/lib/i18n';
import { Badge, Button, DataTable, EmptyState, type DataTableColumn } from '@/shared/ui';
import type { TerminalSession } from '../domain/session';

const TONES = { active: 'success', closed: 'neutral', expired: 'warning' } as const;

export interface SessionsTableProps {
  sessions: readonly Synced<TerminalSession>[];
  loading: boolean;
  timezone: string;
  workerName: (uid: string) => string;
  terminalName: (id: string) => string;
  onExpire: (session: TerminalSession) => void;
}

/** Historial de sesiones de trabajo: quién, en qué terminal, inicio y cierre. */
export function SessionsTable({
  sessions,
  loading,
  timezone,
  workerName,
  terminalName,
  onExpire,
}: SessionsTableProps) {
  const columns: DataTableColumn<Synced<TerminalSession>>[] = [
    { id: 'worker', header: t('terminals.col.worker'), cell: (s) => workerName(s.memberUid) },
    {
      id: 'terminal',
      header: t('terminals.col.terminal'),
      cell: (s) => terminalName(s.terminalId),
    },
    {
      id: 'started',
      header: t('terminals.col.started'),
      cell: (s) => formatDateTime(s.startedAt, timezone),
      sortValue: (s) => s.startedAt.getTime(),
    },
    {
      id: 'ended',
      header: t('terminals.col.ended'),
      hideOnMobile: true,
      cell: (s) => (s.endedAt ? formatDateTime(s.endedAt, timezone) : '—'),
    },
    {
      id: 'status',
      header: t('common.status'),
      cell: (s) =>
        s.status === 'active' ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              onExpire(s);
            }}
          >
            {t('terminals.expire')}
          </Button>
        ) : (
          <Badge tone={TONES[s.status]}>{t(`terminals.session.${s.status}`)}</Badge>
        ),
    },
  ];
  return (
    <DataTable
      caption={t('terminals.sessionsTable')}
      columns={columns}
      rows={sessions}
      getRowId={(s) => s.id}
      loading={loading}
      emptyState={<EmptyState icon={<History />} title={t('terminals.noSessions')} />}
    />
  );
}
