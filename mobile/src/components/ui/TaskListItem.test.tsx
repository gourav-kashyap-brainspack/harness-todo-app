import React from 'react';
import {afterEach, describe, expect, it, jest} from '@jest/globals';
import {act, create as createRenderer, type ReactTestRenderer} from 'react-test-renderer';

import {useThemeStore} from '@/core/store/themeStore';
import type {Task} from '@/core/types/task';

import {TaskListItem, type TaskListItemProps} from './TaskListItem';

const initialThemeState = useThemeStore.getState();

// Noon UTC (not midnight) so `date-fns`'s local-time `format()` renders the
// same calendar day ("Jul 15") regardless of which timezone this suite runs
// in — any real-world UTC offset from -11:00 to +13:00 keeps noon UTC on
// the same date, so this stays deterministic across a developer machine
// (e.g. IST, UTC+5:30) and CI (typically UTC) alike.
const TASK: Task = {
  id: '11edc52b-2918-4d71-9058-f7285e29d894',
  title: 'Buy milk',
  status: 'active',
  dueDate: '2026-07-15T12:00:00.000Z',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const TASK_WITHOUT_DUE_DATE: Task = {...TASK, dueDate: undefined};
const COMPLETED_TASK: Task = {...TASK, status: 'completed'};

const ROW_LABEL_ACTIVE = 'Buy milk, active, due Jul 15';
const ROW_LABEL_COMPLETED = 'Buy milk, completed, due Jul 15';
const TOGGLE_LABEL_UNCHECKED = 'Mark "Buy milk" as complete';
const TOGGLE_LABEL_CHECKED = 'Mark "Buy milk" as active';

// Tracked + unmounted in `afterEach` — an un-unmounted tree from a prior
// test stays subscribed to `useThemeStore`, so the dark/light-mode tests
// below (which call `useThemeStore.setState`) would otherwise re-render a
// leftover tree outside `act()` (same leak `ProfileScreen.test.tsx` guards
// against).
let activeTree: ReactTestRenderer | undefined;

function renderItem(props: TaskListItemProps): ReactTestRenderer {
  act(() => {
    activeTree = createRenderer(<TaskListItem {...props} />);
  });
  return activeTree!;
}

describe('TaskListItem (TSK-001, F-008/FR5)', () => {
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

  it('renders the title', () => {
    const tree = renderItem({task: TASK, onPress: jest.fn()});

    expect(tree.root.findByProps({children: 'Buy milk'})).toBeTruthy();
  });

  it('renders the due-date caption (Feather calendar + date-fns format) when dueDate is set', () => {
    const tree = renderItem({task: TASK, onPress: jest.fn()});

    expect(tree.root.findByProps({children: 'Jul 15'})).toBeTruthy();
    expect(tree.root.findByProps({name: 'calendar'})).toBeTruthy();
  });

  it('renders no due-date caption when dueDate is absent', () => {
    const tree = renderItem({task: TASK_WITHOUT_DUE_DATE, onPress: jest.fn()});

    expect(() => tree.root.findByProps({children: 'Jul 15'})).toThrow();
    expect(() => tree.root.findByProps({name: 'calendar'})).toThrow();
  });

  it('an active task title is not struck through, and the toggle is unchecked', () => {
    const tree = renderItem({task: TASK, onPress: jest.fn()});

    const title = tree.root.findByProps({children: 'Buy milk'});
    expect(title.props.className).not.toContain('line-through');
    expect(title.props.className).toContain('text-text');

    // Queried by `accessibilityLabel` (unique, not `accessibilityRole`) —
    // NativeWind's cssInterop forwards `accessibilityRole` onto both a
    // wrapper and the underlying host node for `Pressable`, so a bare
    // `findByProps({accessibilityRole: ...})` can match more than one node
    // (see ActionSheet.test.tsx's `findMenuItems` comment for the same
    // quirk); `accessibilityLabel` isn't duplicated, so it's a safe
    // singular lookup here — same convention `ProfileScreen.test.tsx` uses.
    const toggle = tree.root.findByProps({accessibilityLabel: TOGGLE_LABEL_UNCHECKED});
    expect(toggle.props.accessibilityRole).toBe('checkbox');
    expect(toggle.props.accessibilityState).toEqual({checked: false});
  });

  it('a completed task title is muted + struck through, and the toggle is checked — never color-alone', () => {
    const tree = renderItem({task: COMPLETED_TASK, onPress: jest.fn()});

    const title = tree.root.findByProps({children: 'Buy milk'});
    expect(title.props.className).toContain('line-through');
    expect(title.props.className).toContain('text-text-muted');

    const toggle = tree.root.findByProps({accessibilityLabel: TOGGLE_LABEL_CHECKED});
    expect(toggle.props.accessibilityRole).toBe('checkbox');
    expect(toggle.props.accessibilityState).toEqual({checked: true});
    // The check glyph is the third signal alongside strikethrough + muted —
    // completed state is never conveyed by color alone (anti-pattern #3).
    expect(tree.root.findByProps({name: 'check'})).toBeTruthy();
  });

  it('pressing the row calls onPress with the task', () => {
    const onPress = jest.fn();
    const tree = renderItem({task: TASK, onPress});

    const row = tree.root.findByProps({accessibilityLabel: ROW_LABEL_ACTIVE});
    expect(row.props.accessibilityRole).toBe('button');

    act(() => {
      row.props.onPress();
    });

    expect(onPress).toHaveBeenCalledWith(TASK);
  });

  it('the whole-row accessibility label includes the title, status, and the humanized due date', () => {
    const tree = renderItem({task: COMPLETED_TASK, onPress: jest.fn()});

    expect(tree.root.findByProps({accessibilityLabel: ROW_LABEL_COMPLETED})).toBeTruthy();
  });

  it('pressing the toggle calls onToggleComplete with the task id when provided', () => {
    const onToggleComplete = jest.fn();
    const tree = renderItem({task: TASK, onPress: jest.fn(), onToggleComplete});

    const toggle = tree.root.findByProps({accessibilityLabel: TOGGLE_LABEL_UNCHECKED});
    act(() => {
      toggle.props.onPress();
    });

    expect(onToggleComplete).toHaveBeenCalledWith(TASK.id);
  });

  it('pressing the toggle is a harmless no-op when onToggleComplete is omitted (TSK-001 renders the control; TSK-004 wires the mutation)', () => {
    const tree = renderItem({task: TASK, onPress: jest.fn()});

    const toggle = tree.root.findByProps({accessibilityLabel: TOGGLE_LABEL_UNCHECKED});
    expect(() => {
      act(() => {
        toggle.props.onPress();
      });
    }).not.toThrow();
  });

  it('has >=48dp of tappable toggle area via hitSlop around the 24dp visual circle', () => {
    const tree = renderItem({task: TASK, onPress: jest.fn()});

    const toggle = tree.root.findByProps({accessibilityLabel: TOGGLE_LABEL_UNCHECKED});
    expect(toggle.props.hitSlop).toEqual({top: 12, right: 12, bottom: 12, left: 12});
  });

  it('light mode applies a subtle card lift (elevation/shadow) per anti-pattern #5', () => {
    act(() => {
      useThemeStore.setState({resolvedScheme: 'light'});
    });
    const tree = renderItem({task: TASK, onPress: jest.fn()});

    const row = tree.root.findByProps({accessibilityLabel: ROW_LABEL_ACTIVE});
    expect(row.props.style).toMatchObject({shadowOpacity: 0.08, elevation: 2});
  });

  it('dark mode renders no shadow at all — elevation comes from the bg<surface<card ramp, never a shadow', () => {
    act(() => {
      useThemeStore.setState({resolvedScheme: 'dark'});
    });
    const tree = renderItem({task: TASK, onPress: jest.fn()});

    const row = tree.root.findByProps({accessibilityLabel: ROW_LABEL_ACTIVE});
    expect(row.props.style).toEqual({shadowOpacity: 0, elevation: 0});
  });
});
