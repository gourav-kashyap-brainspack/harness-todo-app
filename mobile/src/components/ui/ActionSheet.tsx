import React from 'react';
import {Modal, Pressable, Text} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import {NATIVE_CHROME_RGB, rgbFromTriplet, useTheme} from '@/theme';

import type {FeatherIconName} from './EmptyState';

export interface ActionSheetOption {
  label: string;
  onPress: () => void;
  /** Renders the option in the `danger` token (e.g. a destructive "Remove"). */
  destructive?: boolean;
  /** Falls back to `label` when the visible text is already a clear name. */
  accessibilityLabel?: string;
  /**
   * Optional leading Feather glyph (TSK-004, F-011/F-012/F-015) — 20dp,
   * color-paired to the label: `danger` when `destructive`, `text`
   * otherwise. Omitted entirely for a plain text-only option row — the
   * existing PRO-003 photo-action menu never sets this and renders
   * byte-for-byte unchanged.
   */
  icon?: FeatherIconName;
  /**
   * Marks the currently-selected choice in a single-select menu (ORG-003,
   * F-026–029 — the sort menu's active sort key). Mirrors `destructive`'s
   * own color+weight-pairing mechanism exactly: the option's icon color
   * resolves to `primary` (a third resolved color alongside the existing
   * `default`/`destructive` ones) and its label gains `font-semibold
   * text-primary` in place of `text-text` — the icon glyph itself is NOT
   * swapped to a checkmark, it keeps its own meaningful glyph. Optional and
   * falsy by default — every existing call site (photo menu, row/Detail
   * action menus, delete-confirm) omits it and renders byte-for-byte
   * unchanged.
   */
  active?: boolean;
}

export interface ActionSheetProps {
  visible: boolean;
  onClose: () => void;
  options: ActionSheetOption[];
  /** The sheet's accessible name/context (e.g. `"Photo actions"`). */
  accessibilityLabel?: string;
  /**
   * Optional header rendered above the options (TSK-004, F-012) — used for
   * a yes/no-style confirm (e.g. `"Delete this task?"`). An options-only
   * menu (no yes/no question) omits this, same as PRO-003's existing
   * photo-action menu — unaffected either way.
   */
  title?: string;
}

const OPTION_ICON_SIZE = 20;

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
 *
 * **TSK-004 extension:** two optional additions, both backward-compatible —
 * `title` (a header above the options, for a yes/no-style confirm) and
 * per-option `icon` (a leading Feather glyph). Neither is set by the
 * existing PRO-003 photo-action menu, so that call site renders unchanged.
 *
 * **ORG-003 extension:** one more optional per-option addition, also
 * backward-compatible — `active` (marks the currently-selected choice in a
 * single-select menu, e.g. the sort menu's active sort key). Mirrors
 * `destructive`'s own color+weight-pairing mechanism; unset on every
 * pre-existing call site, so none of them change.
 */
export function ActionSheet({
  visible,
  onClose,
  options,
  accessibilityLabel,
  title,
}: ActionSheetProps): React.JSX.Element | null {
  const {resolvedScheme} = useTheme();

  if (!visible) {
    return null;
  }

  const chrome = NATIVE_CHROME_RGB[resolvedScheme];
  const defaultIconColor = rgbFromTriplet(chrome.text);
  const destructiveIconColor = rgbFromTriplet(chrome.danger);
  // ORG-003 — a third resolved icon color for the active-sort option,
  // alongside the two above. `destructive` takes precedence over `active`
  // in the (currently unreached) case an option sets both — a destructive
  // action reads as more urgent than a selection indicator.
  const activeIconColor = rgbFromTriplet(chrome.primary);

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
          {title ? (
            <Text
              accessibilityRole="header"
              className="mb-1 border-b border-border pb-3 text-base font-semibold text-text">
              {title}
            </Text>
          ) : null}
          {options.map(option => (
            <Pressable
              key={option.label}
              onPress={() => {
                onClose();
                option.onPress();
              }}
              accessibilityRole="menuitem"
              accessibilityLabel={option.accessibilityLabel ?? option.label}
              className="min-h-12 flex-row items-center justify-center gap-3 rounded-md px-4 py-3">
              {option.icon ? (
                <Feather
                  name={option.icon}
                  size={OPTION_ICON_SIZE}
                  color={
                    option.destructive ? destructiveIconColor : option.active ? activeIconColor : defaultIconColor
                  }
                />
              ) : null}
              <Text
                className={`text-base ${
                  option.destructive
                    ? 'font-semibold text-danger'
                    : option.active
                      ? 'font-semibold text-primary'
                      : 'text-text'
                }`}>
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
