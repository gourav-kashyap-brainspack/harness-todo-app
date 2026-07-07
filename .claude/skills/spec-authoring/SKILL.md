---
name: spec-authoring
description: Turn a requirement into a complete, gate-aligned spec using docs/specs/_TEMPLATE.spec.md. Use when the architect writes or refines a task spec. Enforces that no spec is "ready" until every Open Question is resolved with the human.
---

# Spec Authoring

Procedure to convert a requirement into a `ready` spec.

## Steps
1. Copy `docs/specs/_TEMPLATE.spec.md` → the task's spec path, and set that same path as the task's `spec` field in `modules.json` (the index consumers resolve through).
   - **Default (flat):** `docs/specs/<module>/<task-id>.spec.md`.
   - **Large module / split monolith → sub-group dir:** when a module has many tasks or a single task splits into a cluster (e.g. Admin → Users/Departments/Patients/…), group them: `docs/specs/<module>/<subgroup>/<task-id>.spec.md`, and add a **`_overview.spec.md`** in that dir — the sub-group's **shared contract**: common API/types, cross-cutting decisions, and the **open-questions that gate every child** (a child spec can't be `ready` while an `_overview` open-question it depends on is unresolved). `_`-prefixed specs are never tasks; don't register them in `modules.json` (record the group's own `source-features` on the `_overview` for traceability).
2. Ground first: `graphify query "<concept>"` + read the relevant `docs/context/*`.
3. Fill EVERY section: Goal · Context links · Functional reqs · NFRs · API/contract · Data model impact · UI/design notes · Platform divergence · Offline · Accessibility · Deep links & permissions · Performance budget · Test plan (unit + Maestro E2E flows) · Dependencies & blockedBy · Parallelizable? (Y/N + group) · Dynamic-workflow? (what to research) · Acceptance criteria (= gates) · Open questions · Changelog.
4. Make acceptance criteria literally the gates from `.claude/harness.config.md`, plus task-specifics.
5. List unknowns under **Open questions** and ask the human. The spec stays `status: draft` until ALL are resolved; then set `status: ready`.

## Quality bar
- Every functional requirement is testable and mapped to ≥1 unit or E2E test in the Test plan.
- The API/contract is exact (paths, DTO schemas, status codes, errors).
- No hand-wavy requirements; no unresolved Open Questions in a `ready` spec.
- Update the Changelog on every edit.
