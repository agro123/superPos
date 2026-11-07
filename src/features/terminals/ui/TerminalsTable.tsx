import { MonitorSmartphone, MoreVertical } from 'lucide-react';
import type { Synced } from '@/shared/domain/live';
import { formatDateTime } from '@/shared/lib/formatters';
import { t } from '@/shared/lib/i18n';
import {
  Badge,
  DataTable,
  DropdownMenu,
  EmptyState,
  IconButton,
  type DataTableColumn,
  type DropdownMenuItem,
} from '@/shared/ui';
import { terminalStatusMachine, type PosTerminal, type TerminalStatus } from '../domain/terminal';

const TONES = { active: 'success', disabled: 'warning', revoked: 'neutral' } as const;

export interface TerminalsTableProps {
  terminals: readonly Synced<PosTerminal>[];
  loading: boolean;
  timezone: string;
  onEdit: (terminal: PosTerminal) => void;
  onStatus: (terminal: PosTerminal, status: TerminalStatus) => void;
  onRevoke: (terminal: PosTerminal) => void;
}

/** Terminales del negocio con sus acciones según el estado (máquina `terminalStatusMachine`). */
export function TerminalsTable({
  terminals,
  loading,
  timezone,
  onEdit,
  onStatus,
  onRevoke,
}: TerminalsTableProps) {
  const actions = (terminal: PosTerminal): DropdownMenuItem[] => {
    const can = (to: TerminalStatus) => terminalStatusMachine.canTransition(terminal.status, to);
    return [
      ...(terminal.status === 'revoked'
        ? []
        : [
            {
              id: 'edit',
              label: t('terminals.edit'),
              onSelect: () => {
                onEdit(terminal);
              },
            },
          ]),
      ...(can('disabled')
        ? [
            {
              id: 'disable',
              label: t('terminals.disable'),
              onSelect: () => {
                onStatus(terminal, 'disabled');
              },
            },
          ]
        : []),
      ...(can('active')
        ? [
            {
              id: 'enable',
              label: t('terminals.enable'),
              onSelect: () => {
                onStatus(terminal, 'active');
              },
            },
          ]
        : []),
      ...(can('revoked')
        ? [
            {
              id: 'revoke',
              label: t('terminals.revoke'),
              tone: 'danger' as const,
              onSelect: () => {
                onRevoke(terminal);
              },
            },
          ]
        : []),
    ];
  };
  const columns: DataTableColumn<Synced<PosTerminal>>[] = [
    {
      id: 'name',
      header: t('terminals.col.name'),
      cell: (row) => row.name,
      sortValue: (row) => row.name,
    },
    {
      id: 'type',
      header: t('terminals.col.type'),
      hideOnMobile: true,
      cell: (row) => t(`terminal.type.${row.deviceType}`),
    },
    {
      id: 'status',
      header: t('common.status'),
      cell: (row) => <Badge tone={TONES[row.status]}>{t(`terminal.status.${row.status}`)}</Badge>,
    },
    {
      id: 'lastSeen',
      header: t('terminals.col.lastSeen'),
      hideOnMobile: true,
      cell: (row) => (row.lastSeenAt ? formatDateTime(row.lastSeenAt, timezone) : '—'),
    },
    {
      id: 'actions',
      header: t('common.actions'),
      align: 'right',
      cell: (row) => {
        const items = actions(row);
        return items.length > 0 ? (
          <DropdownMenu
            trigger={
              <IconButton
                label={t('terminals.actions', { name: row.name })}
                icon={<MoreVertical />}
              />
            }
            items={items}
          />
        ) : null;
      },
    },
  ];
  return (
    <DataTable
      caption={t('terminals.table')}
      columns={columns}
      rows={terminals}
      getRowId={(row) => row.id}
      loading={loading}
      emptyState={
        <EmptyState
          icon={<MonitorSmartphone />}
          title={t('terminals.empty')}
          description={t('terminals.emptyHint')}
        />
      }
    />
  );
}
