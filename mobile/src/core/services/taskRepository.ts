import {newId} from '@/core/lib/id';
import {getItem, setItem, StorageKeys} from '@/core/services/storage';
import {taskListSchema, type Task} from '@/core/types/task';

/**
 * The Task persistence path (STG-002, F-036). The ONLY way any
 * feature/domain code reads or writes the persisted task collection — TSK
 * builds its task UI/state on top of these functions, it does not call the
 * storage service directly or re-declare the Task shape (FR5).
 *
 * The collection persists as a single `Task[]` JSON blob under
 * `StorageKeys.tasks` (spec "Performance" note: fine for MVP volumes,
 * pagination/indexing is a documented future concern, not in scope here).
 *
 * Ownership boundary (spec FR4): STG owns persistence + the `Task` shape
 * (this file + `core/types/task.ts`); TSK owns the feature store (actions,
 * screens, filtering/sorting) that calls into it — see `createPersistedValue`
 * in `storage.ts` for the hydration recipe TSK's store should follow.
 */

const NO_TASKS: Task[] = [];

/**
 * Reads the persisted task collection. `[]` covers both "never set" and
 * "corrupt/invalid persisted blob" (F-038, inherited from `getItem` — never
 * throws).
 */
export function getTasks(): Task[] {
  return getItem(StorageKeys.tasks, taskListSchema, NO_TASKS);
}

/**
 * Persists the full task collection. `setItem` Zod-validates every task in
 * `tasks` against `taskListSchema` before writing and throws on a mismatch
 * (a caller bug, not corrupt storage — see `profileRepository.saveProfile`
 * for the same rationale). `upsertTask`/`removeTask` below produce an
 * already-valid array, so this throw path only fires if a caller bypasses
 * them with a hand-built array.
 */
export function saveTasks(tasks: Task[]): void {
  setItem(StorageKeys.tasks, taskListSchema, tasks);
}

/**
 * Input to `upsertTask`: every Task field the caller controls (`title`,
 * `description`, `status`, `dueDate`), plus an OPTIONAL `id`. `id`/
 * `createdAt`/`updatedAt` are managed by `upsertTask` itself, never
 * supplied piecemeal by the caller — see its doc comment.
 */
export type UpsertTaskInput = Omit<Task, 'id' | 'createdAt' | 'updatedAt'> & {id?: string};

/**
 * Pure transform: adds `task` as a new persisted task, or — when `task.id`
 * matches an existing task — replaces its business fields (`title`,
 * `description`, `status`, `dueDate`) in place. Either way, persists the
 * resulting collection and returns it. This is a wholesale field replace on
 * update, not a partial patch/merge: TSK's edit form should always submit
 * the full set of business fields.
 *
 * - **New task** (`task.id` absent, or present but not found): generates a
 *   fresh id via `newId()` (uuid v4 string — spec-gap d) unless the caller
 *   already supplied one, and stamps `createdAt`/`updatedAt` to now — TSK's
 *   create action never has to construct those fields itself.
 * - **Existing task** (`task.id` matches): keeps the original `id` and
 *   `createdAt`, bumps `updatedAt` to now.
 */
export function upsertTask(task: UpsertTaskInput): Task[] {
  const now = new Date().toISOString();
  const existing = getTasks();
  const existingIndex = task.id ? existing.findIndex(t => t.id === task.id) : -1;

  // Split `id` out of the business fields so `fields` can be spread without
  // ever leaking the caller-supplied id past the per-branch resolution
  // below (a stray `task.id` in the update branch could otherwise
  // overwrite `existing[existingIndex].id`, which must never change).
  const {id: inputId, ...fields} = task;
  const resolved: Task =
    existingIndex >= 0
      ? {...fields, id: existing[existingIndex].id, createdAt: existing[existingIndex].createdAt, updatedAt: now}
      : {...fields, id: inputId ?? newId(), createdAt: now, updatedAt: now};

  const next =
    existingIndex >= 0
      ? existing.map((t, i) => (i === existingIndex ? resolved : t))
      : [...existing, resolved];

  saveTasks(next);
  return next;
}

/** Pure transform: removes the task with `id` (a no-op if absent),
 * persists the result, and returns it. */
export function removeTask(id: string): Task[] {
  const next = getTasks().filter(t => t.id !== id);
  saveTasks(next);
  return next;
}
