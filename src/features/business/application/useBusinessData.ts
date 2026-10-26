import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLiveQuery } from '@/shared/hooks/useLiveQuery';
import type { OnboardingInput } from '../domain/business';
import {
  createBusiness,
  updateBusiness,
  updateModules,
  updatePaymentMethods,
  updateTaxes,
  watchBusiness,
  watchModules,
  watchPaymentMethods,
  watchTaxes,
} from '../infrastructure/businessRepository';

export const useBusinessDoc = (bid: string | null) =>
  useLiveQuery(['business', bid], bid ? watchBusiness(bid) : null);
export const useModulesDoc = (bid: string | null) =>
  useLiveQuery(['settings', bid, 'modules'], bid ? watchModules(bid) : null);
export const useTaxesDoc = (bid: string | null) =>
  useLiveQuery(['settings', bid, 'taxes'], bid ? watchTaxes(bid) : null);
export const usePaymentMethodsDoc = (bid: string | null) =>
  useLiveQuery(['settings', bid, 'paymentMethods'], bid ? watchPaymentMethods(bid) : null);

interface CreateBusinessVariables {
  input: OnboardingInput;
  owner: { uid: string; email: string; displayName: string };
}

export function useCreateBusiness() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ input, owner }: CreateBusinessVariables) => createBusiness(input, owner),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['userProfile'] }),
  });
}

/** Escrituras de configuración: optimistas y encoladas offline (no se esperan en la UI). */
export const businessWrites = { updateBusiness, updateModules, updateTaxes, updatePaymentMethods };
