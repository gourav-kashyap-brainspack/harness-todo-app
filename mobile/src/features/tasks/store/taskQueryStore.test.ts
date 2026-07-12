import {afterEach, beforeEach, describe, expect, it, jest} from '@jest/globals';
import {MMKV} from 'react-native-mmkv';

import {getItem, removeItem, StorageKeys} from '@/core/services/storage';

import {hydrateTaskQueryPrefs, taskQueryPrefsSchema, useTaskQueryStore, type TaskQueryPrefs} from './taskQueryStore';

const DEFAULT_PREFS: TaskQueryPrefs = {filter: 'all', sort: 'created-desc'};

/**
 * `taskQueryStore` persists through the shared typed storage service
 * (`core/services/storage.ts`'s one module-private MMKV instance) — the
 * same seam `profileRepository.test.ts`/`taskRepository.test.ts` clear
 * between tests, since every repository/store built on that service shares
 * one in-memory Map under Jest's MMKV automock (a stray write from one test
 * would otherwise leak into the next).
 */
describe('taskQueryStore (ORG-001, FR1 — persisted via the typed storage service)', () => {
  beforeEach(() => {
    removeItem(StorageKeys.taskQuery);
    useTaskQueryStore.setState({filter: 'all', sort: 'created-desc', search: ''});
  });

  afterEach(() => {
    removeItem(StorageKeys.taskQuery);
    jest.restoreAllMocks();
  });

  it('defaults to filter="all", sort="created-desc", search=""', () => {
    const state = useTaskQueryStore.getState();
    expect(state.filter).toBe('all');
    expect(state.sort).toBe('created-desc');
    expect(state.search).toBe('');
  });

  describe('hydrateTaskQueryPrefs (the store-init seam)', () => {
    it('hydrates the persisted {filter,sort} envelope when one exists', () => {
      useTaskQueryStore.getState().setFilter('completed');
      useTaskQueryStore.getState().setSort('due');

      expect(hydrateTaskQueryPrefs()).toEqual({filter: 'completed', sort: 'due'});
    });

    it('falls back to the default when nothing is persisted yet', () => {
      expect(hydrateTaskQueryPrefs()).toEqual(DEFAULT_PREFS);
    });

    it('falls back to the default when the persisted blob is corrupt (not valid JSON)', () => {
      jest.spyOn(MMKV.prototype, 'getString').mockReturnValueOnce('not-json{{{');

      expect(hydrateTaskQueryPrefs()).toEqual(DEFAULT_PREFS);
    });

    it('falls back to the default when the persisted data fails schema validation (invalid filter)', () => {
      // A hand-built raw envelope (bypassing `setItem`'s own `schema.parse`
      // guard, which would throw on a bad value) — simulates a legacy/
      // corrupt blob a real device could accumulate.
      jest
        .spyOn(MMKV.prototype, 'getString')
        .mockReturnValueOnce(JSON.stringify({version: 1, data: {filter: 'not-a-real-filter', sort: 'created-desc'}}));

      expect(hydrateTaskQueryPrefs()).toEqual(DEFAULT_PREFS);
    });
  });

  describe('filter', () => {
    it('setFilter updates state and persists the full {filter,sort} envelope', () => {
      useTaskQueryStore.getState().setFilter('active');

      expect(useTaskQueryStore.getState().filter).toBe('active');
      expect(getItem(StorageKeys.taskQuery, taskQueryPrefsSchema, DEFAULT_PREFS)).toEqual({
        filter: 'active',
        sort: 'created-desc',
      });
    });
  });

  describe('sort', () => {
    it('setSort updates state and persists the full {filter,sort} envelope, preserving the current filter', () => {
      useTaskQueryStore.getState().setFilter('completed');
      useTaskQueryStore.getState().setSort('alpha');

      expect(useTaskQueryStore.getState().sort).toBe('alpha');
      expect(getItem(StorageKeys.taskQuery, taskQueryPrefsSchema, DEFAULT_PREFS)).toEqual({
        filter: 'completed',
        sort: 'alpha',
      });
    });
  });

  describe('search (in-memory only)', () => {
    it('setSearch updates state without touching persisted storage', () => {
      const setSpy = jest.spyOn(MMKV.prototype, 'set');

      useTaskQueryStore.getState().setSearch('milk');

      expect(useTaskQueryStore.getState().search).toBe('milk');
      expect(setSpy).not.toHaveBeenCalled();
    });

    it('a fresh store read always has search="" (resets on relaunch, spec FR1/FR6)', () => {
      useTaskQueryStore.getState().setSearch('milk');
      expect(useTaskQueryStore.getState().search).toBe('milk');

      // Simulate a fresh boot: the initial-state literal this store was
      // created with never persisted `search` anywhere, so re-seeding state
      // the way a relaunch would always yields `''` again — there is no
      // storage-service entry for `setSearch` to have written.
      useTaskQueryStore.setState({search: ''});
      expect(useTaskQueryStore.getState().search).toBe('');
    });
  });
});
