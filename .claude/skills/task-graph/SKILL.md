---
name: task-graph
description: Build and maintain the task/build graph in docs/graph/ (modules.json + graph.mmd). Use when the architect adds modules/tasks or the librarian marks a task done. Computes critical path, next-runnable set, and parallel groups. This is ORCHESTRATION metadata — distinct from the Graphify codebase graph in graphify-out/.
---

# Task Graph

Maintain `docs/graph/modules.json` (source of truth) and render `docs/graph/graph.mmd`.

## Model
- **Node** = task `<module>-<NNN>`. **Edge** = `blockedBy` (task → its blockers).
- `parallelGroup` marks tasks that may run concurrently (no dependency path between them).
- Fields per task: module, title, blockedBy[], parallelGroup, complexity (S/M/L), dynamicWorkflow (bool), status, spec path.

## Operations
- **Add module** (`/scope`): append to `modules[]` with inter-module `blockedBy`.
- **Add tasks** (`/module`): append to `tasks[]`; set blockedBy + parallelGroup; point `spec` at the file.
- **Next runnable set:** tasks with `status: ready|planned` whose every `blockedBy` is `done`.
- **Parallel groups:** within the runnable set, tasks sharing a `parallelGroup` (or mutually independent) can run together — up to the parallelism budget (config).
- **Critical path:** longest blockedBy chain weighted by complexity; report it so the human sequences the right things first.
- **On task done** (librarian): set `status: done`, unblock dependents, recompute the runnable set, refresh `graph.mmd` + `STATUS.md`.
- **Stuck/escalated states (HARNESS-AUDIT cross-cutting fix):** the task `status` enum includes `gates-red` and `escalated` so a stalled task is representable in the machine-readable graph, not just in STATUS.md prose. Set `status: gates-red` while a per-task gate is failing inside the loop (a RED gate the orchestrator is still iterating on), and `status: escalated` on a **hard stop** — 5 failed gate loops, or a coherence review that can't reach PASS — when the task is handed to the human. Both map to STATUS.md's 🔴 / ⛔. Clear back to `in-progress`/`done` once resolved. This keeps the orchestrator's hard-stop state durable (it survives compaction with the run-state, per ADR 0017) instead of living only in the transcript.

## Render
Regenerate `graph.mmd` (`graph TD`) from `modules.json` after every change. Group nodes by module; edges as `A --> B`.

## Cross-reference (optional)
For impact analysis on a change, cross-reference the **Graphify** codebase graph (`graphify path <A> <B>`) — but keep the two graphs separate.
