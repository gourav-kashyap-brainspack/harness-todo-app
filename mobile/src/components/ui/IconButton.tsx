import React from 'react';
import {Pressable} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import type {FeatherIconName} from './EmptyState';

export interface IconButtonProps {
  onPress: () => void;
  /** Required, not optional — an icon-only control has no visible text fallback (design-system.md -> Accessibility baseline #1). */
  accessibilityLabel: string;
  icon: FeatherIconName;
  iconSize?: number;
  /** A resolved native color string (`rgbFromTriplet(...)`) — the caller already has one via `useTheme()`/`NATIVE_CHROME_RGB`, same native-prop-color convention every other Feather consumer in this app follows. */
  iconColor: string;
  /** Extra classes appended to the base chrome (e.g. `TaskDetailScreen`'s completed-state `bg-success/10` fill) — never a replacement for it. */
  className?: string;
}

const DEFAULT_ICON_SIZE = 20;

// The one outlined-square icon-button chrome app-wide (TSK-004's Detail
// Toggle/More buttons were its first consumer; TSK-005's due-date Clear
// button is its second — per the TSK-004 changelog's own "promote to
// `components/ui` on a second consumer" note, design-system.md's TSK-005
// subsection). Reuse this rather than a third private copy of the
// className string.
const BASE_CLASSNAME = 'min-h-12 min-w-12 items-center justify-center rounded-md border border-border';

/**
 * IconButton (TSK-005) — the one 48dp outlined-square icon-only button
 * recipe app-wide. `TaskDetailScreen`'s Toggle/More action-zone buttons and
 * the due-date field's Clear ("x") button are its two call sites; any later
 * icon-only control reaching for the same shape should consume this rather
 * than hand-rolling a third `Pressable` + className copy.
 */
export function IconButton({
  onPress,
  accessibilityLabel,
  icon,
  iconSize = DEFAULT_ICON_SIZE,
  iconColor,
  className,
}: IconButtonProps): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      className={[BASE_CLASSNAME, className].filter(Boolean).join(' ')}>
      <Feather name={icon} size={iconSize} color={iconColor} />
    </Pressable>
  );
}
