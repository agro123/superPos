import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AuthLayout } from './AuthLayout';

describe('AuthLayout', () => {
  it('muestra título, marca y contenido', () => {
    render(
      <AuthLayout title="Inicia sesión" brand={<span>SuperPOS</span>} footer={<span>Ayuda</span>}>
        <form aria-label="Login" />
      </AuthLayout>,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Inicia sesión' })).toBeInTheDocument();
    expect(screen.getByText('SuperPOS')).toBeInTheDocument();
    expect(screen.getByRole('form', { name: 'Login' })).toBeInTheDocument();
  });
});
