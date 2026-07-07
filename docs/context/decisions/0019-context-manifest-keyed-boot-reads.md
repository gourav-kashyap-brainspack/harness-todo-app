# ADR 0019 — Context Manifest: one keyed Boot-reads table, with absent-source semantics

**Date:** 2026-06-22 · **Status:** accepted · **Context task:** harness foundation tuning (before the LIST/DUE/PROF module wave)

## Context
Every agent began with a hand-listed `## Boot (always, first)` section enumerating the docs it should read (`CLAUDE.md`, `harness.config.md`, `docs/context/*`, the spec, …). Fourteen near-identical-but-subtly-different lists. Two concrete problems:

1. **Drift (the dangerous one).** Add a new shared doc (e.g. a future `docs/context/security-baseline.md`) and you must edit *every* agent's Boot list to route it. Miss one — say `frontend` — and that agent is **silently blind** to the doc. Nothing errors; it just quietly does the wrong thing. The lists had already diverged accidentally: some enumerated specific docs, some globbed `docs/context/*`, `frontend` special-cased `INCLUDING design-system.md`.
2. **No shared semantics for a missing source.** An agent that queries `graphify-out/`, finds it empty, and concludes "this project has no code" makes a *category error*: the harness builds the graph **lazily** (after the first module's code lands; rebuilt per task by the librarian). "Couldn't load it" was being conflated with "it doesn't exist."

**Explicitly NOT a goal:** cross-agent load dedup. Each subagent runs in its own context window and genuinely must read the bytes it needs; a config-layer table cannot (and is not meant to) prevent that. The "double-loading" framing was dropped — the real wins are drift-elimination + correct missing-source semantics.

## Decision
1. **One canonical `## Context Manifest` table in `harness.config.md`** — the single source of truth for Boot reads. Columns: `key` · `source` · **consumed-by** (which agents/role-groups read it) · `when` · **`if absent`**. Add a shared doc → add **one row** → every agent tagged for it picks it up. Role-group aliases (`all`, `builders`, `reviewers`, `devops-roles`, `graph-grounders`) are expanded once above the table.
2. **`if absent` is a three-value vocabulary**, defined once:
   - **hard error** — required; STOP and surface what's missing.
   - **pending** — legitimately not-built-yet (greenfield/early); **proceed, and never infer the represented thing is absent.** Preserve last-known truth; absence = *not-ready*, not *gone*.
   - **optional** — fine if missing; carry on.
   The load-bearing callout: **`codebase-graph` pending ≠ "no code exists"** — verify against the real tree before ever concluding greenfield.
3. **Agents reference the manifest, never restate doc-lists.** Each `## Boot` now says "Load context per the Context Manifest (rows tagged for my role)" and keeps only its **role-specific operational steps** (graphify grounding, Context7 version checks, diff retrieval, run-mode resolution, PR identification, requirements `/intake` trigger) — those are mechanics, not doc-drift.
4. **The librarian closes the loop.** When it introduces a new shared context doc, it must add the doc's row to the Context Manifest (so a new doc is never un-routed).

Concretely:
- `harness.config.md` — new `## Context Manifest` section (table + group aliases + `if absent` vocabulary + the codebase-graph callout).
- All 14 `.claude/agents/*.md` — Boot doc-lists collapsed to a manifest reference; role-specific operational steps preserved.
- `CLAUDE.md` — new "Boot from the Context Manifest, never a hand-listed file set" rule under *How we work*.
- `librarian.md` — owns adding rows for new shared docs.

## Consequences
- **No more silent blindness:** routing a shared doc is a one-row edit; you cannot forget an agent because there is no per-agent list to forget.
- **A lazy/missing graph never reads as "no code":** the `pending` semantics make the greenfield-vs-not-ready distinction explicit for every agent, formalizing what only the greenfield policy implicitly knew.
- **Numeric/path facts stay single-sourced:** the read-list lives only in the manifest — consistent with how `output-bounding` (ADR 0016) and compaction-resilience (ADR 0017) keep parameters in `harness.config.md`.
- **No quality or behavior change:** agents read the same documents they read before (verified row-by-row against the prior Boot lists); only the *where the list lives* changed. Role-specific operational steps are untouched.
- **Reversible:** re-inline per-agent doc-lists if a future maintainer prefers locality over a single source — but they'd re-inherit the drift risk this ADR removes.
