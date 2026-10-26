import { createContext, useContext } from 'react';
import { AppError } from '@/shared/domain/errors';
import type { PaymentMethod } from '@/shared/domain/payment';
import type { Business } from '../domain/business';
import type { ModuleId, TaxSettings } from '../domain/settings';

/** Negocio activo y su configuración, ya cargados (los provee `ActiveBusinessProvider`). */
export interface ActiveBusiness {
  business: Business;
  modules: Readonly<Record<ModuleId, boolean>>;
  taxes: Pick<TaxSettings, 'pricesIncludeTax' | 'defaultRateBps' | 'rates'>;
  paymentMethods: readonly PaymentMethod[];
}

export const ActiveBusinessContext = createContext<ActiveBusiness | null>(null);

/** Negocio activo. Solo usar bajo la guarda de negocio (`RequireBusiness`). */
export function useActiveBusiness(): ActiveBusiness {
  const value = useContext(ActiveBusinessContext);
  if (!value) throw new AppError('not_found', 'useActiveBusiness fuera de ActiveBusinessProvider');
  return value;
}

/** Negocio activo si existe (para componentes que también viven fuera de un negocio). */
export function useOptionalActiveBusiness(): ActiveBusiness | null {
  return useContext(ActiveBusinessContext);
}
