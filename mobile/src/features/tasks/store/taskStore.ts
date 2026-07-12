import {create} from 'zustand';

import {
  getTasks,
  removeTask as removeTaskFromRepository,
  upsertTask,
  type UpsertTaskInput,
} from '@/core/services/taskRepository';
import type {Task, TaskStatus} from '@/core/types/task';

/**
 * Reads the persisted task collection via the STG repository. Exported
 * (rather than only used inline) so the "hydrate on init" behavior is
 * directly unit-testable without module-reset gymnastics — the same
 * rationale `profileStore.hydrateProfile` documents (patterns-registry.md
 * -> "Feature store hydrates from a repository"). `taskRepository.getTasks`
 * is already a TOTAL read (absent/corrupt -> `[]`, F-038) — that guarantee
 * is inherited here, not re-implemented.
 */
export function hydrateTasks(): Task[] {
  return getTasks();
}

/**
 * Input to `addTask` — every task business field EXCEPT `status`, which
 * defaults to `'active'` inside the action (a freshly created task is never
 * pre-completed); a caller can still pass `status` explicitly if a future
 * flow needs to.
 */
export type AddTaskInput = Omit<UpsertTaskInput, 'id' | 'status'> & {status?: TaskStatus};

/**
 * Input to `updateTask` — the full business-field set (per `upsertTask`'s
 * wholesale-replace contract, patterns-registry.md -> "Repository pattern":
 * an edit submits ALL fields, not a partial patch) plus the `id` of the
 * task being edited.
 */
export type UpdateTaskInput = Omit<UpsertTaskInput, 'id'> & {id: string};

export interface TaskState {
  /**
   * The single in-memory task collection every TSK/ORG screen reads — the
   * SINGLE task-state source app-wide (coherence check 3). Never duplicate
   * server/persisted task data into a second store/slice.
   */
  tasks: Task[];
  /** Creates a new task (`status` defaults to `'active'` — TSK-002). */
  addTask: (input: AddTaskInput) => void;
  /** Wholesale-replaces an existing task's business fields (TSK-003). */
  updateTask: (input: UpdateTaskInput) => void;
  /** Deletes a task by id — a no-op if it doesn't exist (TSK-004). */
  removeTask: (id: string) => void;
  /**
   * Flips a task between `active` and `completed` (TSK-004). A no-op if
   * `id` isn't found in the current in-memory `tasks` (e.g. a stale row
   * from a race with another mutation) — mirrors `taskRepository.removeTask`'s
   * "no-op on a missing id" contract rather than throwing.
   */
  toggleStatus: (id: string) => void;
  /**
   * Creates a copy of a task: same `title`/`description`/`dueDate`,
   * `status` reset to `'active'`, a fresh id/timestamps minted by
   * `taskRepository.upsertTask` (no `id` passed through). A basic-but-correct
   * implementation — TSK-004 refines the exact copy semantics (e.g. a
   * "(copy)" title suffix) without changing this action's shape.
   */
  duplicateTask: (id: string) => void;
  /**
   * Re-reads the full collection from the repository — the pull-to-refresh
   * action (F-042). Local-only storage, so this is a synchronous re-hydrate,
   * never a network round-trip; no artificial delay.
   */
  refresh: () => void;
}

/**
 * Tasks feature store (TSK-001, FR1) — the SINGLE source of task state
 * every later TSK/ORG screen reads and mutates (coherence check 3); the TSK
 * anchor every later task extends, never forks. Mirrors `profileStore`'s
 * hydrate-from-repository shape exactly (patterns-registry.md -> "Feature
 * store hydrates from a repository"): hydrated once at module-init from
 * `taskRepository.getTasks()`, and every mutator below writes through
 * `taskRepository` FIRST — a pure transform that returns the new full
 * collection — and only then updates in-memory state via `set`. This store
 * is never the source of truth; the persisted collection is.
 *
 * `updatedAt` is bumped exactly once, inside `taskRepository.upsertTask`
 * (coherence check 2) — no action below recomputes or passes it through.
 */
export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: hydrateTasks(),

  addTask: input => {
    const next = upsertTask({...input, status: input.status ?? 'active'});
    set({tasks: next});
  },

  updateTask: input => {
    const next = upsertTask(input);
    set({tasks: next});
  },

  removeTask: id => {
    const next = removeTaskFromRepository(id);
    set({tasks: next});
  },

  toggleStatus: id => {
    const task = get().tasks.find(t => t.id === id);
    if (!task) {
      return;
    }
    const next = upsertTask({
      id: task.id,
      title: task.title,
      description: task.description,
      dueDate: task.dueDate,
      status: task.status === 'completed' ? 'active' : 'completed',
    });
    set({tasks: next});
  },

  duplicateTask: id => {
    const task = get().tasks.find(t => t.id === id);
    if (!task) {
      return;
    }
    const next = upsertTask({
      title: task.title,
      description: task.description,
      dueDate: task.dueDate,
      status: 'active',
    });
    set({tasks: next});
  },

  refresh: () => {
    set({tasks: getTasks()});
  },
}));
