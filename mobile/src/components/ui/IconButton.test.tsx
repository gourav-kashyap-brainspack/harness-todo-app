import React from 'react';
import {Pressable} from 'react-native';
import {describe, expect, it, jest} from '@jest/globals';
import {create as createRenderer, type ReactTestRenderer} from 'react-test-renderer';
import Feather from 'react-native-vector-icons/Feather';

import {IconButton} from './IconButton';

describe('IconButton (TSK-005 — promoted from TSK-004\'s single-use icon-button chrome)', () => {
  it('renders the icon, exposes accessibilityRole="button" + the required label, and fires onPress when tapped', () => {
    const onPress = jest.fn();
    const tree: ReactTestRenderer = createRenderer(
      <IconButton onPress={onPress} accessibilityLabel="Remove due date" icon="x" iconColor="rgb(1, 2, 3)" />,
    );

    const pressable = tree.root.findByType(Pressable);
    expect(pressable.props.accessibilityRole).toBe('button');
    expect(pressable.props.accessibilityLabel).toBe('Remove due date');

    const icon = tree.root.findByType(Feather);
    expect(icon.props.name).toBe('x');
    expect(icon.props.color).toBe('rgb(1, 2, 3)');

    pressable.props.onPress();
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('defaults iconSize to 20dp and forwards a custom size', () => {
    const defaultTree: ReactTestRenderer = createRenderer(
      <IconButton onPress={jest.fn()} accessibilityLabel="More actions" icon="more-horizontal" iconColor="rgb(0,0,0)" />,
    );
    expect(defaultTree.root.findByType(Feather).props.size).toBe(20);

    const customTree: ReactTestRenderer = createRenderer(
      <IconButton
        onPress={jest.fn()}
        accessibilityLabel="More actions"
        icon="more-horizontal"
        iconColor="rgb(0,0,0)"
        iconSize={16}
      />,
    );
    expect(customTree.root.findByType(Feather).props.size).toBe(16);
  });

  it('always includes the base 48dp outlined-square chrome and appends an optional extra className', () => {
    const tree: ReactTestRenderer = createRenderer(
      <IconButton
        onPress={jest.fn()}
        accessibilityLabel="Mark pending"
        icon="check-circle"
        iconColor="rgb(0,0,0)"
        className="bg-success/10"
      />,
    );

    const className = tree.root.findByType(Pressable).props.className as string;
    expect(className).toContain('min-h-12 min-w-12');
    expect(className).toContain('rounded-md border border-border');
    expect(className).toContain('bg-success/10');
  });

  it('omitting className renders only the base chrome (no trailing artifact)', () => {
    const tree: ReactTestRenderer = createRenderer(
      <IconButton onPress={jest.fn()} accessibilityLabel="More actions" icon="more-horizontal" iconColor="rgb(0,0,0)" />,
    );

    const className = tree.root.findByType(Pressable).props.className as string;
    expect(className).toBe('min-h-12 min-w-12 items-center justify-center rounded-md border border-border');
  });
});
