import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/shared/ui';

export interface CatalogQrProps {
  url: string;
  /** Texto alternativo (nombre del catálogo). */
  label: string;
  size?: number;
}

/** QR del enlace del catálogo, con fondo blanco para que lo lea cualquier cámara. */
export function CatalogQr({ url, label, size = 280 }: CatalogQrProps) {
  const [image, setImage] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    void QRCode.toDataURL(url, { margin: 2, width: size * 2 }).then((data) => {
      if (!cancelled) setImage(data);
    });
    return () => {
      cancelled = true;
    };
  }, [url, size]);
  return image ? (
    <img
      src={image}
      alt={label}
      style={{ width: size, height: size }}
      className="rounded-lg bg-white p-2"
    />
  ) : (
    <Skeleton style={{ width: size, height: size }} />
  );
}
