import { useState } from 'react';
import { useActiveBusiness } from '@/features/business';
import { useTourProgress } from '@/features/setup';
import { hasPermission, useCurrentMember } from '@/features/users';
import { t } from '@/shared/lib/i18n';
import { TourOverlay } from '@/shared/ui';
import { tourFor } from '../tour';

export interface TourLauncherProps {
  /** Abrir a pedido ("Ver el tour otra vez"). */
  replay: boolean;
  onReplayEnd: () => void;
}

/** Muestra el tour una sola vez por persona (y cuando se pide de nuevo desde el menú). */
export function TourLauncher({ replay, onReplayEnd }: TourLauncherProps) {
  const { modules } = useActiveBusiness();
  const member = useCurrentMember();
  const progress = useTourProgress();
  const [index, setIndex] = useState(0);
  // Se cierra al instante; el documento de progreso llega después y apaga `shouldStart`.
  const [closed, setClosed] = useState(false);
  const autoOpen = progress.shouldStart && !closed;
  const steps = tourFor((permission) => hasPermission(member, permission), modules).map((step) => ({
    target: step.target,
    title: t(step.title),
    body: t(step.body),
  }));

  return (
    <TourOverlay
      open={autoOpen || replay}
      steps={steps}
      index={Math.min(index, steps.length - 1)}
      onIndexChange={setIndex}
      onClose={(reason) => {
        if (autoOpen) progress.finish(reason);
        if (autoOpen) setClosed(true);
        setIndex(0);
        onReplayEnd();
      }}
      labels={{
        next: t('tour.next'),
        back: t('tour.back'),
        skip: t('tour.skip'),
        done: t('tour.done'),
        progress: (current, total) =>
          t('tour.progress', { current: String(current), total: String(total) }),
      }}
    />
  );
}
