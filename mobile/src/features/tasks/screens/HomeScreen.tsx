import React, {useCallback, useState} from 'react';
import {FlatList, Pressable, RefreshControl, Text, View, type ListRenderItemInfo} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';

import {EmptyState, Screen, TaskListItem} from '@/components/ui';
import {getProfile} from '@/core/services/profileRepository';
import type {Task} from '@/core/types/task';
import {NATIVE_CHROME_RGB, rgbFromTriplet, useTheme} from '@/theme';

import {useTaskStore} from '../store/taskStore';

const FAB_ICON_SIZE = 24;
// `primary-fg` is `255 255 255` in BOTH themes (design-system.md -> Color
// tokens) — same literal-constant convention `TaskListItem`'s check glyph
// and `Button.ACTIVITY_INDICATOR_COLOR` already use.
const FAB_ICON_COLOR = rgbFromTriplet('255 255 255');

/**
 * Stable module-scope component (not recreated per render — FR4 list perf)
 * — the FlatList `ItemSeparatorComponent`, the documented step-5 (20dp)
 * inter-card gap (design-system.md -> `TaskListItem` -> Layout). A
 * dedicated separator (rather than a per-row margin) avoids a double-gap at
 * the list boundary.
 */
function TaskRowSeparator(): React.JSX.Element {
  return <View className="h-5" />;
}

/**
 * Stable module-scope component — the empty-list state (F-030, FR2). Reuses
 * `EmptyState` verbatim, never a fork.
 */
function TaskListEmptyState(): React.JSX.Element {
  return (
    <EmptyState title="No tasks yet" message="Tap the + button below to add your first task." icon="clipboard" />
  );
}

/**
 * HomeScreen (TSK-001, FR2/FR3/FR4) — replaces the FND-003 `Home` tab
 * placeholder. Renders all tasks (active + completed together, no
 * filtering — F-023 search/filter/sort is ORG's later module) from the
 * single `useTaskStore` (the TSK anchor store, FR1).
 *
 * Lives in `src/features/tasks` (feature layer), so — same as
 * `ProfileScreen`/`ProfileSetupScreen` (PRO-002) — it cannot import the
 * app-layer `useAppNavigation` helper: `.eslintrc.js`'s
 * `boundaries/dependencies` only allows a `feature` to import same-feature
 * siblings plus `core`/`components`/`theme`/`platform`, never `app`. Uses
 * the plain `useNavigation()` from `@react-navigation/native` directly
 * instead — typed automatically via the global `ReactNavigation.RootParamList`
 * augmentation in `app/navigation/types.ts`.
 *
 * **Greeting name (the cross-feature boundary note in the TSK-001 spec):**
 * reads `profileRepository.getProfile()?.name` directly — the STG core
 * seam — rather than PRO's `useProfileStore`. A `features/tasks ->
 * features/profile` import would be a `feature -> feature` boundary
 * violation (only same-feature-sibling imports are allowed between
 * features); `core` is always an allowed `feature -> core` target, and
 * `profileRepository.getProfile()` is already the STG-owned total read
 * (absent -> `null`, F-038) — no new seam needed, and no duplicate profile
 * state is introduced (this screen never writes profile state, only mirrors
 * the name locally). Re-read on every screen FOCUS (`useFocusEffect`, not
 * just on mount) — Home stays mounted inside the bottom-tabs (React
 * Navigation doesn't unmount inactive tabs by default), so a one-time
 * render-time read would go stale the moment a user edits their name on the
 * Profile tab and comes back; re-reading on focus keeps the greeting live
 * without crossing the features->features boundary into `useProfileStore`.
 */
export function HomeScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const {resolvedScheme} = useTheme();
  const tasks = useTaskStore(state => state.tasks);
  const refresh = useTaskStore(state => state.refresh);
  const [profileName, setProfileName] = useState<string | undefined>(() => getProfile()?.name);

  useFocusEffect(
    useCallback(() => {
      setProfileName(getProfile()?.name);
    }, []),
  );

  const chrome = NATIVE_CHROME_RGB[resolvedScheme];
  const refreshTintColor = rgbFromTriplet(chrome.primary);

  // FAB elevation per design-system.md's `TaskListItem` -> Elevation note:
  // "the Home screen's FAB ... reuses this exact resolution mechanism at
  // slightly stronger values" — same native-prop shadow-color escape hatch,
  // a bit stronger than the task-card lift since the FAB floats above the
  // list. Dark mode: no shadow (anti-pattern #5), same as the card.
  const fabElevationStyle =
    resolvedScheme === 'light'
      ? {
          shadowColor: rgbFromTriplet(chrome.text),
          shadowOffset: {width: 0, height: 2},
          shadowOpacity: 0.15,
          shadowRadius: 6,
          elevation: 4,
        }
      : {shadowOpacity: 0, elevation: 0};

  const handleAddTask = useCallback(() => {
    navigation.navigate('AddTask');
  }, [navigation]);

  const handleRowPress = useCallback(
    (task: Task) => {
      navigation.navigate('TaskDetail', {taskId: task.id});
    },
    [navigation],
  );

  // Stable across renders (FR4) — a fresh inline arrow here would force
  // FlatList to treat every row as a new renderItem identity each render.
  const renderItem = useCallback(
    ({item}: ListRenderItemInfo<Task>) => <TaskListItem task={item} onPress={handleRowPress} />,
    [handleRowPress],
  );

  const keyExtractor = useCallback((item: Task) => item.id, []);

  return (
    <Screen>
      <View className="flex-1">
        <Text accessibilityRole="header" className="pb-4 pt-6 text-2xl font-bold text-text">
          {profileName ? `Hi, ${profileName}` : 'Hi there'}
        </Text>

        <FlatList
          className="flex-1"
          data={tasks}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ItemSeparatorComponent={TaskRowSeparator}
          ListEmptyComponent={TaskListEmptyState}
          // `pb-24` (96dp) clears the FAB (56dp tall + 24dp bottom margin)
          // so the last row is never hidden behind it; `flex-grow` lets
          // `ListEmptyComponent` fill the available height so `EmptyState`'s
          // own `flex-1 items-center justify-center` can center it.
          contentContainerClassName="flex-grow pb-24"
          refreshControl={
            // `refresh()` is a synchronous local re-hydrate (F-042, no
            // network round-trip) — there's no async gap to track, so
            // `refreshing` is always `false`; the native pull gesture
            // itself already animates the (themed) spinner during the
            // drag, and `onRefresh` re-reads via the store's `refresh()`.
            // No local `isRefreshing` state needed for this synchronous
            // case — a future async refresh path would reintroduce one.
            <RefreshControl
              refreshing={false}
              onRefresh={refresh}
              tintColor={refreshTintColor}
              colors={[refreshTintColor]}
            />
          }
        />

        <Pressable
          onPress={handleAddTask}
          accessibilityRole="button"
          accessibilityLabel="Add task"
          style={fabElevationStyle}
          className="absolute bottom-6 right-0 h-14 w-14 items-center justify-center rounded-full bg-primary">
          <Feather name="plus" size={FAB_ICON_SIZE} color={FAB_ICON_COLOR} />
        </Pressable>
      </View>
    </Screen>
  );
}
