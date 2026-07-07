# ADR 0022 — Run Ledger (durable merge history) + configurable wait-for-CI auto-merge

**Date:** 2026-06-23 · **Status:** accepted · **Context:** orchestration observability (HARNESS-AUDIT #4 + the "triple-fire on merge/status" cross-cutting risk) · **Relates to:** [ADR 0017](0017-compaction-resilience-run-checkpoint.md) (CHECKPOINT.md — current-state snapshot), [ADR 0003](0003-autonomy-mode.md) (the unattended mode this observes), [ADR 0018](0018-test-gate-cadence-unit-per-task-e2e-module-local.md) (why CI can be slow)

## Context
The harness audit (#4) found the `auto-until-development` control loop **stateless and unobservable**:

- Every safety property — the **5-iteration gate-loop cap**, which gates passed, loop position, what got merged — lived **only in the orchestrator's conversation memory**. A compaction / crash / `/clear` **reset the iteration cap to 0**, so a stuck task could loop well past 5 across resumes.
- **No record distinguished machine-auto-merged from human-merged work**, and there was no blast-radius data (which merge SHA introduced a regression).
- Auto-merge fired `gh pr merge --squash --delete-branch` on **local** gate-green with **no wait for the PR's CI** — local-pass was conflated with CI-green, and the loop walked to the next task before the post-merge `push:development` re-gate could fail. `--delete-branch` destroyed the forensic branch before any post-merge check.
- Cross-cutting: **three actors can flip a task to `done` on merge** (orchestrator auto-merge, `clickup-sync.yml` webhook, Boot `reconcile`) with **no idempotency key** — a double-fire can re-process a done task.

[CHECKPOINT.md](../../graph/CHECKPOINT.md) (ADR-0017) is a *single overwritten snapshot of the current task* — it answers "where am I now," not "everything that has merged," so it is not an audit trail or an idempotency key.

On wait-for-CI: making auto-merge block on CI is correct in principle, but **CI can be slow** (and a future pre-prod path runs E2E), so a hard always-wait would throttle unattended throughput. The local gates already mirror CI and the `push:development` re-gate already runs post-merge. So the wait should be **opt-in**, not mandatory.

## Decision
Two complementary mechanisms.

### 1. Run Ledger — `docs/graph/run-ledger.jsonl` (TRACKED, append-only)
One JSON object per completed task/merge, written **only** via `.claude/scripts/run-ledger.mjs` (validates + stamps `ts` + one well-formed compact line — a hand-written malformed line would silently break recovery). Fields: `ts, task, pr, mergeSha, initiator(auto|human), mode, iterations, gates{}, reviewer, note`. A leading `{"_meta":…}` line documents the schema and is skipped by readers.

- **Distinct from** CHECKPOINT.md (gitignored, current-task snapshot) and STATUS.md (the board). Checkpoint = "where am I now"; ledger = "everything that has merged." Tracked, because audit-trail + blast-radius value lives in git history.
- **Orchestrator contract:** on **boot/resume** read the ledger — a task already present = already merged → never re-merge / re-`done` it (the **idempotency key** that ends the triple-fire race), and restore the iteration cap from it instead of resetting to 0. On **every merge (auto or human)** append one entry — `initiator` gives auto-vs-human attribution, `mergeSha` gives blast-radius traceability.
- **Helper CLI:** `append` (stdin/`--json`), `has --task` (idempotency guard, exit 0/1), `iterations --task`, `tail`.
- **One artifact, five wins:** crash-recovery (durable cap) · audit trail · idempotent merges · blast-radius · auto/human attribution — exactly the audit's framing.

### 2. `MERGE_WAIT_FOR_CI` — configurable CI-wait (default `off`)
A new `harness.config.md` flag governing whether `auto-until-development` waits for the PR's CI before merging:
- **`off` (default):** merge on local gate-green (today's behaviour); the local gates mirror CI and the `push:development` re-gate is the backstop. Favours unattended throughput; accepts that a local-green/CI-red change can land and is caught on the next CI run.
- **`on`:** `gh pr checks <pr> --watch --fail-fast` before merge — **CI red → STOP** ("development red → STOP": mark the task `gates-red`, escalate, do not walk onto a broken base), CI green → merge and **defer `--delete-branch`** until the post-merge re-gate is green. For high-stakes / pre-promotion runs.

Chose `gh pr checks --watch` over `gh pr merge --auto` for portability: `--auto` needs the repo's auto-merge feature (branch protection → GitHub Pro), unavailable on this free/private repo.

## Consequences
- **The unattended loop becomes recoverable + observable:** the iteration cap survives compaction, every machine merge is attributable to a SHA, and the human can reconstruct exactly what was auto-merged and on what evidence.
- **The triple-fire race is closed** by a real idempotency key (the ledger `has` check), not by hoping three actors don't double-fire.
- **Throughput is preserved by default** (wait-for-CI is opt-in) while the safe-but-slower posture is one config flip away for high-stakes runs.
- **Honest limits:** the ledger is maintained by the orchestrator following this contract (Claude Code can't intercept the loop) — it is convention-enforced, like output-bounding (ADR-0016) and checkpointing (ADR-0017). The helper script makes the *format* reliable; the *discipline* of calling it is the orchestrator's. With `MERGE_WAIT_FOR_CI=off` (default), CI-red-after-merge is still only caught on the next CI run.
- Files: `.claude/scripts/run-ledger.mjs`, `docs/graph/run-ledger.jsonl` (seed), `harness.config.md` (Run Ledger section + `MERGE_WAIT_FOR_CI` + Context Manifest row), `.claude/agents/orchestrator.md` (boot read + merge append/wait), `.claude/skills/mr-flow/SKILL.md` (merge criteria).

## Follow-ups
- When server-side branch protection becomes available (repo public / paid — see ADR-0021), `MERGE_WAIT_FOR_CI=on` could use native `gh pr merge --auto`.
- The librarian may prune/rotate the ledger if it grows large (it is per-merge, so growth is slow); keep full history until that's a real problem.
