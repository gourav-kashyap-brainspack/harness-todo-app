import React from 'react';
import {Pressable, Text} from 'react-native';
import {describe, expect, it, jest} from '@jest/globals';
import {create as createRenderer} from 'react-test-renderer';

import {SegmentedControl} from './SegmentedControl';

type Mode = 'system' | 'light' | 'dark';

const OPTIONS: {value: Mode; label: string}[] = [
  {value: 'system', label: 'System'},
  {value: 'light', label: 'Light'},
  {value: 'dark', label: 'Dark'},
];

describe('SegmentedControl (PRO-002, F-003 generalized)', () => {
  it('renders every option label', () => {
    const tree = createRenderer(
      <SegmentedControl
        options={OPTIONS}
        value="system"
        onChange={jest.fn()}
        accessibilityLabel="Theme"
      />,
    );

    const labels = tree.root.findAllByType(Text).map(node => node.props.children);
    expect(labels).toEqual(['System', 'Light', 'Dark']);
  });

  it('marks the selected segment via accessibilityState and pairs the fill with a weight change (never color-alone)', () => {
    const tree = createRenderer(
      <SegmentedControl
        options={OPTIONS}
        value="dark"
        onChange={jest.fn()}
        accessibilityLabel="Theme"
      />,
    );

    const segments = tree.root.findAllByType(Pressable);
    expect(segments[2]!.props.accessibilityState).toEqual({selected: true});
    expect(segments[0]!.props.accessibilityState).toEqual({selected: false});

    const darkLabel = tree.root.findByProps({children: 'Dark'});
    expect(darkLabel.props.className).toEqual(expect.stringContaining('font-semibold'));
    expect(darkLabel.props.className).toEqual(expect.stringContaining('text-primary-fg'));

    const lightLabel = tree.root.findByProps({children: 'Light'});
    expect(lightLabel.props.className).not.toEqual(expect.stringContaining('font-semibold'));
  });

  it("fires onChange with the pressed option's value", () => {
    const onChange = jest.fn();
    const tree = createRenderer(
      <SegmentedControl
        options={OPTIONS}
        value="system"
        onChange={onChange}
        accessibilityLabel="Theme"
      />,
    );

    const segments = tree.root.findAllByType(Pressable);
    segments[1]!.props.onPress();

    expect(onChange).toHaveBeenCalledWith('light');
  });

  it('sets accessibilityRole="tab" per segment and the group accessibilityLabel on the track', () => {
    const tree = createRenderer(
      <SegmentedControl
        options={OPTIONS}
        value="system"
        onChange={jest.fn()}
        accessibilityLabel="Theme"
      />,
    );

    tree.root.findAllByType(Pressable).forEach(segment => {
      expect(segment.props.accessibilityRole).toBe('tab');
    });

    const track = tree.root.findByProps({accessibilityRole: 'tablist'});
    expect(track.props.accessibilityLabel).toBe('Theme');
  });
});
