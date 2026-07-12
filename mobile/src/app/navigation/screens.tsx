import React from 'react';

import {useAppRoute} from './hooks';
import {PlaceholderScreen} from './PlaceholderScreen';

/**
 * Placeholder stub screens for every route in the navigation shell
 * (FND-003). Feature modules (PRO/TSK) replace these one at a time; the
 * navigator wiring (RootNavigator/TabNavigator) never has to change when
 * that happens since it only imports the screen component, not its guts.
 *
 * `Splash` is the first swap (FND-004) — re-exported here (rather than
 * defined inline like the stubs below) because it now carries real boot
 * logic + its own test file; see `BootstrapScreen.tsx`.
 *
 * `ProfileSetup` is the second swap (PRO-001), and `Profile` (the tab) is
 * the third (PRO-002) — both re-exported the same way from the feature
 * module (`app -> features` is an allowed boundary direction; the reverse
 * is not, which is why the screens themselves use plain `useNavigation()`
 * rather than this file's `useAppNavigation` helper). `Home` (the tab) is
 * the fourth swap (TSK-001), same re-export shape. `RootNavigator`/
 * `TabNavigator`'s wiring never changes — they still only import
 * `ProfileSetupScreen`/`ProfileScreen`/`HomeScreen` from this barrel.
 */
export {BootstrapScreen as SplashScreen} from './BootstrapScreen';
export {ProfileSetupScreen} from '@/features/profile/screens/ProfileSetupScreen';
export {ProfileScreen} from '@/features/profile/screens/ProfileScreen';
export {HomeScreen} from '@/features/tasks/screens/HomeScreen';

export function AddTaskScreen(): React.JSX.Element {
  return <PlaceholderScreen name="Add Task" />;
}

export function EditTaskScreen(): React.JSX.Element {
  const route = useAppRoute<'EditTask'>();
  return <PlaceholderScreen name="Edit Task" detail={`taskId: ${route.params.taskId}`} />;
}

export function TaskDetailScreen(): React.JSX.Element {
  const route = useAppRoute<'TaskDetail'>();
  return <PlaceholderScreen name="Task Details" detail={`taskId: ${route.params.taskId}`} />;
}
