---
name: stay-within-limits
description: The usage-budget soft-stop for unattended `auto-until-development` runs — check the active 5-hour / weekly usage window at task/wave boundaries, and when it is ≥95% spent, pause cleanly by writing CHECKPOINT.md and scheduling a self-contained resume instead of dying mid-task. Use at every task boundary of an autonomous walk (the orchestrator), and before launching a new wave of parallel subagents. Params live in harness.config.md → Usage-Budget Awareness. ADR-0034.
---

# Stay Within Limits

Keep an unattended `auto-until-development` run inside the account's active 5-hour and weekly
usage windows. The failure this prevents: a long autonomous walk exhausts the window **mid-task**,
stopping at an arbitrary point instead of a safe boundary. The fix reuses machinery the harness
already has — `CHECKPOINT.md` (the durable resume packet, ADR-0017) + `ScheduleWakeup` (re-enter the
loop later) — and adds the missing piece: a **trigger** that notices the window is nearly spent
*at a safe boundary* and pauses there.

> **Scope.** This is an `auto-until-development` discipline. In `human-gated` mode the loop already
> stops at every merge, so the human sees the window naturally — no budget check needed there.
> It is a **soft-stop**: it changes *when* the loop pauses, never *what* the gates check, and it
> **never** touches the `main`/deploy guardrails.

## Where it runs (boundaries, never mid-task)

Check the budget **only at safe boundaries** — never interrupt in-flight work, which usually loses it:
- **before starting a new task** in an autonomous walk (the natural unit boundary), and
- **before launching a new wave** of parallel subagents (a `parallelGroup`).

Do **not** poll mid-build, mid-gate, or between an agent's own steps.

## The check

```sh
npx -y ccusage@latest blocks --active --json
```

Parse the JSON for: the active block's **start timestamp**, its **cost / percentage**, and **time
remaining**. The threshold and command are mirrored in `harness.config.md` → **Usage-Budget Awareness**
(one source of truth) — read params from there, not from memory.

- **Below threshold** → continue the loop normally.
- **Active 5-hour OR weekly window ≥ 95%** → **stop launching new work** and pause (next section).
- **`ccusage` unavailable** (not installed, no network, parse error) → **fail open**: log one line
  (`budget-check skipped: <reason>`) and continue. A missing budget reading must never freeze a build.

## The pause (a clean checkpoint, not a crash)

1. **Write `CHECKPOINT.md`** in the canonical Run Checkpoint shape (`harness.config.md` → Compaction
   Resilience) — gate state verbatim, next-runnable task id, exact next steps. This is the
   self-contained resume packet; it must stand on its own without conversation memory.
2. **`ScheduleWakeup`** for `min(3600, secondsUntilWindowClears)` with a self-contained resume prompt
   that includes: the remaining plan, the **re-check-then-reschedule** rule, the 95% threshold + wave
   throttle, the exact `ccusage` command, the **previous active-block start timestamp**, and the next
   verification steps. If the runtime clamps the delay to ≤3600s and the window needs longer, the wake
   prompt re-checks and reschedules (chained wakeups).
3. **Report to the human:** which window crossed threshold, the observed usage, when the next check is
   scheduled, and what work remains.

## On resume

- **Re-check the real window** before continuing — a **new** active-block start timestamp (compared to
  the one carried in the wake prompt) is stronger evidence the window cleared than elapsed wall-clock.
- Still ≥ threshold → reschedule (do not resume).
- Safely below → re-ground from `CHECKPOINT.md` (the orchestrator's normal resume contract) and
  continue the walk from its **Next Steps**.

## Notes

- A prompt-cache miss after a long sleep is acceptable — preserving the window matters more.
- For a longer-than-clamp wait, prefer chained `ScheduleWakeup`s (each re-checks) over one long sleep.
- This pairs with `parallel-integration` (wave boundaries) and the `auto-until-development` hard-stop
  set in `harness.config.md` → Autonomy — budget-exhaustion is one more soft-stop alongside "5 failed
  gate loops" and "coherence can't PASS".
