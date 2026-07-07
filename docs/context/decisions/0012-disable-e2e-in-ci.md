# ADR 0012 — Disable E2E (Playwright) in CI; keep it as a local-only gate

**Date:** 2026-06-21 · **Status:** accepted (in force) · **Relates to:** [ADR 0013](0013-temporarily-disable-test-gates.md), [ADR 0018](0018-test-gate-cadence-unit-per-task-e2e-module-local.md)

> **Still in force, and reaffirmed by [ADR 0018](0018-test-gate-cadence-unit-per-task-e2e-module-local.md).** This ADR removed E2E from CI only. ADR 0013 later disabled the *unit* gate too, but 0018 reversed that (unit re-enabled per-task) while keeping E2E out of CI — so the E2E-not-in-CI rule here is now owned jointly by this ADR + 0018. E2E remains a local-only gate (module edge + pre-prod release).

## Context
During the autonomous AUTH build, the CI `gates` job repeatedly failed on the **E2E (Playwright, full browser matrix)** step while the **same suite passed reliably locally** (219 passed, ~57s, two consecutive runs).

Root causes, in order of impact:
- CI runs the **full 3-browser matrix** (chromium + firefox + webkit) on a **2-core GitHub-hosted runner** with `workers: 1` + `retries: 2`.
- AUTH introduced **CPU-heavy argon2** hashing on every register/login; the auth-flow specs run that hashing many times across all three browsers serially.
- Result: the E2E step ran ~6 min and the job died mid-run (E2E step left with no clean conclusion, report upload skipped) — not assertion failures, a **capacity/reliability** problem.
- Because the **local gate runs chromium-only**, the autonomous loop saw green locally and auto-merged onto a `development` whose CI was red — cross-browser/CI debt accumulated silently. (See also the local≠CI gate-coverage gap.)

Options weighed: speed up CI (lower test-env argon2 cost + explicit timeout, keep matrix) · chromium-on-PR + nightly full matrix · both · disable E2E in CI.

## Decision
**Per explicit human decision, disable E2E in CI entirely.** The CI `gates` job now runs **typecheck · lint · unit · build · security**. The **E2E gate is not removed from the Definition of Done** — it continues to run **locally (chromium)** in the build loop / `gate-runner` for every task. CI no longer installs Playwright browsers, runs the matrix, or uploads a Playwright report.

## Consequences
- ✅ CI is fast and reliable again; `development` can be green; the autonomous loop is unblocked for AUTH and the remaining modules.
- ⚠️ **No cross-browser (firefox/webkit) coverage in CI.** E2E correctness is enforced only locally on chromium during builds. Cross-browser regressions can reach `development` undetected by CI.
- ⚠️ The CI gate is now weaker than the documented 7-gate DoD. `harness.config.md` / `CLAUDE.md` describe E2E as a gate; it remains one **locally** — CI is a subset by design here.
- **Revisit triggers:** CI runners gain cores, E2E is sharded across jobs/browsers, or test-env argon2 cost is made tunable (lowered for tests) — at which point re-enabling E2E in CI (full matrix, or chromium-on-PR + nightly full matrix) should be reconsidered.
- The work on `fix/auth-throttle-e2e` is retained: env-aware auth throttling (prod unchanged), the API-client silent-refresh recursion fix, deterministic email capture, and the WebKit skip-link a11y fix all remain valuable for the local E2E gate and production correctness.
