import type {NavigatorScreenParams} from '@react-navigation/native';

/**
 * Typed route params (FND-003, FR3) — the Tier-1 navigation-param-typing
 * pattern PRO/TSK reuse. Task screens (built out in TSK) take a `taskId`;
 * everything else takes no params.
 */
export type TabParamList = {
  Home: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  ProfileSetup: undefined;
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  AddTask: undefined;
  EditTask: {taskId: string};
  TaskDetail: {taskId: string};
};

// Module augmentation for the installed React Navigation 6 (@react-navigation/
// core@6's `useNavigation`/`useRoute` default-generic type is
// `ReactNavigation.RootParamList` — see node_modules/@react-navigation/core/
// lib/typescript/src/{useNavigation,types}.d.ts, verified at implementation
// time). This is the v6 "dynamic" (JSX Navigator/Screen) typing convention —
// NOT the v7+ static-config `RootNavigator` module augmentation (that API
// isn't installed here). Declaring this once means every `useNavigation()`
// call anywhere in the app gets `RootStackParamList`-typed `.navigate(...)`
// without a per-call generic.
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
