import type {Theme} from '@react-navigation/native';

import {NATIVE_CHROME_RGB, rgbFromTriplet, type ResolvedScheme} from '@/theme';

/**
 * Nav-chrome theme (FND-003, FR4) — React Navigation's `Theme` type (native
 * headers/tab-bar/`NavigationContainer` background) takes flat color
 * strings, resolved from the shared `NATIVE_CHROME_RGB` source (see
 * src/theme/nativeChromeColors.ts for why this can't just be a
 * `className`, and for the single copy of the design-system.md RGB
 * triplets — TabNavigator.tsx and ThemeProvider.tsx's status bar consume
 * the same source, so there is exactly one place to update on a palette
 * change).
 *
 * Installed `@react-navigation/native@6.1.18`'s `Theme` type is
 * `{dark: boolean; colors: {primary, background, card, text, border,
 * notification}}` (no `fonts` key — that's a v7+ addition, not present in
 * this major; verified against node_modules/@react-navigation/native/lib/
 * typescript/src/types.d.ts).
 */
export function buildNavigationTheme(resolvedScheme: ResolvedScheme): Theme {
  const tokens = NATIVE_CHROME_RGB[resolvedScheme];

  return {
    dark: resolvedScheme === 'dark',
    colors: {
      primary: rgbFromTriplet(tokens.primary),
      background: rgbFromTriplet(tokens.bg),
      card: rgbFromTriplet(tokens.surface),
      text: rgbFromTriplet(tokens.text),
      border: rgbFromTriplet(tokens.border),
      notification: rgbFromTriplet(tokens.danger),
    },
  };
}
