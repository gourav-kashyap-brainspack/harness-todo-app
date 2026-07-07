---
description: Run the module-boundary coherence review — system-level Definition of Done that catches cross-module drift per-task gates can't see.
argument-hint: <module>
---

Adopt the **orchestrator** playbook to run the **coherence-review** skill for module: $ARGUMENTS

First:
1. Boot: read `CLAUDE.md`, `.claude/harness.config.md`, `docs/context/conventions.md`, `docs/context/patterns-registry.md` (Canonical patterns registry), `docs/graph/modules.json`, and the module's task specs.
2. Confirm every task in the module is `done` (per-task gates green). If not, STOP and report which tasks remain.

Then run the review:
- Dispatch **architect** (checks #1,#3,#4,#5 + the module's `coherenceChecks`) and **security-reviewer** (check #2, module-boundary authz) as READ-ONLY reviewers via the Agent tool.
- Consolidate findings → route fixes to builders as normal tasks → re-run until **PASS** (cap 5 iterations, then escalate).
- Write `docs/graph/coherence/<module>.md`, set `coherenceStatus` in `modules.json`, then present to me for the **human integration go**.

Rules: this is the per-module gate, distinct from the per-task `gate-runner`. Emergent/cross-module concerns only — don't re-run per-task gates. The module is not DONE until coherence PASSES and I approve.
