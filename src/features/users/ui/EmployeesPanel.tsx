import { Trash2, Users } from 'lucide-react';
import { useState } from 'react';
import { PLAN_LIMITS, type BusinessPlan } from '@/shared/domain/plan';
import { errorMessage } from '@/shared/lib/errorMessage';
import { t } from '@/shared/lib/i18n';
import {
  Badge,
  Button,
  PremiumBadge,
  DataTable,
  EmptyState,
  IconButton,
  Text,
  type DataTableColumn,
} from '@/shared/ui';
import {
  memberWrites,
  useBusinessInvitations,
  useMembers,
  useRoleLabel,
  useTakenSeats,
} from '../application/useMembers';
import type { Member } from '../domain/member';
import { InviteMemberForm } from './InviteMemberForm';
import { MemberEditor } from './MemberEditor';

export interface EmployeesPanelProps {
  businessId: string;
  businessName: string;
  ownerUid: string | null;
  currentUid: string;
  plan: BusinessPlan;
}

/** Gestión de empleados: lista, edición de acceso e invitaciones. */
export function EmployeesPanel({
  businessId,
  businessName,
  ownerUid,
  currentUid,
  plan,
}: EmployeesPanelProps) {
  const members = useMembers(businessId);
  const invitations = useBusinessInvitations(businessId);
  const [editing, setEditing] = useState<Member | null>(null);
  const roleLabel = useRoleLabel(businessId);
  const takenSeats = useTakenSeats(businessId);
  const seatLimit = PLAN_LIMITS[plan].workerSeats;
  const seatsFull = takenSeats.size >= seatLimit;
  const editable = (member: Member) => member.id !== ownerUid && member.id !== currentUid;

  const columns: DataTableColumn<Member>[] = [
    {
      id: 'name',
      header: t('common.name'),
      cell: (m) => m.displayName,
      sortValue: (m) => m.displayName,
    },
    { id: 'email', header: t('common.email'), cell: (m) => m.email, hideOnMobile: true },
    {
      id: 'role',
      header: t('employees.role'),
      cell: (m) => (
        <span className="flex flex-wrap gap-1">
          <Badge tone={m.role === 'admin' ? 'primary' : 'neutral'}>
            {roleLabel(m.role, m.customRoleId)}
          </Badge>
          {m.id === ownerUid ? <Badge tone="info">{t('employees.owner')}</Badge> : null}
          {m.id === currentUid ? <Badge>{t('employees.you')}</Badge> : null}
        </span>
      ),
    },
    {
      id: 'status',
      header: t('common.status'),
      cell: (m) => (
        <Badge tone={m.status === 'active' ? 'success' : 'warning'}>
          {t(`memberStatus.${m.status}`)}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: t('common.actions'),
      align: 'right',
      cell: (m) =>
        editable(m) ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditing(m);
            }}
          >
            {t('common.edit')}
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {members.isError ? (
        <EmptyState
          tone="danger"
          title={t('common.loadError')}
          description={errorMessage(members.error)}
          action={<Button onClick={() => void members.refetch()}>{t('common.retry')}</Button>}
        />
      ) : (
        <DataTable
          caption={t('employees.table')}
          columns={columns}
          rows={members.data ?? []}
          getRowId={(m) => m.id}
          searchText={(m) => `${m.displayName} ${m.email}`}
          loading={members.isPending}
          emptyState={<EmptyState icon={<Users />} title={t('employees.title')} />}
        />
      )}
      <p role="status" className="flex flex-wrap items-center gap-2 text-sm text-text">
        {t('plan.seatsUsage', { used: String(takenSeats.size), total: String(seatLimit) })}
        {plan === 'free' ? (
          <>
            <PremiumBadge label={t('plan.premium')} />
            <span className="text-text-muted">{t('plan.seatsPremium')}</span>
          </>
        ) : null}
      </p>
      <InviteMemberForm
        businessId={businessId}
        businessName={businessName}
        invitedBy={currentUid}
        plan={plan}
        seatsFull={seatsFull}
      />
      <section aria-labelledby="pending-title" className="flex flex-col gap-2">
        <Text id="pending-title" variant="strong">
          {t('employees.pending')}
        </Text>
        {invitations.data?.length ? (
          <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
            {invitations.data.map((invitation) => (
              <li key={invitation.id} className="flex items-center justify-between gap-2 px-4 py-2">
                <span className="text-sm text-text">
                  {invitation.email} · {roleLabel(invitation.role, invitation.customRoleId)}
                  {invitation.pendingSync ? (
                    <Badge className="ml-2">{t('common.pendingSync')}</Badge>
                  ) : null}
                </span>
                <IconButton
                  label={t('employees.revoke', { email: invitation.email })}
                  icon={<Trash2 />}
                  variant="danger"
                  onClick={() => {
                    memberWrites.revokeInvitation(businessId, invitation.id);
                  }}
                />
              </li>
            ))}
          </ul>
        ) : (
          <Text variant="muted">{t('employees.noPending')}</Text>
        )}
      </section>
      {editing ? (
        <MemberEditor
          businessId={businessId}
          member={editing}
          plan={plan}
          takenSeats={takenSeats}
          currentUid={currentUid}
          onClose={() => {
            setEditing(null);
          }}
        />
      ) : null}
    </div>
  );
}
