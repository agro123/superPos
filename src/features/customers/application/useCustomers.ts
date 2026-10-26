import { useLiveQuery } from '@/shared/hooks/useLiveQuery';
import {
  createCustomer,
  updateCustomer,
  watchCustomers,
} from '../infrastructure/customerRepository';

export const useCustomers = (bid: string) => useLiveQuery(['customers', bid], watchCustomers(bid));

/** Escrituras de clientes: optimistas y encoladas offline. */
export const customerWrites = { createCustomer, updateCustomer };
