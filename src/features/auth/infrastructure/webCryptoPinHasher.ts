import type { PinCredential, PinHasher } from '../domain/pin';

/** Iteraciones PBKDF2-SHA256 (recomendación OWASP 2023 para SHA-256). */
export const PBKDF2_ITERATIONS = 310_000;
const SALT_BYTES = 16;
const HASH_BITS = 256;

const toBase64 = (bytes: Uint8Array): string => btoa(String.fromCharCode(...bytes));
const fromBase64 = (text: string): Uint8Array<ArrayBuffer> =>
  Uint8Array.from(atob(text), (char) => char.charCodeAt(0));

async function pbkdf2(
  pin: string,
  salt: Uint8Array<ArrayBuffer>,
  iterations: number,
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    key,
    HASH_BITS,
  );
  return new Uint8Array(bits);
}

/** Comparación en tiempo constante para no filtrar información por tiempos. */
function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return diff === 0;
}

/** PIN → PBKDF2 (WebCrypto) con sal aleatoria por usuario (L2). */
export function createWebCryptoPinHasher(iterations = PBKDF2_ITERATIONS): PinHasher {
  return {
    async derive(pin) {
      const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
      const hash = await pbkdf2(pin, salt, iterations);
      return { algorithm: 'PBKDF2-SHA256', iterations, salt: toBase64(salt), hash: toBase64(hash) };
    },
    async verify(pin, credential: PinCredential) {
      const hash = await pbkdf2(pin, fromBase64(credential.salt), credential.iterations);
      return constantTimeEqual(hash, fromBase64(credential.hash));
    },
  };
}
