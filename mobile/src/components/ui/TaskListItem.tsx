import React from 'react';
import {Pressable, Text, View} from 'react-native';
import {format} from 'date-fns';
import Feather from 'react-native-vector-icons/Feather';

import type {Task} from '@/core/types/task';
import {NATIVE_CHROME_RGB, rgbFromTriplet, useTheme} from '@/theme';

export interface TaskListItemProps {
  task: Task;
  onPress: (task: Task) => void;
  /**
   * Optional — TSK-001 renders the toggle's visual state without wiring the
   * mutation; TSK-004 supplies this callback later without changing this
   * component's public shape (design-system.md -> Component inventory ->
   * `TaskListItem`).
   */
  onToggleComplete?: (taskId: string) => void;
}

const TOGGLE_HIT_SLOP = {top: 12, right: 12, bottom: 12, left: 12};
const CHECK_ICON_SIZE = 14;
const DUE_DATE_ICON_SIZE = 12;
const CHEVRON_ICON_SIZE = 18;
const DUE_DATE_FORMAT = 'MMM d';

// `primary-fg` is `255 255 255` in BOTH themes (design-system.md -> Color
// tokens) — the same literal-constant pattern `Button.ACTIVITY_INDICATOR_COLOR`
// establishes, reused here for the toggle's check glyph.
const CHECK_ICON_COLOR = rgbFromTriplet('255 255 255');

function formatDueDate(dueDate: string): string {
  return format(new Date(dueDate), DUE_DATE_FORMAT);
}

function TaskListItemComponent({task, onPress, onToggleComplete}: TaskListItemProps): React.JSX.Element {
  const {resolvedScheme} = useTheme();
  const chrome = NATIVE_CHROME_RGB[resolvedScheme];
  const isCompleted = task.status === 'completed';

  // Elevation per design-system.md -> `TaskListItem` -> Elevation: a subtle
  // 1-2dp lift in light mode only; dark mode reads via the bg<surface<card
  // lightness ramp + the hairline border, never a shadow (anti-pattern #5).
  // `shadowColor` needs a resolved RGB string — a native View style prop
  // `className` can't parametrize per-theme — so this is the same
  // native-prop escape hatch `ActivityIndicator`/`Feather` color already
  // use, not a second styling mechanism.
  const cardElevationStyle =
    resolvedScheme === 'light'
      ? {
          shadowColor: rgbFromTriplet(chrome.text),
          shadowOffset: {width: 0, height: 1},
          shadowOpacity: 0.08,
          shadowRadius: 4,
          elevation: 2,
        }
      : {shadowOpacity: 0, elevation: 0};

  const mutedIconColor = rgbFromTriplet(chrome.textMuted);
  const formattedDueDate = task.dueDate ? formatDueDate(task.dueDate) : undefined;

  // Whole-row a11y label per design-system.md -> `TaskListItem` -> "Whole-row
  // a11y" — title + status + (when set) humanized due date, all in one
  // announced string; the toggle below is a second, distinct accessible node.
  const rowAccessibilityLabel = [
    task.title,
    isCompleted ? 'completed' : 'active',
    formattedDueDate ? `due ${formattedDueDate}` : null,
  ]
    .filter(Boolean)
    .join(', ');

  function handleToggle(): void {
    onToggleComplete?.(task.id);
  }

  return (
    <Pressable
      onPress={() => onPress(task)}
      accessibilityRole="button"
      accessibilityLabel={rowAccessibilityLabel}
      style={cardElevationStyle}
      className="flex-row items-center gap-3 rounded-lg border border-border bg-card p-4">
      <Pressable
        onPress={handleToggle}
        hitSlop={TOGGLE_HIT_SLOP}
        accessibilityRole="checkbox"
        accessibilityState={{checked: isCompleted}}
        accessibilityLabel={`Mark "${task.title}" as ${isCompleted ? 'active' : 'complete'}`}
        className={`h-6 w-6 items-center justify-center rounded-full ${
          isCompleted ? 'bg-primary' : 'border-2 border-border'
        }`}>
        {isCompleted ? <Feather name="check" size={CHECK_ICON_SIZE} color={CHECK_ICON_COLOR} /> : null}
      </Pressable>

      <View className="flex-1">
        <Text
          numberOfLines={2}
          ellipsizeMode="tail"
          className={`text-base ${isCompleted ? 'text-text-muted line-through' : 'text-text'}`}>
          {task.title}
        </Text>

        {formattedDueDate ? (
          <View className="mt-1 flex-row items-center gap-1">
            <Feather name="calendar" size={DUE_DATE_ICON_SIZE} color={mutedIconColor} />
            <Text className="text-xs text-text-muted">{formattedDueDate}</Text>
          </View>
        ) : null}
      </View>

      <View className="ml-2">
        <Feather name="chevron-right" size={CHEVRON_ICON_SIZE} color={mutedIconColor} />
      </View>
    </Pressable>
  );
}

/**
 * TaskListItem (TSK-001, F-008/FR5) — the one task-row recipe app-wide;
 * Home's full list here and ORG's later filtered/searched list both render
 * this unchanged (design-system.md -> Component inventory -> `TaskListItem`
 * — a fresh hand-rolled row is a `[blocking]` code-review finding, same
 * reuse-or-block contract as `EmptyState`/`Button`/`SegmentedControl`).
 *
 * Completed state is signaled THREE ways together, never color-alone
 * (anti-pattern #3): the toggle's check-fill, the title's strikethrough,
 * and its muted color. The row stays in place in its list position — no
 * reorder/move animation (OQ-8); that's the parent list's contract to
 * honor (never re-sort on toggle), not something this component enforces.
 *
 * Memoized (`React.memo`) per FR4 (list perf) — a stable `task` reference
 * (from the store's array) plus stable `onPress`/`onToggleComplete`
 * callbacks (the parent screen memoizes both) keeps unaffected rows from
 * re-rendering when a sibling task changes.
 */
export const TaskListItem = React.memo(TaskListItemComponent);
