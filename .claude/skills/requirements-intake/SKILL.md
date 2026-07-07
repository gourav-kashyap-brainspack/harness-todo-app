---
name: requirements-intake
description: Ingest a PRD (.docx) and feature list (.xlsx/.csv) from docs/requirements/sources/, convert + normalize them, and produce the planning digest (REQUIREMENTS.md) + traceability matrix (TRACEABILITY.md). Use for /intake, before /scope.
---

# Requirements Intake

Turn a raw PRD + feature sheet into structured, traceable planning inputs.

## Inputs (in `docs/requirements/sources/`)
- **PRD:** `*.docx` (Word). **Feature list:** `*.csv` (preferred) or `*.xlsx`.

## Steps
1. **Convert the PRD** → `docs/requirements/prd.md`:
   - `pandoc -f docx -t gfm "docs/requirements/sources/<prd>.docx" -o docs/requirements/prd.md`
   - Fallback (no pandoc): `textutil -convert txt -stdout "<prd>.docx" > docs/requirements/prd.md`
2. **Normalize the feature list** → `docs/requirements/features.csv`:
   - **CSV input:** read directly.
   - **XLSX input:** read with **openpyxl** from the project venv at `.venv/bin/python` (system `python3` is PEP-668 externally-managed). If `.venv` is missing, create it: `python3 -m venv .venv && .venv/bin/python -m pip install -q openpyxl`. Then dump each sheet to CSV via `.venv/bin/python`. If venv creation is blocked, ask the human to re-export the sheet as **CSV**.
   - Map the source columns to this standard schema, assigning `feature_id` (`F-001`…) if absent:
     `feature_id, title, priority, area, description, acceptance, status`
   - `status` starts as `unmapped`. If a column's meaning is ambiguous, **ASK the human** which is which — never guess.
3. **Write `REQUIREMENTS.md`** (digest): product goal, personas, feature-inventory table, NFRs, out-of-scope, open questions — drawn from `prd.md` + `features.csv`.
4. **Seed `TRACEABILITY.md`**: one row per feature (module/task/spec blank until `/scope` + `/module`); update the Coverage counts.
5. **Report:** feature counts by priority, NFR highlights, and every Open Question — then ask the human to resolve gaps.

## Rules
- **Every feature in the sheet MUST appear** in `features.csv` AND `TRACEABILITY.md` — never silently drop one.
- `REQUIREMENTS.md` is the planning source of truth; resolve its Open Questions with the human before `/scope` is finalized.
- Stay faithful to the PRD — do not invent requirements. Record gaps as Open Questions instead.
- Requirements `.md`/`.csv` live in the repo, so they become Graphify-queryable (`graphify query "<feature>"`).
