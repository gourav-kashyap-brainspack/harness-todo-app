import React from 'react';
import {Text} from 'react-native';
import {beforeEach, describe, expect, it, jest} from '@jest/globals';
import {colorScheme} from 'nativewind';
import {act, create as createRenderer} from 'react-test-renderer';

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

describe('ThemeProvider', () => {
  beforeEach(() => {
    mockColorSchemeSet.mockClear();
    useThemeStore.setState({mode: 'system', resolvedScheme: 'light'});
  });

  it('pushes the store-resolved scheme into NativeWind on mount', () => {
    act(() => {
      createRenderer(
        <ThemeProvider>
          <Text>child</Text>
        </ThemeProvider>,
      );
    });

    expect(mockColorSchemeSet).toHaveBeenCalledWith('light');
  });

  it('pushes the new resolved scheme into NativeWind when the store changes — instant, no re-mount', () => {
    act(() => {
      createRenderer(
        <ThemeProvider>
          <Text>child</Text>
        </ThemeProvider>,
      );
    });

    act(() => {
      useThemeStore.getState().setMode('dark');
    });

    expect(mockColorSchemeSet).toHaveBeenLastCalledWith('dark');
  });
});
