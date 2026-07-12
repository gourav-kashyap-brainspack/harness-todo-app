import type {Task} from '@/core/types/task';

import type {TaskFilter, TaskSortKey} from '../store/taskQueryStore';

/**
 * The organize query — the view parameters `selectVisibleTasks` composes
 * over `useTaskStore`'s `tasks` (ORG-001). Structurally identical to
 * `TaskQueryState`'s persisted slice but declared independently so this
 * module stays a pure function of plain data, not a Zustand consumer.
 */
export interface TaskQuery {
  search: string;
  filter: TaskFilter;
  sort: TaskSortKey;
}

/**
 * `filter` predicates — `all` is a passthrough, `active`/`completed` match
 * `Task.status` exactly. A lookup (not an `if`/`switch` chain) so ORG never
 * needs to touch this shape again; only the map ever grows.
 */
const FILTER_PREDICATES: Record<TaskFilter, (task: Task) => boolean> = {
  all: () => true,
  active: task => task.status === 'active',
  completed: task => task.status === 'completed',
};

/**
 * `sort` comparators, keyed by `TaskSortKey`. Only `created-desc` is
 * implemented this task (newest `createdAt` first); ORG-003 fills in
 * `due`/`alpha`/`updated` by adding entries here — no pipeline change
 * needed. An unrecognized/not-yet-wired key falls back to `created-desc`
 * (see `resolveComparator`) so a persisted `sort` value from a future
 * build never crashes an older-than-ORG-003 read.
 */
const CREATED_DESC_COMPARATOR = (a: Task, b: Task): number => b.createdAt.localeCompare(a.createdAt);

const SORT_COMPARATORS: Partial<Record<TaskSortKey, (a: Task, b: Task) => number>> = {
  'created-desc': CREATED_DESC_COMPARATOR,
  // ORG-003 slots: due: …, alpha: …, updated: …
};

function resolveComparator(sort: TaskSortKey): (a: Task, b: Task) => number {
  return SORT_COMPARATORS[sort] ?? CREATED_DESC_COMPARATOR;
}

/**
 * `search` predicate — a no-op passthrough for ORG-001 (spec FR2: "a
 * non-empty search may either passthrough — but structure the seam so
 * ORG-002 drops in a title/description substring match"). Isolated in its
 * own function (rather than inlined in the pipeline below) so ORG-002 swaps
 * this one implementation for a real predicate without touching
 * `selectVisibleTasks` itself.
 */
function matchesSearch(_task: Task, _search: string): boolean {
  return true;
}

/**
 * Pure derived selector (ORG-001, FR2) — composes **search → filter →
 * sort** over the single `useTaskStore` `tasks` array and returns a NEW
 * array. Never mutates or reorders the input: `tasks` stays the
 * persistence-order source of truth (the coherence invariant the spec
 * calls out), and `.slice()` before `.sort()` guards against `Array.sort`'s
 * in-place mutation.
 *
 * OQ-8: sorting is stable across a status toggle under `created-desc`
 * because `createdAt` never changes when `status` flips (`taskStore`'s
 * `toggleStatus` only bumps `updatedAt`) — the comparator has nothing new
 * to react to, so a toggled task never jumps position.
 */
export function selectVisibleTasks(tasks: Task[], query: TaskQuery): Task[] {
  const searched = query.search.trim() === '' ? tasks : tasks.filter(task => matchesSearch(task, query.search));
  const filtered = searched.filter(FILTER_PREDICATES[query.filter]);
  return filtered.slice().sort(resolveComparator(query.sort));
}
