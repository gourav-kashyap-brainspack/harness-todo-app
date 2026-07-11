import React, {useEffect, useRef, useState} from 'react';
import {AccessibilityInfo, Platform, Pressable, Text, View} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import {ActionSheet, Avatar, type ActionSheetOption, type AvatarSize} from '@/components/ui';
import {NATIVE_CHROME_RGB, rgbFromTriplet, useTheme} from '@/theme';

import {pickPhotoFromCamera, pickPhotoFromLibrary, type PhotoPickResult} from '../lib/photoPicker';

export interface AvatarPhotoFieldProps {
  /** Feeds `Avatar`'s initials fallback. */
  name: string;
  photoUri?: string;
  /** Called with the new uri on a successful pick, or `undefined` on Remove — never called on cancel/error. */
  onPhotoChange: (uri: string | undefined) => void;
  size?: AvatarSize;
}

const BADGE_ICON_SIZE = 14;
const BADGE_HIT_SLOP = {top: 10, bottom: 10, left: 10, right: 10};
const ERROR_ICON_SIZE = 14;
// `primary-fg` is `255 255 255` in both themes (same literal-constant
// convention `Button.tsx`'s `ACTIVITY_INDICATOR_COLOR` documents) — routed
// through `rgbFromTriplet` rather than a bare string for the same reason.
const BADGE_ICON_COLOR = rgbFromTriplet('255 255 255');

function messageFor(reason: 'permission' | 'camera_unavailable' | 'other', source: 'camera' | 'library'): string {
  switch (reason) {
    case 'permission':
      return source === 'camera'
        ? 'Camera access is off. Enable it in Settings to take a photo.'
        : 'Photo library access is off. Enable it in Settings to choose a photo.';
    case 'camera_unavailable':
      return "Camera isn't available on this device — try Choose from Library instead.";
    default:
      return "Couldn't get that photo. Please try again.";
  }
}

/**
 * AvatarPhotoField (PRO-003, F-003/F-004) — the tappable photo-editing
 * affordance wrapping the `Avatar` primitive with an `ActionSheet` (Take
 * Photo / Choose from Library / Remove, the last one only when a photo is
 * set). Owns the `react-native-image-picker` calls (via `lib/photoPicker`)
 * and the permission-denied / camera-unavailable / other-error messaging
 * (FR4) — the caller only ever receives a plain uri string (or `undefined`
 * on Remove) through `onPhotoChange`, which is the sole hand-off to
 * persistence (`profileStore.setProfile` -> `profileRepository.saveProfile`,
 * FR5). This component never persists anything itself.
 *
 * Mounted in TWO places per spec: `ProfileSetupScreen` (the initial-setup
 * form) and `ProfileScreen`'s edit mode — both hold the picked uri as local
 * component/form state until their own Save/Submit persists the whole
 * profile, mirroring how those screens already treat name/email.
 */
export function AvatarPhotoField({
  name,
  photoUri,
  onPhotoChange,
  size = 'lg',
}: AvatarPhotoFieldProps): React.JSX.Element {
  const {resolvedScheme} = useTheme();
  const [sheetVisible, setSheetVisible] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const dangerColor = rgbFromTriplet(NATIVE_CHROME_RGB[resolvedScheme].danger);

  // Same "announce only a NEW message" iOS mechanism `FormField` already
  // establishes (Android gets `accessibilityLiveRegion="polite"` on the Text
  // itself below, which iOS doesn't support) — required here too since the
  // spec's a11y NFR calls out "denied-permission message announced".
  const previousMessageRef = useRef<string | null>(null);
  useEffect(() => {
    if (message && message !== previousMessageRef.current && Platform.OS === 'ios') {
      AccessibilityInfo.announceForAccessibility(message);
    }
    previousMessageRef.current = message;
  }, [message]);

  function handleResult(result: PhotoPickResult, source: 'camera' | 'library'): void {
    if (result.status === 'success') {
      setMessage(null);
      onPhotoChange(result.uri);
      return;
    }
    if (result.status === 'cancelled') {
      return;
    }
    setMessage(messageFor(result.reason, source));
  }

  async function handleTakePhoto(): Promise<void> {
    handleResult(await pickPhotoFromCamera(), 'camera');
  }

  async function handleChooseFromLibrary(): Promise<void> {
    handleResult(await pickPhotoFromLibrary(), 'library');
  }

  function handleRemove(): void {
    setMessage(null);
    onPhotoChange(undefined);
  }

  const options: ActionSheetOption[] = [
    {label: 'Take Photo', onPress: () => handleTakePhoto()},
    {label: 'Choose from Library', onPress: () => handleChooseFromLibrary()},
    ...(photoUri
      ? [{label: 'Remove Photo', onPress: handleRemove, destructive: true, accessibilityLabel: 'Remove photo'}]
      : []),
  ];

  return (
    <View className="items-center gap-2">
      <Pressable
        onPress={() => setSheetVisible(true)}
        accessibilityRole="button"
        accessibilityLabel={photoUri ? 'Change photo' : 'Add photo'}
        hitSlop={BADGE_HIT_SLOP}
        className="relative">
        <Avatar name={name} photoUri={photoUri} size={size} />
        <View
          className="absolute bottom-0 right-0 h-6 w-6 items-center justify-center rounded-full bg-primary"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants">
          <Feather name="camera" size={BADGE_ICON_SIZE} color={BADGE_ICON_COLOR} />
        </View>
      </Pressable>

      {message ? (
        <View className="max-w-xs flex-row items-center gap-1 px-4">
          <Feather name="alert-circle" size={ERROR_ICON_SIZE} color={dangerColor} />
          <Text className="flex-shrink text-center text-sm text-danger" accessibilityLiveRegion="polite">
            {message}
          </Text>
        </View>
      ) : null}

      <ActionSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        accessibilityLabel="Photo actions"
        options={options}
      />
    </View>
  );
}
