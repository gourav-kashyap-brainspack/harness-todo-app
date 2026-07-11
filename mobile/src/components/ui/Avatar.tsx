import React, {useState} from 'react';
import {Image, Text, View} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import {NATIVE_CHROME_RGB, rgbFromTriplet, useTheme} from '@/theme';

export type AvatarSize = 'md' | 'lg';

export interface AvatarProps {
  name: string;
  /**
   * PRO-003, F-003/F-004 — an optional local device file uri. When present
   * (and loadable) an `Image` fills the chip in place of initials/icon; a
   * broken/missing file (`onError`) falls back to the initials/icon chip
   * rather than a broken-image box (spec FR5 — "treat a missing/deleted
   * file defensively in the view"). Only ever a uri STRING — the caller
   * (`profileStore` -> `profileRepository`) persists that string, never
   * image bytes; this component never reads/writes storage itself.
   */
  photoUri?: string;
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
 * PRO-003 extends this with the `photoUri` prop above (renders an `Image`
 * filling the chip when present, falling back to initials/icon on a load
 * error) — one Avatar primitive, never a second fork for the photo case.
 */
export function Avatar({name, photoUri, size = 'lg'}: AvatarProps): React.JSX.Element {
  const {resolvedScheme} = useTheme();
  const initials = getInitials(name);
  // Feather renders a native Text glyph — its `color` prop needs a resolved
  // RGB string, the same native-prop exception `EmptyState`/`FormField`
  // already establish (nativeChromeColors.ts is the one source, never a
  // fresh hardcoded hex).
  const iconColor = rgbFromTriplet(NATIVE_CHROME_RGB[resolvedScheme].primary);

  // A photo `Image` can fail to load (the device file was deleted/moved
  // since the uri was persisted) — `onError` flips this so the render falls
  // back to the initials/icon chip instead of a broken-image box (FR5).
  // Re-armed whenever `photoUri` itself changes, so swapping in a fresh
  // photo after a previous failure (or after Remove -> Add again) gets a
  // clean attempt rather than being stuck on the old failure. Deliberately
  // NOT a `useEffect` keyed on `photoUri` — that would reset the flag on a
  // POST-commit pass, one render behind an `onError` that lands in the same
  // update; tracking the last-seen uri and adjusting state during render
  // (React's documented pattern for "reset state when a prop changes")
  // applies the reset in the same render instead.
  const [imageFailed, setImageFailed] = useState(false);
  const [lastPhotoUri, setLastPhotoUri] = useState(photoUri);
  if (photoUri !== lastPhotoUri) {
    setLastPhotoUri(photoUri);
    setImageFailed(false);
  }

  const showPhoto = Boolean(photoUri) && !imageFailed;

  return (
    <View
      className={`items-center justify-center overflow-hidden rounded-full bg-primary/10 ${SIZE_CLASS_NAMES[size]}`}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      {showPhoto ? (
        <Image
          source={{uri: photoUri}}
          onError={() => setImageFailed(true)}
          resizeMode="cover"
          className={`rounded-full ${SIZE_CLASS_NAMES[size]}`}
        />
      ) : initials ? (
        <Text className={INITIALS_TEXT_CLASS_NAMES[size]}>{initials}</Text>
      ) : (
        <Feather name="user" size={ICON_SIZES[size]} color={iconColor} />
      )}
    </View>
  );
}
