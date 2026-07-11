import React from 'react';
import {Modal, Pressable} from 'react-native';
import {act, create as createRenderer} from 'react-test-renderer';
import {describe, expect, it, jest} from '@jest/globals';

import {ActionSheet} from './ActionSheet';

/** NativeWind's cssInterop wraps `Pressable` and forwards `accessibilityRole`
 * onto both the wrapper and the underlying host node, so a bare
 * `findAllByProps` lookup double(+)-counts each real row — same fix
 * `ProfileSetupScreen.test.tsx`/`FormField.test.tsx` apply for `Text`:
 * scope to `findAllByType(Pressable)` first, then filter by prop. */
function findMenuItems(tree: ReturnType<typeof createRenderer>) {
  return tree.root
    .findAllByType(Pressable)
    .filter(node => node.props.accessibilityRole === 'menuitem');
}

describe('ActionSheet (PRO-003)', () => {
  it('renders nothing at all while not visible', () => {
    const tree = createRenderer(
      <ActionSheet visible={false} onClose={jest.fn()} options={[{label: 'Take Photo', onPress: jest.fn()}]} />,
    );

    expect(tree.toJSON()).toBeNull();
  });

  it('renders one menuitem per option plus a trailing Cancel, and a Modal host', () => {
    const tree = createRenderer(
      <ActionSheet
        visible
        onClose={jest.fn()}
        accessibilityLabel="Photo actions"
        options={[
          {label: 'Take Photo', onPress: jest.fn()},
          {label: 'Choose from Library', onPress: jest.fn()},
        ]}
      />,
    );

    expect(tree.root.findByType(Modal)).toBeTruthy();
    const items = findMenuItems(tree);
    expect(items).toHaveLength(2);
    expect(items[0]!.props.accessibilityLabel).toBe('Take Photo');
    expect(items[1]!.props.accessibilityLabel).toBe('Choose from Library');
    expect(tree.root.findByProps({accessibilityLabel: 'Cancel'})).toBeTruthy();
  });

  it('pressing an option closes the sheet AND invokes its onPress', () => {
    const onClose = jest.fn();
    const onPress = jest.fn();
    const tree = createRenderer(
      <ActionSheet visible onClose={onClose} options={[{label: 'Take Photo', onPress}]} />,
    );

    act(() => {
      tree.root.findByProps({accessibilityLabel: 'Take Photo'}).props.onPress();
    });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('pressing the backdrop or Cancel closes the sheet without calling any option', () => {
    const onClose = jest.fn();
    const onPress = jest.fn();
    const tree = createRenderer(
      <ActionSheet visible onClose={onClose} options={[{label: 'Take Photo', onPress}]} />,
    );

    act(() => {
      tree.root.findByProps({accessibilityLabel: 'Dismiss'}).props.onPress();
    });
    expect(onClose).toHaveBeenCalledTimes(1);

    act(() => {
      tree.root.findByProps({accessibilityLabel: 'Cancel'}).props.onPress();
    });
    expect(onClose).toHaveBeenCalledTimes(2);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('marks a destructive option with the danger text style', () => {
    const tree = createRenderer(
      <ActionSheet
        visible
        onClose={jest.fn()}
        options={[{label: 'Remove Photo', onPress: jest.fn(), destructive: true}]}
      />,
    );

    const label = tree.root.findByProps({children: 'Remove Photo'});
    expect(label.props.className).toEqual(expect.stringContaining('text-danger'));
  });
});
