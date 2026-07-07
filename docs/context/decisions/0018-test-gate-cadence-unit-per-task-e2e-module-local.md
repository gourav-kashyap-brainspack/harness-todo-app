# ADR 0018 — Test-gate cadence: unit per-task (CI), E2E at the module edge (local only) + a pre-prod release gate

**Date:** 2026-06-22 · **Status:** accepted · **Renumbered:** originally drafted as `0016` — reassigned **0018** to resolve a number collision with [ADR 0016 — Tool Output Bounding](0016-tool-output-bounding-convention.md) · **Amends:** [ADR 0013](0013-temporarily-disable-test-gates.md) · **Relates to:** [ADR 0012](0012-disable-e2e-in-ci.md)

## Context
ADR 0013 disabled **both** the unit+coverage gate and the E2E gate (locally and in CI) to maximize autonomous throughput. The harness audit (`docs/HARNESS-AUDIT.md`, 2026-06-22) found the resulting blast radius unacceptable for a team whose stated bar is **quality is non-negotiable**: with both disabled, **no active gate executes the application against a change**, and a real `done→done completedAt` correctness bug (`96a8dc2`) rode seven testless merges into `development`, caught only at the once-per-module coherence review.

The two gates are **not** the same cost shape, and 0013 conflated them:
- **Unit (service-layer)** is cheap, fast, deterministic, needs no browser — ideal for CI and the right *per-task* mechanical backstop.
- **E2E (Playwright user flows)** is slow, flaky, 429-throttles on GitHub runners, and naturally tests *module-level* user journeys — a single task often has no complete flow to drive. ADR 0012 already removed it from CI for exactly these reasons.

The human decision is therefore to **split the two gates onto different cadences** rather than enable/disable them together.

## Decision
1. **Unit + coverage → RE-ENABLED as a per-task active gate, runs in CI and locally.** Back in the per-task `gate-runner` (step 3) and the CI `ci.yml`. Coverage thresholds restored: **≥80% lines on changed files, ≥70% global**. Builders/`unit-tester` author unit tests again, focused on **service-layer logic** (`*.service.ts`) — the cheap, high-value catch.
2. **E2E → RE-ENABLED but at the MODULE EDGE, LOCAL ONLY (never CI).** E2E is **not** a per-task gate. It runs **once per module**, locally, as a **blocking Module-DoD gate** alongside the coherence review, executed by `e2e-automator`. It writes a **verdict artifact** into `docs/graph/coherence/<module>.md` (E2E section: pass/fail + run-log path) so the local run leaves an audit trail. A module is not `done` until the local E2E gate is green. **E2E is never added to `ci.yml`** — GitHub-runner cost/flakiness is not worth it.
3. **E2E → ALSO a mandatory pre-production release gate.** Before any `development → main` promotion, the **full E2E suite must pass** (run locally/manually). Encoded in the `release-rollback` production-readiness checklist as a hard, non-optional item. "Do E2E in production" is made concrete: it gates the prod promotion, not every push.

### Resulting gate map
| Gate | Cadence | Where | Notes |
|---|---|---|---|
| Typecheck · Lint · Build | per task | CI + local | unchanged |
| **Unit + coverage** | **per task** | **CI + local** | re-enabled (this ADR) |
| Security · Code-review | per task | local (LLM verdict) | unchanged |
| **E2E (user flows)** | **per module** | **local only** | blocking Module DoD; evidence artifact; never CI |
| **E2E (full suite)** | **pre-production** | **local only** | blocking `development → main` release gate |

### Active per-task gate set (supersedes the 0013 set)
**Typecheck · Lint · Unit+coverage · Build · Security · Code-review.** (E2E leaves the per-task set entirely — it is a module-edge + release gate.)

## Consequences
- **Quality floor restored at the right layer.** Logic bugs are caught per-task by unit tests *before* auto-merge; flow/integration breaks are caught per-module by local E2E *before* the module is declared done.
- **CI stays cheap and fast.** No E2E minutes on GitHub; CI = typecheck · lint · build · unit. Re-adds the Postgres service + env placeholders to CI for the unit step (reverting the 0013 removal note in `ci.yml`).
- **Local E2E is honor-system-resistant** via the blocking Module-DoD step + the committed verdict artifact — but it is still *local*, so the pre-prod full-E2E release gate is the hard server-of-record before production.
- **Files changed:** `harness.config.md` (Task + Module DoD), `CLAUDE.md` (DoD), `gate-runner` skill (un-skip unit; E2E → module-edge note), `orchestrator.md` (re-enable unit step; E2E moves to the Module-DoD loop), `coherence-review` skill (E2E sibling gate + artifact), `e2e-automator.md` + `unit-tester.md` (remove disabled notes; set cadence), `release-rollback` skill (pre-prod E2E gate), `ci.yml` (restore unit + Postgres service).
- **Supersession hygiene** (audit finding): this ADR explicitly **amends 0013** — 0013's unit-disable is reversed; 0013's *throughput* rationale survives only for E2E's CI removal, which is now owned jointly by 0012 + this ADR. 0012 (E2E-not-in-CI) remains in force and is reaffirmed here.

## Still open (tracked, not in this ADR)
- CI SCA/secret/migration-apply steps (`pnpm audit`, gitleaks, `prisma migrate`) — audit gaps #3 / cross-cutting, deferred to the Wave-1 security wiring.
- Flaky-gate re-run-once policy (audit #10) — should land with E2E re-enablement so module-edge E2E flakes don't false-block; tracked separately.
