import React, {useEffect, type PropsWithChildren} from 'react';
import {useColorScheme as useSystemColorScheme} from 'react-native';
import {colorScheme as nativeWindColorScheme} from 'nativewind';

import {useThemeStore} from '@/core/store/themeStore';

/**
 * ThemeProvider (FND-002).
 *
 * Mounted once in AppProviders (the composition root). Two responsibilities:
 *  1. Forward live OS scheme changes into the themeStore while
 *     `mode === 'system'` (FR5) — sourced from React Native's own
 *     `useColorScheme()` hook, which already subscribes to `Appearance` on
 *     mount and unsubscribes on unmount, so no manual listener/cleanup is
 *     needed here.
 *  2. Push the store's resolved scheme into NativeWind's runtime
 *     (`colorScheme.set`) so the `.dark` root class actually flips and
 *     `bg-bg` / `text-text` / … utilities resolve per theme (FR4).
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

  return <>{children}</>;
}
