# ADR 0003 — Two run modes: `human-gated` vs `auto-until-development`

**Date:** 2026-06-21 · **Status:** accepted · **Context task:** `feat/harness-autonomy-mode`

## Context
The harness was built human-gated by default: auto-merge OFF, a human "go" before every PR merge, and an explicit human "integration go" at every module boundary. For greenfield internal projects with a complete, traceable task graph (e.g. this one — 68 features, 0 orphans, fully scoped) those stop-points are *policy conservatism*, not a technical necessity. The quality gates (typecheck → lint → unit+coverage → build → e2e → security → code-review APPROVE, plus the module coherence review) are all machine-evaluated and are the real safety mechanism. The user asked for an **unattended end-to-end run** option without removing the safe default.

## Decision
Introduce a single switch, **`AUTONOMY_MODE`**, in `harness.config.md` (the single source of truth) with two values:

- **`human-gated`** (default, unchanged behaviour) — per-task gate loop runs to green, then **stops for a human go** before each merge and at each module integration boundary.
- **`auto-until-development`** — the orchestrator walks the runnable task graph unattended: build → all gates green → **auto-merge the PR into `development`** (`gh pr merge --squash`) → librarian → next runnable task → coherence review at module edges. It stops **only** on a hard failure (5 failed gate loops, coherence can't reach PASS, un-resolvable security High/Critical) or on reaching `main`/deploy.

**How the mode is chosen:** the `orchestrator` resolves `AUTONOMY_MODE` at `/build` Boot. If unset, it **asks the human** via `AskUserQuestion` (human-gated / auto-until-development / auto-this-batch-only) and offers to persist the choice. It asks **at the boundary, not per task** — when launching an autonomous batch it confirms once, then runs without per-task prompts.

## Why these two un-overridable guardrails stay human in BOTH modes
The autonomy envelope deliberately ends at `development`. The mode flag can **never**:
- promote `development → main` (kept an explicit human instruction — `main` stays protected), or
- deploy to production (always explicit human approval per the DevOps DoD), or
- skip any quality gate (autonomous means "don't ask when green," not "don't check").

So the human's judgment simply **moves from per-task/per-module merges to release time**. Nothing leaves `development` autonomously.

## Consequences
- Internal greenfield projects can run the full SDLC unattended in one go and still get the same gate rigor; the human reviews at release (`development → main`) instead of per task.
- The default stays `human-gated`, so existing behaviour is unchanged unless someone opts in.
- Per-invocation override (`auto-this-batch-only`) lets a human-gated project do one unattended run without changing the persisted default, and vice-versa.
- Files touched: `harness.config.md` (Autonomy section + mode-driven merge policy), `orchestrator.md` (Boot mode resolution + mode-driven merge handoff + mode-driven module integration go), `build.md` (mode resolution + mode-aware rules), `CLAUDE.md` (mode-aware merge non-negotiable).
- **Revisit trigger:** if autonomous runs ever land changes into `development` that a human would have caught at merge, tighten the gates (the fix is a stronger gate, not re-adding a human merge prompt) — or scope `auto-until-development` to specific modules.
