import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TourOverlay } from './TourOverlay';

const labels = {
  next: 'Siguiente',
  back: 'Atrás',
  skip: 'Saltar tour',
  done: 'Terminar',
  progress: (current: number, total: number) => `Paso ${String(current)} de ${String(total)}`,
};
const steps = [
  { target: 'nav-pos', title: 'Vender', body: 'Aquí cobras.' },
  { title: 'Listo', body: 'Eso es todo.' },
];

describe('TourOverlay', () => {
  it('muestra el paso, avanza, retrocede y termina', async () => {
    const onIndexChange = vi.fn();
    const onClose = vi.fn();
    const { rerender } = render(
      <>
        <button type="button" data-tour="nav-pos">
          Vender
        </button>
        <TourOverlay
          open
          steps={steps}
          index={0}
          onIndexChange={onIndexChange}
          onClose={onClose}
          labels={labels}
        />
      </>,
    );
    const dialog = screen.getByRole('dialog', { name: 'Vender' });
    expect(dialog).toHaveTextContent('Paso 1 de 2');
    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(onIndexChange).toHaveBeenCalledWith(1);

    rerender(
      <TourOverlay
        open
        steps={steps}
        index={1}
        onIndexChange={onIndexChange}
        onClose={onClose}
        labels={labels}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Atrás' }));
    expect(onIndexChange).toHaveBeenCalledWith(0);
    await userEvent.click(screen.getByRole('button', { name: 'Terminar' }));
    expect(onClose).toHaveBeenCalledWith('done');
  });

  it('Esc o "Saltar tour" lo cierran como omitido', async () => {
    const onClose = vi.fn();
    render(
      <TourOverlay
        open
        steps={steps}
        index={0}
        onIndexChange={vi.fn()}
        onClose={onClose}
        labels={labels}
      />,
    );
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledWith('skipped');
  });
});
