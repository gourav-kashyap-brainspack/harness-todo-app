import {describe, expect, it} from '@jest/globals';

import {profileSchema} from '@/core/types/profile';

describe('profileSchema', () => {
  it('accepts a valid profile with name + email (photo omitted)', () => {
    const result = profileSchema.safeParse({name: 'Ada Lovelace', email: 'ada@example.com'});

    expect(result.success).toBe(true);
  });

  it('accepts a valid profile with an optional photo uri', () => {
    const result = profileSchema.safeParse({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      photo: 'file:///var/mobile/photo.jpg',
    });

    expect(result.success).toBe(true);
  });

  it('rejects a missing name', () => {
    const result = profileSchema.safeParse({email: 'ada@example.com'});

    expect(result.success).toBe(false);
  });

  it('rejects an empty/whitespace-only name', () => {
    expect(profileSchema.safeParse({name: '', email: 'ada@example.com'}).success).toBe(false);
    expect(profileSchema.safeParse({name: '   ', email: 'ada@example.com'}).success).toBe(false);
  });

  it('rejects a missing email', () => {
    const result = profileSchema.safeParse({name: 'Ada Lovelace'});

    expect(result.success).toBe(false);
  });

  it('rejects an invalid email', () => {
    const result = profileSchema.safeParse({name: 'Ada Lovelace', email: 'not-an-email'});

    expect(result.success).toBe(false);
  });
});
