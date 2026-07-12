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

  // TSK-004: two new optional props, `title` + per-option `icon`. The suite
  // above (no `title`, no `icon` on any option — the exact shape PRO-003's
  // photo-action menu uses) already proves the back-compat path renders
  // unchanged; these cover the new behavior only.
  it('omits the header entirely when `title` is not supplied (back-compat — PRO-003 unaffected)', () => {
    const tree = createRenderer(
      <ActionSheet visible onClose={jest.fn()} options={[{label: 'Take Photo', onPress: jest.fn()}]} />,
    );

    expect(() => tree.root.findByProps({accessibilityRole: 'header'})).toThrow();
  });

  it('renders a `title` as an announced header above the options', () => {
    const tree = createRenderer(
      <ActionSheet
        visible
        onClose={jest.fn()}
        title="Delete this task?"
        options={[{label: 'Delete', onPress: jest.fn(), destructive: true}]}
      />,
    );

    const header = tree.root.findByProps({accessibilityRole: 'header'});
    expect(header.props.children).toBe('Delete this task?');
  });

  it('renders no icon glyph on an option that omits `icon` (back-compat)', () => {
    const tree = createRenderer(
      <ActionSheet visible onClose={jest.fn()} options={[{label: 'Take Photo', onPress: jest.fn()}]} />,
    );

    expect(() => tree.root.findByProps({name: 'camera'})).toThrow();
  });

  it('renders each option\'s leading Feather `icon` when supplied', () => {
    const tree = createRenderer(
      <ActionSheet
        visible
        onClose={jest.fn()}
        options={[
          {label: 'Duplicate', onPress: jest.fn(), icon: 'copy'},
          {label: 'Delete', onPress: jest.fn(), destructive: true, icon: 'trash-2'},
        ]}
      />,
    );

    expect(tree.root.findByProps({name: 'copy'})).toBeTruthy();
    expect(tree.root.findByProps({name: 'trash-2'})).toBeTruthy();
  });

  // ORG-003: one new optional per-option prop, `active`. The suites above
  // (no option ever sets it — the exact shape PRO-003/TSK-004's existing
  // call sites use) already prove the back-compat path renders unchanged;
  // these cover the new behavior only.
  describe('`active` option (ORG-003, F-026-029)', () => {
    it('marks an active option with the primary+semibold label treatment, keeping its own icon glyph', () => {
      const tree = createRenderer(
        <ActionSheet
          visible
          onClose={jest.fn()}
          options={[
            {label: 'Due date', onPress: jest.fn(), icon: 'calendar', active: true},
            {label: 'Alphabetical', onPress: jest.fn(), icon: 'type'},
          ]}
        />,
      );

      const activeLabel = tree.root.findByProps({children: 'Due date'});
      expect(activeLabel.props.className).toEqual(expect.stringContaining('text-primary'));
      expect(activeLabel.props.className).toEqual(expect.stringContaining('font-semibold'));

      const inactiveLabel = tree.root.findByProps({children: 'Alphabetical'});
      expect(inactiveLabel.props.className).not.toEqual(expect.stringContaining('text-primary'));

      // The active option keeps its OWN meaningful glyph (`calendar`) — it
      // is never swapped to a generic checkmark.
      expect(tree.root.findByProps({name: 'calendar'})).toBeTruthy();
    });

    it('resolves the active option\'s icon color to `primary`, distinct from the default and destructive colors', () => {
      const tree = createRenderer(
        <ActionSheet
          visible
          onClose={jest.fn()}
          options={[
            {label: 'Due date', onPress: jest.fn(), icon: 'calendar', active: true},
            {label: 'Alphabetical', onPress: jest.fn(), icon: 'type'},
            {label: 'Delete', onPress: jest.fn(), icon: 'trash-2', destructive: true},
          ]}
        />,
      );

      const activeIcon = tree.root.findByProps({name: 'calendar'});
      const defaultIcon = tree.root.findByProps({name: 'type'});
      const destructiveIcon = tree.root.findByProps({name: 'trash-2'});

      expect(activeIcon.props.color).not.toBe(defaultIcon.props.color);
      expect(activeIcon.props.color).not.toBe(destructiveIcon.props.color);
      expect(defaultIcon.props.color).not.toBe(destructiveIcon.props.color);
    });

    it('an option that omits `active` renders with the default (non-active) treatment — back-compat', () => {
      const tree = createRenderer(
        <ActionSheet visible onClose={jest.fn()} options={[{label: 'Take Photo', onPress: jest.fn()}]} />,
      );

      const label = tree.root.findByProps({children: 'Take Photo'});
      expect(label.props.className).toBe('text-base text-text');
    });
  });
});
