# harness-template-mobile

A reusable **Claude Code engineering harness** for building **React Native** apps with an agentic SDLC loop:
plan → spec → build → gate → review → merge, with role-separated agents, mechanically-enforced guardrails,
and a self-maintaining knowledge base.

> This is a **GitHub template repository**. Click **“Use this template”** (or
> `gh repo create <you>/<app> --template <owner>/harness-template-mobile --private`) to start a new
> mobile app with the whole harness already wired. Then follow **[SETUP.md](./SETUP.md)**.

---

## What you get

- **11 role-separated agents** (`.claude/agents/`) — orchestrator · architect · frontend · design ·
  unit-tester · e2e-automator · security-reviewer · code-reviewer · mr-reviewer · librarian ·
  design-reviewer (opt-in).
- **Slash-command entry points** (`.claude/commands/`) — `/intake` · `/scope` · `/module` · `/spec` ·
  `/build` · `/coherence` · `/review` · `/harness-sync` · `/clickup-sync`.
- **16 procedure skills** (`.claude/skills/`) — gate-runner, spec-authoring, task-graph, mr-flow,
  parallel-integration, output-bounding, coherence-review, read-the-damn-docs, clean-code, and more.
- **Mechanically-enforced guardrails** (`.claude/hooks/`) — a fail-closed `main` branch guard and a
  role-authorization `PreToolUse` hook (reviewers are read-only, builders can’t rewrite specs, etc.).
- **A single source of truth** — `.claude/harness.config.md` holds every tunable (stack, gates, autonomy
  mode, parallelism, budgets). Change values there, not in scattered docs.
- **A durable run-state model** — Run Ledger + Checkpoint so long autonomous runs survive compaction/crash.
- **Docs scaffold** (`docs/`) — context docs, ADR log (`docs/context/decisions/`), the task/build graph
  (`docs/graph/`), specs (`docs/specs/`), and requirements intake (`docs/requirements/`).

## Target stack (the harness is tuned for this)

React Native 0.75 (RN CLI) + React 18.3 + TypeScript 5 (strict) · NativeWind 4 · React Navigation 6 ·
TanStack React Query 5 + Zustand 5 · React Hook Form 7 + Zod 3 · Axios 1.7 · Jest + Maestro · ESLint 8
(+ `eslint-plugin-boundaries`) · npm (`npm ci --legacy-peer-deps`). Your RN app lives in **`mobile/`**.

> The stack pins are the *current defaults*; the Dependency Version Policy in `harness.config.md` still
> governs any new install (resolve current-stable at build time — RN-coupled packages excepted).

## Definition of Done (every active gate must pass, inside `mobile/`)

Typecheck · Lint (`--max-warnings=0`) · Unit + coverage (≥80% changed / ≥70% global) · Native build ·
Security (no High/Critical) · Code review (APPROVE). **E2E (Maestro)** runs once **per module, locally** —
never in CI. A module also needs a **coherence review** PASS + human integration go.

## How the flow runs

```
/intake     ingest a PRD + feature list  → requirements digest + traceability
/scope      architect interrogates you   → module breakdown in the task graph
/module <m> specs + task graph for a module
/build <t>  the full SDLC gate loop for a task / module / parallel-group
/coherence  module-boundary coherence review (system-level Module DoD)
/review     security + code + PR review on demand
```

`main` is protected and never touched without an explicit human instruction. Feature branches target
`development`.

## Prerequisites

- **Claude Code** CLI (this harness is a set of Claude Code agents/skills/hooks).
- **Node 18+** and **npm**, plus the **React Native 0.75 toolchain** (Android SDK / Java 17; Xcode +
  CocoaPods on macOS for iOS).
- **`gh`** CLI (authenticated) for the PR flow.
- **Maestro** for local E2E (`~/.maestro-cli/...`) — module-edge only.
- **The `graphify` skill** — the harness grounds every task in a Graphify knowledge graph. It is a
  **user-level** skill (`~/.claude/skills/graphify/`), not vendored here; install it before relying on the
  “ground in Graphify first” rule. See [SETUP.md](./SETUP.md).
- **Optional MCP** — Context7 (current library docs) and ClickUp (PM mirror). Staged in
  `.mcp.harness.json`; activate per SETUP.

## First steps

See **[SETUP.md](./SETUP.md)** — fill the `{{PLACEHOLDERS}}`, scaffold your RN app into `mobile/`, activate
the staged config, then run `/intake` → `/scope` → `/module` → `/build`.

## Layout

```
.claude/            agents · commands · skills · hooks · scripts · staged settings + config
docs/context/       overview · architecture · conventions · stack · patterns-registry · decisions (ADRs)
docs/graph/         modules.json (task graph) · STATUS.md · run-ledger.jsonl · CHECKPOINT.md
docs/specs/         one spec per task (+ _TEMPLATE.spec.md)
docs/requirements/  intake sources → REQUIREMENTS.md + TRACEABILITY.md
mobile/             ← your React Native app goes here (not included in the template)
CLAUDE.md           the always-loaded project charter
HARNESS_GUIDE.md    the deep guide to how the harness works
```
