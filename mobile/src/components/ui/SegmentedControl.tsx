import React from 'react';
import {Pressable, Text, View} from 'react-native';

export interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** The group's context label (e.g. `"Theme"`), read alongside each segment's own label. */
  accessibilityLabel: string;
}

/**
 * SegmentedControl (PRO-002, F-003 generalized) — a single-select row of
 * 2-4 mutually-exclusive text options. First use: the Profile screen's
 * System/Light/Dark theme toggle. Promoted to the shared `components/ui`
 * inventory rather than kept screen-local — ORG's filter-chip/sort-option
 * controls (TSK module) are the same interaction shape and reuse this
 * rather than a second hand-rolled control (design-system.md → Component
 * inventory → `SegmentedControl`).
 *
 * Generic over `T extends string` so any fixed-option domain (theme mode,
 * a task-filter enum, a sort key, …) gets full type-safety on `value`/
 * `onChange` without this component knowing the domain.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: SegmentedControlProps<T>): React.JSX.Element {
  return (
    <View
      className="flex-row gap-1 rounded-md border border-border bg-surface p-1"
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}>
      {options.map(option => {
        const selected = option.value === value;
        // Selection is never signaled by fill alone — the label also
        // switches weight (400 -> 600), pairing a color/fill change with a
        // weight change (design-system.md anti-pattern #3 / a11y baseline
        // #4, "never color-alone for state").
        const segmentClassName = `min-h-12 flex-1 items-center justify-center rounded-sm ${
          selected ? 'bg-primary' : ''
        }`;
        const labelClassName = selected
          ? 'text-sm font-semibold text-primary-fg'
          : 'text-sm text-text';

        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{selected}}
            accessibilityLabel={option.label}
            className={segmentClassName}>
            <Text className={labelClassName}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
