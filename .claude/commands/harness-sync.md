---
description: Re-scan the repo — librarian refreshes context docs + task graph and rebuilds the Graphify knowledge graph. Use after manual changes.
argument-hint: (none)
---

Adopt the **librarian** playbook (`.claude/agents/librarian.md`).

1. Diff recent changes vs the last known state; summarize what changed (modules, endpoints, components, tables, patterns).
2. Surgically refresh `docs/context/*` (overview, architecture, conventions, stack, design-system) and add ADRs for notable choices.
3. Reconcile `docs/graph/` (modules.json, graph.mmd, STATUS.md) with reality.
4. Rebuild the Graphify codebase graph: run `/graphify ./` (incremental). Skim the refreshed `graphify-out/GRAPH_REPORT.md`; surface new god nodes / surprise edges.
5. **Review-feedback promotion (ADR 0029):** scan recent code-review findings for `[promote]`-tagged / recurring Tier-1 anti-patterns; convert each into the cheapest durable guard (ESLint rule / `grep` / test) with an agent-oriented fix-message + an inline `// promoted from <task>, ADR 0029` origin comment.
6. **Harness simplification (ADR 0028) — at a module edge:** advance `docs/context/harness-debt.md`; ablate the top `watch` candidate against the next module's gates; **remove if nothing degrades** (record an ADR), else restore/replace. One candidate per pass; bias toward always-loaded prose.
7. Report what changed — keep edits factual, never bloat.
