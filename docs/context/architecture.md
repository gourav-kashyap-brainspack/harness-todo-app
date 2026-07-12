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

## PRO — module complete (2026-07-11)
All 3 PRO tasks merged (PRs #10, #11, #12); coherence review **PASS** (structural, zero findings); human
integration go given; local E2E **deferred** (human decision — disk-constrained environment, ~4.6GB free, blocks
the Android emulator + Maestro run). See `docs/graph/coherence/PRO.md` for the full verdict. **The complete
Profile feature slice, bottom-up:** `features/profile/store/profileStore.ts` (Zustand, hydrates once from
`profileRepository` — never raw MMKV) backs three screens/flows built on FND's nav+theme and STG's persistence:
1. **`ProfileSetupScreen`** (PRO-001) — the mandatory first-launch form (name+email, RHF+Zod) that **anchors the
   RHF+Zod form pattern** every later form (TSK) must reuse; on valid submit it is the single writer of
   `setHasLaunched()` (closes FND coherence gap a).
2. **`ProfileScreen`** (PRO-002) — view/inline-edit (same form anchor, `reset(profile)` seeds edit mode) +
   the System/Light/Dark theme toggle (`SegmentedControl<T>`, wired to `themeStore`, completes OQ-10).
3. **`AvatarPhotoField`** + **`lib/photoPicker.ts`** (PRO-003) — the single `react-native-image-picker` call
   site (camera/library/remove via `ActionSheet`), normalizing cancel/permission/error into a closed result;
   persists only a file-uri string through `profileStore`/`profileRepository` — the picker never persists.
`components/ui` grew from 3 to **8 primitives** across the module (`Button`, `FormField`, `Avatar` +photo
variant, `SegmentedControl<T>`, `ActionSheet`) — all barrel-exported, reuse-or-block for TSK/ORG. Zero direct
MMKV access in the feature, zero PII logging, no new network surface — the no-backend invariant holds. The app
now has a real first-run → mandatory setup → Home/Profile flow, in both light and dark, on a persisted profile.
This is the reference PRO read for TSK/ORG — see patterns-registry.md for the 4 new Tier-1 patterns this module
established (RHF+Zod form anchor, `Button`+`FormField`, feature-store-hydrates-from-repository, `SegmentedControl`,
`ActionSheet`, native image-picker), and `docs/context/stack.md` → "Forward spec-gaps from the PRO coherence
review" for the 5 items TSK/ORG must respect.

## ORG — module feature-complete (ORG-001/002 done/merged; ORG-003 review, PR #20 — LAST task)
ORG is the **final** module and is an **orchestration grouping, not a feature slice** — all its code lives inside
`features/tasks` (a `features/organize` slice reading `features/tasks`' store would be a `features→features`
boundary violation). **ORG-001 (the anchor, F-023/024/025) is done — PR #18 merged 2026-07-12.** It added:
1. **`features/tasks/store/taskQueryStore.ts`** — a new Zustand store holding the Home list's view parameters
   (`filter`/`sort`/`search`). `filter`+`sort` persist together as **one `{filter,sort}` envelope** via the typed
   storage service (`createPersistedValue(StorageKeys.taskQuery, taskQueryPrefsSchema, …)`) — the canonical
   pattern (patterns-registry.md rows 18/19), **not** the `themeStore` raw-key shape. `search` is in-memory only
   (resets on relaunch). `TaskFilter`/`TaskSortKey`/`TaskQueryPrefs` are all `z.infer`'d from Zod schemas —
   single source of truth for both unions.
2. **`features/tasks/lib/selectVisibleTasks.ts`** (new `lib/` dir for this feature) — a pure
   `(tasks, query) => tasks` **search → filter → sort** pipeline; never mutates/reorders `useTaskStore`'s array
   (that stays the persistence-order source of truth). `FILTER_PREDICATES`/`SORT_COMPARATORS` are lookup maps
   (not `if`/`switch` chains) so ORG-002/ORG-003 add entries without restructuring the pipeline; only
   `created-desc` and the filter set are wired so far — `matchesSearch` is a passthrough stub (ORG-002's slot),
   unimplemented sort keys fall back to `created-desc` via `resolveComparator` (ORG-003's slot).
3. **`HomeScreen.tsx` (extended)** — a pinned organize header with a `SegmentedControl` Filter (All/Active/
   Completed), renders `useMemo(selectVisibleTasks(tasks, query))` instead of raw `state.tasks`. Filtered-empty
   state reuses `EmptyState` with filter-appropriate copy; no-tasks-at-all still takes precedence.
4. **`core/services/storage.ts` (extended)** — one new `StorageKeys.taskQuery` entry (doc-commented as the
   reference for "typed service, not raw key" going forward).

See patterns-registry.md → "Derived selector over a store" / "UI-query-state persisted via the typed storage
service" for the 2 new Tier-1 rows this task established.

**ORG-002 (search, F-020/021/022/031) — done, PR #19 merged.** Filled the two seams ORG-001 left open: a new
`features/tasks/components/SearchBar.tsx` (+test — `FormField` chrome + leading decorative Feather `search`
icon + `IconButton` clear; feature-local, reuse-or-adapt, not yet a `components/ui` primitive) wired to
`taskQueryStore.search`/`setSearch` in `HomeScreen`; and `selectVisibleTasks.ts:matchesSearch` is now
implemented — `search.trim().toLowerCase().slice(0, 128)` then a plain, case-insensitive `String.includes` on
title OR description, **no `RegExp` from user input** (closes the ORG-001 ReDoS advisory; also applies the
`FILTER_PREDICATES[filter] ?? FILTER_PREDICATES.all` fallback advisory). `HomeScreen`'s `resolveEmptyComponent`
is now a 4-way precedence (no-tasks → no-results → filtered-empty), reusing `EmptyState` verbatim. See
patterns-registry.md → "Untrusted search-input handling (ReDoS-safe)".

**ORG-003 (sort, F-026–029) — PR #20, `status: review`, all gates green, NOT yet merged. The LAST ORG task and
the last task overall.** Fills the final `selectVisibleTasks` seam — `SORT_COMPARATORS`: `due` (ascending,
**no-`dueDate` sorts LAST**), `alpha` (`localeCompare`, `sensitivity:'base'` — case-insensitive A→Z), `updated`
(`updatedAt` descending); `created-desc` unchanged default. **The search → filter → sort pipeline is now
structurally complete — no seams left** (see patterns-registry.md → "Derived selector over a store", now marked
PIPELINE COMPLETE). Adds a sort-trigger `IconButton` (Feather `sliders`, organize-header slot 3) + a `Sort by`
`ActionSheet` menu (4 icon'd options) → `taskQueryStore.setSort` (persists via ORG-001's envelope);
`features/tasks/lib/sortLabels.ts` single-sources the trigger a11y label + option labels. Extends `ActionSheet`
a 3rd time with `options[].active?: boolean` (single-select active-option indicator — primary icon +
`font-semibold text-primary`; `destructive` precedence; reuses the pre-existing `NATIVE_CHROME_RGB.primary`, no
new token) — PRO-003/TSK-004 call sites unaffected. See patterns-registry.md → `ActionSheet` row.

**Home now has the complete organize header — search + filter + sort all live.** ORG-003's merge (pending human
go) triggers the ORG Module DoD (coherence review + local E2E) and completes all 48/48 features
(`docs/requirements/TRACEABILITY.md`). No new deps, no schema/data-model change in ORG-002 or ORG-003.

## Layer diagram
Feature-sliced `mobile/src/`, alias `@/* → mobile/src/*` (`tsconfig.json` `paths` + `babel-plugin-module-resolver`
in `babel.config.js`):
- `src/app/` — composition root: `AppProviders.tsx` (see Tier-1 pattern below); `navigation/` now live (FND-003, see below).
- `src/core/{api,config,hooks,lib,services,store,types}` — cross-feature primitives. Live: `lib` (`constants.ts`,
  `id.ts:newId()` STG-002, `formatDueDate.ts` TSK-005), `services` (typed storage + repositories, STG), `store`
  (`themeStore`/`launchStore`, FND), `types` (`storage`/`profile`/`task` schemas, STG). `api`/`config`/`hooks` remain
  `.gitkeep` scaffolds — dormant until a future cloud-sync phase (OQ-1).
- `src/features/` — **live (PRO-001/002/003 merged; all 5 TSK tasks merged (PRs #13–17) — TSK Module DoD complete).** `features/profile` is the app's first feature slice: `store/profileStore.ts` (Zustand, hydrates from `profileRepository`) + `screens/ProfileSetupScreen.tsx` (the mandatory first-launch form) + `screens/ProfileScreen.tsx` (PRO-002 — replaces the FND-003 `Profile` tab placeholder: view profile, inline edit toggle reusing the RHF+Zod form pattern, and the System/Light/Dark theme toggle wired to `themeStore`, completing OQ-10) + **`lib/photoPicker.ts`** (PRO-003 — the single `react-native-image-picker` call site, normalizes cancel/permission/error into a closed `PhotoPickResult`) + **`components/AvatarPhotoField.tsx`** (PRO-003 — wraps `Avatar` + `ActionSheet` into the tappable photo-edit affordance, mounted in both `ProfileSetupScreen` and `ProfileScreen`'s edit mode; the picked/removed uri is handed to the caller, which persists it via `profileStore`/`profileRepository` — this component never persists anything itself). **`features/tasks` is the app's second feature slice:** `store/taskStore.ts` (Zustand, hydrates once from `taskRepository`, full 6-action set — the single Tasks state source every later TSK/ORG screen reads, coherence check 3) + `screens/HomeScreen.tsx` (TSK-001 — replaces the FND-003 `Home` tab placeholder: greeting from `profileRepository.getProfile()?.name` re-read on focus, virtualized `FlatList` of `TaskListItem` rows, `EmptyState` when empty, pull-to-refresh via the store's `refresh()`, and a screen-local FAB → `AddTask`). The Home greeting reads profile data via the STG repository directly, not `useProfileStore` — see patterns-registry.md → "Cross-feature data read via core repository". **TSK-002 (merged, PR #14)** adds `components/TaskForm.tsx` — the shared create+edit form (RHF+Zod, `zodResolver(taskSchema.pick({title,description}))`) — and `screens/AddTaskScreen.tsx`, which replaces the FND `AddTask` stack placeholder: valid submit calls `taskStore.addTask` then `navigation.goBack()`. **TSK-003 (merged, PR #15)** adds `screens/TaskDetailScreen.tsx` (read-only detail — title/status/description/due-date/Created+Updated meta, Edit button → `EditTask`) and `screens/EditTaskScreen.tsx` (reuses `TaskForm` via `defaultValues`, merges the validated fields over the existing task's `status`/`dueDate` before calling `updateTask` — `upsertTask` wholesale-replaces on update). Both replace the FND-003 stack placeholders for those two routes — no placeholder screens remain in `RootStackParamList`. **TSK-004 (merged, PR #16)** adds `hooks/useTaskActions.ts` — the shared confirm-gated-delete + open/close-menu state machine `HomeScreen` and `TaskDetailScreen` both consume (see patterns-registry.md → "Confirm-gated destructive action") — and wires `toggleStatus`/`duplicateTask`/`removeTask` into both screens via row/detail `ActionSheet` menus; no new screen file, only hook + two existing-screen extensions. **TSK-005 (merged, PR #17)** adds `components/DueDateField.tsx` — a native date+time trigger (iOS combined `mode="datetime"`, Android sequential `DateTimePickerAndroid.open()`) wired into `TaskForm` (widens its `.pick` set to include `dueDate`) and consumed by both `AddTaskScreen` and `EditTaskScreen` unchanged; emits `.toISOString()`/`undefined`, closing STG coherence gap b. No new screen/route — same reuse-not-fork discipline as TSK-004. **All 5 TSK tasks are done; TSK Module DoD complete (coherence PASS, E2E deferred).** **ORG-001 (merged, PR #18)** adds `features/tasks`' first `lib/` dir (`selectVisibleTasks.ts`) and a 2nd store (`store/taskQueryStore.ts`) — no new screen file, `HomeScreen.tsx` is extended in place (organize header + derived list). **ORG-002 (merged, PR #19)** adds `features/tasks/components/SearchBar.tsx` (feature-local search input) and implements `matchesSearch` — again no new screen file, `HomeScreen.tsx` extended once more (organize header now has search + filter). **ORG-003 (PR #20, review — LAST task)** adds `features/tasks/lib/sortLabels.ts` and fills `SORT_COMPARATORS` — again no new screen file, `HomeScreen.tsx` extended a final time (organize header now has search + filter + sort). See "ORG — module feature-complete" above for the full picture.
- `src/components/ui/` — **live (FND-005, extended PRO-001/PRO-002/PRO-003, TSK-001, TSK-004, TSK-005) — 10 primitives.** `EmptyState`, `LoadingIndicator`, `Screen` (FND-005) + `Button`, `FormField` (PRO-001) + `Avatar` (photo variant added PRO-003), `SegmentedControl<T>` (PRO-002) + `ActionSheet` (PRO-003 — themed cross-platform bottom-sheet options menu; TSK-004 adds `title?`/`icon?`) + **`TaskListItem`** (TSK-001 — the one task-row card: leading toggle-checkbox, title with completed=strikethrough+muted+check-fill, optional due-date caption, trailing "⋯" actions button (TSK-004, replaces the original chevron); ORG's later filtered/searched list reuses it unchanged) + **`IconButton`** (TSK-005 — the one 48dp icon-only outlined-square button, promoted off TSK-004's single-use `TaskDetailScreen` local const on its 2nd consumer, `DueDateField`'s clear affordance; `TaskDetailScreen`'s Toggle/More buttons were refactored onto it too) — barrel `@/components/ui`, see below. `src/platform/`, `src/theme/` — `theme/` live (FND-002/003); `platform/` still an empty scaffold.

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
- `ProfileSetup` — first-launch route; **now the real `ProfileSetupScreen` (PRO-001, merged PR #10)**, replacing the FND-003 placeholder — Name+Email form (RHF+Zod), on valid submit persists via `profileStore`/`profileRepository` then calls `setHasLaunched()` (the single first-launch writer — FND-004 only reads the flag) and resets navigation to `Tabs`.
- `Tabs` — the bottom-tab navigator (`TabParamList`: `Home`, `Profile`). **Profile** is the real `ProfileScreen` (PRO-002, PR #11 merged); **Home** is the real `HomeScreen` (TSK-001, PR #13 merged) — task list + greeting + FAB + pull-to-refresh.
- `AddTask` (`undefined`) — pushed stack screen; the real `AddTaskScreen` (TSK-002, PR #14 merged), replacing the FND-003 placeholder — `TaskForm` (title+description, RHF+Zod) → `taskStore.addTask` → `goBack()`.
- `EditTask` (`{taskId}`), `TaskDetail` (`{taskId}`) — pushed stack screens, headers shown with real titles. **Now real screens (TSK-003, PR #15, merged)**, replacing the FND-003 placeholders: `TaskDetail` = `TaskDetailScreen` (read-only view, reads `useTaskStore` by `route.params.taskId`, Edit button → `EditTask`); `EditTask` = `EditTaskScreen` (`TaskForm` seeded via `defaultValues`, on valid submit merges over the existing `status`/`dueDate` and calls `updateTask`, then `goBack()` to `TaskDetail`, which re-reads the same store). Both use plain `useNavigation()`/`useRoute()` + a locally-declared narrow `RouteProp` (never the app-layer `useAppRoute`) — see patterns-registry → "Typed navigation inside a feature screen". No route in `RootStackParamList` renders `PlaceholderScreen` anymore — it is now used only by `BootstrapScreen`'s own splash-decision plumbing. **TSK-004 (merged, PR #16)** adds no new route — it wires `useTaskActions` + row/detail `ActionSheet` menus into `HomeScreen` and `TaskDetailScreen` in place. **TSK-005 (PR #17, review)** also adds no new route — `DueDateField` is wired into the existing `AddTask`/`EditTask` screens via `TaskForm`.

Typed-navigation, nav-theming, themed-StatusBar, and placeholder/jest-setup patterns are now Tier-1 — see patterns-registry.md. No deep-linking config wired (spec: none in MVP; shape supports adding one later without restructuring).

## src/components/ui — shared presentational primitives
**Live (FND-005, extended PRO-001, PRO-002, PRO-003, TSK-001, TSK-004, TSK-005, ORG-003) — 10 primitives.** `EmptyState` (F-030), `LoadingIndicator` (F-032), `Screen`/`Container` (F-046) from FND-005 — the a11y baseline (F-047) is baked into all three (roles/labels, ≥48dp targets, `fontScale`-safe). PRO-001 adds `Button` (primary CTA, `disabled`/`loading` states) and `FormField` (label+input+inline-error, F-033) — the Tier-1 form-UI pair every RHF+Zod form (TSK included) reuses. PRO-002 adds `Avatar` (F-005 — initials/icon-fallback identity chip) and `SegmentedControl<T>` (F-003 generalized — single-select fixed-option control; first use is the Profile theme toggle, **ORG reuses it for filter-chip/sort-option controls**). PRO-003 extends `Avatar` with a `photoUri?: string` prop (real photo, falls back to initials/icon on a missing/broken uri) and adds **`ActionSheet`** (F-003/F-004 — themed cross-platform bottom-sheet options menu, first use: `AvatarPhotoField`'s Take Photo/Choose from Library/Remove menu). TSK-001 adds **`TaskListItem`** (F-008 — the one task-row card; reused read-only by TSK-003's `TaskDetailScreen` for its status glyph, and by ORG's later filtered list unchanged). **TSK-004 (F-011–F-015, merged PR #16) extends both rather than adding a 10th:** `ActionSheet` gains an optional `title?` (confirm-dialog header, backward-compatible — now the app's one confirm-dialog primitive, not just an options menu) and `options[].icon?` (leading Feather glyph per row); `TaskListItem`'s decorative `chevron-right` is replaced by an `onOpenActions?` "⋯" button (row navigation-on-tap is unaffected). `Screen`'s `scroll` mode is now keyboard-aware by default (`keyboardShouldPersistTaps`/`automaticallyAdjustKeyboardInsets`, added for PRO-001's form). **TSK-005 (F-016/F-017, merged PR #17) adds the 10th primitive, `IconButton`** — a themed 48dp icon-only outlined-square button, promoted off TSK-004's single-use `TaskDetailScreen` local const the moment `DueDateField`'s clear affordance needed the identical shape (`TaskDetailScreen`'s own Toggle/More buttons were refactored onto it too). **ORG-003 (F-026–029, PR #20, review) extends `ActionSheet` a 3rd time** with `options[].active?: boolean` (single-select active-option indicator for its Sort-by menu — primary icon + semibold label, `destructive` precedence) — no new primitive, still 10. **Reuse contract:** features import via `@/components/ui`; re-implementing any of the ten is a `[blocking]` code-review finding (ORG's F-031 reuses `EmptyState`, TSK's F-042 reuses `LoadingIndicator`, ORG's filter/sort reuses `SegmentedControl` — see patterns-registry). Native-only color props (`ActivityIndicator`/icon `color`) resolve from `src/theme/nativeChromeColors.ts`, the same source `TabNavigator`/`ThemeProvider`/`FormField`'s error icon/`Avatar`'s fallback icon already use — extended TSK-004 with a `success` entry (Detail toggle icon + `ActionSheet` option icons) — see patterns-registry.

## src/platform — native-bridge adapters
_(to be filled — empty scaffold. `react-native-mmkv@2.12.2` (v2, old-arch) is consumed by `core/services/storage.ts` (STG-001, see above), not from here. `react-native-keychain` installed dormant.)_

## src/theme — design tokens
**Live (FND-002).** `ThemeProvider` + `useTheme()` implement light+dark theming: semantic color tokens as CSS vars in `tailwind.config.js`/`global.css` (`:root` = light, `.dark` = dark, `darkMode: 'class'`), `themeStore` (above) resolves the active scheme, `ThemeProvider` pushes it into NativeWind's `colorScheme.set(...)` and reacts live to OS scheme changes while `mode === 'system'`. Mounted in `AppProviders` (`mobile/src/app/AppProviders.tsx`) between `SafeAreaProvider` and `NavigationRoot` (FND-003, passed in as `children` from `App.tsx`). As of FND-003, `ThemeProvider` also renders a themed `<StatusBar>` (OS chrome — flips with `resolvedScheme`, independent of the nav container's own `theme.dark`; see patterns-registry). Type scale + border-radius tokens also land here. See patterns-registry → "Semantic design-token theming". `mobile/babel.config.js` now also registers `react-native-reanimated/plugin` (last, per Reanimated's requirement — carry-forward fix from FND-001).

## External integrations
**None wired.** No backend API call is made anywhere in the app yet — the app boots and runs fully offline, confirmed end-to-end by FND-004 (F-048: zero network on boot, no `react-query` mounted, airplane-mode cold start reaches its entry screen). This is deliberate per OQ-1, not a gap.

## Data model
**Live (STG-002).** No backend/database — the canonical domain model is two Zod schemas in `core/types/`, persisted via MMKV through the repositories above (no Keychain/React-Query use yet, both still dormant):
- **`Profile`** (`core/types/profile.ts`) — `{ name: string (required), email: string (required, valid email), photo?: string (local file uri) }`. One per device, under `StorageKeys.profile`. `photo` is written only via PRO-003's `AvatarPhotoField` → `profileStore`/`profileRepository` (STG persists the uri string only; PRO owns the picker/permission flow that produces it — coherence gap f, now closed both directions).
- **`Task`** (`core/types/task.ts`) — `{ id: string (uuid v4), title: string (required), description?: string, status: 'active'|'completed', dueDate?: string (full ISO-8601, optional), createdAt: string (ISO-8601), updatedAt: string (ISO-8601) }`. Persisted as one `Task[]` blob under `StorageKeys.tasks` (`taskListSchema`). `id: string` satisfies the FND coherence spec-gap (d) — the nav `taskId: string` route-param contract.
- `id`s are minted by `core/lib/id.ts:newId()` (`react-native-uuid`, non-CSPRNG — internal ids only, see patterns-registry).
- **Ownership boundary:** STG owns the schemas + repositories; PRO builds its profile feature-store/screens on `profileRepository`, TSK builds its task feature-store/screens on `taskRepository` — neither touches MMKV or re-declares the shapes. See `docs/context/stack.md` → "Forward contracts for TSK" for the `upsertTask`/`dueDate` behaviors TSK must respect. **TSK-001 is the first live consumer** — `taskStore` hydrates the full `Task[]` collection at init and Home renders it. As of TSK-005 (PR #17, review), every `taskStore` action (`addTask`/`updateTask`/`toggleStatus`/`duplicateTask`/`removeTask`/`refresh`) is reachable from UI, and `dueDate` has its first real producer (`DueDateField`, `.toISOString()`) and consumers (`TaskListItem`'s compact caption, `TaskDetailScreen`'s full detail row) — the schema field was declared STG-002 but unexercised until now.

## Graphify graph summary
_(still not built — attempted at the FND module edge, 2026-07-11: no `graphify` CLI, `/graphify` command, or
`post-commit` hook exists anywhere in this repo or on PATH, despite being referenced as live machinery in
`harness.config.md`/`librarian.md`/`harness-sync.md`. This is a tooling gap, not a "no code to graph" state —
`mobile/src` has substantial real code. See `docs/graph/logs/graphify-FND.log` and
`docs/context/harness-debt.md`. Grounding for now is direct Read/Grep of `mobile/src`, not `graphify query`.)_
