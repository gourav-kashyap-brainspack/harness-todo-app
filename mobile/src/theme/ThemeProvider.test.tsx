import React from 'react';
import {StatusBar, Text} from 'react-native';
import {afterEach, beforeEach, describe, expect, it, jest} from '@jest/globals';
import {colorScheme} from 'nativewind';
import {act, create as createRenderer, type ReactTestRenderer} from 'react-test-renderer';

import {useThemeStore} from '@/core/store/themeStore';

import {ThemeProvider} from './ThemeProvider';

// Auto-mock (no factory — sidesteps babel-plugin-jest-hoist's out-of-scope
// closure restriction) so `colorScheme.set` becomes a plain jest.fn(). This
// is the load-bearing integration point the test proves: ThemeProvider must
// call NativeWind's real, installed-version-verified imperative setter
// (re-exported from `nativewind`) so the `.dark` root class actually flips
// — see ThemeProvider.tsx's doc comment for how the export name was
// verified against nativewind@4.1.23's own typings.
jest.mock('nativewind');

const mockColorSchemeSet = colorScheme.set as jest.Mock;

// FND-003: ThemeProvider's own render output now depends on `resolvedScheme`
// (the StatusBar props), where before it always returned static JSX
// (`<>{children}</>`) — so a still-mounted tree from a previous test now
// visibly re-renders (and warns "not wrapped in act") if the next test's
// `beforeEach` resets the store without first unmounting it. Track + unmount
// the tree per test to keep each test isolated.
let tree: ReactTestRenderer | undefined;

function renderThemeProvider(): ReactTestRenderer {
  act(() => {
    tree = createRenderer(
      <ThemeProvider>
        <Text>child</Text>
      </ThemeProvider>,
    );
  });
  return tree!;
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    mockColorSchemeSet.mockClear();
    useThemeStore.setState({mode: 'system', resolvedScheme: 'light'});
  });

  afterEach(() => {
    if (tree) {
      act(() => {
        tree!.unmount();
      });
      tree = undefined;
    }
  });

  it('pushes the store-resolved scheme into NativeWind on mount', () => {
    renderThemeProvider();

    expect(mockColorSchemeSet).toHaveBeenCalledWith('light');
  });

  it('pushes the new resolved scheme into NativeWind when the store changes — instant, no re-mount', () => {
    renderThemeProvider();

    act(() => {
      useThemeStore.getState().setMode('dark');
    });

    expect(mockColorSchemeSet).toHaveBeenLastCalledWith('dark');
  });

  // FND-003, FR4 (code review — blocking): NavigationContainer's theme.dark
  // only styles React Navigation's own chrome, not the OS status bar, so
  // ThemeProvider must independently flip it.
  it('renders a dark-content status bar in light mode', () => {
    const rendered = renderThemeProvider();

    const statusBar = rendered.root.findByType(StatusBar);
    expect(statusBar.props.barStyle).toBe('dark-content');
    expect(statusBar.props.backgroundColor).toBe('rgb(246, 244, 241)');
  });

  it('flips to a light-content status bar when the scheme becomes dark', () => {
    const rendered = renderThemeProvider();

    act(() => {
      useThemeStore.getState().setMode('dark');
    });

    const statusBar = rendered.root.findByType(StatusBar);
    expect(statusBar.props.barStyle).toBe('light-content');
    expect(statusBar.props.backgroundColor).toBe('rgb(18, 24, 26)');
  });
});
