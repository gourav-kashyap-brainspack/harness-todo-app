import {z} from 'zod';
import {create} from 'zustand';

import {createPersistedValue, StorageKeys} from '@/core/services/storage';

/**
 * Organize query state (ORG-001, F-023/F-024/F-025 — Zustand UI store,
 * `features/tasks/store`). Holds the Home list's **view** parameters —
 * `filter`/`sort`/`search` — layered on top of `useTaskStore`'s `tasks`
 * (ORG never copies or mutates that array; see `selectVisibleTasks`).
 *
 * **Persistence (spec FR1/FR6):** `filter`/`sort` persist together as one
 * `{filter,sort}` envelope through the **typed storage service**
 * (`core/services/storage.ts`'s `createPersistedValue` — patterns-
 * registry.md → "Typed storage service" / "Store hydration pattern", the
 * same recipe STG-002's repositories and `taskStore` already follow), NOT
 * the raw-MMKV-key shape `themeStore`/`launchStore` use — that shape is a
 * grandfathered FND-era exception the registry explicitly says not to
 * extend to a new persisted value. `search` is **in-memory only** (plain
 * `set`, never routed through the storage service) and resets to `''` on
 * every fresh store read.
 */

export const taskFilterSchema = z.enum(['all', 'active', 'completed']);
export type TaskFilter = z.infer<typeof taskFilterSchema>;

/**
 * `created-desc` is the only key ORG-001 implements in
 * `selectVisibleTasks`'s comparator lookup; the rest are declared now so the
 * persisted shape is stable for ORG-003 to wire without a migration.
 */
export const taskSortKeySchema = z.enum(['created-desc', 'due', 'alpha', 'updated']);
export type TaskSortKey = z.infer<typeof taskSortKeySchema>;

/**
 * The single persisted envelope schema — `filter`/`sort` are written and
 * read together (one `setItem`/`getItem` call each way) rather than as two
 * independent keys, so a partial write can never leave one field updated
 * and the other stale. `TaskFilter`/`TaskSortKey` are derived from these
 * schemas via `z.infer` — the single source of truth for both unions.
 */
export const taskQueryPrefsSchema = z.object({
  filter: taskFilterSchema,
  sort: taskSortKeySchema,
});
export type TaskQueryPrefs = z.infer<typeof taskQueryPrefsSchema>;

const DEFAULT_QUERY_PREFS: TaskQueryPrefs = {filter: 'all', sort: 'created-desc'};

const queryPrefsPersistence = createPersistedValue(
  StorageKeys.taskQuery,
  taskQueryPrefsSchema,
  DEFAULT_QUERY_PREFS,
);

/**
 * Reads the persisted `{filter,sort}` envelope via the typed storage
 * service — absent key, malformed JSON, a non-envelope shape, or data that
 * fails `taskQueryPrefsSchema` all total-read to `DEFAULT_QUERY_PREFS`
 * (F-038, inherited from `getItem`, never thrown). Exported (rather than
 * only called inline) so the "boot restores persisted query prefs"
 * behavior is directly unit-testable without `jest.resetModules()`
 * gymnastics — same rationale as `taskStore.hydrateTasks`/
 * `profileStore.hydrateProfile`.
 */
export function hydrateTaskQueryPrefs(): TaskQueryPrefs {
  return queryPrefsPersistence.hydrate();
}

export interface TaskQueryState {
  filter: TaskFilter;
  sort: TaskSortKey;
  /** In-memory only (NOT persisted) — resets to `''` on every fresh store read (spec FR1/FR6). */
  search: string;
  /** Persists the full `{filter,sort}` envelope immediately, then updates state. */
  setFilter: (filter: TaskFilter) => void;
  /** Persists the full `{filter,sort}` envelope immediately, then updates state. */
  setSort: (sort: TaskSortKey) => void;
  /** Plain state — never persisted. */
  setSearch: (search: string) => void;
}

export const useTaskQueryStore = create<TaskQueryState>((set, get) => {
  const initialPrefs = hydrateTaskQueryPrefs();

  return {
    filter: initialPrefs.filter,
    sort: initialPrefs.sort,
    search: '',

    setFilter: filter => {
      queryPrefsPersistence.persist({filter, sort: get().sort});
      set({filter});
    },

    setSort: sort => {
      queryPrefsPersistence.persist({filter: get().filter, sort});
      set({sort});
    },

    setSearch: search => {
      set({search});
    },
  };
});
