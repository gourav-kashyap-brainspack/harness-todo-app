# Build Status Board

> Live board. The **orchestrator** updates it on each gate; the **librarian** finalizes it on task done.

**Project:** Todo App · **Updated:** 2026-07-10 · **Phase:** FND in progress — FND-001 ✅ merged (PR #3); FND-002 ✅ merged (PR #4); FND-003 gates green (2-iteration loop), PR #5 open, awaiting human merge-go

## Legend
🟢 done · 🟡 in-progress · 🔵 ready · ⚪ blocked · 🔴 gates-red · ⛔ escalated
<!-- Status vocabulary mirrors the modules.json task.status enum:
     planned · ready · in-progress · review · blocked · gates-red · escalated · done.
     gates-red = a per-task gate is failing inside the loop; escalated = a hard stop (5 failed
     gate loops, or a coherence review that can't reach PASS) handed to the human. -->

## Modules (5 · 48 features)

| Order | Module | Features | Tasks | Depends on | Status |
|---|---|---|---|---|---|
| 1 | **FND** — Foundation & App Shell (⚓) | 9 | 5 (2 done, 1 review) | — | 🟡 in progress (FND-001 ✅, FND-002 ✅ done; FND-003 in review) |
| 2 | **STG** — Local Persistence (⚓) | 4 | — | FND | ⚪ blocked · run `/module STG` |
| 3 | **PRO** — Profile | 6 | — | FND, STG | ⚪ blocked |
| 4 | **TSK** — Task Management | 18 | — | FND, STG | ⚪ blocked |
| 5 | **ORG** — Search, Filter, Sort | 11 | — | TSK | ⚪ blocked |

## FND tasks

| Task | Title | Feat. | Cplx | Est | blockedBy | Group | Status |
|---|---|---|---|---|---|---|---|
| **FND-001** | Stack install & feature-sliced scaffolding | _(enable)_ | M | 4h | — | — | 🟢 done — PR #3 merged (1f4bb9a) |
| **FND-002** | Design system + theming (light + dark) ⚓ | F-045 | M | 4h | FND-001 ✅ | — | 🟢 done — PR #4 merged |
| **FND-003** | Navigation shell (tabs + native-stack) | F-039 | M | 4h | FND-001 ✅, FND-002 ✅ | FND-pg1 | 🟡 review — PR #5, gates green (2-iteration loop), awaiting human merge-go |
| **FND-004** | Bootstrap: splash · first-launch · offline | F-043/044/048 | M | 4h | FND-001/002/003 | — | ⚪ blocked — runnable on FND-003 merge |
| **FND-005** | Shared UI primitives (empty·loader·responsive·a11y) | F-030/032/046/047 | S | 2h | FND-002 ✅ | FND-pg1 | 🔵 ready — runnable now (needs only FND-002, already merged) |

**Critical path:** FND-001 → FND-002 → FND-003 → FND-004 (≈16h) · **FND-005 parallel with FND-003** (group FND-pg1).
**Next runnable (after FND-003 merges):** 🔵 **FND-004**. **FND-005 is runnable now** (independent of FND-003). **FND remaining:** 6h (2 tasks) once FND-003 merges.

**Architecture:** LOCAL-ONLY (offline-first, MMKV, no backend/auth) · dark mode IN scope (system+toggle) · Add/Edit/Detail = pushed stack screens · profile mandatory (name+email).

**Next:** human merge-go on PR #5 (FND-003), then `/build FND-004` ∥ `/build FND-005` (FND-005 can also start now, independently).
