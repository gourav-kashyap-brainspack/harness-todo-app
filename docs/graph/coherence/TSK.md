# Coherence Review — TSK (Task Management)

**Module:** TSK · **Date:** 2026-07-12 · **Baseline:** `e4cb164..development` (the `/module TSK` planning commit → feature-complete `development`)
**Tasks:** TSK-001..005 all `done` (PRs #13–17 merged). **Reviewers:** architect + security-reviewer (READ-ONLY, run concurrently). **Diff logs:** `docs/graph/logs/coherence-TSK-diff.log` (architect, 5,105 lines, bounded) · `docs/graph/logs/coherence-TSK-sec-diff.log` (security).

## Verdict

```json
{ "module": "TSK",
  "checks": { "shape":"pass", "authz":"pass", "dataModel":"pass",
              "integration":"pass", "specGap":"pass", "dynamic":"pass" },
  "findings": [],
  "verdict": "PASS" }
```

**Structural coherence = PASS** (both lenses, zero unresolved findings). **Local E2E = DEFERRED** (human decision — see below). Module DONE pending **human integration go**.

## Architect lens (checks #1, #3, #4, #5 + dynamic) — PASS

| Check | Verdict | Basis |
|---|---|---|
| **#1 Shape drift** | PASS | One consistent shape across all 5 tasks — forms (both Add/Edit render the single `TaskForm`/RHF+Zod anchor), nav typing (plain `useNavigation()` + local narrow `RouteProp` on the two param screens), store actions (all 6 mutators thin write-through-repository delegations), screen layout + folder structure uniform. No Tier-1 concern solved two ways. |
| **#3 Data-model coherence** | PASS | `dueDate` consistently `.optional()`, guarded at every read site; `updatedAt` computed in exactly ONE place (`taskRepository.upsertTask:79-80`), never recomputed per screen; `id`/`createdAt` preserved on edit, fresh on duplicate; no parallel task state. |
| **#4 Integration assumptions** | PASS | FND (Screen, typed routes, theme tokens, `NATIVE_CHROME_RGB`), STG (`taskRepository` → `getItem/setItem` + `taskListSchema`; store hydrates from repo, never raw MMKV), PRO (RHF+Zod anchor, `ActionSheet`, `IconButton`/`Button`/`FormField`) all consumed correctly. `HomeScreen` reads the greeting via `profileRepository` (core seam), NOT a features→features import. Zero boundary violations. |
| **#5 Spec-gap inheritance** | PASS (+1 forward note) | Store is filter-ready — `tasks: Task[]` is a plain array ORG can derive over without refactoring `taskStore`. One downstream ORG integration point recorded below. |
| **DC1** RHF+Zod reuse, no 2nd form | PASS | `TaskForm` uses `zodResolver(taskSchema.pick(...))` — the PRO anchor verbatim; sole form in the module. |
| **DC2** persist only via STG; `updatedAt` one place | PASS | No production `features/tasks` file imports MMKV/storage (grep clean — only test-mock comments); `updatedAt` bumped only in `taskRepository`. |
| **DC3** single store slice, no dup state | PASS | HomeScreen reads `state.tasks`; Detail/Edit read `state.tasks.find(...)`. No local task copies. |

## Security lens (check #2 — cross-module authz/consistency) — PASS

| Check | Verdict |
|---|---|
| Data-integrity boundary consistency (the local-app "authz" analogue) | PASS — every mutation routes `taskStore` → `taskRepository` → Zod-guarded MMKV; **zero** bypassing writers (grep clean); `toggleStatus`/`duplicateTask` re-submit the full field set via `upsertTask`. |
| Destructive-action (delete) consistency | PASS — delete is confirm-gated at BOTH entry points (row menu + detail menu) via the single `useTaskActions` hook; `removeTask` structurally cannot fire without landing on `deleteTarget`. |
| Input-validation consistency | PASS — both write screens use the shared `TaskForm` (`zodResolver(taskFormSchema)`); `dueDate` emitted only as `.toISOString()`/`undefined` (both iOS + Android guard on `event.type === 'set'`). |
| Corrupt-data resilience | PASS — `getTasks()` returns `[]` on any schema failure (F-038), so every held task is schema-valid; all `new Date(...)`/format calls operate on validated values; optional fields guarded; not-found → `EmptyState`, never crash. |
| Dependency posture | PASS — only add `@react-native-community/datetimepicker@^8.6.0` (maintained, no new native permission); no High/Critical. |
| Secrets / logging | PASS — no `console.*` in the module; no secret introduced (zero network/auth surface). |

## Findings

**None.** No emergent cross-module drift on either lens. Every Tier-1 pattern the registry attributes to TSK is faithfully implemented. The one documented divergence (`formatDueDate` in `core/lib` instead of the spec's `features/tasks/lib`) is correct and justified by the `components→feature` boundary rule — a deliberate, well-reasoned deviation, not accidental reinvention.

## E2E gate (behavioral half of Module DoD)

**Status: DEFERRED (explicit human decision, 2026-07-12) — the 4th consecutive module deferral (FND, STG, PRO, TSK).**

The `e2e-automator` local Maestro run on the Android emulator was **not** executed at this edge. Rationale: disk pressure (~4.4 GB free) blocks the emulator + Maestro (and iOS `xcodebuild`); the human elected to defer and batch all accumulated E2E before the eventual `development → main` release. **This is the module edge where the assembled task flows (create → complete → duplicate → delete → set/remove due date) first become genuinely runnable**, so the deferred-E2E debt is now most material here.

**Carried E2E items for when the suite runs** (from per-task reviews):
- The **iOS combined `datetime` picker UX** (TSK-005) — verify the date→time flow on a device; if the picker collapses on the first `onChange`, wrap in a modal with an explicit Done commit or use `display="inline"`.
- The combined **FND + STG + PRO + TSK** flow suite should run together at this point rather than deferring a 4th module's worth of untested flows further.

**Standing rule:** the full local E2E suite is a **mandatory gate before any `development → main` promotion**, regardless of these per-module deferrals.

## Downstream ORG spec-gap (record for `/module ORG` — NOT a TSK defect)

ORG (search/filter/sort over tasks, F-023–029) inherits one integration point the ORG spec must resolve up front:
- **`HomeScreen` reads `useTaskStore(state => state.tasks)` directly and renders ALL tasks unfiltered** (`HomeScreen.tsx:118,197`). ORG must decide whether its filter/search/sort applies to Home itself (`data={filteredTasks}` via an ORG-owned derived selector) **or** ships as a separate list screen — the store shape supports either with no refactor, but the spec should state which so ORG doesn't silently fork a second list.
- **Two invariants ORG must honor when it adds sort:** (a) sort/filter live in ORG-owned **derived selectors / screen state**, never by mutating the store's `tasks` array order (the store is the persistence-order source of truth); (b) preserve **OQ-8** — `TaskListItem` documents "the row stays in place on toggle; the parent list must never re-sort on toggle." ORG's sort must not re-order on a status toggle.
- `SegmentedControl<T>` is already registry-confirmed as ORG's filter/sort control — no gap there.

## Module DoD status

1. All 5 tasks meet the Task DoD (per-task gates green) — ✅
2. Coherence review = **PASS** (architect + security, zero findings) — ✅
3. Local E2E = **DEFERRED** (human decision; mandatory before `development → main`) — ⏸️
4. Human integration go — **PENDING** (awaiting sign-off)

Module is DONE upon the human integration go, with E2E carried as a release-gate obligation.
