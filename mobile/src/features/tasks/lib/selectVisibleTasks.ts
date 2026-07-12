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
 * ORG-002 security advisory 1 (from the ORG-001 review, `stack.md`): `search`
 * is UNTRUSTED user input. Clamp it to a reasonable length BEFORE it ever
 * reaches a string operation — a pathological multi-KB paste into the search
 * field should cost `.includes` no more than this cap, not the full input
 * length, on every keystroke re-derive.
 */
const SEARCH_QUERY_MAX_LENGTH = 128;

/**
 * `search` predicate (ORG-002, FR3, F-020/F-021) — a task matches when the
 * normalized query is a substring of its title (F-020) OR description
 * (F-021). Normalization: trim, lowercase, then clamp to
 * `SEARCH_QUERY_MAX_LENGTH` — same three steps applied to both the query and
 * the fields it's compared against, so "buy" matches "Buy milk" regardless of
 * case.
 *
 * **Security (advisory 1, `docs/context/stack.md`):** plain
 * `String.prototype.includes` ONLY — never `RegExp`/`.match()` built from the
 * raw query. A user-controlled regex is a ReDoS vector even in a fully local,
 * offline app (a pathological pattern like `(a+)+$` can still hang the JS
 * thread); a literal substring check has no such failure mode and is exactly
 * what F-020/F-021 ask for ("contains", not "matches a pattern").
 *
 * Pure — reads `task`/`search`, mutates neither.
 */
function matchesSearch(task: Task, search: string): boolean {
  const query = search.trim().toLowerCase().slice(0, SEARCH_QUERY_MAX_LENGTH);
  if (query === '') {
    return true;
  }
  const titleMatches = task.title.toLowerCase().includes(query);
  const descriptionMatches = task.description?.toLowerCase().includes(query) ?? false;
  return titleMatches || descriptionMatches;
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
  // ORG-002 security advisory 2 (defensive symmetry with `resolveComparator`
  // above): fall back to the `all` passthrough rather than crash on an
  // unrecognized `filter` value.
  const filtered = searched.filter(FILTER_PREDICATES[query.filter] ?? FILTER_PREDICATES.all);
  return filtered.slice().sort(resolveComparator(query.sort));
}
