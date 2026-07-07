# ADR 0037 — Maestro for React Native E2E

- **Status:** accepted
- **Date:** 2026-07-01
- **Context:** The harness deferred the E2E-tool choice (RN, so Playwright/Cypress don't apply — ADR 0036). The realistic RN options are **Maestro** (black-box, declarative YAML, smart waits) and **Detox** (gray-box, JS/TS, heavier native wiring). Our E2E gate is **module-edge, local-only, never CI** (ADR 0012/0018), and the `e2e-automator` **auto-generates** flows.

## Decision
Use **Maestro** as the RN E2E tool.

Rationale: declarative YAML is far easier for an agent to author/maintain reliably than imperative Detox+Jest; per-command smart waits keep async-heavy healthcare flows low-flakiness; near-zero native setup (a CLI + YAML, no per-platform build wiring); cross-platform (Android now; iOS when a full Xcode toolchain is available — this machine has Command Line Tools only). Detox stays the escalation path if a flow ever needs gray-box synchronization or internal-state assertions.

## Implementation
- **Flows:** `mobile/.maestro/*.yaml` (numbered). **Runner:** `mobile/scripts/e2e.sh` (resolves the device, checks Metro, bounds output to `docs/graph/logs/e2e-maestro.log`). **CLI:** Maestro 2.6.1, manual install at `~/.maestro-cli/`.
- **Selectors:** text-based (Maestro reads RN `text` + `accessibilityText`). RN `testID` / React-Navigation `tabBarButtonTestID` do **not** surface as a queryable Maestro `id` on Android in this stack, so **prefer stable visible text or `accessibilityLabel`** (which Maestro reads) over `testID` for E2E anchors. Anchor with regex (`^Patients$`) to disambiguate colliding substrings.
- **E2E entry / auth:** the `__DEV__` mock-boot (`authBoot.ts`) injects a Doctor session + fixture data (dead API host), so flows need no Google OAuth and no live backend — deterministic by construction.
- **Scope:** wires into the existing gate cadence — E2E runs **once per module, locally**, as a blocking Module-DoD gate (verdict recorded in `docs/graph/coherence/<module>.md`). Never in CI.

## Consequences
- `e2e-automator` + the `playwright-autogen` skill are re-pointed at Maestro (the Playwright internals from the template are superseded).
- **Surfaced app findings — both FIXED (2026-07-01):** (1) `AuthGate.boot` swallowed errors and could hang on the "Validating…" spinner indefinitely → now bounds platform init with a 15s timeout + catches errors into a retryable "Couldn't start the app" state (`AuthGate.tsx`). (2) A stale Metro bundle stranded the app on load → `scripts/e2e.sh --reset-cache` / `npm run e2e:reset` automates the fresh-Metro recovery. `.env.dev` `DEV_TOKEN` remains empty (GATE0-pending), so E2E still enters via the `__DEV__` mock until real auth is restored. See `.maestro/README.md`.
- Supersedes the "Detox or Maestro (not yet set up)" placeholder in `harness.config.md`.
