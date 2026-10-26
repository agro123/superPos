import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Kbd } from './Kbd';

describe('Kbd', () => {
  it('usa el elemento kbd', () => {
    render(<Kbd>F2</Kbd>);
    expect(screen.getByText('F2').tagName).toBe('KBD');
  });
});
