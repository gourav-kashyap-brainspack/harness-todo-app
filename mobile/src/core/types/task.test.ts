import {describe, expect, it} from '@jest/globals';

import {taskListSchema, taskSchema} from '@/core/types/task';

const VALID_TASK = {
  id: '11edc52b-2918-4d71-9058-f7285e29d894',
  title: 'Buy milk',
  status: 'active' as const,
  createdAt: '2026-07-11T08:00:00.000Z',
  updatedAt: '2026-07-11T08:00:00.000Z',
};

describe('taskSchema', () => {
  it('accepts a minimal valid task (no description/dueDate)', () => {
    expect(taskSchema.safeParse(VALID_TASK).success).toBe(true);
  });

  it('accepts a task with description + dueDate set', () => {
    const result = taskSchema.safeParse({
      ...VALID_TASK,
      description: 'Whole milk, 2%',
      dueDate: '2026-07-15T00:00:00.000Z',
    });

    expect(result.success).toBe(true);
  });

  it('rejects a non-string / non-uuid id', () => {
    expect(taskSchema.safeParse({...VALID_TASK, id: 42}).success).toBe(false);
    expect(taskSchema.safeParse({...VALID_TASK, id: 'not-a-uuid'}).success).toBe(false);
  });

  it('rejects a missing/empty title', () => {
    const withoutTitle = {
      id: VALID_TASK.id,
      status: VALID_TASK.status,
      createdAt: VALID_TASK.createdAt,
      updatedAt: VALID_TASK.updatedAt,
    };
    expect(taskSchema.safeParse(withoutTitle).success).toBe(false);
    expect(taskSchema.safeParse({...VALID_TASK, title: ''}).success).toBe(false);
  });

  it('rejects a status outside the active|completed enum', () => {
    expect(taskSchema.safeParse({...VALID_TASK, status: 'archived'}).success).toBe(false);
  });

  it('rejects a missing createdAt/updatedAt', () => {
    const withoutCreatedAt = {
      id: VALID_TASK.id,
      title: VALID_TASK.title,
      status: VALID_TASK.status,
      updatedAt: VALID_TASK.updatedAt,
    };
    expect(taskSchema.safeParse(withoutCreatedAt).success).toBe(false);

    const withoutUpdatedAt = {
      id: VALID_TASK.id,
      title: VALID_TASK.title,
      status: VALID_TASK.status,
      createdAt: VALID_TASK.createdAt,
    };
    expect(taskSchema.safeParse(withoutUpdatedAt).success).toBe(false);
  });
});

describe('taskListSchema', () => {
  it('accepts an empty array', () => {
    expect(taskListSchema.safeParse([]).success).toBe(true);
  });

  it('accepts an array of valid tasks', () => {
    expect(taskListSchema.safeParse([VALID_TASK, {...VALID_TASK, id: '22edc52b-2918-4d71-9058-f7285e29d894'}]).success).toBe(
      true,
    );
  });

  it('rejects an array containing an invalid task', () => {
    expect(taskListSchema.safeParse([VALID_TASK, {...VALID_TASK, id: 'bad'}]).success).toBe(false);
  });
});
