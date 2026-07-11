# Build Status Board

> Live board. The **orchestrator** updates it on each gate; the **librarian** finalizes it on task done.

**Project:** Todo App · **Updated:** 2026-07-11 · **Phase:** FND + STG + PRO done. **TSK planned** (5 tasks, specs `ready`) — the product's core (18 features). Next: `/build TSK-001`.

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
| 4 | **TSK** — Task Management | 18 | 5 planned | FND ✅, STG ✅ | 🔵 **ready to build** — `/build TSK-001` |
| 5 | **ORG** — Search, Filter, Sort | 11 | — | TSK | ⚪ blocked |

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
| **TSK-001** ⚓ | Tasks store + Home list (FlatList · empty · FAB · pull-refresh) | F-008, F-042 | L | 8h | — | — | 🔵 ready |
| **TSK-002** | Create task (Add screen + shared TaskForm · title-req · dup-guard) | F-007, F-034, F-035 | M | 4h | TSK-001 | — | ⚪ blocked |
| **TSK-003** | Task detail + edit (dates · nav · reuse TaskForm) | F-009/010/018/019/040/041 | L | 8h | TSK-002 | — | ⚪ blocked |
| **TSK-004** | Lifecycle actions (complete/pending · delete+confirm · duplicate) | F-011/012/013/014/015 | M | 4h | TSK-003 | — | ⚪ blocked |
| **TSK-005** | Due date field (date+time picker) — assign + remove | F-016, F-017 | M | 4h | TSK-002 | TSK-pg1 | ⚪ blocked |

**Critical path:** TSK-001 → 002 → 003 → 004 (≈24h). **TSK-005 parallel** with 003/004 after 002 (shares `TaskForm` — coordinate). **First runnable:** 🔵 **TSK-001** (the Tasks store anchor). **TSK total:** ≈28h.
**TSK decisions:** all-tasks list, completed shown in-place (OQ-8) · greeting uses profile name · duplicate = copy fields + reset status/timestamps · due date = @react-native-community/datetimepicker (date+time) · search/filter/sort deferred to ORG. **Applies spec-gaps:** reuse the RHF+Zod form anchor (no 2nd pattern); `upsertTask` wholesale-replace → edit submits ALL fields; `dueDate` `.toISOString()` full ISO-8601; reuse `ActionSheet` for delete-confirm (F-012). TSK-005 is native-surface (datetimepicker → `MERGE_WAIT_FOR_CI=on`).

**Next:** `/build TSK-001`.
