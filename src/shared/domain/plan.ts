/** Planes comerciales (el negocio guarda uno en `businesses/{bid}.plan`). */
export type BusinessPlan = 'free' | 'premium';

/** Qué incluye cada plan (propuesta SmartPOS, modelo freemium). */
export interface PlanLimits {
  /** Cupos de trabajador (sin contar al dueño ni a los admins). */
  workerSeats: number;
  customRoles: boolean;
  /** Más administradores además del dueño. */
  extraAdmins: boolean;
  reports: boolean;
  ai: boolean;
  /** Exportar reportes (Excel, PDF, CSV) y descargar el respaldo completo. */
  exports: boolean;
  /** Días de historial de ventas consultables en la app. */
  historyDays: number;
}

export const PLAN_LIMITS: Readonly<Record<BusinessPlan, PlanLimits>> = {
  free: {
    workerSeats: 1,
    customRoles: false,
    extraAdmins: false,
    reports: false,
    ai: false,
    exports: false,
    historyDays: 30,
  },
  premium: {
    workerSeats: 3,
    customRoles: true,
    extraAdmins: true,
    reports: true,
    ai: true,
    exports: true,
    historyDays: 365,
  },
};

/** Ids de los documentos `seats/{id}` (las reglas aceptan los mismos). */
export const SEAT_IDS = ['1', '2', '3'] as const;
export type SeatId = (typeof SEAT_IDS)[number];

export const seatIdsFor = (plan: BusinessPlan): readonly SeatId[] =>
  SEAT_IDS.slice(0, PLAN_LIMITS[plan].workerSeats);

/** Primer cupo libre del plan, o `null` si están todos ocupados. */
export function firstFreeSeat(plan: BusinessPlan, taken: ReadonlySet<string>): SeatId | null {
  return seatIdsFor(plan).find((id) => !taken.has(id)) ?? null;
}

/** Línea y correo (ficticios) para solicitar un cambio de plan. */
export const PLAN_CONTACT = {
  phone: '+57 (602) 555 0142',
  phoneHref: 'tel:+576025550142',
  email: 'planes@superpos.app',
} as const;
