# ADR 0036 — Guided setup preflight + template-distribution fix (make onboarding mechanism, not prose)

- **Status:** Proposed
- **Date:** 2026-06-26
- **Deciders:** human (project owner) + harness
- **Relates to:** `QUICKSTART.md` (the manual setup checklist), `.claude/hooks/main-guard.mjs` (ADR-0021), the Context Manifest (ADR-0019), the simplification/debt loop (ADR-0028), `docs/context/clickup-mirror.md`, `docs/context/harness-debt.md`
- **Source:** real onboarding failures observed during the first live setup of a project (todo-app) from this template (2026-06-26).

## Context

The harness is excellent at the **build loop** — gates, hooks, and the Context Manifest enforce correctness by *mechanism* rather than relying on the model to remember prose. But **onboarding is the opposite**: it is a passive checklist in `QUICKSTART.md` plus a pile of `<PLACEHOLDER>`s the operator hand-fills. Nothing verifies the environment before the first build step runs. The first real clone-and-configure of this template surfaced two distinct, repeatable failure modes — neither hypothetical, both hit in one session:

1. **GitHub remote was never re-pointed.** A plain `git clone` leaves `origin` pointing at the (read-only) template repo. QUICKSTART step 1 (`rm -rf .git && git init`) is easy to skip, and **nothing checks the remote**. Result: project commits were pushed to `harness-template` itself, and a `development` branch had to be force-deleted from the template. The product also needs its *own* repo — that was never guided (no "create the project repo, re-point origin, push development" step that actually runs).

2. **ClickUp connection was assumed, not verified.** ClickUp is documented as "optional but recommended" and left as a manual ID-paste. There is no preflight that (a) checks the MCP is actually connected, or (b) resolves *which workspace the OAuth grant points at* and confirms it is the intended one. Result: lists were created in the wrong (a shared reference) workspace via a grant the operator did not realize was active, then deleted and recreated after re-auth. "Optional" had been conflated with "silent/unverified."

Both are **setup-time** failures the build loop can't catch, because they happen before `/scope`. The irony: a harness whose whole philosophy is "make the mistake impossible, don't just document against it" left its own first-mile as pure prose.

A related distribution gap underlies #1: the template is consumed via `git clone`, which is the *wrong* primitive for a template. GitHub's **template-repository** feature (`gh repo create --template` / "Use this template") creates a fresh repo under the user's account with **no shared history and `origin` already correct** — eliminating the entire re-pointing error class. The template is not currently marked as a template repo, so the documented path is the error-prone one.

## Decision

Treat onboarding the way the harness treats everything else load-bearing: **a verified, interactive preflight gated by mechanism**, plus a distribution change that makes the remote correct by construction.

### 1. A first-run `/setup` (init-project) command + skill
An interactive preflight, run once per new project, that:
- **Detects an unconfigured clone** — `<PROJECT_NAME>`/placeholder presence, and `origin` resolving to any `*/harness-template`.
- **Walks the config interactively** (`AskUserQuestion`) — Name, Purpose, Tech Stack confirm, `AUTONOMY_MODE`, Design Profile — writing `harness.config.md` instead of leaving placeholders.
- **GitHub preflight:** verify `gh auth status`; **detect `origin` still pointing at the template and STOP**; offer to create the project repo, re-point `origin`, create + push `development`; never push `main` (defer to first release).
- **ClickUp preflight (skippable in one keystroke):** check the MCP is connected; **resolve the actually-authorized workspace and echo it back for confirmation** ("I can see Workspace X / Space Y — is that the one you want?") *before* creating anything; then `createLists`.
- **Writes a `setup-complete` marker** (e.g. `docs/graph/.setup-complete` or a `setupStatus` field) recording what was configured/skipped.

### 2. An origin-guard (mechanism, not prose)
A `PreToolUse` guard (sibling to `main-guard`, or a `/setup`+orchestrator boot check) that **blocks any push/PR whose resolved remote is `*/harness-template`** unless explicitly overridden. This makes "push the product to the engine repo" *impossible*, exactly as `main-guard` makes touching `main` impossible. Fails closed for project work; the template's own maintenance uses a deliberate, auditable override (mirrors `HARNESS_ALLOW_MAIN=1`).

### 3. Ship the template AS a template + rewrite QUICKSTART step 1
- **Mark `harness-template` as a GitHub Template Repository** (Settings → "Template repository").
- **Rewrite QUICKSTART step 1** to lead with the correct primitive:
  - Default: `gh repo create <project> --private --template {{GIT_OWNER}}/harness-template --clone` (or "Use this template") → fresh repo, `origin` correct from second one, no severing needed.
  - Variant for update-pullers: clone, set `origin` = your repo and `upstream` = the template (read-only), so future engine improvements can be pulled (`git fetch upstream && merge/cherry-pick`).
  - Retain `rm -rf .git && git init` only as the manual fallback, clearly marked as such.

### Gate
`/scope` (and `/build`) **refuse to run until the `setup-complete` marker exists** — onboarding becomes a real gate, not a doc the operator may or may not have read.

## Consequences

- **Positive:** the two observed failure modes move from "discovered after damage" to "impossible / caught before the first write." Consistent with the harness's mechanism-over-prose philosophy (hooks for `main`, the Context Manifest for reads — now a preflight + origin-guard for setup). The template-repo change removes an entire error class for *every* future clone, not just this project.
- **"Optional" stays optional, just not silent:** ClickUp/PM remains skippable in one keystroke; the difference is it is *offered and verified* rather than assumed.
- **Cost / additive bias (ADR-0028):** this *adds* a command, a skill, and a guard — net new machinery. Justified because it is setup-time only (no per-task window cost) and prevents outright-wrong outcomes. The `setup-complete` marker + origin-guard should themselves be entered on the **harness-debt watchlist** so a future simplification pass can re-justify or lighten them once the template-repo distribution alone proves sufficient.
- **Scope of this ADR:** it **records the decision and the design**; the implementation (the `/setup` command, the origin-guard hook, the QUICKSTART rewrite, and toggling the GitHub template flag) is follow-up work tracked on the debt watchlist. Marked **Proposed** until that lands.
