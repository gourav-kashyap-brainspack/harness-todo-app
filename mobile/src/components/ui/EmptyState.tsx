import React from 'react';
import {Pressable, Text, View} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import {NATIVE_CHROME_RGB, rgbFromTriplet, useTheme} from '@/theme';

/**
 * Feather's own runtime `name` prop is typed as a bare `string` (see
 * `@types/react-native-vector-icons/Icon.d.ts`) — no exported name union.
 * This alias recovers a real union from the installed icon font's own glyph
 * map via a type-only `import(...)` query (erased at compile time, no
 * runtime cost, no extra bundle weight — verified against the installed
 * `react-native-vector-icons@10.3.0` + the project's `resolveJsonModule`
 * tsconfig). Central so every later `icon` prop in the app (not just this
 * one) can reuse it instead of re-deriving.
 */
export type FeatherIconName = keyof typeof import('react-native-vector-icons/glyphmaps/Feather.json');

export interface EmptyStateAction {
  label: string;
  onPress: () => void;
}

export interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: FeatherIconName;
  action?: EmptyStateAction;
}

const ICON_SIZE = 28;

/**
 * EmptyState (FND-005, F-030) — the reference "nothing here" surface reused
 * by every list-empty case app-wide (no tasks, no completed tasks, no search
 * results — ORG's F-031 reuses this exact component, never a fork). Layout,
 * tokens, and a11y treatment are specified verbatim in
 * `docs/context/design-system.md` → Component inventory; do not re-decide
 * them per screen.
 *
 * The icon is decorative (the title + message already carry the meaning), so
 * its chip is pulled out of the accessibility tree on both platforms
 * (`accessibilityElementsHidden` for iOS, `importantForAccessibility`
 * `"no-hide-descendants"` for Android) rather than given a redundant label.
 */
export function EmptyState({title, message, icon, action}: EmptyStateProps): React.JSX.Element {
  const {resolvedScheme} = useTheme();
  // Feather renders a native Text glyph — its `color` prop needs a resolved
  // RGB string, the same native-prop exception `TabNavigator` already
  // establishes for icon tinting (NativeWind `className` can't reach a
  // third-party icon component's internal color unless `cssInterop` is
  // wired for it, which it isn't yet — see design-system.md's "Missing
  // tokens check").
  const iconColor = rgbFromTriplet(NATIVE_CHROME_RGB[resolvedScheme].primary);

  const titleMarginClassName = message ? 'mb-2' : action ? 'mb-6' : '';
  const messageMarginClassName = action ? 'mb-6' : '';

  return (
    <View className="flex-1 items-center justify-center px-8">
      {icon ? (
        <View
          className="mb-6 h-16 w-16 items-center justify-center rounded-full bg-primary/10"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants">
          <Feather name={icon} size={ICON_SIZE} color={iconColor} />
        </View>
      ) : null}

      <Text className={`max-w-xs text-center text-lg text-text ${titleMarginClassName}`}>
        {title}
      </Text>

      {message ? (
        <Text className={`max-w-xs text-center text-sm text-text-muted ${messageMarginClassName}`}>
          {message}
        </Text>
      ) : null}

      {action ? (
        <Pressable
          onPress={action.onPress}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          className="min-h-12 items-center justify-center rounded-md bg-primary px-4 py-3">
          <Text className="text-base font-semibold text-primary-fg">{action.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
