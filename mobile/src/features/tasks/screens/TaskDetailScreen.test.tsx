import React from 'react';
import {act, create as createRenderer, type ReactTestRenderer} from 'react-test-renderer';
import {afterEach, beforeEach, describe, expect, it, jest} from '@jest/globals';
import {format} from 'date-fns';

import {formatDueDateFull} from '@/core/lib';
import * as taskRepository from '@/core/services/taskRepository';
import type {Task} from '@/core/types/task';

import {useTaskStore} from '../store/taskStore';
import {TaskDetailScreen} from './TaskDetailScreen';

// Same shape HomeScreen.test.tsx/AddTaskScreen.test.tsx use — the store
// hydrates from this at module-import time, mocked so the test never
// touches `react-native-mmkv`; individual tests seed `useTaskStore`'s
// in-memory state directly instead.
jest.mock('@/core/services/taskRepository', () => ({
  getTasks: jest.fn(() => []),
  removeTask: jest.fn(),
  upsertTask: jest.fn(),
}));

const mockedRemoveTask = jest.mocked(taskRepository.removeTask);

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
// `useRoute()` has no default-generic inference (see TaskDetailScreen's own
// doc comment) — mocked here to hand back whatever `mockRouteParams` a test
// has set, the same "mutable module-scope value the mock reads" shape
// HomeScreen.test.tsx uses for `mockFocusEffectCallback`.
let mockRouteParams: {taskId: string} = {taskId: 'unset'};
jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native') as object;
  return {
    ...actual,
    useNavigation: () => ({navigate: mockNavigate, goBack: mockGoBack}),
    useRoute: () => ({params: mockRouteParams}),
  };
});

const ACTIVE_TASK: Task = {
  id: '11edc52b-2918-4d71-9058-f7285e29d894',
  title: 'Buy milk',
  description: 'Oat milk, 2%',
  status: 'active',
  createdAt: '2026-01-01T09:15:00.000Z',
  updatedAt: '2026-01-02T14:30:00.000Z',
};

const COMPLETED_TASK: Task = {
  ...ACTIVE_TASK,
  id: '22edc52b-2918-4d71-9058-f7285e29d894',
  status: 'completed',
};

const NO_DESCRIPTION_TASK: Task = {
  ...ACTIVE_TASK,
  id: '33edc52b-2918-4d71-9058-f7285e29d894',
  description: undefined,
};

const WITH_DUE_DATE_TASK: Task = {
  ...ACTIVE_TASK,
  id: '44edc52b-2918-4d71-9058-f7285e29d894',
  dueDate: '2026-07-15T15:30:00.000Z',
};

const initialTaskState = useTaskStore.getState();

// Tracked + unmounted in `afterEach` (same leak `ProfileScreen.test.tsx`
// guards against) — otherwise the NEXT test's `useTaskStore.setState` call
// re-renders THIS test's still-subscribed (but no-longer-relevant) tree
// outside `act()`.
let activeTree: ReactTestRenderer | undefined;

function renderScreen(taskId: string): ReactTestRenderer {
  mockRouteParams = {taskId};
  act(() => {
    activeTree = createRenderer(<TaskDetailScreen />);
  });
  return activeTree!;
}

describe('TaskDetailScreen (TSK-003, FR2/FR6)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useTaskStore.setState(initialTaskState, true);
  });

  afterEach(() => {
    if (activeTree) {
      act(() => {
        activeTree!.unmount();
      });
      activeTree = undefined;
    }
    useTaskStore.setState(initialTaskState, true);
  });

  it("renders the task's title, description, status, created (F-018) and updated (F-019) dates from the store by taskId", () => {
    useTaskStore.setState({tasks: [ACTIVE_TASK]});
    const tree = renderScreen(ACTIVE_TASK.id);

    expect(tree.root.findByProps({children: ACTIVE_TASK.title})).toBeTruthy();
    expect(tree.root.findByProps({children: ACTIVE_TASK.description})).toBeTruthy();
    expect(tree.root.findByProps({accessibilityLabel: 'Status: Active'})).toBeTruthy();

    const expectedCreated = `Created ${format(new Date(ACTIVE_TASK.createdAt), 'MMM d, yyyy · h:mm a')}`;
    const expectedUpdated = `Last updated ${format(new Date(ACTIVE_TASK.updatedAt), 'MMM d, yyyy · h:mm a')}`;
    expect(tree.root.findByProps({children: expectedCreated})).toBeTruthy();
    expect(tree.root.findByProps({children: expectedUpdated})).toBeTruthy();
  });

  it('a completed task shows the "Completed" success-styled label instead of "Active" (never color-alone)', () => {
    useTaskStore.setState({tasks: [COMPLETED_TASK]});
    const tree = renderScreen(COMPLETED_TASK.id);

    expect(tree.root.findByProps({accessibilityLabel: 'Status: Completed'})).toBeTruthy();
    const label = tree.root.findByProps({children: 'Completed'});
    expect(label.props.className).toContain('text-success');
    expect(label.props.className).toContain('font-semibold');
  });

  it('an empty/absent description renders the muted "No description" fallback', () => {
    useTaskStore.setState({tasks: [NO_DESCRIPTION_TASK]});
    const tree = renderScreen(NO_DESCRIPTION_TASK.id);

    expect(tree.root.findByProps({children: 'No description'})).toBeTruthy();
  });

  it('shows "No due date" while task.dueDate is unset', () => {
    useTaskStore.setState({tasks: [ACTIVE_TASK]});
    const tree = renderScreen(ACTIVE_TASK.id);

    expect(tree.root.findByProps({accessibilityLabel: 'Due date: No due date'})).toBeTruthy();
  });

  it('shows the full-format due date (formatDueDateFull, TSK-005) when task.dueDate is set', () => {
    useTaskStore.setState({tasks: [WITH_DUE_DATE_TASK]});
    const tree = renderScreen(WITH_DUE_DATE_TASK.id);

    const expectedLabel = formatDueDateFull(WITH_DUE_DATE_TASK.dueDate!);
    expect(tree.root.findByProps({accessibilityLabel: `Due date: ${expectedLabel}`})).toBeTruthy();
    expect(tree.root.findByProps({children: expectedLabel})).toBeTruthy();
  });

  it('the Edit affordance navigates to EditTask with the same {taskId} (F-041)', () => {
    useTaskStore.setState({tasks: [ACTIVE_TASK]});
    const tree = renderScreen(ACTIVE_TASK.id);

    const editButton = tree.root.findByProps({accessibilityLabel: 'Edit task'});
    act(() => {
      editButton.props.onPress();
    });

    expect(mockNavigate).toHaveBeenCalledWith('EditTask', {taskId: ACTIVE_TASK.id});
  });

  it('an unknown taskId renders the not-found EmptyState instead of crashing, and "Go back" navigates back', () => {
    useTaskStore.setState({tasks: [ACTIVE_TASK]});
    const tree = renderScreen('does-not-exist');

    expect(tree.root.findByProps({children: 'Task not found'})).toBeTruthy();
    const goBackButton = tree.root.findByProps({accessibilityLabel: 'Go back'});
    act(() => {
      goBackButton.props.onPress();
    });
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  describe('TSK-004 — lifecycle actions (F-011-F-015)', () => {
    it('the Toggle button is labeled "Mark complete" for an active task and calls toggleStatus(id)', () => {
      const mockedToggleStatus = jest.fn();
      useTaskStore.setState({tasks: [ACTIVE_TASK], toggleStatus: mockedToggleStatus});
      const tree = renderScreen(ACTIVE_TASK.id);

      // `findByProps` stops at the FIRST tree match (non-deep search) —
      // since TSK-005's `IconButton` now forwards `accessibilityLabel`
      // verbatim from its own prop to the inner `Pressable`, a bare
      // `{accessibilityLabel: 'Mark complete'}` filter would resolve to the
      // outer `IconButton` composite (which has no `accessibilityRole` of
      // its own) instead of the Pressable. Adding `accessibilityRole` to
      // the filter disambiguates to the actual interactive node.
      const toggleButton = tree.root.findByProps({accessibilityLabel: 'Mark complete', accessibilityRole: 'button'});
      expect(toggleButton.props.accessibilityRole).toBe('button');

      act(() => {
        toggleButton.props.onPress();
      });

      expect(mockedToggleStatus).toHaveBeenCalledWith(ACTIVE_TASK.id);
    });

    it('the Toggle button is labeled "Mark pending" for a completed task (F-014 wording)', () => {
      useTaskStore.setState({tasks: [COMPLETED_TASK]});
      const tree = renderScreen(COMPLETED_TASK.id);

      expect(tree.root.findByProps({accessibilityLabel: 'Mark pending'})).toBeTruthy();
      expect(() => tree.root.findByProps({accessibilityLabel: 'Mark complete'})).toThrow();
    });

    it('"More actions" opens a menu with only Duplicate and Delete (Toggle/Edit already have dedicated controls)', () => {
      useTaskStore.setState({tasks: [ACTIVE_TASK]});
      const tree = renderScreen(ACTIVE_TASK.id);

      act(() => {
        tree.root.findByProps({accessibilityLabel: 'More actions'}).props.onPress();
      });

      expect(tree.root.findByProps({accessibilityLabel: 'Duplicate'})).toBeTruthy();
      const deleteOption = tree.root.findByProps({accessibilityLabel: 'Delete task'});
      expect(deleteOption.props.accessibilityRole).toBe('menuitem');
    });

    it('"Duplicate" calls duplicateTask(id) (F-015)', () => {
      const mockedDuplicateTask = jest.fn();
      useTaskStore.setState({tasks: [ACTIVE_TASK], duplicateTask: mockedDuplicateTask});
      const tree = renderScreen(ACTIVE_TASK.id);

      act(() => {
        tree.root.findByProps({accessibilityLabel: 'More actions'}).props.onPress();
      });
      act(() => {
        tree.root.findByProps({accessibilityLabel: 'Duplicate'}).props.onPress();
      });

      expect(mockedDuplicateTask).toHaveBeenCalledWith(ACTIVE_TASK.id);
    });

    it('"Delete" opens a confirm sheet; Cancel does NOT delete (F-012 — never delete without confirm)', () => {
      useTaskStore.setState({tasks: [ACTIVE_TASK]});
      const tree = renderScreen(ACTIVE_TASK.id);

      act(() => {
        tree.root.findByProps({accessibilityLabel: 'More actions'}).props.onPress();
      });
      act(() => {
        tree.root.findByProps({accessibilityLabel: 'Delete task'}).props.onPress();
      });

      expect(tree.root.findByProps({children: 'Delete this task?'})).toBeTruthy();

      act(() => {
        tree.root.findByProps({accessibilityLabel: 'Cancel'}).props.onPress();
      });

      expect(mockedRemoveTask).not.toHaveBeenCalled();
      expect(mockGoBack).not.toHaveBeenCalled();
      expect(() => tree.root.findByProps({children: 'Delete this task?'})).toThrow();
    });

    it('confirming Delete calls removeTask(id) AND navigates back (F-011/F-012, FR2 — deleting the record you\'re viewing)', () => {
      // The real (unmocked) `removeTask` action writes THROUGH
      // `taskRepository.removeTask` and sets `tasks` to whatever it
      // returns (see taskStore.test.ts) — seeded here so the post-delete
      // re-render (this screen re-reads `state.tasks.find(...)`) sees a
      // valid array rather than the mock's bare-`jest.fn()` `undefined`.
      mockedRemoveTask.mockReturnValueOnce([]);
      useTaskStore.setState({tasks: [ACTIVE_TASK]});
      const tree = renderScreen(ACTIVE_TASK.id);

      act(() => {
        tree.root.findByProps({accessibilityLabel: 'More actions'}).props.onPress();
      });
      act(() => {
        // The menu's "Delete" option — closes the menu, opens the confirm.
        tree.root.findByProps({accessibilityLabel: 'Delete task'}).props.onPress();
      });
      act(() => {
        // The confirm sheet's own destructive "Delete" option.
        tree.root.findByProps({accessibilityLabel: 'Delete task'}).props.onPress();
      });

      expect(mockedRemoveTask).toHaveBeenCalledWith(ACTIVE_TASK.id);
      expect(mockGoBack).toHaveBeenCalledTimes(1);
    });

    it('the confirm sheet\'s Delete option is marked destructive (a11y, never color-alone)', () => {
      useTaskStore.setState({tasks: [ACTIVE_TASK]});
      const tree = renderScreen(ACTIVE_TASK.id);

      act(() => {
        tree.root.findByProps({accessibilityLabel: 'More actions'}).props.onPress();
      });
      act(() => {
        tree.root.findByProps({accessibilityLabel: 'Delete task'}).props.onPress();
      });

      const label = tree.root.findByProps({children: 'Delete'});
      expect(label.props.className).toContain('text-danger');
    });
  });
});
