import React from 'react';
import {ActivityIndicator, Text, View} from 'react-native';

import {NATIVE_CHROME_RGB, rgbFromTriplet, useTheme} from '@/theme';

export interface LoadingIndicatorProps {
  label?: string;
}

const DEFAULT_ACCESSIBILITY_LABEL = 'Loading…';

/**
 * LoadingIndicator (FND-005, F-032) — the themed spinner shown while local
 * data hydrates, reused for pull-to-refresh (F-042). Layout/tokens per
 * `docs/context/design-system.md` → Component inventory.
 *
 * `ActivityIndicator`'s `color` is a native prop NativeWind `className`
 * cannot reach, so it's resolved from the same documented `primary` RGB
 * pair every other native-prop consumer in the app uses (`TabNavigator`,
 * `ThemeProvider`'s status bar) — never a new/independent value.
 *
 * The screen-reader label is always present (default "Loading…") even when
 * no visible `label` is rendered, so a screen reader still announces
 * progress on a bare spinner.
 */
export function LoadingIndicator({label}: LoadingIndicatorProps): React.JSX.Element {
  const {resolvedScheme} = useTheme();
  const spinnerColor = rgbFromTriplet(NATIVE_CHROME_RGB[resolvedScheme].primary);

  return (
    <View
      className="items-center justify-center py-6"
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label ?? DEFAULT_ACCESSIBILITY_LABEL}
      accessibilityLiveRegion="polite">
      <ActivityIndicator size="large" color={spinnerColor} />
      {label ? <Text className="mt-2 text-sm text-text-muted">{label}</Text> : null}
    </View>
  );
}
