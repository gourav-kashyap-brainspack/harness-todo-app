import React from 'react';
import {beforeEach, describe, expect, it} from '@jest/globals';
import {act, create as createRenderer} from 'react-test-renderer';

import {useThemeStore} from '@/core/store/themeStore';

import {useTheme, type UseThemeResult} from './useTheme';

function Probe({onRender}: {onRender: (result: UseThemeResult) => void}) {
  const theme = useTheme();
  onRender(theme);
  return null;
}

describe('useTheme', () => {
  beforeEach(() => {
    useThemeStore.setState({mode: 'system', resolvedScheme: 'light'});
  });

  it('returns the resolved scheme + mode + setMode from the theme store', () => {
    const renders: UseThemeResult[] = [];

    act(() => {
      createRenderer(<Probe onRender={result => renders.push(result)} />);
    });

    expect(renders[0]).toMatchObject({mode: 'system', resolvedScheme: 'light'});
    expect(typeof renders[0].setMode).toBe('function');
  });

  it('flips the resolved scheme when setMode is called (drives the consuming component to re-render)', () => {
    const renders: UseThemeResult[] = [];

    act(() => {
      createRenderer(<Probe onRender={result => renders.push(result)} />);
    });

    act(() => {
      renders[renders.length - 1].setMode('dark');
    });

    const latest = renders[renders.length - 1];
    expect(latest.mode).toBe('dark');
    expect(latest.resolvedScheme).toBe('dark');
  });
});
