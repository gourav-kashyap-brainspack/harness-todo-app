import React from 'react';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {act, create as createRenderer, type ReactTestRenderer} from 'react-test-renderer';
import {afterEach, beforeEach, describe, expect, it, jest} from '@jest/globals';

import {useTaskStore} from '@/features/tasks/store/taskStore';
import type {Task} from '@/core/types/task';

import {RootNavigator} from './RootNavigator';
import type {RootStackParamList} from './types';

// TSK-003 replaced the TaskDetail/EditTask placeholders with real screens
// that read the task by id from the single `useTaskStore` — seeded directly
// via `setState` (same shape `HomeScreen.test.tsx` uses) rather than
// mocking `taskRepository`, since these tests only need the in-memory
// selection to resolve, not a persisted write path.
const TASK: Task = {
  id: 'task-42',
  title: 'Buy milk',
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const initialTaskState = useTaskStore.getState();

// Native-stack/bottom-tabs push a real screen-transition animation
// (`Animated.timing` + `Easing.bezier`) on every navigate. Under Jest,
// `react-native-screens`'s native module isn't linked, so the JS fallback's
// bezier easing call throws, and — without fake timers — the animation's
// real `setTimeout` fires after the test file's Jest environment has
// already torn down. Fake timers + flushing them inside `act()` after each
// navigation is the pattern the React Navigation docs prescribe
// (reactnavigation.org/docs/testing → "Fake timers").
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Tracked + unmounted in `afterEach` (same leak `ProfileScreen.test.tsx`
// guards against) — otherwise the `useTaskStore.setState` reset below
// re-renders a still-subscribed-but-no-longer-relevant tree (TSK-003's
// TaskDetail/EditTask screens both subscribe to the store) outside `act()`.
let activeTree: ReactTestRenderer | undefined;

function renderRootNavigator(): {
  tree: ReactTestRenderer;
  ref: ReturnType<typeof createNavigationContainerRef<RootStackParamList>>;
} {
  const ref = createNavigationContainerRef<RootStackParamList>();

  act(() => {
    activeTree = createRenderer(
      <NavigationContainer ref={ref}>
        <RootNavigator />
      </NavigationContainer>,
    );
  });

  return {tree: activeTree!, ref};
}

describe('navigation shell (FND-003)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
    if (activeTree) {
      act(() => {
        activeTree!.unmount();
      });
      activeTree = undefined;
    }
    useTaskStore.setState(initialTaskState, true);
  });

  it('renders RootStack starting from Splash, which boots straight through to a landed screen', () => {
    // FND-004 made `Splash` a real boot gate (BootstrapScreen) instead of a
    // dead-end placeholder — it navigates away the instant its effect runs,
    // so by the time pending timers flush there is no longer a `Splash`
    // screen to find. Routing correctness (fresh install -> ProfileSetup,
    // `hasLaunched` -> Tabs) is covered in BootstrapScreen.test.tsx; this
    // test only guards that the stack still starts from `Splash` and boots
    // to *some* landed screen without hanging or crashing. `ProfileSetup`
    // now renders the real PRO-001 screen (its welcome heading), not the
    // FND-003 placeholder.
    const {tree} = renderRootNavigator();

    act(() => {
      jest.runOnlyPendingTimers();
    });

    expect(tree.root.findByProps({accessibilityLabel: 'Welcome to Todo App'})).toBeTruthy();
  });

  it('navigating to Tabs shows the Home and Profile tab labels', () => {
    const {tree, ref} = renderRootNavigator();

    act(() => {
      ref.current?.navigate('Tabs');
      jest.runOnlyPendingTimers();
    });

    expect(tree.root.findAllByProps({accessibilityLabel: 'Home'}).length).toBeGreaterThan(0);
    expect(tree.root.findAllByProps({accessibilityLabel: 'Profile'}).length).toBeGreaterThan(0);

    // Bottom tabs mount lazily — switch to Profile so its screen (not just
    // its tab-bar button) actually renders.
    act(() => {
      ref.current?.navigate('Tabs', {screen: 'Profile'});
      jest.runOnlyPendingTimers();
    });

    expect(tree.root.findAllByProps({accessibilityLabel: 'Profile'}).length).toBeGreaterThan(0);
  });

  it('pushes TaskDetail with {taskId} and the real TSK-003 screen resolves + renders that task', () => {
    useTaskStore.setState({tasks: [TASK]});
    const {tree, ref} = renderRootNavigator();

    act(() => {
      ref.current?.navigate('TaskDetail', {taskId: 'task-42'});
      jest.runOnlyPendingTimers();
    });

    // The task's own title (not a placeholder heading) plus the Edit
    // affordance — proves route.params.taskId round-tripped into a real
    // store lookup, not just that the route pushed.
    expect(tree.root.findByProps({children: TASK.title})).toBeTruthy();
    expect(tree.root.findByProps({accessibilityLabel: 'Edit task'})).toBeTruthy();
  });

  it('TaskDetail with an unknown taskId shows the not-found EmptyState instead of crashing', () => {
    const {tree, ref} = renderRootNavigator();

    act(() => {
      ref.current?.navigate('TaskDetail', {taskId: 'does-not-exist'});
      jest.runOnlyPendingTimers();
    });

    expect(tree.root.findByProps({children: 'Task not found'})).toBeTruthy();
    expect(tree.root.findByProps({accessibilityLabel: 'Go back'})).toBeTruthy();
  });

  it('pushes ProfileSetup (real PRO-001 screen) and AddTask (real TSK-002 TaskForm screen)', () => {
    const {tree, ref} = renderRootNavigator();

    act(() => {
      ref.current?.navigate('ProfileSetup');
      jest.runOnlyPendingTimers();
    });
    expect(tree.root.findByProps({accessibilityLabel: 'Welcome to Todo App'})).toBeTruthy();

    act(() => {
      ref.current?.navigate('AddTask');
      jest.runOnlyPendingTimers();
    });
    // AddTask (TSK-002) replaced the FND-003 placeholder with the real
    // `TaskForm` + submit button; the native-stack header (`title: 'Add
    // Task'`) still supplies the visible screen title, so this asserts on
    // the form's own content instead of a placeholder heading.
    expect(tree.root.findByProps({accessibilityLabel: 'Title'})).toBeTruthy();
    expect(tree.root.findByProps({accessibilityLabel: 'Add task'})).toBeTruthy();
  });

  it('pushes EditTask with {taskId} and the real TSK-003 screen renders TaskForm seeded with that task', () => {
    useTaskStore.setState({tasks: [{...TASK, id: 'task-7', title: 'Existing title'}]});
    const {tree, ref} = renderRootNavigator();

    act(() => {
      ref.current?.navigate('EditTask', {taskId: 'task-7'});
      jest.runOnlyPendingTimers();
    });

    expect(tree.root.findByProps({accessibilityLabel: 'Save'})).toBeTruthy();
    // Looked up by its `accessibilityLabel` (not `findAllByType(TextInput)[0]`)
    // — the underlying route (Tabs or first-launch ProfileSetup, whichever
    // BootstrapScreen reset to) can still be mounted beneath the pushed
    // EditTask screen, and ProfileSetup has its own TextInputs (Name/Email).
    const titleInput = tree.root.findByProps({accessibilityLabel: 'Title'});
    expect(titleInput.props.value).toBe('Existing title');
  });

  it('typed params compile: task screens declare {taskId}, others undefined (type + runtime check)', () => {
    const params: RootStackParamList = {
      Splash: undefined,
      ProfileSetup: undefined,
      Tabs: undefined,
      AddTask: undefined,
      EditTask: {taskId: 'task-1'},
      TaskDetail: {taskId: 'task-1'},
    };

    expect(params.TaskDetail).toEqual({taskId: 'task-1'});
    expect(params.EditTask).toEqual({taskId: 'task-1'});
  });
});
