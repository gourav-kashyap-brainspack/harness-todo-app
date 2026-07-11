import React, {useRef, useState} from 'react';
import {Pressable, Text, TextInput, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {Controller, useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import Feather from 'react-native-vector-icons/Feather';

import {Avatar, Button, EmptyState, FormField, Screen, SegmentedControl} from '@/components/ui';
import {NATIVE_CHROME_RGB, rgbFromTriplet, useTheme, type ThemeMode} from '@/theme';
import {profileSchema, type Profile} from '@/core/types/profile';

import {AvatarPhotoField} from '../components/AvatarPhotoField';
import {useProfileStore} from '../store/profileStore';

const DEFAULT_VALUES: Profile = {name: '', email: ''};

const THEME_OPTIONS: {value: ThemeMode; label: string}[] = [
  {value: 'system', label: 'System'},
  {value: 'light', label: 'Light'},
  {value: 'dark', label: 'Dark'},
];

// The edit affordance stays visually small (22dp, not a full 48dp box) and
// reaches the a11y touch-target floor via `hitSlop` instead of inflating
// the visible icon (design-system.md a11y baseline #2: "pad the tappable
// region with hitSlop rather than inflating the visual size"):
// 22 + 13 + 13 = 48dp.
const EDIT_ICON_SIZE = 22;
const EDIT_HIT_SLOP = {top: 13, bottom: 13, left: 13, right: 13};

/**
 * ProfileScreen (PRO-002, FR1-FR4) — replaces the FND-003 `Profile` tab
 * placeholder.
 *
 * **View (FR1):** reads name/email/photo from the single PRO-001
 * `useProfileStore` (FR4 — no duplicate state). No profile (shouldn't
 * happen post-setup) falls back to `EmptyState` with an action back into
 * `ProfileSetup`.
 *
 * **Edit (FR2, per the design spec):** an inline `isEditing` toggle, NOT a
 * pushed screen. `useForm` is called unconditionally at the top (rules of
 * hooks) even though its JSX only mounts while `isEditing` — this is the
 * one deliberate divergence from `ProfileSetupScreen`'s empty
 * `defaultValues`: opening edit mode calls `reset()` seeded from the
 * CURRENT profile, since editing an existing profile should never start
 * blank. Both Name and Email reuse the PRO-001 `FormField` +
 * `zodResolver(profileSchema)` pattern — validation happens at the form
 * boundary (gap f), so `saveProfile`'s throw-on-invalid path is never
 * reachable from here, same as `ProfileSetupScreen`. A valid save calls
 * `setProfile` (persists + updates the store) and returns to view mode —
 * deliberately NO navigation and NO `setHasLaunched()` call: that seam is
 * `ProfileSetupScreen.onValid`'s alone (patterns-registry.md → "App
 * bootstrap / first-launch seam"), never re-fired from an edit. Cancel just
 * flips `isEditing` back to `false` — unmounting the form discards any
 * in-progress edits (RHF state isn't persisted anywhere else).
 *
 * **Theme (FR3):** the new `SegmentedControl` wired directly to the single
 * `useTheme()`/`themeStore` (FR4) — completes OQ-10. Hidden while editing
 * per the design spec.
 *
 * Lives in `src/features/profile` (feature layer) — same as
 * `ProfileSetupScreen`, so boundaries disallow the app-layer
 * `useAppNavigation` helper; this uses the plain `useNavigation()` from
 * `@react-navigation/native` directly (typed automatically via the global
 * `ReactNavigation.RootParamList` augmentation in `app/navigation/types.ts`).
 */
export function ProfileScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const {resolvedScheme, mode, setMode} = useTheme();
  const profile = useProfileStore(state => state.profile);
  const setProfile = useProfileStore(state => state.setProfile);
  const [isEditing, setIsEditing] = useState(false);
  // Same "local state until this screen's own Save persists it" shape the
  // form fields already use (via `reset`) — seeded from the current profile
  // on entering edit mode, discarded on Cancel, merged into `setProfile` on
  // a valid Save (PRO-003, FR2/FR3).
  const [photo, setPhoto] = useState<string | undefined>(profile?.photo);
  const emailInputRef = useRef<TextInput>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: {errors, isSubmitting},
  } = useForm<Profile>({
    resolver: zodResolver(profileSchema),
    defaultValues: DEFAULT_VALUES,
    mode: 'onBlur',
  });

  // `edit-2` is a plain glyph (not an icon-chip like Avatar/EmptyState), so
  // it resolves the `text` token (not `primary`) via the same native-prop
  // convention every other native color prop in the app uses.
  const editIconColor = rgbFromTriplet(NATIVE_CHROME_RGB[resolvedScheme].text);

  function startEditing(): void {
    reset(profile ?? DEFAULT_VALUES);
    setPhoto(profile?.photo);
    setIsEditing(true);
  }

  function cancelEditing(): void {
    setPhoto(profile?.photo);
    setIsEditing(false);
  }

  function onValid(data: Profile): void {
    setProfile({...data, photo});
    setIsEditing(false);
  }

  const onSubmit = handleSubmit(onValid);

  if (!profile) {
    return (
      <Screen>
        <EmptyState
          title="No profile yet"
          message="Set up your profile to see it here."
          icon="user"
          action={{
            label: 'Set Up Profile',
            onPress: () => navigation.navigate('ProfileSetup'),
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View className="gap-6 py-8">
        {!isEditing ? (
          <View className="flex-row justify-end">
            <Pressable
              onPress={startEditing}
              accessibilityRole="button"
              accessibilityLabel="Edit profile"
              hitSlop={EDIT_HIT_SLOP}>
              <Feather name="edit-2" size={EDIT_ICON_SIZE} color={editIconColor} />
            </Pressable>
          </View>
        ) : null}

        <View className="items-center gap-2">
          {isEditing ? (
            <AvatarPhotoField name={profile.name} photoUri={photo} onPhotoChange={setPhoto} size="lg" />
          ) : (
            <Avatar name={profile.name} photoUri={profile.photo} size="lg" />
          )}
          {!isEditing ? (
            <>
              <Text className="text-xl font-semibold text-text">{profile.name}</Text>
              <Text className="text-sm text-text-muted">{profile.email}</Text>
            </>
          ) : null}
        </View>

        {isEditing ? (
          <View className="gap-4">
            <Controller
              control={control}
              name="name"
              render={({field: {onChange, onBlur, value}}) => (
                <FormField
                  label="Name"
                  required
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.name?.message}
                  placeholder="Your name"
                  autoCapitalize="words"
                  textContentType="name"
                  returnKeyType="next"
                  onSubmitEditing={() => emailInputRef.current?.focus()}
                />
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({field: {onChange, onBlur, value}}) => (
                <FormField
                  ref={emailInputRef}
                  label="Email"
                  required
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.email?.message}
                  placeholder="you@example.com"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  returnKeyType="done"
                  onSubmitEditing={onSubmit}
                />
              )}
            />

            <View className="gap-3">
              <Button label="Save" onPress={onSubmit} loading={isSubmitting} />
              <Pressable
                onPress={cancelEditing}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
                className="min-h-12 items-center justify-center">
                <Text className="text-sm font-medium text-text-muted">Cancel</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {!isEditing ? (
          <View className="gap-3">
            <Text className="text-lg font-semibold text-text">Theme</Text>
            <SegmentedControl
              options={THEME_OPTIONS}
              value={mode}
              onChange={setMode}
              accessibilityLabel="Theme"
            />
          </View>
        ) : null}
      </View>
    </Screen>
  );
}
