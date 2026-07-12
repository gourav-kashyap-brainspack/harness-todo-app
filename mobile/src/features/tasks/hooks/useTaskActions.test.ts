import React from 'react';
import {act, create as createRenderer} from 'react-test-renderer';
import {beforeEach, describe, expect, it, jest} from '@jest/globals';

import * as taskRepository from '@/core/services/taskRepository';
import type {Task} from '@/core/types/task';

import {useTaskStore} from '../store/taskStore';
import {useTaskActions, type UseTaskActionsResult} from './useTaskActions';

// Same shape taskStore.test.ts/HomeScreen.test.tsx use — the store hydrates
// from this at module-import time, mocked so the test never touches
// `react-native-mmkv`.
jest.mock('@/core/services/taskRepository', () => ({
  getTasks: jest.fn(() => []),
  removeTask: jest.fn(),
  upsertTask: jest.fn(),
}));

const mockedRemoveTask = jest.mocked(taskRepository.removeTask);

const TASK: Task = {
  id: '11edc52b-2918-4d71-9058-f7285e29d894',
  title: 'Buy milk',
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const OTHER_TASK: Task = {...TASK, id: '22edc52b-2918-4d71-9058-f7285e29d894', title: 'Walk the dog'};

/**
 * Minimal hook-test harness — this project has no `@testing-library/
 * react-native` (`renderHook`), so every suite here drives a hook through a
 * throwaway host component + `react-test-renderer`/`act` directly (same
 * mechanism `HomeScreen.test.tsx`/`TaskDetailScreen.test.tsx` use for full
 * screens). Captures the LATEST return value into a mutable ref on every
 * render so a test can call an action inside `act()` and immediately read
 * the fresh state back.
 */
function renderUseTaskActions(onDeleteConfirmed?: (task: Task) => void) {
  const latest: {current: UseTaskActionsResult | undefined} = {current: undefined};
  function Harness(): null {
    latest.current = useTaskActions(onDeleteConfirmed);
    return null;
  }
  act(() => {
    createRenderer(React.createElement(Harness));
  });
  return latest;
}

describe('useTaskActions (TSK-004, F-011-F-015)', () => {
  beforeEach(() => {
    useTaskStore.setState({tasks: [TASK, OTHER_TASK]});
    jest.clearAllMocks();
  });

  it('starts with no menu and no delete-confirm open', () => {
    const result = renderUseTaskActions();

    expect(result.current!.menuTask).toBeNull();
    expect(result.current!.deleteTarget).toBeNull();
  });

  it('openMenu sets menuTask; closeMenu clears it without calling the store', () => {
    const result = renderUseTaskActions();

    act(() => result.current!.openMenu(TASK));
    expect(result.current!.menuTask).toEqual(TASK);

    act(() => result.current!.closeMenu());
    expect(result.current!.menuTask).toBeNull();
    expect(mockedRemoveTask).not.toHaveBeenCalled();
  });

  it('requestDelete closes the menu and opens the confirm sheet for the same task', () => {
    const result = renderUseTaskActions();

    act(() => result.current!.openMenu(TASK));
    act(() => result.current!.requestDelete(TASK));

    expect(result.current!.menuTask).toBeNull();
    expect(result.current!.deleteTarget).toEqual(TASK);
  });

  it('cancelDelete closes the confirm sheet WITHOUT calling removeTask (F-012 — never delete without confirm)', () => {
    const result = renderUseTaskActions();

    act(() => result.current!.requestDelete(TASK));
    act(() => result.current!.cancelDelete());

    expect(result.current!.deleteTarget).toBeNull();
    expect(mockedRemoveTask).not.toHaveBeenCalled();
  });

  it("confirmDelete calls the single store's removeTask(id) and closes the sheet", () => {
    const result = renderUseTaskActions();

    act(() => result.current!.requestDelete(TASK));
    act(() => result.current!.confirmDelete());

    expect(mockedRemoveTask).toHaveBeenCalledWith(TASK.id);
    expect(result.current!.deleteTarget).toBeNull();
  });

  it('confirmDelete calls onDeleteConfirmed with the removed task (TaskDetailScreen wires navigation.goBack here)', () => {
    const onDeleteConfirmed = jest.fn();
    const result = renderUseTaskActions(onDeleteConfirmed);

    act(() => result.current!.requestDelete(TASK));
    act(() => result.current!.confirmDelete());

    expect(onDeleteConfirmed).toHaveBeenCalledWith(TASK);
  });

  it('HomeScreen usage (no onDeleteConfirmed) never calls anything on confirm besides removeTask', () => {
    const result = renderUseTaskActions();

    act(() => result.current!.requestDelete(TASK));
    expect(() => {
      act(() => result.current!.confirmDelete());
    }).not.toThrow();
  });

  it('confirmDelete is a harmless no-op when nothing is pending deletion', () => {
    const result = renderUseTaskActions();

    act(() => result.current!.confirmDelete());

    expect(mockedRemoveTask).not.toHaveBeenCalled();
  });

  it('openMenu for a new task closes any already-open delete-confirm (never two sheets at once)', () => {
    const result = renderUseTaskActions();

    act(() => result.current!.requestDelete(TASK));
    expect(result.current!.deleteTarget).toEqual(TASK);

    act(() => result.current!.openMenu(OTHER_TASK));
    expect(result.current!.deleteTarget).toBeNull();
    expect(result.current!.menuTask).toEqual(OTHER_TASK);
  });
});
