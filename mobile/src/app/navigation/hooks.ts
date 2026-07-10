import {useNavigation, useRoute, type RouteProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

import type {RootStackParamList} from './types';

/**
 * Typed navigation/route helpers (FND-003, FR3) — the anchor pattern TSK's
 * screens reuse instead of re-typing `useNavigation`/`useRoute` per screen.
 *
 * `useNavigation()` already infers `RootStackParamList` by default (via the
 * `ReactNavigation.RootParamList` global augmentation in `./types`), so
 * `useAppNavigation` mainly narrows to a specific route's navigation prop
 * when a screen needs `.setOptions`/route-specific typing; `useAppRoute`
 * gives `useRoute` the explicit generic it always requires (no default
 * inference exists for it — verified against the installed
 * `@react-navigation/core@6` typings).
 */
export function useAppNavigation<
  RouteName extends keyof RootStackParamList = keyof RootStackParamList,
>(): NativeStackNavigationProp<RootStackParamList, RouteName> {
  return useNavigation<NativeStackNavigationProp<RootStackParamList, RouteName>>();
}

export function useAppRoute<RouteName extends keyof RootStackParamList>(): RouteProp<
  RootStackParamList,
  RouteName
> {
  return useRoute<RouteProp<RootStackParamList, RouteName>>();
}
