import type { ReactNode } from 'react';
import type { BusinessStatus } from '../domain/business';
import { defaultModulesFor, defaultTaxRates, DEFAULT_PAYMENT_METHODS } from '../domain/settings';
import { ActiveBusinessContext } from './businessContext';
import {
  useBusinessDoc,
  useModulesDoc,
  usePaymentMethodsDoc,
  useTaxesDoc,
} from './useBusinessData';

export interface ActiveBusinessProviderProps {
  businessId: string;
  /** Mientras carga. */
  loading: ReactNode;
  /** Si falla la carga o el negocio no está disponible (sin red y sin caché). */
  renderError: (retry: () => void) => ReactNode;
  /** Si la plataforma bloqueó o eliminó el negocio (las reglas ya niegan el resto de lecturas). */
  renderUnavailable: (status: Exclude<BusinessStatus, 'active'>) => ReactNode;
  children: ReactNode;
}

/** Carga el negocio activo y su configuración y los expone por contexto. */
export function ActiveBusinessProvider({
  businessId,
  loading,
  renderError,
  renderUnavailable,
  children,
}: ActiveBusinessProviderProps) {
  const business = useBusinessDoc(businessId);
  const modules = useModulesDoc(businessId);
  const taxes = useTaxesDoc(businessId);
  const paymentMethods = usePaymentMethodsDoc(businessId);
  const queries = [business, modules, taxes, paymentMethods];
  const status = business.data?.value?.status;

  // Antes que los errores: un negocio bloqueado hace fallar las lecturas de su configuración.
  if (status && status !== 'active') return renderUnavailable(status);

  if (queries.some((query) => query.isError)) {
    return renderError(() => {
      queries.forEach((query) => void query.refetch());
    });
  }
  if (!business.data || !modules.data || !taxes.data || !paymentMethods.data) return loading;
  const value = business.data.value;
  if (!value) return renderError(() => void business.refetch());

  const fallbackModules = defaultModulesFor(value.type);
  return (
    <ActiveBusinessContext.Provider
      value={{
        business: value,
        modules: modules.data.value ?? fallbackModules,
        taxes: taxes.data.value ?? {
          pricesIncludeTax: true,
          defaultRateBps: 1900,
          rates: defaultTaxRates(),
        },
        paymentMethods: paymentMethods.data.value?.enabled ?? DEFAULT_PAYMENT_METHODS,
      }}
    >
      {children}
    </ActiveBusinessContext.Provider>
  );
}
