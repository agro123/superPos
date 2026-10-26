import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Input } from '../../atoms/Input';
import { FormField } from './FormField';

describe('FormField', () => {
  it('asocia label, ayuda y error con el control', () => {
    render(
      <FormField label="Nombre" hint="Como aparece en el ticket" error="Requerido">
        {(control) => <Input {...control} />}
      </FormField>,
    );
    const input = screen.getByRole('textbox', { name: 'Nombre' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Como aparece en el ticket Requerido');
    expect(screen.getByRole('alert')).toHaveTextContent('Requerido');
  });

  it('marca los campos opcionales', () => {
    render(
      <FormField label="SKU" optional>
        {(control) => <Input {...control} />}
      </FormField>,
    );
    expect(screen.getByText('(Opcional)')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-invalid');
  });
});
