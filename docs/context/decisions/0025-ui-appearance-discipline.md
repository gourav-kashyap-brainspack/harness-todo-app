# ADR 0025 — UI appearance discipline (taste at genesis + mechanical off-system guard)

**Date:** 2026-06-24 · **Status:** accepted · **Context:** UI/frontend design harness (the comprehensive UI capability) · **Relates to:** `docs/research/ui-frontend-design/` (scope LOCKED), ADR-0007 (design tokens), the `design`/`frontend`/`code-reviewer` agents, `eslint.config.base.mjs`

## Context
The harness was strong at "is the code correct" but blind to "does the UI look right and stay consistent." Two layers were missing around the existing token *system*: **taste** (a deliberate, non-generic visual direction) and the **discipline** that keeps every screen on-system instead of drifting into 68 dialects. The harness is a **product configured per project** (this Todo app is a test fixture), so the rule must be mechanical, not prose that rots.

## Decision
1. **Code stays the design source of truth.** `apps/web/app/globals.css` `@theme inline` + the owned `components/ui` TSX remain authoritative (ADR-0007 unchanged). Design tools are mirrors (ADR-0027), never the source.
2. **Taste is a Tier-1 decision, made ONCE at genesis** — not per task (taste per-task = drift). The `design` agent owns a distinct aesthetic direction + an explicit **anti-patterns / banned-defaults** section, frozen into tokens, then reused. The genuinely-portable guidance from Anthropic's `frontend-design` skill (avoid the 3 AI-default looks; deliberate type pairing; UX-copywriting rules) is **harvested into the `design` agent + the patterns registry** — we do not wire the plugin itself in this pass (its on-demand invocation mechanism is unverified; harvesting captures the durable value with zero moving parts).
3. **Off-system color is banned mechanically.** A `no-restricted-syntax` selector in the web ESLint config bans Tailwind arbitrary **hex** color values (`bg-[#…]`, `text-[#…]`, …). Verified **0 current violations**, so it ships **blocking**. Arbitrary `px` values are **not** lint-banned (11 legitimate layout one-offs exist) — those are reviewer judgment.
4. **Escape hatch:** a genuine one-off suppresses the finding with `// eslint-disable-next-line no-restricted-syntax -- design-divergence: <reason>` (the appearance analogue of the `// reason:` escape for `any`), signalling the librarian to consider a new token row.
5. **Reviewer backstop:** the `code-reviewer` gains a Graphify-grounded **appearance-reinvention** heuristic — a structurally-duplicate component (same render tree, new file) or a net-new type-pairing/accent/signature not in the tokens is `[blocking]` unless a `design-divergence` marker / new registry row / ADR justifies it.

## Consequences
- Off-system hex colors fail lint pre-review, free and deterministic; the high-noise/low-signal px case stays human-judged.
- Taste is decided once and reused — consistent with the two-tier pattern policy; no per-task taste auto-fire.
- No new gate is created: the ban folds into the existing **lint** gate; the reviewer heuristic folds into the existing **code-review** gate. The active per-task gate set stays at SIX.
- `frontend-design` plugin enablement remains an available **configurable capability** (Design Profile `taste` switch) for design-led consuming teams; this pass harvests its value instead of wiring it.

## Follow-ups
- If a future project is design-differentiated, wire the `frontend-design` plugin at genesis (Design Profile `taste: on`) and/or the agent-judged `design-reviewer` (ADR-0026 scope note).
- Promote the px-arbitrary-value check from reviewer-judgment to a `warn` lint rule if drift is observed in practice.
