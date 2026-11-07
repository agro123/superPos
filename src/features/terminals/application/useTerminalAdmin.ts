import { useMutation } from '@tanstack/react-query';
import { AppError } from '@/shared/domain/errors';
import { useLiveQuery } from '@/shared/hooks/useLiveQuery';
import { normalizePairingCode, pairingStateOf } from '../domain/pairing';
import {
  approvePairing,
  findPairingRequest,
  watchMemberNames,
  watchRecentSessions,
  watchTerminals,
  type ApprovePairingInput,
} from '../infrastructure/terminalAdmin';
import { sha256Hex } from './hashing';

export { expireSession, setTerminalStatus, updateTerminal } from '../infrastructure/terminalAdmin';

export const useTerminals = (bid: string) =>
  useLiveQuery(['posTerminals', bid], watchTerminals(bid));

export const useMemberNames = (bid: string) =>
  useLiveQuery(['terminalMemberNames', bid], watchMemberNames(bid));

export const useRecentSessions = (bid: string) =>
  useLiveQuery(['terminalSessions', bid], watchRecentSessions(bid));

/** Busca una solicitud pendiente y vigente por el código del QR o tecleado. */
export function useFindPairingRequest() {
  return useMutation({
    mutationFn: async (input: string) => {
      const code = normalizePairingCode(input);
      if (!code) throw new AppError('validation', 'Código inválido');
      const request = await findPairingRequest(await sha256Hex(code));
      if (!request || pairingStateOf(request, new Date()) !== 'pending') {
        throw new AppError('not_found', 'Solicitud inexistente, vencida o ya usada');
      }
      return request;
    },
  });
}

export const useApprovePairing = () =>
  useMutation({ mutationFn: (input: ApprovePairingInput) => approvePairing(input) });
