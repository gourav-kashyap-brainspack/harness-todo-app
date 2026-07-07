# ADR 0033 — Harness reliability hardening: error-handling discipline, mechanical coverage, infra CI-wait, branch-base preflight

- **Status:** Accepted
- **Date:** 2026-06-25
- **Deciders:** human (project owner) + harness
- **Relates to:** ADR-0013 (flaky=failing), ADR-0018 (gate cadence), ADR-0022 (run ledger / durable cap), ADR-0030 (reviewer finding format), ADR-0032 (E2E structured diagnostics)

## Context

A retrospective of the PROF + OPS build identified where the loop wasted the most time. The dominant cost was not too few retries — it was **retrying on a guess**:

1. A dark-mode E2E failure burned the **full 5-iteration cap** on dead-end fixes (3 bad commits) and was then **misdiagnosed** as a "stale server" and escalated with a *theory, not evidence* — ~2h lost. Root cause of the waste: failures weren't self-diagnosing, environment-vs-code wasn't classified, and the loop kept re-running unchanged things.
2. **Coverage was convention-only.** The Task DoD claims "≥80% changed / ≥70% global, enforced in CI," but CI ran `pnpm test` = `vitest run` **without** `--coverage`, no `coverage.thresholds` existed, and the CI comment misstated it — a change could land under-covered and CI stayed green.
3. **Local-green ≠ CI-green.** OPS PR #57 passed local `devops-gates` but failed CI (`secret-scan`/`terraform`/`docker`) on tool-version skew, costing a full extra devops run.
4. **Stale branch base.** PROF planning was branched off a stale `feat/ui-reskin`, needing a cherry-pick to land cleanly (~15m).

## Decision (one PR, four changes)

### 1. Error-Handling & Retry Discipline (#2/#3/#4) — process contract
New `harness.config.md` section, wired into the orchestrator loop (step 10) + the `gate-runner` skill:
- **Classify before acting** (environment / deterministic-code / flaky). An **environment** failure is fixed in the environment, **never** by editing app code; an env-sanity check (stack up? clean rebuild reproduces? local tools match CI?) runs on the first environment-sensitive failure.
- **Diagnose before retry:** a retry must carry a changed hypothesis backed by the failure's diagnostic data; re-running an unchanged thing is forbidden.
- **No-progress early-stop:** `gate-runner` emits a per-failure `class` + `errorSignature`; two consecutive identical signatures ⇒ escalate immediately (don't walk to the 5-cap, recorded in `CHECKPOINT.md`).
- **Escalation contract:** verbatim error + diagnostic artifact + what-was-ruled-out; a bare "X failed" or an unevidenced theory is rejected.

### 2. Mechanical coverage enforcement (#6)
- `vitest.config.base` gains `coverage.thresholds` (**lines/statements/functions/branches ≥ 70**, the documented global floor). Current coverage (api ~96% lines, web ~94%) sits well above, so it only bites on regression.
- Root `test:coverage` script added; **CI's unit step now runs `pnpm test:coverage`** (was `pnpm test` — no coverage). The misleading CI comment is corrected.
- The **≥80%-on-changed-files** bar is not natively expressible in vitest (needs diff-coverage) — it stays a gate-runner/reviewer check; a diff-coverage step is a follow-up.

### 3. Infra/high-stakes `MERGE_WAIT_FOR_CI` = on (#5-partial)
Regardless of the global default (`off`), `MERGE_WAIT_FOR_CI` is forced **on** for PRs on the devops/OPS track or touching `infra/**`, `.github/workflows/**`, `**/Dockerfile`, `docker-compose*.yml`, `**/*.tf` — these have high local-green/CI-red risk, so never auto-merge until CI is green. (Full "local tools mirror CI versions" parity is a deferred follow-up.)

### 4. Branch-base preflight (#7)
`.claude/scripts/check-branch-base.mjs` warns (exit 0; `--strict` to fail) when the current branch's base is behind `origin/development`. The orchestrator runs it at branch creation and recuts off fresh `development` if stale.

## Consequences

- **Positive:** the ~2h "guess-and-loop" failure mode is structurally prevented (classify + diagnose + no-progress + evidenced escalation); the genuine coverage enforcement hole is closed mechanically; infra can't silently land CI-red; stale-base detours are caught early.
- **Nature of the changes:** #6 and the CI-wait override are **mechanical** (enforced by config/CI regardless of model behavior); the error-handling discipline and branch-base check are **process contracts** the orchestrator follows (defense-in-depth, like the rest of the harness) — but `errorSignature`/`class` make "no progress" *checkable*, not vibes.

## Follow-ups (not in this change)
- **Diff-coverage** step for true per-changed-file ≥80% enforcement.
- **Local↔CI tool-version parity** for `devops-gates` (pin local scanners to the CI digests).
- Consider promoting the branch-base preflight to a `PreToolUse` hook for full mechanical enforcement.
