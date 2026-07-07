# ADR 0032 — E2E structured failure diagnostics + a11y gate OFF

- **Status:** Accepted
- **Date:** 2026-06-25
- **Deciders:** human (project owner) + harness
- **Supersedes/amends:** narrows ADR-0026 (visual/a11y verification) — the axe/WCAG portion is switched OFF by default; the aria-snapshot + responsive portions stand.

## Context

A retrospective of the PROF module build surfaced two related problems:

1. **E2E failures were not self-diagnosing.** A dark-mode contrast failure cost ~2 hours because the a11y helper threw only the element HTML — never axe's actual computed colors — so every actor (orchestrator + builders) *guessed* at the cause, the orchestrator burned its full 5-iteration cap on dead-end fixes, and finally **misdiagnosed** it as a "stale server." Compounding it, `trace: on-first-retry` + local `retries: 0` meant a local failure produced **no trace at all** — zero captured console/network/DOM to diagnose from.

2. **The a11y gate is not valued for this project.** The axe/WCAG E2E assertions are the single largest source of slow, brittle, low-value failures here, and the owner has decided accessibility is not a priority for now.

## Decision

### 1. A11y gate OFF by default (reversible)
- New Design Profile switch **`a11yGate: off`** (`harness.config.md`).
- Mechanism: env flag **`E2E_A11Y`** (default unset → off), read by `apps/web/e2e/axe-helper.ts`. `assertNoA11yViolations` and `assertNoA11yViolationsBothThemes` become **no-ops** when off, so all existing spec calls neither run axe nor toggle themes.
- The dedicated `apps/web/e2e/uif-006-a11y.spec.ts` is `test.skip`-guarded on the same flag, so it reports as **SKIPPED** (honest) rather than fake-passing via the no-op helper.
- **Re-enable** at any time by running the suite with `E2E_A11Y=true`.

### 2. E2E failures must be self-diagnosing (structured diagnostics)
- **`trace: retain-on-failure`** (was `on-first-retry`) so every failure — including local `retries: 0` runs — captures the full DOM + console + network timeline.
- **`json` reporter** → `docs/graph/logs/e2e-results.json`: a machine-readable result file the `e2e-automator` parses for failures (error message + screenshot/trace attachment paths) instead of scraping stdout.
- **`apps/web/e2e/fixtures.ts`**: an extended `test` that auto-captures console errors + failed/4xx network requests and, on failure, attaches a structured `failure-context.json` (final URL · console errors · network failures · trimmed error). New specs import `{ test, expect }` from here.
- **Process (playwright-autogen skill):** on failure the agent emits a structured **`what · why · how-to-fix`** verdict from those artifacts — **a bare "X failed", or a guess not grounded in the artifacts, is a STOP.** Retries must change a hypothesis backed by evidence; two identical failures ⇒ escalate; environment-class failures are fixed in the environment, never the app code, and a clean rebuild must reproduce before concluding it's a code bug.

## Consequences

- **Positive:** the ~2h "guess-and-loop" failure mode is structurally prevented — failures now carry their own evidence, and blind retrying is forbidden by the skill. The slowest/brittlest gate (a11y) is off, speeding the E2E gate.
- **Trade-off:** accessibility regressions will not be caught by the gate while `a11yGate: off`. This is an accepted, explicit, reversible choice (`E2E_A11Y=true`), not silent rot — the switch and this ADR record it.
- **Scope:** ADR-0026's aria-snapshot + responsive checks remain active; only the axe/WCAG assertions are gated off.

## Follow-ups (not in this change)
- Mechanically enforce unit coverage (separate finding): wire `test:coverage` into CI + add `vitest coverage.thresholds` (today the ≥80%/≥70% bar is convention-only).
- Generalize the "diagnose-before-retry / no-progress / escalate-with-evidence" rules into the orchestrator gate loop and `gate-runner` for non-E2E gates too.
