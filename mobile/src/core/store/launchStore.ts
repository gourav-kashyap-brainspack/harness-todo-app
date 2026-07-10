import {MMKV} from 'react-native-mmkv';
import {create} from 'zustand';

/**
 * First-launch flag (FND-004, F-044 — Zustand UI store, `core/store`).
 *
 * Mirrors `themeStore`'s "MMKV raw-preference persistence" pattern (one raw
 * MMKV key, a guarded read with a safe default, synchronous write on
 * mutation — see patterns-registry.md) with one deliberate hardening on top
 * of that reference: `readHasLaunched` also survives a *throwing* read (FR6
 * — themeStore's `readPersistedMode` only guards against a non-`ThemeMode`
 * string, it never needs to guard against an exception).
 *
 * `hasLaunched` absent/false/corrupt -> the boot screen (BootstrapScreen)
 * routes to `ProfileSetup`; `true` -> `Tabs`. FND-004 only *reads* the flag
 * at boot — it never calls `setHasLaunched` itself. `setHasLaunched` is the
 * routing seam PRO calls once first-run profile setup actually completes
 * (spec FR3) — a single source of truth for "has this device launched
 * before", so PRO never needs a second flag/store to track the same fact.
 */

export const HAS_LAUNCHED_STORAGE_KEY = 'app.hasLaunched';

// One shared MMKV instance for this raw key — auto-mocked under Jest (no
// native binding needed in tests), same as themeStore's instance.
const storage = new MMKV();

/**
 * Reads the persisted `hasLaunched` flag off MMKV, defaulting to `false`
 * (first launch) when the key is absent, holds a non-boolean value, or the
 * underlying read throws (FR6 — corrupted-flag resilience: boot must never
 * crash on a bad/missing flag). Exported (rather than only used inline) so
 * this guarded-read behavior is directly unit-testable, same rationale as
 * themeStore's `readPersistedMode`.
 */
export function readHasLaunched(): boolean {
  try {
    return storage.getBoolean(HAS_LAUNCHED_STORAGE_KEY) === true;
  } catch {
    return false;
  }
}

export interface LaunchState {
  hasLaunched: boolean;
  /**
   * PRO calls this once first-run Profile Setup completes (spec FR3) — FND-
   * 004 provides the flag + this seam only; it never calls it itself (the
   * flag must stay `false` until setup is genuinely done). Persists
   * synchronously to MMKV, same as themeStore.setMode.
   */
  setHasLaunched: () => void;
}

export const useLaunchStore = create<LaunchState>(set => ({
  hasLaunched: readHasLaunched(),

  setHasLaunched: () => {
    storage.set(HAS_LAUNCHED_STORAGE_KEY, true);
    set({hasLaunched: true});
  },
}));
