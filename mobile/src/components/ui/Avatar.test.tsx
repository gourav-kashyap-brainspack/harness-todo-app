import React from 'react';
import {Text} from 'react-native';
import {describe, expect, it} from '@jest/globals';
import {create as createRenderer} from 'react-test-renderer';

import {Avatar} from './Avatar';

describe('Avatar (PRO-002, F-005)', () => {
  it('renders initials from a two-word name', () => {
    const tree = createRenderer(<Avatar name="Ada Lovelace" />);

    expect(tree.root.findByType(Text).props.children).toBe('AL');
  });

  it('renders a single initial from a one-word name', () => {
    const tree = createRenderer(<Avatar name="Ada" />);

    expect(tree.root.findByType(Text).props.children).toBe('A');
  });

  it('ignores middle words — uses only the first and last', () => {
    const tree = createRenderer(<Avatar name="Ada Marie Lovelace" />);

    expect(tree.root.findByType(Text).props.children).toBe('AL');
  });

  it('falls back to the Feather "user" glyph when the name is empty (defensive edge case)', () => {
    const tree = createRenderer(<Avatar name="" />);

    // `Feather` itself renders a native `Text` glyph internally, so this
    // asserts on the icon (`react-native-vector-icons`' own element, found
    // by its `name` prop — the same convention `EmptyState.test.tsx` uses)
    // rather than "no Text node at all".
    const icon = tree.root.findByProps({name: 'user'});
    expect(icon).toBeTruthy();
    expect(icon.props.size).toBe(28);
  });

  it('is decorative — hidden from the accessibility tree', () => {
    const tree = createRenderer(<Avatar name="Ada Lovelace" />);

    const chip = tree.root.findByProps({accessibilityElementsHidden: true});
    expect(chip.props.importantForAccessibility).toBe('no-hide-descendants');
  });

  it('defaults to the "lg" 80dp size and switches to "md" (64dp) when requested', () => {
    const lg = createRenderer(<Avatar name="Ada Lovelace" />);
    expect(lg.root.findByProps({accessibilityElementsHidden: true}).props.className).toEqual(
      expect.stringContaining('h-20 w-20'),
    );

    const md = createRenderer(<Avatar name="Ada Lovelace" size="md" />);
    expect(md.root.findByProps({accessibilityElementsHidden: true}).props.className).toEqual(
      expect.stringContaining('h-16 w-16'),
    );
  });
});
