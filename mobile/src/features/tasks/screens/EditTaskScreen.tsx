import React, {useCallback} from 'react';
import {View} from 'react-native';
import {useNavigation, useRoute, type RouteProp} from '@react-navigation/native';

import {EmptyState, Screen} from '@/components/ui';

import {TaskForm, type TaskFormValues} from '../components/TaskForm';
import {useTaskStore} from '../store/taskStore';

/**
 * Local, boundary-clean route-param type — same rationale as
 * `TaskDetailScreen`'s `TaskDetailParamList` (see that file's doc comment
 * for why this can't import `RootStackParamList`/`useAppRoute` from
 * `app/navigation`).
 */
type EditTaskParamList = {EditTask: {taskId: string}};

/**
 * EditTaskScreen (TSK-003, FR3/FR4/FR5) — replaces the FND-003 `EditTask`
 * placeholder. Reads the task by `route.params.taskId` from the single
 * `useTaskStore` and renders the shared `TaskForm` (TSK-002) seeded with its
 * current values via `defaultValues` — the same "seed on entry" divergence
 * `ProfileScreen`'s edit mode already established (patterns-registry.md ->
 * `TaskForm` -> "TSK-003 reuse contract").
 *
 * `TaskForm` itself gates `onSubmit` on schema validity (FR5, F-034/gap f —
 * an empty title never reaches `handleSubmit` below) and guards a same-tick
 * double-tap (F-035); this screen only wires the genuinely-valid result
 * through. On submit it merges the validated `title`/`description`/
 * `dueDate` over the EXISTING task's `status` and calls `updateTask` with
 * the FULL business-field set (STG gap a — `taskRepository.upsertTask`
 * wholesale-replaces on update; a partial submit would blank out `status`).
 * **TSK-005:** `dueDate` moved INTO `TaskForm`'s own `.pick` set, so it now
 * comes from the validated `values` (seeded via `defaultValues` below) —
 * this screen no longer reads `task.dueDate` at submit time (shrinks the
 * caller-side merge list by one field, per patterns-registry.md ->
 * `TaskForm`'s "Caller-side edit-merge contract"). `status` stays merged
 * from the existing record since `TaskForm` still doesn't own it.
 * `updatedAt` is bumped exactly once, inside the repository (coherence check
 * 2) — never recomputed here. A valid save navigates back to `TaskDetail`
 * (FR6 — that screen reads the same store, so it shows the updated values +
 * bumped `updatedAt` immediately).
 *
 * Not-found (a task deleted from another route while this screen is queued,
 * or a stale/garbage `taskId`) reuses `EmptyState` rather than rendering a
 * form with nothing to save.
 *
 * Lives in `src/features/tasks` (feature layer) — same boundary note as
 * `AddTaskScreen`/`HomeScreen`: uses the plain `useNavigation()` from
 * `@react-navigation/native`, typed automatically via the global
 * `ReactNavigation.RootParamList` augmentation, no per-call generic needed.
 */
export function EditTaskScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<EditTaskParamList, 'EditTask'>>();
  const {taskId} = route.params;

  const task = useTaskStore(state => state.tasks.find(candidate => candidate.id === taskId));
  const updateTask = useTaskStore(state => state.updateTask);

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleSubmit = useCallback(
    (values: TaskFormValues) => {
      if (!task) {
        return;
      }
      updateTask({
        id: task.id,
        title: values.title,
        description: values.description,
        status: task.status,
        dueDate: values.dueDate,
      });
      navigation.goBack();
    },
    [navigation, task, updateTask],
  );

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

  return (
    <Screen scroll>
      <View className="gap-6 py-6">
        <TaskForm
          defaultValues={{title: task.title, description: task.description ?? '', dueDate: task.dueDate}}
          onSubmit={handleSubmit}
          submitLabel="Save"
        />
      </View>
    </Screen>
  );
}
