import {getItem, removeItem, setItem, StorageKeys} from '@/core/services/storage';
import {profileSchema, type Profile} from '@/core/types/profile';

/**
 * The Profile persistence path (STG-002, F-006). The ONLY way any
 * feature/domain code reads or writes the persisted Profile — PRO builds
 * its profile UI/state on top of these three functions, it does not call
 * the storage service directly or re-declare the Profile shape (FR5).
 *
 * Ownership boundary (spec FR4): STG owns persistence + the `Profile`
 * shape (this file + `core/types/profile.ts`); PRO owns the feature store
 * (actions, screens) that call into it — see `createPersistedValue` in
 * `storage.ts` for the hydration recipe PRO's store should follow.
 */

/**
 * `getItem<T>`'s signature ties the fallback's type to the schema's
 * inferred type (`schema: ZodSchema<T>, fallback: T`) — a bare
 * `profileSchema` infers `Profile`, which a `null` fallback can't satisfy.
 * `.nullable()` widens the schema (and its inferred type) to
 * `Profile | null` so `null` type-checks as the fallback AND so a
 * genuinely-persisted `null` (not just "key absent") would still parse
 * successfully rather than being flagged corrupt — same total-read
 * contract `getItem` already guarantees, just widened for this repository's
 * "no profile yet" case.
 */
const nullableProfileSchema = profileSchema.nullable();

/** No profile persisted (first-launch/pre-setup) is a legitimate, common
 * state — `null` fallback, same "safe absent value" contract every
 * `getItem` fallback documents, not a corrupt/error state. */
const NO_PROFILE: Profile | null = null;

/**
 * Reads the persisted profile. `null` covers both "never set" and
 * "corrupt/invalid persisted blob" (F-038, inherited from `getItem` — never
 * throws).
 */
export function getProfile(): Profile | null {
  return getItem(StorageKeys.profile, nullableProfileSchema, NO_PROFILE);
}

/**
 * Persists the profile. `setItem` Zod-validates `profile` against
 * `profileSchema` before writing (via `schema.parse`) and throws if it
 * doesn't match — a caller bug (e.g. an unvalidated form value slipping
 * through), not corrupt storage, so it is deliberately NOT swallowed here.
 * Callers should validate at the form boundary (RHF + `zodResolver`) so
 * this throw path is never reachable from a real user flow.
 */
export function saveProfile(profile: Profile): void {
  setItem(StorageKeys.profile, profileSchema, profile);
}

/** Deletes the persisted profile. A no-op if none exists. */
export function clearProfile(): void {
  removeItem(StorageKeys.profile);
}
