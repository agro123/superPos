import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SyncStatusBadge } from './SyncStatusBadge';

describe('SyncStatusBadge', () => {
  it.each([
    ['online', 0, 'En línea'],
    ['offline', 3, 'Sin conexión · 3'],
    ['syncing', 2, 'Sincronizando 2 cambios'],
    ['syncing', null, 'Sincronizando…'],
    ['error', 1, 'Error de sincronización'],
  ] as const)('estado %s con %s pendientes', (state, pending, label) => {
    render(<SyncStatusBadge state={state} pendingCount={pending} />);
    expect(screen.getByRole('status')).toHaveTextContent(label);
  });
});
