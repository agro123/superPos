import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('ejecuta onClick y es de tipo button por defecto', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Cobrar</Button>);
    const button = screen.getByRole('button', { name: 'Cobrar' });
    expect(button).toHaveAttribute('type', 'button');
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('en estado loading se deshabilita y marca aria-busy', async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Guardar
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Guardar' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('con asChild renderiza el elemento hijo', () => {
    render(
      <Button asChild>
        <a href="/pos">Ir</a>
      </Button>,
    );
    expect(screen.getByRole('link', { name: 'Ir' })).toHaveAttribute('href', '/pos');
  });
});
