# Build Status Board

> Live board. The **orchestrator** updates it on each gate; the **librarian** finalizes it on task done.

**Project:** Todo App · **Updated:** 2026-07-11 · **Phase:** FND + STG done. **PRO in progress** — PRO-001 merged (PR #10); PRO-002 gate-green (0 fix loops), PR #11 `review` (awaiting human merge-go). Next: merge PR #11, then `/build PRO-003`.

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
| 3 | **PRO** — Profile | 6 | 3 (1 done, 1 review, 1 blocked) | FND ✅, STG ✅ | 🟡 **in progress** — PRO-001 done (PR #10 merged); PRO-002 PR #11 review, awaiting merge-go |
| 4 | **TSK** — Task Management | 18 | — | FND ✅, STG ✅ | 🔵 **ready** — `/module TSK` unblocked; technically parallel with PRO, sequenced after per human preference |
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
| **PRO-002** | Profile view + edit screen (+ theme toggle) | F-005, F-002 | M | 4h | PRO-001 ✅ | 🟡 review — PR #11, gates green (0 fix loops), awaiting human merge-go |
| **PRO-003** | Profile photo — add/change/remove (image picker + permissions) | F-003, F-004 | M | 4h | PRO-001 ✅, PRO-002 | ⚪ blocked-on-PRO-002-merge |

**Critical path:** PRO-001 → PRO-002 → PRO-003 (≈12h). PRO-001 done; PRO-002 built + gate-green (design→implement, 0 fix loops) — completes OQ-10 (dark-mode toggle); **next runnable once PR #11 merges:** 🔵 **PRO-003** (last PRO task; PRO Module DoD — coherence + first local E2E — follows).
**PRO decisions:** photo via react-native-image-picker (gallery+camera, PRO-003) · theme toggle on Profile screen (PRO-002, completes OQ-10) · name+email both editable · mandatory setup, no skip. **Applies STG gaps e/f — both RESOLVED for PRO:** PRO-001 calls `setHasLaunched()` on setup-complete (gap e closed); form-boundary validation via RHF+zodResolver established as the Tier-1 pattern (gap f closed for PRO, TSK still to apply it) and **confirmed to hold for an edit flow** in PRO-002's `ProfileScreen` (`reset()`-seeded defaultValues). PRO-002 also promoted two new Tier-1 `components/ui` primitives: `Avatar` (F-005) and `SegmentedControl<T>` (F-003, generalized — **ORG will reuse it for filter-chip/sort-option controls**). PRO-003 is native-surface (image-picker + permissions → local build decisive; MERGE_WAIT_FOR_CI=on).

**Next:** merge PR #11, then `/build PRO-003`.
