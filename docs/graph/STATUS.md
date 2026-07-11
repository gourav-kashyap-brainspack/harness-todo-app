# Build Status Board

> Live board. The **orchestrator** updates it on each gate; the **librarian** finalizes it on task done.

**Project:** Todo App · **Updated:** 2026-07-11 · **Phase:** **FND module DONE.** All 5 tasks merged (PR #3–#7); coherence review PASS (structural, zero findings); human integration go given; local E2E **deferred** (human decision — no end-to-end-testable surfaces yet). Next: `/module STG` (Local Persistence, unblocked).

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
| 2 | **STG** — Local Persistence (⚓) | 4 | — | FND ✅ | 🔵 **ready** · run `/module STG` |
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

**Next runnable:** `/module STG` (Local Persistence) — unblocked, no tasks planned yet. 5 forward spec-gaps from the FND coherence review are recorded in `docs/context/stack.md` for the architect to read at that planning session.
