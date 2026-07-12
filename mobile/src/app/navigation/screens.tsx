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
 * the fourth swap (TSK-001), `AddTask` is the fifth (TSK-002), and
 * `EditTask`/`TaskDetail` are the sixth and seventh (TSK-003) — all
 * re-exported the same way from their feature module (same boundary note:
 * `TaskDetailScreen`/`EditTaskScreen` also use plain `useNavigation()`/
 * `useRoute()`, never the app-layer helpers). `RootNavigator`/
 * `TabNavigator`'s wiring never changes — it still only imports these named
 * exports from this barrel.
 */
export {BootstrapScreen as SplashScreen} from './BootstrapScreen';
export {ProfileSetupScreen} from '@/features/profile/screens/ProfileSetupScreen';
export {ProfileScreen} from '@/features/profile/screens/ProfileScreen';
export {HomeScreen} from '@/features/tasks/screens/HomeScreen';
export {AddTaskScreen} from '@/features/tasks/screens/AddTaskScreen';
export {EditTaskScreen} from '@/features/tasks/screens/EditTaskScreen';
export {TaskDetailScreen} from '@/features/tasks/screens/TaskDetailScreen';
