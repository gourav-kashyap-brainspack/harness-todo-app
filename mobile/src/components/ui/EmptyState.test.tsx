import React from 'react';
import {Pressable, Text, View} from 'react-native';
import {describe, expect, it, jest} from '@jest/globals';
import {create as createRenderer} from 'react-test-renderer';

import {EmptyState} from './EmptyState';

describe('EmptyState', () => {
  it('renders the title and the optional message', () => {
    const tree = createRenderer(
      <EmptyState title="No tasks yet" message="Add your first task to get started." />,
    );

    const texts = tree.root.findAllByType(Text).map(node => node.props.children);
    expect(texts).toContain('No tasks yet');
    expect(texts).toContain('Add your first task to get started.');
  });

  it('renders only the title when no message is passed', () => {
    const tree = createRenderer(<EmptyState title="No tasks yet" />);

    const texts = tree.root.findAllByType(Text).map(node => node.props.children);
    expect(texts).toEqual(['No tasks yet']);
  });

  it('renders the icon inside a chip that is hidden from the accessibility tree (decorative)', () => {
    const tree = createRenderer(<EmptyState title="No tasks yet" icon="inbox" />);

    const chip = tree.root
      .findAllByType(View)
      .find(node => node.props.accessibilityElementsHidden === true);

    expect(chip).toBeDefined();
    expect(chip!.props.importantForAccessibility).toBe('no-hide-descendants');

    const icon = tree.root.findByProps({name: 'inbox'});
    expect(icon.props.size).toBe(28);
  });

  it('renders no icon chip when no icon is passed', () => {
    const tree = createRenderer(<EmptyState title="No tasks yet" />);

    const chip = tree.root
      .findAllByType(View)
      .find(node => node.props.accessibilityElementsHidden === true);

    expect(chip).toBeUndefined();
  });

  it('fires action.onPress and exposes accessibilityRole="button" + the action label', () => {
    const onPress = jest.fn();
    const tree = createRenderer(
      <EmptyState title="No tasks yet" action={{label: 'Add a task', onPress}} />,
    );

    const button = tree.root.findByType(Pressable);
    expect(button.props.accessibilityRole).toBe('button');
    expect(button.props.accessibilityLabel).toBe('Add a task');

    button.props.onPress();
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders no action button when none is passed', () => {
    const tree = createRenderer(<EmptyState title="No tasks yet" />);

    expect(tree.root.findAllByType(Pressable)).toHaveLength(0);
  });
});
