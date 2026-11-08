import {
  collection,
  doc,
  getCountFromServer,
  orderBy,
  query,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import {
  businessSchema,
  businessStatusMachine,
  DEFAULT_PAYMENT_METHODS,
  defaultModulesFor,
  defaultTaxRates,
  type Business,
  type BusinessStatus,
} from '@/features/business';
import { AppError } from '@/shared/domain/errors';
import type { Subscribe, Synced } from '@/shared/domain/live';
import { getFirebase } from '@/shared/infrastructure/firebase/app';
import { zodConverter } from '@/shared/infrastructure/firebase/converters';
import { mapFirebaseError } from '@/shared/infrastructure/firebase/errors';
import { createAudit, updateAudit, watchQuery } from '@/shared/infrastructure/firebase/firestore';
import { trackWrite } from '@/shared/infrastructure/offline/trackWrite';
import {
  USAGE_COLLECTIONS,
  type PlatformBusinessInput,
  type PlatformBusinessUpdate,
  type UsageCounts,
} from '../domain/platformBusiness';

const db = () => getFirebase().db;
const businessConverter = zodConverter(businessSchema);
const businessRef = (bid: string) => doc(db(), 'businesses', bid);
const settingsRef = (bid: string, id: string) => doc(db(), 'businesses', bid, 'settings', id);

/** Todos los negocios de la plataforma (las reglas solo lo permiten al super admin). */
export function watchAllBusinesses(): Subscribe<Synced<Business>[]> {
  return watchQuery(
    query(collection(db(), 'businesses'), orderBy('createdAt', 'desc')).withConverter(
      businessConverter,
    ),
  );
}

/**
 * Crea el negocio con su configuración inicial y una invitación de admin para el dueño, en un
 * solo batch. El negocio queda sin `ownerUid` hasta que el invitado acepte. Requiere conexión.
 */
export async function createPlatformBusiness(
  input: PlatformBusinessInput,
  adminUid: string,
): Promise<string> {
  if (!navigator.onLine) throw new AppError('offline', 'Crear un negocio requiere conexión');
  const bid = doc(collection(db(), 'businesses')).id;
  const audit = createAudit(adminUid);
  const batch = writeBatch(db());
  batch.set(businessRef(bid), {
    name: input.name,
    type: input.type,
    currency: input.currency,
    timezone: input.timezone,
    ownerUid: null,
    plan: input.plan,
    status: 'active',
    ...audit,
  });
  batch.set(settingsRef(bid, 'modules'), { ...defaultModulesFor(input.type), ...audit });
  batch.set(settingsRef(bid, 'taxes'), {
    pricesIncludeTax: true,
    defaultRateBps: 1900,
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
  batch.set(doc(db(), 'businesses', bid, 'invitations', input.ownerEmail), {
    email: input.ownerEmail,
    role: 'admin',
    extraPermissions: [],
    businessId: bid,
    businessName: input.name,
    ...audit,
  });
  try {
    await batch.commit();
  } catch (error) {
    throw mapFirebaseError(error);
  }
  return bid;
}

export function updatePlatformBusiness(bid: string, update: PlatformBusinessUpdate): void {
  trackWrite(updateDoc(businessRef(bid), { ...update, ...updateAudit() }), 'platform.update');
}

/** Bloquear, eliminar (lógico) o reactivar. La máquina de estados valida antes de escribir. */
export function changeBusinessStatus(business: Business, to: BusinessStatus): void {
  businessStatusMachine.assertTransition(business.status, to);
  trackWrite(
    updateDoc(businessRef(business.id), { status: to, ...updateAudit() }),
    `platform.status.${to}`,
  );
}

/**
 * Cuenta los documentos de cada colección con agregaciones del servidor: no descarga los
 * documentos y cuesta una lectura por cada 1000 registros. No funciona sin conexión.
 */
export async function fetchUsage(bid: string): Promise<UsageCounts> {
  if (!navigator.onLine) throw new AppError('offline', 'El uso se consulta en línea');
  try {
    const counts = await Promise.all(
      USAGE_COLLECTIONS.map(async (name) => {
        const snapshot = await getCountFromServer(collection(db(), 'businesses', bid, name));
        return [name, snapshot.data().count] as const;
      }),
    );
    return Object.fromEntries(counts) as UsageCounts;
  } catch (error) {
    throw mapFirebaseError(error);
  }
}
