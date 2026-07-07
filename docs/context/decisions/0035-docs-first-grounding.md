# ADR 0035 — Docs-first grounding: read the external API's current docs before wiring a security/version-sensitive surface

- **Status:** Accepted
- **Date:** 2026-06-26
- **Deciders:** human (project owner) + harness
- **Relates to:** the Dependency Version Policy (`harness.config.md`), the Context7 MCP server, "Ground in Graphify before touching code" (CLAUDE.md)
- **Source:** BuilderIO/skills `read-the-damn-docs` (adapted to this harness)

## Context

The harness already has two grounding disciplines, but there was a gap between them:

1. **Version grounding** — the Dependency Version Policy says "resolve the current stable version from the registry, never from memory" (`pnpm view <pkg> version`). That answers *which version to install*.
2. **Internal grounding** — "Ground in Graphify before touching code" answers *how does our own codebase fit together*.

Neither covers the third question: **how does the external API actually behave in the version we're on?** Builders were free to wire an external/security-sensitive surface — SMTP/OAuth token flows, JWT verification, webhook signature checks, Prisma/Nest breaking changes, GitHub Actions `workflow_run`/OIDC — from model memory, which trends stale exactly where it's most expensive to be wrong (auth, billing, data, migrations, public contracts). We have **Context7 enabled** (current library docs) but **no rule that mandated using it** before coding these surfaces.

## Decision

Adopt **docs-first grounding** as a builder convention (`docs/context/conventions.md`), with the canonical procedure in `.claude/skills/read-the-damn-docs/SKILL.md`.

- **The discipline:** before implementing against an external or hard-to-reverse surface, read the **current official docs for the installed major** (via **Context7** first, web search second) — don't code it from memory.
- **Triggers (read docs first when any hold):** adding/upgrading/configuring a package, SDK, framework, CLI, or provider integration; anything touching **auth/OAuth scopes, secrets, webhooks, JWT, billing, PII, migrations, retries, rate limits, caching, deploys**; an error mentioning deprecation / unknown option / changed default / version mismatch; a choice that's **expensive to reverse** (wire formats, DB schema, persistent IDs, event names, customer-visible behavior); or catching yourself about to write "probably / from memory" for an external API.
- **Mechanism:** **Context7** (`resolve-library-id` → `query-docs`) is the primary source for library/SDK behavior; web search for the official docs when Context7 lacks the surface; local repo docs/ADRs/types/tests first for *internal* contracts.
- **Proportionate:** trivial edits, language syntax, formatting, and self-contained code with no external contract proceed normally — this is not "browse the web for every line."
- **Traceability:** when consulted docs affect the implementation or recommendation, name the source in the PR/finding (same spirit as the reviewer `what · why · how-to-fix` triple).
- **Reviewer note:** the `security-reviewer` and `code-reviewer` may flag a security/version-sensitive surface implemented against stale/assumed API behavior as a finding (with the correct current behavior as `how-to-fix`).

## Consequences

- **Positive:** closes the "stale external-API memory" gap precisely where it costs the most (auth/data/migrations/public contracts), reusing the Context7 server we already pay for. Complements — does not duplicate — the version policy (which version) and Graphify grounding (our own code).
- **Nature:** a **process convention** consumed by builders + the architect via `conventions.md` (already in the Context Manifest), added **once** there rather than restated per-agent (per the Context-Manifest anti-drift rule). Defense-in-depth, not a mechanical gate.
- **Cost:** a Context7/doc read on the relevant surfaces — cheap against the cost of shipping a wrong auth/webhook/migration contract.
