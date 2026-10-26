import { useMutation } from '@tanstack/react-query';
import { useMemo } from 'react';
import {
  refreshEmailVerification,
  resendVerificationEmail,
  sendPasswordReset,
  signIn,
  signOut,
  signUp,
} from '../infrastructure/authService';
import { devicePinStore } from '../infrastructure/devicePinStore';
import { createWebCryptoPinHasher } from '../infrastructure/webCryptoPinHasher';
import { createPinService, type PinService } from './pinService';
import { useLockStore } from './sessionStore';

export const useSignIn = () => useMutation({ mutationFn: signIn });
export const useSignUp = () => useMutation({ mutationFn: signUp });
export const usePasswordReset = () => useMutation({ mutationFn: sendPasswordReset });
export const useResendVerification = () => useMutation({ mutationFn: resendVerificationEmail });
export const useRefreshVerification = () => useMutation({ mutationFn: refreshEmailVerification });

export function useSignOut() {
  const unlock = useLockStore((state) => state.unlock);
  return useMutation({
    mutationFn: async () => {
      unlock();
      await signOut();
    },
  });
}

/** Servicio de PIN del dispositivo (PBKDF2 + IndexedDB). */
export function usePinService(): PinService {
  return useMemo(() => createPinService(devicePinStore, createWebCryptoPinHasher()), []);
}
