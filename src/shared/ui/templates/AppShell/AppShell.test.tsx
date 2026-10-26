import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppShell } from './AppShell';

describe('AppShell', () => {
  it('compone barra superior, navegación, contenido y enlace para saltar', () => {
    render(
      <AppShell
        sidebar={<nav aria-label="Principal">nav</nav>}
        topBar={<header>barra</header>}
        mobileNavOpen={false}
        onMobileNavOpenChange={vi.fn()}
      >
        <p>Contenido</p>
      </AppShell>,
    );
    expect(screen.getByRole('main')).toHaveTextContent('Contenido');
    expect(screen.getByRole('banner')).toHaveTextContent('barra');
    expect(screen.getByRole('link', { name: 'Saltar al contenido' })).toHaveAttribute(
      'href',
      '#main-content',
    );
  });

  it('en móvil muestra la navegación en un cajón', () => {
    render(
      <AppShell sidebar={<p>ítems</p>} topBar={null} mobileNavOpen onMobileNavOpenChange={vi.fn()}>
        <p>Contenido</p>
      </AppShell>,
    );
    expect(screen.getByRole('dialog', { name: 'Menú' })).toHaveTextContent('ítems');
  });
});
