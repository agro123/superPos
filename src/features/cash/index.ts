/** API pública de la feature cash (turnos de caja). */
export { useCurrentShift } from './application/useCash';

export const cashPages = {
  cash: () => import('./pages/CashPage'),
};
