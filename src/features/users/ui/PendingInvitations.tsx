import { MailCheck } from 'lucide-react';
import { useCurrentUser, useRefreshVerification, useResendVerification } from '@/features/auth';
import { errorMessage } from '@/shared/lib/errorMessage';
import { t } from '@/shared/lib/i18n';
import { Button, Heading, Text } from '@/shared/ui';
import { useAcceptInvitation, useMyInvitations } from '../application/useMembers';

export interface PendingInvitationsProps {
  onAccepted: (businessId: string) => void;
}

/** Invitaciones para el usuario actual (exige email verificado, como las reglas). */
export function PendingInvitations({ onAccepted }: PendingInvitationsProps) {
  const user = useCurrentUser();
  const invitations = useMyInvitations(user.email, user.emailVerified);
  const accept = useAcceptInvitation();
  const resend = useResendVerification();
  const refresh = useRefreshVerification();

  if (!user.emailVerified) {
    return (
      <section
        aria-labelledby="verify-title"
        className="flex flex-col gap-2 rounded-md border border-border p-4"
      >
        <Heading level={2} size="sm" id="verify-title" className="flex items-center gap-2">
          <MailCheck aria-hidden className="size-5 text-primary" />
          {t('auth.verify.title')}
        </Heading>
        <Text variant="muted">{t('auth.verify.hint', { email: user.email })}</Text>
        {resend.isSuccess ? <Text role="status">{t('auth.verify.resent')}</Text> : null}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            loading={resend.isPending}
            onClick={() => {
              resend.mutate();
            }}
          >
            {t('auth.verify.resend')}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            loading={refresh.isPending}
            onClick={() => {
              refresh.mutate();
            }}
          >
            {t('auth.verify.check')}
          </Button>
        </div>
      </section>
    );
  }

  if (!invitations.data?.length) return null;
  return (
    <section aria-labelledby="invitations-title" className="flex flex-col gap-2">
      <Heading level={2} size="sm" id="invitations-title">
        {t('invitations.title')}
      </Heading>
      <ul className="flex flex-col gap-2">
        {invitations.data.map((invitation) => (
          <li
            key={`${invitation.businessId}-${invitation.id}`}
            className="flex items-center justify-between gap-2 rounded-md border border-border p-3"
          >
            <Text as="span" variant="small">
              {t('invitations.item', {
                business: invitation.businessName,
                role: t(`role.${invitation.role}`),
              })}
            </Text>
            <Button
              size="sm"
              loading={accept.isPending}
              onClick={() => {
                accept.mutate(
                  { invitation, user },
                  {
                    onSuccess: () => {
                      onAccepted(invitation.businessId);
                    },
                  },
                );
              }}
            >
              {t('invitations.accept')}
            </Button>
          </li>
        ))}
      </ul>
      {accept.error ? (
        <Text variant="danger" role="alert">
          {errorMessage(accept.error)}
        </Text>
      ) : null}
    </section>
  );
}
