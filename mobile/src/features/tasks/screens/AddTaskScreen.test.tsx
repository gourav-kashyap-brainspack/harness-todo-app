import React from 'react';
import {Text, TextInput} from 'react-native';
import {act, create as createRenderer, type ReactTestRenderer} from 'react-test-renderer';
import {beforeEach, describe, expect, it, jest} from '@jest/globals';

import * as taskRepository from '@/core/services/taskRepository';

import {useTaskStore} from '../store/taskStore';
import {AddTaskScreen} from './AddTaskScreen';

// The store's `addTask` runs for real in this test (it's the boundary being
// proven, per the TSK-002 test plan's "new-task shape via the store"
// requirement) — only the underlying persistence seam is mocked, the same
// shape `HomeScreen.test.tsx`/`taskStore.test.ts` already use.
jest.mock('@/core/services/taskRepository', () => ({
  getTasks: jest.fn(() => []),
  removeTask: jest.fn(),
  upsertTask: jest.fn(),
}));

const mockedUpsertTask = jest.mocked(taskRepository.upsertTask);

const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native') as object;
  return {
    ...actual,
    useNavigation: () => ({goBack: mockGoBack}),
  };
});

const initialTaskState = useTaskStore.getState();

function fillField(tree: ReactTestRenderer, index: 0 | 1, value: string): void {
  const input = tree.root.findAllByType(TextInput)[index];
  act(() => {
    input.props.onChangeText(value);
  });
  act(() => {
    input.props.onBlur({} as never);
  });
}

function pressSubmit(tree: ReactTestRenderer): void {
  const button = tree.root.findByProps({accessibilityLabel: 'Add task'});
  act(() => {
    button.props.onPress();
  });
}

async function flushSubmit(): Promise<void> {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
  });
}

function renderScreen(): ReactTestRenderer {
  let tree!: ReactTestRenderer;
  act(() => {
    tree = createRenderer(<AddTaskScreen />);
  });
  return tree;
}

describe('AddTaskScreen (TSK-002, FR2/FR3/FR4/FR5)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useTaskStore.setState(initialTaskState, true);
  });

  it('empty submit shows the title error and never calls addTask (FR3, boundary validation / gap f)', async () => {
    const tree = renderScreen();

    pressSubmit(tree);
    await flushSubmit();

    expect(tree.root.findByProps({accessibilityLabel: 'Title, title is required'})).toBeTruthy();
    expect(mockedUpsertTask).not.toHaveBeenCalled();
    expect(mockGoBack).not.toHaveBeenCalled();
  });

  it('a valid submit creates the task via the store and navigates back to Home (FR2)', async () => {
    mockedUpsertTask.mockReturnValueOnce([]);
    const tree = renderScreen();

    fillField(tree, 0, 'Buy milk');
    pressSubmit(tree);
    await flushSubmit();

    expect(mockedUpsertTask).toHaveBeenCalledTimes(1);
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it('the new-task shape: trimmed title, status defaults to active, no id/timestamps set by the form (FR5)', async () => {
    mockedUpsertTask.mockReturnValueOnce([]);
    const tree = renderScreen();

    fillField(tree, 0, '  Buy milk  ');
    pressSubmit(tree);
    await flushSubmit();

    expect(mockedUpsertTask).toHaveBeenCalledWith({title: 'Buy milk', description: '', status: 'active'});
  });

  it('description, when filled in, is passed through to addTask', async () => {
    mockedUpsertTask.mockReturnValueOnce([]);
    const tree = renderScreen();

    fillField(tree, 0, 'Buy milk');
    fillField(tree, 1, 'Oat milk');
    pressSubmit(tree);
    await flushSubmit();

    expect(mockedUpsertTask).toHaveBeenCalledWith({
      title: 'Buy milk',
      description: 'Oat milk',
      status: 'active',
    });
  });

  it('a rapid double-tap creates exactly ONE task (F-035)', async () => {
    mockedUpsertTask.mockReturnValueOnce([]);
    const tree = renderScreen();

    fillField(tree, 0, 'Buy milk');

    const button = tree.root.findByProps({accessibilityLabel: 'Add task'});
    act(() => {
      button.props.onPress();
      button.props.onPress();
    });
    await flushSubmit();

    expect(mockedUpsertTask).toHaveBeenCalledTimes(1);
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it('the submit button starts enabled/idle (loading/disabled only flips once RHF submission starts)', () => {
    const tree = renderScreen();

    const button = tree.root.findByProps({accessibilityLabel: 'Add task'});
    expect(button.props.accessibilityState).toEqual({disabled: false, busy: false});
  });

  it('has no other error announced besides the title requirement (description stays optional)', async () => {
    const tree = renderScreen();

    pressSubmit(tree);
    await flushSubmit();

    expect(
      tree.root.findAllByType(Text).filter(node => node.props.accessibilityLiveRegion === 'polite'),
    ).toHaveLength(1);
  });
});
