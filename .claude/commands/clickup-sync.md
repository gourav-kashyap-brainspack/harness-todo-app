---
description: Mirror the task graph into ClickUp and reconcile statuses (a list per module, a task per harness task). Uses the official ClickUp MCP.
argument-hint: (none)
---

Run the **clickup-sync** skill to reconcile ClickUp with the harness:
1. Ensure the **Space** + per-module **Lists** exist (create missing); save IDs to `docs/graph/modules.json`.
2. Ensure a ClickUp **Task** exists for every task in `docs/graph/modules.json` (create missing, save `clickupTaskId` + `clickup-url`).
3. Refresh each task's **status** to match `docs/graph/STATUS.md` (key milestones: In Progress / In Review / Complete).
4. Report: lists/tasks created, statuses updated, and any **drift** between ClickUp and the harness.

Harness mirrors the plan — ClickUp reflects the harness. Idempotent; never duplicates.
