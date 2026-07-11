import React from 'react';
import {TextInput} from 'react-native';
import {act, create as createRenderer, type ReactTestRenderer} from 'react-test-renderer';
import {afterEach, beforeEach, describe, expect, it, jest} from '@jest/globals';

import * as profileRepository from '@/core/services/profileRepository';
import {useThemeStore} from '@/core/store/themeStore';
import type {Profile} from '@/core/types/profile';

import {useProfileStore} from '../store/profileStore';
import {ProfileScreen} from './ProfileScreen';

// Same seam ProfileSetupScreen.test.tsx mocks — the repository is the only
// persistence path the profile store is allowed to touch (conventions.md —
// no direct MMKV), so mocking it makes `saveProfile` directly assertable
// and proves gap (f) (the throw-on-invalid path is never reached).
jest.mock('@/core/services/profileRepository', () => ({
  getProfile: jest.fn(() => null),
  saveProfile: jest.fn(),
  clearProfile: jest.fn(),
}));

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native') as object;
  return {
    ...actual,
    useNavigation: () => ({navigate: mockNavigate}),
  };
});

const mockedSaveProfile = jest.mocked(profileRepository.saveProfile);
const initialThemeState = useThemeStore.getState();

const PROFILE: Profile = {name: 'Ada Lovelace', email: 'ada@example.com'};

// Tracked + unmounted in `afterEach` — otherwise a subsequent test's
// `useProfileStore.setState`/`useThemeStore.setState` call re-renders THIS
// test's still-subscribed (but no-longer-relevant) tree outside `act()`
// (same leak `FormField.test.tsx` guards against).
let activeTree: ReactTestRenderer | undefined;

function renderScreen(): ReactTestRenderer {
  act(() => {
    activeTree = createRenderer(<ProfileScreen />);
  });
  return activeTree!;
}

function fillField(tree: ReactTestRenderer, index: 0 | 1, value: string): void {
  const input = tree.root.findAllByType(TextInput)[index];
  act(() => {
    input.props.onChangeText(value);
  });
  act(() => {
    input.props.onBlur({} as never);
  });
}

/** zodResolver validates asynchronously — flush a real macrotask so
 * `handleSubmit`'s internal promise chain has settled before asserting. */
async function flushSubmit(): Promise<void> {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
  });
}

describe('ProfileScreen (PRO-002, FR1/FR2/FR3/FR4)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useProfileStore.setState({profile: PROFILE});
    useThemeStore.setState(initialThemeState);
  });

  afterEach(() => {
    if (activeTree) {
      act(() => {
        activeTree!.unmount();
      });
      activeTree = undefined;
    }
  });

  it('renders the name, email, and avatar initials from the single profile store (FR1/FR4)', () => {
    const tree = renderScreen();

    expect(tree.root.findByProps({children: 'Ada Lovelace'})).toBeTruthy();
    expect(tree.root.findByProps({children: 'ada@example.com'})).toBeTruthy();
    expect(tree.root.findByProps({children: 'AL'})).toBeTruthy();
  });

  it('shows EmptyState with a Set Up Profile action when there is no profile', () => {
    useProfileStore.setState({profile: null});
    const tree = renderScreen();

    expect(tree.root.findByProps({children: 'No profile yet'})).toBeTruthy();

    const action = tree.root.findByProps({accessibilityLabel: 'Set Up Profile'});
    act(() => {
      action.props.onPress();
    });
    expect(mockNavigate).toHaveBeenCalledWith('ProfileSetup');
  });

  it('Edit opens the inline form pre-filled with the current name and email (FR2)', () => {
    const tree = renderScreen();

    act(() => {
      tree.root.findByProps({accessibilityLabel: 'Edit profile'}).props.onPress();
    });

    const inputs = tree.root.findAllByType(TextInput);
    expect(inputs[0]!.props.value).toBe('Ada Lovelace');
    expect(inputs[1]!.props.value).toBe('ada@example.com');
    // View-mode identity text and the theme section are hidden while editing.
    expect(() => tree.root.findByProps({children: 'Theme'})).toThrow();
  });

  it('a valid edit save calls setProfile and returns to the view with the updated name', async () => {
    const tree = renderScreen();

    act(() => {
      tree.root.findByProps({accessibilityLabel: 'Edit profile'}).props.onPress();
    });
    fillField(tree, 0, 'Ada Byron');

    act(() => {
      tree.root.findByProps({accessibilityLabel: 'Save'}).props.onPress();
    });
    await flushSubmit();

    expect(mockedSaveProfile).toHaveBeenCalledWith({name: 'Ada Byron', email: 'ada@example.com'});
    expect(useProfileStore.getState().profile?.name).toBe('Ada Byron');
    expect(tree.root.findByProps({children: 'Ada Byron'})).toBeTruthy();
    // Back in view mode — the Save button is gone.
    expect(() => tree.root.findByProps({accessibilityLabel: 'Save'})).toThrow();
  });

  it('an invalid email shows an inline error and never calls saveProfile (gap f)', async () => {
    const tree = renderScreen();

    act(() => {
      tree.root.findByProps({accessibilityLabel: 'Edit profile'}).props.onPress();
    });
    fillField(tree, 1, 'not-an-email');

    act(() => {
      tree.root.findByProps({accessibilityLabel: 'Save'}).props.onPress();
    });
    await flushSubmit();

    expect(mockedSaveProfile).not.toHaveBeenCalled();
    expect(tree.root.findByProps({children: 'a valid email is required'})).toBeTruthy();
    // Still in edit mode.
    expect(tree.root.findByProps({accessibilityLabel: 'Save'})).toBeTruthy();
  });

  it('Cancel discards the edit and returns to the view without saving', () => {
    const tree = renderScreen();

    act(() => {
      tree.root.findByProps({accessibilityLabel: 'Edit profile'}).props.onPress();
    });
    fillField(tree, 0, 'Someone Else');

    act(() => {
      tree.root.findByProps({accessibilityLabel: 'Cancel'}).props.onPress();
    });

    expect(mockedSaveProfile).not.toHaveBeenCalled();
    expect(useProfileStore.getState().profile).toEqual(PROFILE);
    expect(tree.root.findByProps({children: 'Ada Lovelace'})).toBeTruthy();
  });

  it('the theme segmented control renders the current mode, and selecting Dark calls setMode (FR3/FR4)', () => {
    useThemeStore.setState({mode: 'system'});
    const tree = renderScreen();

    const segments = tree.root.findAllByProps({accessibilityRole: 'tab'});
    const systemSegment = segments.find(segment => segment.props.accessibilityLabel === 'System')!;
    expect(systemSegment.props.accessibilityState).toEqual({selected: true});

    const darkSegment = segments.find(segment => segment.props.accessibilityLabel === 'Dark')!;
    act(() => {
      darkSegment.props.onPress();
    });

    expect(useThemeStore.getState().mode).toBe('dark');
  });
});
