import { useState } from 'react';
import { t } from '@/shared/lib/i18n';
import { Avatar, Button, FormField, Input, Text } from '@/shared/ui';
import type { TerminalWorker } from '../domain/worker';

export interface WorkerLoginFormProps {
  worker: TerminalWorker;
  submitting: boolean;
  /** Mensaje de error ya traducido (contraseña incorrecta, bloqueo temporal…). */
  error: string | null;
  /** Segundos de bloqueo restantes; mientras sea > 0 no se puede intentar. */
  lockedSeconds: number;
  onSubmit: (password: string) => void;
  onBack: () => void;
}

/** Contraseña del trabajador elegido. PIN/QR personal requieren servidor (documentado). */
export function WorkerLoginForm({
  worker,
  submitting,
  error,
  lockedSeconds,
  onSubmit,
  onBack,
}: WorkerLoginFormProps) {
  const [password, setPassword] = useState('');
  const locked = lockedSeconds > 0;
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (!password || locked) return;
        onSubmit(password);
        setPassword('');
      }}
      className="mx-auto flex w-full max-w-sm flex-col gap-4"
    >
      <div className="flex flex-col items-center gap-2">
        <Avatar name={worker.displayName} size="lg" />
        <Text variant="strong">{worker.displayName}</Text>
      </div>
      <FormField
        label={t('terminal.passwordFor', { name: worker.displayName })}
        error={
          locked
            ? t('terminal.lockedFor', { seconds: String(lockedSeconds) })
            : (error ?? undefined)
        }
      >
        {(control) => (
          <Input
            {...control}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
            }}
          />
        )}
      </FormField>
      <Button type="submit" size="lg" fullWidth loading={submitting} disabled={locked || !password}>
        {t('terminal.enter')}
      </Button>
      <Button variant="ghost" fullWidth onClick={onBack}>
        {t('terminal.back')}
      </Button>
      <Text variant="caption" className="text-center">
        {t('terminal.qrLoginSoon')}
      </Text>
    </form>
  );
}
