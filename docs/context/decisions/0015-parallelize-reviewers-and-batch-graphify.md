# ADR 0015 — Parallelize the reviewers; batch the full Graphify rebuild to the module edge

**Date:** 2026-06-22 · **Status:** accepted · **Context task:** harness throughput tuning (LIST/DUE/PROF onward)

## Context
With the test gates already disabled (ADR 0013), the remaining per-task wall-clock is dominated by **subagent fan-out**, not the gate commands themselves. Two structural inefficiencies stood out across the ~remaining modules:

1. **Reviewers ran sequentially.** The per-task **security** and **code-review** gates — and the coherence review's **architect + security-reviewer** — are all READ-ONLY and mutually independent, yet were dispatched one after the other. Two serial review passes per task × dozens of remaining tasks.
2. **Full Graphify rebuild ran every task.** "Always run the librarian after a task" invoked the expensive semantic rebuild (`/graphify ./`, LLM-named communities + insights) per task. But 4–9 tasks in a module churn the same context docs/files, so most of those full rebuilds were redundant — the cheap post-commit AST update (`graphify update .`) already keeps the graph structurally live for the next task.

## Decision
1. **Run the independent reviewers concurrently.** The orchestrator dispatches `security-reviewer` + `code-reviewer` in a **single message (two Agent calls)** on the same diff per task; likewise `architect` + `security-reviewer` for the coherence review. One review pass, not two. No gate is weakened — both verdicts are still consumed and `overall` still requires every active gate to pass.
2. **Batch the full Graphify rebuild to the module boundary.** The librarian runs in two modes:
   - **Per-task mode:** docs + specs + task graph only. NO `/graphify ./`. The post-commit hook's fast AST update is sufficient for the next task.
   - **Module mode** (after coherence PASS, at the module edge): run the full semantic `/graphify ./` **once for the whole module**.

Concretely:
- `orchestrator.md` — per-task gate step dispatches the two reviewers in parallel; Self-learn step is docs-only and defers the rebuild; Module-DoD step runs the two coherence reviewers in parallel and triggers the module-mode librarian rebuild.
- `gate-runner` skill — notes gates 6 & 7 run concurrently.
- `coherence-review` skill — notes the two reviewers run concurrently.
- `librarian.md` — Graphify step split into per-task (fast/skip) vs module (full).
- `CLAUDE.md` — "Reviewers are READ-ONLY" and "Always run the librarian" rules updated to reflect concurrency + batching.

## Consequences
- **Faster:** ~one review pass collapsed per task; dozens of full graph rebuilds removed across the remaining 6 modules.
- **No quality tradeoff:** the same reviewers run with the same authority and the same diff; the same checklist runs at the module edge. Concurrency changes *when*, not *whether*. The AST graph stays live every task, so no task starts with staler structural context.
- **Reversible:** re-serialize by dispatching reviewers one-per-message, and restore per-task `/graphify ./` in the librarian, if a future run prefers it.
