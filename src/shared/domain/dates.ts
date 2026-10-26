/** Fecha-hora ISO 8601 en UTC (`2026-01-31T15:04:05.000Z`). Se guarda así; la zona horaria es solo de presentación (L11). */
export type IsoDateTime = string;

export function toIsoUtc(date: Date): IsoDateTime {
  return date.toISOString();
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** Inicio del día (00:00) en la zona horaria del negocio, expresado como instante UTC. */
export function startOfDayInZone(instant: Date, timeZone: string): Date {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(instant);
  const get = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);
  const elapsedMs =
    ((get('hour') * 60 + get('minute')) * 60 + get('second')) * 1000 + instant.getUTCMilliseconds();
  return new Date(instant.getTime() - elapsedMs);
}
