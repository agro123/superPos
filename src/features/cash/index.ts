/** API pública de la feature cash (turnos de caja). */
export { useCurrentShift } from './application/useCash';
export { CashByWorkerReport } from './ui/CashByWorkerReport';

export const cashPages = {
  cash: () => import('./pages/CashPage'),
};
