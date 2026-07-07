# ADR 0024 — Traceability verification gate (machine-checked requirement→spec chain)

**Date:** 2026-06-23 · **Status:** accepted · **Context:** requirements integrity (HARNESS-AUDIT #8) · **Relates to:** the `requirements-intake` / `task-graph` skills, the RTM (`docs/requirements/TRACEABILITY.md`)

## Context
The harness promises "requirements are traceable": every feature in `features.csv` → module → task → spec (`modules.json`) → RTM (`TRACEABILITY.md`), so nothing is silently dropped between PRD and shipped code. But that chain was **100% hand-maintained and unverified** — and had **already drifted**: `AUTH-001.spec.md` was absent from disk while `modules.json` still pointed at it as a `done` task. The build loop checked a spec's *open questions* but never asserted the spec file *exists*. The exact silent drop the RTM exists to prevent had happened, unnoticed.

## Decision
Add a **fail-closed traceability gate** — `scripts/verify-traceability.mjs` (run via `pnpm traceability:check`), wired into `ci.yml`. Pure file reads (no deps), so it can run anywhere in CI. Four **structural** checks:

- **A. Spec existence (the AUTH-001 guard):** every `modules.json` task has a `spec` AND that file exists on disk.
- **B. No dropped feature:** every `features.csv` `feature_id` appears in `TRACEABILITY.md`.
- **C. RTM specs resolve:** every spec path referenced in the RTM exists under `docs/specs/`.
- **D. RTM task-ids real:** every module-prefixed task-id in the RTM exists in `modules.json` (`[A-Z]{2,}-\d{3}` — excludes `F-###` feature ids).

**Deliberately NOT checked: status-equality** across the three files. `features.csv`'s `status` column is known-stale (the audit found "59/68 unmapped while 37 delivered"), so a hard status check would fail on day one and be useless as a gate. Status reconciliation is a documented follow-up; the structural chain is the high-value, unambiguous part that actually caught the real bug.

## Consequences
- A dropped/renamed spec, an un-mapped feature, or a dangling RTM reference now **fails the PR** instead of shipping silently — the AUTH-001 class is mechanically prevented.
- **Green today** (verified: 31 tasks all-specs-present, 68 features all-in-RTM, 23 RTM spec refs resolve) — no false-positive break. **Negative-tested:** a fabricated tree with a missing spec + a dropped feature + a ghost task-id is correctly caught on checks A/B/D.
- **Honest limits:** structural only — it proves the links are *whole*, not that statuses *agree* or that a spec's *content* matches the code. The deeper "derive STATUS.md/RTM from modules.json as the single source" refactor the audit suggested is a larger follow-up; this gate is the cheap, fail-closed floor under it.
- Files: `scripts/verify-traceability.mjs`, `package.json` (`traceability:check`), `ci.yml` (Traceability integrity step).

## Follow-ups
- Status reconciliation: derive `features.csv.status` + `STATUS.md` from `modules.json` (single source) instead of hand-maintaining three; then a status-agreement check becomes safe to add.
- Optionally make it a pre-merge / gate-runner local step too (currently per-PR + `push:development` in CI).
