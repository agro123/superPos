import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Text } from './Text';

describe('Text', () => {
  it('renderiza el elemento y la variante indicados', () => {
    render(
      <Text as="span" variant="muted">
        Hola
      </Text>,
    );
    const element = screen.getByText('Hola');
    expect(element.tagName).toBe('SPAN');
    expect(element).toHaveClass('text-text-muted');
  });
});
