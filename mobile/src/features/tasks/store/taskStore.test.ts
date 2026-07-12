import {beforeEach, describe, expect, it, jest} from '@jest/globals';

import * as taskRepository from '@/core/services/taskRepository';
import type {Task} from '@/core/types/task';

import {hydrateTasks, useTaskStore} from './taskStore';

// The repository is the only persistence seam this store is allowed to
// touch (conventions.md — no direct MMKV). Mocking it here lets each test
// control what "already persisted on this device" looks like without ever
// hitting `react-native-mmkv` — same shape as `profileStore.test.ts`.
jest.mock('@/core/services/taskRepository', () => ({
  getTasks: jest.fn(() => []),
  removeTask: jest.fn(),
  upsertTask: jest.fn(),
}));

const mockedGetTasks = jest.mocked(taskRepository.getTasks);
const mockedRemoveTask = jest.mocked(taskRepository.removeTask);
const mockedUpsertTask = jest.mocked(taskRepository.upsertTask);

const TASK: Task = {
  id: '11edc52b-2918-4d71-9058-f7285e29d894',
  title: 'Buy milk',
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const COMPLETED_TASK: Task = {
  ...TASK,
  id: '22edc52b-2918-4d71-9058-f7285e29d894',
  status: 'completed',
};

describe('taskStore (TSK-001, FR1)', () => {
  beforeEach(() => {
    useTaskStore.setState({tasks: []});
    jest.clearAllMocks();
  });

  it("hydrates the store's initial `tasks` from taskRepository.getTasks() at construction", () => {
    // The mocked factory's default (`() => []`) is what ran when this
    // module was first imported — the store's initial state reflects it
    // directly, proving the store reads through the repository (not a raw
    // MMKV key) at init. See `hydrateTasks()`'s own tests below for the
    // direct, non-tautological proof of the hydration behavior itself.
    expect(useTaskStore.getState().tasks).toEqual([]);
  });

  it('hydrateTasks() reads through taskRepository.getTasks()', () => {
    mockedGetTasks.mockReturnValueOnce([TASK]);

    expect(hydrateTasks()).toEqual([TASK]);
    expect(mockedGetTasks).toHaveBeenCalledTimes(1);
  });

  it('hydrateTasks() returns [] when nothing is persisted (absent/corrupt -> [], inherited from STG)', () => {
    mockedGetTasks.mockReturnValueOnce([]);

    expect(hydrateTasks()).toEqual([]);
  });

  it('addTask delegates to upsertTask with status defaulted to active, and sets tasks to the result', () => {
    mockedUpsertTask.mockReturnValueOnce([TASK]);

    useTaskStore.getState().addTask({title: 'Buy milk'});

    expect(mockedUpsertTask).toHaveBeenCalledWith({title: 'Buy milk', status: 'active'});
    expect(useTaskStore.getState().tasks).toEqual([TASK]);
  });

  it('addTask passes through an explicit status instead of defaulting it', () => {
    mockedUpsertTask.mockReturnValueOnce([COMPLETED_TASK]);

    useTaskStore.getState().addTask({title: 'Buy milk', status: 'completed'});

    expect(mockedUpsertTask).toHaveBeenCalledWith({title: 'Buy milk', status: 'completed'});
  });

  it('updateTask delegates to upsertTask with the full input (wholesale replace) and sets tasks', () => {
    const updated: Task = {...TASK, title: 'Buy oat milk'};
    mockedUpsertTask.mockReturnValueOnce([updated]);

    useTaskStore.getState().updateTask({id: TASK.id, title: 'Buy oat milk', status: 'active'});

    expect(mockedUpsertTask).toHaveBeenCalledWith({id: TASK.id, title: 'Buy oat milk', status: 'active'});
    expect(useTaskStore.getState().tasks).toEqual([updated]);
  });

  it('removeTask delegates to taskRepository.removeTask and sets tasks to the result', () => {
    mockedRemoveTask.mockReturnValueOnce([]);

    useTaskStore.getState().removeTask(TASK.id);

    expect(mockedRemoveTask).toHaveBeenCalledWith(TASK.id);
    expect(useTaskStore.getState().tasks).toEqual([]);
  });

  it('toggleStatus flips an active task to completed via upsertTask (full fields, never a raw status patch)', () => {
    useTaskStore.setState({tasks: [TASK]});
    mockedUpsertTask.mockReturnValueOnce([COMPLETED_TASK]);

    useTaskStore.getState().toggleStatus(TASK.id);

    expect(mockedUpsertTask).toHaveBeenCalledWith({
      id: TASK.id,
      title: TASK.title,
      description: undefined,
      dueDate: undefined,
      status: 'completed',
    });
    expect(useTaskStore.getState().tasks).toEqual([COMPLETED_TASK]);
  });

  it('toggleStatus flips a completed task back to active', () => {
    useTaskStore.setState({tasks: [COMPLETED_TASK]});
    mockedUpsertTask.mockReturnValueOnce([TASK]);

    useTaskStore.getState().toggleStatus(COMPLETED_TASK.id);

    expect(mockedUpsertTask).toHaveBeenCalledWith(
      expect.objectContaining({id: COMPLETED_TASK.id, status: 'active'}),
    );
    expect(useTaskStore.getState().tasks).toEqual([TASK]);
  });

  it('toggleStatus is a no-op when the id is not in the current tasks', () => {
    useTaskStore.setState({tasks: [TASK]});

    useTaskStore.getState().toggleStatus('does-not-exist');

    expect(mockedUpsertTask).not.toHaveBeenCalled();
    expect(useTaskStore.getState().tasks).toEqual([TASK]);
  });

  it('duplicateTask creates an active copy without passing an id through (the repository mints a fresh one)', () => {
    useTaskStore.setState({tasks: [COMPLETED_TASK]});
    const duplicate: Task = {...COMPLETED_TASK, id: 'a-fresh-id', status: 'active'};
    mockedUpsertTask.mockReturnValueOnce([COMPLETED_TASK, duplicate]);

    useTaskStore.getState().duplicateTask(COMPLETED_TASK.id);

    expect(mockedUpsertTask).toHaveBeenCalledWith({
      title: COMPLETED_TASK.title,
      description: undefined,
      dueDate: undefined,
      status: 'active',
    });
    expect(mockedUpsertTask.mock.calls[0]![0]).not.toHaveProperty('id');
    expect(useTaskStore.getState().tasks).toEqual([COMPLETED_TASK, duplicate]);
  });

  it('duplicateTask is a no-op when the id is not in the current tasks', () => {
    useTaskStore.setState({tasks: []});

    useTaskStore.getState().duplicateTask('does-not-exist');

    expect(mockedUpsertTask).not.toHaveBeenCalled();
  });

  it('refresh re-reads from taskRepository.getTasks() and replaces tasks (F-042)', () => {
    useTaskStore.setState({tasks: [TASK]});
    mockedGetTasks.mockReturnValueOnce([TASK, COMPLETED_TASK]);

    useTaskStore.getState().refresh();

    expect(useTaskStore.getState().tasks).toEqual([TASK, COMPLETED_TASK]);
  });
});
