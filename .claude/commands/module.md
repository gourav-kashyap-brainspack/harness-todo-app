---
description: Plan one module — the architect deep-questions you, writes a spec per task, and updates the task graph with sequencing + parallel groups.
argument-hint: <module-name>
---

Adopt the **architect** playbook (`.claude/agents/architect.md`) and run it here so you can interrogate me.

Module: $ARGUMENTS

Procedure:
1. Boot + Graphify ground. Read `docs/requirements/REQUIREMENTS.md` + `features.csv` for the features assigned to THIS module (per `TRACEABILITY.md`).
2. Deep-question me about THIS module: requirements, edge cases, data, auth, NFRs, priorities. WAIT for answers; record unknowns as Open Questions.
3. Prioritize the module's tasks so every assigned feature is covered. For EACH task, use the **spec-authoring** skill to write `docs/specs/$ARGUMENTS/<task-id>.spec.md` from the template — fully filled, `source-features` set, acceptance criteria = the gates.
4. Update the graph via **task-graph**: each task's `featureIds`, dependencies (blockedBy), sequential vs parallel group, complexity (S/M/L), and dynamic-workflow (Y/N + what to research).
5. Update `docs/requirements/TRACEABILITY.md` (feature → task → spec) and flag any feature in this module not yet covered by a task.
6. **Mirror to ClickUp:** run the **clickup-sync** skill (createTasks) — a Task per harness task in this module's List, with feature_id + complexity + blockedBy deps + spec link; save each `clickupTaskId`/`clickup-url` back to `modules.json`, the spec, and TRACEABILITY. Skip gracefully if the MCP isn't connected.
7. Summarize: the task list, the critical path, the first runnable/parallel set, which tasks need a research spike, the feature-coverage count, and the ClickUp tasks created.

A spec is not `ready` until its Open Questions are resolved with me.
