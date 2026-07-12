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
**FND, STG, PRO, and TSK modules all COMPLETE.** All four are `status: done`, `coherenceStatus: pass`, `e2eStatus: deferred`, human integration go given. See `docs/graph/coherence/{FND,STG,PRO,TSK}.md` for the full verdicts. **ORG (the final module) is now in progress — ORG-001 review, PR #18.**

FND provides: a fully offline boot path (splash → first-launch check → ProfileSetup/Tabs), one semantic light/dark token set consumed everywhere, typed navigation (`RootStack` + bottom-tabs, typed params), two Zustand stores following one guarded-MMKV-preference shape (`themeStore`, `launchStore`), and the first three reusable UI primitives (`EmptyState`/`LoadingIndicator`/`Screen`). STG adds the typed-persistence layer: `core/services/storage.ts` (the single MMKV service — Zod-guarded, `{version,data}` envelope, total corrupt→safe-default reads, `createPersistedValue` hydration helper) → `{profileRepository,taskRepository}.ts` → `core/types/{profile,task}.ts` → `core/lib/id.ts:newId()` — on the same default MMKV instance FND already uses (no key churn).

**PRO builds the app's first feature slice and first genuinely-interactive flow on top of both.** `features/profile` (store + 3 screens/components): mandatory first-launch `ProfileSetupScreen` (name+email, RHF+Zod — **the pattern every later form reuses**) is the single writer of `setHasLaunched()`; `ProfileScreen` adds view/inline-edit (same form anchor) plus the System/Light/Dark theme toggle (completing OQ-10); `AvatarPhotoField`+`photoPicker.ts` add profile-photo add/change/remove (the one `react-native-image-picker` call site). `components/ui` grew from 3 to **8 primitives** (`Button`, `FormField`, `Avatar`, `SegmentedControl<T>`, `ActionSheet` added). All 6 PRO features (F-001–F-005, F-033) done. See `docs/context/architecture.md` → "PRO — module complete" for the full picture and `patterns-registry.md` for the Tier-1 patterns it established.

Local E2E is **deferred for FND/STG/PRO** by explicit human decision — FND/STG had no genuinely-testable UI yet; PRO (the first module with a real runnable flow) deferred on environment disk pressure (~4.6GB free, blocks the Android emulator + Maestro run); TSK deferred the same way (see below). Zero network/auth surface anywhere — dormant deps only (axios, react-query, jwt-decode, date-fns, keychain), per OQ-1.

**TSK done (2026-07-12).** All 5 TSK tasks merged (PRs #13–17); coherence review **PASS** (zero findings); local E2E **deferred** (4th module, disk pressure); human integration go given. `features/tasks` (the app's second feature slice) is now fully wired: `taskStore` (full 6-action set) backs `HomeScreen`, `AddTaskScreen`/`EditTaskScreen` (shared `TaskForm`, now includes `DueDateField`), `TaskDetailScreen`, and lifecycle actions (toggle/delete-confirm/duplicate via `useTaskActions`). All 18 TSK features (F-007–F-019, F-034/035/040/041/042) delivered. `components/ui` reached **10 primitives** (`TaskListItem`, `IconButton` added in TSK). See `docs/graph/coherence/TSK.md` for the full verdict.

**ORG started — the final module.** `/module ORG` wrote 3 specs (ORG-001/002/003, 11 features: F-020–F-029, F-031) — all living inside `features/tasks` (ORG is an orchestration grouping, not a `features/organize` slice; that would be a `features→features` boundary violation reading the tasks store). **ORG-001, the anchor (F-023/024/025), is all-gates-green — PR #18, `status: review`, awaiting human merge-go (NOT yet merged/done).** It adds `taskQueryStore` (Zustand — `filter`+`sort` persisted as **one `{filter,sort}` envelope via the typed storage service**, `createPersistedValue(StorageKeys.taskQuery, taskQueryPrefsSchema, …)` — the canonical pattern, not the `themeStore` raw-key shape; `search` stays in-memory/resets on relaunch) and `selectVisibleTasks` (a new `features/tasks/lib/`, a pure `(tasks, query) => tasks` search→filter→sort pipeline — comparator/predicate maps with a safe unrecognized-key fallback). Home now renders this derived list behind a pinned organize header with a `SegmentedControl` Filter (All/Active/Completed); a filtered-empty state reuses `EmptyState` (no-tasks-at-all still takes precedence). ORG-002 (search) and ORG-003 (sort) are both blocked on ORG-001 and share `HomeScreen.tsx`/`taskQueryStore.ts`/`selectVisibleTasks.ts` (group `ORG-pg1`, recommended serialize) — both slot into the pipeline's existing `matchesSearch`/comparator seams with no restructure needed. No new deps, no schema change.

**Next:** human merge-go on PR #18, then ORG-002/003 (serialize, recommended 002 then 003).

**Standing risk:** deferred-E2E debt is accumulating (4 modules — FND/STG/PRO/TSK — 0 local E2E runs to date) and disk pressure is the recurring blocker (also blocked PRO-003's iOS `xcodebuild` gate). ORG is the last module — recommend clearing disk headroom and running the combined FND+STG+PRO+TSK+ORG flow suite at the ORG module edge; the full suite is also a mandatory local gate before any `development → main` release.
