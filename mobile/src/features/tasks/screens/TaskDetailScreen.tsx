import React, {useCallback} from 'react';
import {Pressable, Text, View} from 'react-native';
import {useNavigation, useRoute, type RouteProp} from '@react-navigation/native';
import {format} from 'date-fns';
import Feather from 'react-native-vector-icons/Feather';

import {ActionSheet, Button, EmptyState, Screen} from '@/components/ui';
import {NATIVE_CHROME_RGB, rgbFromTriplet, useTheme} from '@/theme';

import {useTaskActions} from '../hooks/useTaskActions';
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
const ACTION_ICON_SIZE = 20;
// The action zone's Toggle/More icon-buttons (TSK-004) — a plain outlined
// square, single-use today (see design-system.md's TSK-004 subsection —
// "promote to `components/ui` on a second consumer", the same
// watch-then-promote call the PRO-002 changelog made for the Cancel-text
// pressable).
const ICON_BUTTON_BASE_CLASSNAME = 'min-h-12 min-w-12 items-center justify-center rounded-md border border-border';
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
 *
 * **TSK-004 (F-011-F-015):** the action zone's Toggle/More icon-buttons +
 * the "More" menu (Duplicate/Delete) + the shared delete-confirm sheet are
 * wired via `useTaskActions` — the same hook/state-machine `HomeScreen`
 * uses, so both screens share one lifecycle-action model.
 */
export function TaskDetailScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<TaskDetailParamList, 'TaskDetail'>>();
  const {taskId} = route.params;
  const {resolvedScheme} = useTheme();

  const task = useTaskStore(state => state.tasks.find(candidate => candidate.id === taskId));
  const toggleStatus = useTaskStore(state => state.toggleStatus);
  const duplicateTask = useTaskStore(state => state.duplicateTask);

  const handleEdit = useCallback(() => {
    navigation.navigate('EditTask', {taskId});
  }, [navigation, taskId]);

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // The shared TSK-004 lifecycle-action state machine (design-system.md ->
  // "TSK-004 - Task lifecycle actions" -> "one coherent affordance model ...
  // reused identically" on Home + Detail — see `useTaskActions`'s own doc
  // comment). Detail passes `handleGoBack` as `onDeleteConfirmed`: deleting
  // the record you're currently viewing navigates back immediately (FR2) —
  // Home passes nothing, since a deleted row just leaves the list in place.
  const {menuTask, openMenu, closeMenu, deleteTarget, requestDelete, cancelDelete, confirmDelete} =
    useTaskActions(handleGoBack);

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

        {/* Bottom action zone — Edit -> Toggle -> More (TSK-004,
            F-011/F-012/F-013/F-014/F-015). Toggle/Edit are NOT repeated in
            the More menu below — they already have a dedicated control
            here, unlike the dense Home row which has room only for the
            checkbox. */}
        <View className="mt-6 flex-row items-center gap-3">
          <Button label="Edit task" onPress={handleEdit} fullWidth={false} />

          <Pressable
            onPress={() => toggleStatus(task.id)}
            accessibilityRole="button"
            accessibilityLabel={isCompleted ? 'Mark pending' : 'Mark complete'}
            className={`${ICON_BUTTON_BASE_CLASSNAME} ${isCompleted ? 'bg-success/10' : ''}`}>
            <Feather
              name="check-circle"
              size={ACTION_ICON_SIZE}
              color={isCompleted ? rgbFromTriplet(chrome.success) : rgbFromTriplet(chrome.primary)}
            />
          </Pressable>

          <Pressable
            onPress={() => openMenu(task)}
            accessibilityRole="button"
            accessibilityLabel="More actions"
            className={ICON_BUTTON_BASE_CLASSNAME}>
            <Feather name="more-horizontal" size={ACTION_ICON_SIZE} color={mutedIconColor} />
          </Pressable>
        </View>
      </View>

      {/* Detail "More" menu — only Duplicate/Delete (Toggle/Edit already
          have dedicated controls above, so they're deliberately omitted
          here per design-system.md's TSK-004 subsection). */}
      <ActionSheet
        visible={menuTask !== null}
        onClose={closeMenu}
        accessibilityLabel={menuTask ? `${menuTask.title} actions` : undefined}
        options={
          menuTask
            ? [
                {label: 'Duplicate', icon: 'copy', onPress: () => duplicateTask(menuTask.id)},
                {
                  label: 'Delete',
                  icon: 'trash-2',
                  destructive: true,
                  accessibilityLabel: 'Delete task',
                  onPress: () => requestDelete(menuTask),
                },
              ]
            : []
        }
      />

      {/* Delete confirmation (F-012) — the exact same shape HomeScreen's own
          confirm sheet uses. Confirm -> `taskStore.removeTask` via
          `confirmDelete`, which then calls `handleGoBack` (this screen's
          `onDeleteConfirmed`) so deleting the record you're viewing doesn't
          leave you looking at the "Task not found" EmptyState for a frame. */}
      <ActionSheet
        visible={deleteTarget !== null}
        onClose={cancelDelete}
        title="Delete this task?"
        accessibilityLabel="Delete this task?"
        options={
          deleteTarget
            ? [
                {
                  label: 'Delete',
                  icon: 'trash-2',
                  destructive: true,
                  accessibilityLabel: 'Delete task',
                  onPress: confirmDelete,
                },
              ]
            : []
        }
      />
    </Screen>
  );
}
