import { useEffect, useRef, useState } from 'react';
import { t } from '@/shared/lib/i18n';
import { Button, Text } from '@/shared/ui';

interface DetectedCode {
  rawValue: string;
}
interface BarcodeDetectorLike {
  detect: (source: HTMLVideoElement) => Promise<DetectedCode[]>;
}
type BarcodeDetectorCtor = new (options: { formats: string[] }) => BarcodeDetectorLike;

function isDetectorCtor(value: unknown): value is BarcodeDetectorCtor {
  return typeof value === 'function';
}

/** `BarcodeDetector` nativo (Chrome/Android); sin él se teclea el código. */
function detectorCtor(): BarcodeDetectorCtor | null {
  const ctor: unknown = Reflect.get(window, 'BarcodeDetector');
  return isDetectorCtor(ctor) ? ctor : null;
}

export interface QrScannerProps {
  onDetected: (text: string) => void;
}

/** Lector de QR con la cámara trasera. Se detiene al leer un código o al cerrarlo. */
export function QrScanner({ onDetected }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Ref: un callback nuevo en cada render del padre no debe reiniciar la cámara.
  const onDetectedRef = useRef(onDetected);
  useEffect(() => {
    onDetectedRef.current = onDetected;
  });
  const Detector = detectorCtor();

  useEffect(() => {
    if (!active || !Detector) return;
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setInterval> | undefined;
    const detector = new Detector({ formats: ['qr_code'] });
    void navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then(async (media) => {
        stream = media;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = media;
        await video.play();
        timer = setInterval(() => {
          void detector.detect(video).then((codes) => {
            const first = codes[0];
            if (first) {
              setActive(false);
              onDetectedRef.current(first.rawValue);
            }
          });
        }, 400);
      })
      .catch(() => {
        setError(t('terminals.cameraError'));
        setActive(false);
      });
    return () => {
      clearInterval(timer);
      stream?.getTracks().forEach((track) => {
        track.stop();
      });
    };
  }, [active, Detector]);

  if (!Detector) return <Text variant="caption">{t('terminals.scanUnsupported')}</Text>;
  return (
    <div className="flex flex-col gap-2">
      {active ? (
        <video
          ref={videoRef}
          muted
          playsInline
          className="bg-black aspect-square w-full rounded-lg object-cover"
        />
      ) : null}
      <Button
        variant="outline"
        onClick={() => {
          setError(null);
          setActive((value) => !value);
        }}
      >
        {active ? t('terminals.scanStop') : t('terminals.scan')}
      </Button>
      {error ? (
        <Text variant="caption" role="alert">
          {error}
        </Text>
      ) : null}
    </div>
  );
}
