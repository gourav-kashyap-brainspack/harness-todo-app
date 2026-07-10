import React from 'react';
import type {PropsWithChildren} from 'react';
import {StyleSheet} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import {ThemeProvider} from '@/theme';

/**
 * AppProviders — the composition root (FND-001).
 *
 * Wraps the app in the provider stack every screen depends on. One slot is
 * still a pass-through placeholder for a later foundation task:
 *   - Navigation container (FND-003)
 *
 * No network/query provider is mounted here — this is a local-only build
 * (OQ-1); react-query is installed dormant and stays un-wired until a future
 * cloud-sync phase.
 */
export function AppProviders({children}: PropsWithChildren): React.JSX.Element {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider>
          {/* TODO(FND-003): mount the navigation container here */}
          {children}
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// GestureHandlerRootView is a third-party native wrapper NativeWind doesn't
// intercept `className` for by default — a StyleSheet is the correct escape
// hatch here (conventions.md), not an inline style object.
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
