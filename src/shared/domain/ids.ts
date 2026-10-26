/** Identificador de documento generado en cliente (`doc(collection(...)).id`). */
export type EntityId = string;

const ENTITY_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

/** Valida un id seguro para usar como segmento de ruta en Firestore. */
export function isValidEntityId(value: string): value is EntityId {
  return ENTITY_ID_PATTERN.test(value);
}

/** Código corto de dispositivo, usado en la numeración local de ventas (ADR 0006). */
export const DEVICE_CODE_PATTERN = /^[A-Z0-9]{2,6}$/;
