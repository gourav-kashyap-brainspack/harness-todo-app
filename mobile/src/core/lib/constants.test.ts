import {describe, expect, it} from '@jest/globals';
// Proves the `@/*` path alias resolves at test time (FR4 / FND-001 test plan).
import {APP_NAME} from '@/core/lib';

describe('core/lib constants', () => {
  it('resolves via the @/ path alias', () => {
    expect(APP_NAME).toBe('Todo App');
  });
});
