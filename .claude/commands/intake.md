---
description: Ingest a PRD (.docx) + feature list (.xlsx/.csv) from docs/requirements/sources/ into the planning digest + traceability matrix. Run before /scope.
argument-hint: (optional: paths to PRD / feature files)
---

Adopt the **architect** playbook (`.claude/agents/architect.md`) and run the **requirements-intake** skill.

Sources: $ARGUMENTS
(If no paths are given, use whatever is in `docs/requirements/sources/`.)

Procedure:
1. Convert the PRD `.docx` → `docs/requirements/prd.md` (pandoc; textutil fallback).
2. Normalize the feature list → `docs/requirements/features.csv` (CSV direct; xlsx via openpyxl, else ask me to export CSV).
3. Write `docs/requirements/REQUIREMENTS.md` (planning digest) and seed `docs/requirements/TRACEABILITY.md`.
4. Report the feature inventory (counts by priority), NFRs, and ALL Open Questions — and ask me to resolve gaps.

Then I run `/scope` (modules) → `/module <name>` (tasks). Every feature stays traced in `TRACEABILITY.md` — flag any feature that isn't mapped.
