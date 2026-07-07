# ADR 0017 — Compaction Resilience (structured Run Checkpoint)

**Date:** 2026-06-22 · **Status:** accepted · **Context:** harness-level convention (`.claude/`) · **Mode:** autonomous (AUTONOMY_MODE=auto-until-development) · **Related:** [[0016-tool-output-bounding-convention]] (same philosophy — durable truth in files, lean disposable context)

> **ADR numbering note:** this decision is **0017**. A prior `0016` collision (two ADRs shared the number) was resolved by reassigning the gate-cadence ADR to **[0018](0018-test-gate-cadence-unit-per-task-e2e-module-local.md)**; `0016` is now uniquely [Tool Output Bounding](0016-tool-output-bounding-convention.md).

## Context
The agent's working memory (task spec, what it built, which gates passed, exact error strings, decisions) lives in the **context window**, which has a hard size limit. When a session runs long, Claude Code **auto-compacts**: it summarizes everything so far, discards the original detail, and continues from the summary — and **we do not control what the summary keeps.**

This is tolerable in `human-gated` mode (a human is watching). It is **dangerous in `auto-until-development`** (ADR 0003), where the orchestrator walks the task graph unattended for a long time — which is exactly when compaction fires. A free-form summary can silently drop the spec's acceptance criteria, which of the gates already passed, the exact error being fixed (`tasks.service.ts:84 — TypeError ... 'toISOString'`), or the file under edit. The agent then resumes with fuzzy notes: it re-does work, or believes a gate passed when it did not. **Silent amnesia mid-run.** Same philosophy as ADR 0016 (Tool Output Bounding): durable truth on disk, context lean and disposable.

We cannot replace Claude Code's compactor, so we (1) **bias** it toward keeping the right things and (2) **keep the load-bearing state in a file** so conversation memory becomes disposable.

## Decision
A fixed **Run Checkpoint shape** + two mechanisms:

- **Single source of truth:** the canonical shape + rules + safe-moment list live ONLY in `harness.config.md` → **Compaction Resilience / Run Checkpoint** (Goal · Constraints · Progress{Done/InProgress/Blocked} · Key Decisions · Next Steps · Critical Context · Relevant Files). Verbatim rule: copy exact paths/commands/errors/identifiers/gate-verdicts, never paraphrase.
- **Part 1 — bias the summary** (`CLAUDE.md` standing instruction): when compacting/summarizing/handing off, output exactly that shape and preserve exacts verbatim. Defense-in-depth for the in-conversation summary.
- **Part 2 — durable checkpoint** (the real safety net): the **orchestrator** overwrites `docs/graph/CHECKPOINT.md` with the shape at safe moments (branch creation, after each gate result, before a new task, before any long op, on escalation, on task `done`). One small file, current-state-only, never an append log. On Boot the orchestrator reads it **first** and resumes from **Next Steps** rather than restarting.
- **Resume surfacing:** the existing `SessionStart` hook is extended to (a) widen its matcher to `startup|resume|compact|clear` and (b) `cat` `CHECKPOINT.md` before the trimmed `STATUS.md`. The **`compact` source fires after auto-compaction**, so the live run state is re-injected automatically post-compaction (and on resume/clear).
- **Location separation:** `CHECKPOINT.md` = volatile per-run truth (git-ignored, orchestrator-owned); `STATUS.md`/`modules.json` = durable per-task truth (committed, task-graph/librarian-owned). Never double-store.

## Deviation from the source spec (verified, not assumed)
The spec (`compaction-resilience.feature.md` §5.5) proposed a **`PreCompact` hook** that `echo`s a reminder to bias the summary. **This was verified incorrect for the current Claude Code hook contract:** a `PreCompact` hook's stdout is **not** injected into the compaction/summarization prompt — `PreCompact` can only **block** compaction (`{"decision":"block"}`) or perform side-effects (e.g. transcript backup). It therefore cannot bias what the summary keeps. The reliable mechanism is the durable file + the **`SessionStart` `compact` source**, whose stdout *is* surfaced to the model after compaction. **No `PreCompact` hook is added.** (Doc: Claude Code Hooks Reference — Compaction & Session Events.)

## Non-Goals
- Do **not** replace/intercept/re-implement Claude Code's compaction; do **not** emulate opencode's loop-level `context-epoch` machinery from a config layer.
- `CHECKPOINT.md` is **terse current state**, not a transcript — overwrite, never append.
- Do **not** duplicate the shape into multiple files; define once, reference.

## Consequences
- ✅ A long unattended run survives compaction, crashes, restarts, and `/clear` with the spec, gate state, exact pending error, and next step intact — resumed automatically by the SessionStart hook.
- ✅ Gate state is preserved verbatim, so a resumed run never re-claims a false pass or re-runs a passed gate.
- ⚠️ The orchestrator carries a small discipline cost (one file overwrite at each safe moment) — negligible vs. the cost of silent amnesia mid-run.
- ⚠️ Convention-enforced (orchestrator + CLAUDE.md), not loop-enforced — a custom loop that bypasses the orchestrator must honor the same contract.

## Verification (smoke test)
Start a task, get 3–4 gates green, force compaction (`/compact`) mid-task. Confirm the agent resumes from the checkpoint — knows which gates were green, the exact pending failure (`file:line` + error), and the next step — **without** re-running passed gates or losing the spec. Bonus: `/clear` and confirm the SessionStart hook (`clear` source) re-grounds identically.

## Rollout (lowest risk first)
1. Shape + policy in `harness.config.md`. ✅
2. `CLAUDE.md` bias instruction (Part 1). ✅
3. Orchestrator Checkpoint step + Boot-read resume contract (Part 2). ✅
4. Extend `SessionStart` hook (matcher + `cat CHECKPOINT.md`); `.gitignore` entry. ✅
5. ~~PreCompact hook~~ — dropped (stdout not injected; superseded by SessionStart `compact`). ✅ (decision recorded)
6. Smoke test (force compaction mid-task) — pending live run.

## Links
- `harness.config.md` → Compaction Resilience / Run Checkpoint · `.claude/agents/orchestrator.md` → Run checkpoint · `.claude/settings.json` (SessionStart hook)
- Related: [[0016-tool-output-bounding-convention]], [[0003-autonomy-mode]]
