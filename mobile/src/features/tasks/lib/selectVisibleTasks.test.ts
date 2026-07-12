import {describe, expect, it} from '@jest/globals';

import type {Task} from '@/core/types/task';

import type {TaskFilter} from '../store/taskQueryStore';
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

  it('an unimplemented (declared-but-not-yet-wired) sort key falls back to created-desc without crashing', () => {
    // `due`/`alpha`/`updated` are valid `TaskSortKey` members (ORG-003
    // slots) with no comparator entry yet — the lookup must degrade
    // gracefully rather than throwing or leaving the list unsorted.
    const result = selectVisibleTasks(TASKS, {search: '', filter: 'all', sort: 'due'});

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
