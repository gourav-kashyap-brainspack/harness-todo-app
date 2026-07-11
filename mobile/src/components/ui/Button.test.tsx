import React from 'react';
import {ActivityIndicator, Pressable} from 'react-native';
import {describe, expect, it, jest} from '@jest/globals';
import {create as createRenderer, type ReactTestRenderer} from 'react-test-renderer';

import {Button} from './Button';

describe('Button (PRO-001)', () => {
  it('renders the label, exposes accessibilityRole="button" + the label, and fires onPress when tapped', () => {
    const onPress = jest.fn();
    const tree: ReactTestRenderer = createRenderer(<Button label="Get Started" onPress={onPress} />);

    const pressable = tree.root.findByType(Pressable);
    expect(pressable.props.accessibilityRole).toBe('button');
    expect(pressable.props.accessibilityLabel).toBe('Get Started');
    expect(pressable.props.accessibilityState).toEqual({disabled: false, busy: false});
    // Native `disabled` (not just the a11y state) reflects idle = tappable.
    expect(pressable.props.disabled).toBe(false);
    expect(tree.root.findByProps({children: 'Get Started'})).toBeTruthy();

    pressable.props.onPress();
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('guards onPress as a no-op while disabled and reflects it in accessibilityState + opacity', () => {
    const onPress = jest.fn();
    const tree: ReactTestRenderer = createRenderer(
      <Button label="Get Started" onPress={onPress} disabled />,
    );

    const pressable = tree.root.findByType(Pressable);
    expect(pressable.props.accessibilityState).toEqual({disabled: true, busy: false});
    expect(pressable.props.className).toEqual(expect.stringContaining('opacity-50'));
    // Native `disabled` (not just the in-handler guard) so RN's own
    // press-feedback/focusability matches the a11y state.
    expect(pressable.props.disabled).toBe(true);

    pressable.props.onPress();
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows an ActivityIndicator, marks busy, and guards onPress while loading', () => {
    const onPress = jest.fn();
    const tree: ReactTestRenderer = createRenderer(
      <Button label="Get Started" onPress={onPress} loading />,
    );

    const pressable = tree.root.findByType(Pressable);
    expect(pressable.props.accessibilityState).toEqual({disabled: true, busy: true});
    expect(pressable.props.disabled).toBe(true);
    // The resting label stays the accessible name even while busy.
    expect(pressable.props.accessibilityLabel).toBe('Get Started');
    expect(tree.root.findByType(ActivityIndicator)).toBeTruthy();
    expect(tree.root.findAllByProps({children: 'Get Started'})).toHaveLength(0);

    pressable.props.onPress();
    expect(onPress).not.toHaveBeenCalled();
  });

  it('defaults to fullWidth (w-full) and omits it when fullWidth={false}', () => {
    const fullWidthTree: ReactTestRenderer = createRenderer(
      <Button label="Save" onPress={jest.fn()} />,
    );
    expect(fullWidthTree.root.findByType(Pressable).props.className).toEqual(
      expect.stringContaining('w-full'),
    );

    const narrowTree: ReactTestRenderer = createRenderer(
      <Button label="Save" onPress={jest.fn()} fullWidth={false} />,
    );
    expect(narrowTree.root.findByType(Pressable).props.className).not.toEqual(
      expect.stringContaining('w-full'),
    );
  });
});
