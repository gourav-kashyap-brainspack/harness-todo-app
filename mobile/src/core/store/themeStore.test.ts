import {afterEach, beforeEach, describe, expect, it, jest} from '@jest/globals';
import {MMKV} from 'react-native-mmkv';

import {
  readPersistedMode,
  THEME_MODE_STORAGE_KEY,
  useThemeStore,
} from '@/core/store/themeStore';

// `react-native-mmkv` auto-mocks itself under Jest (per its own README —
// `isJest()` swaps in an in-memory Map, no `jest.mock()` needed), but each
// `new MMKV()` gets its OWN isolated Map regardless of `id` — so a test
// instance can't share storage with themeStore.ts's module-private
// instance. Spying on `MMKV.prototype` (real automock methods, call-through
// by default) observes/seeds the *same* instance the store actually uses.
describe('themeStore', () => {
  beforeEach(() => {
    useThemeStore.setState({mode: 'system', resolvedScheme: 'light'});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('defaults mode to "system"', () => {
    expect(useThemeStore.getState().mode).toBe('system');
  });

  it('reacts live to OS scheme changes while mode is "system" (FR5)', () => {
    useThemeStore.getState().syncSystemScheme('dark');
    expect(useThemeStore.getState().resolvedScheme).toBe('dark');

    useThemeStore.getState().syncSystemScheme('light');
    expect(useThemeStore.getState().resolvedScheme).toBe('light');
  });

  it('setMode overrides the resolved scheme and persists it to MMKV', () => {
    const setSpy = jest.spyOn(MMKV.prototype, 'set');

    useThemeStore.getState().setMode('dark');

    expect(useThemeStore.getState().mode).toBe('dark');
    expect(useThemeStore.getState().resolvedScheme).toBe('dark');
    expect(setSpy).toHaveBeenCalledWith(THEME_MODE_STORAGE_KEY, 'dark');
  });

  it('ignores OS scheme changes once a manual override is set', () => {
    useThemeStore.getState().setMode('dark');
    useThemeStore.getState().syncSystemScheme('light');

    expect(useThemeStore.getState().resolvedScheme).toBe('dark');
  });

  it('setMode("system") hands resolution back to the OS scheme', () => {
    useThemeStore.getState().setMode('dark');
    useThemeStore.getState().setMode('system');
    useThemeStore.getState().syncSystemScheme('light');

    expect(useThemeStore.getState().mode).toBe('system');
    expect(useThemeStore.getState().resolvedScheme).toBe('light');
  });

  it('restores a persisted mode from MMKV on boot', () => {
    jest.spyOn(MMKV.prototype, 'getString').mockReturnValueOnce('dark');

    expect(readPersistedMode()).toBe('dark');
  });

  it('falls back to "system" for a corrupt/unrecognized persisted value', () => {
    jest.spyOn(MMKV.prototype, 'getString').mockReturnValueOnce('not-a-real-mode');

    expect(readPersistedMode()).toBe('system');
  });

  it('falls back to "system" when nothing is persisted yet', () => {
    expect(readPersistedMode()).toBe('system');
  });
});
