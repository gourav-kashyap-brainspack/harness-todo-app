# Design System — Todo App

> Owned by the **design** agent; implemented by **frontend**. Code is the source of truth
> (NativeWind tokens: `mobile/tailwind.config.js` + `global.css` + `src/theme` + owned `src/components/ui`).
> Frozen at genesis (FND-002) — this is the anchor task. Reused everywhere after; re-opened only via a deliberate design-agent decision, never re-decided per screen.

## Design intent

Todo App is a calm, fast, focus-first tool — not a cheerful gamified habit-tracker, not a somber enterprise dashboard. The palette centers on **Signal Teal**, a deep, muted teal-blue spent *only* on actions and focus states, against a quiet warm-neutral canvas — never stark white, never cream, never near-black. Layout stays disciplined (two font weights per screen max, a strict 4pt rhythm, soft 20dp cards with barely-there elevation) so the one deliberate flash of color — the primary action — is what the eye lands on. It should read like a well-made notebook app: quiet, confident, quick to scan, never cutesy.

**Signature element:** the 20dp soft-radius task card + hairline border (near-zero shadow) is the one recurring shape motif; **Signal Teal is the one recurring color accent** (FAB, primary buttons, active tab, focus ring, links). Everywhere else is disciplined ink-on-paper neutrals — boldness is spent in exactly these two places, nowhere else.

## Color tokens

Format stored as **space-separated RGB triplets** in CSS variables (`--color-x: R G B`) so Tailwind's `rgb(var(--color-x) / <alpha-value>)` pattern gets opacity-modifier support for free (`bg-primary/10` for a selected-row tint, etc.) — see Implementation handoff below.

### Light theme

| token | hex | RGB | usage |
|---|---|---|---|
| `bg` | `#F6F4F1` | `246 244 241` | screen canvas (darkest/base of the light elevation ramp) |
| `surface` | `#FAF8F5` | `250 248 245` | nav bar, tab bar, input fields — one step above `bg` |
| `card` | `#FFFFFF` | `255 255 255` | task cards, sheets, modals — most elevated, brightest |
| `text` | `#1E1B18` | `30 27 24` | primary text/icons (warm ink, **not** pure black) |
| `text-muted` | `#5B564F` | `91 86 79` | secondary text, timestamps, placeholders |
| `border` | `#E4DFD8` | `228 223 216` | hairlines, card outline, dividers |
| `primary` | `#0B6E7F` | `11 110 127` | Signal Teal — FAB, primary buttons, active tab, focus ring, links |
| `primary-fg` | `#FFFFFF` | `255 255 255` | text/icon ON `primary` (and on `success`/`danger`/`warning` fills — see rule below) |
| `success` | `#2E7D4F` | `46 125 79` | completed-state text/icon/badge |
| `danger` | `#B3261E` | `179 38 30` | destructive text/icon/badge, validation errors |
| `warning` | `#8A5A00` | `138 90 0` | due-soon / caution text/icon/badge |

### Dark theme

| token | hex | RGB | usage |
|---|---|---|---|
| `bg` | `#12181A` | `18 24 26` | screen canvas (darkest — real dark, not `#000`) |
| `surface` | `#1A2224` | `26 34 36` | nav bar, tab bar, input fields |
| `card` | `#242F32` | `36 47 50` | task cards, sheets, modals — most elevated |
| `text` | `#EDEFEF` | `237 239 239` | primary text/icons (soft near-white, **not** `#FFF`) |
| `text-muted` | `#9AA6A8` | `154 166 168` | secondary text, timestamps, placeholders |
| `border` | `#2C373A` | `44 55 58` | hairlines, card outline, dividers |
| `primary` | `#17786F` | `23 120 111` | Signal Teal, brightened from light-mode value for dark-bg visibility |
| `primary-fg` | `#FFFFFF` | `255 255 255` | text/icon ON `primary` (kept white — primary stays the calm anchor, not brightened as hard as the alert colors) |
| `success` | `#4FAE72` | `79 174 114` | brightened for dark-bg legibility |
| `danger` | `#E5645A` | `229 100 90` | brightened for dark-bg legibility |
| `warning` | `#E0A526` | `224 165 38` | brightened for dark-bg legibility |

**On-fill text rule** (avoids inventing extra tokens): when `success`/`danger`/`warning` are used as a **filled** badge/pill background —
- **light theme:** text/icon = `primary-fg` (white) — validated ≥4.5:1 on all three fills.
- **dark theme:** text/icon = `bg`'s own value (dark ink) reused — the alert colors are brightened enough in dark mode that white text would fail; the dark canvas ink passes ≥4.5:1 instead. No new token — just reuse `bg`.

**No separate `muted`/`accent` token added.** `text-muted` already covers de-emphasis; `card`/`surface` already cover elevation. A genuinely new semantic need is a design-agent decision recorded here first — never a per-screen invention (see Anti-patterns).

### WCAG AA contrast — targeted ratios (verified, sRGB relative-luminance method)

| pairing | light | dark |
|---|---|---|
| `text` on `bg` | 15.6 : 1 | 15.5 : 1 |
| `text` on `card` | ≥15 : 1 (card lighter than bg) | 12.7 : 1 |
| `text-muted` on `bg` | 6.6 : 1 | 7.2 : 1 |
| `primary-fg` on `primary` | 5.9 : 1 | 5.3 : 1 |
| on-fill text on `success` | 5.1 : 1 (white) | 6.5 : 1 (ink) |
| on-fill text on `danger` | 6.5 : 1 (white) | 5.4 : 1 (ink) |
| on-fill text on `warning` | 5.9 : 1 (white) | 8.2 : 1 (ink) |
| `success`/`danger`/`warning` as plain text/icon on `bg` | 4.6–6.0 : 1 | 6.5–8.2 : 1 |

All pairings clear the **4.5:1** AA body-text bar (several clear AAA's 7:1). `primary` and the alert colors were also checked for non-text (icon/border) visibility against their theme's `bg` at ≥3:1 (e.g. dark-mode `primary` vs dark `bg` = 3.4:1) so buttons/icons stay legible, not just their labels.

**No pure black (`#000`), no pure white text on dark, no default-RN-blue** (`#2196F3`/`#007AFF`) anywhere in the palette — Signal Teal is the only brand hue, and it is deliberately deep/muted rather than saturated-bright, so it reads as calm rather than "app-default."

## Type scale

Sizes in dp (RN's scalable unit — respects OS `fontScale` by default; **never** set `allowFontScaling={false}` on body/label text). Typeface: **system default** (San Francisco / Roboto) for this task — custom font-asset linking is out of FND-002's scope (spec FR1 is sizes/weights only); if a distinctive display face is wanted later, that's a small follow-up foundation task (font linking), not a per-screen decision. Differentiation for now comes from weight discipline + the color/shape signature above, not typeface.

| token | size / line-height | weight | usage |
|---|---|---|---|
| `text-xs` | 12 / 16 | 500 (medium) | captions, meta (timestamps, counts) |
| `text-sm` | 14 / 20 | 400 (regular) | secondary body, list subtext |
| `text-base` | 16 / 24 | 400 (regular) | primary body, task titles |
| `text-lg` | 18 / 26 | 600 (semibold) | small section headers |
| `text-xl` | 20 / 28 | 600 (semibold) | screen titles |
| `text-2xl` | 24 / 32 | 700 (bold) | Home greeting header |
| `text-3xl` | 30 / 38 | 700 (bold) | rare large display (empty-state headline) |

**Rule:** max **2** weights visible per screen (typically 400 + 600); reserve 700 for the one largest element on a screen, if any.

## Spacing + radius

4pt grid — reuse NativeWind/Tailwind's default numeric spacing scale as-is (it's already 4px-stepped); the steps this product actually uses:

| step | dp | typical use |
|---|---|---|
| `1` | 4 | icon-to-label gap |
| `2` | 8 | tight stack gap |
| `3` | 12 | input internal padding |
| `4` | 16 | card padding, screen horizontal margin |
| `5` | 20 | inter-card gap |
| `6` | 24 | section gap |
| `8` | 32 | screen top/bottom margin |
| `12` | 48 | large empty-state spacing |

Radius tokens (`borderRadius`):

| token | value | usage |
|---|---|---|
| `radius-sm` | 6px | checkboxes, small chips |
| `radius-md` | 12px | buttons, text inputs |
| `radius-lg` | 20px | task cards, sheets/modals — the signature shape |
| `radius-full` | 9999px | FAB, avatar, pill badges |

## Component inventory

_(empty — no `src/components/ui` primitives built yet; grown per UI task starting the next module.)_

## Anti-patterns / banned defaults

1. **No pure-black (`#000`) text, no pure-white on dark** — always the ink/paper tokens above.
2. **No default React Native / platform blue** (`#2196F3`, `#007AFF`) as primary or any accent — Signal Teal (`#0B6E7F` / `#17786F`) is the only brand hue.
3. **No color-only state signaling** — every `success`/`danger`/`warning` use pairs with an icon or text label, never a bare colored dot/border alone.
4. **No hardcoded hex in components** — only the semantic tokens via NativeWind `className` (e.g. `bg-bg`, `text-text`, `bg-primary`); a genuinely new value goes through the design agent, never inline in a screen.
5. **No drop shadows heavier than the `radius-lg` card's default** (subtle 1–2dp elevation in light mode only); **dark mode uses no shadow at all** — elevation is the `bg` < `surface` < `card` lightness ramp + a hairline `border`, per real dark-theme practice.
6. **No more than 2 font weights visible on one screen.**
7. **No spacing below/off the 4pt grid** — no one-off arbitrary padding values.
8. **No inventing a new semantic color per screen** (e.g. a one-off "overdue-orange") — reuse `danger`/`warning`; a real new semantic need is a design-agent decision recorded here first.

## Implementation handoff — NativeWind 4 CSS-variable strategy

Grounded against current NativeWind 4.x docs (Context7) — installed pins: `nativewind ^4.1.23`, `tailwindcss ^3.4.19`.

**Mechanism:** NativeWind 4's default `dark:` variant tracks the OS only (`darkMode: 'media'`). Because FND-002 needs a **manual override** (`mode: 'system'|'light'|'dark'` in the Zustand `themeStore`), `tailwind.config.js` must set **`darkMode: 'class'`** — with `'media'` set, NativeWind's runtime throws ("Cannot manually set color scheme, as dark mode is type 'media'"). Arbitrary-value `var(--x)` references and `:root { --x: ... }` / `.dark { --x: ... }` variable blocks in `global.css` are both supported by the NativeWind/Tailwind v3 CSS pipeline.

1. **`mobile/global.css`** — add a `:root` block (light values) and a `.dark` block (dark values) using the RGB triplets from the tables above, e.g.:
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;

   :root {
     --color-bg: 246 244 241;
     --color-surface: 250 248 245;
     --color-card: 255 255 255;
     --color-text: 30 27 24;
     --color-text-muted: 91 86 79;
     --color-border: 228 223 216;
     --color-primary: 11 110 127;
     --color-primary-fg: 255 255 255;
     --color-success: 46 125 79;
     --color-danger: 179 38 30;
     --color-warning: 138 90 0;
   }

   .dark {
     --color-bg: 18 24 26;
     --color-surface: 26 34 36;
     --color-card: 36 47 50;
     --color-text: 237 239 239;
     --color-text-muted: 154 166 168;
     --color-border: 44 55 58;
     --color-primary: 23 120 111;
     --color-primary-fg: 255 255 255;
     --color-success: 79 174 114;
     --color-danger: 229 100 90;
     --color-warning: 224 165 38;
   }
   ```
2. **`mobile/tailwind.config.js`** — set `darkMode: 'class'` and map every semantic token to `rgb(var(--color-x) / <alpha-value>)` under `theme.extend.colors`, plus `fontSize`/`borderRadius` from the scales above. Components then author **once**, with plain semantic classNames (`bg-bg`, `text-text`, `bg-primary text-primary-fg`) — **never** `dark:`-prefixed color variants; the variable swap under the active `.dark` root does the theming automatically. (`dark:` variants stay legitimate for **non-color** dark-specific tweaks only, e.g. `dark:shadow-none` per anti-pattern #5.)
3. **`src/theme` / `ThemeProvider`** — the resolved-scheme value (`'light'|'dark'`, derived in the Zustand store from `mode` + `Appearance`/`useColorScheme()`) must be pushed into NativeWind's runtime setter every time it changes, so the `.dark` root class actually flips. The docs indexed today reference this as `colorScheme.set(...)` (guarded by the `darkMode:'class'` config above) — **verify the exact current export name against the installed `nativewind@4.1.23` typings at implementation time** (the package's own `useColorScheme` re-export is flagged deprecated in favor of React Native's read-only hook, so the *setter* is a distinct runtime API — don't assume the re-export name without checking `node_modules/nativewind`).
4. Badge/pill components implementing the **on-fill text rule** above should reference `primary-fg` (light) / `bg` (dark) directly — do not add a new `on-fill` token unless a real case can't be expressed this way.

## Changelog
- 2026-07-10 — design agent: initial tokens (light+dark), type/spacing/radius scales, anti-patterns, and NativeWind 4 CSS-variable handoff written for FND-002.
