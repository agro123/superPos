/**
 * Autorización basada en permisos (docs/product/roles-and-permissions.md).
 * IMPORTANTE: `firestore.rules` replica esta tabla; `permissions.test.ts` verifica que coincidan.
 * Las comprobaciones de la UI son solo experiencia de usuario: la barrera real son las reglas.
 */
export const PERMISSIONS = [
  'sales.create',
  'sales.view',
  'sales.void',
  'cash.open',
  'cash.close',
  'catalog.manage',
  'inventory.view',
  'inventory.adjust',
  'customers.view',
  'customers.manage',
  'reports.view',
  'users.manage',
  'settings.manage',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const ROLES = ['admin', 'employee'] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_PERMISSIONS: Readonly<Record<Role, readonly Permission[]>> = {
  admin: PERMISSIONS,
  employee: [
    'sales.create',
    'sales.view',
    'cash.open',
    'inventory.view',
    'customers.view',
    'customers.manage',
  ],
};

/** Datos mínimos de un miembro para resolver permisos. */
export interface PermissionSubject {
  role: Role;
  extraPermissions: readonly Permission[];
  status: 'active' | 'disabled';
}

/** Permisos efectivos: los del rol más los extra concedidos por un admin. */
export function permissionsOf(subject: PermissionSubject): ReadonlySet<Permission> {
  if (subject.status !== 'active') return new Set();
  return new Set([...ROLE_PERMISSIONS[subject.role], ...subject.extraPermissions]);
}

export function hasPermission(subject: PermissionSubject | null, permission: Permission): boolean {
  return subject !== null && permissionsOf(subject).has(permission);
}

/** Permisos que se pueden conceder como extra a un rol (los que el rol no trae). */
export function grantablePermissions(role: Role): readonly Permission[] {
  return PERMISSIONS.filter((permission) => !ROLE_PERMISSIONS[role].includes(permission));
}
