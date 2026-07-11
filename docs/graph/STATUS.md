# Build Status Board

> Live board. The **orchestrator** updates it on each gate; the **librarian** finalizes it on task done.

**Project:** Todo App · **Updated:** 2026-07-11 · **Phase:** **FND done.** STG in progress — STG-001 gates green, PR #8 open (`review`), awaiting human merge-go. Next: merge PR #8, then `/build STG-002`.

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
| 2 | **STG** — Local Persistence (⚓) | 4 | 2 (1 review) | FND ✅ | 🟡 **in progress** — STG-001 PR #8 open, awaiting merge |
| 3 | **PRO** — Profile | 6 | — | FND, STG | ⚪ blocked |
| 4 | **TSK** — Task Management | 18 | — | FND, STG | ⚪ blocked |
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
| **STG-001** ⚓ | Typed storage service (Zod-guarded MMKV · versioned · corrupt-recovery · hydration) | F-037, F-038 | M | 4h | — | 🟡 review — PR #8, gates green (2-iteration loop), awaiting human merge-go |
| **STG-002** | Profile + Task persisted schemas & repositories (+ hydration wiring) | F-006, F-036 | M | 4h | STG-001 | ⚪ blocked — blocked-on-STG-001-merge |

**Critical path:** STG-001 → STG-002 (≈8h). **Next runnable after merge:** STG-002 (blocked on STG-001's merge, not its gates — both are green).
**STG decisions:** STG owns Profile/Task Zod schemas in `core/types` + repositories · light `{version,data}` envelope · corrupt→reset-to-safe-default · name+email in MMKV (non-sensitive) · Task `id` = uuid string · **adopts FND's existing MMKV keys on the default instance (no churn — coherence spec-gap b).**

**Next:** merge PR #8 (STG-001), then `/build STG-002`.
