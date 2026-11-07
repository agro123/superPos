import { useState } from 'react';
import { useCurrentUser } from '@/features/auth';
import { t } from '@/shared/lib/i18n';
import { Button, FormField, Input, Modal, Text } from '@/shared/ui';
import { useApprovePairing, useFindPairingRequest } from '../application/useTerminalAdmin';
import { IDLE_LOCK_MINUTES, terminalUpdateSchema, type TerminalUpdate } from '../domain/terminal';
import { QrScanner } from './QrScanner';
import { TerminalFields } from './TerminalFields';

export interface PairTerminalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  businessName: string;
  onPaired: () => void;
}

/**
 * Autorización explícita del admin: leer el QR (o teclear el código) solo encuentra la solicitud;
 * el terminal se activa al confirmar negocio y nombre.
 */
export function PairTerminalDialog({
  open,
  onOpenChange,
  businessId,
  businessName,
  onPaired,
}: PairTerminalDialogProps) {
  const user = useCurrentUser();
  const find = useFindPairingRequest();
  const approve = useApprovePairing();
  const [code, setCode] = useState('');
  const [fields, setFields] = useState<TerminalUpdate>({
    name: '',
    idleLockMinutes: IDLE_LOCK_MINUTES.default,
  });
  const [nameError, setNameError] = useState(false);
  const request = find.data ?? null;

  const close = (next: boolean) => {
    if (!next) {
      find.reset();
      approve.reset();
      setCode('');
      setFields({ name: '', idleLockMinutes: IDLE_LOCK_MINUTES.default });
    }
    onOpenChange(next);
  };
  const authorize = () => {
    const parsed = terminalUpdateSchema.safeParse(fields);
    setNameError(!parsed.success);
    if (!parsed.success || !request) return;
    approve.mutate(
      { businessId, request, update: parsed.data, uid: user.uid },
      {
        onSuccess: () => {
          onPaired();
          close(false);
        },
      },
    );
  };

  return (
    <Modal
      open={open}
      onOpenChange={close}
      title={t('terminals.pair')}
      description={t('terminals.pairDescription')}
      footer={
        request ? (
          <Button loading={approve.isPending} onClick={authorize}>
            {t('terminals.authorize')}
          </Button>
        ) : null
      }
    >
      {request ? (
        <div className="flex flex-col gap-4">
          <Text>{t('terminals.found', { type: t(`terminal.type.${request.deviceType}`) })}</Text>
          <Text variant="strong">{t('terminals.business', { name: businessName })}</Text>
          <TerminalFields value={fields} onChange={setFields} nameError={nameError} />
          {approve.error ? (
            <Text role="alert" className="text-danger">
              {approve.error.code === 'permission_denied'
                ? t('terminals.notFound')
                : t(`errors.${approve.error.code}`)}
            </Text>
          ) : null}
        </div>
      ) : (
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            find.mutate(code);
          }}
        >
          <QrScanner
            onDetected={(text) => {
              setCode(text);
              find.mutate(text);
            }}
          />
          <FormField
            label={t('terminals.code')}
            error={find.error ? t('terminals.notFound') : undefined}
          >
            {(control) => (
              <Input
                {...control}
                autoCapitalize="characters"
                autoComplete="off"
                placeholder="ABCD-EFGH"
                value={code}
                onChange={(event) => {
                  setCode(event.target.value);
                }}
              />
            )}
          </FormField>
          <Button type="submit" variant="outline" loading={find.isPending} disabled={!code}>
            {t('terminals.find')}
          </Button>
        </form>
      )}
    </Modal>
  );
}
