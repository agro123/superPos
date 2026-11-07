import { UsersRound } from 'lucide-react';
import { t } from '@/shared/lib/i18n';
import { Avatar, EmptyState, Skeleton } from '@/shared/ui';
import { maskEmail, type TerminalWorker } from '../domain/worker';

export interface WorkerPickerProps {
  workers: readonly TerminalWorker[];
  loading: boolean;
  onPick: (worker: TerminalWorker) => void;
}

/** Selección de perfil en el terminal: nombre, iniciales y email enmascarado. */
export function WorkerPicker({ workers, loading, onPick }: WorkerPickerProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-3">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-32" />
        ))}
      </div>
    );
  }
  if (workers.length === 0) {
    return <EmptyState icon={<UsersRound />} title={t('terminal.noWorkers')} />;
  }
  return (
    <ul
      aria-label={t('terminal.workers')}
      className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-3"
    >
      {workers.map((worker) => (
        <li key={worker.id}>
          <button
            type="button"
            onClick={() => {
              onPick(worker);
            }}
            className="flex min-h-32 w-full flex-col items-center justify-center gap-2 rounded-lg border border-border bg-surface p-4 text-center shadow-sm transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-primary"
          >
            <span aria-hidden>
              <Avatar name={worker.displayName} size="lg" />
            </span>
            <span className="text-base font-medium text-text">{worker.displayName}</span>
            <span className="text-xs text-text-muted">{maskEmail(worker.email)}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
