import React from 'react';
import {TextInput} from 'react-native';
import {describe, expect, it, jest} from '@jest/globals';
import {create as createRenderer, type ReactTestRenderer} from 'react-test-renderer';
import Feather from 'react-native-vector-icons/Feather';

import {IconButton} from '@/components/ui';

import {SearchBar} from './SearchBar';

function renderSearchBar(props: Partial<React.ComponentProps<typeof SearchBar>> = {}): ReactTestRenderer {
  return createRenderer(<SearchBar value="" onChangeText={jest.fn()} onClear={jest.fn()} {...props} />);
}

describe('SearchBar (ORG-002, FR1/FR2, F-020/F-021/F-022)', () => {
  it('renders a labeled text input with the "Search tasks" placeholder', () => {
    const tree = renderSearchBar();

    const input = tree.root.findByType(TextInput);
    expect(input.props.accessibilityLabel).toBe('Search tasks');
    expect(input.props.placeholder).toBe('Search tasks');
  });

  it('reflects the current value', () => {
    const tree = renderSearchBar({value: 'milk'});

    expect(tree.root.findByType(TextInput).props.value).toBe('milk');
  });

  it('every keystroke calls onChangeText live — no submit/debounce (FR2)', () => {
    const onChangeText = jest.fn();
    const tree = renderSearchBar({onChangeText});

    tree.root.findByType(TextInput).props.onChangeText('m');

    expect(onChangeText).toHaveBeenCalledWith('m');
    expect(tree.root.findByType(TextInput).props.onSubmitEditing).toBeUndefined();
  });

  it('the clear button is NOT rendered when the query is empty', () => {
    const tree = renderSearchBar({value: ''});

    expect(() => tree.root.findByProps({accessibilityLabel: 'Clear search'})).toThrow();
  });

  it('the clear button renders, is labeled, and calls onClear when the query is non-empty', () => {
    const onClear = jest.fn();
    const tree = renderSearchBar({value: 'milk', onClear});

    const clearButton = tree.root.findByType(IconButton);
    expect(clearButton.props.accessibilityLabel).toBe('Clear search');

    clearButton.props.onPress();
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('the leading search icon is decorative — hidden from the accessibility tree', () => {
    const tree = renderSearchBar();

    const icon = tree.root.findByType(Feather);
    expect(icon.props.name).toBe('search');
    expect(icon.props.accessibilityElementsHidden).toBe(true);
    expect(icon.props.importantForAccessibility).toBe('no-hide-descendants');
  });
});
