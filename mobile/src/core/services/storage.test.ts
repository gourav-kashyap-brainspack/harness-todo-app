import {afterEach, describe, expect, it, jest} from '@jest/globals';
import {MMKV} from 'react-native-mmkv';
import {z} from 'zod';

import {
  CURRENT_STORAGE_VERSION,
  createPersistedValue,
  getItem,
  hasItem,
  removeItem,
  setItem,
} from '@/core/services/storage';

// Same testability note as launchStore.test.ts / themeStore.test.ts:
// `react-native-mmkv` auto-mocks itself under Jest, but each `new MMKV()`
// gets its own isolated in-memory Map regardless of `id` — spying on
// `MMKV.prototype` observes/seeds the same instance storage.ts's
// module-private `storage` singleton uses. Each test below uses a unique
// key so cases never collide on that one shared in-memory map.
const schema = z.object({name: z.string(), count: z.number()});
type Payload = z.infer<typeof schema>;
const fallback: Payload = {name: '', count: 0};

describe('storage service', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('setItem / getItem round trip', () => {
    it('round-trips a Zod-typed value and persists the {version, data} envelope shape', () => {
      const setSpy = jest.spyOn(MMKV.prototype, 'set');
      const value: Payload = {name: 'buy milk', count: 2};

      setItem('test.roundtrip', schema, value);
      const result = getItem('test.roundtrip', schema, fallback);

      expect(result).toEqual(value);

      // Assert the exact on-disk shape, not just round-trip behavior.
      const [writtenKey, writtenRaw] = setSpy.mock.calls[0] as [string, string];
      expect(writtenKey).toBe('test.roundtrip');
      expect(JSON.parse(writtenRaw)).toEqual({version: CURRENT_STORAGE_VERSION, data: value});
    });

    it('proves the service reads back through the same default MMKV instance it writes to', () => {
      // Real (non-mocked) MMKV resolves `new MMKV()` with no config to the
      // one shared default instance (id: 'mmkv.default') — see the spec-gap
      // (b) comment above `storage` in storage.ts. This exercises the
      // service's own public read/write pair end-to-end, which only
      // round-trips correctly if both go through that same instance.
      setItem('test.default-instance', schema, {name: 'same instance', count: 1});
      expect(getItem('test.default-instance', schema, fallback)).toEqual({
        name: 'same instance',
        count: 1,
      });
    });
  });

  describe('getItem fallback on every failure mode (F-038, never throw)', () => {
    it('falls back when the key is absent', () => {
      expect(getItem('test.absent-key', schema, fallback)).toEqual(fallback);
    });

    it('falls back on malformed JSON', () => {
      jest.spyOn(MMKV.prototype, 'getString').mockReturnValueOnce('not-json{{{');

      // Capture the single call's result inside the `not.toThrow()` check —
      // `mockReturnValueOnce` is consumed by the first `getItem` call, so a
      // second, separate call would silently fall through to the real
      // (empty) mock storage and test the absent-key path instead.
      let result: Payload | undefined;
      expect(() => {
        result = getItem('test.malformed', schema, fallback);
      }).not.toThrow();
      expect(result).toEqual(fallback);
    });

    it('falls back when the parsed value is not a {version, data} envelope', () => {
      jest.spyOn(MMKV.prototype, 'getString').mockReturnValueOnce(JSON.stringify({name: 'x'}));

      expect(getItem('test.no-envelope', schema, fallback)).toEqual(fallback);
    });

    it('falls back on an unknown/unhandled envelope version', () => {
      jest.spyOn(MMKV.prototype, 'getString').mockReturnValueOnce(
        JSON.stringify({version: 99, data: {name: 'future', count: 1}}),
      );

      expect(getItem('test.bad-version', schema, fallback)).toEqual(fallback);
    });

    it('falls back when the envelope data fails the Zod schema', () => {
      jest.spyOn(MMKV.prototype, 'getString').mockReturnValueOnce(
        JSON.stringify({version: CURRENT_STORAGE_VERSION, data: {wrong: 'shape'}}),
      );

      expect(getItem('test.bad-shape', schema, fallback)).toEqual(fallback);
    });

    it('falls back when the underlying MMKV read throws', () => {
      jest.spyOn(MMKV.prototype, 'getString').mockImplementationOnce(() => {
        throw new Error('simulated MMKV corruption');
      });

      // Same single-call capture as the malformed-JSON case above — the
      // `…Once` mock only covers the first call.
      let result: Payload | undefined;
      expect(() => {
        result = getItem('test.throws', schema, fallback);
      }).not.toThrow();
      expect(result).toEqual(fallback);
    });
  });

  describe('setItem programmer-error behavior', () => {
    it('throws (not swallowed) when the value itself fails the schema — a caller bug, not corrupt storage', () => {
      expect(() =>
        // reason: deliberately passing a shape that fails `schema` to exercise the validation path.
        setItem('test.invalid-write', schema, {count: 'not-a-number'} as unknown as Payload),
      ).toThrow();
    });
  });

  describe('removeItem / hasItem', () => {
    it('reports presence and removes a persisted key', () => {
      setItem('test.presence', schema, {name: 'temp', count: 1});
      expect(hasItem('test.presence')).toBe(true);

      removeItem('test.presence');

      expect(hasItem('test.presence')).toBe(false);
      expect(getItem('test.presence', schema, fallback)).toEqual(fallback);
    });

    it('hasItem is false for a key that was never set', () => {
      expect(hasItem('test.never-set')).toBe(false);
    });
  });

  describe('createPersistedValue (hydration helper, FR3/F-037)', () => {
    it('hydrate() falls back cleanly when nothing is persisted yet', () => {
      const persisted = createPersistedValue('test.hydrate-empty', schema, fallback);

      expect(persisted.hydrate()).toEqual(fallback);
    });

    it('a value written via persist() is reflected by hydrate() (simulates store init after a prior session)', () => {
      const persisted = createPersistedValue('test.hydrate-roundtrip', schema, fallback);

      persisted.persist({name: 'seeded', count: 5});

      // A fresh handle over the same key — models a new Zustand store
      // module calling `hydrate()` once at boot, in a later "session".
      const rehydrated = createPersistedValue('test.hydrate-roundtrip', schema, fallback);
      expect(rehydrated.hydrate()).toEqual({name: 'seeded', count: 5});
    });

    it('hydrate() falls back cleanly when the persisted value is corrupt', () => {
      jest.spyOn(MMKV.prototype, 'getString').mockReturnValueOnce('not-json{{{');
      const persisted = createPersistedValue('test.hydrate-corrupt', schema, fallback);

      // Same single-call capture as the getItem malformed-JSON case above.
      let result: Payload | undefined;
      expect(() => {
        result = persisted.hydrate();
      }).not.toThrow();
      expect(result).toEqual(fallback);
    });
  });

  describe('null as a legitimate persisted value (migrate() sentinel must not collide with it)', () => {
    it('round-trips a null payload under a nullable schema — NOT discarded as corrupt', () => {
      const nullableSchema = z.string().nullable();
      const warnSpy = jest.spyOn(console, 'warn');

      setItem('test.nullable-data', nullableSchema, null);
      const result = getItem('test.nullable-data', nullableSchema, 'fallback-sentinel');

      expect(result).toBeNull();
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });
});
