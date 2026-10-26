import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { errorMessage } from '@/shared/lib/errorMessage';
import { t } from '@/shared/lib/i18n';
import { Button, FormField, Input, Text } from '@/shared/ui';
import { useSignUp } from '../application/useAuthActions';
import { signUpInputSchema } from '../domain/credentials';

export interface SignUpFormProps {
  disabled?: boolean;
}

export function SignUpForm({ disabled = false }: SignUpFormProps) {
  const signUp = useSignUp();
  const form = useForm({
    resolver: zodResolver(signUpInputSchema),
    defaultValues: { displayName: '', email: '', password: '' },
  });
  const { errors } = form.formState;

  return (
    <form
      noValidate
      aria-label={t('auth.signup.tab')}
      className="flex flex-col gap-4"
      onSubmit={form.handleSubmit((values) => {
        signUp.mutate(values);
      })}
    >
      <FormField label={t('auth.field.displayName')} error={errors.displayName?.message}>
        {(control) => <Input {...control} autoComplete="name" {...form.register('displayName')} />}
      </FormField>
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
      <FormField
        label={t('auth.field.password')}
        hint={t('auth.field.passwordHint')}
        error={errors.password?.message}
      >
        {(control) => (
          <Input
            {...control}
            type="password"
            autoComplete="new-password"
            {...form.register('password')}
          />
        )}
      </FormField>
      {signUp.error ? (
        <Text variant="danger" role="alert">
          {errorMessage(signUp.error)}
        </Text>
      ) : null}
      <Button type="submit" size="lg" fullWidth loading={signUp.isPending} disabled={disabled}>
        {t('auth.signup.submit')}
      </Button>
    </form>
  );
}
