import { balanceOf, useCustomerBalances, useCustomers } from '@/features/customers';

/** Cliente de la orden activa y su saldo fiado (solo con el módulo de clientes activo). */
export function usePosCustomer(businessId: string, enabled: boolean, customerId: string | null) {
  const customers = useCustomers(businessId, enabled);
  const credit = useCustomerBalances(businessId, enabled);
  const customer = customerId ? (customers.data?.find((c) => c.id === customerId) ?? null) : null;
  return {
    customer,
    debt: balanceOf(credit.balances, customer?.id ?? null),
    balances: credit.balances,
  };
}
