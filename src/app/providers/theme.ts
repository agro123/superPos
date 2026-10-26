import { useEffect } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useMediaQuery } from '@/shared/hooks/useMediaQuery';

export type ThemePreference = 'system' | 'light' | 'dark';

interface ThemeState {
  theme: ThemePreference;
  cycle: () => void;
}

const ORDER: readonly ThemePreference[] = ['system', 'light', 'dark'];

/** Preferencia de tema por dispositivo (localStorage: es solo una preferencia de UI). */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'system',
      cycle: () => {
        set((state) => ({
          theme: ORDER[(ORDER.indexOf(state.theme) + 1) % ORDER.length] ?? 'system',
        }));
      },
    }),
    { name: 'superpos.theme', storage: createJSONStorage(() => localStorage) },
  ),
);

/** Aplica el tema resuelto como `data-theme` en <html>. */
export function useApplyTheme(): void {
  const theme = useThemeStore((state) => state.theme);
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  const resolved = theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme;
  useEffect(() => {
    document.documentElement.dataset.theme = resolved;
  }, [resolved]);
}
