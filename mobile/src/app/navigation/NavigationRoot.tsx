import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {enableScreens} from 'react-native-screens';

import {useTheme} from '@/theme';

import {buildNavigationTheme} from './navigationTheme';
import {RootNavigator} from './RootNavigator';

// Native-screen optimization (FND-003, non-functional req) — called once at
// module load, before any navigator mounts.
enableScreens();

/**
 * NavigationRoot (FND-003, FR4/FR6) — mounted as `AppProviders`' child (below
 * ThemeProvider/SafeAreaProvider, per the composition root in
 * src/app/AppProviders.tsx). Derives the `NavigationContainer` theme from
 * the resolved app scheme so headers/tab-bar/background follow light/dark
 * live, same as every other themed surface.
 */
export function NavigationRoot(): React.JSX.Element {
  const {resolvedScheme} = useTheme();

  return (
    <NavigationContainer theme={buildNavigationTheme(resolvedScheme)}>
      <RootNavigator />
    </NavigationContainer>
  );
}
