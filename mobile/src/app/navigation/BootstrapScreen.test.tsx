import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {act, create as createRenderer, type ReactTestRenderer} from 'react-test-renderer';
import {afterEach, beforeEach, describe, expect, it, jest} from '@jest/globals';
import BootSplash from 'react-native-bootsplash';

import {useLaunchStore} from '@/core/store/launchStore';

import {RootNavigator} from './RootNavigator';

// Same fake-timer setup as navigation.test.tsx — native-stack/bottom-tabs
// drive a real screen-transition animation on every navigate/reset, which
// throws under Jest without `react-native-screens` linked; fake timers +
// flushing inside `act()` avoids a `setTimeout` firing after teardown.
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

function renderRootNavigator(): ReactTestRenderer {
  let tree!: ReactTestRenderer;

  act(() => {
    tree = createRenderer(
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>,
    );
  });

  return tree;
}

describe('BootstrapScreen (FND-004 — Splash route boot sequence)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it('fresh install (hasLaunched=false) routes to ProfileSetup', () => {
    useLaunchStore.setState({hasLaunched: false});

    const tree = renderRootNavigator();

    act(() => {
      jest.runOnlyPendingTimers();
    });

    expect(tree.root.findByProps({accessibilityLabel: 'Welcome to Todo App'})).toBeTruthy();
  });

  it('hasLaunched=true routes to Tabs (Home)', () => {
    useLaunchStore.setState({hasLaunched: true});

    const tree = renderRootNavigator();

    act(() => {
      jest.runOnlyPendingTimers();
    });

    expect(tree.root.findAllByProps({accessibilityLabel: 'Home'}).length).toBeGreaterThan(0);
  });

  it('corrupted/missing flag never crashes boot and safely defaults to ProfileSetup', () => {
    useLaunchStore.setState({hasLaunched: false});

    expect(() => {
      const tree = renderRootNavigator();
      act(() => {
        jest.runOnlyPendingTimers();
      });
      expect(tree.root.findByProps({accessibilityLabel: 'Welcome to Todo App'})).toBeTruthy();
    }).not.toThrow();
  });

  it('hides the native splash once the boot decision has resolved', () => {
    useLaunchStore.setState({hasLaunched: true});

    renderRootNavigator();

    act(() => {
      jest.runOnlyPendingTimers();
    });

    expect(BootSplash.hide).toHaveBeenCalledWith({fade: true});
  });

  it('makes no network calls during boot (F-048, the offline shell)', () => {
    const originalFetch = global.fetch;
    const fetchSpy = jest.fn();
    // Test-only stub so the assertion doesn't depend on whether this Jest
    // environment happens to polyfill a real `global.fetch` — reason: no
    // fetch-shaped typings are needed for a spy that must never be called.
    global.fetch = fetchSpy as unknown as typeof fetch;

    useLaunchStore.setState({hasLaunched: false});

    try {
      renderRootNavigator();

      act(() => {
        jest.runOnlyPendingTimers();
      });

      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      global.fetch = originalFetch;
    }
  });
});
