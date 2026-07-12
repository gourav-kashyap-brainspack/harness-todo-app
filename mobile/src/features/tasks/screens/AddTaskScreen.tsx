import React, {useCallback} from 'react';
import {View} from 'react-native';
import {useNavigation} from '@react-navigation/native';

import {Screen} from '@/components/ui';

import {TaskForm, type TaskFormValues} from '../components/TaskForm';
import {useTaskStore} from '../store/taskStore';

/**
 * AddTaskScreen (TSK-002, FR2) — replaces the FND-003 `AddTask` placeholder
 * on the same pushed route (F-007, "Create Task"). Renders the shared
 * `TaskForm` with empty defaults; the native-stack header (wired in
 * `RootNavigator`, `title: 'Add Task'`) already supplies the screen title,
 * so no second on-screen heading is rendered here.
 *
 * `TaskForm` itself gates `onSubmit` on schema validity (FR3, F-034 — an
 * empty title never reaches this handler) and guards against a same-tick
 * double-tap (FR4, F-035) — this screen only wires the genuinely-valid
 * result through to `taskStore.addTask` (-> `taskRepository.upsertTask`,
 * which mints the id + `createdAt`/`updatedAt` and defaults
 * `status: 'active'` — FR5; never done here) and navigates back to Home so
 * the new task is immediately visible in the list (F-007). Cancel/back
 * (the native header's back button) discards, since nothing is persisted
 * until a genuine submit.
 *
 * Lives in `src/features/tasks` (feature layer) — same boundary note as
 * `HomeScreen`/`ProfileSetupScreen`: `feature -> app` is a disallowed
 * `eslint-plugin-boundaries` direction, so this uses the plain
 * `useNavigation()` from `@react-navigation/native` directly rather than
 * the app-layer `useAppNavigation` helper. Typed automatically via the
 * global `ReactNavigation.RootParamList` augmentation
 * (`app/navigation/types.ts`) — no per-call generic needed.
 */
export function AddTaskScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const addTask = useTaskStore(state => state.addTask);

  const handleSubmit = useCallback(
    (values: TaskFormValues) => {
      addTask(values);
      navigation.goBack();
    },
    [addTask, navigation],
  );

  return (
    <Screen scroll>
      <View className="gap-6 py-6">
        <TaskForm onSubmit={handleSubmit} submitLabel="Add task" />
      </View>
    </Screen>
  );
}
