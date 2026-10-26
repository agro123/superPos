import { Ban, CircleCheck, Trash2 } from 'lucide-react';
import type { BusinessStatus } from '@/features/business';
import { t } from '@/shared/lib/i18n';
import { Badge } from '@/shared/ui';

const ICONS = {
  active: <CircleCheck aria-hidden />,
  blocked: <Ban aria-hidden />,
  deleted: <Trash2 aria-hidden />,
} as const;

const TONES = { active: 'success', blocked: 'warning', deleted: 'danger' } as const;

/** Estado operativo del negocio, con ícono y texto. */
export function StatusBadge({ status }: { status: BusinessStatus }) {
  return (
    <Badge tone={TONES[status]} icon={ICONS[status]}>
      {t(`businessStatus.${status}`)}
    </Badge>
  );
}
