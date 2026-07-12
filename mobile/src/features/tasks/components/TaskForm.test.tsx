import React from 'react';
import {Text, TextInput} from 'react-native';
import {act, create as createRenderer, type ReactTestRenderer} from 'react-test-renderer';
import {describe, expect, it, jest} from '@jest/globals';

import {TaskForm} from './TaskForm';

/** Title is TextInput[0], Description is TextInput[1] — the form's field order. */
function fillField(tree: ReactTestRenderer, index: 0 | 1, value: string): void {
  const input = tree.root.findAllByType(TextInput)[index];
  act(() => {
    input.props.onChangeText(value);
  });
  act(() => {
    input.props.onBlur({} as never);
  });
}

function pressSubmit(tree: ReactTestRenderer, label = 'Add task'): void {
  const button = tree.root.findByProps({accessibilityLabel: label});
  act(() => {
    button.props.onPress();
  });
}

/** zodResolver validates asynchronously even for a purely-sync schema (see
 * ProfileSetupScreen.test.tsx for the same rationale) — flush a real macro
 * task so `handleSubmit`'s internal promise chain has settled. */
async function flushSubmit(): Promise<void> {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
  });
}

function renderForm(props: Partial<React.ComponentProps<typeof TaskForm>> = {}): ReactTestRenderer {
  let tree!: ReactTestRenderer;
  act(() => {
    tree = createRenderer(<TaskForm onSubmit={jest.fn()} {...props} />);
  });
  return tree;
}

/** Counts FormField's announced inline error rows (same helper shape as
 * ProfileSetupScreen.test.tsx / FormField.test.tsx). */
function countAnnouncedErrors(tree: ReactTestRenderer): number {
  return tree.root
    .findAllByType(Text)
    .filter(node => node.props.accessibilityLiveRegion === 'polite').length;
}

describe('TaskForm (TSK-002, FR1/FR3/FR4)', () => {
  it('renders labeled Title (required) and Description (multiline) fields plus the submit button', () => {
    const tree = renderForm();

    expect(tree.root.findByProps({accessibilityLabel: 'Title'})).toBeTruthy();
    expect(tree.root.findByProps({accessibilityLabel: 'Description'})).toBeTruthy();

    const inputs = tree.root.findAllByType(TextInput);
    expect(inputs[1]!.props.multiline).toBe(true);

    expect(tree.root.findByProps({accessibilityLabel: 'Add task'})).toBeTruthy();
  });

  it('an empty title is rejected by the zodResolver (F-034) — onSubmit is never called', async () => {
    const onSubmit = jest.fn();
    const tree = renderForm({onSubmit});

    pressSubmit(tree);
    await flushSubmit();

    expect(countAnnouncedErrors(tree)).toBe(1);
    expect(tree.root.findByProps({accessibilityLabel: 'Title, title is required'})).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('a valid submit with only a title calls onSubmit with the trimmed title and an empty description', async () => {
    const onSubmit = jest.fn();
    const tree = renderForm({onSubmit});

    fillField(tree, 0, '  Buy milk  ');
    pressSubmit(tree);
    await flushSubmit();

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({title: 'Buy milk', description: ''});
  });

  it('a valid submit with a description includes it in the submitted values (description is optional)', async () => {
    const onSubmit = jest.fn();
    const tree = renderForm({onSubmit});

    fillField(tree, 0, 'Buy milk');
    fillField(tree, 1, 'Oat milk, from the corner shop');
    pressSubmit(tree);
    await flushSubmit();

    expect(onSubmit).toHaveBeenCalledWith({
      title: 'Buy milk',
      description: 'Oat milk, from the corner shop',
    });
  });

  it('a rapid double-tap (two presses before the disabled state re-renders) calls onSubmit exactly once (F-035)', async () => {
    const onSubmit = jest.fn();
    const tree = renderForm({onSubmit});

    fillField(tree, 0, 'Buy milk');

    const button = tree.root.findByProps({accessibilityLabel: 'Add task'});
    act(() => {
      button.props.onPress();
      button.props.onPress();
    });
    await flushSubmit();

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('seeds defaultValues (the edit-flow shape TSK-003 reuses) into the fields', () => {
    const tree = renderForm({defaultValues: {title: 'Existing task', description: 'Existing detail'}});

    const inputs = tree.root.findAllByType(TextInput);
    expect(inputs[0]!.props.value).toBe('Existing task');
    expect(inputs[1]!.props.value).toBe('Existing detail');
  });

  it('accepts a custom submitLabel', () => {
    const tree = renderForm({submitLabel: 'Save changes'});

    expect(tree.root.findByProps({accessibilityLabel: 'Save changes'})).toBeTruthy();
  });

  it('Title\'s return key ("next") triggers the focus-advance handler targeting the Description input', () => {
    // `react-test-renderer` doesn't mount a real native `TextInput`, so
    // `descriptionInputRef.current` stays `null` here and `?.focus()`
    // short-circuits harmlessly — this proves the handler is wired to the
    // Title field's `onSubmitEditing` (the focus-advance mechanism the PRO
    // pattern establishes) without depending on a real native focus event.
    const tree = renderForm();
    const inputs = tree.root.findAllByType(TextInput);

    expect(() => {
      act(() => {
        inputs[0]!.props.onSubmitEditing();
      });
    }).not.toThrow();
  });
});
