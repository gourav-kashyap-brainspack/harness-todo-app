# ADR 0026 — Visual verification gate (deterministic floor + local pixel, CI-seconds rule)

**Date:** 2026-06-24 · **Status:** accepted · **Context:** UI/frontend design harness · **Relates to:** ADR-0012 (E2E not in CI), ADR-0009 (async UI states + axe), the module-edge coherence/E2E gate, `e2e-automator`, `playwright.config.base.ts`

## Context
Nothing proved a rendered screen is actually correct and consistent across screen sizes. The existing axe a11y gate (ADR-0009) checks accessibility locally but not layout/appearance. We need verification that catches "rendered but not wired" and "breaks on a phone," without re-introducing slow checks into CI (ADR-0012).

## Decision
A **layered** visual verification, folded into the EXISTING module-edge E2E gate (no new gate, no new skill — `e2e-automator` runs it, records a `## Visual` subsection in `docs/graph/coherence/<module>.md`).

**Hard constraint — the CI-seconds rule:** a check runs in CI **only if it finishes in seconds.** Everything heavier runs **locally** at the module edge. ADR-0012 (no slow/E2E checks in CI) holds.

| Layer | What | Where it runs |
|---|---|---|
| Deterministic floor | `ariaSnapshot` structural assertion **merged with the existing axe pass** (light + dark); responsive checks (no-overflow sweep, min-touch-target, no-clip); bundle-size-per-route budget | **fast → CI** for responsive + bundle + off-system lint; **local** for aria/axe (driving the browser) |
| Pixel (opt-in per surface) | `toHaveScreenshot` vs a committed baseline | **LOCAL ONLY — never in CI** (too slow; human decision 2026-06-24) |
| Agent-judged taste | a read-only `design-reviewer` LLM pass | **out of scope** here — a Design Profile `tasteReviewer` capability, capped iterations, local only |

**Pixel policy (when a surface opts in):**
- **First baseline auto-accepts** (a brand-new surface can't be a regression); **only a changed baseline of a previously-approved surface** stops for a human, co-located with integration-go. This preserves the `auto-until-development` autonomy guarantee.
- **Storage: direct-commit PNGs, no Git-LFS** by default (per-team config; LFS/external are documented on-ramps for scale). A `baseline|actual|diff` contact-sheet PNG is emitted to `docs/graph/logs/` for legible review.
- **`visualStatus`** is recorded alongside `coherenceStatus` in `modules.json`; "module DONE" requires it GREEN; a verbatim visual line goes in the Run Checkpoint shape so a compaction can't fake a module-DONE.
- Playwright is pinned and **excluded from dependency auto-bump** (a bump mass-invalidates baselines → a deliberate re-baseline ritual, not a per-module hard-stop).

## Consequences
- The default verification (aria/responsive/bundle) is deterministic and CI-safe-where-fast; pixel is opt-in and local, so CI stays seconds-fast and ADR-0012 is untouched.
- No new per-task gate; the floor folds into the module-edge E2E gate and the lint/build gates.
- Implemented across phases (P2 responsive+bundle, P3 aria floor, pixel layer after) — this ADR is the decision of record the phases build to.

## Follow-ups
- Full Lighthouse blocking budgets: a Design Profile `perfBudgets` capability, advisory/warn first, blocking only via a future ADR.
