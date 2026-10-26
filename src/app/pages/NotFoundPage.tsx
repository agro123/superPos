import { SearchX } from 'lucide-react';
import { Link } from 'react-router';
import { t } from '@/shared/lib/i18n';
import { Button, EmptyState } from '@/shared/ui';

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60dvh] items-center justify-center p-4">
      <h1 className="sr-only">{t('notFound.title')}</h1>
      <EmptyState
        icon={<SearchX />}
        title={t('notFound.title')}
        description={t('notFound.hint')}
        action={
          <Button asChild>
            <Link to="/">{t('notFound.home')}</Link>
          </Button>
        }
      />
    </div>
  );
}
