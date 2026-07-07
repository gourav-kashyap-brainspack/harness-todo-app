---
name: design-detect
description: Resolve the per-project Design Profile before any UI work — the design-capability entry point. Reads the Design Profile switches (harness.config.md) + the real repo, and routes the UI capability (taste, intake path, visual depth). Use at the start of UI work / a new project / a re-brand.
---

# Design Detect — the Design Profile router

The first job of the UI capability: **resolve the Design Profile before deciding anything.** The harness is a **product configured per project** — never assume; read the switches in `harness.config.md` → **Design Profile** and verify against the real repo. Output a short **Design Profile** block every later step (design agent, frontend, e2e-automator visual checks) reads.

> Source of truth is always **code** (NativeWind tokens (`mobile/tailwind.config.js` + `global.css` + `src/theme`) + owned `src/components/ui` TSX, ADR-0007). Figma / Claude Design / token pipeline are mirrors (ADR-0027). Scope is comprehensive — everything ON except `brands: multi` — per `harness.config.md` → Design Profile + `docs/research/ui-frontend-design/00-product-framing.md`.

## Mode A — New project / re-brand (genesis)
Taste is a **Tier-1 decision made ONCE here**, never per task (per-task taste = drift). When `taste: on`:
- Establish a **distinct aesthetic direction** + an explicit **anti-patterns / banned-defaults** list (avoid the 3 AI-default looks — cream+serif+terracotta · near-black+acid-accent · broadsheet-hairlines — and Inter/Roboto/purple-on-white). Apply the harvested `frontend-design` guidance the `design` agent already carries; if `taste` later points at the actual `frontend-design` plugin, invoke it **here only** (never project-wide).
- **Freeze** the chosen type pairing / accent / signature + banned-defaults into the NativeWind tokens (`mobile/tailwind.config.js` + `mobile/global.css`) + the `design-system.md` anti-patterns section. Everything downstream **reuses** the frozen tokens — it is not re-decided.

## Mode B — Existing project (maintenance)
Scan, don't guess (the `pending` ≠ "doesn't exist" rule applies):
- Query **Graphify** for the real **component catalogue** (component *nodes* in `mobile/src/components`, not a bare file `ls`) and whether tokens exist in `tailwind.config.js`/`src/theme`. This is what makes "we resolve component identity, we don't pixel-guess" true in the pipeline.
- Touch only the delta; **never re-emit a stable surface**.

## Resolve the input path (`designSource`)
- `scratch` (default here) → generate against the frozen tokens + owned `mobile/src/components/ui`.
- `full-figma` → Figma MCP: read variables→tokens + Code Connect→component identity, reconcile into the NativeWind tokens (`mobile/tailwind.config.js` + `mobile/global.css`), baton moves to code (ADR-0027). Lights up only when a real Figma file exists.
- `partial-figma` → Figma for covered frames; generate the gaps against the same single token set. Reconcile to ONE token set before any component code lands.

## Design Profile (the output of this skill)
```
DESIGN PROFILE
- Mode: new | re-brand | existing
- designSource: scratch | full-figma | partial-figma
- designTool: none | claude-design | figma     (mirror wired? needs login/file)
- taste: on | off                              (frozen? where)
- hasTokens: true | false                       (tailwind.config.js + global.css)
- component-catalogue: [from Graphify, or "(pending — pre-first-UI-module)"]
- tokenConsumers: single | multi                (token pipeline on?)
- brands: single | multi                        (multi-brand OFF by default)
- visualRegression: aria-only | +pixel-local
- perfBudgets: bundle-only | +lighthouse
```

## Rules
- **Detect, don't assume.** The Design Profile switches are the config; the repo is the truth.
- **Taste once, at genesis.** Never let taste re-fire per task — that re-creates the 68-dialects problem the two-tier pattern policy exists to prevent.
- Keep the profile short; it feeds the next steps, it isn't the deliverable.
- A `pending` component catalogue (pre-first-UI-module) is **not-yet-built**, never "this project has no UI."
