import {describe, expect, it} from '@jest/globals';

import {buildNavigationTheme} from './navigationTheme';

/**
 * Direct assertions against docs/context/design-system.md's Color tokens
 * tables for BOTH schemes (code review, FND-003: the dark branch was
 * previously only exercised implicitly, never asserted against its actual
 * values).
 */
describe('buildNavigationTheme (FND-003, FR4)', () => {
  it('resolves the light-scheme nav theme from design-system.md tokens', () => {
    const theme = buildNavigationTheme('light');

    expect(theme.dark).toBe(false);
    expect(theme.colors).toEqual({
      primary: 'rgb(11, 110, 127)',
      background: 'rgb(246, 244, 241)',
      card: 'rgb(250, 248, 245)',
      text: 'rgb(30, 27, 24)',
      border: 'rgb(228, 223, 216)',
      notification: 'rgb(179, 38, 30)',
    });
  });

  it('resolves the dark-scheme nav theme from design-system.md tokens', () => {
    const theme = buildNavigationTheme('dark');

    expect(theme.dark).toBe(true);
    expect(theme.colors).toEqual({
      primary: 'rgb(23, 120, 111)',
      background: 'rgb(18, 24, 26)',
      card: 'rgb(26, 34, 36)',
      text: 'rgb(237, 239, 239)',
      border: 'rgb(44, 55, 58)',
      notification: 'rgb(229, 100, 90)',
    });
  });
});
