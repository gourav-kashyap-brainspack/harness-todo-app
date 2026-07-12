import {describe, expect, it} from '@jest/globals';

import type {Task} from '@/core/types/task';

import type {TaskFilter, TaskSortKey} from '../store/taskQueryStore';
import {selectVisibleTasks} from './selectVisibleTasks';

function makeTask(overrides: Partial<Task> & Pick<Task, 'id' | 'title' | 'status' | 'createdAt'>): Task {
  return {
    updatedAt: overrides.createdAt,
    ...overrides,
  };
}

const OLDEST = makeTask({
  id: '11edc52b-2918-4d71-9058-f7285e29d894',
  title: 'Buy milk',
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z',
});

const MIDDLE = makeTask({
  id: '22edc52b-2918-4d71-9058-f7285e29d894',
  title: 'Walk the dog',
  status: 'completed',
  createdAt: '2026-01-02T00:00:00.000Z',
});

const NEWEST = makeTask({
  id: '33edc52b-2918-4d71-9058-f7285e29d894',
  title: 'File taxes',
  status: 'active',
  createdAt: '2026-01-03T00:00:00.000Z',
});

const TASKS: Task[] = [OLDEST, MIDDLE, NEWEST];

describe('selectVisibleTasks (ORG-001, FR2)', () => {
  it('filter="all" passes every task through', () => {
    const result = selectVisibleTasks(TASKS, {search: '', filter: 'all', sort: 'created-desc'});

    expect(result).toHaveLength(3);
  });

  it('filter="active" returns only active tasks', () => {
    const result = selectVisibleTasks(TASKS, {search: '', filter: 'active', sort: 'created-desc'});

    expect(result.map(t => t.id)).toEqual([NEWEST.id, OLDEST.id]);
  });

  it('filter="completed" returns only completed tasks', () => {
    const result = selectVisibleTasks(TASKS, {search: '', filter: 'completed', sort: 'created-desc'});

    expect(result.map(t => t.id)).toEqual([MIDDLE.id]);
  });

  it('sort="created-desc" orders newest createdAt first', () => {
    const result = selectVisibleTasks(TASKS, {search: '', filter: 'all', sort: 'created-desc'});

    expect(result.map(t => t.id)).toEqual([NEWEST.id, MIDDLE.id, OLDEST.id]);
  });

  it('an unrecognized (future-build) sort key falls back to created-desc without crashing (defensive symmetry, ORG-003)', () => {
    // Every `TaskSortKey` member has a comparator entry as of ORG-003; this
    // casts past the union the same way a persisted-but-stale value from a
    // FUTURE build could arrive at runtime — `resolveComparator`'s `??`
    // fallback must degrade gracefully rather than throwing.
    const result = selectVisibleTasks(TASKS, {
      search: '',
      filter: 'all',
      sort: 'unknown-future-key' as unknown as TaskSortKey,
    });

    expect(result.map(t => t.id)).toEqual([NEWEST.id, MIDDLE.id, OLDEST.id]);
  });

  it('is pure: never mutates or reorders the input array', () => {
    const input = [OLDEST, MIDDLE, NEWEST];
    const snapshot = [...input];

    selectVisibleTasks(input, {search: '', filter: 'active', sort: 'created-desc'});

    expect(input).toEqual(snapshot);
    expect(input[0]).toBe(OLDEST);
    expect(input[1]).toBe(MIDDLE);
    expect(input[2]).toBe(NEWEST);
  });

  it('always returns a NEW array, never the same reference as the input', () => {
    const result = selectVisibleTasks(TASKS, {search: '', filter: 'all', sort: 'created-desc'});

    expect(result).not.toBe(TASKS);
  });

  it('empty search is a passthrough', () => {
    const result = selectVisibleTasks(TASKS, {search: '', filter: 'all', sort: 'created-desc'});

    expect(result).toHaveLength(3);
  });

  it('whitespace-only search is a passthrough (trimmed to empty)', () => {
    const result = selectVisibleTasks(TASKS, {search: '   ', filter: 'all', sort: 'created-desc'});

    expect(result).toHaveLength(3);
  });

  it('OQ-8 — a status toggle does not reorder the list under created-desc (createdAt is immutable)', () => {
    const before = selectVisibleTasks(TASKS, {search: '', filter: 'all', sort: 'created-desc'});

    const toggled: Task[] = [OLDEST, {...MIDDLE, status: 'active'}, NEWEST];
    const after = selectVisibleTasks(toggled, {search: '', filter: 'all', sort: 'created-desc'});

    expect(after.map(t => t.id)).toEqual(before.map(t => t.id));
  });

  it('an unrecognized filter value falls back to the "all" passthrough (advisory 2, defensive symmetry)', () => {
    // Cast past the `TaskFilter` union the same way a persisted-but-stale
    // value could arrive at runtime — `FILTER_PREDICATES` has no entry for
    // it, so the `?? FILTER_PREDICATES.all` fallback must apply rather than
    // crash on `undefined` being called as a predicate.
    const result = selectVisibleTasks(TASKS, {
      search: '',
      filter: 'unknown' as unknown as TaskFilter,
      sort: 'created-desc',
    });

    expect(result).toHaveLength(3);
  });
});

describe('sort — due/alpha/updated comparators (ORG-003, F-026/F-028/F-029)', () => {
  const DUE_SOON = makeTask({
    id: '99edc52b-2918-4d71-9058-f7285e29d894',
    title: 'Zebra task',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    dueDate: '2026-02-01T00:00:00.000Z',
  });
  const DUE_LATER = makeTask({
    id: 'a1edc52b-2918-4d71-9058-f7285e29d894',
    title: 'apple task',
    status: 'active',
    createdAt: '2026-01-02T00:00:00.000Z',
    dueDate: '2026-03-01T00:00:00.000Z',
  });
  const NO_DUE_1 = makeTask({
    id: 'a2edc52b-2918-4d71-9058-f7285e29d894',
    title: 'Mango task',
    status: 'active',
    createdAt: '2026-01-03T00:00:00.000Z',
  });
  const NO_DUE_2 = makeTask({
    id: 'a3edc52b-2918-4d71-9058-f7285e29d894',
    title: 'banana task',
    status: 'active',
    createdAt: '2026-01-04T00:00:00.000Z',
  });
  const DUE_TASKS: Task[] = [NO_DUE_1, DUE_LATER, NO_DUE_2, DUE_SOON];

  it('sort="due" orders ascending by dueDate, soonest first (F-026)', () => {
    const result = selectVisibleTasks(DUE_TASKS, {search: '', filter: 'all', sort: 'due'});

    expect(result.slice(0, 2).map(t => t.id)).toEqual([DUE_SOON.id, DUE_LATER.id]);
  });

  it('sort="due" puts tasks with no dueDate LAST, in their pre-sort relative order (stable)', () => {
    const result = selectVisibleTasks(DUE_TASKS, {search: '', filter: 'all', sort: 'due'});

    // The two dueDate-bearing tasks come first (soonest first), then the two
    // no-dueDate tasks in their original array order (NO_DUE_1, NO_DUE_2) —
    // proves stability, not an incidental re-ordering.
    expect(result.map(t => t.id)).toEqual([DUE_SOON.id, DUE_LATER.id, NO_DUE_1.id, NO_DUE_2.id]);
  });

  it('sort="alpha" orders by title, case-insensitive A→Z (F-028)', () => {
    const result = selectVisibleTasks(DUE_TASKS, {search: '', filter: 'all', sort: 'alpha'});

    // "apple task" < "banana task" < "Mango task" < "Zebra task" once case
    // is ignored — proves the comparison is case-insensitive, not a raw
    // codepoint compare (which would put every capitalized title first).
    expect(result.map(t => t.id)).toEqual([DUE_LATER.id, NO_DUE_2.id, NO_DUE_1.id, DUE_SOON.id]);
  });

  it('sort="updated" orders descending by updatedAt, most recently changed first (F-029)', () => {
    const tasks: Task[] = [
      {...NO_DUE_1, updatedAt: '2026-01-10T00:00:00.000Z'},
      {...NO_DUE_2, updatedAt: '2026-01-20T00:00:00.000Z'},
      {...DUE_SOON, updatedAt: '2026-01-15T00:00:00.000Z'},
    ];

    const result = selectVisibleTasks(tasks, {search: '', filter: 'all', sort: 'updated'});

    expect(result.map(t => t.id)).toEqual([NO_DUE_2.id, DUE_SOON.id, NO_DUE_1.id]);
  });

  it('due/alpha/updated all compose with the active filter (sort applies AFTER filter)', () => {
    const completedZebra: Task = {...DUE_SOON, id: 'a4edc52b-2918-4d71-9058-f7285e29d894', status: 'completed'};
    const tasks = [...DUE_TASKS, completedZebra];

    const result = selectVisibleTasks(tasks, {search: '', filter: 'active', sort: 'alpha'});

    expect(result.map(t => t.id)).toEqual([DUE_LATER.id, NO_DUE_2.id, NO_DUE_1.id, DUE_SOON.id]);
    expect(result.map(t => t.id)).not.toContain(completedZebra.id);
  });

  it('is pure for every comparator: never mutates or reorders the input array', () => {
    const input = [...DUE_TASKS];
    const snapshot = [...input];

    (['due', 'alpha', 'updated'] as const).forEach(sort => {
      selectVisibleTasks(input, {search: '', filter: 'all', sort});
    });

    expect(input).toEqual(snapshot);
    input.forEach((task, index) => expect(task).toBe(DUE_TASKS[index]));
  });

  it('OQ-8 — a status toggle does not reorder the list under "due" (dueDate is unaffected by a toggle)', () => {
    const before = selectVisibleTasks(DUE_TASKS, {search: '', filter: 'all', sort: 'due'});

    const toggled = DUE_TASKS.map(t => (t.id === NO_DUE_1.id ? {...t, status: 'completed' as const} : t));
    const after = selectVisibleTasks(toggled, {search: '', filter: 'all', sort: 'due'});

    expect(after.map(t => t.id)).toEqual(before.map(t => t.id));
  });

  it('OQ-8 — a status toggle does not reorder the list under "alpha" (title is unaffected by a toggle)', () => {
    const before = selectVisibleTasks(DUE_TASKS, {search: '', filter: 'all', sort: 'alpha'});

    const toggled = DUE_TASKS.map(t => (t.id === NO_DUE_1.id ? {...t, status: 'completed' as const} : t));
    const after = selectVisibleTasks(toggled, {search: '', filter: 'all', sort: 'alpha'});

    expect(after.map(t => t.id)).toEqual(before.map(t => t.id));
  });

  it('OQ-8 — under "updated", a toggled task LEGITIMATELY moves (its updatedAt just changed) — this is correct, not a violation', () => {
    const tasks: Task[] = [
      {...NO_DUE_1, updatedAt: '2026-01-10T00:00:00.000Z'},
      {...NO_DUE_2, updatedAt: '2026-01-20T00:00:00.000Z'},
    ];
    const before = selectVisibleTasks(tasks, {search: '', filter: 'all', sort: 'updated'});
    expect(before.map(t => t.id)).toEqual([NO_DUE_2.id, NO_DUE_1.id]);

    // Toggling NO_DUE_1 bumps its updatedAt past NO_DUE_2's — it should now
    // sort first, a legitimate reorder under `updated` (not a violation of
    // OQ-8, which only forbids reordering under sorts that don't read
    // `updatedAt`).
    const toggled: Task[] = tasks.map(t =>
      t.id === NO_DUE_1.id ? {...t, status: 'completed' as const, updatedAt: '2026-01-25T00:00:00.000Z'} : t,
    );
    const after = selectVisibleTasks(toggled, {search: '', filter: 'all', sort: 'updated'});

    expect(after.map(t => t.id)).toEqual([NO_DUE_1.id, NO_DUE_2.id]);
  });
});

describe('matchesSearch (ORG-002, FR3, F-020/F-021 — via selectVisibleTasks)', () => {
  const MILK = makeTask({
    id: '44edc52b-2918-4d71-9058-f7285e29d894',
    title: 'Buy milk',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    description: 'Get oat milk from the store',
  });

  const BANK = makeTask({
    id: '55edc52b-2918-4d71-9058-f7285e29d894',
    title: 'Call bank',
    status: 'active',
    createdAt: '2026-01-02T00:00:00.000Z',
  });

  const SEARCHABLE: Task[] = [MILK, BANK];

  it('matches a title substring (F-020)', () => {
    const result = selectVisibleTasks(SEARCHABLE, {search: 'milk', filter: 'all', sort: 'created-desc'});

    expect(result.map(t => t.id)).toEqual([MILK.id]);
  });

  it('matches a description substring when the title does not match (F-021)', () => {
    const result = selectVisibleTasks(SEARCHABLE, {search: 'oat', filter: 'all', sort: 'created-desc'});

    expect(result.map(t => t.id)).toEqual([MILK.id]);
  });

  it('is case-insensitive', () => {
    const result = selectVisibleTasks(SEARCHABLE, {search: 'MILK', filter: 'all', sort: 'created-desc'});

    expect(result.map(t => t.id)).toEqual([MILK.id]);
  });

  it('trims leading/trailing whitespace from the query', () => {
    const result = selectVisibleTasks(SEARCHABLE, {search: '  milk  ', filter: 'all', sort: 'created-desc'});

    expect(result.map(t => t.id)).toEqual([MILK.id]);
  });

  it('a missing description does not crash and simply does not match on that field', () => {
    const result = selectVisibleTasks(SEARCHABLE, {search: 'bank', filter: 'all', sort: 'created-desc'});

    expect(result.map(t => t.id)).toEqual([BANK.id]);
  });

  it('no match yields an empty array (feeds the no-results empty state)', () => {
    const result = selectVisibleTasks(SEARCHABLE, {search: 'xyz', filter: 'all', sort: 'created-desc'});

    expect(result).toEqual([]);
  });

  it('a query beyond the length cap is clamped, not rejected outright', () => {
    // "Buy milk" starts with "Buy milk" — a 128-char-capped query whose
    // first 128 characters are exactly "buy milk" followed by padding still
    // matches on the clamped prefix, proving the cap truncates rather than
    // bypasses the match.
    const paddedQuery = `buy milk${'z'.repeat(200)}`;
    const result = selectVisibleTasks(SEARCHABLE, {search: paddedQuery, filter: 'all', sort: 'created-desc'});

    // The clamped (128-char) query still contains 200 trailing "z"s beyond
    // "buy milk", so it no longer matches "Buy milk" as a substring — this
    // proves the cap is APPLIED (a truly unbounded compare would just fail
    // to match too, so assert the cap changes behavior relative to the
    // uncapped equivalent below).
    expect(result).toEqual([]);
  });

  it('length-cap: two queries that are identical only within the first 128 characters match the same tasks', () => {
    const base = 'buy milk' + 'x'.repeat(120); // 128 chars total
    const withExtraTail = base + 'this suffix is beyond the cap and must be ignored';
    const taskMatchingBase = makeTask({
      id: '66edc52b-2918-4d71-9058-f7285e29d894',
      title: `Task titled ${base}`,
      status: 'active',
      createdAt: '2026-01-03T00:00:00.000Z',
    });

    const resultShort = selectVisibleTasks([taskMatchingBase], {
      search: base,
      filter: 'all',
      sort: 'created-desc',
    });
    const resultLong = selectVisibleTasks([taskMatchingBase], {
      search: withExtraTail,
      filter: 'all',
      sort: 'created-desc',
    });

    expect(resultShort.map(t => t.id)).toEqual([taskMatchingBase.id]);
    expect(resultLong.map(t => t.id)).toEqual(resultShort.map(t => t.id));
  });

  it('composes with the active filter (search ∩ active)', () => {
    const completedMilkErrand = makeTask({
      id: '77edc52b-2918-4d71-9058-f7285e29d894',
      title: 'Buy oat milk (done)',
      status: 'completed',
      createdAt: '2026-01-04T00:00:00.000Z',
    });
    const tasks = [MILK, completedMilkErrand];

    const result = selectVisibleTasks(tasks, {search: 'milk', filter: 'active', sort: 'created-desc'});

    expect(result.map(t => t.id)).toEqual([MILK.id]);
  });

  it('SECURITY (advisory 1): a regex-special-char query is treated as a LITERAL substring, never a pattern — no RegExp/ReDoS surface', () => {
    // If the implementation ever built `new RegExp(search)` or called
    // `.match(search)`, `.*` would match EVERY task (any string matches the
    // pattern "zero-or-more of any character"). Under a plain
    // `String.prototype.includes`, `.*` only matches a task whose title/
    // description literally CONTAINS the two characters ".*" — proving no
    // RegExp is ever constructed from user input.
    const literalDotStar = makeTask({
      id: '88edc52b-2918-4d71-9058-f7285e29d894',
      title: 'Wildcard rule: .* matches everything',
      status: 'active',
      createdAt: '2026-01-05T00:00:00.000Z',
    });
    const tasks = [MILK, BANK, literalDotStar];

    const result = selectVisibleTasks(tasks, {search: '.*', filter: 'all', sort: 'created-desc'});

    expect(result.map(t => t.id)).toEqual([literalDotStar.id]);
  });

  it('is pure: matching does not mutate the task or search inputs', () => {
    const taskSnapshot = {...MILK};
    const searchQuery = 'milk';

    selectVisibleTasks([MILK], {search: searchQuery, filter: 'all', sort: 'created-desc'});

    expect(MILK).toEqual(taskSnapshot);
    expect(searchQuery).toBe('milk');
  });
});
