# ADR 0016 — Tool Output Bounding convention (context hygiene for verbose commands)

**Date:** 2026-06-22 · **Status:** accepted · **Context:** harness-level convention (`.claude/`) · **Mode:** autonomous (AUTONOMY_MODE=auto-until-development)

## Context
Every tool result an agent produces — a test run, `npm audit`, `tsc`, `next build`, Playwright, `trivy`/`checkov`, graphify reports — is pasted into the conversation and **stays there for the rest of the session**, re-read by the model on every subsequent turn. The context window is finite, shared, and billed per token each turn. Verbose tools routinely emit 1,500–4,000 lines per run. Unbounded, this causes:

1. **Signal loss** — the one line that matters (`Expected 200, got 500 at tasks.service.ts:84`) is buried in thousands of lines of framework noise.
2. **Window exhaustion** — a few noisy gate runs spend 100k+ tokens on logs never read again.
3. **Premature compaction** — logs filling the window trigger Claude Code's summarize-and-drop *sooner*, and compaction is exactly where task specs, gate state, and decisions get summarized away. **This is the real danger for `auto-until-development` runs** (ADR 0003), which walk the task graph unattended and depend on that state surviving.
4. **Cost + latency** — the whole window is re-processed every turn.

Claude Code owns its agent loop; unlike opencode (which bounds tool output centrally in `tool-output-store.ts`), we **cannot** intercept tool output at the loop level from a config layer. So we enforce the same discipline **in the skills/agents that issue the commands**.

## Decision
Any agent-issued command whose output may be large writes its **full** output to a log file under `docs/graph/logs/` and surfaces into context only: (a) a **structured verdict** (where one applies), (b) a **bounded head+tail preview**, and (c) the **log path**. This mirrors the principle the harness already applies to Graphify (send semantic descriptions, never raw source) — extended from codebase knowledge to runtime output.

- **Single source of truth:** params live ONLY in `harness.config.md` → **Tool Output Bounding** (`OUTPUT_MAX_LINES` 200 gates/2000 non-gate · `OUTPUT_MAX_BYTES` 20 KB/50 KB · `OUTPUT_LOG_DIR = docs/graph/logs/`). No file restates the numbers.
- **Canonical procedure:** the new **`output-bounding`** skill (redirect → measure → verdict-first → head+tail+marker preview only when over the limit and only on failure for gates).
- **Consumers wired:** `gate-runner` (per-gate `.log` + `logs`/`failures` in the JSON, preview only on fail), `devops-gates` (the chattiest surface), the reviewer agents (`code-`/`security-`/`infra-`/`mr-reviewer`) + skills (`infra-review`, `coherence-review`, `mr-flow`), and the test agents (`unit-tester`, `e2e-automator`, for when ADR 0013 is reverted).
- **Hygiene:** `docs/graph/logs/` is git-ignored; the librarian prunes a task's logs on `done` (keeps logs for in-flight/escalated tasks as evidence).
- **`settings.json`:** the recipe needs `mkdir`/`head`/`tail`/`wc`/`grep` Bash helpers allow-listed (the redirect itself is covered by the existing `npx`/`pnpm`/`npm` rules). Adding allow-rules is a permission change requiring explicit human approval — applied separately, or fall back to the Read-tool slicing path (Read with `offset`/`limit`; only `wc` still needed).

## Non-Goals
- Do **not** emulate opencode's loop-level interception / `context-epoch` machinery — impossible from a config layer; cargo-culting it is a mistake.
- Do **not** bound already-small output, **structured return values** consumers parse, or **media/screenshots** (keep file references).
- Bounding changes the *volume*, never the *signal* — the failing test, `file:line`, and coverage miss stay visible.

## Consequences
- ✅ Flat context footprint across long autonomous runs; far fewer premature compactions; lower cost/latency; full fidelity one file-read away (greppable).
- ⚠️ A thin per-command discipline cost (redirect + measure) — negligible versus the token/compaction savings, and skipped entirely for already-small output.
- ⚠️ Convention-enforced, not loop-enforced: a new skill/agent that issues a verbose command must opt in. The code-reviewer should treat an unbounded multi-thousand-line dump as a process smell.

## Verification (smoke test)
Force a failure on an **active** gate (e.g. break a type so `tsc`/`next build` fails — note: unit/E2E gates are disabled under ADR 0013, so the spec's unit-test smoke must target an active gate). Run the gate and confirm: context receives the structured verdict + a ≤200-line preview (not the full dump), the failing `file:line` is visible, and the full log exists under `docs/graph/logs/` and is greppable.

## Rollout (lowest risk first)
1. Config params + `output-bounding` skill (primitive, no behavior change). ✅
2. `.gitignore` entry + `settings.json` permissions (permissions pending human approval). ✅ / ⏳
3. Wire `gate-runner` (biggest single win). ✅
4. Wire `devops-gates` (chattiest surface). ✅
5. Wire reviewer agents/skills + test agents. ✅
6. Librarian log pruning. ✅
7. Run the smoke test; confirm the before/after token delta on a real failing gate.

## Links
- `harness.config.md` → Tool Output Bounding · `.claude/skills/output-bounding/SKILL.md`
- Related: [[0003-autonomy-mode]] (the run mode this protects), [[0013-temporarily-disable-test-gates]] (why the smoke test targets an active gate)
