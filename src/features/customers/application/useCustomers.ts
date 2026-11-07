import { useMemo } from 'react';
import { useLiveQuery } from '@/shared/hooks/useLiveQuery';
import { customerBalances } from '../domain/credit';
import {
  recordCreditPayment,
  watchCreditPayments,
  watchCreditSales,
} from '../infrastructure/creditRepository';
import {
  createCustomer,
  updateCustomer,
  watchCustomers,
} from '../infrastructure/customerRepository';

export const useCustomers = (bid: string, enabled = true) =>
  useLiveQuery(['customers', bid], enabled ? watchCustomers(bid) : null);

/** Saldos fiados por cliente, en tiempo real. `enabled = false` si el módulo está apagado. */
export function useCustomerBalances(bid: string, enabled = true) {
  const sales = useLiveQuery(['creditSales', bid], enabled ? watchCreditSales(bid) : null);
  const payments = useLiveQuery(['creditPayments', bid], enabled ? watchCreditPayments(bid) : null);
  const balances = useMemo(
    () => customerBalances(sales.data ?? [], payments.data ?? []),
    [sales.data, payments.data],
  );
  return {
    balances,
    loading: sales.isPending || payments.isPending,
    error: sales.error ?? payments.error,
  };
}

/** Escrituras de clientes: optimistas y encoladas offline. */
export const customerWrites = { createCustomer, updateCustomer, recordCreditPayment };
