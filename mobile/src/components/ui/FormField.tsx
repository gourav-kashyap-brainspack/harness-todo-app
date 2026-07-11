import React, {forwardRef, useEffect, useRef, useState} from 'react';
import {AccessibilityInfo, Platform, Text, TextInput, View, type TextInputProps} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import {NATIVE_CHROME_RGB, rgbFromTriplet, useTheme} from '@/theme';

export interface FormFieldProps
  extends Pick<
    TextInputProps,
    | 'value'
    | 'onChangeText'
    | 'onBlur'
    | 'placeholder'
    | 'keyboardType'
    | 'autoCapitalize'
    | 'textContentType'
    | 'returnKeyType'
    | 'onSubmitEditing'
    | 'secureTextEntry'
  > {
  label: string;
  error?: string;
  /**
   * Kept in the reusable signature for a future form with a genuine
   * optional/required mix (TSK) — PRO-001's two fields are both mandatory,
   * so no visible `*` marker is rendered here (design-system.md →
   * `FormField` → Label). Destructured out (as `_required`) below rather
   * than left in the `...inputProps` rest spread, so it never lands on the
   * underlying `TextInput` as a stray prop.
   */
  required?: boolean;
}

const ERROR_ICON_SIZE = 14;

/**
 * FormField (PRO-001, F-033) — the Tier-1 form-field pattern (label + input
 * + inline validation error) every RHF + Zod form in the app reuses; TSK
 * copies this verbatim rather than re-deciding field/error styling per
 * screen (design-system.md → Component inventory → `FormField`).
 *
 * A thin visual wrapper — the screen still wires RHF's `Controller` (RN has
 * no DOM `register`, so `Controller` is the only option here). This
 * component owns only the token-level look + the a11y error-announcement
 * mechanics: Android gets `accessibilityLiveRegion="polite"` on the error
 * text (same convention `LoadingIndicator` established); iOS has no
 * equivalent for that prop, so it calls
 * `AccessibilityInfo.announceForAccessibility` itself whenever a NEW error
 * message appears (not on every re-render).
 *
 * Forwards its ref to the underlying `TextInput` so a screen can drive
 * focus-advance (e.g. Name's `onSubmitEditing` focusing the Email field).
 */
export const FormField = forwardRef<TextInput, FormFieldProps>(function FormField(
  {label, error, required: _required, onBlur, ...inputProps},
  ref,
) {
  const {resolvedScheme} = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const previousErrorRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (error && error !== previousErrorRef.current && Platform.OS === 'ios') {
      AccessibilityInfo.announceForAccessibility(error);
    }
    previousErrorRef.current = error;
  }, [error]);

  const dangerColor = rgbFromTriplet(NATIVE_CHROME_RGB[resolvedScheme].danger);
  // `placeholderTextColor` is a native prop `className` can't reach (same
  // class of exception as `ActivityIndicator`/`Feather` color props) —
  // resolved from the one documented `text-muted` RGB pair rather than a
  // fresh value (design-system.md → `FormField` → Input (rest)).
  const placeholderColor = rgbFromTriplet(NATIVE_CHROME_RGB[resolvedScheme].textMuted);

  // Invalid always wins over focus (same 1px width either way) — a color
  // change is never the only signal here, it's always paired with the
  // error row below (design-system.md anti-pattern #3).
  const borderClassName = error ? 'border-danger' : isFocused ? 'border-primary' : 'border-border';
  const accessibilityLabel = error ? `${label}, ${error}` : label;

  return (
    <View>
      <Text className="mb-2 text-sm text-text">{label}</Text>
      <TextInput
        ref={ref}
        accessibilityLabel={accessibilityLabel}
        placeholderTextColor={placeholderColor}
        onFocus={() => setIsFocused(true)}
        onBlur={event => {
          setIsFocused(false);
          onBlur?.(event);
        }}
        className={`min-h-12 rounded-md border ${borderClassName} bg-surface px-3 py-3 text-base text-text`}
        {...inputProps}
      />
      {error ? (
        <View className="mt-1 flex-row items-center gap-1">
          <Feather name="alert-circle" size={ERROR_ICON_SIZE} color={dangerColor} />
          <Text className="flex-shrink text-sm text-danger" accessibilityLiveRegion="polite">
            {error}
          </Text>
        </View>
      ) : null}
    </View>
  );
});
