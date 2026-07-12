# Build Status Board

> Live board. The **orchestrator** updates it on each gate; the **librarian** finalizes it on task done.

**Project:** Todo App · **Updated:** 2026-07-12 · **Phase:** FND + STG + PRO + **TSK done** (TSK-001–005 merged PRs #13–17; coherence PASS, E2E deferred, integration go). **ORG in progress** — `/module ORG` wrote 3 specs (ORG-001/002/003, 11 features); **ORG-001 (the anchor) is `review`, PR #18 open, all gates green, awaiting human merge-go.** ORG-002/003 stay blocked-on-ORG-001. ORG is the **last module** — after it, only the deferred-E2E batch + the `development → main` release lane remain.

## Legend
🟢 done · 🟡 in-progress · 🔵 ready · ⚪ blocked · 🔴 gates-red · ⛔ escalated
<!-- Status vocabulary mirrors the modules.json task.status enum:
     planned · ready · in-progress · review · blocked · gates-red · escalated · done.
     gates-red = a per-task gate is failing inside the loop; escalated = a hard stop (5 failed
     gate loops, or a coherence review that can't reach PASS) handed to the human. -->

## Modules (5 · 48 features)

| Order | Module | Features | Tasks | Depends on | Status |
|---|---|---|---|---|---|
| 1 | **FND** — Foundation & App Shell (⚓) | 9 | 5 (5 done) | — | 🟢 **done** — coherence PASS, E2E deferred, human integration go 2026-07-11 |
| 2 | **STG** — Local Persistence (⚓) | 4 | 2 (2 done) | FND ✅ | 🟢 **done** — coherence PASS, E2E deferred, human integration go 2026-07-11 |
| 3 | **PRO** — Profile | 6 | 3 (3 done) | FND ✅, STG ✅ | 🟢 **done** — coherence PASS, E2E deferred (disk pressure), human integration go 2026-07-11 |
| 4 | **TSK** — Task Management | 18 | 5 (5 done) | FND ✅, STG ✅ | 🟢 **done** — coherence PASS, E2E deferred (4th, disk), human integration go 2026-07-12 |
| 5 | **ORG** — Search, Filter, Sort | 11 | 3 (1 done) | TSK ✅ | 🟡 **in-progress** — ORG-001 done (PR #18); ORG-002 runnable, ORG-003 (group ORG-pg1) |

## FND tasks

| Task | Title | Feat. | Cplx | Est | blockedBy | Group | Status |
|---|---|---|---|---|---|---|---|
| **FND-001** | Stack install & feature-sliced scaffolding | _(enable)_ | M | 4h | — | — | 🟢 done — PR #3 merged (1f4bb9a) |
| **FND-002** | Design system + theming (light + dark) ⚓ | F-045 | M | 4h | FND-001 ✅ | — | 🟢 done — PR #4 merged |
| **FND-003** | Navigation shell (tabs + native-stack) | F-039 | M | 4h | FND-001 ✅, FND-002 ✅ | FND-pg1 | 🟢 done — PR #5 merged |
| **FND-004** | Bootstrap: splash · first-launch · offline | F-043/044/048 | M | 4h | FND-001/002/003 ✅ | — | 🟢 done — PR #6 merged |
| **FND-005** | Shared UI primitives (empty·loader·responsive·a11y) | F-030/032/046/047 | S | 2h | FND-002 ✅ | FND-pg1 | 🟢 done — PR #7 merged |

**Critical path:** FND-001 → FND-002 → FND-003 → FND-004 (≈16h, all gates green) · **FND-005 parallel with FND-003/FND-004** (group FND-pg1).
**FND Module DoD:** coherence review **PASS** (architect + security-reviewer, structural, zero findings) · local E2E **deferred** (human decision, recorded in `docs/graph/coherence/FND.md`) · full Graphify semantic rebuild **attempted, gap recorded** (no graphify CLI/command/hook exists in this repo — see `docs/context/harness-debt.md` + `docs/graph/logs/graphify-FND.log`) · **human integration go given 2026-07-11.** FND = 🟢 **done**.

**Architecture:** LOCAL-ONLY (offline-first, MMKV, no backend/auth) · dark mode IN scope (system+toggle) · Add/Edit/Detail = pushed stack screens · profile mandatory (name+email).

## STG tasks (2 · 4 features · specs ready)

| Task | Title | Feat. | Cplx | Est | blockedBy | Status |
|---|---|---|---|---|---|---|
| **STG-001** ⚓ | Typed storage service (Zod-guarded MMKV · versioned · corrupt-recovery · hydration) | F-037, F-038 | M | 4h | — | 🟢 done — PR #8 merged |
| **STG-002** | Profile + Task persisted schemas & repositories (+ hydration wiring) | F-006, F-036 | M | 4h | STG-001 ✅ | 🟢 done — PR #9 merged |

**Critical path:** STG-001 → STG-002 (≈8h, both gate-green). **STG Module DoD complete:** coherence review PASS (`docs/graph/coherence/STG.md`, zero findings) · local E2E deferred (human decision, headless module) · human integration go 2026-07-11. Unblocks PRO + TSK.
**STG decisions:** STG owns Profile/Task Zod schemas in `core/types` + repositories · light `{version,data}` envelope · corrupt→reset-to-safe-default · name+email in MMKV (non-sensitive) · Task `id` = uuid string · **adopts FND's existing MMKV keys on the default instance (no churn — coherence spec-gap b).** 6 forward spec-gaps recorded in `docs/context/stack.md` for `/module PRO` + `/module TSK`.

## PRO tasks (3 · 6 features · specs ready)

| Task | Title | Feat. | Cplx | Est | blockedBy | Status |
|---|---|---|---|---|---|---|
| **PRO-001** ⚓ | Profile store + RHF/Zod form pattern + Profile Setup (mandatory first-launch) | F-001, F-033 | M | 4h | — | 🟢 done — PR #10 merged |
| **PRO-002** | Profile view + edit screen (+ theme toggle) | F-005, F-002 | M | 4h | PRO-001 ✅ | 🟢 done — PR #11 merged |
| **PRO-003** | Profile photo — add/change/remove (image picker + permissions) | F-003, F-004 | M | 4h | PRO-001 ✅, PRO-002 ✅ | 🟢 done — PR #12 merged |

**Critical path:** PRO-001 → PRO-002 → PRO-003 (≈12h, all gate-green). **PRO Module DoD complete:** coherence review PASS (`docs/graph/coherence/PRO.md`, zero findings) · local E2E **deferred** (human decision — disk pressure, ~4.6GB free) · human integration go 2026-07-11. Unblocks TSK (ORG stays blocked on TSK).
**PRO decisions:** photo via react-native-image-picker@8.2.1 (gallery+camera, PRO-003 — Android needs no manifest permissions, iOS needs 2 `Info.plist` strings + 1 `PrivacyInfo.xcprivacy` entry) · theme toggle on Profile screen (PRO-002, completes OQ-10) · name+email both editable · mandatory setup, no skip. **Applies STG gaps e/f — both RESOLVED:** PRO-001 calls `setHasLaunched()` on setup-complete (gap e closed); form-boundary validation via RHF+zodResolver established as the Tier-1 pattern, confirmed for an edit flow (PRO-002) — gap f closed for PRO (TSK still to apply it). PRO-002 promoted `Avatar` (F-005) and `SegmentedControl<T>` (F-003, generalized — **ORG will reuse it**); PRO-003 promoted `ActionSheet` (8th `components/ui` primitive) and the `photoPicker`/`AvatarPhotoField` native-picker pattern, and extended `Avatar` with its `photoUri` variant. PRO-003 is native-surface (image-picker + permissions → local build decisive; `MERGE_WAIT_FOR_CI=on`); iOS full `xcodebuild` was blocked locally by `ENOSPC` (disk pressure, environment not code — see `stack.md`), Android + `pod install` passed.
**5 forward spec-gaps recorded** in `docs/context/stack.md` → "Forward spec-gaps from the PRO coherence review" for `/module TSK` + `/module ORG` (RHF+Zod anchor reuse, `SegmentedControl`/`ActionSheet` reuse, hasLaunched/profile-reset coupling).

**Next:** `/module TSK` (unblocked). Standing debt: local E2E deferred on 3 modules now (FND, STG, PRO) — combined suite should run before it stacks further, mandatory before any `development → main` release.

## TSK tasks (5 · 18 features · specs ready) — the product's core

| Task | Title | Feat. | Cplx | Est | blockedBy | Group | Status |
|---|---|---|---|---|---|---|---|
| **TSK-001** ⚓ | Tasks store + Home list (FlatList · empty · FAB · pull-refresh) | F-008, F-042 | L | 8h | — | — | 🟢 done — PR #13 merged 2026-07-12 |
| **TSK-002** | Create task (Add screen + shared TaskForm · title-req · dup-guard) | F-007, F-034, F-035 | M | 4h | TSK-001 ✅ | — | 🟢 done — PR #14 merged (275edbc) 2026-07-12 |
| **TSK-003** | Task detail + edit (dates · nav · reuse TaskForm) | F-009/010/018/019/040/041 | L | 8h | TSK-002 ✅ | — | 🟢 done — PR #15 merged (99ddb8f) 2026-07-12 |
| **TSK-004** | Lifecycle actions (complete/pending · delete+confirm · duplicate) | F-011/012/013/014/015 | M | 4h | TSK-003 ✅ | — | 🟢 done — PR #16 merged (0ffc76b) 2026-07-12 |
| **TSK-005** | Due date field (date+time picker) — assign + remove | F-016, F-017 | M | 4h | TSK-002 ✅ | TSK-pg1 | 🟢 done — PR #17 merged (5534c24, CI green) 2026-07-12 |

**Critical path:** TSK-001 → 002 → 003 → 004 (≈24h, all gate-green through TSK-004). **TSK-005** (branch `feat/TSK-TSK-005`, PR #17) is 🟡 **review** — all gates green (typecheck·lint·304 unit/42 suites·Android `assembleDebug`·security PASS·code-review APPROVE), **NOT yet merged**, awaiting human merge-go. It is the **sole remaining TSK task** — once merged, all 18 TSK features are done and the **TSK Module DoD (coherence review + local E2E, neither run yet)** is the next gate; ORG stays blocked until that Module DoD completes, not just the merge. **TSK total:** ≈28h.
**TSK decisions:** all-tasks list, completed shown in-place (OQ-8) · greeting uses profile name · duplicate = copy fields + reset status/timestamps · due date = @react-native-community/datetimepicker@^8.6.0 (date+time, RN-0.75/old-arch line) · search/filter/sort deferred to ORG. **Applies spec-gaps — all closed:** RHF+Zod form anchor reused for create (TSK-002), edit (TSK-003), and due-date (TSK-005) — STG gap f now fully closed, no TSK path left open; `upsertTask` wholesale-replace → edit submits ALL fields (STG gap a, closed TSK-003); `dueDate` `.toISOString()` full ISO-8601 (STG gap b, closed TSK-005); reuse `ActionSheet` for delete-confirm (F-012, built TSK-004). **TSK-002 promoted `TaskForm`** (`features/tasks/components/TaskForm.tsx`) as the shared create+edit form — **TSK-003 confirmed the edit-reuse contract** via `defaultValues` (+ the caller-side merge-over-existing-fields pattern, see patterns-registry.md); **TSK-005 extended it** by widening the `.pick` field set to include `dueDate` via the new `DueDateField` component. **TSK-003 also promoted** "typed navigation inside a feature screen" — see patterns-registry.md. **TSK-004 promoted** `useTaskActions` (confirm-gated destructive action) and extended `ActionSheet` (`title?`/`icon?`) + `TaskListItem` (`onOpenActions?`) + `nativeChromeColors` (`success` entry). **TSK-005 promoted** the due-date formatting util (`core/lib/formatDueDate.ts` — consolidates 3 previously-disagreeing format strings) and the `IconButton` primitive (promoted off TSK-004's single-use shape on its 2nd consumer) — `components/ui` now at **10 primitives**. See patterns-registry.md for all rows.

**TSK Module DoD — COMPLETE (2026-07-12):** all 5 tasks done · **coherence review PASS** (architect + security, zero findings — `docs/graph/coherence/TSK.md`) · local E2E **deferred** (human decision, 4th module — disk pressure; carried as mandatory pre-`main` gate) · **human integration go** (given by advancing to `/module ORG`). TSK = 🟢 **done**. Recorded 1 downstream ORG spec-gap (Home-filtering integration + 2 sort invariants) — folded into the ORG specs.

## ORG tasks (3 · 11 features · specs ready) — the final module

| Task | Title | Feat. | Cplx | Est | blockedBy | Group | Status |
|---|---|---|---|---|---|---|---|
| **ORG-001** ⚓ | Organize foundation — query store (persisted filter+sort) + `selectVisibleTasks` selector + Filter | F-023/024/025 | L | 8h | — | — | 🟢 done — PR #18 merged (81a5be1) 2026-07-12 |
| **ORG-002** | Search (title+desc, real-time) + no-results empty state | F-020/021/022, F-031 | M | 4h | ORG-001 ✅ | ORG-pg1 | 🟡 in-progress — branch feat/ORG-ORG-002 |
| **ORG-003** | Sort — due · created · alpha · updated (ActionSheet menu) | F-026/027/028/029 | M | 4h | ORG-001 | ORG-pg1 | ⚪ blocked-on-ORG-001 |

**Critical path:** ORG-001 → (ORG-002 ∥ ORG-003) (≈16h). **ORG-001** (the anchor — query store + derived-selector pipeline + Filter) is 🟡 **review**: typecheck·lint·331 unit (100% changed files)·Android `assembleDebug`·security PASS (2 Low forward advisories, see stack.md)·code-review APPROVE (1 spec-text nit, reconciled) all green, **NOT yet merged**, awaiting human merge-go. ORG-002 + ORG-003 both depend on ORG-001 and share `HomeScreen.tsx` + `taskQueryStore.ts` + `selectVisibleTasks.ts` (group `ORG-pg1`) → **serialize (recommended: 002 then 003)** or coordinate via `parallel-integration`, runnable once ORG-001 merges. **ORG total:** ≈16h.
**ORG decisions (/module ORG 2026-07-12):** search/filter/sort live **on Home** (derived selector, not a separate screen) · all three **compose** in one pipeline (search → filter → sort) · filter+sort **persist via the typed storage service** as one `{filter,sort}` envelope (`createPersistedValue`, NOT the themeStore raw-key shape — reconciled in ORG-001.spec.md post-implementation), search **in-memory** (resets on relaunch) · default sort **created-desc** (newest) · filter = `SegmentedControl` (reused), sort = `ActionSheet` menu (reused), no-results = `EmptyState` (reused) · **ORG code lives in `features/tasks`** (NOT a features/organize slice — that would be a features→features boundary violation reading the tasks store) · OQ-8 preserved (no re-sort on toggle). No new deps, no schema change, no research spike. **ORG-001 promoted 2 new Tier-1 patterns** (derived-selector-over-a-store; UI-query-state via typed storage service) — see patterns-registry.md.

**Next:** human merge-go on PR #18. Then ORG-002 + ORG-003 (serialize). After ORG done → ORG Module DoD (coherence + local E2E), then the app is feature-complete: the deferred-E2E batch + `development → main` release lane remain (both mandatory, both need disk freed).
