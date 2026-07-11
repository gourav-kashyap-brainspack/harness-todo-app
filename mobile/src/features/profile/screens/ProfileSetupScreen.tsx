import React, {useRef, useState} from 'react';
import {Text, TextInput, View} from 'react-native';
import {CommonActions, useNavigation} from '@react-navigation/native';
import {Controller, useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';

import {Button, FormField, Screen} from '@/components/ui';
import {useLaunchStore} from '@/core/store/launchStore';
import {profileSchema, type Profile} from '@/core/types/profile';

import {AvatarPhotoField} from '../components/AvatarPhotoField';
import {useProfileStore} from '../store/profileStore';

const DEFAULT_VALUES: Profile = {name: '', email: ''};

/**
 * ProfileSetupScreen (PRO-001, FR3) — the mandatory first-launch profile
 * form (F-001, OQ-2: name + email both required, no skip). Replaces the
 * FND-003 `ProfileSetup` placeholder on the same route. Anchors the app's
 * RHF + Zod form pattern (FR2) — TSK copies this shape verbatim.
 *
 * On a genuinely valid submit: persist via the profile store (which writes
 * through `profileRepository.saveProfile` — never a raw MMKV call), then
 * call `setHasLaunched()` — the SINGLE first-launch writer (STG coherence
 * gap e / patterns-registry.md → "App bootstrap / first-launch seam") —
 * then navigate to `Tabs` (Home). `setHasLaunched()` is deliberately called
 * from HERE only, on genuine completion, never on mount — a force-quit
 * mid-setup correctly re-shows this screen on the next launch (FR4).
 *
 * Validation is enforced at the form boundary (`zodResolver(profileSchema)`,
 * gap f) — `saveProfile`'s throw-on-invalid path is therefore never
 * reachable from this screen: `handleSubmit` only ever invokes `onValid`
 * with data that already passed the schema.
 *
 * This screen lives in `src/features/profile` (feature layer) — boundaries
 * (conventions.md) disallow importing the app-layer `useAppNavigation`
 * helper (`feature -> core|components|theme|platform` only), so it uses the
 * plain `useNavigation()`/`CommonActions` from `@react-navigation/native`
 * directly. `RootStackParamList` typing still applies automatically via the
 * global `ReactNavigation.RootParamList` augmentation
 * (`app/navigation/types.ts`) — no per-call generic needed.
 */
export function ProfileSetupScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const setProfile = useProfileStore(state => state.setProfile);
  const setHasLaunched = useLaunchStore(state => state.setHasLaunched);
  const emailInputRef = useRef<TextInput>(null);
  // Belt-and-suspenders duplicate-submit guard (FR5). RHF's own
  // `formState.isSubmitting` already drives the Button's `loading`/disabled
  // look, but that only takes effect after a re-render — our submit
  // handler itself is synchronous (a local write, no network round-trip),
  // so two taps landing in the same JS tick could both slip through before
  // React ever re-renders the disabled Button. This ref closes that gap
  // without waiting on a render; it is reset per mount only (never
  // reset to `false` again), which is correct — a screen that has
  // completed setup navigates away and unmounts.
  const hasSubmittedRef = useRef(false);
  // Photo is optional (F-003) and isn't a validated text field, so it's kept
  // as local state rather than an RHF `Controller` — merged into the
  // payload on submit, same "local state until the screen's own save"
  // shape `ProfileScreen`'s edit mode uses (PRO-003).
  const [photo, setPhoto] = useState<string | undefined>(undefined);

  const {
    control,
    handleSubmit,
    watch,
    formState: {errors, isSubmitting},
  } = useForm<Profile>({
    resolver: zodResolver(profileSchema),
    defaultValues: DEFAULT_VALUES,
    mode: 'onBlur',
  });
  const nameValue = watch('name');

  function onValid(data: Profile): void {
    if (hasSubmittedRef.current) {
      return;
    }
    hasSubmittedRef.current = true;

    setProfile({...data, photo});
    setHasLaunched();

    navigation.dispatch(CommonActions.reset({index: 0, routes: [{name: 'Tabs'}]}));
  }

  const onSubmit = handleSubmit(onValid);

  return (
    <Screen scroll>
      <View className="flex-1 justify-center gap-4 py-8">
        <View className="mb-2 gap-2">
          <Text
            className="text-2xl font-bold text-text"
            accessibilityRole="header"
            accessibilityLabel="Welcome to Todo App">
            Welcome to Todo App
          </Text>
          <Text className="text-sm text-text-muted">
            Tell us your name and email to get started.
          </Text>
        </View>

        <AvatarPhotoField name={nameValue} photoUri={photo} onPhotoChange={setPhoto} size="lg" />

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

        <Button label="Get Started" onPress={onSubmit} loading={isSubmitting} />
      </View>
    </Screen>
  );
}
