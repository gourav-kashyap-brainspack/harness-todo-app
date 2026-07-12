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

**TSK in progress — the core create/list/detail/edit loop is done.** TSK-001 (store+Home list, F-008/F-042), TSK-002 (create, F-007/F-034/F-035), and TSK-003 (detail+edit, F-009/F-010/F-018/F-019/F-040/F-041) are all **done** — PRs #13, #14, #15 merged 2026-07-12. `features/tasks` is the app's second feature slice: `taskStore` (Zustand, hydrated once from `taskRepository`, full 6-action set) backs `HomeScreen` (list/greeting/FAB/pull-refresh), `AddTaskScreen` and `EditTaskScreen` (both built on the shared `TaskForm`), and `TaskDetailScreen` (read-only view, reuses `TaskListItem`'s status glyph). `PlaceholderScreen` is used only by `BootstrapScreen`'s own splash plumbing — no route renders a placeholder anymore. `components/ui` is at **9 primitives** (`TaskListItem` added, TSK-001).

**TSK-004 (Lifecycle actions — complete/pending, delete+confirm, duplicate; F-011–F-015) is `review`** — PR #16, all gates green (typecheck·lint·277 unit·Android `assembleDebug`·security PASS (F-012 delete-confirm verified)·code-review APPROVE), awaiting human merge-go. It adds the shared `useTaskActions` hook (Home row + Task Detail drive the same menu/confirm state machine — `removeTask` is reachable ONLY via a captured `deleteTarget`, never a direct tap, the app's first confirm-gated-destructive-action pattern) and extends `ActionSheet` with an optional `title?` (making it double as the app's confirm dialog) + per-option `icon?` — both backward-compatible, PRO-003's photo-menu call site is unchanged. `TaskListItem`'s decorative trailing chevron is replaced by a "⋯" `onOpenActions` button; the checkbox a11y label is corrected "...as active"→"...as pending". `components/ui` stays at **9 primitives** (a hook + two primitive extensions, no new primitive). Only `toggleStatus`/`removeTask`/`duplicateTask` are now reachable from UI everywhere they should be — every `taskStore` action TSK-001 wired now has a UI path.

**Next:** human merge-go on PR #16; **TSK-005** (due-date field, F-016/F-017, parallel group TSK-pg1) is the sole remaining TSK task — shares `TaskForm.tsx`, must reconcile the 3 coexisting `date-fns` due-date format strings into one (see `stack.md` TSK-003 spec-gap note), and must apply the same confirm-gating/`ActionSheet` conventions this task establishes if it adds any destructive affordance. Once TSK-005 merges, all 18 TSK features are done and the **TSK Module DoD** (coherence review + local E2E) runs.

**Standing risk:** deferred-E2E debt is accumulating (3 modules, 0 local E2E runs to date) and disk pressure is the recurring blocker (also blocked PRO-003's iOS `xcodebuild` gate). TSK will be the first module with a dense, genuinely-interactive flow set (create/list/detail/edit/toggle/delete/duplicate) — recommend clearing disk space and running the combined FND+STG+PRO+TSK flow suite at the TSK module edge rather than letting a 4th module's worth of untested assembled flows stack up; the full suite is a mandatory local gate before any `development → main` release regardless.
