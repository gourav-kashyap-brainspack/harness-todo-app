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
 */
export {BootstrapScreen as SplashScreen} from './BootstrapScreen';

export function ProfileSetupScreen(): React.JSX.Element {
  return <PlaceholderScreen name="Profile Setup" />;
}

export function HomeScreen(): React.JSX.Element {
  return <PlaceholderScreen name="Home" />;
}

export function ProfileScreen(): React.JSX.Element {
  return <PlaceholderScreen name="Profile" />;
}

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
