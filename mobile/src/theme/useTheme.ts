import {useShallow} from 'zustand/react/shallow';

import {useThemeStore, type ResolvedScheme, type ThemeMode} from '@/core/store/themeStore';

export interface UseThemeResult {
  mode: ThemeMode;
  resolvedScheme: ResolvedScheme;
  setMode: (mode: ThemeMode) => void;
}

/**
 * useTheme() (FND-002) — the single hook screens/components use to read the
 * active theme + change it. Wraps the Zustand themeStore with `useShallow`
 * so the returned object is stable across renders that don't change these
 * three fields (Zustand v5 selectors are reference-compared by default).
 */
export function useTheme(): UseThemeResult {
  return useThemeStore(
    useShallow(state => ({
      mode: state.mode,
      resolvedScheme: state.resolvedScheme,
      setMode: state.setMode,
    })),
  );
}
