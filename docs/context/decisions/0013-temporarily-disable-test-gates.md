# ADR 0013 — Temporarily disable unit+coverage and E2E test gates

**Date:** 2026-06-21 · **Status:** ⚠️ **SUPERSEDED — amended by [ADR 0018](0018-test-gate-cadence-unit-per-task-e2e-module-local.md)** (was: accepted, temporary) · **Relates to:** [ADR 0012](0012-disable-e2e-in-ci.md) · **Context task:** autonomous AUTH→DOCS build run

> **Do not act on this ADR in isolation — read [ADR 0018](0018-test-gate-cadence-unit-per-task-e2e-module-local.md) first.** 0018 reverses 0013's unit-disable: **unit+coverage is RE-ENABLED per-task (CI + local)**. Only 0013's *E2E-out-of-CI* rationale survives, now owned jointly by [ADR 0012](0012-disable-e2e-in-ci.md) + 0018 (E2E relocated to a module-edge local gate). The "Revisit / re-enable" note below is historical — 0018 is the authoritative current gate cadence.

## Context
The autonomous end-to-end build was spending the large majority of its wall-clock on the test gates rather than on building:
- The CI E2E full-browser matrix was slow (~10 min/run) and repeatedly red (429 self-throttling, cross-browser debt, argon2 too heavy for the 2-core runner, a flaky unit test). E2E was already removed from CI in ADR 0012.
- Orchestrator subagents burned whole turns (hours) waiting on / iterating against those gates.
- Per-task unit+coverage and E2E authoring add substantial time per task across the remaining 8 modules.

The human explicitly asked to **disable unit + coverage + E2E testing for the rest of this SDLC run** to maximize autonomous throughput, accepting the quality tradeoff.

## Decision
For the current autonomous run, **disable the unit+coverage (gate 3) and E2E (gate 5) gates** — both locally and in CI. The **ACTIVE gate set** is:

**Typecheck · Lint · Build · Security · Code-review.**

Concretely:
- `harness.config.md` Task DoD marks gates 3 and 5 disabled; defines the active set.
- `gate-runner` skill skips steps 3 and 5, reports them `"skipped"`, and excludes them from `overall`.
- `.github/workflows/ci.yml` removes the `Unit tests` step (E2E already removed in 0012). CI = typecheck · lint · build · security.
- The orchestrator does **not** dispatch `unit-tester` or `e2e-automator`, and builders do **not** author unit/E2E tests while disabled.
- Existing tests remain in the repo (not deleted) — just unenforced.

## Consequences
- ✅ Much faster autonomous throughput; CI is fast and reliable; no more test-gate stalls.
- ⚠️ **Significant quality-safety reduction:** no automated unit/integration/E2E verification. Correctness rests on typecheck, lint, build, security review, and code review only. Regressions that only tests would catch can reach `development`.
- ⚠️ Coverage thresholds (≥80% changed / ≥70% global) are not enforced; new code may ship untested.
- ⚠️ The harness's documented "7-gate" DoD is intentionally not fully met during this window — this is a deliberate, logged exception, not drift.
- **Revisit / re-enable (HISTORICAL — superseded by [ADR 0018](0018-test-gate-cadence-unit-per-task-e2e-module-local.md)):** this was the original re-enable plan. **It has already been actioned, partially, by 0018** — unit+coverage is back on per-task (CI + local) and E2E is now a module-edge local gate (not CI). Do **not** "revert this ADR" wholesale; that would re-disable unit and re-add E2E to CI, contradicting 0018. Treat 0018 as the live gate cadence.
