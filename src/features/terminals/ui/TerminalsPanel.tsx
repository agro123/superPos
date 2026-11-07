import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/shared/hooks/useToast';
import { t } from '@/shared/lib/i18n';
import { Button, ConfirmDialog, Modal } from '@/shared/ui';
import {
  expireSession,
  setTerminalStatus,
  updateTerminal,
  useMemberNames,
  useRecentSessions,
  useTerminals,
} from '../application/useTerminalAdmin';
import { terminalUpdateSchema, type PosTerminal, type TerminalUpdate } from '../domain/terminal';
import { PairTerminalDialog } from './PairTerminalDialog';
import { SessionsTable } from './SessionsTable';
import { TerminalFields } from './TerminalFields';
import { TerminalsTable } from './TerminalsTable';

export interface TerminalsPanelProps {
  businessId: string;
  businessName: string;
  timezone: string;
}

/** Administración de terminales y del historial de sesiones (requiere `users.manage`). */
export function TerminalsPanel({ businessId, businessName, timezone }: TerminalsPanelProps) {
  const toast = useToast();
  const terminals = useTerminals(businessId);
  const sessions = useRecentSessions(businessId);
  const members = useMemberNames(businessId);
  const [pairing, setPairing] = useState(false);
  const [editing, setEditing] = useState<{ terminal: PosTerminal; fields: TerminalUpdate } | null>(
    null,
  );
  const [revoking, setRevoking] = useState<PosTerminal | null>(null);
  const nameOf = <T extends { id: string }>(
    rows: readonly T[] | undefined,
    id: string,
    pick: (row: T) => string,
  ) => {
    const row = rows?.find((item) => item.id === id);
    return row ? pick(row) : '—';
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <Button
          leftIcon={<Plus aria-hidden className="size-5" />}
          onClick={() => {
            setPairing(true);
          }}
        >
          {t('terminals.pair')}
        </Button>
      </div>
      <TerminalsTable
        terminals={terminals.data ?? []}
        loading={terminals.isPending}
        timezone={timezone}
        onEdit={(terminal) => {
          setEditing({
            terminal,
            fields: { name: terminal.name, idleLockMinutes: terminal.idleLockMinutes },
          });
        }}
        onStatus={(terminal, status) => {
          setTerminalStatus(businessId, terminal.id, status);
        }}
        onRevoke={setRevoking}
      />
      <section aria-labelledby="terminal-sessions" className="flex flex-col gap-3">
        <h3 id="terminal-sessions" className="text-lg font-semibold text-text">
          {t('terminals.sessions')}
        </h3>
        <SessionsTable
          sessions={sessions.data ?? []}
          loading={sessions.isPending}
          timezone={timezone}
          workerName={(uid) => nameOf(members.data, uid, (m) => m.displayName)}
          terminalName={(id) => nameOf(terminals.data, id, (term) => term.name)}
          onExpire={(session) => {
            expireSession(businessId, session.id);
          }}
        />
      </section>
      <PairTerminalDialog
        open={pairing}
        onOpenChange={setPairing}
        businessId={businessId}
        businessName={businessName}
        onPaired={() => {
          toast({ title: t('terminals.authorized'), tone: 'success' });
        }}
      />
      <Modal
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        title={t('terminals.edit')}
        footer={
          <Button
            onClick={() => {
              if (!editing) return;
              const parsed = terminalUpdateSchema.safeParse(editing.fields);
              if (!parsed.success) return;
              updateTerminal(businessId, editing.terminal.id, parsed.data);
              setEditing(null);
            }}
          >
            {t('common.save')}
          </Button>
        }
      >
        {editing ? (
          <div className="flex flex-col gap-4">
            <TerminalFields
              value={editing.fields}
              nameError={!terminalUpdateSchema.safeParse(editing.fields).success}
              onChange={(fields) => {
                setEditing({ ...editing, fields });
              }}
            />
          </div>
        ) : null}
      </Modal>
      <ConfirmDialog
        open={revoking !== null}
        onOpenChange={(open) => {
          if (!open) setRevoking(null);
        }}
        title={t('terminals.revokeConfirm', { name: revoking?.name ?? '' })}
        description={t('terminals.revokeHint')}
        confirmLabel={t('terminals.revoke')}
        tone="danger"
        onConfirm={() => {
          if (revoking) setTerminalStatus(businessId, revoking.id, 'revoked');
          setRevoking(null);
        }}
      />
    </div>
  );
}
