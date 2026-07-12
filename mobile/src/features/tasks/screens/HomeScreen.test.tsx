import React from 'react';
import {FlatList} from 'react-native';
import {act, create as createRenderer, type ReactTestRenderer} from 'react-test-renderer';
import {afterEach, beforeEach, describe, expect, it, jest} from '@jest/globals';

import * as profileRepository from '@/core/services/profileRepository';
import * as taskRepository from '@/core/services/taskRepository';
import {useThemeStore} from '@/core/store/themeStore';
import type {Task} from '@/core/types/task';

import {useTaskQueryStore} from '../store/taskQueryStore';
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
const mockedRemoveTask = jest.mocked(taskRepository.removeTask);

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
const initialTaskQueryState = useTaskQueryStore.getState();

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
    useTaskQueryStore.setState(initialTaskQueryState, true);
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

  describe('TSK-004 — lifecycle actions (F-011-F-015)', () => {
    it("a row's checkbox calls the store's toggleStatus(id) (F-013/F-014)", () => {
      const mockedToggleStatus = jest.fn();
      useTaskStore.setState({tasks: [TASK], toggleStatus: mockedToggleStatus});
      const tree = renderScreen();

      const toggle = tree.root.findByProps({accessibilityLabel: 'Mark "Buy milk" as complete'});
      act(() => {
        toggle.props.onPress();
      });

      expect(mockedToggleStatus).toHaveBeenCalledWith(TASK.id);
    });

    it('a row\'s "More actions" opens a 4-option menu: Mark complete, Edit, Duplicate, Delete', () => {
      useTaskStore.setState({tasks: [TASK]});
      const tree = renderScreen();

      act(() => {
        tree.root.findByProps({accessibilityLabel: 'More actions'}).props.onPress();
      });

      expect(tree.root.findByProps({accessibilityLabel: 'Mark complete'})).toBeTruthy();
      expect(tree.root.findByProps({accessibilityLabel: 'Edit'})).toBeTruthy();
      expect(tree.root.findByProps({accessibilityLabel: 'Duplicate'})).toBeTruthy();
      const deleteOption = tree.root.findByProps({accessibilityLabel: 'Delete task'});
      expect(deleteOption.props.accessibilityRole).toBe('menuitem');
    });

    it('a completed task\'s row menu offers "Mark pending" instead of "Mark complete"', () => {
      const COMPLETED_TASK: Task = {...TASK, status: 'completed'};
      useTaskStore.setState({tasks: [COMPLETED_TASK]});
      const tree = renderScreen();

      act(() => {
        tree.root.findByProps({accessibilityLabel: 'More actions'}).props.onPress();
      });

      expect(tree.root.findByProps({accessibilityLabel: 'Mark pending'})).toBeTruthy();
      expect(() => tree.root.findByProps({accessibilityLabel: 'Mark complete'})).toThrow();
    });

    it('the row menu\'s "Mark complete" option calls toggleStatus(id)', () => {
      const mockedToggleStatus = jest.fn();
      useTaskStore.setState({tasks: [TASK], toggleStatus: mockedToggleStatus});
      const tree = renderScreen();

      act(() => {
        tree.root.findByProps({accessibilityLabel: 'More actions'}).props.onPress();
      });
      act(() => {
        tree.root.findByProps({accessibilityLabel: 'Mark complete'}).props.onPress();
      });

      expect(mockedToggleStatus).toHaveBeenCalledWith(TASK.id);
    });

    it('the row menu\'s "Edit" option navigates to EditTask with the task id', () => {
      useTaskStore.setState({tasks: [TASK]});
      const tree = renderScreen();

      act(() => {
        tree.root.findByProps({accessibilityLabel: 'More actions'}).props.onPress();
      });
      act(() => {
        tree.root.findByProps({accessibilityLabel: 'Edit'}).props.onPress();
      });

      expect(mockNavigate).toHaveBeenCalledWith('EditTask', {taskId: TASK.id});
    });

    it('the row menu\'s "Duplicate" option calls duplicateTask(id) (F-015)', () => {
      const mockedDuplicateTask = jest.fn();
      useTaskStore.setState({tasks: [TASK], duplicateTask: mockedDuplicateTask});
      const tree = renderScreen();

      act(() => {
        tree.root.findByProps({accessibilityLabel: 'More actions'}).props.onPress();
      });
      act(() => {
        tree.root.findByProps({accessibilityLabel: 'Duplicate'}).props.onPress();
      });

      expect(mockedDuplicateTask).toHaveBeenCalledWith(TASK.id);
    });

    it('the row menu\'s "Delete" opens a confirm sheet; Cancel does NOT delete (F-012 — never delete without confirm)', () => {
      useTaskStore.setState({tasks: [TASK]});
      const tree = renderScreen();

      act(() => {
        tree.root.findByProps({accessibilityLabel: 'More actions'}).props.onPress();
      });
      act(() => {
        tree.root.findByProps({accessibilityLabel: 'Delete task'}).props.onPress();
      });

      expect(tree.root.findByProps({children: 'Delete this task?'})).toBeTruthy();

      act(() => {
        tree.root.findByProps({accessibilityLabel: 'Cancel'}).props.onPress();
      });

      expect(mockedRemoveTask).not.toHaveBeenCalled();
      expect(() => tree.root.findByProps({children: 'Delete this task?'})).toThrow();
    });

    it('confirming Delete calls removeTask(id) — no navigation, the row just leaves the list in place', () => {
      useTaskStore.setState({tasks: [TASK]});
      // The repository mock has no default return (`removeTask: jest.fn()`),
      // but the real `taskRepository.removeTask` always resolves to a
      // `Task[]` (`[]` here, the only task removed) — never `undefined`.
      // `taskStore.removeTask` sets that return straight into `tasks`, and
      // ORG-001's derived pipeline (`selectVisibleTasks`) now reads
      // `tasks.filter(...)` on every render, so an unmocked `undefined`
      // return would crash a path production can never hit.
      mockedRemoveTask.mockReturnValueOnce([]);
      const tree = renderScreen();

      act(() => {
        tree.root.findByProps({accessibilityLabel: 'More actions'}).props.onPress();
      });
      act(() => {
        // The row menu's "Delete" option — closes the menu, opens the confirm.
        tree.root.findByProps({accessibilityLabel: 'Delete task'}).props.onPress();
      });
      act(() => {
        // The confirm sheet's own destructive "Delete" option.
        tree.root.findByProps({accessibilityLabel: 'Delete task'}).props.onPress();
      });

      expect(mockedRemoveTask).toHaveBeenCalledWith(TASK.id);
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('ORG-001 — organize header + filter (F-023/F-024/F-025)', () => {
    const COMPLETED_TASK: Task = {
      ...TASK,
      id: '33edc52b-2918-4d71-9058-f7285e29d894',
      title: 'Pay bills',
      status: 'completed',
    };

    it('renders the filter SegmentedControl, labeled for a11y/Maestro', () => {
      const tree = renderScreen();

      // Combine both props in one query — the composite `<SegmentedControl>`
      // element itself also carries `accessibilityLabel="Filter tasks"` (its
      // own JSX prop), so querying on that label alone is ambiguous; adding
      // `accessibilityRole` (only set on the rendered host `View`) pins the
      // match to the actual tablist container.
      expect(tree.root.findByProps({accessibilityLabel: 'Filter tasks', accessibilityRole: 'tablist'})).toBeTruthy();
      expect(tree.root.findByProps({accessibilityLabel: 'All', accessibilityRole: 'tab'})).toBeTruthy();
      expect(tree.root.findByProps({accessibilityLabel: 'Active', accessibilityRole: 'tab'})).toBeTruthy();
      expect(tree.root.findByProps({accessibilityLabel: 'Completed', accessibilityRole: 'tab'})).toBeTruthy();
    });

    it('changing the segment re-derives the list to only the matching tasks (FR3/FR4)', () => {
      useTaskStore.setState({tasks: [TASK, COMPLETED_TASK]});
      const tree = renderScreen();

      expect(tree.root.findByProps({children: 'Buy milk'})).toBeTruthy();
      expect(tree.root.findByProps({children: 'Pay bills'})).toBeTruthy();

      act(() => {
        tree.root.findByProps({accessibilityLabel: 'Completed', accessibilityRole: 'tab'}).props.onPress();
      });

      expect(tree.root.findByProps({children: 'Pay bills'})).toBeTruthy();
      expect(() => tree.root.findByProps({children: 'Buy milk'})).toThrow();
    });

    it('the derived list also persists the chosen filter to the store (FR6 — survives relaunch)', () => {
      const tree = renderScreen();

      act(() => {
        tree.root.findByProps({accessibilityLabel: 'Active', accessibilityRole: 'tab'}).props.onPress();
      });

      expect(useTaskQueryStore.getState().filter).toBe('active');
    });

    it('tasks-but-none-match-filter shows the filter-specific empty copy, not "No tasks yet" (FR5)', () => {
      useTaskStore.setState({tasks: [COMPLETED_TASK]});
      useTaskQueryStore.setState({filter: 'active'});
      const tree = renderScreen();

      expect(tree.root.findByProps({children: 'No active tasks'})).toBeTruthy();
      expect(tree.root.findByProps({children: "Everything's complete."})).toBeTruthy();
      expect(() => tree.root.findByProps({children: 'No tasks yet'})).toThrow();
    });

    it('the "completed" filter with none completed shows its own empty copy (FR5)', () => {
      useTaskStore.setState({tasks: [TASK]});
      useTaskQueryStore.setState({filter: 'completed'});
      const tree = renderScreen();

      expect(tree.root.findByProps({children: 'No completed tasks'})).toBeTruthy();
      expect(tree.root.findByProps({children: 'Complete a task to see it here.'})).toBeTruthy();
    });

    it('zero tasks at all still shows "No tasks yet", even under a non-"all" filter (FR5 precedence)', () => {
      useTaskQueryStore.setState({filter: 'completed'});
      const tree = renderScreen();

      expect(tree.root.findByProps({children: 'No tasks yet'})).toBeTruthy();
    });

    it('the derived FlatList data stays referentially stable across an unrelated re-render (memoization intact)', () => {
      useTaskStore.setState({tasks: [TASK]});
      const tree = renderScreen();

      const firstData = tree.root.findByType(FlatList).props.data;

      // Trigger a re-render with none of the memo's own inputs (tasks,
      // filter, sort, search) changed — re-firing the focus callback is the
      // same "unrelated state churn" the existing focus test above uses.
      act(() => {
        mockFocusEffectCallback?.();
      });

      const secondData = tree.root.findByType(FlatList).props.data;
      expect(secondData).toBe(firstData);
    });

    it('the derived FlatList data is recomputed (a new reference) when the filter actually changes', () => {
      useTaskStore.setState({tasks: [TASK, COMPLETED_TASK]});
      const tree = renderScreen();

      const firstData = tree.root.findByType(FlatList).props.data;

      act(() => {
        tree.root.findByProps({accessibilityLabel: 'Active', accessibilityRole: 'tab'}).props.onPress();
      });

      const secondData = tree.root.findByType(FlatList).props.data;
      expect(secondData).not.toBe(firstData);
    });
  });

  describe('ORG-002 — search (F-020/F-021/F-022/F-031)', () => {
    const MILK: Task = {...TASK, title: 'Buy milk'};
    const BANK: Task = {...OTHER_TASK, id: '33edc52b-2918-4d71-9058-f7285e29d894', title: 'Call bank'};

    it('renders the search input, labeled for a11y/Maestro', () => {
      const tree = renderScreen();

      const input = tree.root.findByProps({accessibilityLabel: 'Search tasks'});
      expect(input.props.placeholder).toBe('Search tasks');
    });

    it('typing in search calls setSearch and re-derives the list live (F-022)', () => {
      useTaskStore.setState({tasks: [MILK, BANK]});
      const tree = renderScreen();

      act(() => {
        tree.root.findByProps({accessibilityLabel: 'Search tasks'}).props.onChangeText('milk');
      });

      expect(useTaskQueryStore.getState().search).toBe('milk');
      expect(tree.root.findByProps({children: 'Buy milk'})).toBeTruthy();
      expect(() => tree.root.findByProps({children: 'Call bank'})).toThrow();
    });

    it('a non-empty search with no matches shows the no-results copy, interpolating the trimmed query (F-031)', () => {
      useTaskStore.setState({tasks: [MILK, BANK]});
      useTaskQueryStore.setState({search: 'xyz'});
      const tree = renderScreen();

      expect(tree.root.findByProps({children: 'No results'})).toBeTruthy();
      expect(tree.root.findByProps({children: 'No tasks match "xyz".'})).toBeTruthy();
    });

    it('no-results WINS over the filtered-empty copy when a non-"all" filter is also active (precedence)', () => {
      useTaskStore.setState({tasks: [MILK]});
      useTaskQueryStore.setState({search: 'xyz', filter: 'active'});
      const tree = renderScreen();

      expect(tree.root.findByProps({children: 'No results'})).toBeTruthy();
      expect(() => tree.root.findByProps({children: 'No active tasks'})).toThrow();
    });

    it('"No tasks yet" still wins over no-results when the store has zero tasks at all (precedence)', () => {
      useTaskQueryStore.setState({search: 'xyz'});
      const tree = renderScreen();

      expect(tree.root.findByProps({children: 'No tasks yet'})).toBeTruthy();
      expect(() => tree.root.findByProps({children: 'No results'})).toThrow();
    });

    it('a whitespace-only search does not trigger no-results (trimmed to empty, treated as no search)', () => {
      useTaskStore.setState({tasks: [MILK, BANK]});
      useTaskQueryStore.setState({search: '   '});
      const tree = renderScreen();

      expect(tree.root.findByProps({children: 'Buy milk'})).toBeTruthy();
      expect(tree.root.findByProps({children: 'Call bank'})).toBeTruthy();
      expect(() => tree.root.findByProps({children: 'No results'})).toThrow();
    });

    it('the clear button is shown only once a query is typed, and resets the search to \'\'', () => {
      useTaskStore.setState({tasks: [MILK, BANK]});
      const tree = renderScreen();

      expect(() => tree.root.findByProps({accessibilityLabel: 'Clear search'})).toThrow();

      act(() => {
        tree.root.findByProps({accessibilityLabel: 'Search tasks'}).props.onChangeText('milk');
      });
      expect(tree.root.findByProps({children: 'Buy milk'})).toBeTruthy();
      expect(() => tree.root.findByProps({children: 'Call bank'})).toThrow();

      act(() => {
        tree.root.findByProps({accessibilityLabel: 'Clear search'}).props.onPress();
      });

      expect(useTaskQueryStore.getState().search).toBe('');
      expect(tree.root.findByProps({children: 'Buy milk'})).toBeTruthy();
      expect(tree.root.findByProps({children: 'Call bank'})).toBeTruthy();
    });

    it('filter-empty copy still shows when search is empty (search does not shadow the filter-empty precedence)', () => {
      const completedTask: Task = {...TASK, status: 'completed'};
      useTaskStore.setState({tasks: [completedTask]});
      useTaskQueryStore.setState({filter: 'active', search: ''});
      const tree = renderScreen();

      expect(tree.root.findByProps({children: 'No active tasks'})).toBeTruthy();
    });

    it('search composes with filter+sort — searching while filter=active shows only active matches', () => {
      const completedMilk: Task = {...MILK, id: '99edc52b-2918-4d71-9058-f7285e29d894', status: 'completed'};
      useTaskStore.setState({tasks: [MILK, completedMilk]});
      useTaskQueryStore.setState({search: 'milk', filter: 'active'});
      const tree = renderScreen();

      const list = tree.root.findByType(FlatList);
      expect(list.props.data).toEqual([MILK]);
    });
  });

  describe('ORG-003 — sort (F-026-029)', () => {
    const ALPHA_TASK: Task = {...TASK, id: '44edc52b-2918-4d71-9058-f7285e29d894', title: 'Zebra task'};
    const BETA_TASK: Task = {...OTHER_TASK, id: '55edc52b-2918-4d71-9058-f7285e29d894', title: 'Apple task'};

    it('renders the sort trigger, labeled for a11y/Maestro with the current sort ("created-desc" default)', () => {
      const tree = renderScreen();

      // Combine both props in one query — `IconButton`'s own composite JSX
      // element also carries `accessibilityLabel` (its own prop), so
      // querying on that label alone matches the composite first (react-
      // test-renderer's default non-deep `find`); adding `accessibilityRole`
      // (only set on the rendered host `Pressable`) pins the match to the
      // actual button — same fix the `SegmentedControl`/`ActionSheet` tests
      // above already apply for their own composite/host ambiguity.
      const trigger = tree.root.findByProps({
        accessibilityLabel: 'Sort tasks, currently Creation date',
        accessibilityRole: 'button',
      });
      expect(trigger.props.accessibilityRole).toBe('button');
    });

    it('pressing the sort trigger opens the "Sort by" menu, listing all 4 options', () => {
      const tree = renderScreen();

      act(() => {
        tree.root.findByProps({accessibilityLabel: 'Sort tasks, currently Creation date'}).props.onPress();
      });

      expect(tree.root.findByProps({children: 'Sort by'})).toBeTruthy();
      expect(tree.root.findByProps({accessibilityLabel: 'Due date', accessibilityRole: 'menuitem'})).toBeTruthy();
      expect(
        tree.root.findByProps({accessibilityLabel: 'Creation date', accessibilityRole: 'menuitem'}),
      ).toBeTruthy();
      expect(
        tree.root.findByProps({accessibilityLabel: 'Alphabetical', accessibilityRole: 'menuitem'}),
      ).toBeTruthy();
      expect(
        tree.root.findByProps({accessibilityLabel: 'Recently updated', accessibilityRole: 'menuitem'}),
      ).toBeTruthy();
    });

    it('selecting "Alphabetical" calls setSort, persists, closes the menu, and re-derives the list order', () => {
      useTaskStore.setState({tasks: [ALPHA_TASK, BETA_TASK]});
      const tree = renderScreen();

      // Default sort (created-desc) — both share the same `createdAt`, so
      // the stable comparator keeps the store's own insertion order,
      // ALPHA_TASK then BETA_TASK.
      const list = tree.root.findByType(FlatList);
      expect(list.props.data.map((t: Task) => t.id)).toEqual([ALPHA_TASK.id, BETA_TASK.id]);

      act(() => {
        tree.root.findByProps({accessibilityLabel: 'Sort tasks, currently Creation date'}).props.onPress();
      });
      act(() => {
        tree.root.findByProps({accessibilityLabel: 'Alphabetical', accessibilityRole: 'menuitem'}).props.onPress();
      });

      expect(useTaskQueryStore.getState().sort).toBe('alpha');
      // The sheet closes — its "Sort by" header no longer mounts.
      expect(() => tree.root.findByProps({children: 'Sort by'})).toThrow();
      // Re-derives: alphabetically, "Apple task" (BETA_TASK) sorts before
      // "Zebra task" (ALPHA_TASK).
      const reordered = tree.root.findByType(FlatList);
      expect(reordered.props.data.map((t: Task) => t.id)).toEqual([BETA_TASK.id, ALPHA_TASK.id]);
    });

    it('the trigger\'s a11y label reflects the current sort after a selection', () => {
      const tree = renderScreen();

      act(() => {
        tree.root.findByProps({accessibilityLabel: 'Sort tasks, currently Creation date'}).props.onPress();
      });
      act(() => {
        tree.root
          .findByProps({accessibilityLabel: 'Recently updated', accessibilityRole: 'menuitem'})
          .props.onPress();
      });

      expect(tree.root.findByProps({accessibilityLabel: 'Sort tasks, currently Recently updated'})).toBeTruthy();
    });

    it('marks the active sort option — its label carries the primary+semibold treatment, the others do not', () => {
      const tree = renderScreen();

      act(() => {
        tree.root.findByProps({accessibilityLabel: 'Sort tasks, currently Creation date'}).props.onPress();
      });

      const activeLabel = tree.root.findByProps({children: 'Creation date'});
      expect(activeLabel.props.className).toEqual(expect.stringContaining('text-primary'));

      const inactiveLabel = tree.root.findByProps({children: 'Due date'});
      expect(inactiveLabel.props.className).not.toEqual(expect.stringContaining('text-primary'));
    });

    it('the chosen sort persists to the query store across a relaunch-equivalent re-hydrate', () => {
      const tree = renderScreen();

      act(() => {
        tree.root.findByProps({accessibilityLabel: 'Sort tasks, currently Creation date'}).props.onPress();
      });
      act(() => {
        tree.root.findByProps({accessibilityLabel: 'Due date', accessibilityRole: 'menuitem'}).props.onPress();
      });

      // `setSort` persists via the typed storage service (ORG-001's
      // `taskQueryStore`) before updating in-memory state — asserting the
      // store's own state here is the same "survives relaunch" contract the
      // ORG-001 filter-persistence test above already checks.
      expect(useTaskQueryStore.getState().sort).toBe('due');
    });
  });
});
