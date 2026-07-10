# Architecture — Todo App

> Living doc, owned by the **architect**, maintained by the **librarian**.
> Grounded in the real `mobile/src` tree + the Graphify graph once code exists.
> This is a frontend-only React Native client consuming a remote backend API — no backend, no database in this repo.

**FND-001 landed the real tree** (2026-07-10, PR #3). Everything below reflects what exists now; sections still
marked `(to be filled)` are genuinely empty scaffolds populated by later FND tasks.

## Layer diagram
Feature-sliced `mobile/src/`, alias `@/* → mobile/src/*` (`tsconfig.json` `paths` + `babel-plugin-module-resolver`
in `babel.config.js`):
- `src/app/` — composition root: `AppProviders.tsx` (see Tier-1 pattern below); `navigation/` now live (FND-003, see below).
- `src/core/{api,config,hooks,lib,services,store,types}` — cross-feature primitives. Only `core/lib` has real content
  (`constants.ts` + barrel); the rest are `.gitkeep` scaffolds awaiting their owning task.
- `src/features/` — empty scaffold; first feature slice lands post-FND.
- `src/components/ui/`, `src/platform/`, `src/theme/` — empty scaffolds (FND-002/004/005 populate these).

**Enforced import direction:** `app → features → core|components|theme|platform`; no cross-feature imports (same-feature
siblings allowed). Enforced by `eslint-plugin-boundaries` in `mobile/.eslintrc.js` (`--max-warnings=0` gate — a
violation is a hard lint error, not a warning). See patterns-registry for the reference config.

## core/api
**LOCAL-ONLY build — no API client wired (OQ-1).** `axios` + `@tanstack/react-query` are installed **dormant**
(package.json only); no client instance, no interceptor, no `QueryClientProvider` exists yet. Feature code must not
import either until a future cloud-sync phase is scoped.

## core/config
_(to be filled — app bootstrap and any dynamic config resolution before the first screen renders.)_

## core/store — Zustand
**`themeStore` lands (FND-002)** — the first UI-state store, and the reference for the pattern: `mode: 'system'|'light'|'dark'` + derived `resolvedScheme`, MMKV-persisted (`theme.mode` raw key), restored synchronously at module load. Server state still lives in React Query hooks only, never duplicated here. See patterns-registry → "Theme store + provider".

## core/hooks — React Query wrappers
_(to be filled — dormant until the API client is wired; no hooks exist yet.)_

## src/app/navigation
**Live (FND-003).** Boot path: `App.tsx` → `AppProviders` (GestureHandlerRootView → SafeAreaProvider → ThemeProvider) → `NavigationRoot` (mounts `NavigationContainer`, themed via `buildNavigationTheme(resolvedScheme)`, `enableScreens()` called once at module load) → `RootNavigator` (native-stack, `initialRouteName="Splash"`).

Route set (`RootStackParamList`):
- `Splash` — initial route; hands off to FND-004's bootstrap logic (placeholder here).
- `ProfileSetup` — first-launch route; placeholder, built out in **PRO**.
- `Tabs` — the bottom-tab navigator (`TabParamList`: `Home`, `Profile`), both placeholders; **Home** built out in **TSK**, **Profile** in **PRO**.
- `AddTask` (`undefined`), `EditTask` (`{taskId}`), `TaskDetail` (`{taskId}`) — pushed stack screens, headers shown with real titles; placeholders, built out in **TSK**.

Typed-navigation, nav-theming, themed-StatusBar, and placeholder/jest-setup patterns are now Tier-1 — see patterns-registry.md. No deep-linking config wired (spec: none in MVP; shape supports adding one later without restructuring).

## src/platform — native-bridge adapters
_(to be filled — empty scaffold. `react-native-mmkv@2.12.2` (v2, old-arch) installed; no storage service yet (owned by a future STG task). `react-native-keychain` installed dormant.)_

## src/theme — design tokens
**Live (FND-002).** `ThemeProvider` + `useTheme()` implement light+dark theming: semantic color tokens as CSS vars in `tailwind.config.js`/`global.css` (`:root` = light, `.dark` = dark, `darkMode: 'class'`), `themeStore` (above) resolves the active scheme, `ThemeProvider` pushes it into NativeWind's `colorScheme.set(...)` and reacts live to OS scheme changes while `mode === 'system'`. Mounted in `AppProviders` (`mobile/src/app/AppProviders.tsx`) between `SafeAreaProvider` and `NavigationRoot` (FND-003, passed in as `children` from `App.tsx`). As of FND-003, `ThemeProvider` also renders a themed `<StatusBar>` (OS chrome — flips with `resolvedScheme`, independent of the nav container's own `theme.dark`; see patterns-registry). Type scale + border-radius tokens also land here. See patterns-registry → "Semantic design-token theming". `mobile/babel.config.js` now also registers `react-native-reanimated/plugin` (last, per Reanimated's requirement — carry-forward fix from FND-001).

## External integrations
**None wired.** No backend API call is made anywhere in the app yet — the app boots and runs fully offline (F-048 groundwork). This is deliberate per OQ-1, not a gap.

## Data model
_(to be filled — no local database; persistent state will be MMKV (non-secret), Keychain (secrets), and the React Query cache. Canonical TypeScript types live in `core/types/` — currently an empty scaffold.)_

## Graphify graph summary
_(not yet rebuilt — per-task librarian mode only runs the fast AST update via the post-commit hook. The full semantic `/graphify ./mobile` rebuild is deferred to the FND module edge.)_
