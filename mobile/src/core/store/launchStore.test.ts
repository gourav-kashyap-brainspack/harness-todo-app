import {afterEach, beforeEach, describe, expect, it, jest} from '@jest/globals';
import {MMKV} from 'react-native-mmkv';

import {
  HAS_LAUNCHED_STORAGE_KEY,
  readHasLaunched,
  useLaunchStore,
} from '@/core/store/launchStore';

// Same testability note as themeStore.test.ts: `react-native-mmkv`
// auto-mocks itself under Jest, but each `new MMKV()` gets its own isolated
// in-memory Map regardless of `id` — spying on `MMKV.prototype` observes/
// seeds the same instance `launchStore.ts`'s module-private instance uses.
describe('launchStore', () => {
  beforeEach(() => {
    useLaunchStore.setState({hasLaunched: false});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('defaults hasLaunched to false when nothing is persisted yet (fresh install)', () => {
    expect(readHasLaunched()).toBe(false);
  });

  it('reads a persisted true flag (returning user)', () => {
    jest.spyOn(MMKV.prototype, 'getBoolean').mockReturnValueOnce(true);

    expect(readHasLaunched()).toBe(true);
  });

  it('falls back to false for a non-boolean persisted value (FR6, corrupted flag)', () => {
    // MMKV's own typings only return boolean|undefined for `getBoolean`, but
    // a corrupted store (wrong type written under this key, e.g. by a
    // future migration bug) is exactly what FR6 guards against — simulate
    // it directly since a real corrupt store can't be constructed via the
    // typed mock API.
    jest
      .spyOn(MMKV.prototype, 'getBoolean')
      .mockReturnValueOnce('not-a-boolean' as unknown as boolean);

    expect(readHasLaunched()).toBe(false);
  });

  it('falls back to false when the underlying read throws (FR6, never crash on boot)', () => {
    jest.spyOn(MMKV.prototype, 'getBoolean').mockImplementationOnce(() => {
      throw new Error('simulated MMKV corruption');
    });

    expect(() => readHasLaunched()).not.toThrow();
    expect(readHasLaunched()).toBe(false);
  });

  it('setHasLaunched flips the store to true and persists it to MMKV', () => {
    const setSpy = jest.spyOn(MMKV.prototype, 'set');

    useLaunchStore.getState().setHasLaunched();

    expect(useLaunchStore.getState().hasLaunched).toBe(true);
    expect(setSpy).toHaveBeenCalledWith(HAS_LAUNCHED_STORAGE_KEY, true);
  });
});
