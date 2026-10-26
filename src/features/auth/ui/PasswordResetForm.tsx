import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { errorMessage } from '@/shared/lib/errorMessage';
import { t } from '@/shared/lib/i18n';
import { Button, FormField, Input, Text } from '@/shared/ui';
import { usePasswordReset } from '../application/useAuthActions';
import { passwordResetInputSchema } from '../domain/credentials';

export interface PasswordResetFormProps {
  onBack: () => void;
  disabled?: boolean;
}

export function PasswordResetForm({ onBack, disabled = false }: PasswordResetFormProps) {
  const reset = usePasswordReset();
  const form = useForm({
    resolver: zodResolver(passwordResetInputSchema),
    defaultValues: { email: '' },
  });

  return (
    <form
      noValidate
      aria-label={t('auth.reset.title')}
      className="flex flex-col gap-4"
      onSubmit={form.handleSubmit((values) => {
        reset.mutate(values);
      })}
    >
      <Text variant="muted">{t('auth.reset.description')}</Text>
      <FormField label={t('auth.field.email')} error={form.formState.errors.email?.message}>
        {(control) => (
          <Input {...control} type="email" autoComplete="email" {...form.register('email')} />
        )}
      </FormField>
      {reset.isSuccess ? <Text role="status">{t('auth.reset.sent')}</Text> : null}
      {reset.error ? (
        <Text variant="danger" role="alert">
          {errorMessage(reset.error)}
        </Text>
      ) : null}
      <Button type="submit" size="lg" fullWidth loading={reset.isPending} disabled={disabled}>
        {t('auth.reset.submit')}
      </Button>
      <Button variant="ghost" onClick={onBack}>
        {t('auth.reset.back')}
      </Button>
    </form>
  );
}
