import React, {useCallback, useMemo, useState} from 'react';
import {FlatList, Pressable, RefreshControl, Text, View, type ListRenderItemInfo} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';

import {ActionSheet, EmptyState, Screen, SegmentedControl, TaskListItem, type ActionSheetOption} from '@/components/ui';
import {getProfile} from '@/core/services/profileRepository';
import type {Task} from '@/core/types/task';
import {NATIVE_CHROME_RGB, rgbFromTriplet, useTheme} from '@/theme';

import {SearchBar} from '../components/SearchBar';
import {useTaskActions} from '../hooks/useTaskActions';
import {selectVisibleTasks} from '../lib/selectVisibleTasks';
import {useTaskQueryStore, type TaskFilter} from '../store/taskQueryStore';
import {useTaskStore} from '../store/taskStore';

/**
 * Filter options for the organize header's `SegmentedControl` (ORG-001,
 * F-023/F-024/F-025) — module-scope so the array isn't re-created every
 * render (the primitive's `options` prop doesn't need referential stability
 * for correctness, but there's no reason to rebuild a static literal).
 */
const FILTER_OPTIONS: {value: TaskFilter; label: string}[] = [
  {value: 'all', label: 'All'},
  {value: 'active', label: 'Active'},
  {value: 'completed', label: 'Completed'},
];

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
 * Stable module-scope component — the filtered-empty state for filter=
 * `active` (ORG-001 FR5, design-system.md -> "ORG-001 — Organize header" ->
 * Empty states table). Reuses `EmptyState` verbatim, never a fork. Icon
 * echoes the same status concept as the row action that would resolve it
 * (`buildRowMenuOptions` below already uses `check-circle` for "Mark
 * complete").
 */
function ActiveFilterEmptyState(): React.JSX.Element {
  return <EmptyState title="No active tasks" message="Everything's complete." icon="check-circle" />;
}

/**
 * Stable module-scope component — the filtered-empty state for filter=
 * `completed` (ORG-001 FR5). Icon mirrors `buildRowMenuOptions`'s `circle`
 * for "Mark pending".
 */
function CompletedFilterEmptyState(): React.JSX.Element {
  return <EmptyState title="No completed tasks" message="Complete a task to see it here." icon="circle" />;
}

/**
 * The no-search-results state (ORG-002, FR5, F-031) — unlike the three
 * states above, its message interpolates the trimmed query, so it's a
 * `query`-prop component rather than a zero-arg one (design-system.md →
 * "ORG-002 — Search bar + no-results"). Reuses `EmptyState` verbatim.
 */
function NoResultsEmptyState({query}: {query: string}): React.JSX.Element {
  return <EmptyState title="No results" message={`No tasks match "${query}".`} icon="search" />;
}

/**
 * Binds the current trimmed query into a zero-arg `ListEmptyComponent`-
 * shaped function, the same shape `resolveEmptyComponent`'s other branches
 * return — keeps the FlatList prop's type uniform across all four states.
 */
function buildNoResultsEmptyState(query: string): () => React.JSX.Element {
  return () => <NoResultsEmptyState query={query} />;
}

/**
 * Resolves the FlatList `ListEmptyComponent` per FR5's 4-way precedence: (a)
 * the raw store has zero tasks at all -> the unchanged "No tasks yet" state
 * (TSK-001); (b) a non-empty (trimmed) search whose derived list is empty ->
 * the no-results state (ORG-002, F-031) — this WINS over the filter-empty
 * branch below even when a non-"all" filter is also active, since the search
 * is the more specific, more recent user action; (c) tasks exist, search is
 * empty (or matched but the filter narrowed it to zero) but the active
 * filter matches none of them -> the filter-specific copy. `filter: 'all'`
 * with an empty search never reaches (b)/(c) — it's a passthrough, so a
 * non-empty raw list always yields a non-empty derived list under it;
 * FlatList only renders whichever component this resolves to when the
 * *derived* list is actually empty, so the `all` case never surfaces the
 * wrong copy.
 */
function resolveEmptyComponent(
  hasTasks: boolean,
  filter: TaskFilter,
  trimmedSearch: string,
): () => React.JSX.Element {
  if (!hasTasks) {
    return TaskListEmptyState;
  }
  if (trimmedSearch !== '') {
    return buildNoResultsEmptyState(trimmedSearch);
  }
  return filter === 'completed' ? CompletedFilterEmptyState : ActiveFilterEmptyState;
}

/**
 * Builds the row "..." actions menu options (TSK-004, F-011-F-015) — design-
 * system.md -> "TSK-004 - Task lifecycle actions" -> "1. Row model": Mark
 * complete/pending -> Edit -> Duplicate -> Delete, in that order (the
 * built-in trailing Cancel needs no entry). Module-scope, taking every
 * dependency as a parameter, so it never closes over screen state — the
 * array is only built while the menu sheet is visible and is never handed
 * to a memoized child (that's the FlatList `renderItem` below, which stays
 * stable on its own), so recomputing it per render has no perf cost.
 */
function buildRowMenuOptions(
  task: Task,
  handlers: {
    onToggle: (id: string) => void;
    onEdit: (id: string) => void;
    onDuplicate: (id: string) => void;
    onDelete: (task: Task) => void;
  },
): ActionSheetOption[] {
  const isCompleted = task.status === 'completed';
  return [
    {
      label: isCompleted ? 'Mark pending' : 'Mark complete',
      icon: isCompleted ? 'circle' : 'check-circle',
      onPress: () => handlers.onToggle(task.id),
    },
    {label: 'Edit', icon: 'edit-2', onPress: () => handlers.onEdit(task.id)},
    {label: 'Duplicate', icon: 'copy', onPress: () => handlers.onDuplicate(task.id)},
    {
      label: 'Delete',
      icon: 'trash-2',
      destructive: true,
      accessibilityLabel: 'Delete task',
      onPress: () => handlers.onDelete(task),
    },
  ];
}

/**
 * HomeScreen (TSK-001, FR2/FR3/FR4) — replaces the FND-003 `Home` tab
 * placeholder. Renders tasks from the single `useTaskStore` (the TSK anchor
 * store, FR1).
 *
 * **ORG-001 (F-023/F-024/F-025):** the raw `tasks` array is no longer
 * rendered directly — a pinned organize header (a fixed sibling of the
 * greeting, never a `FlatList` `ListHeaderComponent` — see design-system.md
 * -> "ORG-001 — Organize header") hosts a `SegmentedControl` bound to
 * `taskQueryStore.filter`/`setFilter`, and the list renders
 * `selectVisibleTasks(tasks, query)` — the pure search/filter/sort pipeline
 * `taskQueryStore`'s own module doc describes. `tasks` itself is never
 * copied/reordered; the derived list is a view, recomputed via `useMemo`.
 *
 * **TSK-004 (F-011-F-015):** wires the row's toggle + "..." menu via
 * `useTaskActions` (shared verbatim with `TaskDetailScreen`) — see that
 * hook's doc comment for the state machine and `buildRowMenuOptions` above
 * for this screen's 4-option menu content.
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
  const toggleStatus = useTaskStore(state => state.toggleStatus);
  const duplicateTask = useTaskStore(state => state.duplicateTask);
  // ORG-001: individual primitive selectors (not one object selector) — each
  // returns a primitive, so no `useShallow` wrapper is needed for referential
  // stability (same style `useTaskStore`'s selects above already use).
  const filter = useTaskQueryStore(state => state.filter);
  const setFilter = useTaskQueryStore(state => state.setFilter);
  const sort = useTaskQueryStore(state => state.sort);
  const search = useTaskQueryStore(state => state.search);
  const setSearch = useTaskQueryStore(state => state.setSearch);
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

  const handleEditTask = useCallback(
    (taskId: string) => {
      navigation.navigate('EditTask', {taskId});
    },
    [navigation],
  );

  // ORG-002, FR1 — clears the in-memory search back to ''. Stable across
  // renders for the same reason the other handlers above are (`setSearch` is
  // itself a stable Zustand action reference, so this never thrashes).
  const handleClearSearch = useCallback(() => {
    setSearch('');
  }, [setSearch]);

  // The shared TSK-004 lifecycle-action state machine — see
  // `useTaskActions`'s own doc comment. HomeScreen passes no
  // `onDeleteConfirmed`: a deleted row just leaves the list in place (no
  // navigation needed, unlike TaskDetailScreen's `goBack`).
  const {menuTask, openMenu, closeMenu, deleteTarget, requestDelete, cancelDelete, confirmDelete} =
    useTaskActions();

  // Stable across renders (FR4) — a fresh inline arrow here would force
  // FlatList to treat every row as a new renderItem identity each render.
  // `toggleStatus`/`openMenu` are themselves stable (a Zustand action
  // reference / a no-dep `useCallback`), so including them below never
  // thrashes this identity.
  const renderItem = useCallback(
    ({item}: ListRenderItemInfo<Task>) => (
      <TaskListItem task={item} onPress={handleRowPress} onToggleComplete={toggleStatus} onOpenActions={openMenu} />
    ),
    [handleRowPress, toggleStatus, openMenu],
  );

  const keyExtractor = useCallback((item: Task) => item.id, []);

  // ORG-001 FR4 — the derived, filtered/sorted view over `tasks`; `tasks`
  // itself is never touched. Recomputed only when one of the four inputs
  // actually changes (unrelated re-renders, e.g. the greeting re-reading on
  // focus, don't re-run the pipeline).
  const visibleTasks = useMemo(
    () => selectVisibleTasks(tasks, {search, filter, sort}),
    [tasks, search, filter, sort],
  );

  // FR5 precedence — see `resolveEmptyComponent`'s own doc comment. `search`
  // is trimmed here (once) rather than inside the resolver, matching
  // `selectVisibleTasks`'s own trim-then-compare convention.
  const trimmedSearch = search.trim();
  const ListEmptyComponent = useMemo(
    () => resolveEmptyComponent(tasks.length > 0, filter, trimmedSearch),
    [tasks.length, filter, trimmedSearch],
  );

  return (
    <Screen>
      <View className="flex-1">
        <Text accessibilityRole="header" className="pb-4 pt-6 text-2xl font-bold text-text">
          {profileName ? `Hi, ${profileName}` : 'Hi there'}
        </Text>

        {/* Organize header (ORG-001 + ORG-002) — pinned: a fixed sibling of
            the list, never a FlatList `ListHeaderComponent`, so it never
            scrolls away (design-system.md -> "ORG-001 — Organize header").
            Slot 3 (sort trigger, ORG-003) stays structurally reserved below
            without any layout this task ships. */}
        <View className="gap-3 pb-4">
          {/* slot 1 — search (ORG-002, FR1/FR2) — bound directly to
              `taskQueryStore.search`/`setSearch`; real-time, no submit. */}
          <SearchBar value={search} onChangeText={setSearch} onClear={handleClearSearch} />

          <View className="flex-row items-center gap-3">
            <View className="flex-1">
              <SegmentedControl
                options={FILTER_OPTIONS}
                value={filter}
                onChange={setFilter}
                accessibilityLabel="Filter tasks"
              />
            </View>
            {/* slot 3 — sort trigger (ORG-003 appends an IconButton here) */}
          </View>
        </View>

        <FlatList
          className="flex-1"
          data={visibleTasks}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ItemSeparatorComponent={TaskRowSeparator}
          ListEmptyComponent={ListEmptyComponent}
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

        {/* Row "..." actions menu (TSK-004) — one sheet, one "selected task"
            piece of state owned here (never inside `TaskListItem`, which only
            calls `onOpenActions`). No `title` — a plain options menu. */}
        <ActionSheet
          visible={menuTask !== null}
          onClose={closeMenu}
          accessibilityLabel={menuTask ? `${menuTask.title} actions` : undefined}
          options={
            menuTask
              ? buildRowMenuOptions(menuTask, {
                  onToggle: toggleStatus,
                  onEdit: handleEditTask,
                  onDuplicate: duplicateTask,
                  onDelete: requestDelete,
                })
              : []
          }
        />

        {/* Delete confirmation (F-012) — shared shape with TaskDetailScreen's
            own confirm sheet: a `title` header + one destructive "Delete"
            option; the built-in Cancel is the no-op path. Confirm ->
            `taskStore.removeTask` via `confirmDelete`; the row just leaves
            the list in place (no navigation from Home). */}
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
      </View>
    </Screen>
  );
}
