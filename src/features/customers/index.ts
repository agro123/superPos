/** API pública de la feature customers (módulo activable, cuentas fiadas). */
export { useCustomerBalances, useCustomers } from './application/useCustomers';
export { balanceOf, type CustomerBalance } from './domain/credit';
export type { Customer } from './domain/customer';
export { CustomerPickerDialog } from './ui/CustomerPickerDialog';

export const customersPages = {
  customers: () => import('./pages/CustomersPage'),
};
