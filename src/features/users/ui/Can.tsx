import type { ReactNode } from 'react';
import { PermissionGate } from '@/shared/ui';
import { usePermission } from '../application/memberContext';
import type { Permission } from '../domain/permissions';

export interface CanProps {
  permission: Permission;
  fallback?: ReactNode;
  children: ReactNode;
}

/** Muestra el contenido solo si el miembro actual tiene el permiso (UX; la barrera real son las reglas). */
export function Can({ permission, fallback, children }: CanProps) {
  return (
    <PermissionGate allowed={usePermission(permission)} fallback={fallback}>
      {children}
    </PermissionGate>
  );
}
