import React from 'react';
import {TextInput, View} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import {IconButton} from '@/components/ui';
import {NATIVE_CHROME_RGB, rgbFromTriplet, useTheme} from '@/theme';

export interface SearchBarProps {
  value: string;
  onChangeText: (value: string) => void;
  onClear: () => void;
}

const LEADING_ICON_SIZE = 16;

/**
 * SearchBar (ORG-002, FR1/FR2, F-020/F-021/F-022) — the Home organize
 * header's slot-1 search row (design-system.md → "ORG-002 — Search bar +
 * no-results"). A `features/tasks`-local component (not promoted to
 * `components/ui`) because it binds to nothing generic — it's a thin
 * presentational shell the screen hands `value`/`onChangeText`/`onClear`; the
 * `taskQueryStore` binding itself stays in `HomeScreen`, same "screen owns
 * store wiring, component stays a dumb prop-driven shell" split
 * `TaskListItem`/`ActionSheet` already follow.
 *
 * Reuses `FormField`'s exact input-row chrome (`min-h-12 rounded-md border
 * border-border bg-surface px-3 py-3`) on a wrapping `View` rather than
 * `FormField` itself — a bare `TextInput` has no leading-icon slot, and this
 * field has no label/error to justify pulling in the full component. The
 * leading `search` glyph is purely decorative (the adjacent `TextInput`
 * already carries the real `accessibilityLabel`) and is pulled out of the
 * accessibility tree the same way `EmptyState`/`Avatar`'s decorative icons
 * are. The clear ("×") button reuses `IconButton` verbatim as a sibling of
 * the input box (never nested inside its border) — shown only once there is
 * something to clear, mirroring `DueDateField`'s trigger+clear structure.
 *
 * Real-time (FR2): no submit affordance — every `onChangeText` keystroke
 * flows straight to the caller, which re-derives `selectVisibleTasks`
 * synchronously. No debounce (a local, in-memory list, per the spec).
 */
export function SearchBar({value, onChangeText, onClear}: SearchBarProps): React.JSX.Element {
  const {resolvedScheme} = useTheme();
  // Same native-prop color resolution every other Feather/placeholder
  // consumer in this app uses (`nativeChromeColors.ts` is the one source) —
  // never a fresh hardcoded hex.
  const mutedColor = rgbFromTriplet(NATIVE_CHROME_RGB[resolvedScheme].textMuted);

  return (
    <View className="flex-row items-center gap-2">
      <View className="min-h-12 flex-1 flex-row items-center gap-2 rounded-md border border-border bg-surface px-3 py-3">
        <Feather
          name="search"
          size={LEADING_ICON_SIZE}
          color={mutedColor}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="Search tasks"
          placeholderTextColor={mutedColor}
          accessibilityLabel="Search tasks"
          autoCapitalize="none"
          autoCorrect={false}
          underlineColorAndroid="transparent"
          className="flex-1 text-base text-text"
        />
      </View>

      {value.length > 0 ? (
        <IconButton icon="x" accessibilityLabel="Clear search" iconColor={mutedColor} onPress={onClear} />
      ) : null}
    </View>
  );
}
