---
name: design-review
description: The agent-judged taste pass — review rendered screens against the design system + visual spec for taste, hierarchy, spacing, consistency, and AI-slop. OPT-IN (Design Profile tasteReviewer: on), READ-ONLY, LOCAL only (never CI), capped iterations. Used by the design-reviewer agent at the module edge for design-differentiated products.
---

# Design Review (agent-judged taste)

The behavioral-quality analogue of the deterministic visual gate: a model looks at the **rendered** screens and judges whether they match the **frozen design intent** and read as a deliberate identity rather than AI-slop. **OPT-IN** — runs only when the Design Profile sets `tasteReviewer: on`.

> **When NOT to run:** a plain CRUD product. Taste is decided once at genesis (the `design` agent); a judge loop on CRUD screens is effort out of proportion to the stakes. This exists for **design-differentiated** products where appearance is a feature.

## Cadence & boundaries
- **Module edge, LOCAL only, never CI.** Runs alongside the coherence + E2E gates, after `e2e-automator` has captured the rendered screenshots.
- **READ-ONLY reviewer** (`design-reviewer` agent): emits findings → `frontend` fixes → re-run. Cap **5** iterations (durable, read from CHECKPOINT/ledger), then escalate to the human.
- It is a **judgment** pass — distinct from the deterministic visual gate (aria/responsive/pixel). Both feed the module's `## Visual` subsection.

## Steps
1. Resolve `tasteReviewer` from the Design Profile — if `off`, **skip** (no-op).
2. Load the frozen design system (`design-system.md` tokens + anti-patterns) + the module's visual spec.
3. Read the rendered screenshots `e2e-automator` captured (don't re-drive the browser — judge the captured render).
4. Score against the lenses (taste/anti-slop · hierarchy · spacing · consistency · copy). Flag **only clear** issues; an empty list is a valid **APPROVE**.
5. Write findings (`[blocking]`/`[nit]`) + verdict into the module's `## Visual` subsection; route fixes to `frontend`.
6. Re-run after fixes until APPROVE or the cap, then escalate.

## Rules
- Judge against frozen intent + the spec, **never** a personal redesign. "Matches intent + non-generic," not "how I'd do it."
- **Never invent findings.** A model cannot reliably judge taste — confident, specific, or silent.
- **Bound verbose output** (`output-bounding`); keep screenshot file references as-is.
