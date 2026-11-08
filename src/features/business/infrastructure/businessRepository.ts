import { z } from 'zod';
import { arrayUnion, collection, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { AppError } from '@/shared/domain/errors';
import type { LiveDoc, Subscribe } from '@/shared/domain/live';
import type { PaymentMethod } from '@/shared/domain/payment';
import { getFirebase } from '@/shared/infrastructure/firebase/app';
import { zodConverter } from '@/shared/infrastructure/firebase/converters';
import { mapFirebaseError } from '@/shared/infrastructure/firebase/errors';
import { createAudit, updateAudit, watchDoc } from '@/shared/infrastructure/firebase/firestore';
import { trackWrite } from '@/shared/infrastructure/offline/trackWrite';
import {
  businessSchema,
  type Business,
  type BusinessUpdate,
  type OnboardingInput,
} from '../domain/business';
import {
  DEFAULT_PAYMENT_METHODS,
  defaultModulesFor,
  defaultTaxRates,
  modulesSettingsSchema,
  paymentMethodsSettingsSchema,
  taxSettingsSchema,
  type ModulesSettings,
  type PaymentMethodsSettings,
  type TaxSettings,
} from '../domain/settings';

const db = () => getFirebase().db;
const businessRef = (bid: string) => doc(db(), 'businesses', bid);
const settingsRef = (bid: string, id: string) => doc(db(), 'businesses', bid, 'settings', id);

const businessConverter = zodConverter(businessSchema);
const modulesConverter = zodConverter(modulesSettingsSchema.extend({ id: z.string() }));
const taxesConverter = zodConverter(taxSettingsSchema.extend({ id: z.string() }));
const paymentsConverter = zodConverter(paymentMethodsSettingsSchema.extend({ id: z.string() }));

export function watchBusiness(bid: string): Subscribe<LiveDoc<Business>> {
  return watchDoc(businessRef(bid).withConverter(businessConverter));
}

export const watchModules = (bid: string): Subscribe<LiveDoc<ModulesSettings & { id: string }>> =>
  watchDoc(settingsRef(bid, 'modules').withConverter(modulesConverter));

export const watchTaxes = (bid: string): Subscribe<LiveDoc<TaxSettings & { id: string }>> =>
  watchDoc(settingsRef(bid, 'taxes').withConverter(taxesConverter));

export const watchPaymentMethods = (
  bid: string,
): Subscribe<LiveDoc<PaymentMethodsSettings & { id: string }>> =>
  watchDoc(settingsRef(bid, 'paymentMethods').withConverter(paymentsConverter));

interface Owner {
  uid: string;
  email: string;
  displayName: string;
}

/**
 * Crea el negocio, el miembro admin y la configuración inicial en un único batch atómico
 * (las reglas exigen que el negocio nazca con su admin). Requiere conexión.
 */
export async function createBusiness(input: OnboardingInput, owner: Owner): Promise<string> {
  if (!navigator.onLine) throw new AppError('offline', 'Crear un negocio requiere conexión');
  const bid = doc(collection(db(), 'businesses')).id;
  const audit = createAudit(owner.uid);
  const batch = writeBatch(db());
  batch.set(businessRef(bid), {
    name: input.name,
    type: input.type,
    currency: input.currency,
    timezone: input.timezone,
    ownerUid: owner.uid,
    plan: 'free',
    status: 'active',
    ...audit,
  });
  batch.set(doc(db(), 'businesses', bid, 'members', owner.uid), {
    displayName: owner.displayName,
    email: owner.email,
    role: 'admin',
    extraPermissions: [],
    status: 'active',
    ...audit,
  });
  batch.set(settingsRef(bid, 'modules'), { ...defaultModulesFor(input.type), ...audit });
  batch.set(settingsRef(bid, 'taxes'), {
    pricesIncludeTax: input.pricesIncludeTax,
    defaultRateBps: input.defaultTaxRateBps,
    rates: defaultTaxRates(),
    ...audit,
  });
  batch.set(settingsRef(bid, 'paymentMethods'), {
    enabled: [...DEFAULT_PAYMENT_METHODS],
    ...audit,
  });
  // El negocio nace con la configuración inicial pendiente: el admin ve el asistente.
  batch.set(settingsRef(bid, 'setup'), {
    completedSteps: [],
    skippedSteps: [],
    dismissedAt: null,
    completedAt: null,
    ...audit,
  });
  batch.update(doc(db(), 'users', owner.uid), { businessIds: arrayUnion(bid), ...updateAudit() });
  try {
    await batch.commit();
  } catch (error) {
    throw mapFirebaseError(error);
  }
  return bid;
}

export function updateBusiness(bid: string, update: BusinessUpdate): void {
  trackWrite(updateDoc(businessRef(bid), { ...update, ...updateAudit() }), 'business.update');
}

export function updateModules(
  bid: string,
  modules: Pick<ModulesSettings, 'restaurant' | 'customers'>,
): void {
  trackWrite(
    updateDoc(settingsRef(bid, 'modules'), { ...modules, ...updateAudit() }),
    'settings.modules',
  );
}

export function updateTaxes(
  bid: string,
  taxes: Pick<TaxSettings, 'pricesIncludeTax' | 'defaultRateBps' | 'rates'>,
): void {
  trackWrite(
    updateDoc(settingsRef(bid, 'taxes'), { ...taxes, ...updateAudit() }),
    'settings.taxes',
  );
}

export function updatePaymentMethods(bid: string, enabled: readonly PaymentMethod[]): void {
  trackWrite(
    updateDoc(settingsRef(bid, 'paymentMethods'), { enabled: [...enabled], ...updateAudit() }),
    'settings.paymentMethods',
  );
}
