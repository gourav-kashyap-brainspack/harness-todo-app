# ADR 0030 — Structured reviewer rubric + agent-oriented finding format

**Date:** 2026-06-24 · **Status:** accepted · **Context:** harness-engineering self-review (adopted from *learn-harness-engineering*, lectures 9–11) · **Relates to:** the `code-reviewer` + `security-reviewer` agents, the `gate-runner` skill, `.claude/harness.config.md` → Reviewer Verdict & Finding Format

## Context
Our per-task review gates work, but two properties were left implicit:
1. **Reproducibility.** `code-reviewer`/`security-reviewer` emit APPROVE/REQUEST_CHANGES + findings, but the *dimensions* they weigh and the *bar* for each were never written down — so the same diff can score differently across two runs (the verdict lived in the model's head, not in a rubric). Anthropic's long-running-app QA agent fixed exactly this by scoring fixed dimensions, each with a hard threshold; early versions that lacked it "talked themselves into" approving sub-par work.
2. **Self-correction.** A finding or gate that just says "X failed" forces the build loop to re-derive the cause. OpenAI's Codex practice: error messages written *for agents* should include the fix. We already do this in `eslint` messages (the `fetch`/Prisma bans — ADR 0029), but not in reviewer findings or `gate-runner` output.

## Decision
- **Fixed rubric (reproducible).** `code-reviewer` and `security-reviewer` each score the diff against a **named-dimension rubric with a hard pass bar per dimension** (tables in their agent files). The verdict is mechanical: code-review **APPROVE** only if every dimension is `pass`; security **PASS** only if every dimension is clear of High/Critical. Same diff → same per-dimension result → same verdict.
- **Agent-oriented finding format (self-correcting).** **Every** finding from **any** reviewer and **every** failing gate from `gate-runner` carries the **what · why · how-to-fix** triple (the exact `file:line` + rule · the risk / violated invariant · the concrete change) — not just "failed". `gate-runner`'s structured `failures[]` gains a `fix` field.
- **One convention, referenced — not restated.** Both properties are defined once in `harness.config.md` → *Reviewer Verdict & Finding Format*; the agents/skill reference it (same anti-drift discipline as the Context Manifest, ADR 0019). The rubric *tables* live in the two reviewer agents (loaded on demand), keeping the always-loaded config lean.

## Consequences
- The review gate becomes **reproducible** (a rubric, not a vibe) and **self-correcting** (findings tell the builder how to fix), tightening the `auto-until-development` loop — fewer iterations spent re-diagnosing the same failure.
- Scope: the **rubric** is added to the two per-task gate reviewers (`code-reviewer`, `security-reviewer`) named in the DoD; the **finding-format** convention applies harness-wide — `infra-reviewer` / `mr-reviewer` / `design-reviewer` inherit it by reference, no per-file edit.
- Composes with **ADR 0029** (a recurring rubric finding is still a `[promote]` candidate → becomes a mechanical check) and **ADR 0028** (a rubric dimension is itself ablatable if a future model makes it redundant).
- Honest limit: a rubric reduces verdict *variance*, it doesn't remove model judgment *within* a dimension — the code-review bars are qualitative (security's are severity-based). It makes the axes and the threshold explicit, which is where most of the variance lived.
