# ADR 0028 — Periodic harness simplification (ablate, don't only accumulate)

**Date:** 2026-06-24 · **Status:** accepted · **Context:** harness-engineering self-review (adopted from the *learn-harness-engineering* course, lectures 2 & 12) · **Relates to:** `/harness-sync`, `.claude/harness.config.md` → Harness Maintenance, `docs/context/harness-debt.md`, ADR 0029 (the additive twin)

## Context
Our harness only grows. Every HARNESS-AUDIT and every ADR (0001–0027) *adds* a gate, hook, doc, or rule; the one time we disabled gates (0013) we reversed it (0018). There is no counter-force that ever *removes* machinery. Two real costs:
1. **Instruction bloat** — always-loaded context (`CLAUDE.md`, `harness.config.md`) competes with the task for the window (the course's lecture 4: a rule buried mid-file is both ignored *and* expensive).
2. **Stale scaffolding** — a component added because an older/weaker model couldn't do something itself becomes dead weight once the model can. Anthropic's own example: they deleted their sprint-splitting mechanism once the model could self-decompose work, and the builder ran *smoother*. We run Opus 4.8 against scaffolding partly designed for weaker models and have never checked which pieces still earn their keep.

## Decision
Add a **simplification pass** as a standing counter-force to the additive bias:
- **Watchlist:** `docs/context/harness-debt.md` — a living list of components that are *candidates* for removal/lightening, each with a rationale and status (`watch` · `ablating` · `kept` · `removed` · `replaced`). The librarian seeds it when it notices a rule that may have gone stale; the pass works it.
- **Cadence:** once per **module completion**, as a step of `/harness-sync` (alongside the existing module-edge graphify rebuild). Module edges are already our natural system-level checkpoint.
- **Ablation protocol (one candidate per pass, idempotent + reversible):** pick the top `watch` candidate → disable it (comment out / flag off / git-stash the rule) → run the *next* module's full gate set as the benchmark → compare. **No degradation ⇒ remove permanently** (record an ADR + flip the row to `removed`). **Degradation ⇒ restore** (or replace with a lighter form) and mark `kept`/`replaced` with the evidence. Everything is git-reversible, so a wrong call costs one revert.
- **Bias the cut toward always-loaded prose first** — a rule deleted from `CLAUDE.md`/`harness.config.md` returns window budget on *every* task, so it has the highest simplification ROI.

## Consequences
- The harness can shrink, not only grow — "remove a component" is now a first-class, scheduled move with an evidence bar, not something that never happens.
- Reversible and low-risk: one component at a time, benchmarked against real gates, restorable by a git revert.
- Seeded candidates (see `harness-debt.md`) are **queued for evidence, not removed now**: compaction-resilience Part 1 (the in-conversation summary-biasing instruction — ADR 0017 already notes Opus's diminished context-anxiety makes the *file* the real safety net) and `/module` task granularity (Anthropic retired sprint-splitting on a comparable model).
- Pairs with **ADR 0029** (review-feedback promotion): promotion *adds* mechanical checks, simplification *removes* stale ones — the two directions of one maintenance loop.
- Honest limit: this is a discipline, not a mechanism — nothing forces the pass except the `/harness-sync` checklist. Acceptable; the value is having the move exist and a concrete watchlist to act on.
