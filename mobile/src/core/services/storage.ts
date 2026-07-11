import type {ZodSchema} from 'zod';
import {MMKV} from 'react-native-mmkv';

import type {PersistedValue, StorageEnvelope} from '@/core/types/storage';

/**
 * Typed storage service (STG-001 — the app's single persistence primitive).
 *
 * Generalizes the guarded-read discipline FND hand-rolled per key
 * (`themeStore.readPersistedMode`, `launchStore.readHasLaunched`) into one
 * Zod-validated, versioned API. Every domain (Profile, Tasks — STG-002+)
 * persists THROUGH this service; no feature/domain module imports
 * `react-native-mmkv` directly (spec FR6 — this file is the one exception).
 *
 * Every read is total: absent key, malformed JSON, an envelope with an
 * unhandled `version`, data that fails the caller's Zod schema, or even a
 * throwing native read all fall back to the caller-supplied default —
 * `getItem` NEVER throws (F-038, spec FR4). A dev-only `console.warn`
 * accompanies every fallback so a corrupt/legacy blob is visible in
 * development without ever surfacing as a user-facing crash or error toast.
 */

/**
 * Spec-gap (b) — coherence report `docs/graph/coherence/FND.md`: this MUST
 * stay the DEFAULT MMKV instance (`new MMKV()`, no `id`, no
 * `encryptionKey`). FND's `themeStore`/`launchStore` already persist their
 * raw keys (`theme.mode`, `app.hasLaunched`) on this exact default instance
 * — a different instance id or an encryption key would put this service on
 * a *different* underlying store and silently orphan those two keys (the
 * user's saved theme + first-launch state would appear "reset" on next
 * boot). Do NOT "helpfully" add an instance id/encryption here. This
 * service does not read/write `theme.mode`/`app.hasLaunched` itself — it
 * only coexists on the same instance with keys it doesn't own.
 */
const storage = new MMKV();

/** Envelope format version this build writes. Bump when the shape of a
 * persisted domain payload changes in a way that needs a migration. */
export const CURRENT_STORAGE_VERSION = 1;

/**
 * Single source of truth for every persisted key string this service
 * manages. Deliberately empty in STG-001 (the anchor task ships no domain
 * data yet) — STG-002 adds `profile`/`tasks` entries here. Does NOT include
 * FND's `theme.mode` / `app.hasLaunched`: those are FND-owned raw keys this
 * service coexists with on the same MMKV instance, not keys it manages
 * (spec FR5).
 */
export const StorageKeys = {} as const satisfies Record<string, string>;

/**
 * Sentinel returned by `migrate` for an unrecognized/unmigratable envelope
 * version. A plain `null` can't be used for this — `null` is also a
 * legitimate persisted `data` value (e.g. a `z.nullable()`/`z.null()`
 * schema, such as a "no profile yet" state), so reusing it as a corrupt-
 * marker would wrongly discard a real `null` payload as corrupt. A
 * `Symbol` can never collide with any JSON-decoded value.
 */
const UNMIGRATABLE = Symbol('storage.unmigratable');

/**
 * Extension point for future schema migrations (spec FR2). Given the
 * envelope's persisted `version` and raw `data`, returns the data upgraded
 * to the shape `CURRENT_STORAGE_VERSION` expects, or the `UNMIGRATABLE`
 * sentinel when the version is unrecognized — the caller treats that
 * sentinel as corrupt and falls back to the safe default.
 *
 * No migrations exist yet (`CURRENT_STORAGE_VERSION` is still 1), so this
 * stub only recognizes the current version. When a persisted shape changes:
 * bump `CURRENT_STORAGE_VERSION` and add a case here, e.g.
 * `if (version === 1) { return upgradeV1ToV2(data); }` — never change this
 * function's signature or the envelope shape itself.
 */
function migrate(version: number, data: unknown): unknown {
  if (version === CURRENT_STORAGE_VERSION) {
    return data;
  }
  // migrations go here as the envelope version advances.
  return UNMIGRATABLE;
}

function isEnvelopeShape(value: unknown): value is StorageEnvelope<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'version' in value &&
    typeof (value as {version: unknown}).version === 'number' &&
    'data' in value
  );
}

/** Dev-only visibility into a fallback path — never a user-facing error. */
function warnCorrupt(key: string, reason: string): void {
  if (__DEV__) {
    console.warn(`[storage] "${key}" fell back to default: ${reason}`);
  }
}

/**
 * Reads and validates a persisted value. Returns `fallback` — never
 * throws — for every failure mode: the key is absent, the stored string
 * isn't valid JSON, the parsed value isn't a `{version, data}` envelope,
 * `migrate` can't handle the persisted version, the unwrapped data fails
 * `schema`, or the underlying native read itself throws.
 */
export function getItem<T>(key: string, schema: ZodSchema<T>, fallback: T): T {
  try {
    const raw = storage.getString(key);
    if (raw === undefined) {
      return fallback;
    }

    const parsed: unknown = JSON.parse(raw);
    if (!isEnvelopeShape(parsed)) {
      warnCorrupt(key, 'stored value is not a {version, data} envelope');
      return fallback;
    }

    const migrated = migrate(parsed.version, parsed.data);
    if (migrated === UNMIGRATABLE) {
      warnCorrupt(key, `unhandled envelope version ${parsed.version}`);
      return fallback;
    }

    const result = schema.safeParse(migrated);
    if (!result.success) {
      warnCorrupt(key, `data failed schema validation: ${result.error.message}`);
      return fallback;
    }

    return result.data;
  } catch (error) {
    // Log the error's class only, never `String(error)`/`error.message`: a
    // `JSON.parse` SyntaxError on a corrupt/truncated blob can echo a
    // fragment of the raw stored string in its message, which for STG-002+
    // payloads may contain PII (name/email). The class name is enough to
    // diagnose in dev without risking a PII leak into the console.
    const errorClass = error instanceof Error ? error.name : 'unknown';
    warnCorrupt(key, `read threw (${errorClass})`);
    return fallback;
  }
}

/**
 * Validates `value` against `schema`, wraps it in the current version
 * envelope, and writes it synchronously. Throws (via `schema.parse`) if
 * `value` doesn't match `schema` — that is a programmer error (the caller's
 * own typed state failed its own schema), not corrupt storage, so it is
 * NOT swallowed the way `getItem`'s read-time failures are.
 */
export function setItem<T>(key: string, schema: ZodSchema<T>, value: T): void {
  const validated = schema.parse(value);
  const envelope: StorageEnvelope<T> = {version: CURRENT_STORAGE_VERSION, data: validated};
  storage.set(key, JSON.stringify(envelope));
}

/** Deletes a persisted key. A no-op if the key doesn't exist. */
export function removeItem(key: string): void {
  storage.delete(key);
}

/** Whether a key currently has a persisted value. */
export function hasItem(key: string): boolean {
  return storage.contains(key);
}

/**
 * The store-hydration pattern (spec FR3, F-037 restore-on-startup):
 * bundles a key + schema + fallback into a small handle so a Zustand store
 * doesn't repeat that triple at both hydrate-time and every persist-time
 * call site. Usage (the recipe STG-002/PRO/TSK follow verbatim):
 *
 * ```ts
 * const tasksPersistence = createPersistedValue(StorageKeys.tasks, taskListSchema, []);
 *
 * export const useTaskStore = create<TaskState>(set => ({
 *   tasks: tasksPersistence.hydrate(), // seeds initial state once, at module load
 *   setTasks: tasks => {
 *     tasksPersistence.persist(tasks); // synchronous write-through on mutation
 *     set({tasks});
 *   },
 * }));
 * ```
 *
 * `hydrate`/`persist` are thin wrappers over `getItem`/`setItem` — safe to
 * call synchronously on the cold-start path (no async gate) and to call
 * again from any mutator action.
 */
export function createPersistedValue<T>(
  key: string,
  schema: ZodSchema<T>,
  fallback: T,
): PersistedValue<T> {
  return {
    hydrate: () => getItem(key, schema, fallback),
    persist: (value: T) => setItem(key, schema, value),
  };
}
