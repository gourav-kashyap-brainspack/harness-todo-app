# Architecture — Todo App

> Living doc, owned by the **architect**, maintained by the **librarian**.
> Grounded in the real `mobile/src` tree + the Graphify graph once code exists.
> This is a frontend-only React Native client consuming a remote backend API — no backend, no database in this repo.

**FND-001 landed the real tree** (2026-07-10, PR #3). Everything below reflects what exists now; sections still
marked `(to be filled)` are genuinely empty scaffolds populated by later FND tasks.

## FND — module complete (2026-07-11)
All 5 FND tasks merged (PRs #3–#7); coherence review **PASS** (structural, zero findings); human integration
go given; local E2E **deferred** (human decision — no end-to-end-testable surfaces yet, `.maestro/` empty).
See `docs/graph/coherence/FND.md` for the full verdict. The one-paragraph picture: **app boots fully offline**
(`App.tsx` → `AppProviders` → themed `NavigationRoot` → `BootstrapScreen` reads a single MMKV flag →
`ProfileSetup`/`Tabs`), every screen is styled from one semantic token set (light/dark, `themeStore`), every
persisted preference goes through one guarded-MMKV-read shape (`themeStore`, `launchStore`), navigation is one
typed tree with no ad-hoc navigators, and the three shared UI primitives (`EmptyState`/`LoadingIndicator`/
`Screen`) are the only presentational building blocks so far. Zero network/auth surface (dormant deps only).
This is the reference foundation every later module (STG, PRO, TSK, ORG) builds on — see the patterns registry
for the specific Tier-1 mechanics and the Spec-gap notes in `docs/context/stack.md` for forward guidance.

## Layer diagram
Feature-sliced `mobile/src/`, alias `@/* → mobile/src/*` (`tsconfig.json` `paths` + `babel-plugin-module-resolver`
in `babel.config.js`):
- `src/app/` — composition root: `AppProviders.tsx` (see Tier-1 pattern below); `navigation/` now live (FND-003, see below).
- `src/core/{api,config,hooks,lib,services,store,types}` — cross-feature primitives. Only `core/lib` has real content
  (`constants.ts` + barrel); the rest are `.gitkeep` scaffolds awaiting their owning task.
- `src/features/` — empty scaffold; first feature slice lands post-FND.
- `src/components/ui/` — **live (FND-005).** `EmptyState`, `LoadingIndicator`, `Screen` (barrel `@/components/ui`) — see below. `src/platform/`, `src/theme/` — `theme/` live (FND-002/003); `platform/` still an empty scaffold.

**Enforced import direction:** `app → features → core|components|theme|platform`; no cross-feature imports (same-feature
siblings allowed). Enforced by `eslint-plugin-boundaries` in `mobile/.eslintrc.js` (`--max-warnings=0` gate — a
violation is a hard lint error, not a warning). See patterns-registry for the reference config.

## core/api
**LOCAL-ONLY build — no API client wired (OQ-1).** `axios` + `@tanstack/react-query` are installed **dormant**
(package.json only); no client instance, no interceptor, no `QueryClientProvider` exists yet. Feature code must not
import either until a future cloud-sync phase is scoped.

## core/config
_(still empty — the boot sequence itself lives in `src/app/navigation/BootstrapScreen.tsx` + `core/store/launchStore.ts`, not here; no dynamic config resolution exists yet.)_

## core/store — Zustand
**`themeStore` (FND-002)** — the first UI-state store, and the reference for the pattern: `mode: 'system'|'light'|'dark'` + derived `resolvedScheme`, MMKV-persisted (`theme.mode` raw key), restored synchronously at module load. **`launchStore` (FND-004)** — second store, reuses the same raw-MMKV-preference pattern for a single boolean key `app.hasLaunched`, with one hardening on top (the guarded read also survives a *throwing* read, not just a bad type — FR6). `BootstrapScreen` only reads it; `setHasLaunched()` is the write seam PRO calls on setup-complete — see patterns-registry → "App bootstrap / first-launch seam". Server state still lives in React Query hooks only, never duplicated here.

## core/hooks — React Query wrappers
_(to be filled — dormant until the API client is wired; no hooks exist yet.)_

## src/app/navigation
**Live (FND-003; boot sequence real as of FND-004).** Boot path: `App.tsx` → `AppProviders` (GestureHandlerRootView → SafeAreaProvider → ThemeProvider) → `NavigationRoot` (mounts `NavigationContainer`, themed via `buildNavigationTheme(resolvedScheme)`, `enableScreens()` called once at module load) → `RootNavigator` (native-stack, `initialRouteName="Splash"`) → `Splash` = `BootstrapScreen` (FND-004, real implementation, replaces FND-003's placeholder): reads `useLaunchStore().hasLaunched` (already resolved synchronously at module load, same pattern as `themeStore`), `navigation.reset`s into `ProfileSetup` (first launch) or `Tabs` (returning), then hides the native splash (`BootSplash.hide({fade:true})`). Zero network calls anywhere in this path — no `react-query` mounted, no connectivity gate (F-048).

Route set (`RootStackParamList`):
- `Splash` — initial route; **`BootstrapScreen` (FND-004)** — routes to `ProfileSetup`/`Tabs` based on the `app.hasLaunched` MMKV flag, see patterns-registry → "App bootstrap / first-launch seam".
- `ProfileSetup` — first-launch route; placeholder, built out in **PRO** (which also owns the `setHasLaunched()` write once setup completes — FND-004 only reads the flag).
- `Tabs` — the bottom-tab navigator (`TabParamList`: `Home`, `Profile`), both placeholders; **Home** built out in **TSK**, **Profile** in **PRO**.
- `AddTask` (`undefined`), `EditTask` (`{taskId}`), `TaskDetail` (`{taskId}`) — pushed stack screens, headers shown with real titles; placeholders, built out in **TSK**.

Typed-navigation, nav-theming, themed-StatusBar, and placeholder/jest-setup patterns are now Tier-1 — see patterns-registry.md. No deep-linking config wired (spec: none in MVP; shape supports adding one later without restructuring).

## src/components/ui — shared presentational primitives
**Live (FND-005).** `EmptyState` (F-030), `LoadingIndicator` (F-032), `Screen`/`Container` (F-046) — the a11y baseline (F-047) is baked into all three (roles/labels, ≥48dp targets, `fontScale`-safe). **Reuse contract:** features import via `@/components/ui`; re-implementing any of the three is a `[blocking]` code-review finding (ORG's F-031 reuses `EmptyState`, TSK's F-042 reuses `LoadingIndicator` — see patterns-registry). Native-only color props (`ActivityIndicator`/icon `color`) resolve from `src/theme/nativeChromeColors.ts`, the same source `TabNavigator`/`ThemeProvider` already use — see patterns-registry.

## src/platform — native-bridge adapters
_(to be filled — empty scaffold. `react-native-mmkv@2.12.2` (v2, old-arch) installed; no storage service yet (owned by a future STG task). `react-native-keychain` installed dormant.)_

## src/theme — design tokens
**Live (FND-002).** `ThemeProvider` + `useTheme()` implement light+dark theming: semantic color tokens as CSS vars in `tailwind.config.js`/`global.css` (`:root` = light, `.dark` = dark, `darkMode: 'class'`), `themeStore` (above) resolves the active scheme, `ThemeProvider` pushes it into NativeWind's `colorScheme.set(...)` and reacts live to OS scheme changes while `mode === 'system'`. Mounted in `AppProviders` (`mobile/src/app/AppProviders.tsx`) between `SafeAreaProvider` and `NavigationRoot` (FND-003, passed in as `children` from `App.tsx`). As of FND-003, `ThemeProvider` also renders a themed `<StatusBar>` (OS chrome — flips with `resolvedScheme`, independent of the nav container's own `theme.dark`; see patterns-registry). Type scale + border-radius tokens also land here. See patterns-registry → "Semantic design-token theming". `mobile/babel.config.js` now also registers `react-native-reanimated/plugin` (last, per Reanimated's requirement — carry-forward fix from FND-001).

## External integrations
**None wired.** No backend API call is made anywhere in the app yet — the app boots and runs fully offline, confirmed end-to-end by FND-004 (F-048: zero network on boot, no `react-query` mounted, airplane-mode cold start reaches its entry screen). This is deliberate per OQ-1, not a gap.

## Data model
_(to be filled — no local database; persistent state will be MMKV (non-secret), Keychain (secrets), and the React Query cache. Canonical TypeScript types live in `core/types/` — currently an empty scaffold.)_

## Graphify graph summary
_(still not built — attempted at the FND module edge, 2026-07-11: no `graphify` CLI, `/graphify` command, or
`post-commit` hook exists anywhere in this repo or on PATH, despite being referenced as live machinery in
`harness.config.md`/`librarian.md`/`harness-sync.md`. This is a tooling gap, not a "no code to graph" state —
`mobile/src` has substantial real code. See `docs/graph/logs/graphify-FND.log` and
`docs/context/harness-debt.md`. Grounding for now is direct Read/Grep of `mobile/src`, not `graphify query`.)_
