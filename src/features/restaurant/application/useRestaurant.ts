import { useLiveQuery } from '@/shared/hooks/useLiveQuery';
import {
  closeOrder,
  createTable,
  createZone,
  deleteTable,
  markOrderServed,
  openOrder,
  saveOrderLines,
  sendOrderRound,
  setTableStatus,
  watchActiveOrders,
  watchTables,
  watchZones,
} from '../infrastructure/restaurantRepository';

export const useZones = (bid: string) => useLiveQuery(['restaurantZones', bid], watchZones(bid));
export const useTables = (bid: string) => useLiveQuery(['restaurantTables', bid], watchTables(bid));
export const useActiveOrders = (bid: string) =>
  useLiveQuery(['restaurantOrders', bid], watchActiveOrders(bid));

/** Escrituras del restaurante: sin esperar (offline), con `trackWrite`. */
export const restaurantWrites = {
  createZone,
  createTable,
  deleteTable,
  setTableStatus,
  openOrder,
  saveOrderLines,
  sendOrderRound,
  markOrderServed,
  closeOrder,
};
