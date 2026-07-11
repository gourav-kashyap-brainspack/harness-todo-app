/**
 * Types for the typed storage service (STG-001 — `core/services/storage.ts`).
 * Split out into `core/types` per the feature-sliced layout convention;
 * `core/services` imports these (both are the single `core` boundary
 * element, so this is an ordinary same-layer import — see
 * `.eslintrc.js` → `boundaries/elements`).
 */

/**
 * The versioned envelope every value the storage service writes is wrapped
 * in on disk: `{version, data}` JSON, where `data` is the Zod-validated
 * payload. `version` is the seam a future schema migration hooks into
 * without changing the on-disk shape itself (spec FR2) — see
 * `storage.ts`'s `migrate` stub for where that logic goes.
 */
export interface StorageEnvelope<T> {
  version: number;
  data: T;
}

/**
 * A schema-typed persisted-value handle returned by `createPersistedValue`
 * (spec FR3 — the store-hydration pattern). `hydrate` is called once at
 * module load to seed a Zustand store's initial state; `persist` is called
 * inside the store's mutator actions to write the new value back. Both are
 * synchronous (MMKV reads/writes are sync), so they're safe to call
 * directly inside `create<State>((set, get) => ({...}))` — no async gate
 * on the boot path.
 */
export interface PersistedValue<T> {
  hydrate: () => T;
  persist: (value: T) => void;
}
