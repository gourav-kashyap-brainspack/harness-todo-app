# Overview — Todo App

> Living doc, maintained by the **librarian** after every task. Keep it factual and lean.
> `/intake` + `/scope` fill in the real domains and status.

## What it is
**Todo App** is a React Native (iOS + Android) client. _A cross-platform to-do / task-management app — create, organize, complete, filter, and track tasks._
It is a **frontend-only client** that consumes a remote backend API.

_(Replace this paragraph with the real product summary once `/intake` has ingested the PRD.)_

## Domains
_(empty — `/scope` fills this in with the confirmed feature slices from `mobile/src/features/*`.)_

## App brand
- **Display name:** Todo App
- **Native target / scheme / applicationId:** {{APP_TARGET}}

## Glossary
_(empty — the librarian appends domain terms as they are confirmed.)_

## Current status
**FND, STG, and PRO modules all COMPLETE (2026-07-11).** All three are `status: done`, `coherenceStatus: pass`, `e2eStatus: deferred`, human integration go given. See `docs/graph/coherence/{FND,STG,PRO}.md` for the full verdicts.

FND provides: a fully offline boot path (splash → first-launch check → ProfileSetup/Tabs), one semantic light/dark token set consumed everywhere, typed navigation (`RootStack` + bottom-tabs, typed params), two Zustand stores following one guarded-MMKV-preference shape (`themeStore`, `launchStore`), and the first three reusable UI primitives (`EmptyState`/`LoadingIndicator`/`Screen`). STG adds the typed-persistence layer: `core/services/storage.ts` (the single MMKV service — Zod-guarded, `{version,data}` envelope, total corrupt→safe-default reads, `createPersistedValue` hydration helper) → `{profileRepository,taskRepository}.ts` → `core/types/{profile,task}.ts` → `core/lib/id.ts:newId()` — on the same default MMKV instance FND already uses (no key churn).

**PRO builds the app's first feature slice and first genuinely-interactive flow on top of both.** `features/profile` (store + 3 screens/components): mandatory first-launch `ProfileSetupScreen` (name+email, RHF+Zod — **the pattern every later form reuses**) is the single writer of `setHasLaunched()`; `ProfileScreen` adds view/inline-edit (same form anchor) plus the System/Light/Dark theme toggle (completing OQ-10); `AvatarPhotoField`+`photoPicker.ts` add profile-photo add/change/remove (the one `react-native-image-picker` call site). `components/ui` grew from 3 to **8 primitives** (`Button`, `FormField`, `Avatar`, `SegmentedControl<T>`, `ActionSheet` added). All 6 PRO features (F-001–F-005, F-033) done. See `docs/context/architecture.md` → "PRO — module complete" for the full picture and `patterns-registry.md` for the Tier-1 patterns it established.

Local E2E is **deferred for all three modules** by explicit human decision — FND/STG had no genuinely-testable UI yet; PRO (the first module with a real runnable flow) deferred on environment disk pressure (~4.6GB free, blocks the Android emulator + Maestro run). Zero network/auth surface anywhere — dormant deps only (axios, react-query, jwt-decode, date-fns, keychain), per OQ-1.

**TSK in progress.** TSK-001 (Tasks store + Home list, F-008/F-042) done, all gates green after a design→implement→1-polish-loop — PR #13, `status: review`, awaiting human merge-go. **The app is now a working to-do list.** `features/tasks` is the app's second feature slice: `taskStore` (Zustand, hydrated once from `taskRepository`, full 6-action set — `addTask`/`updateTask`/`removeTask`/`toggleStatus`/`duplicateTask`/`refresh` — the single Tasks state source every later TSK/ORG screen reads) backs `HomeScreen` (replaces the FND-003 `Home` placeholder: greeting from `profileRepository.getProfile()?.name` re-read on focus, a virtualized `FlatList` of the new `TaskListItem` primitive, `EmptyState` when empty, a screen-local FAB → `AddTask`, pull-to-refresh via the store's `refresh()`). `components/ui` grew from 8 to **9 primitives** (`TaskListItem` added). Only `addTask`/`updateTask`/`toggleStatus`/`duplicateTask` aren't reachable from UI yet — TSK-002–004 add the screens that call them. **Next: TSK-002** (create task), blocked on TSK-001 merge; TSK-005 stays blocked on TSK-002.

**Standing risk:** deferred-E2E debt is accumulating (3 modules, 0 local E2E runs to date) and disk pressure is the recurring blocker (also blocked PRO-003's iOS `xcodebuild` gate). Recommend clearing disk space and running the combined FND+STG+PRO flow suite at or before the TSK module edge, rather than letting a 4th module's worth of untested assembled flows stack up — the full suite is a mandatory local gate before any `development → main` release regardless.
