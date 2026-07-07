# ADR 0034 — Usage-budget awareness: a soft-stop so unattended runs pause cleanly instead of dying mid-module

- **Status:** Accepted
- **Date:** 2026-06-26
- **Deciders:** human (project owner) + harness
- **Relates to:** ADR-0017 (compaction resilience / CHECKPOINT.md), ADR-0022 (run ledger / durable cap), the Autonomy run-mode model
- **Source:** BuilderIO/skills `stay-within-limits` (adapted to this harness)

## Context

`AUTONOMY_MODE=auto-until-development` walks the runnable task graph unattended — potentially across several modules in one sitting. The loop had **zero awareness of the account's usage window**. A long run could exhaust the active 5-hour (or weekly) limit **mid-task**: the session stops at an arbitrary point, not a safe boundary, and whatever in-flight state lived only in conversation memory is at risk.

We already have the two ingredients to do better — we just never connected them:
1. **A durable resume packet** — `CHECKPOINT.md` (ADR-0017) already captures the exact run state in a self-contained shape; the SessionStart hook re-surfaces it on `startup|resume|compact|clear`.
2. **A wake mechanism** — `ScheduleWakeup` can re-enter the loop after a delay with a self-contained prompt.

What was missing was the **trigger**: notice the window is nearly spent *at a safe boundary* and pause there, rather than running into the wall.

## Decision

Add a **usage-budget soft-stop** to the autonomous loop — a new entry in the hard-stop set, alongside "5 failed gate loops" and "coherence can't PASS".

- **Mechanism lives in a skill:** `.claude/skills/stay-within-limits/SKILL.md` (canonical procedure — check, threshold, pause/resume). Numeric params live in `harness.config.md` → **Usage-Budget Awareness** only (one source of truth), mirroring how `output-bounding` factors its params.
- **The check:** `npx -y ccusage@latest blocks --active --json` reads the active 5-hour block's cost/percentage + time remaining. Run it **at task/wave boundaries** in `auto-until-development` — never mid-task (interrupting in-flight work loses it).
- **The threshold:** active 5-hour **or** weekly window **≥ 95%** ⇒ **stop launching new work**. Finish nothing new; do not start the next task.
- **The pause is a clean checkpoint, not a crash:** write the current state to `CHECKPOINT.md` in the canonical shape (the resume packet already required by ADR-0017), then `ScheduleWakeup` for `min(3600, secondsUntilWindowClears)` with a self-contained resume prompt. On wake, **re-check the real window** (a new active-block timestamp is stronger evidence than elapsed wall-clock) and resume only when safely below threshold; otherwise reschedule.
- **Scope:** `auto-until-development` only. `human-gated` already stops at every merge, so the human sees the window naturally. The soft-stop **never** overrides a quality gate and **never** touches the `main`/deploy guardrails — it only changes *when* the loop pauses, not *what* it checks.
- **Fail-open:** if `ccusage` is unavailable (not installed, no network, parse error), **log one line and continue** — a missing budget reading must never freeze a build (same philosophy as the authz hook failing open).

## Consequences

- **Positive:** an unattended run pauses at a **safe task boundary** with a durable resume packet, instead of dying at an arbitrary point with state only in conversation memory. Composes with existing durability (CHECKPOINT + run ledger) — the resume is self-contained.
- **Nature:** a **process contract** the orchestrator follows (defense-in-depth, like the error-handling discipline), not a mechanically-enforced gate. The fail-open posture keeps it from ever being load-bearing in the wrong direction.
- **Cost:** one cheap `npx ccusage` call per task boundary in auto mode — negligible against a build loop.

## Follow-ups (not in this change)
- A first-party host usage tool, if/when exposed, would replace the `ccusage` shell-out.
- An optional earlier caution threshold (e.g. a user-configured $/block guardrail) could supplement the 95% rule per `stay-within-limits`.
