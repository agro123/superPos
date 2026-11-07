/** API pública de la feature terminals (terminales POS y sesiones de trabajo). */
export {
  useEndWorkerSession,
  useTerminalSessionGuard,
  useWorkerSession,
} from './application/useWorkerSession';
export { TerminalsPanel } from './ui/TerminalsPanel';

export const terminalsPages = {
  terminal: () => import('./pages/TerminalPage'),
};
