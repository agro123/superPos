import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Tabs } from './Tabs';

describe('Tabs', () => {
  it('cambia de panel al seleccionar una pestaña', async () => {
    render(
      <Tabs
        label="Catálogo"
        items={[
          { value: 'products', label: 'Productos', content: <p>Lista de productos</p> },
          { value: 'categories', label: 'Categorías', content: <p>Lista de categorías</p> },
        ]}
      />,
    );
    expect(screen.getByText('Lista de productos')).toBeVisible();
    await userEvent.click(screen.getByRole('tab', { name: 'Categorías' }));
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Lista de categorías');
  });
});
