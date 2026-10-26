import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PermissionGate } from './PermissionGate';

describe('PermissionGate', () => {
  it('muestra el contenido o el fallback', () => {
    const { rerender } = render(
      <PermissionGate allowed fallback={<span>Sin acceso</span>}>
        <span>Anular venta</span>
      </PermissionGate>,
    );
    expect(screen.getByText('Anular venta')).toBeInTheDocument();
    rerender(
      <PermissionGate allowed={false} fallback={<span>Sin acceso</span>}>
        <span>Anular venta</span>
      </PermissionGate>,
    );
    expect(screen.queryByText('Anular venta')).not.toBeInTheDocument();
    expect(screen.getByText('Sin acceso')).toBeInTheDocument();
  });
});
