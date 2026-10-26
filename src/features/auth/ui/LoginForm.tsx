import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { errorMessage } from '@/shared/lib/errorMessage';
import { t } from '@/shared/lib/i18n';
import { Button, FormField, Input, Text } from '@/shared/ui';
import { useSignIn } from '../application/useAuthActions';
import { loginInputSchema } from '../domain/credentials';

export interface LoginFormProps {
  disabled?: boolean;
}

export function LoginForm({ disabled = false }: LoginFormProps) {
  const signIn = useSignIn();
  const form = useForm({
    resolver: zodResolver(loginInputSchema),
    defaultValues: { email: '', password: '' },
  });
  const { errors } = form.formState;

  return (
    <form
      noValidate
      aria-label={t('auth.login.tab')}
      className="flex flex-col gap-4"
      onSubmit={form.handleSubmit((values) => {
        signIn.mutate(values);
      })}
    >
      <FormField label={t('auth.field.email')} error={errors.email?.message}>
        {(control) => (
          <Input
            {...control}
            type="email"
            autoComplete="email"
            inputMode="email"
            {...form.register('email')}
          />
        )}
      </FormField>
      <FormField label={t('auth.field.password')} error={errors.password?.message}>
        {(control) => (
          <Input
            {...control}
            type="password"
            autoComplete="current-password"
            {...form.register('password')}
          />
        )}
      </FormField>
      {signIn.error ? (
        <Text variant="danger" role="alert">
          {errorMessage(signIn.error)}
        </Text>
      ) : null}
      <Button type="submit" size="lg" fullWidth loading={signIn.isPending} disabled={disabled}>
        {t('auth.login.submit')}
      </Button>
    </form>
  );
}
