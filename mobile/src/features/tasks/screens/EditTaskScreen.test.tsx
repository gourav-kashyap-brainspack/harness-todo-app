import React from 'react';
import {Text, TextInput} from 'react-native';
import {act, create as createRenderer, type ReactTestRenderer} from 'react-test-renderer';
import {afterEach, beforeEach, describe, expect, it, jest} from '@jest/globals';

import * as taskRepository from '@/core/services/taskRepository';
import type {Task} from '@/core/types/task';

import {DueDateField} from '../components/DueDateField';
import {useTaskStore} from '../store/taskStore';
import {EditTaskScreen} from './EditTaskScreen';

// Same seam AddTaskScreen.test.tsx mocks — `updateTask` runs for real here
// (it's the boundary being proven: the FULL business-field set reaches
// `upsertTask`, STG gap a), only the underlying persistence call is mocked.
jest.mock('@/core/services/taskRepository', () => ({
  getTasks: jest.fn(() => []),
  removeTask: jest.fn(),
  upsertTask: jest.fn(),
}));

const mockedUpsertTask = jest.mocked(taskRepository.upsertTask);

const mockGoBack = jest.fn();
let mockRouteParams: {taskId: string} = {taskId: 'unset'};
jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native') as object;
  return {
    ...actual,
    useNavigation: () => ({goBack: mockGoBack}),
    useRoute: () => ({params: mockRouteParams}),
  };
});

// Deliberately `completed` + a `dueDate` set — neither field is touched by
// the form, so a submit that preserves them (rather than blanking them out,
// STG gap a) proves the merge-over-existing-record contract, not just that
// SOME object reached `upsertTask`.
const TASK: Task = {
  id: '11edc52b-2918-4d71-9058-f7285e29d894',
  title: 'Existing title',
  description: 'Existing description',
  status: 'completed',
  dueDate: '2026-03-01T00:00:00.000Z',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const initialTaskState = useTaskStore.getState();

function fillField(tree: ReactTestRenderer, index: 0 | 1, value: string): void {
  const input = tree.root.findAllByType(TextInput)[index];
  act(() => {
    input!.props.onChangeText(value);
  });
  act(() => {
    input!.props.onBlur({} as never);
  });
}

function pressSubmit(tree: ReactTestRenderer): void {
  const button = tree.root.findByProps({accessibilityLabel: 'Save'});
  act(() => {
    button.props.onPress();
  });
}

async function flushSubmit(): Promise<void> {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
  });
}

// Tracked + unmounted in `afterEach` (same leak `ProfileScreen.test.tsx`
// guards against) — otherwise the NEXT test's `useTaskStore.setState` call
// re-renders THIS test's still-subscribed (but no-longer-relevant) tree
// outside `act()`.
let activeTree: ReactTestRenderer | undefined;

function renderScreen(taskId: string): ReactTestRenderer {
  mockRouteParams = {taskId};
  act(() => {
    activeTree = createRenderer(<EditTaskScreen />);
  });
  return activeTree!;
}

describe('EditTaskScreen (TSK-003, FR3/FR4/FR5)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useTaskStore.setState(initialTaskState, true);
    useTaskStore.setState({tasks: [TASK]});
  });

  afterEach(() => {
    if (activeTree) {
      act(() => {
        activeTree!.unmount();
      });
      activeTree = undefined;
    }
  });

  it('renders TaskForm seeded with the current title + description (defaultValues)', () => {
    const tree = renderScreen(TASK.id);

    const inputs = tree.root.findAllByType(TextInput);
    expect(inputs[0]!.props.value).toBe(TASK.title);
    expect(inputs[1]!.props.value).toBe(TASK.description);
    expect(tree.root.findByProps({accessibilityLabel: 'Save'})).toBeTruthy();
  });

  it('a valid submit calls updateTask with the FULL field set (gap a — status/dueDate preserved) and navigates back (FR4/FR6)', async () => {
    mockedUpsertTask.mockReturnValueOnce([]);
    const tree = renderScreen(TASK.id);

    fillField(tree, 0, 'New title');
    pressSubmit(tree);
    await flushSubmit();

    expect(mockedUpsertTask).toHaveBeenCalledWith({
      id: TASK.id,
      title: 'New title',
      description: TASK.description,
      status: TASK.status,
      dueDate: TASK.dueDate,
    });
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it('an invalid (empty) title shows the error and never calls updateTask (FR5, gap f)', async () => {
    mockedUpsertTask.mockReturnValueOnce([]);
    const tree = renderScreen(TASK.id);

    fillField(tree, 0, '');
    pressSubmit(tree);
    await flushSubmit();

    expect(tree.root.findByProps({accessibilityLabel: 'Title, title is required'})).toBeTruthy();
    expect(mockedUpsertTask).not.toHaveBeenCalled();
    expect(mockGoBack).not.toHaveBeenCalled();
  });

  it('an unknown taskId renders the not-found EmptyState instead of a form (safe, no crash)', () => {
    const tree = renderScreen('does-not-exist');

    expect(tree.root.findByProps({children: 'Task not found'})).toBeTruthy();
    expect(tree.root.findAllByType(TextInput)).toHaveLength(0);

    const goBackButton = tree.root.findByProps({accessibilityLabel: 'Go back'});
    act(() => {
      goBackButton.props.onPress();
    });
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it('description stays unchanged when only the title is edited', async () => {
    mockedUpsertTask.mockReturnValueOnce([]);
    const tree = renderScreen(TASK.id);

    fillField(tree, 0, 'New title');
    pressSubmit(tree);
    await flushSubmit();

    expect(
      tree.root.findAllByType(Text).filter(node => node.props.accessibilityLiveRegion === 'polite'),
    ).toHaveLength(0);
  });

  describe('TSK-005 — due date edit round-trip (FR2/FR3)', () => {
    it("seeds the field with the task's existing dueDate", () => {
      const tree = renderScreen(TASK.id);

      expect(tree.root.findByType(DueDateField).props.value).toBe(TASK.dueDate);
    });

    it('changing the due date submits the NEW value (not the stale task.dueDate) as part of the full field set', async () => {
      mockedUpsertTask.mockReturnValueOnce([]);
      const tree = renderScreen(TASK.id);
      const newDueDate = new Date('2026-09-20T18:00:00.000Z').toISOString();

      act(() => {
        tree.root.findByType(DueDateField).props.onChange(newDueDate);
      });
      pressSubmit(tree);
      await flushSubmit();

      expect(mockedUpsertTask).toHaveBeenCalledWith({
        id: TASK.id,
        title: TASK.title,
        description: TASK.description,
        status: TASK.status,
        dueDate: newDueDate,
      });
    });

    it('removing the due date (F-017) submits dueDate: undefined', async () => {
      mockedUpsertTask.mockReturnValueOnce([]);
      const tree = renderScreen(TASK.id);

      act(() => {
        tree.root.findByType(DueDateField).props.onChange(undefined);
      });
      pressSubmit(tree);
      await flushSubmit();

      expect(mockedUpsertTask).toHaveBeenCalledWith({
        id: TASK.id,
        title: TASK.title,
        description: TASK.description,
        status: TASK.status,
        dueDate: undefined,
      });
    });
  });
});
