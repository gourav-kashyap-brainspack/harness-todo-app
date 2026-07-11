import React from 'react';
import {Pressable, Text, TextInput} from 'react-native';
import {act, create as createRenderer, type ReactTestRenderer} from 'react-test-renderer';
import {beforeEach, describe, expect, it, jest} from '@jest/globals';

import * as profileRepository from '@/core/services/profileRepository';
import {useLaunchStore} from '@/core/store/launchStore';
import type {Profile} from '@/core/types/profile';

import {useProfileStore} from '../store/profileStore';
import {ProfileSetupScreen} from './ProfileSetupScreen';

// The repository is the only persistence seam this screen (via the profile
// store) is allowed to touch — mocked here the same way profileStore.test.ts
// mocks it, so `saveProfile` is directly assertable and gap (f) — "the
// throw-on-invalid path is never reachable" — is provable by "never called
// with anything the resolver would have rejected".
jest.mock('@/core/services/profileRepository', () => ({
  getProfile: jest.fn(() => null),
  saveProfile: jest.fn(),
  clearProfile: jest.fn(),
}));

// `ProfileSetupScreen` lives in the feature layer, so it can't reach the
// app-layer `useAppNavigation` helper (boundaries) — it calls the plain
// `useNavigation()` + `CommonActions.reset` directly. Stubbing just
// `useNavigation` (keeping the real `CommonActions`/everything else from the
// package) lets this test assert the exact reset action without paying for
// a full `NavigationContainer` + `react-native-screens` animation dance.
const mockDispatch = jest.fn();
jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native') as object;
  return {
    ...actual,
    useNavigation: () => ({dispatch: mockDispatch}),
  };
});

const mockedSaveProfile = jest.mocked(profileRepository.saveProfile);

function renderScreen(): ReactTestRenderer {
  let tree!: ReactTestRenderer;
  act(() => {
    tree = createRenderer(<ProfileSetupScreen />);
  });
  return tree;
}

/** Name is TextInput[0], Email is TextInput[1] — the screen's field order. */
function fillField(tree: ReactTestRenderer, index: 0 | 1, value: string): void {
  const input = tree.root.findAllByType(TextInput)[index];
  act(() => {
    input.props.onChangeText(value);
  });
  act(() => {
    input.props.onBlur({} as never);
  });
}

function pressSubmit(tree: ReactTestRenderer): void {
  const button = tree.root.findByType(Pressable);
  act(() => {
    button.props.onPress();
  });
}

/** Counts FormField's announced inline error rows. Scoped to `findAllByType
 * (Text)` (not `findAllByProps`) — NativeWind's `cssInterop` wraps `Text` in
 * an interop layer that forwards `accessibilityLiveRegion` onto BOTH the
 * wrapper and the underlying host node, so a bare `findAllByProps` lookup
 * double-counts each real error row (see FormField.test.tsx for the same
 * fix). */
function countAnnouncedErrors(tree: ReactTestRenderer): number {
  return tree.root
    .findAllByType(Text)
    .filter(node => node.props.accessibilityLiveRegion === 'polite').length;
}

/** zodResolver validates asynchronously even for a purely-sync schema (see
 * the resolver's documented default `mode: 'async'`) — flush a real macro
 * task so `handleSubmit`'s internal promise chain has settled before we
 * assert on its effects. */
async function flushSubmit(): Promise<void> {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
  });
}

describe('ProfileSetupScreen (PRO-001, FR3/FR4/FR5)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useProfileStore.setState({profile: null});
    useLaunchStore.setState({hasLaunched: false});
  });

  it('empty submit shows inline validation errors (F-033) and never persists or advances (gap f/e)', async () => {
    const tree = renderScreen();

    pressSubmit(tree);
    await flushSubmit();

    expect(countAnnouncedErrors(tree)).toBe(2); // Name + Email both required.

    expect(mockedSaveProfile).not.toHaveBeenCalled();
    expect(useProfileStore.getState().profile).toBeNull();
    expect(useLaunchStore.getState().hasLaunched).toBe(false);
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('a valid name+email submit persists the profile, sets hasLaunched exactly once, and resets to Tabs', async () => {
    const tree = renderScreen();
    const profile: Profile = {name: 'Ada Lovelace', email: 'ada@example.com'};

    fillField(tree, 0, profile.name);
    fillField(tree, 1, profile.email);
    pressSubmit(tree);
    await flushSubmit();

    expect(mockedSaveProfile).toHaveBeenCalledTimes(1);
    expect(mockedSaveProfile).toHaveBeenCalledWith(profile);
    expect(useProfileStore.getState().profile).toEqual(profile);

    // gap (e): setHasLaunched is the SOLE first-launch writer, fired only on
    // genuine completion.
    expect(useLaunchStore.getState().hasLaunched).toBe(true);

    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'RESET',
      payload: {index: 0, routes: [{name: 'Tabs'}]},
    });
  });

  it('rejects an invalid email — never reaches saveProfile/setHasLaunched (gap f)', async () => {
    const tree = renderScreen();

    fillField(tree, 0, 'Ada Lovelace');
    fillField(tree, 1, 'not-an-email');
    pressSubmit(tree);
    await flushSubmit();

    expect(countAnnouncedErrors(tree)).toBe(1); // Only the email field is invalid.

    expect(mockedSaveProfile).not.toHaveBeenCalled();
    expect(useLaunchStore.getState().hasLaunched).toBe(false);
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('a rapid double-submit (two taps before the disabled state re-renders) persists exactly once (FR5)', async () => {
    const tree = renderScreen();

    fillField(tree, 0, 'Grace Hopper');
    fillField(tree, 1, 'grace@example.com');

    const button = tree.root.findByType(Pressable);
    act(() => {
      button.props.onPress();
      button.props.onPress();
    });
    await flushSubmit();

    expect(mockedSaveProfile).toHaveBeenCalledTimes(1);
    expect(useLaunchStore.getState().hasLaunched).toBe(true);
    expect(mockDispatch).toHaveBeenCalledTimes(1);
  });
});
