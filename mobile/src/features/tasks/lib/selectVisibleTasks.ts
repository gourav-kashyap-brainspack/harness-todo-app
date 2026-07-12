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
 * `sort` comparators, keyed by `TaskSortKey` (ORG-003, F-026–029). Every key
 * declared on `TaskSortKey` has an entry now; `resolveComparator` keeps its
 * `?? CREATED_DESC_COMPARATOR` fallback anyway (defensive symmetry with
 * `FILTER_PREDICATES`' own fallback) so a persisted `sort` value from a
 * FUTURE build (a key this build doesn't know about yet) still degrades
 * gracefully instead of crashing.
 */
const CREATED_DESC_COMPARATOR = (a: Task, b: Task): number => b.createdAt.localeCompare(a.createdAt);

/**
 * `due` (F-026) — ascending by `dueDate` (soonest first); `dueDate` is
 * optional, so a task without one sorts LAST. Two no-`dueDate` tasks (or two
 * equal `dueDate`s) compare equal — `Array.prototype.sort` is stable in
 * every JS engine this app targets (ES2019+), so their relative order is
 * preserved from the pre-sort (search+filter) slice rather than shuffled.
 * ISO-8601 datetime strings (the schema's `dueDate` shape) compare lexically
 * in the same order as chronologically, so a plain `localeCompare` is
 * correct without parsing to `Date`.
 */
const DUE_COMPARATOR = (a: Task, b: Task): number => {
  if (!a.dueDate && !b.dueDate) {
    return 0;
  }
  if (!a.dueDate) {
    return 1;
  }
  if (!b.dueDate) {
    return -1;
  }
  return a.dueDate.localeCompare(b.dueDate);
};

/**
 * `alpha` (F-028) — by `title`, case-insensitive A→Z. `localeCompare`'s
 * `sensitivity: 'base'` option ignores case (and accents) so "milk" and
 * "Milk" compare equal rather than one consistently sorting before the
 * other by codepoint.
 */
const ALPHA_COMPARATOR = (a: Task, b: Task): number =>
  a.title.localeCompare(b.title, undefined, {sensitivity: 'base'});

/**
 * `updated` (F-029) — descending by `updatedAt` (most recently changed
 * first). Mirrors `CREATED_DESC_COMPARATOR`'s shape exactly, just on the
 * other timestamp field.
 */
const UPDATED_DESC_COMPARATOR = (a: Task, b: Task): number => b.updatedAt.localeCompare(a.updatedAt);

const SORT_COMPARATORS: Partial<Record<TaskSortKey, (a: Task, b: Task) => number>> = {
  'created-desc': CREATED_DESC_COMPARATOR,
  due: DUE_COMPARATOR,
  alpha: ALPHA_COMPARATOR,
  updated: UPDATED_DESC_COMPARATOR,
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
 * OQ-8 (ORG-003, FR4): a status toggle must NOT reorder the list under
 * `created-desc`/`due`/`alpha` — `toggleStatus` only bumps `updatedAt`, and
 * none of those three comparators reads `updatedAt`, so a toggled task never
 * jumps position under them. Under `updated` a toggled task legitimately
 * moves (it now sorts by the very field the toggle just changed) — that's
 * correct, not a violation.
 */
export function selectVisibleTasks(tasks: Task[], query: TaskQuery): Task[] {
  const searched = query.search.trim() === '' ? tasks : tasks.filter(task => matchesSearch(task, query.search));
  // ORG-002 security advisory 2 (defensive symmetry with `resolveComparator`
  // above): fall back to the `all` passthrough rather than crash on an
  // unrecognized `filter` value.
  const filtered = searched.filter(FILTER_PREDICATES[query.filter] ?? FILTER_PREDICATES.all);
  return filtered.slice().sort(resolveComparator(query.sort));
}
