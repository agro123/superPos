import { describe, expect, it } from 'vitest';
import { assignmentOf, roleChoiceOf, ROLE_PRESETS } from './customRole';
import { hasPermission } from './permissions';

const roles = [{ id: 'inv', permissions: ['inventory.view', 'inventory.adjust'] as const }].map(
  (r) => ({
    ...r,
    permissions: [...r.permissions],
  }),
);

describe('roles personalizados', () => {
  it('asigna los permisos del rol y nada más', () => {
    const assignment = assignmentOf('custom:inv', roles);
    expect(assignment).toEqual({
      role: 'custom',
      customRoleId: 'inv',
      extraPermissions: ['inventory.view', 'inventory.adjust'],
    });
    const member = { ...assignment!, status: 'active' as const };
    expect(hasPermission(member, 'inventory.adjust')).toBe(true);
    expect(hasPermission(member, 'sales.create')).toBe(false);
  });

  it('volver a empleado conserva solo extras que el rol no trae; admin no necesita extras', () => {
    expect(
      assignmentOf('employee', roles, ['sales.create', 'sales.void'])?.extraPermissions,
    ).toEqual(['sales.void']);
    expect(assignmentOf('admin', roles, ['sales.void'])?.extraPermissions).toEqual([]);
    expect(assignmentOf('custom:borrado', roles)).toBeNull();
  });

  it('opciones del selector y plantillas válidas', () => {
    expect(roleChoiceOf('custom', 'inv')).toBe('custom:inv');
    expect(roleChoiceOf('employee', null)).toBe('employee');
    expect(ROLE_PRESETS.every((preset) => preset.permissions.length > 0)).toBe(true);
  });
});
