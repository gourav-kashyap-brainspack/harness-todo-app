# ClickUp Mirror — Mapping, Status Sync & Automation

> **Split out of `.claude/harness.config.md` to keep always-loaded context lean.** NOT `@`-imported — read on demand for `/clickup-sync` or any ClickUp mirror work. Operational specifics (exact status names, reconcile algorithm) also live in the **clickup-sync** skill; per-module List IDs + per-task Task IDs live in `docs/graph/modules.json`.
>
> **Setup:** fill the resolved IDs below after connecting the ClickUp MCP and running `/clickup-sync` once (see `QUICKSTART.md`). ClickUp is an **optional** PM mirror — the harness is the source of truth and a build never blocks on PM sync.

## Project Management — ClickUp (mirror)
- **MCP:** Official ClickUp MCP (hosted, OAuth).
- **Direction:** harness **mirrors the plan** — `/scope` + `/module` create the ClickUp items; `/build` updates their status. ClickUp reflects the harness (not the other way around).
- **Mapping:** Space = project · **List = module** · **Task = harness task** (`<module>-<NNN>`) · Subtask = sub-part.
  - Each ClickUp task carries: `feature_id`(s), complexity, parallel-group, a link to the spec; dependencies = blockedBy.
- **Status sync — key milestones:**
  | Harness moment | ClickUp status | Who sets it |
  |---|---|---|
  | task started (branch created) | `in progress` | agent (`/build`) |
  | gates green + PR opened | `in progress` + PR comment | agent (no native "review" status) |
  | **merged / done** | `complete` | **GitHub Action `clickup-sync.yml` on merge** (event-driven; built in the foundation module) |
  | escalated (5 failed loops) | comment "Blocked: …" (+ Blocked tag if it exists) | agent |
  - **Backstop:** the orchestrator runs `clickup-sync reconcile` at `/build` Boot to fix any drift if the Action didn't run.
- **Resolved IDs (fill after `/scope` creates the lists):** Workspace ID = `{{CLICKUP_WORKSPACE_ID}}` · Space ID = `{{CLICKUP_SPACE_ID}}` · (a `{{CLICKUP_LIST_ID}}` per module) · **status map = `started→in progress` · `review→in progress` · `done→complete`** (typical list statuses: `to do` | `in progress` | `complete` — no native review status). Per-module List IDs + per-task Task IDs live in `docs/graph/modules.json`.
- **Automation secret:** the merge→`complete` Action needs a `CLICKUP_TOKEN` repo secret (ClickUp personal token `pk_…`); set up at the foundation module.
