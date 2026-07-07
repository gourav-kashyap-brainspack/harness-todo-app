# ADR 0036 — Slim the harness to RN-frontend scope (remove DevOps, backend/DB, design-patterns, web visual/a11y)

- **Status:** accepted
- **Date:** 2026-07-01
- **Context:** The harness began as a web/NestJS-flavored template and was retargeted to the `mobile/` React Native app. The core loop (gate-runner, authz hook, MCP servers, DoD, conventions) was correctly RN-aligned, but a large amount of machinery for capabilities this project does not have remained — consuming context budget every session and misleading agents.

## Decision
This is a **frontend-only React Native client** that consumes a remote backend API. There is no backend, no database, and (by human decision) no DevOps/signing/store-delivery capability in the harness at this time. Remove everything those capabilities dragged in, per the "simplify, don't only accumulate" maintenance principle (ADR 0028).

### Removed
- **Agents:** `backend`, `db-designer` (no server/DB), `devops`, `infra-reviewer` (no DevOps).
- **Skills:** `cicd-pipeline`, `cloud-architecture`, `cost-estimate`, `devops-detect`, `devops-gates`, `devops-templates`, `dockerize`, `infra-review`, `release-rollback` (all DevOps/AWS/IaC); `design-patterns` (GoF/NestJS/DI, backend-oriented — not a default for a functional RN frontend); `dependency-maintenance` (base-image/IaC-framed; its npm-currency overlap is already covered by the Dependency Version Policy + the security gate).
- **Commands:** `/devops`, `/devops-review`.
- **Context docs:** `docs/context/devops-policy.md`, `docs/context/devops.md`.
- **Design Profile:** the `a11yGate` (axe-core is DOM-only, does not run in RN) and web-only `perfBudgets +lighthouse`; visual regression re-scoped from web pixel baselines (`apps/web/e2e/**-snapshots/`) to on-device screenshots (Detox/Maestro), and defaulted **off** until the RN E2E harness exists.
- **Authz policy:** dropped the `devops` rule + `infra-reviewer` + the vestigial `apps/**`/`packages/**` globs (the real guarded path is `mobile/src/**`).

### Kept
The RN-frontend loop: orchestrator · architect · frontend · design · design-reviewer · unit-tester · e2e-automator · security-reviewer · code-reviewer · mr-reviewer · librarian; gates (typecheck · lint · unit+coverage · native build · security · code-review); the design capability (tokens/design-system); ClickUp mirror; Graphify; requirements/traceability.

### Deferred (not removed — flagged for when the capability is first needed)
- **E2E stack** is still Playwright-based (`e2e-automator`, `playwright-autogen`). E2E first fires at the first UI module edge; convert to **Detox/Maestro** then. The DoD/config wording was updated to Detox/Maestro; the skill internals were left for that conversion.

## Consequences
- Lighter always-loaded context (`CLAUDE.md` + `harness.config.md`), fewer agents/skills in the surface.
- If a backend module is ever scoped, re-add `backend`/`db-designer` (and DevOps if deployment is ever owned here) at that time.
- Supersedes the DevOps portions of earlier ADRs (0012's E2E-in-CI rationale still holds; the DevOps-specific parts of 0033 no longer apply).
