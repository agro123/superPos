import { describe, expect, it } from 'vitest';
import { BUSINESS_TYPES } from './business';
import { BUSINESS_PRESETS, presetFor } from './presets';

describe('presets por tipo de negocio', () => {
  it.each(BUSINESS_TYPES)(
    '%s: productos en categorías del preset, sin repetidos y válidos',
    (type) => {
      const preset = BUSINESS_PRESETS[type];
      const categories = new Set(preset.categories.map((c) => c.name));
      expect(categories.size).toBe(preset.categories.length);
      expect(preset.sampleProducts.every((p) => categories.has(p.category))).toBe(true);
      expect(new Set(preset.sampleProducts.map((p) => p.name)).size).toBe(
        preset.sampleProducts.length,
      );
      expect(preset.sampleProducts.every((p) => p.price > 0 && p.stock >= 0)).toBe(true);
      expect(preset.paymentMethods).toContain('cash');
      expect(preset.taxes.defaultRateBps).toBeGreaterThanOrEqual(0);
    },
  );

  it('se adapta al tipo: el restaurante activa mesas y sugiere meseros', () => {
    expect(presetFor('restaurant').modules.restaurant).toBe(true);
    expect(presetFor('restaurant').rolePresets).toContain('waiter');
    expect(presetFor('store').modules.restaurant).toBe(false);
    expect(presetFor('cafe').categories.map((c) => c.name)).toContain('Cafés');
  });
});
