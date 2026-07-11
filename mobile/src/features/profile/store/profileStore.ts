import {create} from 'zustand';

import {
  clearProfile as clearPersistedProfile,
  getProfile,
  saveProfile,
} from '@/core/services/profileRepository';
import type {Profile} from '@/core/types/profile';

/**
 * Profile feature store (PRO-001, FR1) — the single source of profile state
 * PRO-002/PRO-003 consume. Mirrors the `themeStore`/`launchStore` hydration
 * shape (a thin read wrapped for direct testability, seeded once as this
 * store's initial state — see patterns-registry.md → "Theme store +
 * provider"), but reads through STG's typed `profileRepository` rather than
 * a raw MMKV key, since `Profile` is STG-owned persisted domain data
 * (STG-002, patterns-registry.md → "Persisted domain model").
 *
 * Every write goes through `profileRepository.saveProfile`/`clearProfile` —
 * this store never touches `react-native-mmkv` or `core/services/storage.ts`
 * directly (conventions.md; the STG coherence gap (f) sibling rule for the
 * write side — reads/writes both funnel through the one repository).
 */

/**
 * Reads the persisted profile via the STG repository. Exported (rather than
 * only used inline) so the "hydrate on init" behavior is directly
 * unit-testable without module-reset gymnastics, same rationale as
 * `themeStore.readPersistedMode`/`launchStore.readHasLaunched`.
 * `profileRepository.getProfile` is already a TOTAL read (absent/corrupt →
 * `null`, F-038) — that guarantee is inherited here, not re-implemented.
 */
export function hydrateProfile(): Profile | null {
  return getProfile();
}

export interface ProfileState {
  profile: Profile | null;
  /** Persists `profile` through the STG repository, then updates state. */
  setProfile: (profile: Profile) => void;
  /** Clears the persisted profile, then resets state to `null`. */
  clearProfile: () => void;
}

export const useProfileStore = create<ProfileState>(set => ({
  profile: hydrateProfile(),

  setProfile: profile => {
    saveProfile(profile);
    set({profile});
  },

  clearProfile: () => {
    clearPersistedProfile();
    set({profile: null});
  },
}));
