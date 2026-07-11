import React from 'react';
import {Text, View} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import {NATIVE_CHROME_RGB, rgbFromTriplet, useTheme} from '@/theme';

export type AvatarSize = 'md' | 'lg';

export interface AvatarProps {
  name: string;
  size?: AvatarSize;
}

// Two fixed presets (not an arbitrary dp number) so each maps to a static
// NativeWind className, per the no-arbitrary-value rule (design-system.md
// → Component inventory → `Avatar`). `'md'` reuses `EmptyState`'s exact
// 64dp icon-chip size verbatim.
const SIZE_CLASS_NAMES: Record<AvatarSize, string> = {
  md: 'h-16 w-16',
  lg: 'h-20 w-20',
};

const INITIALS_TEXT_CLASS_NAMES: Record<AvatarSize, string> = {
  md: 'text-base font-semibold text-primary',
  lg: 'text-xl font-semibold text-primary',
};

const ICON_SIZES: Record<AvatarSize, number> = {
  md: 24,
  lg: 28,
};

/**
 * Derives up to two initials from `name`: the first character of the first
 * word, uppercased, plus (when there is more than one word) the first
 * character of the LAST word, uppercased — middle words are ignored (e.g.
 * "Ada Marie Lovelace" -> "AL"). Returns `''` for an empty/whitespace-only
 * name, the defensive fallback case (`profileSchema` requires `min(1)`, so
 * this is a true edge case, not the expected path).
 */
function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return '';
  }
  const first = words[0]!.charAt(0).toUpperCase();
  if (words.length === 1) {
    return first;
  }
  const last = words[words.length - 1]!.charAt(0).toUpperCase();
  return `${first}${last}`;
}

/**
 * Avatar (PRO-002, F-005) — the identity glyph for the Profile screen: a
 * circular `primary/10` chip (the same soft-chip treatment as `EmptyState`'s
 * icon chip, applied to a second context) showing the user's initials,
 * falling back to a Feather `user` glyph when no name is available.
 * Decorative once adjacent name/email text is also on screen — hidden from
 * the accessibility tree the same way `EmptyState`'s icon chip is
 * (design-system.md → Component inventory → `Avatar`).
 *
 * PRO-003 will extend this with a `photoUri?: string` prop (renders an
 * `Image` filling the chip when present) — not stubbed here to avoid an
 * unused prop today.
 */
export function Avatar({name, size = 'lg'}: AvatarProps): React.JSX.Element {
  const {resolvedScheme} = useTheme();
  const initials = getInitials(name);
  // Feather renders a native Text glyph — its `color` prop needs a resolved
  // RGB string, the same native-prop exception `EmptyState`/`FormField`
  // already establish (nativeChromeColors.ts is the one source, never a
  // fresh hardcoded hex).
  const iconColor = rgbFromTriplet(NATIVE_CHROME_RGB[resolvedScheme].primary);

  return (
    <View
      className={`items-center justify-center rounded-full bg-primary/10 ${SIZE_CLASS_NAMES[size]}`}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      {initials ? (
        <Text className={INITIALS_TEXT_CLASS_NAMES[size]}>{initials}</Text>
      ) : (
        <Feather name="user" size={ICON_SIZES[size]} color={iconColor} />
      )}
    </View>
  );
}
