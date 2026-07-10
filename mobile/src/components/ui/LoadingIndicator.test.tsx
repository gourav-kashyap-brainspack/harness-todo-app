import React from 'react';
import {ActivityIndicator, Text, View} from 'react-native';
import {afterEach, describe, expect, it} from '@jest/globals';
import {act, create as createRenderer, type ReactTestRenderer} from 'react-test-renderer';

import {useThemeStore} from '@/core/store/themeStore';

import {LoadingIndicator} from './LoadingIndicator';

const initialThemeState = useThemeStore.getState();

// Track + unmount per test before resetting the store: LoadingIndicator
// subscribes to `resolvedScheme`, so a still-mounted tree from the previous
// test would otherwise re-render outside `act()` the moment `afterEach`
// touches the store (same fix as ThemeProvider.test.tsx / TabNavigator.test.tsx).
let tree: ReactTestRenderer | undefined;

function renderLoadingIndicator(props?: {label?: string}): ReactTestRenderer {
  act(() => {
    tree = createRenderer(<LoadingIndicator {...props} />);
  });
  return tree!;
}

describe('LoadingIndicator', () => {
  afterEach(() => {
    if (tree) {
      act(() => {
        tree!.unmount();
      });
      tree = undefined;
    }
    useThemeStore.setState(initialThemeState);
  });

  it('always exposes a screen-reader accessibilityLabel, defaulting to "Loading…"', () => {
    const rendered = renderLoadingIndicator();

    const wrapper = rendered.root.findByType(View);
    expect(wrapper.props.accessible).toBe(true);
    expect(wrapper.props.accessibilityRole).toBe('progressbar');
    expect(wrapper.props.accessibilityLabel).toBe('Loading…');
    expect(wrapper.props.accessibilityLiveRegion).toBe('polite');
  });

  it('uses a provided label as both the screen-reader label and the visible caption', () => {
    const rendered = renderLoadingIndicator({label: 'Refreshing tasks…'});

    const wrapper = rendered.root.findByType(View);
    expect(wrapper.props.accessibilityLabel).toBe('Refreshing tasks…');

    const caption = rendered.root.findByType(Text);
    expect(caption.props.children).toBe('Refreshing tasks…');
  });

  it('renders no visible caption when no label is passed (the a11y label still defaults)', () => {
    const rendered = renderLoadingIndicator();

    expect(rendered.root.findAllByType(Text)).toHaveLength(0);
  });

  it('resolves the light-scheme primary RGB for the spinner color', () => {
    useThemeStore.setState({resolvedScheme: 'light'});
    const rendered = renderLoadingIndicator();

    const spinner = rendered.root.findByType(ActivityIndicator);
    expect(spinner.props.size).toBe('large');
    expect(spinner.props.color).toBe('rgb(11, 110, 127)');
  });

  it('resolves the dark-scheme primary RGB for the spinner color', () => {
    useThemeStore.setState({resolvedScheme: 'dark'});
    const rendered = renderLoadingIndicator();

    const spinner = rendered.root.findByType(ActivityIndicator);
    expect(spinner.props.color).toBe('rgb(23, 120, 111)');
  });
});
