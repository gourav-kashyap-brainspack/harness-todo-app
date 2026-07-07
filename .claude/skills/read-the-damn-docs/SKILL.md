---
name: read-the-damn-docs
description: Docs-first grounding — before implementing against an external or hard-to-reverse surface (third-party SDK/API/CLI, auth/OAuth/JWT, webhooks, secrets, billing, migrations, deploy/CI config), read the CURRENT official docs for the installed major via Context7 (then web search), instead of coding from stale model memory. Use when a builder/architect adds/upgrades/configures a dependency or touches a security/version-sensitive surface. Complements the Dependency Version Policy (which version) and Graphify grounding (our own code). ADR-0035.
---

# Read The Damn Docs

Don't wire an external or hard-to-reverse surface from memory. Model memory trends stale exactly
where it is most expensive to be wrong — auth, secrets, billing, data, migrations, public contracts.
The harness already grounds **version** (Dependency Version Policy → `npm view <pkg> version`) and
**our own code** (Graphify). This skill grounds the third question: **how does the external API
actually behave in the version we're on?** — using the **Context7** MCP server we already have enabled.

> Proportionate by design. This is not "browse the web for every line." Trivial edits, language
> syntax, formatting, and self-contained code with no external contract proceed normally. The trigger
> is an **external or expensive-to-reverse** surface.

## Docs-first triggers (read docs before coding when ANY hold)

- Adding / upgrading / configuring / importing a **package, SDK, framework, CLI, plugin, model, or
  provider integration**.
- The surface touches **auth / OAuth scopes / JWT / secrets / webhooks / billing / PII / migrations /
  retries / rate limits / quotas / caching / deploys / CI permissions** (in this project: OAuth /
  Google Sign-In, JWT refresh, Keychain/MMKV secure storage, native permissions (camera/mic/files),
  deep links, push, the backend API contract, app-signing/CI).
- An error mentions **deprecation, unknown option, missing export, invalid config, changed default,
  or version mismatch** (likely API drift).
- The choice is **expensive to reverse**: wire formats, DB schema, persistent IDs, event names,
  customer-visible behavior, external automation contracts.
- The user asks for "latest / current / official / supported / recommended" behavior.
- You catch yourself about to write "usually / probably / I think / from memory" for an external API.

## What counts as docs (most authoritative first)

- **Internal contracts** → local repo docs, ADRs, generated types, OpenAPI/schemas, package READMEs,
  and nearby tests **first**. (For our own code, Graphify + these beat any external source.)
- **Third-party behavior** → **Context7** (`resolve-library-id` → `query-docs`) for the installed
  major; official product docs / API reference / migration guide / changelog via **web search** when
  Context7 lacks the surface; SDK source/types as evidence when docs are incomplete.
- **Versions** → the registry (`npm view <pkg> version`) per the Dependency Version Policy — never
  pin or assume from memory.
- Avoid Stack Overflow / old blog posts / memory as the *primary* source when official docs exist;
  use community sources only to debug symptoms after the authoritative contract is known.

## Workflow

1. **Identify the exact surface** — package name + installed major, provider endpoint, CLI command,
   config file, schema, or product feature.
2. **Read the closest docs** — local first for internal code; **Context7** for the installed major of
   a third-party lib (web search for the official page if Context7 is thin).
3. **Extract only what the task needs** — option names, imports, lifecycle rules, default behavior,
   breaking changes, limits, permissions, an example for the current major.
4. **Implement** using those facts. If the docs conflict with existing code, inspect the local path
   and call out the discrepancy rather than silently following one.
5. **Verify** with the smallest useful check (typecheck / unit / build / CLI dry-run / schema validate).
6. **Name the source** in the PR/finding when consulted docs affect the implementation or recommendation.

## If docs are unavailable

If Context7, network, or local files can't be reached, **say so plainly before relying on memory** —
narrow the uncertainty, inspect source/types if available, and don't present the result as
confirmed-current.

## Relationship to the gates

The `security-reviewer` / `code-reviewer` may flag a security- or version-sensitive surface
implemented against **stale or assumed** API behavior as a finding, with the correct current behavior
as the `how-to-fix`. Grounding here up front is cheaper than the round-trip.
