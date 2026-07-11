import React from 'react';
import {Modal, Pressable, Text} from 'react-native';

export interface ActionSheetOption {
  label: string;
  onPress: () => void;
  /** Renders the option in the `danger` token (e.g. a destructive "Remove"). */
  destructive?: boolean;
  /** Falls back to `label` when the visible text is already a clear name. */
  accessibilityLabel?: string;
}

export interface ActionSheetProps {
  visible: boolean;
  onClose: () => void;
  options: ActionSheetOption[];
  /** The sheet's accessible name/context (e.g. `"Photo actions"`). */
  accessibilityLabel?: string;
}

/**
 * ActionSheet (PRO-003) — a themed, cross-platform bottom action sheet: a
 * `card` surface sliding up over a dimmed scrim, one row per option plus a
 * trailing Cancel. Built as ONE shared component rather than branching on
 * `ActionSheetIOS` (iOS-only, no Android equivalent) per the spec's
 * "Platform divergence" note — same interaction + the same Maestro/a11y
 * anchors on both platforms. First use: `AvatarPhotoField`'s Take
 * Photo / Choose from Library / Remove menu; a fresh hand-rolled
 * options-menu elsewhere should reuse this rather than a second Modal.
 *
 * Renders nothing at all (not just visually hidden) while `visible` is
 * false — RN's `Modal` otherwise keeps its children mounted regardless of
 * its own `visible` prop, which would leave inert Pressables sitting in the
 * tree (and in the accessibility tree) between opens.
 */
export function ActionSheet({
  visible,
  onClose,
  options,
  accessibilityLabel,
}: ActionSheetProps): React.JSX.Element | null {
  if (!visible) {
    return null;
  }

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose} statusBarTranslucent>
      <Pressable
        className="flex-1 justify-end bg-text/40"
        accessibilityRole="button"
        accessibilityLabel="Dismiss"
        onPress={onClose}>
        {/* Stops a tap inside the sheet card from bubbling to the backdrop's
            dismiss handler above. */}
        <Pressable
          onPress={() => {}}
          accessibilityRole="menu"
          accessibilityLabel={accessibilityLabel}
          className="gap-1 rounded-t-lg bg-card p-4">
          {options.map(option => (
            <Pressable
              key={option.label}
              onPress={() => {
                onClose();
                option.onPress();
              }}
              accessibilityRole="menuitem"
              accessibilityLabel={option.accessibilityLabel ?? option.label}
              className="min-h-12 items-center justify-center rounded-md px-4 py-3">
              <Text
                className={`text-base ${option.destructive ? 'font-semibold text-danger' : 'text-text'}`}>
                {option.label}
              </Text>
            </Pressable>
          ))}
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            className="mt-1 min-h-12 items-center justify-center rounded-md border border-border px-4 py-3">
            <Text className="text-base font-semibold text-text">Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
