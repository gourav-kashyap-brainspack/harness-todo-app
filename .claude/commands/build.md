---
description: Run the full SDLC loop for a task, or fan out across a module / parallel-group up to the parallelism budget.
argument-hint: <task-id | module | parallel-group>
---

Adopt the **orchestrator** playbook (`.claude/agents/orchestrator.md`) and run the Phase-7 SDLC loop for: $ARGUMENTS

First:
1. Boot: read `CLAUDE.md`, `.claude/harness.config.md`, `docs/graph/modules.json`, `docs/graph/STATUS.md`, and the target spec(s).
2. **Resolve the run mode** (`AUTONOMY_MODE` in `harness.config.md` → Autonomy): if unset, **ask me** via `AskUserQuestion` (`human-gated` / `auto-until-development` / `auto-this-batch-only`) and offer to persist it. `human-gated` stops for my go before each merge + module integration; `auto-until-development` auto-merges green PRs into `development` and walks the runnable graph unattended, stopping only on a hard failure or at `main`/deploy. For an autonomous **batch** target, confirm **once** before the unattended run, then don't prompt per task. (Full rules: orchestrator Boot step 4.)
3. Resolve the target: a single task-id → one loop; a module / parallel-group → the runnable set, fanned out up to the parallelism budget (config) using the **Agent tool** (and git worktrees if branches share files).
4. **PRINT THE PLAN** before any work: the resolved run mode, which steps apply, sequential vs parallel, which steps use a dynamic research workflow.

Then execute the loop:
branch (off `development`) → plan-check (STOP if Open Questions) → design (if UI) → schema (if data) → implement → **unit gate** → security gate → code-review gate → evaluate (**gate-runner**; loop back to implement on ANY fail, cap 5 then escalate) → PR (**mr-flow** + **mr-reviewer**, base `development`) → **librarian** self-learn → mark task DONE in `STATUS.md`.
_(Per-task active gates, ADR 0018: typecheck · lint · **unit+coverage** · build · security · code-review. **E2E is NOT a per-task gate** — it runs once per module at the module boundary, local-only.)_

**Module boundary:** if the task just completed was the module's LAST task (all module tasks `done` in `modules.json`), run the **Module DoD** before declaring the module complete — **(a)** the **`coherence-review`** skill (architect + security-reviewer, structural) **and (b)** the **local E2E gate** (`e2e-automator`, behavioral — once per module, NOT in CI; verdict recorded in the coherence report) → fix findings → re-run until BOTH green → human integration go. (See the orchestrator playbook.)

Rules: dispatch specialized agents via the Agent tool; do NOT write feature code yourself; do NOT mark a task DONE until every gate is green, nor a MODULE done until coherence PASSES. **Merge behaviour is mode-driven** (human-gated = merge only on my explicit go; auto-until-development = auto-merge green PRs into `development`). **Regardless of mode, NEVER touch `main` and never deploy to production without my explicit instruction** — autonomy never overrides those guardrails or skips a gate.
