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

## STG — module complete (2026-07-11)
Both STG tasks merged (PRs #8, #9); coherence review **PASS** (structural, zero findings, `docs/graph/coherence/STG.md`);
human integration go given; local E2E **deferred** by explicit human decision (STG is headless — no screens — so
persistence E2E is naturally exercised at the module edge of the first UI module that consumes it, PRO/TSK).
**The complete persistence layer, one coherent picture, bottom-up:**
1. **`core/services/storage.ts`** — the single MMKV service. `getItem<T>(key,schema,fallback)` / `setItem` / `removeItem` / `hasItem`
   over one shared **default** `MMKV()` instance. Every value wrapped in a `{version,data}` envelope
   (`core/types/storage.ts:StorageEnvelope`) with a `migrate()` seam. Every read is **total** — absent/corrupt/unmigratable
   never throws, always falls back to the caller's default (F-038). `createPersistedValue(key,schema,fallback)` is the
   store-hydration helper (`{hydrate,persist}`) every Zustand store with persisted state reuses.
2. **`core/services/{profileRepository,taskRepository}.ts`** — the data-access API on top of the service. Reads total
   (`null`/`[]` safe defaults), writes Zod-validate-then-throw (a caller bug, not corrupt storage — deliberately not
   swallowed). `taskRepository.upsertTask` is a **wholesale field replace** on update, not a patch.
3. **`core/types/{profile,task}.ts`** — the domain model, declared exactly once (Zod schema + `z.infer`). `Task.id` is
   `z.string().uuid()`, `Task.dueDate` requires full ISO-8601 (`z.string().datetime()`).
4. **`core/lib/id.ts:newId()`** — the one id-generation util (`react-native-uuid` v4, `Math.random()`-backed — non-CSPRNG,
   internal ids only).
- **Default-instance coexistence with FND:** STG's `storage.ts` deliberately opens the **same** default `MMKV()` instance
  FND's `themeStore`/`launchStore` already use — their raw keys `theme.mode`/`app.hasLaunched` stay readable, unchanged,
  un-migrated (coherence spec-gap b, now closed). `StorageKeys` (`profile`, `tasks`) are namespaced separately from those
  two raw keys — no collision possible.
This is the reference PRO/TSK read for any new persisted domain — see patterns-registry.md → "Typed storage service" /
"Store hydration pattern" / "Persisted domain model" / "Repository pattern" / "ID generation", and
`docs/context/stack.md` → "Forward spec-gaps from the STG coherence review" for the 6 items PRO/TSK must respect.

## Layer diagram
Feature-sliced `mobile/src/`, alias `@/* → mobile/src/*` (`tsconfig.json` `paths` + `babel-plugin-module-resolver`
in `babel.config.js`):
- `src/app/` — composition root: `AppProviders.tsx` (see Tier-1 pattern below); `navigation/` now live (FND-003, see below).
- `src/core/{api,config,hooks,lib,services,store,types}` — cross-feature primitives. Only `core/lib` has real content
  (`constants.ts` + barrel); the rest are `.gitkeep` scaffolds awaiting their owning task.
- `src/features/` — **live (PRO-001, PR #10 pending merge).** `features/profile` is the app's first feature slice: `store/profileStore.ts` (Zustand, hydrates from `profileRepository`) + `screens/ProfileSetupScreen.tsx` (the mandatory first-launch form). `features/tasks` still an empty scaffold, lands with TSK.
- `src/components/ui/` — **live (FND-005, extended PRO-001).** `EmptyState`, `LoadingIndicator`, `Screen` (FND-005) + `Button`, `FormField` (PRO-001, barrel `@/components/ui`) — see below. `src/platform/`, `src/theme/` — `theme/` live (FND-002/003); `platform/` still an empty scaffold.

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

## core/services — typed storage service + domain repositories
**Live (STG-001, extended STG-002).** `storage.ts` is the app's single persistence primitive: `getItem<T>(key,schema,fallback)` / `setItem` / `removeItem` / `hasItem` over one shared **default** `MMKV` instance (`new MMKV()` — deliberately the same instance FND's `themeStore`/`launchStore` already use, per coherence spec-gap b, so their raw keys `theme.mode`/`app.hasLaunched` stay readable, unchanged, un-migrated). Every value is wrapped in a `{version,data}` envelope (`core/types/storage.ts:StorageEnvelope`) with a `migrate()` seam for future schema changes; every read is total — never throws, falls back to the caller's default on any corruption (F-038). `createPersistedValue(key,schema,fallback)` is the store-hydration helper STG-002/PRO/TSK reuse to seed a Zustand store at init and write back on mutation (F-037). `StorageKeys` now has two entries — `profile` and `tasks` (STG-002). On top of that, `profileRepository.ts` (`getProfile`/`saveProfile`/`clearProfile`) and `taskRepository.ts` (`getTasks`/`saveTasks`/`upsertTask`/`removeTask`) are the ONLY persistence path for those two domains — see patterns-registry.md → "Typed storage service" / "Store hydration pattern" / "Persisted domain model" / "Repository pattern".

## src/app/navigation
**Live (FND-003; boot sequence real as of FND-004).** Boot path: `App.tsx` → `AppProviders` (GestureHandlerRootView → SafeAreaProvider → ThemeProvider) → `NavigationRoot` (mounts `NavigationContainer`, themed via `buildNavigationTheme(resolvedScheme)`, `enableScreens()` called once at module load) → `RootNavigator` (native-stack, `initialRouteName="Splash"`) → `Splash` = `BootstrapScreen` (FND-004, real implementation, replaces FND-003's placeholder): reads `useLaunchStore().hasLaunched` (already resolved synchronously at module load, same pattern as `themeStore`), `navigation.reset`s into `ProfileSetup` (first launch) or `Tabs` (returning), then hides the native splash (`BootSplash.hide({fade:true})`). Zero network calls anywhere in this path — no `react-query` mounted, no connectivity gate (F-048).

Route set (`RootStackParamList`):
- `Splash` — initial route; **`BootstrapScreen` (FND-004)** — routes to `ProfileSetup`/`Tabs` based on the `app.hasLaunched` MMKV flag, see patterns-registry → "App bootstrap / first-launch seam".
- `ProfileSetup` — first-launch route; **now the real `ProfileSetupScreen` (PRO-001, PR #10 pending merge)**, replacing the FND-003 placeholder — Name+Email form (RHF+Zod), on valid submit persists via `profileStore`/`profileRepository` then calls `setHasLaunched()` (the single first-launch writer — FND-004 only reads the flag) and resets navigation to `Tabs`.
- `Tabs` — the bottom-tab navigator (`TabParamList`: `Home`, `Profile`), both placeholders; **Home** built out in **TSK**, **Profile** in **PRO**.
- `AddTask` (`undefined`), `EditTask` (`{taskId}`), `TaskDetail` (`{taskId}`) — pushed stack screens, headers shown with real titles; placeholders, built out in **TSK**.

Typed-navigation, nav-theming, themed-StatusBar, and placeholder/jest-setup patterns are now Tier-1 — see patterns-registry.md. No deep-linking config wired (spec: none in MVP; shape supports adding one later without restructuring).

## src/components/ui — shared presentational primitives
**Live (FND-005, extended PRO-001).** `EmptyState` (F-030), `LoadingIndicator` (F-032), `Screen`/`Container` (F-046) from FND-005 — the a11y baseline (F-047) is baked into all three (roles/labels, ≥48dp targets, `fontScale`-safe). PRO-001 adds `Button` (primary CTA, `disabled`/`loading` states) and `FormField` (label+input+inline-error, F-033) — the Tier-1 form-UI pair every RHF+Zod form (TSK included) reuses. `Screen`'s `scroll` mode is now keyboard-aware by default (`keyboardShouldPersistTaps`/`automaticallyAdjustKeyboardInsets`, added for PRO-001's form). **Reuse contract:** features import via `@/components/ui`; re-implementing any of the five is a `[blocking]` code-review finding (ORG's F-031 reuses `EmptyState`, TSK's F-042 reuses `LoadingIndicator` — see patterns-registry). Native-only color props (`ActivityIndicator`/icon `color`) resolve from `src/theme/nativeChromeColors.ts`, the same source `TabNavigator`/`ThemeProvider`/`FormField`'s error icon already use — see patterns-registry.

## src/platform — native-bridge adapters
_(to be filled — empty scaffold. `react-native-mmkv@2.12.2` (v2, old-arch) is consumed by `core/services/storage.ts` (STG-001, see above), not from here. `react-native-keychain` installed dormant.)_

## src/theme — design tokens
**Live (FND-002).** `ThemeProvider` + `useTheme()` implement light+dark theming: semantic color tokens as CSS vars in `tailwind.config.js`/`global.css` (`:root` = light, `.dark` = dark, `darkMode: 'class'`), `themeStore` (above) resolves the active scheme, `ThemeProvider` pushes it into NativeWind's `colorScheme.set(...)` and reacts live to OS scheme changes while `mode === 'system'`. Mounted in `AppProviders` (`mobile/src/app/AppProviders.tsx`) between `SafeAreaProvider` and `NavigationRoot` (FND-003, passed in as `children` from `App.tsx`). As of FND-003, `ThemeProvider` also renders a themed `<StatusBar>` (OS chrome — flips with `resolvedScheme`, independent of the nav container's own `theme.dark`; see patterns-registry). Type scale + border-radius tokens also land here. See patterns-registry → "Semantic design-token theming". `mobile/babel.config.js` now also registers `react-native-reanimated/plugin` (last, per Reanimated's requirement — carry-forward fix from FND-001).

## External integrations
**None wired.** No backend API call is made anywhere in the app yet — the app boots and runs fully offline, confirmed end-to-end by FND-004 (F-048: zero network on boot, no `react-query` mounted, airplane-mode cold start reaches its entry screen). This is deliberate per OQ-1, not a gap.

## Data model
**Live (STG-002).** No backend/database — the canonical domain model is two Zod schemas in `core/types/`, persisted via MMKV through the repositories above (no Keychain/React-Query use yet, both still dormant):
- **`Profile`** (`core/types/profile.ts`) — `{ name: string (required), email: string (required, valid email), photo?: string (local file uri) }`. One per device, under `StorageKeys.profile`.
- **`Task`** (`core/types/task.ts`) — `{ id: string (uuid v4), title: string (required), description?: string, status: 'active'|'completed', dueDate?: string (full ISO-8601, optional), createdAt: string (ISO-8601), updatedAt: string (ISO-8601) }`. Persisted as one `Task[]` blob under `StorageKeys.tasks` (`taskListSchema`). `id: string` satisfies the FND coherence spec-gap (d) — the nav `taskId: string` route-param contract.
- `id`s are minted by `core/lib/id.ts:newId()` (`react-native-uuid`, non-CSPRNG — internal ids only, see patterns-registry).
- **Ownership boundary:** STG owns the schemas + repositories; PRO builds its profile feature-store/screens on `profileRepository`, TSK builds its task feature-store/screens on `taskRepository` — neither touches MMKV or re-declares the shapes. See `docs/context/stack.md` → "Forward contracts for TSK" for the `upsertTask`/`dueDate` behaviors TSK must respect.

## Graphify graph summary
_(still not built — attempted at the FND module edge, 2026-07-11: no `graphify` CLI, `/graphify` command, or
`post-commit` hook exists anywhere in this repo or on PATH, despite being referenced as live machinery in
`harness.config.md`/`librarian.md`/`harness-sync.md`. This is a tooling gap, not a "no code to graph" state —
`mobile/src` has substantial real code. See `docs/graph/logs/graphify-FND.log` and
`docs/context/harness-debt.md`. Grounding for now is direct Read/Grep of `mobile/src`, not `graphify query`.)_
