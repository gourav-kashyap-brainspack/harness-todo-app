import React from 'react';
import {ActivityIndicator, Pressable, Text} from 'react-native';

import {rgbFromTriplet} from '@/theme';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

// `primary-fg` is `255 255 255` in BOTH light and dark themes (see
// design-system.md → Color tokens tables) — a literal constant, not a
// per-scheme resolved value, per the Button component-inventory entry's
// "Loading / submitting state" row. Still routed through `rgbFromTriplet`
// (the one documented native-prop-color helper, `nativeChromeColors.ts`)
// rather than a bare string, so it reads the same way every other
// native-prop color resolution in the app does.
const ACTIVITY_INDICATOR_COLOR = rgbFromTriplet('255 255 255');

/**
 * Button (PRO-001, F-033) — the one primary-action button recipe app-wide:
 * form submits (PRO), `EmptyState`'s action button (FND-005, unchanged —
 * this just names the pattern), future save/confirm CTAs (TSK). Formalizes
 * the exact token recipe `EmptyState` already ships and extends it with
 * `disabled`/`loading` states. Reuse this — never hand-roll a second
 * `bg-primary` button shape (design-system.md → Component inventory →
 * `Button`).
 */
export function Button({
  label,
  onPress,
  disabled = false,
  loading = false,
  fullWidth = true,
}: ButtonProps): React.JSX.Element {
  const isDisabled = disabled || loading;

  const handlePress = (): void => {
    if (isDisabled) {
      return;
    }
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      // Native `disabled` (not just the in-handler guard above) so RN's own
      // press-feedback/focusability matches the a11y state — the guard in
      // `handlePress` stays too, as defense-in-depth against a direct
      // `.onPress()` call bypassing Pressable's native disabled handling
      // (e.g. from a test, or a future ref-based invocation).
      disabled={isDisabled}
      accessibilityRole="button"
      // The resting-state label stays the accessible name even while
      // `loading` — a screen reader must hear "Get Started", never
      // "Activity Indicator" (design-system.md → Button → A11y).
      accessibilityLabel={label}
      accessibilityState={{disabled: isDisabled, busy: loading}}
      className={[
        'min-h-12 items-center justify-center rounded-md bg-primary px-4 py-3',
        isDisabled ? 'opacity-50' : '',
        fullWidth ? 'w-full' : '',
      ]
        .filter(Boolean)
        .join(' ')}>
      {loading ? (
        <ActivityIndicator size="small" color={ACTIVITY_INDICATOR_COLOR} />
      ) : (
        <Text className="text-base font-semibold text-primary-fg">{label}</Text>
      )}
    </Pressable>
  );
}
