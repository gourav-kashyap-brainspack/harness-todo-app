import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {act, create as createRenderer, type ReactTestRenderer} from 'react-test-renderer';
import {afterEach, beforeEach, describe, expect, it, jest} from '@jest/globals';

import {useThemeStore} from '@/core/store/themeStore';

import {TabNavigator} from './TabNavigator';

// Same Easing/bezier + real-timer leak as navigation.test.tsx's pushed
// screens — the tab bar's active/inactive icon cross-fade is also an
// `Animated.timing`. See that file's comment for the full explanation.
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

const initialThemeState = useThemeStore.getState();

let tree: ReactTestRenderer | undefined;

function renderTabs(): ReactTestRenderer {
  act(() => {
    tree = createRenderer(
      <NavigationContainer>
        <TabNavigator />
      </NavigationContainer>,
    );
  });
  return tree!;
}

/**
 * Direct assertions that the tab-bar icon tint actually resolves to the
 * correct RGB per scheme (code review, FND-003: the dark branch of the
 * shared `NATIVE_CHROME_RGB` map was previously never exercised by a test).
 *
 * `@react-navigation/bottom-tabs` renders each tab's icon TWICE, cross-faded
 * by opacity (one instance at `tabBarActiveTintColor`, one at
 * `tabBarInactiveTintColor`) — see `TabBarIcon.js`. So each assertion checks
 * that BOTH resolved tint colors are present, not "the" single color.
 */
describe('TabNavigator tint colors (FND-003, FR2/FR4)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    if (tree) {
      act(() => {
        jest.runOnlyPendingTimers();
        tree!.unmount();
      });
      tree = undefined;
    }
    jest.useRealTimers();
    useThemeStore.setState(initialThemeState);
  });

  it('uses light-scheme tint colors when resolvedScheme is light', () => {
    useThemeStore.setState({resolvedScheme: 'light'});
    const rendered = renderTabs();

    const homeColors = rendered.root.findAllByProps({name: 'home'}).map(node => node.props.color);
    const profileColors = rendered.root
      .findAllByProps({name: 'user'})
      .map(node => node.props.color);

    expect(homeColors).toEqual(expect.arrayContaining(['rgb(11, 110, 127)', 'rgb(91, 86, 79)']));
    expect(profileColors).toEqual(
      expect.arrayContaining(['rgb(11, 110, 127)', 'rgb(91, 86, 79)']),
    );
  });

  it('uses dark-scheme tint colors when resolvedScheme is dark', () => {
    useThemeStore.setState({resolvedScheme: 'dark'});
    const rendered = renderTabs();

    const homeColors = rendered.root.findAllByProps({name: 'home'}).map(node => node.props.color);
    const profileColors = rendered.root
      .findAllByProps({name: 'user'})
      .map(node => node.props.color);

    expect(homeColors).toEqual(
      expect.arrayContaining(['rgb(23, 120, 111)', 'rgb(154, 166, 168)']),
    );
    expect(profileColors).toEqual(
      expect.arrayContaining(['rgb(23, 120, 111)', 'rgb(154, 166, 168)']),
    );
  });
});
