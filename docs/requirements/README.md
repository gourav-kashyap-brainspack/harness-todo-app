# Requirements Intake

Source of truth for **what** to build. The architect plans modules & tasks from here.

## How to use
1. Drop your raw inputs in `sources/`:
   - **PRD** → `sources/prd.docx` (Word)
   - **Feature list** → `sources/features.csv` (preferred) or `sources/features.xlsx`
     - From Google Sheets: **File → Download → CSV** is smoothest (one file per tab). Excel works too.
2. Run **`/intake`** — converts + normalizes the inputs and builds the planning digest:
   - PRD `.docx` → `prd.md` (via pandoc)
   - Feature sheet → `features.csv` (normalized columns)
   - Writes `REQUIREMENTS.md` (planning digest) + seeds `TRACEABILITY.md`
3. Run **`/scope`** → modules, then **`/module <name>`** → tasks/specs. Every feature is traced in `TRACEABILITY.md`.

## Files
- `sources/` — your raw PRD + feature sheet (tracked in git).
- `prd.md` — PRD converted to markdown.
- `features.csv` — normalized feature list (`feature_id, title, priority, area, description, acceptance, status`).
- `REQUIREMENTS.md` — the architect's digest; the planning source of truth.
- `TRACEABILITY.md` — feature → module → task → spec → status (coverage guarantee).

> These `.md`/`.csv` files live in the repo, so **Graphify indexes them** — query requirements with `graphify query "<feature>"`.
