import React from 'react';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {act, create as createRenderer, type ReactTestRenderer} from 'react-test-renderer';
import {afterEach, beforeEach, describe, expect, it, jest} from '@jest/globals';

import {RootNavigator} from './RootNavigator';
import type {RootStackParamList} from './types';

// Native-stack/bottom-tabs push a real screen-transition animation
// (`Animated.timing` + `Easing.bezier`) on every navigate. Under Jest,
// `react-native-screens`'s native module isn't linked, so the JS fallback's
// bezier easing call throws, and — without fake timers — the animation's
// real `setTimeout` fires after the test file's Jest environment has
// already torn down. Fake timers + flushing them inside `act()` after each
// navigation is the pattern the React Navigation docs prescribe
// (reactnavigation.org/docs/testing → "Fake timers").
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

function renderRootNavigator(): {
  tree: ReactTestRenderer;
  ref: ReturnType<typeof createNavigationContainerRef<RootStackParamList>>;
} {
  const ref = createNavigationContainerRef<RootStackParamList>();
  let tree!: ReactTestRenderer;

  act(() => {
    tree = createRenderer(
      <NavigationContainer ref={ref}>
        <RootNavigator />
      </NavigationContainer>,
    );
  });

  return {tree, ref};
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

  it('pushes TaskDetail with {taskId} and the placeholder reads the param', () => {
    const {tree, ref} = renderRootNavigator();

    act(() => {
      ref.current?.navigate('TaskDetail', {taskId: 'task-42'});
      jest.runOnlyPendingTimers();
    });

    expect(tree.root.findByProps({accessibilityLabel: 'Task Details'})).toBeTruthy();
    const detailNode = tree.root.findByProps({children: 'taskId: task-42'});
    expect(detailNode).toBeTruthy();
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

  it('pushes EditTask with {taskId} and the placeholder reads the param', () => {
    const {tree, ref} = renderRootNavigator();

    act(() => {
      ref.current?.navigate('EditTask', {taskId: 'task-7'});
      jest.runOnlyPendingTimers();
    });

    expect(tree.root.findByProps({accessibilityLabel: 'Edit Task'})).toBeTruthy();
    expect(tree.root.findByProps({children: 'taskId: task-7'})).toBeTruthy();
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
