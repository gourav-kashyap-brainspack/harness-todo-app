import {Appearance, type ColorSchemeName} from 'react-native';
import {MMKV} from 'react-native-mmkv';
import {create} from 'zustand';

/**
 * Theme controller (FND-002, Zustand UI store — core/store).
 *
 * `mode` is the user's preference (`system` follows the OS, `light`/`dark`
 * are manual overrides); `resolvedScheme` is the concrete scheme every
 * consumer (ThemeProvider → NativeWind's `.dark` root, useTheme()) actually
 * renders with. `mode` persists to MMKV under one raw string key — the same
 * minimal "no typed storage service yet" approach FND-004's first-launch
 * flag will reuse (see spec → State & data impact).
 */

export type ThemeMode = 'system' | 'light' | 'dark';
export type ResolvedScheme = 'light' | 'dark';

export const THEME_MODE_STORAGE_KEY = 'theme.mode';

// One shared MMKV instance for this raw key. Auto-mocked under Jest (no
// native binding needed in tests) — see react-native-mmkv README → Testing
// with Jest.
const storage = new MMKV();

function isThemeMode(value: string | undefined): value is ThemeMode {
  return value === 'system' || value === 'light' || value === 'dark';
}

/**
 * Reads the persisted `mode` off MMKV, falling back to `'system'` when
 * absent or corrupt. Exported (rather than only used inline) so the "boot
 * restores persisted mode" behavior is directly unit-testable without
 * `jest.resetModules()` gymnastics — see themeStore.test.ts.
 */
export function readPersistedMode(): ThemeMode {
  const persisted = storage.getString(THEME_MODE_STORAGE_KEY);
  return isThemeMode(persisted) ? persisted : 'system';
}

function resolveScheme(mode: ThemeMode, systemScheme: ColorSchemeName): ResolvedScheme {
  if (mode === 'system') {
    return systemScheme === 'dark' ? 'dark' : 'light';
  }
  return mode;
}

export interface ThemeState {
  mode: ThemeMode;
  resolvedScheme: ResolvedScheme;
  /** Manual override (or back to 'system'); persists to MMKV immediately. */
  setMode: (mode: ThemeMode) => void;
  /**
   * Internal: ThemeProvider forwards live OS scheme changes here (it
   * subscribes via React Native's `useColorScheme()`). A no-op unless
   * `mode === 'system'` — a manual override must not be clobbered by an OS
   * change (FR5).
   */
  syncSystemScheme: (systemScheme: ColorSchemeName) => void;
}

const initialMode = readPersistedMode();

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: initialMode,
  resolvedScheme: resolveScheme(initialMode, Appearance.getColorScheme()),

  setMode: mode => {
    storage.set(THEME_MODE_STORAGE_KEY, mode);
    set({
      mode,
      resolvedScheme: resolveScheme(mode, Appearance.getColorScheme()),
    });
  },

  syncSystemScheme: systemScheme => {
    if (get().mode !== 'system') {
      return;
    }
    set({resolvedScheme: resolveScheme('system', systemScheme)});
  },
}));
