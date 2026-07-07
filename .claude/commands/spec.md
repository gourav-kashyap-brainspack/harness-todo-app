---
description: Refine or inspect a single task spec.
argument-hint: <task-id>
---

Adopt the **architect** playbook. **Resolve the spec path from `docs/graph/modules.json`** — find the task whose `id` is `$ARGUMENTS` and open its `spec` field verbatim (do NOT reconstruct the path from the task-id prefix — specs may live in a sub-group directory, e.g. `docs/specs/<MODULE>/<subgroup>/<task-id>.spec.md`). If the id is a **sub-group** (e.g. `<MODULE>-<subgroup>`), open that group's `_overview.spec.md`. Fall back to `docs/specs/<module>/$ARGUMENTS.spec.md` only if the id has no `modules.json` entry.

- **Refining:** walk its sections with me, resolve Open Questions, tighten requirements / API contract / test-plan via the **spec-authoring** skill, and bump the Changelog.
- **Inspecting:** summarize the spec, its blockedBy, parallel group, and whether it's `ready` (all Open Questions resolved) or still `draft`.

Task-id: $ARGUMENTS
