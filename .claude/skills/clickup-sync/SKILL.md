---
name: clickup-sync
description: Mirror the harness task graph into ClickUp and keep status in sync via the ClickUp MCP. Use at /scope (create a list per module), /module (create a task per harness task), /build (status at key milestones), and on task done. Harness mirrors the plan; ClickUp reflects the harness.
---

# ClickUp Sync

Keep ClickUp as the human-facing mirror of the task graph. Uses the **ClickUp MCP** tools
(load them via ToolSearch: `clickup`). All writes flow **harness → ClickUp**.

## Resolved config (this workspace — filled on first run)
- **Workspace** `{{CLICKUP_WORKSPACE_ID}}` · **Space** `{{CLICKUP_SPACE_ID}}` (fill on first `/clickup-sync` run; mirror into `harness.config.md` + `clickup-mirror.md`) · per-module **List IDs** (`{{CLICKUP_LIST_ID}}`) + per-task **Task IDs** live in `docs/graph/modules.json`.
- **Real list statuses:** `to do` | `in progress` | `complete` — **there is NO "review" status.** Resolved status map: `started → in progress` · `PR open → in progress (+PR comment)` · `done → complete`. (Stored in `modules.json` `clickup.statusMap`.) Use these EXACT lowercase names — `clickup_update_task` rejects unknown statuses.

## Mid-build automation (event-driven — the primary path for `complete`)
- **`complete` is set by a GitHub Action on merge, NOT by an agent.** Because the human merges on GitHub (outside the agent loop), the harness ships `.github/workflows/clickup-sync.yml` (built in **FND-005**): on a PR merged into `development`, it parses the task-id from the head branch (`feat/<MODULE>-<NNN>`), resolves `clickupTaskId` from `modules.json`, and PUTs the ClickUp task → `complete` via the `CLICKUP_TOKEN` repo secret. This fires whoever merges, whether or not Claude is running.
- The **agent-driven `setStatus`** below covers the transitions that happen WHILE the agent runs (branch created → in progress). The `reconcile` op is the backstop if the Action is missing/fails.

## Mapping
- **List = module**, **Task = harness task** `<module>-<NNN>`, Subtask = sub-part.
- Task fields: name = `<task-id>: <title>` · description = goal + spec path + feature_id(s) ·
  tags/custom-fields = feature_id + complexity + parallel-group · dependencies = blockedBy → ClickUp "blocked by".

## Operations
- **createLists** (`/scope`): for each module without a `clickupListId`, create a List in the Space; save `clickupListId` into `modules.json`.
- **createTasks** (`/module`): for each task without a `clickupTaskId`, create a Task in its module's List (status = To Do), set fields + dependencies, then save `clickupTaskId` + URL into `modules.json`, the spec frontmatter (`clickup-url`), and `docs/requirements/TRACEABILITY.md`.
- **setStatus** (`/build`, agent-run milestones only):
  - on start → **in progress** + comment "branch `feat/<module>-<task-id>` created".
  - gates green + PR open → keep **in progress** + comment with the PR URL + a gate-results summary _(no native review status)_.
  - **merged / done → handled by the `clickup-sync.yml` Action, not here.** Only set `complete` manually as a catch-up (via `reconcile`) if the Action didn't run.
  - escalated (5 failed loops) → comment "Blocked: <reason>" (set a Blocked status/tag if one exists).
- **reconcile** (orchestrator Boot + `/clickup-sync`): the **drift backstop**. `git fetch origin development`; for each task whose `feat/<…>` branch is merged into `development` but still shows non-`done` in `modules.json`, mark it `done` (+ unblock dependents) and set its ClickUp task → **complete**. Then push any missing Lists/Tasks and align remaining statuses to `STATUS.md`. Idempotent; safe to run every build.

## Rules
- **Idempotent:** never create a duplicate — always check for an existing `clickupListId`/`clickupTaskId` first.
- The **harness is the source of truth** for the plan; if a ClickUp edit conflicts with a spec, flag the drift to the human — don't silently change specs.
- **Never block a build on PM sync:** if the ClickUp MCP is unavailable, log a warning and continue the loop.
