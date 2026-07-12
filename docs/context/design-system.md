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
| **Scroll** | `scroll` prop (default `false`) wraps `children` in a `ScrollView` (`contentContainerClassName="flex-grow"`) instead of a plain `View` — for screens whose content can exceed viewport height. **Keyboard-aware by default (added PRO-001):** the `ScrollView` sets `keyboardShouldPersistTaps="handled"` (a tap on another field/the submit button registers without a first tap-to-dismiss) and `automaticallyAdjustKeyboardInsets` (iOS; no-op on Android) so the focused input/submit control stays clear of the keyboard — a form screen (`scroll` mode) gets this for free and never nests its own `KeyboardAvoidingView` inside `Screen` (it would be inert; the `ScrollView` already owns scrolling/keyboard handling). |
| **Orientation / resize** | No fixed pixel dimensions anywhere in the primitive — flex + relative widths handle rotation automatically. `useWindowDimensions()` (from `react-native`) is available for feature screens that need a conditional layout decision beyond what the `sm:` className breakpoint expresses (e.g. a landscape two-pane split) — the `Screen` primitive itself doesn't need it for the base case. |
| **Tokens used** | `bg` (canvas), spacing step 4 (`px-4`), Tailwind default `max-w-2xl`/`sm:` breakpoint. **No new tokens.** |
| **Light/Dark** | Automatic via `bg-bg`. |

**Missing tokens check:** none. All three primitives are fully expressible with the existing FND-002 palette/type/spacing/radius tokens plus Tailwind's own default `max-w-*`/opacity-modifier/breakpoint scales (framework defaults, not new invented values). The two native-prop color reads (`ActivityIndicator`, and the `Feather` icon if NativeWind `cssInterop` isn't wired for it) resolve to the *existing* `primary` RGB pair — never a new value.

### `Button` (primary) — F-033, retroactively formalizing the existing CTA recipe

| | |
|---|---|
| **Purpose** | The one primary-action button recipe app-wide — form submits (PRO), `EmptyState` actions (already shipped, FND-005), future save/confirm CTAs (TSK). This entry **formalizes** the exact token recipe `EmptyState`'s action button already ships with the token recipe, and **extends** it with disabled/loading states (new, needed for PRO-001's submit). Reuse this recipe; never hand-roll a second `bg-primary` button shape. |
| **Props** | `{ label: string; onPress: () => void; disabled?: boolean; loading?: boolean; fullWidth?: boolean }` |
| **Layout (idle)** | `min-h-12 items-center justify-center rounded-md bg-primary px-4 py-3` (+ `w-full` when `fullWidth` — default `true` for a single-column form CTA). Label: `text-base font-semibold text-primary-fg`. Identical to `EmptyState`'s shipped action-button markup (FND-005) — no change needed there, this just names the pattern so it stops being an unlabeled one-off. |
| **Disabled state** | `opacity-50` (Tailwind default, no new value) on the whole button; `accessibilityState={{disabled: true}}`; `onPress` guarded to a no-op. Disabled is never signaled by opacity alone in isolation on this screen — it's always paired with the still-visible unresolved field errors above it. |
| **Loading / submitting state** | Swap the label `Text` for a native `ActivityIndicator` (`size="small"`, `color`= the resolved `primary-fg` RGB — `255 255 255` in **both** themes per the Color tokens table, so this is a literal constant, not a fresh resolved value) in the same slot; button height doesn't jump. `disabled` + `accessibilityState={{disabled: true, busy: true}}` — this also covers PRO-001's FR5 duplicate-submit guard accessibly, not just visually. |
| **A11y** | `accessibilityRole="button"`, `accessibilityLabel={label}` — always the resting-state label (a screen reader should hear "Get Started", never "Activity Indicator"), even while `busy`. ≥48dp target already satisfied by `min-h-12`. |
| **Tokens used** | `primary`, `primary-fg`, `radius-md`, spacing steps 3/4, `text-base`/`font-semibold`, Tailwind default `opacity-50`. **No new tokens.** |
| **Light/Dark** | Automatic via `bg-primary`/`text-primary-fg`. |

### `FormField` (F-033) — label + input + inline validation error

**Established by PRO-001** as the Tier-1 form-field pattern (`conventions.md` → Pattern policy) — TSK reuses this verbatim rather than re-deciding field/error styling per screen.

| | |
|---|---|
| **Purpose** | One labeled text input + its inline validation error, for every RHF + Zod form field app-wide. A thin visual wrapper — the screen still wires RHF's `Controller`/`register`; this entry specifies only the token-level look. |
| **Props** | `{ label: string; error?: string; required?: boolean } & Pick<TextInputProps, 'value'\|'onChangeText'\|'onBlur'\|'placeholder'\|'keyboardType'\|'autoCapitalize'\|'textContentType'\|'returnKeyType'\|'onSubmitEditing'\|'secureTextEntry'>` |
| **Label** | `text-sm text-text mb-2` (14/20, **400** — regular weight; a label is distinguished by position/size, not boldness, to keep the screen's weight budget tight). No visible `*` required-marker in PRO-001 (both fields are mandatory, so a marker on every field is redundant noise) — the `required` prop stays in the reusable signature for a future form with a genuine optional/required mix (TSK). |
| **Input (rest)** | `min-h-12 rounded-md border border-border px-3 py-3 bg-surface text-base text-text` — `bg-surface` reuses the Color tokens table's own "input fields" usage row verbatim, not a new mapping. Placeholder: `placeholder:text-text-muted` via NativeWind's `placeholder:` variant (verify support for the installed `nativewind@4.1.23` against current docs at implementation time, per `conventions.md`'s docs-first rule); if unsupported, fall back to the already-established native-prop resolution convention (`nativeChromeColors`) resolving `text-muted`'s RGB the same way `ActivityIndicator`/`Feather` already do. |
| **Input (focus)** | Border → `border-primary`, same 1px width (no heavier accent — stays inside the "boldness spent in one place" discipline). Mechanism (NativeWind `focus:` variant vs. a local `isFocused` toggle) is frontend's call; the token result is what's specified here. |
| **Input (invalid, `error` set)** | Border → `border-danger`, same 1px width, **takes precedence over the focus border** when both would apply. Color change is never the only signal — always paired with the error row below (anti-pattern #3). |
| **Error row** (rendered only when `error` is set) | `flex-row items-center gap-1 mt-1` (4dp icon-to-text gap, 4dp gap under the input). Feather `alert-circle`, 14dp, colored `danger` — **extend `NATIVE_CHROME_RGB` (`src/theme/nativeChromeColors.ts`) with a `danger` entry**, RGB copied verbatim from the Color tokens table above (light `179 38 30` / dark `229 100 90`) — same mechanism already documented for `primary`, never a fresh hex. Text: `flex-shrink text-sm text-danger` (14/20, **400** — same regular weight as the label, no new weight introduced). |
| **Field-group spacing** | `gap-4` (16dp) between one `FormField` and the next in a stacked column — this is ProfileSetupScreen's field rhythm and the one TSK reuses. |
| **A11y** | `accessibilityLabel` = the label text, or `` `${label}, ${error}` `` when an error is present (RN has no `aria-describedby` equivalent, so folding the error into the input's own label is the practical screen-reader path — reuse this wherever `FormField` is reused). **Error announcement:** Android → the error `Text` carries `accessibilityLiveRegion="polite"` (same convention `LoadingIndicator` already established). iOS → `accessibilityLiveRegion` is Android-only, so on iOS call `AccessibilityInfo.announceForAccessibility(error)` when an error newly appears — a platform gap `LoadingIndicator` didn't need to solve; first solved here, reused by TSK. ≥48dp target via `min-h-12` (the app-wide floor). |
| **Tokens used** | `border`, `primary`, `danger`, `surface`, `text`, `text-muted`, `radius-md`, spacing steps 1/2/3/4, `text-sm`/`text-base`. **One native-prop extension** (`danger` added to `NATIVE_CHROME_RGB`, values already documented — not new). |
| **Light/Dark** | Automatic via tokens; the one manual piece is the `danger` native-prop resolution addition above. |

**Missing tokens check (PRO-001):** none. `Button` and `FormField` are fully expressible with the existing palette/type/spacing/radius tokens; the only addition is extending the already-established native-prop-color map (`NATIVE_CHROME_RGB`) with a `danger` entry, using the RGB values already documented in the Color tokens table — not a new token, not a new hex.

### `Avatar` (F-005) — circular initials/icon chip

| | |
|---|---|
| **Purpose** | The identity glyph for the Profile screen (PRO-002): a circular chip showing the user's initials, falling back to a Feather `user` glyph when no name is available. Same visual family as `EmptyState`'s icon chip (a soft `primary/10` circle), applied to a second appropriate context — identity, not "nothing here". **Extended (PRO-003):** a `photoUri?: string` prop now renders an `Image` filling the chip in place of initials/icon when present, with a broken/missing-file uri falling back to the initials/icon treatment defensively (spec FR5). |
| **Props** | `{ name: string; size?: 'md' \| 'lg'; photoUri?: string }` — `size` defaults to `'lg'`. Two fixed presets (not an arbitrary dp number) so each maps to a static NativeWind className, per the no-arbitrary-value rule. |
| **Layout** | `items-center justify-center rounded-full bg-primary/10` — `'lg'`: `h-20 w-20` (80dp, the Profile-screen hero size); `'md'`: `h-16 w-16` (64dp — identical to `EmptyState`'s existing icon-chip size, reused verbatim for any future smaller-context avatar, e.g. a list row). Decorative once name/email text is also on screen — hidden from the accessibility tree the same way as `EmptyState`'s icon (`accessibilityElementsHidden` / `importantForAccessibility="no-hide-descendants"`), since the adjacent name text already carries the identity. |
| **Initials content** | Derived from `name`: trim, split on whitespace; first character of the first word, uppercased; if more than one word, append the first character of the *last* word, uppercased (e.g. "Ada Lovelace" → "AL", "Ada" → "A", "Ada Marie Lovelace" → "AL" — middle words ignored). `'lg'`: `text-xl font-semibold text-primary` (20/28, 600). `'md'`: `text-base font-semibold text-primary` (16/24, 600) — same weight both sizes, only the size class changes (no new weight value introduced). |
| **Icon fallback** | When `name` trims to empty (defensive — `profileSchema` requires `min(1)`, so this is a true edge case, not the expected path): Feather `user`, colored `primary` via the existing native-prop resolution (`NATIVE_CHROME_RGB`/`rgbFromTriplet`). `'lg'`: 28dp (same `ICON_SIZE` `EmptyState` already uses). `'md'`: 24dp. |
| **Tokens used** | `primary`, `primary/10`, `radius-full`, existing `text-xl`/`text-base` + weight 600. **No new tokens.** |
| **Light/Dark** | Automatic via `bg-primary/10`/`text-primary` tokens; icon fallback resolved per-scheme same as `EmptyState`. |

### `SegmentedControl` (F-003, generalized) — single-select fixed-option control

| | |
|---|---|
| **Purpose** | A single-select row of 2–4 mutually-exclusive text options (first use: PRO-002's System/Light/Dark theme toggle). **Promoted to the shared inventory** rather than kept screen-local — ORG's filter chips / sort options (TSK module) are the same interaction shape (a small fixed set, one selected at a time) and should reuse this rather than a second hand-rolled control. |
| **Props** | `{ options: { value: T; label: string }[]; value: T; onChange: (value: T) => void; accessibilityLabel: string }` (generic over `T extends string`) — `accessibilityLabel` is the group's context label (e.g. `"Theme"`), read alongside each segment's own label. |
| **Layout** | Track: `flex-row bg-surface border border-border rounded-md p-1 gap-1` — one themed component, no `.ios`/`.android` branching (spec's platform-divergence note). Each segment: `flex-1 min-h-12 items-center justify-center rounded-sm` (`radius-sm`, the "small chip" token) + `bg-primary` **only** when selected. |
| **Selected label** | `text-sm font-semibold text-primary-fg` (14/20, 600). |
| **Unselected label** | `text-sm text-text` (14/20, 400 — no fill, track's own `bg-surface` shows through). Color change is paired with a weight change (400→600) and a fill change, never color-alone (anti-pattern #3). |
| **A11y** | Per segment: `accessibilityRole="tab"` + `accessibilityState={{selected: value === option.value}}` (design-system's own Accessibility-baseline role reference for "segmented/tab control"). `accessibilityLabel` = the segment's own label. Track may additionally carry `accessibilityRole="tablist"`. ≥48dp via `min-h-12` per segment (the app-wide floor) — no `hitSlop` needed, the segment's own box already meets it. State-change announcement needs no extra live-region: the state change is a direct result of the user's own tap on that exact element (same reasoning as `Button`'s `accessibilityState` needing no live region). |
| **Tokens used** | `surface`, `border`, `primary`, `primary-fg`, `text`, `radius-md`, `radius-sm`, spacing steps 1 (gap)/12(`min-h-12`), `text-sm` + weights 400/600 (both already budgeted). **No new tokens.** |
| **Light/Dark** | Fully automatic via the existing token swap — no conditional styling. |

**Missing tokens check (PRO-002):** none. `Avatar` and `SegmentedControl` are fully expressible with the existing palette/type/spacing/radius tokens; `Avatar`'s `'md'` size reuses `EmptyState`'s exact 64dp chip rather than inventing a new size, and `SegmentedControl`'s selected/unselected treatment reuses the same 400/600 weight pair already budgeted by `Button`/`FormField` — no third weight value introduced.

### `ActionSheet` (F-003/F-004) — themed cross-platform bottom action sheet

**Built:** `mobile/src/components/ui/ActionSheet.tsx` (exported via `index.ts`).

| | |
|---|---|
| **Purpose** | A dimmed-scrim `Modal` sliding a `card`-surface option list up from the bottom — one row per option plus a trailing Cancel. Built as ONE themed component rather than branching on `ActionSheetIOS` (iOS-only, no Android equivalent), so the same interaction + Maestro/a11y anchors hold on both platforms. First use: `AvatarPhotoField`'s Take Photo / Choose from Library / Remove menu (PRO-003) — reuse for any future options-menu rather than a second hand-rolled `Modal`. |
| **Props** | `{ visible: boolean; onClose: () => void; options: { label: string; onPress: () => void; destructive?: boolean; accessibilityLabel?: string }[]; accessibilityLabel?: string }` |
| **Layout** | Backdrop: full-screen `Pressable` (`bg-text/40` — opacity-modifier on the `text` token, no new color) dismisses on tap. Sheet: `rounded-t-lg bg-card p-4 gap-1` (`radius-lg`, the same signature shape as a task card). Each option row: `min-h-12 items-center justify-center rounded-md px-4 py-3` (48dp floor). Trailing Cancel row is visually separated with `border border-border`. Renders `null` (not just hidden) while `visible` is `false` — RN's `Modal` otherwise keeps children mounted regardless of its own `visible` prop, which would leave inert Pressables in the (accessibility) tree between opens. |
| **Option label** | `text-base text-text`; a `destructive` option (e.g. "Remove Photo") renders `font-semibold text-danger` instead — color change paired with a weight change, never color-alone (anti-pattern #3). |
| **A11y** | Backdrop `accessibilityRole="button"` `accessibilityLabel="Dismiss"`; sheet container `accessibilityRole="menu"`; each option `accessibilityRole="menuitem"` with `accessibilityLabel` (falls back to the visible `label`); Cancel row `accessibilityRole="button"` `accessibilityLabel="Cancel"`. ≥48dp via `min-h-12` on every row. |
| **Tokens used** | `text/40`, `card`, `border`, `danger`, `text`, `radius-lg`, `radius-md`, spacing steps 1/3/4, `text-base` + weight 600. **No new tokens.** |
| **Light/Dark** | Fully automatic via the existing token swap — no conditional styling. |
| **Known non-blocking nits (PRO-003 review, low priority):** `menu`/`menuitem` role pairing vs. `button`/`list` not re-verified against the latest RN a11y guidance; the Cancel-row-blocking inner `Pressable`'s empty `onPress={() => {}}` (stops backdrop-dismiss bubbling) could be a named no-op helper instead of an inline stub. See `stack.md` → PRO-003 spec-gap notes. |
| **Extension (TSK-004, F-011/F-012/F-015):** two new **optional** props — backward-compatible, existing PRO-003 call sites (the photo-action menu) pass neither and render unchanged. **(1) `title?: string`** — an optional header `Text` rendered above the options list: `text-base font-semibold text-text` (matches an option label's destructive weight, not its color), `pb-3 mb-1 border-b border-border` (separates it from the option rows using the existing `border` token — no new value), `accessibilityRole="header"`, first node in the sheet's tree so a screen reader announces it immediately when the modal opens (no extra live-region needed — this is a new modal context, not a dynamic update to an already-focused screen). Used **only** for a yes/no-style confirm (TSK-004's delete-confirm — see below); an options-only menu (the row/detail "⋯" menus) omits it, same as the existing photo-action menu. **(2) `options[].icon?: FeatherIconName`** — an optional leading Feather glyph per option row, 20dp, `flex-row items-center gap-3` (12dp icon-to-label — reuses `TaskListItem`'s own "glyph next to primary content" gap, not the smaller 4dp caption-icon gap, since these icons sit at checkbox-glyph scale, not caption scale). Icon color pairs the label's color exactly: `destructive` → `danger` (matches the label's `font-semibold text-danger`); otherwise → `text` (matches `text-text`). Both resolved via the existing native-prop convention (`NATIVE_CHROME_RGB[resolvedScheme].{danger,text}` + `rgbFromTriplet`) — the same mechanism every other native-prop icon color in the app already uses. **No new tokens** — both extensions are pure layout/composition additions reusing `border`/`danger`/`text`/`text-base`/weight-600/spacing-step-3, exactly like `FormField` gaining `multiline` at TSK-002 (extend the primitive, don't fork it). |

**Missing tokens check (PRO-003):** none. `ActionSheet` is fully expressible with the existing palette/type/spacing/radius tokens plus the `text/40` opacity-modifier (same mechanism `EmptyState`'s `primary/10` chip already established).

### `TaskListItem` (F-008/FR5) — task row, reused by ORG

| | |
|---|---|
| **Purpose** | The one task-row recipe app-wide — Home's full list (TSK-001) and ORG's later filtered/searched list (F-023–031) render the identical row; a fresh hand-rolled row is a `[blocking]` code-review finding, same reuse-or-block contract as `EmptyState`/`Button`/`SegmentedControl`. Signature shape: the 20dp soft-radius task card (design intent's one recurring shape motif). |
| **Props** | `{ task: Task; onPress: (task: Task) => void; onToggleComplete?: (taskId: string) => void; onOpenActions?: (task: Task) => void }` — `onToggleComplete`/`onOpenActions` are both optional so TSK-001 could ship the row before either mutation existed to wire; TSK-004 (F-011/F-012/F-015) supplies `onOpenActions` without changing the rest of this component's public shape. `onOpenActions` opens the row-menu `ActionSheet` (see the TSK-004 "Task lifecycle actions" section below) — HomeScreen owns the sheet's `visible`/selected-task state and the option list; `TaskListItem` itself only calls the callback, it never renders the sheet. |
| **Layout** | Whole row is one `Pressable` card: `flex-row items-center gap-3 rounded-lg border border-border bg-card p-4` (`radius-lg` = 20px; spacing step 4 = 16dp padding; step 3 = 12dp toggle-to-text gap). The list gives each row a step-**5** (20dp) vertical gap via `ItemSeparatorComponent` (not a per-row margin, so no double-gap at the list boundary) — the documented "inter-card gap" usage. |
| **Elevation** | Per anti-pattern #5: **light mode** — subtle 1–2dp lift: `shadowColor` = the resolved `text` triplet (via `NATIVE_CHROME_RGB`, the same native-prop convention as `ActivityIndicator`/`Feather` color), `shadowOffset {0,1}`, `shadowOpacity 0.08`, `shadowRadius 4`, Android `elevation 2`. **Dark mode** — no shadow at all (`shadowOpacity 0`, `elevation 0`) — the card reads via the `bg` < `surface` < `card` lightness ramp + the hairline `border`, never a shadow, per real dark-theme practice. The Home screen's FAB (screen-local, not promoted here — see TSK-001 spec) reuses this exact resolution mechanism at slightly stronger values. |
| **Toggle (leading, ≥48dp target)** | 24dp circle (`h-6 w-6 rounded-full`, Tailwind's own default step). **Unchecked:** `border-2 border-border`, no fill. **Checked:** `bg-primary`, centered Feather `check` 14dp, color = the literal `primary-fg` white constant (`rgbFromTriplet('255 255 255')`, same pattern as `Button`'s `ACTIVITY_INDICATOR_COLOR` — `primary-fg` is `255 255 255` in both themes). Wrapped in its own `Pressable` (a sibling touch target inside the row — RN isolates nested `Pressable` touches natively, it is not swallowed by the row's own `Pressable`) with `hitSlop={{top:12,right:12,bottom:12,left:12}}` → 24 + 12 + 12 = 48dp square. `accessibilityRole="checkbox"`, `accessibilityState={{checked: task.status === 'completed'}}`, `accessibilityLabel` = `Mark "${task.title}" as ${task.status === 'completed' ? 'pending' : 'complete'}` (describes the action, not the current state — standard checkbox-label convention). **Copy fix (TSK-004):** the shipped TSK-001 label said `"...as active"`; corrected to `"...as pending"` to match the "Mark complete ⇄ Mark pending" terminology TSK-004 establishes as canonical everywhere else (F-014 is literally named "Mark Pending", not "Mark Active") — a one-line string change, no layout/behavior change. |
| **Completed treatment (title)** | `text-base text-text-muted line-through` — muted + strikethrough + the toggle's own check-fill are the three non-color-alone signals together (anti-pattern #3); title never re-colors via `danger`/`success`. Row **stays in place** in the list — no reorder/move animation (OQ-8). Active title: `text-base text-text` (400, no strikethrough). Both: `numberOfLines={2}` `ellipsizeMode="tail"` (keeps rows scannable on a long title without a fixed height clipping `fontScale`). |
| **Due date (if `task.dueDate` set)** | Second line under the title, `flex-row items-center gap-1` (step 1 = 4dp, the documented "icon-to-label gap"). Feather `calendar`, 12dp, color = resolved `text-muted` (`NATIVE_CHROME_RGB[...].textMuted`). Label: `text-xs text-text-muted` (12/16, **500 medium** — the token's own documented usage is literally "captions, meta (timestamps, counts)", an exact fit; this is `text-xs`'s first real use in the app). Formatting (`date-fns`) is frontend's job — this specs placement/treatment only. **No due-soon/overdue coloring here** — `warning`/`danger` on a due date is out of TSK-001's scope, not invented prematurely. |
| **Trailing hint (superseded TSK-004 — see below)** | ~~Feather `chevron-right`, 18dp, `text-muted`, `ml-2`~~ — **replaced** by the "⋯" actions button (F-011/F-012/F-015); the row's own `Pressable` still navigates to Detail on tap (unchanged), that behavior no longer needs a visual chevron hint (a trailing overflow control is itself common enough shorthand for "there's more here" — Apple Reminders' row-trailing "i" plays the same role). See the TSK-004 subsection for the replacement spec. |
| **Whole-row a11y** | `accessibilityRole="button"`, `accessibilityLabel` = `` `${task.title}, ${task.status === 'completed' ? 'completed' : 'active'}${task.dueDate ? `, due ${humanizedDate}` : ''}` `` (humanized date via `date-fns`, frontend's job). The toggle is a **second, distinct** accessible node inside the row — do not wrap both in a collapsing `accessible` container. ≥48dp satisfied by the card's own `p-4` height in all realistic cases; verify with a 1-line title + no due date (the shortest row) during implementation. |
| **Tokens used** | `card`, `border`, `text`, `text-muted`, `primary`, `primary-fg` (literal), `radius-lg`, spacing steps 1/3/4/5, `text-base`/`text-xs`. **No new tokens.** |
| **Light/Dark** | Automatic via tokens; the one manual piece is the elevation resolution above (same class of exception as `ActivityIndicator`/`Feather` color). |

## Screen specs (lean — composition only; a reusable decision gets its own line, layout stays in the spec)

> Per the PRO-002 precedent, screen-specific composition normally stays in the task spec, not here. **TSK-003 is a deliberate exception** — it establishes two decisions a *later* screen must check before reinventing (reusing `TaskListItem`'s status glyph outside a list row; the "action zone leaves room" pattern TSK-004 extends) — so it's recorded, kept lean, table-only.

### TSK-003 — Task Detail (F-009/F-018/F-019/F-041)

**Screen:** `TaskDetailScreen` (`src/features/tasks/screens`), pushed route, native header already wired (`RootNavigator`: `headerShown: true, title: 'Task Details'` — static chrome + back button, unchanged). Container: `Screen scroll` → `View className="py-6"` (matches `AddTask`/`EditTask`'s own top-level rhythm). No loading state (store is hydrated by boot; same as `HomeScreen`, no `LoadingIndicator` use).

| # | Element | className / tokens | Notes |
|---|---|---|---|
| 1 | **Title** | `text-xl text-text` (20/28, **600** — baked into the `xl` token, no `font-semibold` needed) | First element, no top margin. `accessibilityRole="header"`. **No `numberOfLines` cap** — full wrap (unlike the list row's `numberOfLines={2}`; this is the canonical single-record view). `text-xl`'s table usage is literally "screen titles" — exact fit. The native header stays the static "Task Details" chrome; this is the *record's* value, which the header can't express dynamically. |
| 2 | **Status** | Row: `mt-2 flex-row items-center gap-3` (step 2 = 8dp above; step 3 = 12dp glyph-to-text, **the same "toggle-to-text gap" `TaskListItem` already uses** — not a new value) | Glyph: **identical** `h-6 w-6 rounded-full` circle to `TaskListItem`'s toggle — unchecked `border-2 border-border`, checked `bg-primary` + centered Feather `check` 14dp, color = the literal `primary-fg` white constant (`rgbFromTriplet('255 255 255')`). **Read-only here** (plain `View`, not `Pressable` — TSK-004 wires the interactive toggle later); decorative, hidden from the a11y tree (same "adjacent text already carries the meaning" precedent as `Avatar`/`EmptyState`'s icon). Label: **Active** → `text-base text-text` (400); **Completed** → `text-base font-semibold text-success` (600 — reuses the `success` token's own documented "completed-state text/icon/badge" usage, its first real use in the app). Anti-pattern #3: color is paired with a weight change (400→600) *and* the checkbox fill *and* the text content change — never color-alone. Whole row collapses to one accessible node: `accessibilityLabel="Status: Active"` / `"Status: Completed"`. |
| 3 | **Description** | `mt-6 text-base text-text` (24dp above — new section); empty → `mt-6 text-base text-text-muted`, literal text **"No description"** | No caption label — prose content (title/status/description) reads as one block, no label needed (structured fields below do get labels). Full wrap, no line clamp. |
| 4 | **Due date** (row) | `mt-6 flex-row items-center justify-between` | Leading group: `flex-row items-center gap-1` (step 1 = 4dp, **the documented "icon-to-label gap"**) — Feather `calendar` 16dp colored resolved `text-muted` (`NATIVE_CHROME_RGB[...].textMuted`, same native-prop mechanism `TaskListItem` uses) + `text-sm text-text-muted` "Due date". Trailing value: `text-base text-text` when set; **`text-base text-text-muted` "No due date"** when absent (`task.dueDate` is always absent today — TSK-005 hasn't landed). Row collapses to one accessible node: `accessibilityLabel="Due date: No due date"` (or the formatted value). **TSK-005 extension point:** the value slot swaps to the formatted date — same row, same token, no layout change. Recommend date-only (`"MMM d, yyyy"`, matching the schema's date-only-picker comment) but TSK-005 confirms — not decided here. |
| 5 | **Meta block** | `mt-6 gap-1 border-t border-border pt-4` | Two lines, each one `Text` node: `text-xs text-text-muted` (12/16, **500** — the token's own documented "captions, meta (timestamps, counts)" usage, same weight `TaskListItem`'s due-date caption already established). **"Created " + value** then **"Last updated " + value** — label and value share one string/weight (no second weight introduced; `text-xs` is fixed at 500 by the token). **Date format: `"MMM d, yyyy · h:mm a"`** (e.g. "Jul 10, 2026 · 2:34 PM") via `date-fns format()` — same import `TaskListItem` already uses, a new format-string constant. Applies to both rows identically. Hairline `border-t border-border` + `pt-4` groups this visually as the record-metadata footer — reuses the existing `border` token, no new value. |
| 6 | **Action zone (Edit / Toggle / More)** | `mt-6 flex-row items-center gap-3` | `Button label="Edit task" onPress={() => navigation.navigate('EditTask', {taskId})}` with **`fullWidth={false}`** — a deliberate override of `Button`'s default-`true`, so the row doesn't consume the full width. **Bottom, in-content — not a header action**: no header-right-button pattern exists anywhere yet, and a bottom row reuses `Button` verbatim with no new native-header component. **Filled by TSK-004 (F-011/F-012/F-013/F-014/F-015):** two 48dp icon-buttons land in this same row after Edit, using the row's own `gap-3` — a Toggle button and a "⋯ More" button (Duplicate/Delete). Full spec in the "TSK-004 — Task lifecycle actions" subsection below; this row's original "leaves room" note is now resolved, not just reserved. |

**Not-found state:** reuse `EmptyState` verbatim in place of the whole content column — `title="Task not found"` `message="This task may have been removed."` `icon="alert-circle"` `action={{label: "Go back", onPress: () => navigation.goBack()}}` (FR2's "safe empty/back", store lookup is `tasks.find(t => t.id === taskId)` per `taskStore`).

**Weight budget check:** 400 (description / due-date value / "Active" label) + 600 (title / "Completed" label) = the 2-weight ceiling; `text-xs`'s baked-in 500 (meta captions) doesn't count against it — same exception already verified for `TaskListItem`'s Home-screen budget (design-system.md changelog, 2026-07-12).

**A11y-tree shape** (target for the e2e-automator's aria-snapshot):
```
(native header: "Task Details", back button)
heading: "<task title>"
text: "Status: Active" | "Status: Completed"
text: "<description>" | "No description"
text: "Due date: No due date" | "Due date: <value>"
text: "Created <MMM d, yyyy · h:mm a>"
text: "Last updated <MMM d, yyyy · h:mm a>"
button: "Edit task"
button: "Mark complete" | "Mark pending"
button: "More actions"
```
— not-found case collapses everything below the header to `EmptyState`'s own tree (heading + message + "Go back" button). **TSK-004 addition:** when the "More actions" button or a row's "⋯" is pressed, an `ActionSheet` (`menu` role) mounts over the tree with its own `menuitem` nodes (see the TSK-004 subsection); when "Delete" is chosen, a second `ActionSheet` mounts with a `header` node ("Delete this task?") + one destructive `menuitem` ("Delete task") + "Cancel".

**Missing tokens check:** none. Every element reuses existing color/type/spacing/radius tokens (`text-xl`/`text-base`/`text-sm`/`text-xs`, `text`/`text-muted`/`success`/`primary`/`primary-fg`/`border`, spacing steps 1/2/3/4/6, `radius-full`) plus the already-established native-prop-color and `Feather`-icon conventions. No new semantic color, no new spacing/radius value, no new weight.

### TSK-004 — Task lifecycle actions (F-011–F-015)

> The coherent affordance model for complete/pending, delete+confirm, and duplicate — reachable identically from the Home list rows and Task Detail. One mechanism throughout: an overflow control (a "⋯" icon-button) opens the extended `ActionSheet` (see its Component-inventory entry above for the `title`/`icon` props this task adds); delete always routes through a second `ActionSheet` acting as the confirm. **No new tokens** — every element below reuses `primary`/`success`/`danger`/`text`/`text-muted`/`border`, `radius-md`, spacing step 3, and the existing 400/600 weight pair.

**Why an overflow menu, not per-OS swipe-to-delete:** the spec's Platform-divergence note asks for one cross-platform approach; `ActionSheet` already exists, is already themed both directions, and is already the app's one confirm/menu primitive (PRO-003) — reusing it here (rather than adding `react-native-gesture-handler` swipeable rows, a new dependency + a new interaction language) keeps the "same mental model everywhere" goal literal, not just similar.

#### 1. Row model (Home list — `TaskListItem`)

| Element | Change | Spec |
|---|---|---|
| **Leading toggle** | Unchanged (already built, TSK-001) | The existing 24dp checkbox `Pressable` — quick single-tap complete/pending, no menu needed for this one, highest-frequency action. `onToggleComplete` now gets a real handler (`taskStore.toggleStatus`) instead of a no-op. |
| **Trailing "⋯" (new)** | Replaces the decorative `chevron-right` (see the `TaskListItem` entry above) | Feather `more-horizontal`, 20dp, `text-muted` — wrapped in its own `Pressable`, `hitSlop={{top:12,right:12,bottom:12,left:12}}` (20 + 12 + 12 = 44dp visual+hitSlop; pair with `min-w-8 min-h-8` container so the combined tap target still clears 48dp, matching the toggle's own hitSlop pattern). `accessibilityRole="button"`, `accessibilityLabel="More actions"`. Calls `onOpenActions(task)`; the row's own `onPress` (navigate to Detail) is unaffected — tapping anywhere else on the card still opens Detail. |
| **Row menu (`ActionSheet`, no `title`)** | New — owned by `HomeScreen` (one sheet, one "selected task" piece of state, opened by any row's `onOpenActions`) | `accessibilityLabel={`${task.title} actions`}`. Options, in order: **1.** label = `status === 'completed' ? 'Mark pending' : 'Mark complete'`, icon = `status === 'completed' ? 'circle' : 'check-circle'` → `taskStore.toggleStatus(id)`. **2.** label `"Edit"`, icon `edit-2` → `navigation.navigate('EditTask', {taskId})`. **3.** label `"Duplicate"`, icon `copy` → `taskStore.duplicateTask(id)`. **4.** label `"Delete"`, icon `trash-2`, `destructive: true` → closes this sheet, opens the delete-confirm sheet (§3) for the same task. Built-in trailing "Cancel" needs no entry. |

#### 2. Detail model (`TaskDetailScreen`'s action zone, row #6)

Extends the existing `mt-6 flex-row items-center gap-3` row (currently just `Button label="Edit task" fullWidth={false}`) with two 48dp icon-buttons, in this order: **Edit task → Toggle → More**. Both new buttons share one shape: `min-h-12 min-w-12 items-center justify-center rounded-md border border-border` (a plain outlined square — the app's first "icon-button" chrome; **single-use today, don't promote to `components/ui` yet** — same "watch, promote on a second consumer" call the PRO-002 changelog made for the Cancel-text-pressable; ORG or a future screen reaching for the same shape should promote it to a named primitive instead of a third hand-roll).

| Button | Icon | Color / state | Label |
|---|---|---|---|
| **Toggle** | Feather `check-circle`, 20dp, always the same glyph | Active task → icon `primary`, plain `border-border` background (the default un-filled state). Completed task → icon `success` **and** container `bg-success/10` (the same opacity-modifier mechanism `primary/10` already establishes, applied to `success` — not a new token) — color is paired with a background-fill change, never color-alone (anti-pattern #3), and doubles as a "this task is done" glance-state on the button itself. | `accessibilityLabel` = `"Mark complete"` (active) / `"Mark pending"` (completed) — flips exactly like the row's menu-option label. `onPress` → `taskStore.toggleStatus(id)`. |
| **More** | Feather `more-horizontal`, 20dp | `text-muted` always — a neutral overflow trigger, not a state signal. | `accessibilityLabel="More actions"`. Opens the Detail action menu below. |

**Detail action menu (`ActionSheet`, no `title`):** `accessibilityLabel={`${task.title} actions`}` — **only 2 options**, `"Duplicate"` (icon `copy`) and `"Delete"` (icon `trash-2`, `destructive: true` → opens the delete-confirm sheet). **Deliberately omits** the toggle and Edit entries the row menu carries: both already have a dedicated, always-visible control in this same row (the Toggle button; the `Button label="Edit task"`), so repeating them in the menu would be a redundant second path to an action that already has a direct one. This is the one content difference between the row's menu (4 options — nothing on the dense list row has its own dedicated control besides the checkbox) and Detail's menu (2 options — Detail has room for dedicated controls) — same component, same confirm mechanism, same `destructive` treatment; only which actions get a direct control vs. sit behind "⋯" changes, driven by available on-screen real estate, not by mechanism drift.

#### 3. Delete confirmation (`ActionSheet`, **with** `title` — F-012)

Shared by both entry points (row menu's "Delete", Detail menu's "Delete") — one sheet configuration, opened with whichever task is pending deletion:

- `title="Delete this task?"`
- `accessibilityLabel="Delete this task?"` (same string — the sheet's accessible name matches its visible header, so VoiceOver/TalkBack announce the same question whichever way focus lands).
- `options`: exactly one — `{label: "Delete", icon: "trash-2", destructive: true, accessibilityLabel: "Delete task", onPress: <confirmed delete>}`.
- Built-in trailing "Cancel" is the no-op path — no separate Cancel wiring needed.
- **Confirmed delete:** `taskStore.removeTask(id)`; if opened from Detail, also `navigation.goBack()` immediately after (FR2 — deleting a record you're currently viewing can't leave you looking at a "Task not found" `EmptyState` for even a frame if avoidable; navigate back first, the removal is already synchronous/local). If opened from a Home row, no navigation — the row leaves the list in place.
- **Sequencing note:** both entry-point sheets close (`onClose` fires, unmounting — `ActionSheet` renders `null` while not `visible`) *before* their option's `onPress` runs the state update that opens this confirm sheet, so there's never two `Modal`s mounted at once. Worth a quick on-device check during implementation (Android back-to-back `Modal` transitions have occasionally shown a one-frame flicker in RN) — a minor polish item, not a blocking behavior change if it appears.

#### 4. Duplicate — title suffix decision (F-015)

**No "(copy)" suffix.** `taskStore.duplicateTask` copies `title` verbatim (already the resolved behavior in the TSK-004 spec's FR3 — "same title (optionally suffixed…)"). Reasoning: the copy appears directly next to the original in the same list (no reorder, no separate "duplicates" section), so the adjacency itself is the disambiguating signal; a permanent "(copy)" suffix the user has to manually edit out on every duplicate adds friction for the common case (duplicating a recurring task shape) without adding real information the position doesn't already give. No visual treatment needed either — the duplicate is a completely ordinary new task row, active status, today's timestamps.

**Verified against banned-defaults #1–#8:** no pure black/white, no default-RN-blue, no color-only state (destructive pairs `danger` + weight-600 + icon; the Detail toggle pairs `success` + a background fill, never `success` alone), no hardcoded hex (all icon colors route through the existing `NATIVE_CHROME_RGB` native-prop convention), no shadow additions, weight budget unchanged (menu/button labels stay within the existing 400/600 pair — no third weight), 4pt-grid spacing only (`gap-3`/step 3 reused throughout), no new semantic color (the Detail toggle's completed state reuses `success`, already documented as "completed-state text/icon/badge" — this is that exact usage, not a new one).

### TSK-005 — Due date field (F-016/F-017)

**Where:** the shared `TaskForm` (`features/tasks/components/TaskForm.tsx`) — a third field, below Description, inside the same `gap-4` stack (the `FormField` entry's own "Field-group spacing" convention already gives it the 16dp rhythm; no extra margin needed). Appears in both `AddTaskScreen` and `EditTaskScreen` automatically, since both render `TaskForm` unchanged.

**Why not `FormField` itself:** `FormField` wraps a `TextInput` (keyboard input + focus/blur + one error row). A due-date control is a different interaction shape — a `Pressable` that opens the OS date+time dialog (no keyboard), beside a second, independent `Pressable` (Clear) — and per FR4 the value can never be Zod-invalid once picked (it only ever comes from the native dialog, never typed), so there is no error state to render. Forcing that into `FormField`'s single-input-plus-error shape would fight the component rather than extend it (unlike `multiline`, TSK-002's clean same-shape extension). This field reuses only `FormField`'s **label treatment** (`text-sm text-text mb-2`, the exact className) — not the component — as a small feature-scoped row living in `TaskForm.tsx` (or split to `features/tasks/components/DueDateField.tsx` if that reads cleaner — frontend's call). It stays feature-scoped, not `components/ui`, same as `TaskForm` itself, unless a second, unrelated date-field consumer appears later.

**Structure**
```
<View>
  <Text className="mb-2 text-sm text-text">Due date</Text>
  <View className="flex-row items-center gap-2">
    <Pressable /* trigger, flex-1, always rendered */ />
    {dueDate ? <Pressable /* clear, only when set */ /> : null}
  </View>
</View>
```

**Trigger** (`flex-1`, always rendered)
- className: `min-h-12 flex-1 flex-row items-center gap-2 rounded-md border border-border bg-surface px-3 py-3` — the identical chrome recipe `FormField`'s input row uses (`min-h-12`, `rounded-md`, `border-border`, `bg-surface`, `px-3 py-3`), so it reads as "the third field" in the stack, not a foreign control. No focus/invalid border variant — a `Pressable` that opens a modal dialog has no text-input focus concept, and (per FR4) this control can never be in an error state.
- Leading icon: Feather `calendar`, **16dp** — reuses `TaskDetailScreen`'s existing `DUE_DATE_ICON_SIZE` value, not a new size. Color: resolved `text-muted` (`NATIVE_CHROME_RGB[...].textMuted`), constant in both states — decorative wayfinding, not a state signal, same as the identical calendar icon already on `TaskListItem`/`TaskDetailScreen`'s own due-date rows.
- Value `Text`, **no `numberOfLines` cap** (unlike `TaskListItem`'s title) — a form field must reflow under large `fontScale`, never clip:
  - **Unset:** literal `"Set due date"`, `text-base text-text-muted` — the exact placeholder treatment `FormField`'s `placeholder:text-text-muted` establishes, on a `Text` node instead of a native placeholder (a `Pressable` has no `TextInput` placeholder to hook into).
  - **Set:** the formatted value (`formatDueDateFull`, see below), `text-base text-text` — the "filled" treatment, matching a filled `FormField`.
- `accessibilityRole="button"`. `accessibilityLabel`: **unset** → literal `"Set due date"` (exact string, per the task's a11y requirement); **set** → `` `Due date, ${formatted value}. Double tap to change.` `` — mirrors this app's existing convention of a state-aware action label (e.g. the Detail Toggle button's `"Mark complete"` ⇄ `"Mark pending"`) rather than repeating a now-stale "Set due date" once a value exists.
- `onPress` opens the native date+time flow (Android: sequential date-then-time dialogs; iOS: the platform's own combined/spinner presentation). The exact per-platform branching + RHF `Controller` wiring is frontend's implementation call per the spec's Platform-divergence section — this entry specs only the trigger/value/clear token treatment around that native surface, which stays fully OS-styled and out of scope.

**Clear ("×") button** (rendered only when a due date is set — omitted entirely, not disabled, when unset)
- Reuses the **exact** icon-button chrome TSK-004 already established for the Detail screen's Toggle/More buttons (`ICON_BUTTON_BASE_CLASSNAME` in `TaskDetailScreen.tsx`) verbatim: `min-h-12 min-w-12 items-center justify-center rounded-md border border-border`. This is that shape's **second consumer** — per the TSK-004 changelog's own "promote to `components/ui` on a second consumer" note, **frontend should now extract it to a small named primitive** (e.g. `components/ui/IconButton.tsx`) and have both `TaskDetailScreen` and this field consume it, instead of two private copies of the same className string.
- Icon: Feather `x`, **20dp** — reuses the same `ACTION_ICON_SIZE` value the TSK-004 icon-buttons already use, not a new size.
- Color: **neutral** `text-muted` — deliberately **not** `danger`-tinted. `danger` is reserved for genuinely destructive/irreversible actions (Delete Task, which routes through a two-step confirm `ActionSheet`); clearing a due date is a low-stakes, instantly-reversible field edit (re-tapping the trigger reassigns it in one step, FR3 asks for no confirmation, no data beyond this one optional field is touched). Tinting it red would overstate the action and dilute `danger`'s meaning elsewhere (anti-pattern #8). This also matches the Detail screen's own "More" button precedent — a neutral utility control uses `text-muted`, not a semantic color, when it isn't itself signaling a state.
- `accessibilityRole="button"`, `accessibilityLabel="Remove due date"` (literal, per FR3/NFR). `onPress` sets the form's `dueDate` back to `undefined` — the trigger reverts to its unset ("Set due date") treatment on the next render.

**Tokens used:** `text`, `text-muted`, `border`, `surface`, `radius-md`, spacing steps 1 (icon-to-label gap)/2 (trigger-to-clear gap)/3/4 (row padding), `text-sm`/`text-base`. **Zero new tokens** — every value is an already-documented token or an already-used icon size (16dp/20dp), never invented fresh.

**A11y summary:** trigger (`min-h-12`) and clear (`min-h-12 min-w-12`) both ≥48dp, both independently labeled, both a sibling `Pressable` pair — the same nested/sibling-touch-target pattern `TaskListItem`'s checkbox + "more actions" button already establish (RN isolates sibling `Pressable` taps natively). The value `Text` has no line-clamp, so large `fontScale` reflows the row's height rather than clipping. The native OS dialog itself is accessible by default (out of this spec's scope, per the task brief).

**Verified against banned-defaults #1–#8:** no pure black/white, no default-RN-blue, no color-only state (unset↔set pairs a text-color change with a text-content change, never color alone; Clear is a neutral utility control, not a state signal — see the `danger` reasoning above), no hardcoded hex (icon colors route through `NATIVE_CHROME_RGB`), no shadow additions, weight budget unchanged (both states stay 400 — no new weight introduced), 4pt-grid spacing only, no new semantic color (Clear stays `text-muted`, not a new "clear" color).

#### Canonical due-date format (reconciles the `TaskListItem` / `TaskDetailScreen` disagreement)

Two **deliberately different, reconciled** variants — not one identical string everywhere — consolidated into **one shared, named util**: `mobile/src/features/tasks/lib/formatDueDate.ts` (feature-scoped — due-date formatting is a `features/tasks` concern; nothing outside this feature formats one). Two named exports (frontend implements the function bodies; the strings below are the ruling):

```ts
export const DUE_DATE_FORMAT_COMPACT = 'MMM d, h:mm a';    // e.g. "Jul 15, 3:30 PM"
export const DUE_DATE_FORMAT_FULL = 'MMM d, yyyy · h:mm a'; // e.g. "Jul 15, 2026 · 3:30 PM"

export function formatDueDateCompact(iso: string): string { /* date-fns format(new Date(iso), DUE_DATE_FORMAT_COMPACT) */ }
export function formatDueDateFull(iso: string): string { /* date-fns format(new Date(iso), DUE_DATE_FORMAT_FULL) */ }
```

| Surface | Format | Why |
|---|---|---|
| `TaskListItem` (list row) | **compact** — `formatDueDateCompact` / `'MMM d, h:mm a'` | Space-constrained row (title already wraps to 2 lines, shares the row with the "more actions" control) — omitting the year keeps the caption short, exactly the existing `'MMM d'` convention's own reasoning. The only change from today: **adding the time** — a due date now always carries one (the picker is date+time per FR2), and hiding it would make picking a time invisible, which this task must not do. |
| `TaskDetailScreen` (due-date row) | **full** — `formatDueDateFull` / `'MMM d, yyyy · h:mm a'` | Roomy, single-record context — show the year for an unambiguous full date, same as the row already did. |
| `TaskForm`'s due-date trigger (this task, new) | **full** — `formatDueDateFull` (same as detail) | Editing a record is the same "roomy, one record" context as viewing it — the compact list format here would read as visually inconsistent with the record's own Detail view the user is editing toward/came from. |

**This is the same literal string as `META_DATE_FORMAT`** (`TaskDetailScreen.tsx`'s existing Created/Last-updated constant, line 44) — **deliberately, not by accident**: both are "the app's one full-record-timestamp grammar" (`MMM d, yyyy · h:mm a`), so a Detail screen showing Due date + Created + Last updated together reads as one consistent typographic rhythm, not three near-miss date styles. They stay **two separate named constants** — `DUE_DATE_FORMAT_FULL` (new, in the shared util) vs. `META_DATE_FORMAT` (existing, **stays exactly where it is, untouched** — it formats record metadata, a different semantic concern from a user-set due date, per the task brief) — coincidentally-identical values, deliberately-distinct names. Same "reuse the value, keep the semantic label distinct" move `text-xs`'s baked-in 500-weight already makes for due-date captions vs. meta captions elsewhere in this doc.

**Consolidation instruction (frontend, mechanical):**
1. Create `mobile/src/features/tasks/lib/formatDueDate.ts` with the two exports above (`date-fns`'s `format`, the same import every other date usage in this feature already uses).
2. `TaskListItem.tsx:37` — delete the local `DUE_DATE_FORMAT` const + local `formatDueDate` function; import and call `formatDueDateCompact` instead.
3. `TaskDetailScreen.tsx:45` — delete the local `DUE_DATE_FORMAT` const + local `formatDueDate` function; import and call `formatDueDateFull` instead. **Leave `META_DATE_FORMAT` (line 44) and `formatMetaDate` exactly as they are** — not a due-date format, out of scope.
4. `TaskForm.tsx`'s new due-date trigger imports `formatDueDateFull` from the same util for its "set" value display — no fourth ad-hoc string.

After this change, every due-date display in the app routes through this one util — no scattered per-file format constant remains.

### ORG-001 — Organize header (Home)

**Where:** `HomeScreen.tsx` — a new sibling `View` inserted between the existing greeting `Text` and the `FlatList` (both already live inside `Screen`'s `flex-1` wrapper, so the header inherits `Screen`'s `px-4` gutter automatically — no new horizontal margin). **Pinned, not a `FlatList` `ListHeaderComponent`** — see "Pinned vs. scrolling" below.

**The 3-slot spine — built once, extended twice more (ORG-002, ORG-003) with zero restructuring:**

```
<View className="gap-3 pb-4">                     {/* the organize header */}
  {/* slot 1 — search (ORG-002 prepends this row; not rendered by ORG-001) */}
  <View className="flex-row items-center gap-3">   {/* slot 2 + slot 3 share one row */}
    <View className="flex-1">
      <SegmentedControl ... />                      {/* slot 2 — THIS TASK */}
    </View>
    {/* slot 3 — sort trigger (ORG-003 appends this as a 2nd child; not rendered by ORG-001) */}
  </View>
</View>
```

| slot | position | control | this task | how it lands later, without a re-layout |
|---|---|---|---|---|
| 1 | top row | Search bar (full-width text input) | **reserved** | ORG-002 prepends a new first child to the header's own `gap-3` outer `View` — the existing vertical rhythm applies to it automatically; slots 2/3 (the row below) are untouched. |
| 2 | row 2, leading | Filter `SegmentedControl` (All / Active / Completed) | **built now** | — |
| 3 | row 2, trailing | Sort trigger (compact `IconButton`, opens an `ActionSheet`) | **reserved** | ORG-003 adds the `IconButton` as a **second child** of the same `flex-row items-center gap-3` row, right after the filter's `flex-1` wrapper — `flex-1` cedes exactly the width the button needs; the row container itself is never touched. |

**Spacing — no new value.** `gap-3` (step 3, 12dp) does double duty: the header's own inter-row vertical rhythm (search row ↔ filter/sort row) *and* the filter/sort row's internal horizontal gap — the same value already established for "related controls in one row/group" (`TSK-004`'s Detail action zone `gap-3`, `ActionSheet`'s icon-to-label `gap-3`). The header's own `pb-4` (step 4, 16dp) bottom margin before the `FlatList` mirrors the greeting `Text`'s existing `pb-4` — the screen's top-to-bottom rhythm (greeting → content) repeats identically (header → list) rather than inventing a second "section break" value.

**Height budget (why it won't crowd the list):** today (filter only) the header adds one 56dp row (`SegmentedControl`'s track: `p-1`×2 = 8dp + `min-h-12` segment = 48dp) + 16dp margin = **72dp**, on top of the greeting's own ~72dp (`pt-6`+line-height+`pb-4`) — 144dp total before the list starts, a modest slice of any phone's usable height; even a 3–4 row list still renders without scrolling on a compact device. At full build-out (ORG-002 search row added: 48dp + 12dp gap), the header grows to ~132dp (≈204dp combined with the greeting) — still bounded and well short of "crowds the list."

**Filter control (F-023/024/025):** the `SegmentedControl<TaskQueryStore['filter']>` primitive **verbatim, no restyle** — `options={[{value:'all',label:'All'},{value:'active',label:'Active'},{value:'completed',label:'Completed'}]}`, `value={filter}` / `onChange={setFilter}` bound directly to `taskQueryStore` (persisted), `accessibilityLabel="Filter tasks"`. Wrapped in `<View className="flex-1">` inside slot 2/3's row — **renders full-width today** (it's the row's only child); architecturally it already **shares** that row with the future sort trigger, per the table above. The `SegmentedControl` track (56dp) and the future `IconButton` (48dp) don't height-match exactly — `items-center` on the row centers them; an intentional, accepted asymmetry (a multi-option track reading slightly taller than a single icon action is consistent with the rest of the app, e.g. `TaskDetailScreen`'s `Button`/`IconButton` pairing), not something to force-align later.

**Empty states (FR5) — precedence-ordered, all reuse `EmptyState` verbatim:**

| state | trigger | title | message | icon |
|---|---|---|---|---|
| No tasks at all | zero tasks total (unchanged, TSK-001) | "No tasks yet" | "Tap the + button below to add your first task." | `clipboard` |
| Non-empty search, no matches (ORG-002) | `search` (trimmed) is non-empty AND the derived list is empty — takes precedence over the two filter-empty rows below even when a non-"All" filter is also active | "No results" | `No tasks match "<query>".` (dynamic — the trimmed query, quoted) | `search` |
| Filter = Active, none active | tasks exist, all are completed, search is empty (or search matched but none are Active) | "No active tasks" | "Everything's complete." | `check-circle` |
| Filter = Completed, none completed | tasks exist, none completed, search is empty (or search matched but none are Completed) | "No completed tasks" | "Complete a task to see it here." | `circle` |

Both filter-empty icons reuse glyphs already in the app's Feather vocabulary (`buildRowMenuOptions` in `HomeScreen.tsx` already uses `check-circle` for "Mark complete" and `circle` for "Mark pending") rather than introducing a new one — the empty-state icon echoes the same status concept as the row action that would resolve it. The no-results row (ORG-002) instead reuses `search` — the same glyph already sitting in the search input directly above it, telegraphing "this empty state is about your search" the same way the filter rows telegraph their own resolving action; see the ORG-002 subsection below for the full reasoning. Copy reuses the app's own canonical status vocabulary ("complete", not "done" — matches "Mark complete"/"Completed" everywhere else), stays in the established calm/plain register (no exclamation points, no emoji — this brand is deliberately not the "cheerful gamified habit-tracker" register the design intent rules out). **Precedence (resolved by ORG-002):** (1) no tasks at all → "No tasks yet"; (2) non-empty search (trimmed) with no matches → "No results" — wins over the filter-empty rows even when a non-"All" filter is also active, since the search is the more specific, more recent user action; (3) filter matched nothing (search empty, or search matched but the active filter narrowed it to zero) → the filtered-empty rows above.

**Interaction niceties:**
- **Pinned, not scrolling.** The header is a fixed sibling of the `FlatList` (same structural pattern the greeting already uses), never a `ListHeaderComponent` — it never scrolls away. Reasoning: (1) filter/search/sort are the list's primary navigation controls in a list-centric screen — hiding them on scroll would force a scroll-to-top round trip on every refinement, the highest-friction move available here; (2) the height budget above shows the fixed cost is modest and bounded, so it doesn't meaningfully eat list real estate on a populated list, and an empty/near-empty list doesn't need the scroll room anyway; (3) keeps `FlatList` virtualization/`ItemSeparatorComponent`/pull-to-refresh exactly as TSK-001 built them — an interactive, frequently-re-rendering header inside `ListHeaderComponent` would add sticky-header re-measure cost `FlatList` doesn't need to pay.
- **Keyboard implication for ORG-002's search input:** because the header sits *outside* the `FlatList` (not inside a `ScrollView` — `HomeScreen` uses `<Screen>` without `scroll`), the search input never needs a `KeyboardAvoidingView` or scroll-into-view: it's a fixed element above the list, so it's structurally always above the keyboard's rising edge. Only the `FlatList`'s visible area shrinks when the keyboard opens (standard Android `adjustResize` behavior) — verify that manifest setting still holds when ORG-002 lands, but no header-level plumbing is needed to get there.

**Unaffected (confirm no regression):** the greeting `Text`, the FAB (`absolute` positioned, independent of header height), and pull-to-refresh (bound to the `FlatList` itself, not the header) are all untouched by this change.

**A11y-tree shape** (target for the e2e-automator's aria-snapshot; Maestro anchors on the visible segment text):
```
heading: "Hi, <name>" | "Hi there"
tablist: "Filter tasks"
  tab: "All"
  tab: "Active"
  tab: "Completed"
(list of task rows, per TaskListItem's existing tree — TSK-001)
  — or, when the derived list is empty —
text: "No tasks yet" / "Tap the + button below to add your first task."
text: "No active tasks" / "Everything's complete."
text: "No completed tasks" / "Complete a task to see it here."
button: "Add task"
```

**Missing tokens check:** none. Every element reuses existing tokens/components verbatim — `SegmentedControl` unstyled, `EmptyState` unstyled, spacing steps 3/4 (already documented, already reused for this exact "related-row-group" and "section-break" purpose elsewhere), the two Feather icons already in the app's glyph vocabulary. **Verified against banned-defaults #1–8:** no pure black/white, no default-RN-blue, no color-only state (`SegmentedControl`'s own selected-state already pairs fill+weight; the empty-state icons pair with distinct copy, never color alone), no hardcoded hex, no shadow additions, weight budget unchanged (the header introduces no new text weight — `SegmentedControl`'s existing 400/600 pair), 4pt-grid spacing only, no new semantic color. Did NOT touch `mobile/src` (authz boundary — `frontend` implements from this spec).

### ORG-002 — Search bar + no-results (F-020/F-021/F-022/F-031)

**Fills ORG-001's reserved slot 1** — the search row becomes the header's outer `gap-3` stack's **first child**, above the existing filter/sort row. No restructuring of slot 2/3 (still exactly what ORG-001 shipped).

```
<View className="gap-3 pb-4">                        {/* the organize header, unchanged container */}
  <View className="flex-row items-center gap-2">      {/* NEW — slot 1, this task */}
    <View className="flex-1 min-h-12 flex-row items-center gap-2 rounded-md border border-border bg-surface px-3 py-3">
      <Feather name="search" size={16} />               {/* decorative, hidden from a11y tree */}
      <TextInput className="flex-1 text-base text-text" /* placeholder "Search tasks" */ />
    </View>
    {query.length > 0 && <IconButton icon="x" accessibilityLabel="Clear search" ... />}  {/* only when non-empty */}
  </View>
  <View className="flex-row items-center gap-3">      {/* slot 2 + 3 — unchanged, ORG-001 */}
    ...
  </View>
</View>
```

**Search input box** — reuses `FormField`'s exact input chrome (Component inventory, above), verbatim, on a wrapping `View` instead of a bare `TextInput` (a `TextInput` alone has no leading-icon slot):
- Container: `flex-1 min-h-12 flex-row items-center gap-2 rounded-md border border-border bg-surface px-3 py-3` — `min-h-12`/`rounded-md`/`border-border`/`bg-surface`/`px-3 py-3` are `FormField`'s own input-row tokens, unchanged; `flex-row items-center gap-2` is new *layout* (no new *token* — `gap-2` is the same step-2 (8dp) value `EmptyState`'s title↔message gap and `LoadingIndicator`'s icon↔label gap already use) to seat the leading icon + input on one line. The border/background/padding/radius live on this container only — the `TextInput` inside adds none of its own (no nested border), so it reads as one field, not two.
- Leading icon: Feather `search`, **16dp** — same size and role as `DueDateField`'s leading `calendar` icon (TSK-005): decorative wayfinding, not interactive, not a state signal. Color: resolved `text-muted` via the existing `NATIVE_CHROME_RGB`/`rgbFromTriplet` native-prop convention. Hidden from the accessibility tree (`accessibilityElementsHidden` / `importantForAccessibility="no-hide-descendants"`) — same treatment as `EmptyState`/`Avatar`'s decorative icons, since the adjacent `TextInput` already carries an explicit label.
- `TextInput`: `flex-1 text-base text-text`, no border/background classes of its own (the container owns those). Placeholder **"Search tasks"**, `text-text-muted` via NativeWind's `placeholder:` variant — same variant-or-native-prop-fallback convention `FormField` already documents (verify `placeholder:` support against the installed `nativewind@4.1.23`; fall back to a resolved `text-muted` `placeholderTextColor` if unsupported). `accessibilityLabel="Search tasks"` on the `TextInput` itself (it is the one focusable/labeled node in this row — the icon is hidden, the clear button gets its own separate label below).
- Platform correctness notes (avoid default-RN-slop inside an otherwise disciplined field): `underlineColorAndroid="transparent"` (Android's default `TextInput` underline is exactly the kind of unstyled platform-default this system already bans elsewhere); do **not** set the iOS-only native `clearButtonMode` — the themed cross-platform `IconButton` clear affordance below replaces it, so enabling both would show two clear controls on iOS. Recommend `autoCapitalize="none"` and `autoCorrect={false}` (a search query isn't sentence prose; matching is case-insensitive per FR3 regardless, but auto-capitalizing every keystroke reads as visual noise in a search field) — a UX nicety, non-blocking if frontend judges otherwise. No `autoFocus` — the field must not steal the keyboard/focus on every Home mount.

**Clear ("×") button** — reuses the `IconButton` primitive (`@/components/ui`, promoted TSK-005/TSK-004) **verbatim, as a sibling of the input box**, not nested inside it: `<IconButton icon="x" iconColor={mutedColor} accessibilityLabel="Clear search" onPress={() => setSearch('')} />`, rendered only when `query.length > 0` (omitted, not disabled, when empty — same "appears/disappears" convention `DueDateField`'s own Clear button already established). This mirrors `DueDateField`'s trigger+clear structure exactly: two same-height (`min-h-12`, 48dp) sibling boxes with an 8dp `gap-2` between them — not a nested icon inside the input's own border, which would force the row taller than the 48dp height every other input/header row in this app uses. IconButton's default `iconSize` (20dp) and neutral `text-muted` color are unchanged from its existing recipe — no override needed. `accessibilityLabel="Clear search"` (literal, per the task's NFR). ≥48dp target satisfied by `IconButton`'s own `min-h-12 min-w-12` floor.

**Placement + spacing:** the search row sits as the header's first child, so it inherits the header's own `gap-3` (12dp) rhythm to the filter/sort row below it — no new vertical-gap value. This is exactly the 48dp row + 12dp gap ORG-001's own height budget already reserved for it ("at full build-out... the header grows to ~132dp") — no revision needed there. Screen horizontal gutter (`px-4`) is inherited from `Screen`, unchanged.

**Keyboard behavior:** the organize header (including this row) is a **pinned sibling of the `FlatList`**, not inside a `ScrollView` (ORG-001's own "Keyboard implication" note) — the search input is structurally always above the keyboard's rising edge, so no `KeyboardAvoidingView` or scroll-into-view handling is needed here; only the `FlatList`'s visible area shrinks (standard Android `adjustResize`), which ORG-001 already verified.

**Real-time — no submit affordance:** results update on every `onChangeText` (FR2) — there is no search icon-button-to-submit, and the leading `search` glyph is purely decorative (never a `Pressable`). `returnKeyType` may keep the OS default with **no `onSubmitEditing` handler wired** — nothing to submit, filtering already happened on the keystroke that produced the current text.

**No-search-results empty state (FR5):** reuse `EmptyState` verbatim — `title="No results"`, `message={`No tasks match "${trimmedQuery}".`}` (the first `EmptyState` consumer with a **dynamic** message — frontend interpolates the trimmed query; the component's `message: string` prop needs no interface change), `icon="search"`, no `action` (nothing to invite beyond editing the query that's already focused/visible above the list). See the updated precedence table in the ORG-001 subsection above for the full 4-state precedence and why `search` (not `inbox`) was chosen as the icon.

**A11y-tree shape** (extends ORG-001's block — insert above `tablist: "Filter tasks"`; the no-results line replaces the task-row list only in that specific state, same as the existing filter-empty lines):
```
heading: "Hi, <name>" | "Hi there"
textbox: "Search tasks"
button: "Clear search"                          — only when query is non-empty
tablist: "Filter tasks"
  tab: "All"
  tab: "Active"
  tab: "Completed"
(list of task rows — TSK-001)
  — or, when the derived list is empty (see precedence table above) —
text: "No tasks yet" / "Tap the + button below to add your first task."
text: "No results" / "No tasks match "<query>"."
text: "No active tasks" / "Everything's complete."
text: "No completed tasks" / "Complete a task to see it here."
button: "Add task"
```

**Missing tokens check:** none. Every element reuses existing tokens/components — `FormField`'s input-row chrome verbatim, `IconButton` verbatim (its default `iconSize`, `text-muted` color, and `min-h-12 min-w-12` floor, unmodified), `EmptyState` verbatim, spacing step 2 (`gap-2`, already documented — icon↔label / title↔message gap) and the header's own existing step-3 rhythm, the `search` Feather glyph (already in the app's icon vocabulary via `EmptyState`'s own filter-empty rows and the ORG-001 precedent). **Verified against banned-defaults #1–8:** no pure black/white, no default-RN-blue, no color-only state (the clear button's appear/disappear is a content change, not a color change; the no-results state pairs a distinct icon + distinct copy, never color alone), no hardcoded hex (icon colors route through `NATIVE_CHROME_RGB`), no shadow additions, weight budget unchanged (input text stays 400, no new weight), 4pt-grid spacing only, no new semantic color. Did NOT touch `mobile/src` (authz boundary — `frontend` implements from this spec).

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
- 2026-07-11 — design agent (PRO-001): added `Button` (primary — formalizes the CTA recipe already shipped inline by `EmptyState`'s action button, extends it with disabled/loading states) and `FormField` (label + input + inline validation error, F-033) to the Component inventory — the Tier-1 form pattern PRO-001 anchors and TSK reuses. No new color/type/spacing/radius tokens; one native-prop-map extension (`danger` added to `NATIVE_CHROME_RGB`, values already documented, per the existing native-prop-color-resolution pattern). Verified against banned-defaults #1–#8: no pure black/white, no default-RN-blue, no color-only state (every `danger` use pairs with the `alert-circle` icon + error text), no hardcoded hex, no shadow additions, ≤2 non-headline weights (400 body/label/error + 600 button label, with `text-2xl`/700 reserved for the screen's single welcome headline per the type-scale exception), 4pt-grid spacing only, no new semantic color.
- 2026-07-11 — librarian (PRO-001, PR #10): reconciled the `Screen` "Scroll" row — it previously said keyboard-avoidance was out of scope; PRO-001's code review made `scroll` mode keyboard-aware by default (`keyboardShouldPersistTaps="handled"` + `automaticallyAdjustKeyboardInsets` on the internal `ScrollView`), so a form screen no longer needs its own `KeyboardAvoidingView`. Verified `Button`/`FormField` inventory entries above against the shipped `mobile/src/components/ui/{Button,FormField}.tsx` — consistent, no correction needed.
- 2026-07-11 — design agent (PRO-002 visual spec): added `Avatar` (circular initials/icon chip, F-005 — reuses `EmptyState`'s exact `primary/10` chip treatment + its 64dp size as the `'md'` preset; PRO-003 will extend it with a `photoUri` prop, not stubbed yet) and `SegmentedControl` (F-003, generalized single-select control — first use: Profile's System/Light/Dark theme toggle; explicitly promoted for TSK/ORG's filter-chip/sort-option reuse rather than kept screen-local) to the Component inventory. No new color/type/spacing/radius tokens — both reuse the existing 400/600 weight pair, the `radius-sm`/`radius-md`/`radius-full` set, and `EmptyState`'s established icon-chip sizing. Verified against banned-defaults #1–#8: no pure black/white, no default-RN-blue, no color-only state (`SegmentedControl`'s selection pairs fill + weight change; `Avatar`'s icon fallback reuses the existing `primary` native-prop resolution), no hardcoded hex, no shadow additions, ≤2 weights per rendered screen state (PRO-002's view/edit states both stay at exactly 400+600, no 700 needed), 4pt-grid spacing only, no new semantic color. Full PRO-002 screen spec (avatar/name/email layout, inline edit-mode recommendation, Settings-ish theme section) returned to the orchestrator/frontend directly, not duplicated into this file per the "screen-specific composition stays in the spec, not the doc" rule.
- 2026-07-11 — librarian (PRO-002, PR #11): verified the shipped `mobile/src/components/ui/{Avatar.tsx,SegmentedControl.tsx}` match the inventory entries above exactly (props, size presets, a11y roles, token usage) — no correction needed. **Watch item, not yet promoted (single use):** `ProfileScreen`'s edit-mode "Cancel" affordance is a plain `Pressable` with `text-sm font-medium text-text-muted` (no `Button`/border/fill) rather than a themed secondary-button component — a reasonable one-off for a low-emphasis dismiss action, but if a second screen (TSK's edit-task form is the likely next form) reaches for the same "plain muted text-pressable = cancel" shape, promote it to a named `components/ui` primitive (e.g. `TextButton`) instead of a third hand-rolled copy.
- 2026-07-11 — librarian (PRO-003, PR #12): added `ActionSheet` (F-003/F-004 — themed cross-platform Modal bottom-sheet, first use `AvatarPhotoField`'s photo-action menu) to the Component inventory — it shipped without a formal entry (flagged by both code-review and the builder); backfilled here. Extended `Avatar`'s entry with its now-implemented `photoUri?: string` prop (renders an `Image`, falls back to initials/icon on missing/broken uri). No new color/type/spacing/radius tokens — `ActionSheet` reuses `card`/`radius-lg` (the same signature shape as a task card) and the `text/40` opacity-modifier pattern `EmptyState` already established. Verified against banned-defaults #1–#8: no pure black/white, no default-RN-blue, no color-only state (`destructive` option pairs `danger` color with a weight change), no hardcoded hex, no shadow additions, ≤2 weights, 4pt-grid spacing, no new semantic color. **2 non-blocking nits carried to `stack.md` PRO-003 spec-gap notes** (badge-icon color literal vs. token reference; `ActionSheet` role/empty-onPress a11y polish) — did not block the gate.
- 2026-07-12 — design agent (TSK-001 visual spec): added `TaskListItem` (F-008/FR5 — the reused task-row card; ORG's later filtered list reuses this unchanged, per the reuse-or-block contract) to the Component inventory. No new color/type/spacing/radius tokens — reuses `card`/`radius-lg` (the signature card shape), the existing `primary`/`text-muted` tokens, and `text-xs`'s already-documented 500-weight "captions, meta" usage (its first real use in the app, an exact fit for the due-date caption). **Evaluated the FAB for promotion — decided one-off (screen-local to Home):** no second consumer exists yet across the TSK/ORG task list (`docs/graph/modules.json`), so its recipe is specified in the TSK-001 screen spec rather than `components/ui`; promote it the moment a second module needs a floating quick-action button. Verified against banned-defaults #1–#8: no pure black/white, no default-RN-blue, no color-only state (completed = check-fill + strikethrough + muted, never muted-alone), no hardcoded hex (elevation shadow resolves through the existing `NATIVE_CHROME_RGB` native-prop convention), no shadow beyond the anti-pattern #5 ceiling (dark mode: none at all), Home-screen weight budget = `text-2xl`/700 (the one hero-headline exception, precedent set at PRO-001) + `text-base`/400 (title) + `text-xs`/500 (due-date caption) — 2 non-hero weights, within budget. 4pt-grid spacing only, no new semantic color.
- 2026-07-12 — librarian (TSK-001, PR #13): verified the shipped `mobile/src/components/ui/TaskListItem.tsx` matches the inventory entry above exactly (props, elevation resolution, a11y labels, token usage) — no correction needed. Confirmed the FAB's one-off (screen-local to Home) decision is recorded here for a future FAB consumer to check before hand-rolling a second one.
- 2026-07-12 — librarian (TSK-002, PR #14, review): `FormField` (row above, line 175) gained a `multiline`/`numberOfLines` mode for the new task-description field — `min-h-24` + `textAlignVertical: 'top'` when set, single-line path unchanged. No new tokens (reuses existing spacing scale). Not yet visually verified on a physical Android device — flagged in `stack.md` TSK-002 spec-gap notes for the module-edge visual pass. `TaskForm`/`AddTaskScreen` themselves are feature-level (`features/tasks/`), not `components/ui` — no inventory entry.
- 2026-07-12 — design agent (TSK-003 visual spec): added a new "Screen specs" section with the `TaskDetailScreen` layout (F-009/F-018/F-019/F-041) — a deliberate exception to the PRO-002 "screen composition stays in the spec" precedent, because it records two decisions a later screen must check first: reusing `TaskListItem`'s read-only status glyph outside a list row (paired with the `success` token's first real text usage), and the "action zone leaves room" pattern (`Edit task` renders `fullWidth={false}` so TSK-004's complete/duplicate/delete actions land in the same row without a layout rework). Date format for Created/Last updated fixed at `"MMM d, yyyy · h:mm a"`; due date's value slot is a value-swap TSK-005 fills in, not decided here. No new color/type/spacing/radius tokens — every element reuses the existing palette/scale plus the already-established native-prop-color and `Feather`-icon conventions. Verified against banned-defaults #1–#8: no pure black/white, no default-RN-blue, no color-only state (`Completed` status pairs `success` with a weight change + the checkbox fill + text-content change), no hardcoded hex, no shadow additions, weight budget stays at 400+600 (`text-xs`'s baked-in 500 for meta captions doesn't count, same exception as TaskListItem's Home-screen budget), 4pt-grid spacing only, no new semantic color. Did NOT touch `mobile/src` (authz boundary — `frontend` implements from this spec).
- 2026-07-12 — design agent (TSK-004 visual spec): added the "Task lifecycle actions" subsection (F-011–F-015) — one coherent affordance model for complete/pending, delete+confirm, and duplicate, reused identically on the Home row and Task Detail: a "⋯" overflow control opens `ActionSheet`, delete always routes through a second `ActionSheet` acting as the confirm. **Two small, backward-compatible extensions to the `ActionSheet` entry above** (both optional, existing PRO-003 call site unaffected): `title?: string` (confirm-sheet header) and `options[].icon?: FeatherIconName` (leading glyph per row) — same "extend the primitive, don't fork it" precedent as `FormField` gaining `multiline` at TSK-002. Updated the `TaskListItem` entry: its trailing `chevron-right` is superseded by the new "⋯" button (`onOpenActions` prop added), and its checkbox `accessibilityLabel` copy is corrected `"...as active"` → `"...as pending"` to match the "Mark complete ⇄ Mark pending" wording this task makes canonical. Updated the TSK-003 screen-spec row #6 (now "Action zone") and its a11y-tree block to reflect the two new Detail icon-buttons (Toggle, More). Resolved F-015's suffix open point: **no "(copy)" suffix** — list adjacency already disambiguates a duplicate from its original. **No new tokens** — every new element reuses `primary`/`success`/`danger`/`text`/`text-muted`/`border`, `radius-md`, spacing step 3, and the existing 400/600 weight pair (the Detail toggle's completed state reuses `success` + a `success/10` background fill via the same opacity-modifier mechanism `primary/10` already established, never color-alone). Flagged one new **single-use, not-yet-promoted** shape (the 48dp outlined icon-button chrome backing Detail's Toggle/More buttons) — promote to `components/ui` on a second consumer, per the PRO-002 Cancel-pressable precedent. Did NOT touch `mobile/src` (authz boundary — `frontend` implements from this spec).
- 2026-07-12 — design agent (TSK-005 visual spec + canonical date-format ruling): added the "Due date field" subsection (F-016/F-017) — a labeled trigger+clear row in the shared `TaskForm`, below Description, reusing `FormField`'s label treatment (not the component itself — a `Pressable` pair has no text-input/error shape to extend) and the `FormField` input chrome for the trigger. The Clear ("×") button reuses TSK-004's icon-button chrome (`ICON_BUTTON_BASE_CLASSNAME`) **verbatim as its second consumer** — flagged for promotion to a named `components/ui/IconButton` primitive now that two call sites exist. Ruled Clear **neutral** (`text-muted`), not `danger`-tinted: clearing a due date is a low-stakes, instantly-reversible field edit, unlike the two-step-confirmed Delete Task action `danger` is reserved for. **Made the canonical due-date format decision** (the important part): two reconciled variants, NOT one shared string — `DUE_DATE_FORMAT_COMPACT = 'MMM d, h:mm a'` (list row, space-constrained, no year) and `DUE_DATE_FORMAT_FULL = 'MMM d, yyyy · h:mm a'` (Task Detail's due-date row AND the new `TaskForm` trigger's set-value display — both roomy, single-record contexts) — consolidated into one new shared util, `features/tasks/lib/formatDueDate.ts`, replacing the disagreeing `TaskListItem.tsx:37` (`'MMM d'`, no time) and `TaskDetailScreen.tsx:45` (`'MMM d, yyyy'`, no time) constants; both surfaces now also carry the time the user picks (FR2), which neither did before. `DUE_DATE_FORMAT_FULL` is deliberately the same literal string as the untouched `META_DATE_FORMAT` (one "full timestamp" grammar app-wide) but stays a separate named constant — `META_DATE_FORMAT`/`formatMetaDate` are explicitly out of scope and unchanged. **Zero new tokens** — every value (`text`/`text-muted`/`border`/`surface`/`radius-md`, spacing steps 1–4, the 16dp/20dp icon sizes) is reused from an existing token or an already-used icon size. Verified against banned-defaults #1–#8: no pure black/white, no default-RN-blue, no color-only state, no hardcoded hex, no shadow additions, weight budget unchanged (400 only, both states), 4pt-grid spacing only, no new semantic color. Did NOT touch `mobile/src` (authz boundary — `frontend` implements from this spec).
- 2026-07-12 — librarian (TSK-005, PR #17, review): **spec-path correction.** The util above landed at `mobile/src/core/lib/formatDueDate.ts`, not the spec's `features/tasks/lib/formatDueDate.ts` — a deliberate, correctly-reasoned divergence: `TaskListItem` (a consumer) lives in `components/ui`, and `eslint-plugin-boundaries` disallows `components → feature` imports, so `core/lib` (the one layer both `components/ui` and `features/tasks` may import) is the only legal home, same precedent as `core/lib/id.ts`. Every other ruling in the entry above (both constants, both function bodies, "one util, no scattered constant") shipped verbatim. See patterns-registry.md → "Due-date formatting util" for the reusable placement rule. Also confirmed: the `IconButton` promotion flagged above shipped as `mobile/src/components/ui/IconButton.tsx` (10th `components/ui` primitive) — `TaskDetailScreen`'s Toggle/More buttons were refactored onto it alongside `DueDateField`'s Clear button.
- 2026-07-12 — design agent (ORG-001 visual spec): added the "Organize header (Home)" subsection — the 3-slot spine (search → filter+sort, top-to-bottom) `HomeScreen` inserts between the greeting and the `FlatList`, **pinned** (a fixed sibling, never a `ListHeaderComponent`) so filter/search/sort never scroll away. Only slot 2 (the filter `SegmentedControl`, All/Active/Completed) builds now, reused verbatim, bound to the new `taskQueryStore`; slots 1 (search, ORG-002) and 3 (sort trigger, ORG-003) are **structurally** reserved — ORG-002 prepends a sibling to the header's outer `gap-3` stack, ORG-003 appends an `IconButton` sibling inside the filter's own row — neither requires touching the container this task ships. Two new filtered-empty `EmptyState` copy pairs (Active-filter-none-active / Completed-filter-none-completed), reusing existing Feather glyphs (`check-circle`/`circle`) already in the app's icon vocabulary and the app's own canonical status wording ("complete", matching "Mark complete"/"Completed" everywhere else) rather than inventing new tone. **Zero new tokens** — every value is an already-documented spacing step (3, 4) or an already-reused component/icon. Verified against banned-defaults #1–8: no pure black/white, no default-RN-blue, no color-only state, no hardcoded hex, no shadow additions, weight budget unchanged, 4pt-grid spacing only, no new semantic color. Did NOT touch `mobile/src` (authz boundary — `frontend` implements from this spec).
- 2026-07-12 — design agent (ORG-002 visual spec): added the "Search bar + no-results" subsection (F-020/F-021/F-022/F-031) — fills ORG-001's reserved slot 1 with a real-time search row: a `FormField`-chrome input box (leading `search` icon, decorative/hidden from a11y tree, 16dp — same size/role as `DueDateField`'s `calendar` icon) plus, as a **sibling** box (not nested — avoids forcing the row past the app's universal 48dp input height), the existing `IconButton` primitive reused verbatim as the "Clear search" affordance, shown only when the query is non-empty. Mirrors `DueDateField`'s trigger+clear sibling structure exactly (TSK-005) — no new layout invented. Added the dedicated no-search-results `EmptyState` (`title="No results"`, dynamic `message` interpolating the trimmed query — the first `EmptyState` consumer with a non-static message — `icon="search"`, reusing the glyph already visible in the search input itself rather than introducing `inbox`). **Resolved the 4-state empty-state precedence** left open by ORG-001: no-tasks → no-results (new, wins over an active filter) → filtered-empty; updated the ORG-001 precedence table + prose in place rather than duplicating it. **Zero new tokens** — every value is `FormField`'s existing input-row chrome, `IconButton`'s existing default recipe, `EmptyState` verbatim, and spacing step 2 (`gap-2`, already documented for icon↔label/title↔message gaps). Verified against banned-defaults #1–#8: no pure black/white, no default-RN-blue, no color-only state, no hardcoded hex, no shadow additions, weight budget unchanged (input text stays 400), 4pt-grid spacing only, no new semantic color. Did NOT touch `mobile/src` (authz boundary — `frontend` implements from this spec).
