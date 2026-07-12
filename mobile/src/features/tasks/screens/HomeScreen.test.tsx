import React from 'react';
import {FlatList} from 'react-native';
import {act, create as createRenderer, type ReactTestRenderer} from 'react-test-renderer';
import {afterEach, beforeEach, describe, expect, it, jest} from '@jest/globals';

import * as profileRepository from '@/core/services/profileRepository';
import {useThemeStore} from '@/core/store/themeStore';
import type {Task} from '@/core/types/task';

import {useTaskStore} from '../store/taskStore';
import {HomeScreen} from './HomeScreen';

// Same seam ProfileScreen.test.tsx mocks — the repository is the only
// persistence path this screen is allowed to read the greeting name from
// (see HomeScreen's own doc comment on the cross-feature boundary note).
jest.mock('@/core/services/profileRepository', () => ({
  getProfile: jest.fn(() => null),
  saveProfile: jest.fn(),
  clearProfile: jest.fn(),
}));

// The tasks store hydrates from this at module-import time — mocked so the
// test never touches `react-native-mmkv`; individual tests seed
// `useTaskStore`'s in-memory state directly instead (same shape
// `ProfileScreen.test.tsx` uses for `useProfileStore`).
jest.mock('@/core/services/taskRepository', () => ({
  getTasks: jest.fn(() => []),
  removeTask: jest.fn(),
  upsertTask: jest.fn(),
}));

const mockedGetProfile = jest.mocked(profileRepository.getProfile);

const mockNavigate = jest.fn();
// The real `useFocusEffect` (`@react-navigation/core/src/useFocusEffect.tsx`)
// calls the library's OWN internal `useNavigation()` directly (a relative
// import inside the package, not routed back through this mocked barrel),
// so it throws "Couldn't find a navigation object" without a real
// `NavigationContainer` ancestor. Mocked here to behave like a plain
// `useEffect(callback, [])` instead — fires once on mount/re-render (a
// stand-in for "on focus") — and stashes the latest registered callback in
// `mockFocusEffectCallback` (module-scope, `mock`-prefixed so Jest's
// hoisting allows referencing it inside this factory) so a test can
// simulate a SECOND focus event by invoking it again directly.
let mockFocusEffectCallback: (() => void) | undefined;
jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native') as object;
  const ReactModule = require('react') as typeof import('react');
  return {
    ...actual,
    useNavigation: () => ({navigate: mockNavigate}),
    useFocusEffect: (callback: () => void) => {
      mockFocusEffectCallback = callback;
      ReactModule.useEffect(callback, [callback]);
    },
  };
});

const TASK: Task = {
  id: '11edc52b-2918-4d71-9058-f7285e29d894',
  title: 'Buy milk',
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const OTHER_TASK: Task = {
  ...TASK,
  id: '22edc52b-2918-4d71-9058-f7285e29d894',
  title: 'Walk the dog',
};

// Captured once at module load — the store's real, unmocked action
// functions — so a test that overrides one (e.g. `refresh` below) can be
// restored to the real implementation for every other test.
const initialTaskState = useTaskStore.getState();
const initialThemeState = useThemeStore.getState();

let activeTree: ReactTestRenderer | undefined;

function renderScreen(): ReactTestRenderer {
  act(() => {
    activeTree = createRenderer(<HomeScreen />);
  });
  return activeTree!;
}

describe('HomeScreen (TSK-001, FR2/FR3/FR4)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useTaskStore.setState(initialTaskState, true);
  });

  afterEach(() => {
    if (activeTree) {
      act(() => {
        activeTree!.unmount();
      });
      activeTree = undefined;
    }
    act(() => {
      useThemeStore.setState(initialThemeState);
    });
  });

  it('shows the EmptyState when the store has no tasks (FR2)', () => {
    const tree = renderScreen();

    expect(tree.root.findByProps({children: 'No tasks yet'})).toBeTruthy();
  });

  it('renders a row per task from the single tasks store, and hides the empty state', () => {
    useTaskStore.setState({tasks: [TASK]});
    const tree = renderScreen();

    expect(tree.root.findByProps({children: 'Buy milk'})).toBeTruthy();
    expect(() => tree.root.findByProps({children: 'No tasks yet'})).toThrow();
  });

  it('the greeting shows the profile name when one is persisted', () => {
    // `mockReturnValue` (not `...Once`) — `getProfile()` is read twice on
    // mount: once by the `useState` lazy initializer, once by
    // `useFocusEffect`'s effect (mocked to fire on mount too, see the
    // `@react-navigation/native` mock above) — both calls must see the
    // same seeded profile.
    mockedGetProfile.mockReturnValue({name: 'Ada Lovelace', email: 'ada@example.com'});
    const tree = renderScreen();

    expect(tree.root.findByProps({children: 'Hi, Ada Lovelace'})).toBeTruthy();
  });

  it('the greeting falls back to "Hi there" when no profile is persisted', () => {
    mockedGetProfile.mockReturnValue(null);
    const tree = renderScreen();

    expect(tree.root.findByProps({children: 'Hi there'})).toBeTruthy();
  });

  it('re-reads the profile name on screen focus, so an edit made on the Profile tab shows up without a remount', () => {
    mockedGetProfile.mockReturnValue({name: 'Ada Lovelace', email: 'ada@example.com'});
    const tree = renderScreen();
    expect(tree.root.findByProps({children: 'Hi, Ada Lovelace'})).toBeTruthy();

    // Home stays mounted in the bottom-tabs — simulate coming BACK to this
    // tab after editing the name elsewhere by re-firing the same focus
    // callback `useFocusEffect` registered, rather than remounting.
    mockedGetProfile.mockReturnValue({name: 'Ada Byron', email: 'ada@example.com'});
    act(() => {
      mockFocusEffectCallback?.();
    });

    expect(tree.root.findByProps({children: 'Hi, Ada Byron'})).toBeTruthy();
    expect(() => tree.root.findByProps({children: 'Hi, Ada Lovelace'})).toThrow();
  });

  it('the FAB is labeled for a11y/Maestro and navigates to AddTask', () => {
    const tree = renderScreen();

    const fab = tree.root.findByProps({accessibilityLabel: 'Add task'});
    expect(fab.props.accessibilityRole).toBe('button');

    act(() => {
      fab.props.onPress();
    });
    expect(mockNavigate).toHaveBeenCalledWith('AddTask');
  });

  it('pressing a row navigates to TaskDetail with the task id (typed nav)', () => {
    useTaskStore.setState({tasks: [TASK]});
    const tree = renderScreen();

    // TASK has no dueDate, so TaskListItem's whole-row label is just
    // "<title>, <status>" — see TaskListItem.test.tsx for the full label
    // format (with a due date appended when set).
    const row = tree.root.findByProps({accessibilityLabel: 'Buy milk, active'});
    act(() => {
      row.props.onPress();
    });

    expect(mockNavigate).toHaveBeenCalledWith('TaskDetail', {taskId: TASK.id});
  });

  it('pull-to-refresh calls the store\'s refresh() action directly (F-042) — no isRefreshing state involved', () => {
    const mockedRefresh = jest.fn();
    useTaskStore.setState({refresh: mockedRefresh});
    const tree = renderScreen();

    const list = tree.root.findByType(FlatList);
    // `refresh()` is a synchronous local re-hydrate, so `onRefresh` is the
    // store's `refresh` reference directly — no wrapping `handleRefresh`/
    // `isRefreshing` flip. Calling it needs no `act()` since it triggers no
    // React state update in HomeScreen itself.
    list.props.refreshControl.props.onRefresh();

    expect(mockedRefresh).toHaveBeenCalledTimes(1);
  });

  it('the RefreshControl is always refreshing={false} — the native pull gesture animates the spinner, no local isRefreshing state', () => {
    const tree = renderScreen();

    const list = tree.root.findByType(FlatList);
    expect(list.props.refreshControl.props.refreshing).toBe(false);
  });

  it('the pull-to-refresh spinner is themed with the primary tint, not the platform default blue', () => {
    const tree = renderScreen();

    const list = tree.root.findByType(FlatList);
    const {tintColor, colors} = list.props.refreshControl.props;

    expect(tintColor).toBe('rgb(11, 110, 127)');
    expect(colors).toEqual(['rgb(11, 110, 127)']);
  });

  it('the list is keyed and rendered as a virtualized FlatList (FR4)', () => {
    useTaskStore.setState({tasks: [TASK]});
    const tree = renderScreen();

    const list = tree.root.findByType(FlatList);
    expect(list.props.data).toEqual([TASK]);
    expect(list.props.keyExtractor(TASK)).toBe(TASK.id);
  });

  it('renders a row for every task and a separator between them (the step-5 20dp inter-card gap)', () => {
    useTaskStore.setState({tasks: [TASK, OTHER_TASK]});
    const tree = renderScreen();

    expect(tree.root.findByProps({children: 'Buy milk'})).toBeTruthy();
    expect(tree.root.findByProps({children: 'Walk the dog'})).toBeTruthy();

    // `ItemSeparatorComponent` is a stable module-scope function (FR4) —
    // called directly (not through the renderer) to check the step-5 (20dp)
    // gap className it returns, without depending on NativeWind's runtime
    // className->style transform.
    const list = tree.root.findByType(FlatList);
    const Separator = list.props.ItemSeparatorComponent;
    expect(Separator({}).props.className).toBe('h-5');
  });

  it('the FAB has a light-mode lift and no shadow at all in dark mode (design-system.md anti-pattern #5)', () => {
    act(() => {
      useThemeStore.setState({resolvedScheme: 'light'});
    });
    const lightTree = renderScreen();
    const lightFab = lightTree.root.findByProps({accessibilityLabel: 'Add task'});
    expect(lightFab.props.style).toMatchObject({shadowOpacity: 0.15, elevation: 4});

    act(() => {
      lightTree.unmount();
    });
    activeTree = undefined;

    act(() => {
      useThemeStore.setState({resolvedScheme: 'dark'});
    });
    const darkTree = renderScreen();
    const darkFab = darkTree.root.findByProps({accessibilityLabel: 'Add task'});
    expect(darkFab.props.style).toEqual({shadowOpacity: 0, elevation: 0});
  });
});
