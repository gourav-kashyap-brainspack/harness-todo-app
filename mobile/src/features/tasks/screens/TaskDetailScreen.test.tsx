import React from 'react';
import {act, create as createRenderer, type ReactTestRenderer} from 'react-test-renderer';
import {afterEach, beforeEach, describe, expect, it, jest} from '@jest/globals';
import {format} from 'date-fns';

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

  it('shows "No due date" while task.dueDate is unset (TSK-005 extension point)', () => {
    useTaskStore.setState({tasks: [ACTIVE_TASK]});
    const tree = renderScreen(ACTIVE_TASK.id);

    expect(tree.root.findByProps({accessibilityLabel: 'Due date: No due date'})).toBeTruthy();
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
});
