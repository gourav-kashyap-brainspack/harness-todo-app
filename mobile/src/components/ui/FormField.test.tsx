import React from 'react';
import {AccessibilityInfo, Platform, Text, TextInput} from 'react-native';
import {afterEach, describe, expect, it, jest} from '@jest/globals';
import {act, create as createRenderer, type ReactTestRenderer} from 'react-test-renderer';

import {useThemeStore} from '@/core/store/themeStore';

import {FormField} from './FormField';

const initialThemeState = useThemeStore.getState();
const originalPlatformOS = Platform.OS;

let tree: ReactTestRenderer | undefined;

function renderFormField(props: Partial<React.ComponentProps<typeof FormField>> = {}) {
  act(() => {
    tree = createRenderer(<FormField label="Name" value="" onChangeText={jest.fn()} {...props} />);
  });
  return tree!;
}

describe('FormField (PRO-001, F-033)', () => {
  afterEach(() => {
    if (tree) {
      act(() => {
        tree!.unmount();
      });
      tree = undefined;
    }
    useThemeStore.setState(initialThemeState);
    Platform.OS = originalPlatformOS;
    // `AccessibilityInfo.announceForAccessibility` is auto-mocked by the RN
    // jest preset from module load (not something *this* file spies into
    // existence), so `restoreAllMocks()` alone never clears its call
    // history between tests — `clearAllMocks()` is what resets
    // `.mock.calls` on an already-existing mock, which matters here since
    // several tests in this file render an error and therefore call it.
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('renders the label and the input with a neutral border and no error row when valid', () => {
    const rendered = renderFormField();

    expect(rendered.root.findByProps({children: 'Name'})).toBeTruthy();
    const input = rendered.root.findByType(TextInput);
    expect(input.props.accessibilityLabel).toBe('Name');
    expect(input.props.className).toEqual(expect.stringContaining('border-border'));
    expect(() => rendered.root.findByProps({name: 'alert-circle'})).toThrow();
  });

  it('shows the border-primary focus ring while focused (no error)', () => {
    const rendered = renderFormField();
    const input = rendered.root.findByType(TextInput);

    act(() => {
      input.props.onFocus();
    });

    expect(rendered.root.findByType(TextInput).props.className).toEqual(
      expect.stringContaining('border-primary'),
    );
  });

  it('shows the inline error (icon + text), border-danger, and folds the error into accessibilityLabel', () => {
    const rendered = renderFormField({error: 'name is required'});

    const input = rendered.root.findByType(TextInput);
    expect(input.props.className).toEqual(expect.stringContaining('border-danger'));
    expect(input.props.accessibilityLabel).toBe('Name, name is required');

    const icon = rendered.root.findByProps({name: 'alert-circle'});
    expect(icon).toBeTruthy();

    const errorText = rendered.root
      .findAllByType(Text)
      .find(node => node.props.children === 'name is required');
    expect(errorText).toBeTruthy();
    expect(errorText!.props.accessibilityLiveRegion).toBe('polite');
  });

  it('error border takes precedence over the focus border', () => {
    const rendered = renderFormField({error: 'name is required'});
    const input = rendered.root.findByType(TextInput);

    act(() => {
      input.props.onFocus();
    });

    expect(rendered.root.findByType(TextInput).props.className).toEqual(
      expect.stringContaining('border-danger'),
    );
  });

  it('calls the passed-through onBlur while also clearing the internal focus state', () => {
    const onBlur = jest.fn();
    const rendered = renderFormField({onBlur});
    const input = rendered.root.findByType(TextInput);

    act(() => {
      input.props.onFocus();
    });
    act(() => {
      input.props.onBlur({} as never);
    });

    expect(onBlur).toHaveBeenCalledTimes(1);
    expect(rendered.root.findByType(TextInput).props.className).not.toEqual(
      expect.stringContaining('border-primary'),
    );
  });

  it('announces a newly-appeared error via AccessibilityInfo on iOS (the default test platform)', () => {
    Platform.OS = 'ios';
    const announceSpy = jest
      .spyOn(AccessibilityInfo, 'announceForAccessibility')
      .mockImplementation(() => {});

    renderFormField({error: 'name is required'});
    expect(announceSpy).toHaveBeenCalledWith('name is required');
    expect(announceSpy).toHaveBeenCalledTimes(1);

    // Re-rendering with the SAME error must not re-announce.
    act(() => {
      tree!.update(
        <FormField label="Name" value="" onChangeText={jest.fn()} error="name is required" />,
      );
    });
    expect(announceSpy).toHaveBeenCalledTimes(1);

    // A genuinely NEW error message announces again.
    act(() => {
      tree!.update(
        <FormField label="Name" value="" onChangeText={jest.fn()} error="a different error" />,
      );
    });
    expect(announceSpy).toHaveBeenCalledTimes(2);
    expect(announceSpy).toHaveBeenLastCalledWith('a different error');
  });

  it('does not call AccessibilityInfo.announceForAccessibility on Android (accessibilityLiveRegion covers it there)', () => {
    Platform.OS = 'android';
    const announceSpy = jest
      .spyOn(AccessibilityInfo, 'announceForAccessibility')
      .mockImplementation(() => {});

    renderFormField({error: 'name is required'});

    expect(announceSpy).not.toHaveBeenCalled();
  });

  it('resolves the danger icon color from the active theme scheme', () => {
    useThemeStore.setState({resolvedScheme: 'dark'});
    const rendered = renderFormField({error: 'name is required'});

    const icon = rendered.root.findByProps({name: 'alert-circle'});
    expect(icon.props.color).toBe('rgb(229, 100, 90)');
  });

  it('multiline grows the input to the taller "sane height" box and top-aligns text on Android (TSK-002)', () => {
    const rendered = renderFormField({multiline: true, numberOfLines: 4});
    const input = rendered.root.findByType(TextInput);

    expect(input.props.className).toEqual(expect.stringContaining('min-h-24'));
    expect(input.props.className).not.toEqual(expect.stringContaining('min-h-12'));
    expect(input.props.textAlignVertical).toBe('top');
    expect(input.props.multiline).toBe(true);
    expect(input.props.numberOfLines).toBe(4);
  });

  it('single-line (default) input keeps the standard height and no textAlignVertical override', () => {
    const rendered = renderFormField();
    const input = rendered.root.findByType(TextInput);

    expect(input.props.className).toEqual(expect.stringContaining('min-h-12'));
    expect(input.props.textAlignVertical).toBeUndefined();
  });

  it('the `required` prop renders no visible marker and never leaks onto the underlying TextInput', () => {
    const rendered = renderFormField({required: true});

    // Only the label text itself renders — no `*` or other required glyph.
    expect(rendered.root.findAllByType(Text).map(node => node.props.children)).toEqual(['Name']);
    // `required` is destructured out (as `_required`) rather than spread
    // via `...inputProps`, so the host TextInput never receives it as a
    // stray prop.
    expect(rendered.root.findByType(TextInput).props).not.toHaveProperty('required');
  });
});
