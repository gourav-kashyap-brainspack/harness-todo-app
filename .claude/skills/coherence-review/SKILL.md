---
name: coherence-review
description: The module-boundary coherence review — a system-level "Definition of Done" that fires when a MODULE completes (all its task gates green), catching emergent cross-module drift that per-task unit/E2E gates structurally cannot see (API shape drift, inconsistent authz, data-model conflicts, broken cross-module assumptions, inherited spec gaps). Static checklist + the module's own dynamic checks; READ-ONLY reviewers emit findings → builders fix → re-run until PASS. Distinct from gate-runner (per-task) — this is per-module.
---

# Coherence Review (module boundary)

Per-task gates prove **each part works**. This proves **the parts still form one coherent system**.
It runs ONCE per module, when the module's last task has passed all per-task gates — BEFORE the
module is declared done. It is the system-level analogue of `gate-runner`.

> **Why it exists (not redundant with tests):** unit/E2E tests are vertical + local — each verifies one
> unit/flow against its own spec. They cannot see horizontal/global drift: three list endpoints with three
> pagination shapes, one module that forgot the ownership check, a schema that grew two notions of "status",
> or a cross-module assumption that no E2E happened to script. All of those keep every test green.

## When it runs
- **Trigger:** the orchestrator detects (via `docs/graph/modules.json`) that every task in a module is `done`.
- **Manual:** `/coherence <module>` to re-run on demand.
- Runs locally during `/build`; it is a **blocking Module-DoD gate** (see `harness.config.md` → "Module Definition of Done").

> **Sibling gate at the same boundary (ADR 0018):** this review is the module's **structural** lens (reads cross-module drift). At the same module edge the orchestrator also runs the **local E2E gate** (`e2e-automator`) — the **behavioral** lens that actually executes the assembled user flows in a real browser. E2E is **local-only, never CI**, runs once per module (concurrently with this review), and its verdict + run-log path is recorded as an **E2E section in this same `docs/graph/coherence/<module>.md` report**. A module is DONE only when **both** are green (∧ human integration go). This skill owns only the structural checks below; the E2E gate is run/owned by the orchestrator's Module-DoD loop.

## Reviewers (READ-ONLY — emit findings, never edit; run CONCURRENTLY)
- **architect** — checks #1, #3, #4, #5 + the module's dynamic checks (system/design lens).
- **security-reviewer** — owns #2 (cross-module authz consistency), in module-boundary mode.

The two reviewers examine the same module diff on independent lenses, so the orchestrator dispatches them **in parallel (a single message, two Agent calls)** and consolidates both verdicts. Findings route through the orchestrator to builders as normal fix tasks; re-run until PASS.

## The checklist
Diff the WHOLE module against the rest of the system (`git diff development...HEAD` for the module's merged
work, or the module's task branches), grounded in Graphify + the Canonical patterns registry in `docs/context/patterns-registry.md`.

**Static core (every module):**
1. **Shape drift** — do the module's new endpoints match the registry's response / pagination / error envelope, or did they invent a new shape? (architect)
2. **Authz consistency** — does EVERY new resource enforce ownership/tenant isolation the same way as existing ones? Any endpoint missing the check → IDOR. (security-reviewer)
3. **Data-model coherence** — did the schema add redundant or conflicting concepts (duplicate "status", parallel ownership columns, denormalized copies)? Are FKs/constraints consistent with siblings? (architect)
4. **Integration assumptions** — do this module's assumptions about other modules (and theirs about this one) actually hold? Probe the cross-module cases E2E didn't script. (architect)
5. **Spec-gap inheritance** — did building this module reveal a gap/ambiguity the NEXT module would inherit? Record it so the architect fixes the downstream spec. (architect)

**Dynamic (this module's own risks):**
6. Run each entry in the module's `coherenceChecks` array in `modules.json` (authored by the architect at `/module`, when the spec context was fresh).

## Output (machine-readable)
Write a report to `docs/graph/coherence/<module>.md` and return:
```json
{ "module": "<name>",
  "checks": { "shape":"pass|fail", "authz":"pass|fail", "dataModel":"pass|fail",
              "integration":"pass|fail", "specGap":"pass|fail", "dynamic":"pass|fail" },
  "findings": [ { "check":"authz", "severity":"High", "ref":"file:line", "issue":"…", "fix":"…" } ],
  "verdict": "PASS|REQUEST_CHANGES" }
```
`verdict: PASS` only if every check passes with zero unresolved findings. Set `coherenceStatus` in `modules.json`.

> **Visual sub-verdict (UI design harness, ADR-0026):** the module-edge E2E run (owned by the orchestrator's Module-DoD loop, run by `e2e-automator`) records a **`## Visual`** subsection in this same `coherence/<module>.md` — aria-snapshot + both-themes axe + responsive (always) and any opt-in pixel result (LOCAL only). When `visualRegression: +pixel-local`, **module DONE additionally requires `visualStatus: GREEN`** in `modules.json` (a changed pixel baseline of a previously-approved surface is a human stop). The deterministic visual checks are blocking; a first-ever pixel baseline auto-accepts.

## Rules
- **Emergent-only.** Do NOT re-run per-task gates or re-review single diffs — that's `gate-runner`'s job. This lens is exclusively cross-module / whole-system. If a run finds nothing in #1–#6, say so plainly (and that's a valid PASS, not a reason to invent findings).
- READ-ONLY reviewers; builders fix; loop until PASS, then the human gives the integration go.
- A new pattern surfaced here → librarian adds a Canonical patterns registry row; a deliberate divergence → an ADR.
- **Bound verbose output** (the `output-bounding` skill): the whole-module `git diff development...HEAD` can be huge — redirect it to `docs/graph/logs/coherence-<module>-diff.log` and keep only the structured per-check findings + verdict (and, on need, a bounded head+tail preview + the path) in context. Limits live in `harness.config.md`.
