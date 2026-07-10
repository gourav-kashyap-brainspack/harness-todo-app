import React, {useEffect, type PropsWithChildren} from 'react';
import {StatusBar, useColorScheme as useSystemColorScheme} from 'react-native';
import {colorScheme as nativeWindColorScheme} from 'nativewind';

import {useThemeStore} from '@/core/store/themeStore';

import {NATIVE_CHROME_RGB, rgbFromTriplet} from './nativeChromeColors';

/**
 * ThemeProvider (FND-002; status bar added FND-003 FR4).
 *
 * Mounted once in AppProviders (the composition root). Three
 * responsibilities:
 *  1. Forward live OS scheme changes into the themeStore while
 *     `mode === 'system'` (FR5) — sourced from React Native's own
 *     `useColorScheme()` hook, which already subscribes to `Appearance` on
 *     mount and unsubscribes on unmount, so no manual listener/cleanup is
 *     needed here.
 *  2. Push the store's resolved scheme into NativeWind's runtime
 *     (`colorScheme.set`) so the `.dark` root class actually flips and
 *     `bg-bg` / `text-text` / … utilities resolve per theme (FR4).
 *  3. Render a themed `<StatusBar>` so the OS status-bar glyphs (clock,
 *     battery, …) flip with `resolvedScheme` (FND-003 FR4's second clause —
 *     `NavigationContainer`'s `theme.dark` only styles React Navigation's
 *     own chrome; it does NOT drive the OS status bar). Homed here rather
 *     than in `NavigationRoot` because it's a theme-wide OS-chrome concern,
 *     not a navigation one — it must hold even before/without a navigator
 *     mounted, same reasoning as the NativeWind `colorScheme.set` push
 *     above. `backgroundColor` (Android-only; iOS ignores it) reuses the
 *     same `NATIVE_CHROME_RGB`/`rgbFromTriplet` source `navigationTheme.ts`
 *     and `TabNavigator.tsx` consume, so there is one place to update on a
 *     palette change.
 *
 * `colorScheme` is NativeWind's imperative color-scheme setter, re-exported
 * from `nativewind` (backed by `react-native-css-interop`). Verified against
 * the installed `nativewind@4.1.23` typings — `node_modules/nativewind/dist/
 * index.d.ts` re-exports `colorScheme` from `react-native-css-interop`,
 * whose native runtime type is `{ set(value: "light"|"dark"|"system"): void;
 * get(): "light"|"dark"; toggle(): void }` — NOT the deprecated
 * `useColorScheme` hook nativewind also re-exports (that one is read-only
 * and unrelated to the setter). `tailwind.config.js` sets `darkMode: 'class'`
 * — required, because with the default `'media'` NativeWind throws
 * ("Cannot manually set color scheme, as dark mode is type 'media'") the
 * moment `colorScheme.set` is called manually. See docs/context/
 * design-system.md → Implementation handoff.
 *
 * This is a provider-level effect only — no tree re-mount on toggle, no
 * network, no navigation reset.
 */
export function ThemeProvider({children}: PropsWithChildren): React.JSX.Element {
  const systemScheme = useSystemColorScheme();
  const resolvedScheme = useThemeStore(state => state.resolvedScheme);
  const syncSystemScheme = useThemeStore(state => state.syncSystemScheme);

  useEffect(() => {
    syncSystemScheme(systemScheme);
  }, [systemScheme, syncSystemScheme]);

  useEffect(() => {
    nativeWindColorScheme.set(resolvedScheme);
  }, [resolvedScheme]);

  return (
    <>
      <StatusBar
        animated
        barStyle={resolvedScheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={rgbFromTriplet(NATIVE_CHROME_RGB[resolvedScheme].bg)}
      />
      {children}
    </>
  );
}
