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

> **Built (FND-005, PR #7).** All three are theme-agnostic: author with plain semantic `className` tokens only (no `dark:` color variants — the `.dark` root swap handles both themes automatically, per Implementation handoff above). Registered as Tier-1 reuse-or-block patterns — see `patterns-registry.md`.

### `EmptyState` (F-030)

**Built:** `mobile/src/components/ui/EmptyState.tsx` (exported via `index.ts`).

| | |
|---|---|
| **Purpose** | Centered "nothing here" surface — no tasks, no completed tasks, no search results. Reused everywhere a list can be empty (ORG's F-031 reuses this; never forked). |
| **Props** | `{ title: string; message?: string; icon?: FeatherIconName; action?: { label: string; onPress: () => void } }` |
| **Layout** | `flex-1 items-center justify-center px-8`. Icon chip → `gap` of spacing step **6** (24dp) → title → step **2** (8dp) → message → step **6** (24dp) → action button. |
| **Icon treatment** | 64dp circular chip, `bg-primary/10` (opacity-modifier on the `primary` token — no new color), `rounded-full` (`radius-full` token). Inside: a **Feather** icon (`react-native-vector-icons/Feather`, already installed — first use in the app; establishes the app-wide icon-family convention), 28dp, colored `primary`. Decorative — hide from the accessibility tree (`accessibilityElementsHidden` / `importantForAccessibility="no-hide-descendants"`); the title+message carry the meaning, not the icon. This is a soft-chip-with-line-icon, deliberately **not** a bare floating glyph (default-RN-slop) and **not** a cutesy mascot illustration (no illustration/SVG/Lottie lib is installed — out of scope; a custom illustration set is a future foundation task, not invented here). |
| **Title** | `text-lg` (18/26, 600) `text-text`, centered, `max-w-xs` (Tailwind default scale — not a new value). |
| **Message** | `text-sm` (14/20, 400) `text-text-muted`, centered, `max-w-xs`. |
| **Action button** (optional) | `min-h-12 px-4 py-3 rounded-md bg-primary items-center justify-center` (48dp tall — `py-3`(12)+`text-base` line-height(24)+`py-3`(12) = 48, `min-h-12` as a floor); label `text-base font-semibold text-primary-fg`. `accessibilityRole="button"`, `accessibilityLabel={action.label}`. |
| **Tokens used** | `primary`, `primary/10`, `primary-fg`, `text`, `text-muted`, `radius-full`, `radius-md`, spacing steps 2/4/6/8, `text-lg`/`text-sm`/`text-base`. **No new tokens.** |
| **Light/Dark** | Fully automatic via the existing `.dark` variable swap — no conditional styling needed in the component. |

### `LoadingIndicator` (F-032)

**Built:** `mobile/src/components/ui/LoadingIndicator.tsx` (exported via `index.ts`).

| | |
|---|---|
| **Purpose** | Themed spinner shown while local data hydrates, and reused for pull-to-refresh (F-042). |
| **Props** | `{ label?: string }` — visible label is optional; the **screen-reader label is not** (always announces, default `"Loading…"`). |
| **Layout** | `items-center justify-center py-6` (spacing step 6/24dp). RN's `ActivityIndicator`, `size="large"`, then (only if `label` passed) `text-sm text-text-muted` below it with a step-2 (8dp) gap. |
| **Color** | `ActivityIndicator`'s `color` prop is a **native prop, not a style** — NativeWind `className` cannot reach it (same class of escape-hatch as the `StyleSheet` exception already in the patterns registry for third-party native wrappers). Resolve the **exact, already-documented** `primary` RGB triplet for the active `resolvedScheme` from `useTheme()` (light `rgb(11,110,127)` / dark `rgb(23,120,111)` — the same two values in the Color tokens table above) and pass it as `color={...}`. This is not a new hardcoded value and not a second source of truth — it is the one documented `primary` pair, just read where `className` can't apply. Do not invent a third value. |
| **A11y** | Wrapping `View` gets `accessible accessibilityRole="progressbar"` `accessibilityLabel={label ?? 'Loading…'}` `accessibilityLiveRegion="polite"` (Android) — announced without stealing focus, present even when no visible label is rendered. |
| **Tokens used** | `primary` (as a resolved value per above), `text-muted`, `text-sm`, spacing steps 2/6. **No new tokens.** |
| **Light/Dark** | Text label automatic via tokens; spinner color resolved per-scheme as above (the one native-prop exception in this inventory). |

### `Screen` / `Container` (F-046)

**Built:** `mobile/src/components/ui/Screen.tsx` (exported via `index.ts`).

| | |
|---|---|
| **Purpose** | The responsive layout root every screen mounts once — SafeArea insets + gutter + width capping. Establishes the app's one responsive convention; features consume it, never re-derive insets/gutters per screen. |
| **Props** | `{ children: ReactNode; edges?: Edge[]; scroll?: boolean; className?: string }` — `edges` defaults to all four (`['top','right','bottom','left']`; a screen under a nav-stack header can pass `edges={['bottom','left','right']}` to skip the top inset). `className` passthrough for screen-specific additions (keeps this a Tier-1 primitive, not a fork point). |
| **Layout** | `SafeAreaView` from **`react-native-safe-area-context`** (already installed — NOT the RN-core component), `edges={edges}`, `className={\`flex-1 bg-bg ${className ?? ''}\`}`. Inner content wrapper: `className="flex-1 w-full px-4 sm:max-w-2xl sm:self-center"` — `px-4` (16dp, the documented "screen horizontal margin" spacing step) is the gutter on any phone width; at the `sm:` breakpoint (Tailwind default 640dp — wider than any phone portrait width, so phones stay full-bleed) content caps at `max-w-2xl` and centers, so a large-screen/landscape/tablet viewport (PRD §11 "multiple mobile screen sizes") never stretches text edge-to-edge. Both `max-w-2xl` and the `sm:` breakpoint are **Tailwind's own default scale**, not arbitrary invented values. |
| **Scroll** | `scroll` prop (default `false`) wraps `children` in a `ScrollView` (`contentContainerClassName="flex-grow"`) instead of a plain `View` — for screens whose content can exceed viewport height. Keyboard-avoidance is a form concern, out of this primitive's scope. |
| **Orientation / resize** | No fixed pixel dimensions anywhere in the primitive — flex + relative widths handle rotation automatically. `useWindowDimensions()` (from `react-native`) is available for feature screens that need a conditional layout decision beyond what the `sm:` className breakpoint expresses (e.g. a landscape two-pane split) — the `Screen` primitive itself doesn't need it for the base case. |
| **Tokens used** | `bg` (canvas), spacing step 4 (`px-4`), Tailwind default `max-w-2xl`/`sm:` breakpoint. **No new tokens.** |
| **Light/Dark** | Automatic via `bg-bg`. |

**Missing tokens check:** none. All three primitives are fully expressible with the existing FND-002 palette/type/spacing/radius tokens plus Tailwind's own default `max-w-*`/opacity-modifier/breakpoint scales (framework defaults, not new invented values). The two native-prop color reads (`ActivityIndicator`, and the `Feather` icon if NativeWind `cssInterop` isn't wired for it) resolve to the *existing* `primary` RGB pair — never a new value.

## Accessibility baseline (F-047)

> The reference a11y contract every interactive primitive follows — `EmptyState`'s action button and `Screen`'s implicit "don't clip on large fontScale" are the first two applications; every later interactive component (buttons, checkboxes, tabs, inputs) in every feature module reuses this contract rather than re-deciding it.

1. **Every interactive element** (button, pressable, checkbox, tab, link) sets **both** `accessibilityRole` (RN's enum — `button`/`checkbox`/`tab`/`link`/…, matched to what it actually is) **and** `accessibilityLabel` (a human-readable string — never derived from an icon name or left to fall back on visible text alone when that text is absent/ambiguous). This is also the Maestro E2E anchor convention (`conventions.md`) — a missing label breaks both accessibility and the flow scripts.
2. **Minimum touch target ≥44pt (iOS) / 48dp (Android).** Use **48dp as the universal floor** — expressed with the *existing* spacing scale, not an arbitrary literal: `min-h-12 min-w-12` (spacing step **12** = 48dp, already documented). For visually smaller controls (icon-only buttons), pad the *tappable* region with `hitSlop` rather than inflating the visual size — compliance without breaking visual density.
3. **Dynamic Type / `fontScale`:** never set `allowFontScaling={false}` on any text, interactive or not (already the Type-scale rule above — restated here for interactive labels specifically). Containers must reflow, not clip — no fixed-height wrappers around text; `Screen`'s scroll mode exists for exactly this.
4. **Never color-alone for state.** Selected/active/error/disabled always pairs a color change with an icon, text, weight, or border change (anti-pattern #3, restated as the interactive corollary) — e.g., a selected tab changes icon fill *and* label weight, not just tint.
5. **Contrast AA in both themes.** Any new interactive surface is checked against its theme's `bg`/`surface`/`card` using the already-verified pairings table above — reuse those combinations; a genuinely new pairing gets verified and recorded here before shipping, never assumed.
6. **Focus/active indicator:** reuse the `primary` token as the visible ring/border color for focus and pressed states (its usage column already includes "focus ring") — never invent a second interaction-state color.
7. **Role reference (for later interactive components):** primary action → `button`; toggle → `checkbox` + `accessibilityState={{checked}}`; segmented/tab control → `tab` + `accessibilityState={{selected}}`; loading → `progressbar` (see `LoadingIndicator` above, the reference implementation).

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
- 2026-07-10 — design agent: seeded the Component Inventory (`EmptyState`, `LoadingIndicator`, `Screen`/`Container`) and the Accessibility baseline (F-047) for FND-005. No new tokens introduced — all three primitives reuse the FND-002 palette/type/spacing/radius set + Tailwind's default `max-w-*`/breakpoint/opacity-modifier scales. First use of `react-native-vector-icons/Feather` as the app's icon family.
- 2026-07-10 — librarian (FND-005, PR #7): all three primitives implemented and gates green; **promoted** to the Canonical patterns registry (reuse-or-block Tier-1) — see `patterns-registry.md`. `react-native-vector-icons/Feather` + the `FeatherIconName` alias also promoted as the app-wide icon-family convention. Native-prop color resolution generalized from the FND-003 nav-chrome row to cover any native color prop (`ActivityIndicator`, icon `color`).
