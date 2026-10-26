/** Usuario autenticado (Firebase Auth), reducido a lo que la app necesita. */
export interface SessionUser {
  uid: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
  /**
   * Super administrador de la plataforma (custom claim `platformAdmin`, ADR 0010).
   * Solo habilita pantallas: las reglas validan el claim en cada operación.
   */
  platformAdmin: boolean;
}

export type SessionStatus = 'loading' | 'signedOut' | 'signedIn';
