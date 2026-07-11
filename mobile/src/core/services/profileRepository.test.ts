import {afterEach, describe, expect, it, jest} from '@jest/globals';
import {MMKV} from 'react-native-mmkv';

import {clearProfile, getProfile, saveProfile} from '@/core/services/profileRepository';
import type {Profile} from '@/core/types/profile';

// Same testability note as storage.test.ts: `react-native-mmkv` auto-mocks
// itself under Jest, but every `new MMKV()` (this repository -> storage.ts
// -> a module-private default instance) shares one in-memory Map, so a
// prior test's `StorageKeys.profile` write is visible to a later test.
// `clearProfile()` at the top of each test keeps them isolated.
const VALID_PROFILE: Profile = {name: 'Ada Lovelace', email: 'ada@example.com'};

describe('profileRepository', () => {
  afterEach(() => {
    clearProfile();
    jest.restoreAllMocks();
  });

  it('round-trips a saved profile', () => {
    saveProfile(VALID_PROFILE);

    expect(getProfile()).toEqual(VALID_PROFILE);
  });

  it('returns null when no profile has ever been saved', () => {
    expect(getProfile()).toBeNull();
  });

  it('returns null (never throws) when the persisted blob is corrupt', () => {
    jest.spyOn(MMKV.prototype, 'getString').mockReturnValueOnce('not-json{{{');

    let result: Profile | null | undefined;
    expect(() => {
      result = getProfile();
    }).not.toThrow();
    expect(result).toBeNull();
  });

  it('clearProfile removes the persisted profile', () => {
    saveProfile(VALID_PROFILE);
    expect(getProfile()).toEqual(VALID_PROFILE);

    clearProfile();

    expect(getProfile()).toBeNull();
  });

  it('clearProfile is a no-op when nothing was ever saved', () => {
    expect(() => clearProfile()).not.toThrow();
    expect(getProfile()).toBeNull();
  });

  it('guards saveProfile against a Zod-invalid profile (bad email)', () => {
    expect(() =>
      saveProfile({name: 'Ada Lovelace', email: 'not-an-email'} as Profile),
    ).toThrow();
  });

  it('guards saveProfile against a Zod-invalid profile (empty name)', () => {
    expect(() => saveProfile({name: '', email: 'ada@example.com'} as Profile)).toThrow();
  });
});
