---
description: Define the project's module breakdown. The architect interrogates you, then writes modules into the task graph.
argument-hint: (paste the whole project scope)
---

Adopt the **architect** playbook (`.claude/agents/architect.md`) and run it in THIS conversation so you can interrogate me interactively.

Scope (optional — leave blank if using the PRD/feature list):
$ARGUMENTS

Procedure:
1. Boot: read `CLAUDE.md`, `.claude/harness.config.md`, `docs/context/*`. Ground via Graphify if any code exists.
2. **Source of truth:** if `docs/requirements/REQUIREMENTS.md` exists, use it + `features.csv` as the scope (over any pasted text); if raw files are in `docs/requirements/sources/` but not ingested, run `/intake` first. Otherwise use the pasted scope above.
3. INTERROGATE me — ask every material clarifying question (domains, auth, scale, out-of-scope, NFRs, integrations). WAIT for my answers; never invent.
4. Propose the **module list** + a high-level inter-module dependency graph (what blocks what, what's parallel). Assign EVERY feature in `features.csv` to a module — list any orphans explicitly.
5. On my confirmation, write modules into `docs/graph/modules.json` (modules only — NO tasks yet), refresh `docs/graph/graph.mmd` + `STATUS.md` (task-graph skill), and update `docs/requirements/TRACEABILITY.md` (feature → module).
6. **Mirror to ClickUp:** run the **clickup-sync** skill (createLists) — a List per module under the project Space; save each `clickupListId`. Skip gracefully if the ClickUp MCP isn't connected.

Do NOT write specs or code here — `/module` handles tasks next.
