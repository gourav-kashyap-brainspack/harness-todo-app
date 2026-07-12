import React, {useCallback} from 'react';
import {Text, View} from 'react-native';
import {useNavigation, useRoute, type RouteProp} from '@react-navigation/native';
import {format} from 'date-fns';
import Feather from 'react-native-vector-icons/Feather';

import {Button, EmptyState, Screen} from '@/components/ui';
import {NATIVE_CHROME_RGB, rgbFromTriplet, useTheme} from '@/theme';

import {useTaskStore} from '../store/taskStore';

/**
 * Local, boundary-clean route-param type (TSK-003). `feature -> app` is a
 * disallowed `eslint-plugin-boundaries` direction (same note `HomeScreen`/
 * `AddTaskScreen` already carry about `useAppNavigation`), so this screen
 * can't import `RootStackParamList`/`useAppRoute` from `app/navigation` — it
 * declares the one param this route needs locally instead.
 * `useNavigation()` still resolves fully typed for free via the global
 * `ReactNavigation.RootParamList` augmentation (`app/navigation/types.ts`
 * merges into the ambient namespace regardless of who imports it); only
 * `useRoute()` has no such default-generic mechanism (`useRoute<T extends
 * RouteProp<ParamListBase>>(): T` — verified against the installed
 * `@react-navigation/core@6` typings, the same finding
 * `app/navigation/hooks.ts` documents for `useAppRoute`), so it needs an
 * explicit one — this local param list supplies it without crossing the
 * boundary.
 */
type TaskDetailParamList = {TaskDetail: {taskId: string}};

const STATUS_ICON_SIZE = 14;
const DUE_DATE_ICON_SIZE = 16;
// design-system.md -> TSK-003 screen spec -> Meta block: fixed format for
// Created/Last updated. Due date's own value format isn't locked in yet
// (TSK-005 confirms) — `task.dueDate` is always absent today, so this is a
// defensive default for when it lands, per the spec's "recommend date-only".
const META_DATE_FORMAT = 'MMM d, yyyy · h:mm a';
const DUE_DATE_FORMAT = 'MMM d, yyyy';

// `primary-fg` is `255 255 255` in BOTH themes (design-system.md -> Color
// tokens) — same literal-constant convention `TaskListItem`'s own check
// glyph uses. This IS that glyph (reuse: TaskListItem status glyph),
// rendered read-only outside a list row per the TSK-003 screen spec.
const CHECK_ICON_COLOR = rgbFromTriplet('255 255 255');

function formatMetaDate(iso: string): string {
  return format(new Date(iso), META_DATE_FORMAT);
}

function formatDueDate(iso: string): string {
  return format(new Date(iso), DUE_DATE_FORMAT);
}

/**
 * TaskDetailScreen (TSK-003, FR2/FR6, F-009/F-018/F-019) — replaces the
 * FND-003 `TaskDetail` placeholder. Reads the task straight from the single
 * `useTaskStore` (coherence check 3 — no duplicate state) by
 * `route.params.taskId`. The selector re-runs on every store update, so an
 * edit made on `EditTaskScreen` (which writes through the same store) is
 * reflected here the moment the user navigates back (FR6) with no extra
 * plumbing — this screen never holds its own copy of the task.
 *
 * Layout/tokens follow `docs/context/design-system.md`'s TSK-003 screen spec
 * element-by-element (title / status / description / due-date / meta /
 * edit-affordance) — see that doc for the full rationale, including the
 * status-glyph reuse, the weight budget, and why the Edit button renders
 * `fullWidth={false}` (leaves room for TSK-004's actions in the same row).
 *
 * Not-found (FR2's "safe empty/back" — e.g. a deleted task) reuses
 * `EmptyState` verbatim rather than crashing on an undefined task.
 */
export function TaskDetailScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<TaskDetailParamList, 'TaskDetail'>>();
  const {taskId} = route.params;
  const {resolvedScheme} = useTheme();

  const task = useTaskStore(state => state.tasks.find(candidate => candidate.id === taskId));

  const handleEdit = useCallback(() => {
    navigation.navigate('EditTask', {taskId});
  }, [navigation, taskId]);

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  if (!task) {
    return (
      <Screen>
        <EmptyState
          title="Task not found"
          message="This task may have been removed."
          icon="alert-circle"
          action={{label: 'Go back', onPress: handleGoBack}}
        />
      </Screen>
    );
  }

  const chrome = NATIVE_CHROME_RGB[resolvedScheme];
  const mutedIconColor = rgbFromTriplet(chrome.textMuted);
  const isCompleted = task.status === 'completed';
  const statusLabel = isCompleted ? 'Completed' : 'Active';
  const dueDateLabel = task.dueDate ? formatDueDate(task.dueDate) : 'No due date';

  return (
    <Screen scroll>
      <View className="py-6">
        <Text accessibilityRole="header" className="text-xl text-text">
          {task.title}
        </Text>

        {/* Status — reuse: TaskListItem status glyph (identical h-6 w-6
            circle), read-only here (plain View, not Pressable — TSK-004
            wires the interactive toggle). Collapsed to one accessible node
            per the design spec. */}
        <View
          accessible
          accessibilityLabel={`Status: ${statusLabel}`}
          className="mt-2 flex-row items-center gap-3">
          <View
            className={`h-6 w-6 items-center justify-center rounded-full ${
              isCompleted ? 'bg-primary' : 'border-2 border-border'
            }`}>
            {isCompleted ? <Feather name="check" size={STATUS_ICON_SIZE} color={CHECK_ICON_COLOR} /> : null}
          </View>
          <Text className={isCompleted ? 'text-base font-semibold text-success' : 'text-base text-text'}>
            {statusLabel}
          </Text>
        </View>

        <Text className={`mt-6 text-base ${task.description ? 'text-text' : 'text-text-muted'}`}>
          {task.description || 'No description'}
        </Text>

        <View
          accessible
          accessibilityLabel={`Due date: ${dueDateLabel}`}
          className="mt-6 flex-row items-center justify-between">
          <View className="flex-row items-center gap-1">
            <Feather name="calendar" size={DUE_DATE_ICON_SIZE} color={mutedIconColor} />
            <Text className="text-sm text-text-muted">Due date</Text>
          </View>
          <Text className={`text-base ${task.dueDate ? 'text-text' : 'text-text-muted'}`}>{dueDateLabel}</Text>
        </View>

        <View className="mt-6 gap-1 border-t border-border pt-4">
          <Text className="text-xs text-text-muted">{`Created ${formatMetaDate(task.createdAt)}`}</Text>
          <Text className="text-xs text-text-muted">{`Last updated ${formatMetaDate(task.updatedAt)}`}</Text>
        </View>

        {/* Bottom action zone — deliberately NOT fullWidth (leaves room for
            TSK-004's complete/duplicate/delete actions in this same row). */}
        <View className="mt-6 flex-row items-center gap-3">
          <Button label="Edit task" onPress={handleEdit} fullWidth={false} />
        </View>
      </View>
    </Screen>
  );
}
