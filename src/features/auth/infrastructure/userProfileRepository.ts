import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { LiveDoc, Subscribe } from '@/shared/domain/live';
import { getFirebase } from '@/shared/infrastructure/firebase/app';
import { zodConverter } from '@/shared/infrastructure/firebase/converters';
import { createAudit, watchDoc } from '@/shared/infrastructure/firebase/firestore';
import type { SessionUser } from '../domain/session';
import { userProfileSchema, type UserProfile } from '../domain/userProfile';

const converter = zodConverter(userProfileSchema);
const profileRef = (uid: string) => doc(getFirebase().db, 'users', uid).withConverter(converter);

export function watchUserProfile(uid: string): Subscribe<LiveDoc<UserProfile>> {
  return watchDoc(profileRef(uid));
}

/** Crea `users/{uid}` si no existe (registro o primer login). Se ejecuta con red. */
export async function ensureUserProfile(user: SessionUser): Promise<void> {
  const ref = doc(getFirebase().db, 'users', user.uid);
  if ((await getDoc(ref)).exists()) return;
  await setDoc(ref, {
    displayName: user.displayName || user.email,
    email: user.email,
    businessIds: [],
    ...createAudit(user.uid),
  });
}
