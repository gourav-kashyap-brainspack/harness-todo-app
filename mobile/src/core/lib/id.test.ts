import {describe, expect, it} from '@jest/globals';

import {newId} from '@/core/lib/id';

describe('newId', () => {
  it('returns a non-empty string', () => {
    const id = newId();

    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('returns a valid RFC4122 v4 uuid', () => {
    const uuidV4Pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    expect(newId()).toMatch(uuidV4Pattern);
  });

  it('returns a unique id on every call', () => {
    const ids = Array.from({length: 50}, () => newId());

    expect(new Set(ids).size).toBe(ids.length);
  });
});
