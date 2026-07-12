import React from 'react';
import {Platform} from 'react-native';
import {afterEach, beforeEach, describe, expect, it, jest} from '@jest/globals';
import {act, create as createRenderer, type ReactTestRenderer} from 'react-test-renderer';
import DateTimePicker, {DateTimePickerAndroid, type DateTimePickerEvent} from '@react-native-community/datetimepicker';

import {formatDueDateFull} from '@/core/lib';

import {DueDateField} from './DueDateField';

const originalPlatformOS = Platform.OS;

afterEach(() => {
  Platform.OS = originalPlatformOS;
  jest.clearAllMocks();
});

const ISO = '2026-07-15T15:30:00.000Z';

function pickerEvent(type: 'set' | 'dismissed'): DateTimePickerEvent {
  return {type, nativeEvent: {timestamp: Date.now(), utcOffset: 0}};
}

function renderField(props: Partial<React.ComponentProps<typeof DueDateField>> = {}): ReactTestRenderer {
  let tree!: ReactTestRenderer;
  act(() => {
    tree = createRenderer(<DueDateField onChange={jest.fn()} {...props} />);
  });
  return tree;
}

describe('DueDateField (TSK-005, FR2/FR3, F-016/F-017)', () => {
  it('renders the unset "Set due date" trigger with no Clear button when value is undefined (FR4 — optional)', () => {
    const tree = renderField();

    const trigger = tree.root.findByProps({accessibilityLabel: 'Set due date'});
    expect(trigger.props.accessibilityRole).toBe('button');
    expect(tree.root.findByProps({children: 'Set due date'})).toBeTruthy();
    expect(() => tree.root.findByProps({accessibilityLabel: 'Remove due date'})).toThrow();
  });

  it('renders the formatted value (formatDueDateFull) + a Clear button when value is set', () => {
    const tree = renderField({value: ISO});

    const formatted = formatDueDateFull(ISO);
    expect(tree.root.findByProps({children: formatted})).toBeTruthy();
    expect(
      tree.root.findByProps({accessibilityLabel: `Due date, ${formatted}. Double tap to change.`}),
    ).toBeTruthy();
    expect(tree.root.findByProps({accessibilityLabel: 'Remove due date'})).toBeTruthy();
  });

  it('pressing Clear calls onChange(undefined) — the task persists without a due date (F-017)', () => {
    const onChange = jest.fn();
    const tree = renderField({value: ISO, onChange});

    act(() => {
      tree.root.findByProps({accessibilityLabel: 'Remove due date'}).props.onPress();
    });

    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  describe('iOS flow (combined mode="datetime" picker — AndroidMode has no combined mode, IOSMode does)', () => {
    beforeEach(() => {
      Platform.OS = 'ios';
    });

    it('pressing the trigger reveals the picker in mode="datetime"; a "set" event commits an ISO string via .toISOString() (gap b)', () => {
      const onChange = jest.fn();
      const tree = renderField({onChange});

      act(() => {
        tree.root.findByProps({accessibilityLabel: 'Set due date'}).props.onPress();
      });

      const picker = tree.root.findByType(DateTimePicker);
      expect(picker.props.mode).toBe('datetime');

      const pickedDate = new Date('2026-08-01T10:15:00.000Z');
      act(() => {
        picker.props.onChange(pickerEvent('set'), pickedDate);
      });

      expect(onChange).toHaveBeenCalledWith(pickedDate.toISOString());
    });

    it('a "dismissed" event hides the picker without calling onChange (no change)', () => {
      const onChange = jest.fn();
      const tree = renderField({onChange});

      act(() => {
        tree.root.findByProps({accessibilityLabel: 'Set due date'}).props.onPress();
      });
      act(() => {
        tree.root.findByType(DateTimePicker).props.onChange(pickerEvent('dismissed'), undefined);
      });

      expect(onChange).not.toHaveBeenCalled();
      expect(() => tree.root.findByType(DateTimePicker)).toThrow();
    });
  });

  describe('Android flow (sequential date-then-time dialogs — no combined AndroidMode)', () => {
    beforeEach(() => {
      Platform.OS = 'android';
    });

    it('opens the date dialog; a "set" date opens the time dialog; a "set" time combines both into one ISO string (gap b)', () => {
      const onChange = jest.fn();
      const tree = renderField({onChange});
      const mockedOpen = jest.mocked(DateTimePickerAndroid.open);

      act(() => {
        tree.root.findByProps({accessibilityLabel: 'Set due date'}).props.onPress();
      });

      expect(mockedOpen).toHaveBeenCalledTimes(1);
      const dateParams = mockedOpen.mock.calls[0]![0];
      expect(dateParams.mode).toBe('date');

      const pickedDate = new Date('2026-08-01T00:00:00.000Z');
      act(() => {
        dateParams.onChange?.(pickerEvent('set'), pickedDate);
      });

      expect(mockedOpen).toHaveBeenCalledTimes(2);
      const timeParams = mockedOpen.mock.calls[1]![0];
      expect(timeParams.mode).toBe('time');

      const pickedTime = new Date('2000-01-01T14:45:00.000Z');
      act(() => {
        timeParams.onChange?.(pickerEvent('set'), pickedTime);
      });

      expect(onChange).toHaveBeenCalledTimes(1);
      const [isoArg] = onChange.mock.calls[0] as [string];
      const combined = new Date(isoArg);
      expect(combined.getFullYear()).toBe(pickedDate.getFullYear());
      expect(combined.getMonth()).toBe(pickedDate.getMonth());
      expect(combined.getDate()).toBe(pickedDate.getDate());
      expect(combined.getHours()).toBe(pickedTime.getHours());
      expect(combined.getMinutes()).toBe(pickedTime.getMinutes());
    });

    it('dismissing the date dialog aborts the whole pick — no time step opens, onChange is never called', () => {
      const onChange = jest.fn();
      const tree = renderField({onChange});
      const mockedOpen = jest.mocked(DateTimePickerAndroid.open);

      act(() => {
        tree.root.findByProps({accessibilityLabel: 'Set due date'}).props.onPress();
      });
      const dateParams = mockedOpen.mock.calls[0]![0];
      act(() => {
        dateParams.onChange?.(pickerEvent('dismissed'), undefined);
      });

      expect(mockedOpen).toHaveBeenCalledTimes(1);
      expect(onChange).not.toHaveBeenCalled();
    });

    it('dismissing the time dialog aborts the pick (gap f — never a half-applied, date-only value)', () => {
      const onChange = jest.fn();
      const tree = renderField({onChange});
      const mockedOpen = jest.mocked(DateTimePickerAndroid.open);

      act(() => {
        tree.root.findByProps({accessibilityLabel: 'Set due date'}).props.onPress();
      });
      const dateParams = mockedOpen.mock.calls[0]![0];
      act(() => {
        dateParams.onChange?.(pickerEvent('set'), new Date('2026-08-01T00:00:00.000Z'));
      });
      const timeParams = mockedOpen.mock.calls[1]![0];
      act(() => {
        timeParams.onChange?.(pickerEvent('dismissed'), undefined);
      });

      expect(onChange).not.toHaveBeenCalled();
    });

    it('seeds the date step from the existing value when one is already set (edit flow)', () => {
      const tree = renderField({value: ISO});
      const mockedOpen = jest.mocked(DateTimePickerAndroid.open);

      act(() => {
        tree.root.findByProps({accessibilityLabel: `Due date, ${formatDueDateFull(ISO)}. Double tap to change.`}).props.onPress();
      });

      const dateParams = mockedOpen.mock.calls[0]![0];
      expect(dateParams.value).toEqual(new Date(ISO));
    });
  });
});
