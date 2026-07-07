# ADR 0001 — Adopt the self-improving engineering harness

- **Status:** accepted
- **Date:** 2026-06-19

## Context
Greenfield Todo App. We want every task built by specialized AI agents behind strict,
automatic quality gates, with context that compounds over time instead of decaying.

## Decision
Adopt the `.claude/` harness: an orchestrator-driven SDLC loop, 12 specialized agents,
a strict Definition of Done, the Graphify codebase knowledge graph, and a `librarian`
agent that updates context docs + specs after every completed task.

## Consequences
- Every task = one branch = one PR, gated and AI-reviewed before merge.
- Higher per-task setup cost, but compounding context and consistent quality.
- Single source of truth lives in `.claude/harness.config.md`.

## ADR format (for future entries)
`NNNN-short-title.md` with sections: Status · Date · Context · Decision · Consequences.
