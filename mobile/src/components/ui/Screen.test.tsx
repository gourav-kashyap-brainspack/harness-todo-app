import React from 'react';
import {Dimensions, ScrollView, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {afterEach, describe, expect, it, jest} from '@jest/globals';
import {create as createRenderer} from 'react-test-renderer';

import {Screen} from './Screen';

describe('Screen', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('defaults to all four SafeArea edges', () => {
    const tree = createRenderer(
      <Screen>
        <Text>content</Text>
      </Screen>,
    );

    const safeArea = tree.root.findByType(SafeAreaView);
    expect(safeArea.props.edges).toEqual(['top', 'right', 'bottom', 'left']);
  });

  it('forwards a narrower edges override (e.g. a screen already under a nav-stack header)', () => {
    const tree = createRenderer(
      <Screen edges={['bottom', 'left', 'right']}>
        <Text>content</Text>
      </Screen>,
    );

    const safeArea = tree.root.findByType(SafeAreaView);
    expect(safeArea.props.edges).toEqual(['bottom', 'left', 'right']);
  });

  it('applies the bg-bg canvas token plus any passthrough className to the SafeAreaView', () => {
    const tree = createRenderer(
      <Screen className="border-t border-border">
        <Text>content</Text>
      </Screen>,
    );

    const safeArea = tree.root.findByType(SafeAreaView);
    expect(safeArea.props.className).toContain('bg-bg');
    expect(safeArea.props.className).toContain('border-t border-border');
  });

  it('renders children in a plain View by default (no scroll)', () => {
    const tree = createRenderer(
      <Screen>
        <Text>content</Text>
      </Screen>,
    );

    expect(tree.root.findAllByType(ScrollView)).toHaveLength(0);
    const content = tree.root.findByType(View);
    expect(content.props.className).toBe('flex-1 w-full px-4 sm:max-w-2xl sm:self-center');
    expect(tree.root.findByType(Text).props.children).toBe('content');
  });

  it('wraps children in a ScrollView with a flex-grow content container when scroll is set', () => {
    const tree = createRenderer(
      <Screen scroll>
        <Text>content</Text>
      </Screen>,
    );

    const scrollView = tree.root.findByType(ScrollView);
    expect(scrollView.props.className).toBe('flex-1 w-full px-4 sm:max-w-2xl sm:self-center');
    expect(scrollView.props.contentContainerClassName).toBe('flex-grow');
  });

  // NativeWind's Metro CSS transform (what actually resolves `sm:max-w-2xl`
  // to a concrete width per viewport) does not run under Jest — see
  // jest/cssMock.js. So the responsive *resolution* is NativeWind's own
  // contract, not this component's; what Screen owns, and what this guards,
  // is (a) always carrying the correct gutter/cap classNames (asserted
  // above) and (b) never branching on viewport size itself, so it can't
  // regress into something that behaves differently, or throws, across
  // device widths — proven here by mounting at a small (phone) and a large
  // (tablet/landscape) mocked window size.
  it('mounts cleanly at both a small (phone) and a large (tablet/landscape) viewport', () => {
    jest.spyOn(Dimensions, 'get').mockReturnValue({width: 360, height: 780, scale: 2, fontScale: 1});
    expect(() =>
      createRenderer(
        <Screen>
          <Text>content</Text>
        </Screen>,
      ),
    ).not.toThrow();

    jest.spyOn(Dimensions, 'get').mockReturnValue({width: 1024, height: 768, scale: 2, fontScale: 1});
    expect(() =>
      createRenderer(
        <Screen>
          <Text>content</Text>
        </Screen>,
      ),
    ).not.toThrow();
  });
});
