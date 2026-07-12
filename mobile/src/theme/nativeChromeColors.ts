import type {ResolvedScheme} from '@/core/store/themeStore';

/**
 * Native-chrome RGB tokens (FND-002/FND-003) — the SINGLE source for every
 * surface that must hand a flat color STRING (not a NativeWind `className`)
 * to something native-only: React Navigation's `Theme` object
 * (`navigationTheme.ts`), the bottom-tab bar's active/inactive tint props
 * (`TabNavigator.tsx`), and the OS status bar (`ThemeProvider.tsx`). These
 * surfaces can't resolve NativeWind's `rgb(var(--color-x))` CSS-variable
 * indirection — there's no CSS custom-property runtime backing native
 * chrome the way there is for `className`-driven RN views.
 *
 * This is a documented, deliberate exception to "tokens only via className"
 * (same shape as FND-002's ActivityIndicator-color exception) — every
 * triplet below is copied VERBATIM from docs/context/design-system.md's
 * Color tokens tables, never invented independently. A palette change is a
 * design-agent decision mirrored here, not a per-consumer edit — previously
 * `navigationTheme.ts` and `TabNavigator.tsx` each hand-maintained their own
 * copy of this map; consolidated per code review (FND-003) to remove that
 * drift risk.
 */
export const NATIVE_CHROME_RGB: Record<
  ResolvedScheme,
  {
    bg: string;
    surface: string;
    text: string;
    textMuted: string;
    border: string;
    primary: string;
    danger: string;
    success: string;
  }
> = {
  light: {
    bg: '246 244 241', // `bg` token
    surface: '250 248 245', // `surface` token — nav bar / tab bar / header background
    text: '30 27 24', // `text` token
    textMuted: '91 86 79', // `text-muted` token — inactive tab tint
    border: '228 223 216', // `border` token
    primary: '11 110 127', // `primary` token — active tab tint / nav accent
    danger: '179 38 30', // `danger` token — reused for nav's "notification" slot (no separate semantic; design-system.md anti-pattern #8)
    success: '46 125 79', // `success` token (design-system.md Color tokens) — first native-prop consumer: TaskDetailScreen's Toggle icon (TSK-004)
  },
  dark: {
    bg: '18 24 26',
    surface: '26 34 36',
    text: '237 239 239',
    textMuted: '154 166 168',
    border: '44 55 58',
    primary: '23 120 111',
    danger: '229 100 90',
    success: '79 174 114',
  },
};

/** `"R G B"` -> `"rgb(R, G, B)"`. */
export function rgbFromTriplet(spaceSeparatedTriplet: string): string {
  return `rgb(${spaceSeparatedTriplet.split(' ').join(', ')})`;
}
