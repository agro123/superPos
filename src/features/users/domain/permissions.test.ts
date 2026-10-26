import { describe, expect, it } from 'vitest';
import {
  grantablePermissions,
  hasPermission,
  PERMISSIONS,
  permissionsOf,
  ROLE_PERMISSIONS,
  type PermissionSubject,
} from './permissions';
import rules from '../../../../firestore.rules?raw';

const employee: PermissionSubject = { role: 'employee', extraPermissions: [], status: 'active' };

describe('permisos', () => {
  it('el admin tiene todos los permisos', () => {
    const admin: PermissionSubject = { role: 'admin', extraPermissions: [], status: 'active' };
    expect(PERMISSIONS.every((p) => hasPermission(admin, p))).toBe(true);
  });

  it('el empleado vende pero no gestiona catálogo ni anula', () => {
    expect(hasPermission(employee, 'sales.create')).toBe(true);
    expect(hasPermission(employee, 'catalog.manage')).toBe(false);
    expect(hasPermission(employee, 'sales.void')).toBe(false);
  });

  it('los permisos extra se suman al rol', () => {
    expect(hasPermission({ ...employee, extraPermissions: ['sales.void'] }, 'sales.void')).toBe(
      true,
    );
  });

  it('un miembro desactivado o ausente no tiene permisos', () => {
    expect(permissionsOf({ ...employee, status: 'disabled' }).size).toBe(0);
    expect(hasPermission(null, 'sales.view')).toBe(false);
  });

  it('solo se conceden como extra los permisos que el rol no trae', () => {
    expect(grantablePermissions('admin')).toEqual([]);
    expect(grantablePermissions('employee')).toContain('sales.void');
    expect(grantablePermissions('employee')).not.toContain('sales.create');
  });
});

describe('sincronía con firestore.rules', () => {
  const listIn = (fn: string): string[] => {
    const match = new RegExp(`function ${fn}\\(\\) \\{\\s*return \\[([^\\]]*)\\]`).exec(rules);
    return (match?.[1] ?? '')
      .split(',')
      .map((item) => item.trim().replace(/'/g, ''))
      .filter(Boolean);
  };

  it('las listas de permisos por rol coinciden con ROLE_PERMISSIONS', () => {
    expect(listIn('adminPermissions')).toEqual([...ROLE_PERMISSIONS.admin]);
    expect(listIn('employeePermissions')).toEqual([...ROLE_PERMISSIONS.employee]);
  });
});
