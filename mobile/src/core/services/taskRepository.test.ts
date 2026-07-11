import {afterEach, describe, expect, it, jest} from '@jest/globals';
import {MMKV} from 'react-native-mmkv';

import {getTasks, removeTask, saveTasks, upsertTask} from '@/core/services/taskRepository';
import type {Task} from '@/core/types/task';

const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const VALID_TASK: Task = {
  id: '11edc52b-2918-4d71-9058-f7285e29d894',
  title: 'Buy milk',
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

// Same testability note as storage.test.ts / profileRepository.test.ts:
// `react-native-mmkv` auto-mocks to one shared in-memory Map per test FILE
// (module registry is isolated per file, not per `it`). Resetting the
// `tasks` key via `saveTasks([])` in `afterEach` keeps tests independent.
describe('taskRepository', () => {
  afterEach(() => {
    saveTasks([]);
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('round-trips a saved task collection', () => {
    saveTasks([VALID_TASK]);

    expect(getTasks()).toEqual([VALID_TASK]);
  });

  it('returns [] when nothing has ever been saved', () => {
    expect(getTasks()).toEqual([]);
  });

  it('returns [] (never throws) when the persisted blob is corrupt', () => {
    jest.spyOn(MMKV.prototype, 'getString').mockReturnValueOnce('not-json{{{');

    let result: Task[] | undefined;
    expect(() => {
      result = getTasks();
    }).not.toThrow();
    expect(result).toEqual([]);
  });

  describe('upsertTask', () => {
    it('adds a new task with a generated uuid id and matching createdAt/updatedAt', () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00.000Z'));

      const next = upsertTask({title: 'Buy milk', status: 'active'});

      expect(next).toHaveLength(1);
      const [created] = next;
      expect(created.id).toMatch(UUID_V4_PATTERN);
      expect(created.title).toBe('Buy milk');
      expect(created.status).toBe('active');
      expect(created.createdAt).toBe('2026-01-01T00:00:00.000Z');
      expect(created.updatedAt).toBe('2026-01-01T00:00:00.000Z');
      expect(getTasks()).toEqual(next);
    });

    it('keeps a caller-supplied id for a new task rather than generating one', () => {
      const next = upsertTask({id: VALID_TASK.id, title: 'Buy milk', status: 'active'});

      expect(next[0].id).toBe(VALID_TASK.id);
    });

    it('updates an existing task by id: replaces fields, bumps updatedAt, keeps createdAt, leaves siblings untouched', () => {
      const sibling: Task = {...VALID_TASK, id: '22edc52b-2918-4d71-9058-f7285e29d894', title: 'Walk the dog'};
      jest.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
      saveTasks([VALID_TASK, sibling]);

      jest.setSystemTime(new Date('2026-02-01T00:00:00.000Z'));
      const next = upsertTask({id: VALID_TASK.id, title: 'Buy oat milk', status: 'completed'});

      expect(next).toHaveLength(2);
      const updated = next.find(t => t.id === VALID_TASK.id);
      expect(updated?.title).toBe('Buy oat milk');
      expect(updated?.status).toBe('completed');
      expect(updated?.createdAt).toBe(VALID_TASK.createdAt);
      expect(updated?.updatedAt).toBe('2026-02-01T00:00:00.000Z');
      // The untouched sibling proves the update replaced only its own
      // element in the array, not the whole collection.
      expect(next.find(t => t.id === sibling.id)).toEqual(sibling);
      expect(getTasks()).toEqual(next);
    });
  });

  describe('removeTask', () => {
    it('drops a task by id, leaving the rest untouched', () => {
      const other: Task = {...VALID_TASK, id: '22edc52b-2918-4d71-9058-f7285e29d894'};
      saveTasks([VALID_TASK, other]);

      const next = removeTask(VALID_TASK.id);

      expect(next).toEqual([other]);
      expect(getTasks()).toEqual([other]);
    });

    it('is a no-op when the id does not exist', () => {
      saveTasks([VALID_TASK]);

      const next = removeTask('11111111-1111-4111-8111-111111111111');

      expect(next).toEqual([VALID_TASK]);
    });
  });

  it('guards saveTasks against a Zod-invalid task (bad id)', () => {
    expect(() => saveTasks([{...VALID_TASK, id: 'not-a-uuid'}])).toThrow();
  });

  it('guards saveTasks against a Zod-invalid task (missing title)', () => {
    expect(() => saveTasks([{...VALID_TASK, title: ''}])).toThrow();
  });
});
