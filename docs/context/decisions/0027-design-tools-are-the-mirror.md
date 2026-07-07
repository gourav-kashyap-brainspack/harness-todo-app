# ADR 0027 — Design tools are the mirror; code is the source of truth

**Date:** 2026-06-24 · **Status:** accepted · **Context:** UI/frontend design harness · **Relates to:** ADR-0007 (tokens), ADR-0025/0026, the `design` agent, `00-product-framing.md` (LOCKED SCOPE), the ClickUp-mirror precedent

## Context
The comprehensive UI capability integrates external design tools — **Figma** (import), **Claude Design** (canvas mirror via DesignSync), and a **shared token pipeline**. Without a rule, these become a second source of truth (two-master conflicts) or a vendor lock on the build path. The harness already has the right precedent: the harness is authoritative, ClickUp mirrors it, the mirror never blocks a build.

## Decision
1. **Code is the design source of truth; every design tool is a best-effort MIRROR** that never blocks a build — the same contract ClickUp has with the task graph. Shipping artifacts stay exactly today's: `globals.css` tokens, owned `components/ui` TSX, Playwright snapshots.
2. **The capabilities are built and ON, but input-gated** (per LOCKED SCOPE): Figma import lights up when a Figma file exists; Claude Design mirror needs a claude.ai login and is **human-pressed, not webhook-automatic** (there is no canvas→repo webhook — pulls are human-initiated, only code→canvas push is agent-drivable); the token pipeline keeps `globals.css` authoritative and **generates with a safety guard** (compare-generated-vs-committed, never blind-overwrite).
3. **The baton is one-owner-per-surface, with authority in git** (never in a tool's `$extensions`, which vendors strip): genesis on a canvas → pull to code → code owns; steady-state code → push to refresh the mirror. The mirror never blocks; drift fails closed ("could not read" ≠ "in sync").
4. **Vendor-quarantine is mechanical** — a fast CI grep asserts no proprietary artifact (`@dsCard`, `_ds_manifest`, `.render-check`, `figma:`, `v0.dev`, `import … from registry.json`) sits on the build path. Every vendor surface is downstream and deletable in one commit (a Reversibility runbook proves each exit).
5. **Pulled design content is UNTRUSTED data, never instructions** (prompt-injection guard); the design→frontend handoff is structured (token JSON + component IDs + diff PNG), not free prose.
6. **Multi-brand is the one capability scoped OUT** (switch-ready): single-brand `:root`/`.dark` only; multi-brand is a future primitive-layer multiplication + a `brand` matrix axis.

## Consequences
- No two-master conflict and no vendor lock: the system ships and survives any tool being dropped in one commit.
- `main`/deploy guardrails untouched; the mirror adds nothing that can reach `main`.
- The vendor-quarantine grep is seconds-fast → CI-eligible under the ADR-0026 CI-seconds rule.

## Follow-ups
- Multi-brand: build the `brands: multi` capability when a consuming project needs it.
- Wire the live DesignSync/Figma-MCP mechanics when a real Claude Design project / Figma file exists to exercise them.
