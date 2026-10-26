import { collection, limit, orderBy, query, Timestamp, where } from 'firebase/firestore';
import { getFirebase } from '@/shared/infrastructure/firebase/app';
import { zodConverter } from '@/shared/infrastructure/firebase/converters';
import { watchQuery } from '@/shared/infrastructure/firebase/firestore';
import type { SaleReader } from '../domain/ports';
import { saleSchema } from '../domain/sale';

const converter = zodConverter(saleSchema);

/** Máximo de ventas por consulta en esta fase (paginación en servidor: Prompt 2). */
const MAX_SALES = 1000;

export const saleReader: SaleReader = {
  watchSince(businessId, since) {
    const sales = collection(getFirebase().db, 'businesses', businessId, 'sales').withConverter(
      converter,
    );
    return watchQuery(
      query(
        sales,
        where('occurredAt', '>=', Timestamp.fromDate(since)),
        orderBy('occurredAt', 'desc'),
        limit(MAX_SALES),
      ),
    );
  },
};
