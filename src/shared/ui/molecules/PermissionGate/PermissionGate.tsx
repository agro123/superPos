import type { ReactNode } from 'react';

export interface PermissionGateProps {
  /** Resultado ya resuelto de la comprobación de permiso. */
  allowed: boolean;
  /** Qué mostrar si no hay permiso (por defecto, nada). */
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Muestra u oculta contenido según un permiso ya resuelto. Es solo experiencia de usuario:
 * la barrera real son las Security Rules. El `<Can>` de `features/users` lo conecta a la sesión.
 */
export function PermissionGate({ allowed, fallback = null, children }: PermissionGateProps) {
  return <>{allowed ? children : fallback}</>;
}
