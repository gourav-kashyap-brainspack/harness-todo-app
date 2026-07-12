import {describe, expect, it} from '@jest/globals';

import type {Task} from '@/core/types/task';

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

  it('empty search is a passthrough (ORG-002 slot, not implemented yet)', () => {
    const result = selectVisibleTasks(TASKS, {search: '', filter: 'all', sort: 'created-desc'});

    expect(result).toHaveLength(3);
  });

  it('a non-empty search is currently a no-op passthrough too (ORG-002 wires the real predicate)', () => {
    const result = selectVisibleTasks(TASKS, {search: 'anything', filter: 'all', sort: 'created-desc'});

    expect(result).toHaveLength(3);
  });

  it('OQ-8 — a status toggle does not reorder the list under created-desc (createdAt is immutable)', () => {
    const before = selectVisibleTasks(TASKS, {search: '', filter: 'all', sort: 'created-desc'});

    const toggled: Task[] = [OLDEST, {...MIDDLE, status: 'active'}, NEWEST];
    const after = selectVisibleTasks(toggled, {search: '', filter: 'all', sort: 'created-desc'});

    expect(after.map(t => t.id)).toEqual(before.map(t => t.id));
  });
});
