import { z } from 'zod';
import { auditFieldsSchema } from '@/shared/domain/audit';
import { PERMISSIONS, ROLE_PERMISSIONS, type Permission, type Role } from './permissions';

/** `businesses/{bid}/roles/{roleId}`: rol personalizado = nombre + permisos. */
export const customRoleSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().trim().min(2).max(40),
    permissions: z.array(z.enum(PERMISSIONS)).min(1),
  })
  .extend(auditFieldsSchema.shape);
export type CustomRole = z.infer<typeof customRoleSchema>;

export const customRoleInputSchema = customRoleSchema.pick({ name: true, permissions: true });
export type CustomRoleInput = z.infer<typeof customRoleInputSchema>;

/** Plantillas para crear roles habituales (se pueden ajustar antes de guardar). */
export const ROLE_PRESETS: readonly {
  key: 'cashier' | 'stock' | 'waiter' | 'supervisor';
  permissions: Permission[];
}[] = [
  {
    key: 'cashier',
    permissions: [
      'sales.create',
      'sales.view',
      'cash.open',
      'cash.close',
      'customers.view',
      'customers.manage',
    ],
  },
  { key: 'stock', permissions: ['inventory.view', 'inventory.adjust', 'catalog.manage'] },
  { key: 'waiter', permissions: ['sales.create', 'sales.view', 'customers.view'] },
  {
    key: 'supervisor',
    permissions: [
      'sales.create',
      'sales.view',
      'sales.void',
      'cash.open',
      'cash.close',
      'inventory.view',
      'inventory.adjust',
      'customers.view',
      'customers.manage',
      'reports.view',
    ],
  },
];

/** Opción del selector de rol: `admin`, `employee` o `custom:<id>`. */
export const roleChoiceOf = (role: Role, customRoleId: string | null): string =>
  role === 'custom' && customRoleId ? `custom:${customRoleId}` : role;

export interface RoleAssignment {
  role: Role;
  customRoleId: string | null;
  /** Para `custom`, los permisos del rol; para los demás, los extra que se conservan. */
  extraPermissions: Permission[];
}

/** Traduce la opción elegida a lo que se guarda en el miembro o la invitación. */
export function assignmentOf(
  choice: string,
  roles: readonly Pick<CustomRole, 'id' | 'permissions'>[],
  currentExtras: readonly Permission[] = [],
): RoleAssignment | null {
  if (choice === 'admin') return { role: 'admin', customRoleId: null, extraPermissions: [] };
  if (choice === 'employee') {
    const base = new Set(ROLE_PERMISSIONS.employee);
    return {
      role: 'employee',
      customRoleId: null,
      extraPermissions: currentExtras.filter((p) => !base.has(p)),
    };
  }
  const role = roles.find((r) => `custom:${r.id}` === choice);
  return role
    ? { role: 'custom', customRoleId: role.id, extraPermissions: [...role.permissions] }
    : null;
}
