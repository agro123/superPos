/** Zonas horarias ofrecidas en el onboarding (IANA). */
export const TIME_ZONES = [
  'America/Bogota',
  'America/Mexico_City',
  'America/Lima',
  'America/Santiago',
  'America/Guayaquil',
  'America/Caracas',
  'America/Argentina/Buenos_Aires',
  'America/New_York',
  'Europe/Madrid',
] as const;

/** Tasas por defecto ofrecidas en el onboarding, en puntos básicos. */
export const DEFAULT_TAX_OPTIONS = [
  { rateBps: 1900, key: 'tax.iva19' },
  { rateBps: 500, key: 'tax.iva5' },
  { rateBps: 0, key: 'tax.exempt' },
] as const;
