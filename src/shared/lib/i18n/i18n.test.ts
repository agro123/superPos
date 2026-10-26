import { describe, expect, it } from 'vitest';
import { t } from '.';

describe('t', () => {
  it('devuelve el texto de la clave', () => {
    expect(t('ui.close')).toBe('Cerrar');
  });

  it('interpola parámetros y deja intactos los que faltan', () => {
    expect(t('ui.table.page', { page: 2, pages: 5 })).toBe('Página 2 de 5');
    expect(t('ui.table.page', { page: 2 })).toBe('Página 2 de {pages}');
  });
});
