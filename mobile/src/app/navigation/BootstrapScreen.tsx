import React, {useEffect} from 'react';
import {Text} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import BootSplash from 'react-native-bootsplash';

import {useLaunchStore} from '@/core/store/launchStore';

import {useAppNavigation} from './hooks';

/**
 * BootstrapScreen (FND-004) — the real implementation behind the RootStack's
 * `Splash` route. FND-003 wired `Splash` as the initial route with a
 * `PlaceholderScreen` stub; this is that stub's replacement, same as every
 * other feature module swapping in its real screen (patterns-registry.md →
 * "Placeholder screen + RN-Navigation jest setup") — `RootNavigator`'s
 * wiring itself never changes.
 *
 * On mount (FR2):
 *  (a) theme mode is already restored — `themeStore` resolves
 *      `resolvedScheme` synchronously at module load (FND-002), nothing to
 *      do here;
 *  (b) `hasLaunched` is read the same way — `useLaunchStore`'s initial state
 *      is `readHasLaunched()` (a guarded MMKV read, FR6), resolved before
 *      this component ever renders;
 *  (c) route to `Tabs` (returning user) or `ProfileSetup` (first launch,
 *      F-044) via `navigation.reset` — replaces `Splash` in history so the
 *      hardware back button can never return to it (also satisfies the
 *      "Android back must not exit unexpectedly during boot" platform note:
 *      there is nothing left to back out of once Splash is gone);
 *  (d) hide the native splash (`BootSplash.hide({fade: true})`).
 *
 * Zero network calls anywhere in this path, no `react-query` mounted, no
 * connectivity gate (F-048, the offline shell) — `hasLaunched` and
 * `resolvedScheme` are both local MMKV/Zustand reads only, and no artificial
 * delay is added (NFR: cold start < 3s — hidden the instant the boot
 * decision above is made).
 */
export function BootstrapScreen(): React.JSX.Element {
  const navigation = useAppNavigation<'Splash'>();
  const hasLaunched = useLaunchStore(state => state.hasLaunched);

  useEffect(() => {
    if (hasLaunched) {
      navigation.reset({index: 0, routes: [{name: 'Tabs'}]});
    } else {
      navigation.reset({index: 0, routes: [{name: 'ProfileSetup'}]});
    }

    BootSplash.hide({fade: true}).catch(() => {});
  }, [hasLaunched, navigation]);

  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-bg">
      <Text
        className="text-2xl font-semibold text-primary"
        accessibilityRole="header"
        accessibilityLabel="Todo App">
        Todo App
      </Text>
    </SafeAreaView>
  );
}
