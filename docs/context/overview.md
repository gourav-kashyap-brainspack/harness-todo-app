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

**TSK in progress.** TSK-001 (Tasks store + Home list, F-008/F-042) and TSK-002 (Create task, F-007/F-034/F-035) are both **done** — PRs #13, #14 merged 2026-07-12. **The app can create, list, and (pending merge) view/edit tasks.** `features/tasks` is the app's second feature slice: `taskStore` (Zustand, hydrated once from `taskRepository`, full 6-action set — the single Tasks state source every later TSK/ORG screen reads) backs `HomeScreen` (task list, greeting, FAB, pull-to-refresh) and `AddTaskScreen` (built on `TaskForm` — the shared create+edit form, RHF+Zod anchor). `components/ui` is at **9 primitives** (`TaskListItem` added, TSK-001).

**TSK-003 (Task detail + edit, F-009/F-010/F-018/F-019/F-040/F-041) is `review`** — PR #15, all gates green (typecheck·lint·246 unit·Android `assembleDebug`·security PASS·code-review APPROVE), awaiting human merge-go. **The app's task CRUD-read loop is now complete end-to-end and every stack route is a real screen:** create (`AddTaskScreen`) → list (`HomeScreen`) → view detail (`TaskDetailScreen`, reads `useTaskStore` by `route.params.taskId`, reuses `TaskListItem`'s status glyph read-only, not-found → `EmptyState`) → edit (`EditTaskScreen`, reuses `TaskForm` via `defaultValues`, merges the validated fields over the existing `status`/`dueDate` before calling `updateTask` — `upsertTask` wholesale-replaces on update, STG gap a). `PlaceholderScreen` is now used ONLY by `BootstrapScreen`'s own splash-decision plumbing — no route in the app renders a placeholder anymore. Only `removeTask`/`toggleStatus`/`duplicateTask` still aren't reachable from UI — **TSK-004** adds those screens once TSK-003 merges (it attaches actions to the detail screen).

**Next:** human merge-go on PR #15 unblocks TSK-004; **TSK-005** (due-date field, parallel group TSK-pg1) is independently runnable now — shares `TaskForm.tsx` with TSK-003, coordinate merge ordering per the `parallel-integration` skill.

**Standing risk:** deferred-E2E debt is accumulating (3 modules, 0 local E2E runs to date) and disk pressure is the recurring blocker (also blocked PRO-003's iOS `xcodebuild` gate). Recommend clearing disk space and running the combined FND+STG+PRO flow suite at or before the TSK module edge, rather than letting a 4th module's worth of untested assembled flows stack up — the full suite is a mandatory local gate before any `development → main` release regardless.
