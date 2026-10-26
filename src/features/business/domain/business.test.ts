import { describe, expect, it } from 'vitest';
import { onboardingInputSchema } from './business';
import { defaultModulesFor, defaultTaxRates } from './settings';

describe('onboarding', () => {
  const valid = {
    name: '  Café La Esquina ',
    type: 'cafe',
    currency: 'COP',
    timezone: 'America/Bogota',
    defaultTaxRateBps: 1900,
    pricesIncludeTax: true,
  };

  it('valida y normaliza el formulario', () => {
    expect(onboardingInputSchema.parse(valid).name).toBe('Café La Esquina');
  });

  it('rechaza nombres cortos, zonas horarias inválidas y tasas fuera de rango', () => {
    expect(onboardingInputSchema.safeParse({ ...valid, name: 'A' }).success).toBe(false);
    expect(onboardingInputSchema.safeParse({ ...valid, timezone: 'Nada/Nada' }).success).toBe(
      false,
    );
    expect(onboardingInputSchema.safeParse({ ...valid, defaultTaxRateBps: 20000 }).success).toBe(
      false,
    );
  });
});

describe('configuración por defecto', () => {
  it('activa el módulo restaurante solo para restaurantes', () => {
    expect(defaultModulesFor('restaurant').restaurant).toBe(true);
    expect(defaultModulesFor('store').restaurant).toBe(false);
  });

  it('incluye IVA 19 %, 5 % y exento', () => {
    expect(defaultTaxRates().map((rate) => rate.rateBps)).toEqual([1900, 500, 0]);
  });
});
