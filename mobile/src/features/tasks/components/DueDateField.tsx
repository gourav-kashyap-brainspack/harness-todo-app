import React, {useState} from 'react';
import {Platform, Pressable, Text, View} from 'react-native';
import DateTimePicker, {DateTimePickerAndroid, type DateTimePickerEvent} from '@react-native-community/datetimepicker';
import Feather from 'react-native-vector-icons/Feather';

import {IconButton} from '@/components/ui';
import {formatDueDateFull} from '@/core/lib';
import {NATIVE_CHROME_RGB, rgbFromTriplet, useTheme} from '@/theme';

export interface DueDateFieldProps {
  /** Full ISO-8601 datetime string, or `undefined` when unset — the exact `TaskFormValues['dueDate']` shape (STG gap b: the boundary only ever emits `.toISOString()` or `undefined`, never a bare date). */
  value?: string;
  onChange: (value: string | undefined) => void;
}

const TRIGGER_ICON_SIZE = 16; // reuses TaskDetailScreen's DUE_DATE_ICON_SIZE value (design-system.md -> TSK-005 subsection), not a new size.
const CLEAR_ICON_SIZE = 20; // reuses TSK-004's ACTION_ICON_SIZE value.

/** Merges a date-only `Date` (year/month/day) with a time-only `Date`
 * (hour/minute) into one `Date` carrying both — the Android flow's second
 * step (`mode: 'time'`) hands back a `Date` whose Y/M/D default to "today",
 * so the date step's own Y/M/D must be re-applied. */
function combineDateAndTime(datePart: Date, timePart: Date): Date {
  const combined = new Date(datePart);
  combined.setHours(timePart.getHours(), timePart.getMinutes(), 0, 0);
  return combined;
}

/**
 * DueDateField (TSK-005, FR2/FR3, F-016/F-017) — the shared `TaskForm`'s
 * due-date trigger + clear control (design-system.md -> "TSK-005 — Due date
 * field"). Reuses `FormField`'s label className verbatim (not the
 * component itself — a `Pressable` pair opening a native OS dialog has no
 * text-input/error shape to extend, per the design spec's own "Why not
 * FormField" note) and the input-row chrome recipe for the trigger.
 *
 * **Per-platform native flow** (docs-first ADR-0035, grounded via Context7
 * against the installed `@react-native-community/datetimepicker@8.6.0`):
 * - **Android** has no combined date+time mode (`AndroidMode = 'date' |
 *   'time'`) — the library's own docs recommend the imperative
 *   `DateTimePickerAndroid.open` API over the declarative component here
 *   ("more prone to introducing bugs" per the library's README), so this
 *   drives two sequential dialogs: a `mode: 'date'` step, then — only on
 *   `event.type === 'set'` — a `mode: 'time'` step seeded from the picked
 *   date. Either step's `'dismissed'` aborts the WHOLE pick with no change
 *   (FR3's "no due date is a valid state" extends to "an abandoned pick
 *   changes nothing", not a half-applied date-only value).
 * - **iOS** supports a combined `mode: 'datetime'` picker (`IOSMode`
 *   includes `'datetime'`, Android's doesn't) — rendered as the declarative
 *   component, shown/hidden via local `iosPickerVisible` state. `onChange`
 *   fires with `event.type` `'set'` (commit) or `'dismissed'` (no change);
 *   either way the picker is hidden after firing.
 *
 * Either platform's final commit calls `onChange` with
 * `pickedDate.toISOString()` (STG gap b) — this component never hands the
 * form a bare `Date` or a partial date-only string.
 */
export function DueDateField({value, onChange}: DueDateFieldProps): React.JSX.Element {
  const {resolvedScheme} = useTheme();
  const mutedIconColor = rgbFromTriplet(NATIVE_CHROME_RGB[resolvedScheme].textMuted);
  const [iosPickerVisible, setIosPickerVisible] = useState(false);

  const anchorDate = value ? new Date(value) : new Date();

  function openAndroidFlow(): void {
    DateTimePickerAndroid.open({
      value: anchorDate,
      mode: 'date',
      onChange: (dateEvent: DateTimePickerEvent, pickedDate?: Date) => {
        if (dateEvent.type !== 'set' || !pickedDate) {
          return;
        }
        DateTimePickerAndroid.open({
          value: pickedDate,
          mode: 'time',
          onChange: (timeEvent: DateTimePickerEvent, pickedTime?: Date) => {
            if (timeEvent.type !== 'set' || !pickedTime) {
              return;
            }
            onChange(combineDateAndTime(pickedDate, pickedTime).toISOString());
          },
        });
      },
    });
  }

  function handleIosChange(event: DateTimePickerEvent, selectedDate?: Date): void {
    setIosPickerVisible(false);
    if (event.type !== 'set' || !selectedDate) {
      return;
    }
    onChange(selectedDate.toISOString());
  }

  function handleTriggerPress(): void {
    if (Platform.OS === 'android') {
      openAndroidFlow();
      return;
    }
    setIosPickerVisible(true);
  }

  function handleClear(): void {
    onChange(undefined);
  }

  const displayValue = value ? formatDueDateFull(value) : undefined;

  return (
    <View>
      <Text className="mb-2 text-sm text-text">Due date</Text>
      <View className="flex-row items-center gap-2">
        <Pressable
          onPress={handleTriggerPress}
          accessibilityRole="button"
          accessibilityLabel={displayValue ? `Due date, ${displayValue}. Double tap to change.` : 'Set due date'}
          className="min-h-12 flex-1 flex-row items-center gap-2 rounded-md border border-border bg-surface px-3 py-3">
          <Feather name="calendar" size={TRIGGER_ICON_SIZE} color={mutedIconColor} />
          <Text className={displayValue ? 'text-base text-text' : 'text-base text-text-muted'}>
            {displayValue ?? 'Set due date'}
          </Text>
        </Pressable>

        {displayValue ? (
          <IconButton
            onPress={handleClear}
            accessibilityLabel="Remove due date"
            icon="x"
            iconSize={CLEAR_ICON_SIZE}
            iconColor={mutedIconColor}
          />
        ) : null}
      </View>

      {Platform.OS === 'ios' && iosPickerVisible ? (
        <DateTimePicker value={anchorDate} mode="datetime" onChange={handleIosChange} />
      ) : null}
    </View>
  );
}
