import { Dialog } from 'radix-ui';
import { useLayoutEffect, useState } from 'react';
import { cn } from '@/shared/lib/cn';
import { Button } from '../../atoms/Button';

export interface TourStep {
  /** Valor del atributo `data-tour` del elemento a resaltar; sin él, el globo va centrado. */
  target?: string;
  title: string;
  body: string;
}

export interface TourOverlayProps {
  open: boolean;
  steps: readonly TourStep[];
  index: number;
  onIndexChange: (index: number) => void;
  /** Al terminar (`done`) o al salir (`skipped`). */
  onClose: (reason: 'done' | 'skipped') => void;
  labels: {
    next: string;
    back: string;
    skip: string;
    done: string;
    progress: (current: number, total: number) => string;
  };
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PAD = 6;

/** Primer elemento visible con `data-tour` (en móvil la barra inferior, en escritorio la lateral). */
function findTarget(target: string | undefined): HTMLElement | null {
  if (!target) return null;
  const all = document.querySelectorAll<HTMLElement>(`[data-tour="${target}"]`);
  return [...all].find((el) => el.getClientRects().length > 0) ?? null;
}

/**
 * Tour guiado: resalta un elemento real de la pantalla y explica para qué sirve. Diálogo modal
 * (foco atrapado, Esc para salir) sin dependencias; respeta `prefers-reduced-motion`.
 */
export function TourOverlay({
  open,
  steps,
  index,
  onIndexChange,
  onClose,
  labels,
}: TourOverlayProps) {
  const step = steps[index];
  const [rect, setRect] = useState<Rect | null>(null);

  useLayoutEffect(() => {
    if (!open) return;
    const measure = () => {
      const el = findTarget(step?.target);
      if (!el) {
        setRect(null);
        return;
      }
      el.scrollIntoView({ block: 'nearest' });
      const r = el.getBoundingClientRect();
      setRect({
        top: r.top - PAD,
        left: r.left - PAD,
        width: r.width + PAD * 2,
        height: r.height + PAD * 2,
      });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('resize', measure);
    };
  }, [open, step?.target]);

  if (!step) return null;
  const last = index === steps.length - 1;
  // El globo va debajo del elemento si cabe; si no, encima. Sin elemento, centrado.
  const below = rect ? rect.top + rect.height + 220 < window.innerHeight : true;
  const style = rect
    ? {
        top: below ? rect.top + rect.height + 12 : undefined,
        bottom: below ? undefined : window.innerHeight - rect.top + 12,
        left: Math.min(Math.max(16, rect.left), Math.max(16, window.innerWidth - 336)),
      }
    : undefined;

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose('skipped');
      }}
    >
      <Dialog.Portal>
        {rect ? (
          <div
            aria-hidden
            className="pointer-events-none fixed z-(--sp-z-overlay) rounded-lg shadow-[0_0_0_9999px_var(--color-overlay)] ring-2 ring-primary transition-all duration-(--sp-duration-base) motion-reduce:transition-none"
            style={rect}
          />
        ) : (
          <Dialog.Overlay className="fixed inset-0 z-(--sp-z-overlay) bg-overlay" />
        )}
        <Dialog.Content
          style={style}
          className={cn(
            'fixed z-(--sp-z-modal) flex w-[min(20rem,calc(100%-2rem))] flex-col gap-3 rounded-lg bg-surface p-4 shadow-lg',
            !rect && 'top-1/2 left-1/2 -translate-1/2',
          )}
        >
          <p className="text-xs font-medium text-text-muted">
            {labels.progress(index + 1, steps.length)}
          </p>
          <Dialog.Title className="text-lg font-semibold text-text">{step.title}</Dialog.Title>
          <Dialog.Description className="text-sm text-text">{step.body}</Dialog.Description>
          <div className="flex items-center justify-between gap-2 pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onClose('skipped');
              }}
            >
              {labels.skip}
            </Button>
            <div className="flex gap-2">
              {index > 0 ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onIndexChange(index - 1);
                  }}
                >
                  {labels.back}
                </Button>
              ) : null}
              <Button
                size="sm"
                onClick={() => {
                  if (last) onClose('done');
                  else onIndexChange(index + 1);
                }}
              >
                {last ? labels.done : labels.next}
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
