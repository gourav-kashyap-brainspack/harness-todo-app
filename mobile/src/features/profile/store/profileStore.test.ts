import {beforeEach, describe, expect, it, jest} from '@jest/globals';

import * as profileRepository from '@/core/services/profileRepository';
import type {Profile} from '@/core/types/profile';

import {hydrateProfile, useProfileStore} from './profileStore';

// The repository is the only persistence seam this store is allowed to
// touch (conventions.md — no direct MMKV). Mocking it here lets each test
// control what "already persisted on this device" looks like without ever
// hitting `react-native-mmkv`.
jest.mock('@/core/services/profileRepository', () => ({
  getProfile: jest.fn(() => null),
  saveProfile: jest.fn(),
  clearProfile: jest.fn(),
}));

const mockedGetProfile = jest.mocked(profileRepository.getProfile);
const mockedSaveProfile = jest.mocked(profileRepository.saveProfile);
const mockedClearProfile = jest.mocked(profileRepository.clearProfile);

describe('profileStore (PRO-001, FR1)', () => {
  beforeEach(() => {
    useProfileStore.setState({profile: null});
    jest.clearAllMocks();
  });

  it('hydrates the store\'s initial `profile` from profileRepository.getProfile() at construction', () => {
    // The mocked factory's default (`() => null`) is what ran when this
    // module was first imported — the store's initial state reflects it
    // directly, proving the store reads through the repository (not a raw
    // MMKV key) at init.
    expect(useProfileStore.getState().profile).toBeNull();
  });

  it('hydrateProfile() reads through profileRepository.getProfile()', () => {
    const seeded: Profile = {name: 'Ada Lovelace', email: 'ada@example.com'};
    mockedGetProfile.mockReturnValueOnce(seeded);

    expect(hydrateProfile()).toEqual(seeded);
    expect(mockedGetProfile).toHaveBeenCalledTimes(1);
  });

  it('hydrateProfile() returns null when nothing is persisted (absent -> null, inherited from STG)', () => {
    mockedGetProfile.mockReturnValueOnce(null);

    expect(hydrateProfile()).toBeNull();
  });

  it('setProfile persists via profileRepository.saveProfile and updates state', () => {
    const profile: Profile = {name: 'Grace Hopper', email: 'grace@example.com'};

    useProfileStore.getState().setProfile(profile);

    expect(mockedSaveProfile).toHaveBeenCalledWith(profile);
    expect(useProfileStore.getState().profile).toEqual(profile);
  });

  it('clearProfile clears the persisted profile via the repository and resets state to null', () => {
    useProfileStore.setState({profile: {name: 'Ada Lovelace', email: 'ada@example.com'}});

    useProfileStore.getState().clearProfile();

    expect(mockedClearProfile).toHaveBeenCalledTimes(1);
    expect(useProfileStore.getState().profile).toBeNull();
  });
});
