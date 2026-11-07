import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import { t } from '@/shared/lib/i18n';
import { Badge, Button, Skeleton, Text } from '@/shared/ui';
import { PAIRING_QR_PREFIX, type PairingState } from '../domain/pairing';

export interface PairingPanelProps {
  code: string;
  state: PairingState;
  expiresAt: Date | null;
  now: Date;
  renewing: boolean;
  onRenew: () => void;
}

const TONES = {
  pending: 'info',
  expired: 'warning',
  approved: 'success',
  cancelled: 'neutral',
} as const;

function remaining(expiresAt: Date, now: Date): string {
  const seconds = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / 1000));
  return `${String(Math.floor(seconds / 60))}:${String(seconds % 60).padStart(2, '0')}`;
}

/** QR temporal de vinculación: solo lleva el código aleatorio, nunca datos del negocio. */
export function PairingPanel({
  code,
  state,
  expiresAt,
  now,
  renewing,
  onRenew,
}: PairingPanelProps) {
  const [qr, setQr] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    void QRCode.toDataURL(`${PAIRING_QR_PREFIX}${code}`, { margin: 1, width: 240 }).then((url) => {
      if (!cancelled) setQr(url);
    });
    return () => {
      cancelled = true;
    };
  }, [code]);
  const usable = state === 'pending';

  return (
    <section aria-labelledby="pair-title" className="flex flex-col items-center gap-4 text-center">
      <h2 id="pair-title" className="text-xl font-semibold text-text">
        {t('terminal.pairTitle')}
      </h2>
      <Text variant="muted">{t('terminal.pairHint')}</Text>
      <div className={usable ? undefined : 'opacity-30'}>
        {qr ? (
          <img
            src={qr}
            alt={t('terminal.qrAlt', { code })}
            className="size-60 rounded-lg border border-border bg-white p-2"
          />
        ) : (
          <Skeleton className="size-60" />
        )}
      </div>
      <p className="flex flex-col gap-1">
        <span className="text-sm text-text-muted">{t('terminal.pairCode')}</span>
        <span className="text-3xl font-mono font-semibold tracking-widest text-text">{code}</span>
      </p>
      <div role="status" className="flex flex-col items-center gap-1">
        <Badge tone={TONES[state]}>{t(`terminal.state.${state}`)}</Badge>
        {usable && expiresAt ? (
          <Text variant="caption">
            {t('terminal.expiresIn', { time: remaining(expiresAt, now) })}
          </Text>
        ) : null}
      </div>
      <Button variant={usable ? 'outline' : 'primary'} loading={renewing} onClick={onRenew}>
        {t('terminal.renew')}
      </Button>
    </section>
  );
}
