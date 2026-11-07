import { collection, doc, orderBy, query, setDoc, updateDoc } from 'firebase/firestore';
import type { Subscribe, Synced } from '@/shared/domain/live';
import { getFirebase } from '@/shared/infrastructure/firebase/app';
import { zodConverter } from '@/shared/infrastructure/firebase/converters';
import { createAudit, updateAudit, watchQuery } from '@/shared/infrastructure/firebase/firestore';
import { trackWrite } from '@/shared/infrastructure/offline/trackWrite';
import { customerSchema, type Customer } from '../domain/customer';

type CustomerFields = Pick<Customer, 'name' | 'documentId' | 'phone' | 'email' | 'notes'>;

const converter = zodConverter(customerSchema);
const customersCol = (bid: string) => collection(getFirebase().db, 'businesses', bid, 'customers');

export const watchCustomers = (bid: string): Subscribe<Synced<Customer>[]> =>
  watchQuery(query(customersCol(bid), orderBy('name')).withConverter(converter));

/** Crea el cliente con id generado en cliente (offline) y lo devuelve. */
export function createCustomer(bid: string, fields: CustomerFields, uid: string): string {
  const ref = doc(customersCol(bid));
  trackWrite(setDoc(ref, { ...fields, ...createAudit(uid) }), 'customers.create');
  return ref.id;
}

export function updateCustomer(bid: string, customerId: string, fields: CustomerFields): void {
  trackWrite(
    updateDoc(doc(customersCol(bid), customerId), { ...fields, ...updateAudit() }),
    'customers.update',
  );
}
