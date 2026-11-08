import { render, renderHook, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { CurrentMemberContext, usePermission } from '../application/memberContext';
import type { Member } from '../domain/member';
import { Can } from './Can';

const member = (overrides: Partial<Member> = {}): Member => ({
  id: 'u1',
  displayName: 'Carlos',
  email: 'carlos@example.co',
  role: 'employee',
  extraPermissions: [],
  status: 'active',
  customRoleId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'owner',
  schemaVersion: 1,
  ...overrides,
});

const withMember = (value: Member | null) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return <CurrentMemberContext.Provider value={value}>{children}</CurrentMemberContext.Provider>;
  };

describe('usePermission', () => {
  it('resuelve con el rol y los permisos extra del miembro', () => {
    expect(
      renderHook(() => usePermission('sales.create'), { wrapper: withMember(member()) }).result
        .current,
    ).toBe(true);
    expect(
      renderHook(() => usePermission('catalog.manage'), { wrapper: withMember(member()) }).result
        .current,
    ).toBe(false);
    expect(
      renderHook(() => usePermission('catalog.manage'), {
        wrapper: withMember(member({ extraPermissions: ['catalog.manage'] })),
      }).result.current,
    ).toBe(true);
  });

  it('sin miembro (fuera de un negocio) no hay permisos', () => {
    expect(
      renderHook(() => usePermission('sales.view'), { wrapper: withMember(null) }).result.current,
    ).toBe(false);
  });
});

describe('<Can>', () => {
  it('muestra el contenido solo con el permiso', () => {
    const { rerender } = render(
      <CurrentMemberContext.Provider value={member({ role: 'admin' })}>
        <Can permission="sales.void" fallback={<span>Sin permiso</span>}>
          <button type="button">Anular</button>
        </Can>
      </CurrentMemberContext.Provider>,
    );
    expect(screen.getByRole('button', { name: 'Anular' })).toBeInTheDocument();
    rerender(
      <CurrentMemberContext.Provider value={member()}>
        <Can permission="sales.void" fallback={<span>Sin permiso</span>}>
          <button type="button">Anular</button>
        </Can>
      </CurrentMemberContext.Provider>,
    );
    expect(screen.queryByRole('button', { name: 'Anular' })).not.toBeInTheDocument();
    expect(screen.getByText('Sin permiso')).toBeInTheDocument();
  });
});
