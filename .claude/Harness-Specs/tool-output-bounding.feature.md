---
title: Feature Spec — Tool Output Bounding Convention
status: ready-to-implement
created: 2026-06-22
applies-to: the engineering harness (.claude/)
target-executor: a fresh Claude Code session with the harness already loaded
---

# Feature: Tool Output Bounding Convention

> **For the executing session:** This file is a complete implementation spec, not a patch.
> Your harness may have drifted since this was written — implement the **intent and the
> canonical pattern**, adapting file names/paths to the harness as it actually exists.
> `harness.config.md` is the single source of truth; parameters live there, skills/agents
> reference them. Do NOT duplicate parameter values into multiple files.

---

## 1. Problem

Every tool result an agent produces (a test run, `npm audit`, `tsc`, the native build
(`./gradlew assembleDebug` / `xcodebuild`), Maestro E2E, `graphify` reports) is pasted into the conversation and
**stays there for the rest of the session**, re-read by the model on every subsequent turn.
The context window is finite, shared, and billed per token on every turn.

Verbose tools routinely emit **1,500–4,000 lines** per run. Unbounded, this causes:

1. **Signal loss** — the one line that matters (`Expected 200, got 500 at tasks.service.ts:84`)
   is buried in thousands of lines of framework noise; the model re-finds it every turn and
   often fixates on the wrong frame.
2. **Window exhaustion** — a few noisy gate runs spend 100k+ tokens on logs never read again.
3. **Premature compaction** — when the window fills, Claude Code compacts (summarizes + drops
   history). Logs filling the window trigger compaction *sooner*, and compaction is exactly
   where task specs, gate state, and decisions get summarized away. **This is the real danger
   for `auto-until-development` runs**, which walk the task graph unattended and depend on that
   state surviving.
4. **Cost + latency** — the whole window is re-processed every turn.

**Why a "convention" and not a framework change:** Claude Code owns its agent loop. Unlike
opencode (which bounds tool output inside `tool-output-store.ts` at the loop level), we cannot
intercept tool output centrally. We enforce the same discipline **in the skills/agents that
issue the commands** — redirect verbose output to a file, surface only a bounded slice + a
structured verdict + the file path.

This is the **same principle the harness already applies to graphify** (send semantic
descriptions, never raw source) — now extended from *codebase knowledge* to *runtime output*.

---

## 2. Goal & Non-Goals

### Goal
Any agent-issued command whose output may be large writes its **full** output to a log file and
surfaces into context only: (a) a **structured verdict** (when applicable), (b) a **bounded
head+tail preview**, and (c) the **log file path**. Full fidelity stays retrievable on disk; the
context footprint stays flat across a long autonomous run.

### Non-Goals (do NOT do these)
- **Do not** attempt to intercept tool output at the loop level or emulate opencode's
  `context-epoch` / `safe-provider-turn-boundary` / mid-conversation-message machinery — that
  requires owning the loop and is impossible from a config layer. Cargo-culting it is a mistake.
- **Do not** bound output that is already small — passing a 12-line result through a log file
  adds friction for zero benefit (see threshold rule §4.3).
- **Do not** discard or truncate **structured tool return values** that downstream steps consume
  (e.g. a JSON the orchestrator parses) — bound only the **model-visible text**, keep structured
  data intact.
- **Do not** bound media/screenshots (Maestro debug artifacts, images) — keep file references as-is.
- **Do not** change what information reaches the model — the failing test, `file:line`, and
  coverage miss must still be visible. Bounding changes the *volume*, never the *signal*.

---

## 3. Design Principles
- **Full fidelity on disk, bounded footprint in context.**
- **Verdict first, raw log on demand.** Structured fields the model can route on (file, error,
  numbers) beat prose it must hand-parse.
- **The tail almost always carries the answer** — stack traces, assertion failures, and summary
  lines live at the end. Always include the tail.
- **Single source of truth.** Limits and paths live in `harness.config.md`; everything else
  references them. No magic numbers scattered across skills.
- **Fail open, never silently lossy.** If writing the log fails, surface a bounded preview
  anyway and note the storage failure — a missing log never turns a real result into a fake one.

---

## 4. The Canonical Pattern

### 4.1 Parameters (define ONCE in `harness.config.md`)
| Param | Default | Meaning |
|---|---|---|
| `OUTPUT_MAX_LINES` | `200` | Max lines surfaced in context before bounding kicks in |
| `OUTPUT_MAX_BYTES` | `20480` (20 KB) | Max bytes surfaced before bounding kicks in |
| `OUTPUT_LOG_DIR` | `docs/graph/logs/` | Where full logs are written |
| `OUTPUT_LOG_RETENTION` | task lifetime | Logs are ephemeral; cleaned by the librarian on task `done` |

> Rationale for the numbers: opencode bounds general tool output at **2,000 lines / 50 KB**.
> For *gates/reviews* we go tighter (200 lines / 20 KB) because a structured verdict already
> carries the signal, so the raw preview is a fallback only. For **non-gate** verbose commands
> with no structured verdict, use opencode's looser 2,000 / 50 KB. Both sets live in config.

### 4.2 Log file naming
`docs/graph/logs/<context>-<id>-<step>.log` — e.g.
`gate-TASK-013-unit.log`, `gate-TASK-013-e2e.log`, `review-TASK-013-security.log`,
`devops-gate-checkov.log`. One log per (task, step); overwrite on re-run within the same task.

### 4.3 The bounding recipe (deterministic)
For any verbose command:

```bash
mkdir -p docs/graph/logs
<command> > docs/graph/logs/<name>.log 2>&1; echo "exit=$?"
LINES=$(wc -l < docs/graph/logs/<name>.log)
```

Then decide:
- **If** `LINES <= OUTPUT_MAX_LINES` **and** byte size `<= OUTPUT_MAX_BYTES` → surface the log
  content verbatim (it's small; no bounding needed).
- **Else** → surface a **head + tail** preview:
  - head = `ceil(OUTPUT_MAX_LINES / 2)` lines (`head -n <H>`)
  - tail = `floor(OUTPUT_MAX_LINES / 2)` lines (`tail -n <T>`)
  - joined by the **marker** (see §4.4) between them.

### 4.4 The marker (verbatim format)
```
... output truncated (<LINES> lines total); full content at <path> ...
```
Placed between the head and tail slices so the model knows content was elided and where the
rest lives.

### 4.5 The surfaced shape (for gates/reviews — verdict + preview)
On **success**: surface only the structured verdict (no raw preview needed).
On **failure**: surface the structured verdict **then** the bounded preview. Example:

```json
{
  "gate": "unit",
  "task": "TASK-013",
  "result": "fail",
  "coverage": { "changed": 76.8, "global": 82.9,
                "threshold": { "changed": 80, "global": 70 } },
  "failures": [
    { "test": "TasksService > update > sets completedAt",
      "file": "src/tasks/tasks.service.ts:84",
      "error": "TypeError: Cannot read properties of undefined (reading 'toISOString')" }
  ],
  "summary": "1 failed / 48 tests; changed-file coverage 76.8% < 80% gate",
  "fullLog": "docs/graph/logs/gate-TASK-013-unit.log"
}
```
followed (only on failure) by the head+tail preview of the `.log`.

---

## 5. Implementation — file by file

> Adapt names to the current harness. Order: config first (SSOT), then the shared skill, then
> the consumers, then settings/hygiene.

### 5.1 `harness.config.md` — add the policy (single source of truth)
Add a new subsection under **Quality Gates** (or a sibling top-level section
**Tool Output Bounding**):

```markdown
## Tool Output Bounding (context hygiene — applies to EVERY verbose command)
Agent-issued commands that can emit large output MUST write full output to a log file and
surface only a bounded preview + (where applicable) a structured verdict + the log path.
Full fidelity stays on disk; context stays lean. This protects unattended `auto-until-development`
runs from premature compaction. (Loop-level interception is impossible in Claude Code — this is a
convention enforced by the skills/agents that issue the commands.)

- **Params:** `OUTPUT_MAX_LINES = 200` · `OUTPUT_MAX_BYTES = 20480` (gates/reviews);
  `2000` / `51200` for non-gate verbose commands · `OUTPUT_LOG_DIR = docs/graph/logs/`.
- **Pattern:** redirect to `OUTPUT_LOG_DIR/<context>-<id>-<step>.log`; if over the limit, surface
  `head (MAX/2)` + marker + `tail (MAX/2)`. Marker:
  `... output truncated (<N> lines total); full content at <path> ...`.
- **Never bound:** already-small output, structured return values consumers parse, media/screenshots.
- **Canonical procedure:** the `output-bounding` skill. Logs are ephemeral — the librarian prunes
  `OUTPUT_LOG_DIR` for a task when it reaches `done`.
```

### 5.2 NEW skill: `skills/output-bounding/SKILL.md`
The reusable procedure every other skill/agent invokes. Content outline:

```markdown
---
name: output-bounding
description: Canonical procedure for running a verbose command without flooding context — redirect full output to a log file under docs/graph/logs/, then surface a bounded head+tail preview + the log path. Use for ANY command that can emit large output (tests, build, audit, lint, IaC scans, graphify). Params live in harness.config.md.
---

# Output Bounding

Run verbose commands so the context window keeps only the signal.

## Procedure
1. `mkdir -p <OUTPUT_LOG_DIR>` (from harness.config.md).
2. Run the command redirecting BOTH streams to the log:
   `<cmd> > <OUTPUT_LOG_DIR>/<name>.log 2>&1; echo "exit=$?"`
3. `LINES=$(wc -l < <log>)`; get byte size.
4. If `LINES <= OUTPUT_MAX_LINES` AND bytes `<= OUTPUT_MAX_BYTES`: surface the log verbatim. Done.
5. Else surface:  `head -n ceil(MAX/2)`  +  the marker  +  `tail -n floor(MAX/2)`.
   Marker: `... output truncated (<LINES> lines total); full content at <log> ...`
6. If a structured verdict applies (gates/reviews), emit it FIRST; surface the raw preview only
   on failure.
7. If the agent needs the elided middle later: `grep -n <pattern> <log>` or Read the file with an
   offset — do NOT re-run the command.

## Rules
- Read params from harness.config.md; never hardcode the numbers here.
- The tail is mandatory in any preview (failures live at the end).
- Bound model-visible TEXT only — keep structured return values and media references intact.
- Fail open: if the log write fails, surface a bounded preview anyway + note the storage failure.
- Greenfield: if OUTPUT_LOG_DIR doesn't exist yet, create it (step 1 handles this).
```

### 5.3 MODIFY `skills/gate-runner/SKILL.md` (primary consumer)
The gate-runner already returns a per-gate JSON verdict — extend it to:
- Run **each** gate command through the `output-bounding` procedure, writing
  `docs/graph/logs/gate-<task-id>-<gate>.log`.
- Add `"fullLog": "<path>"` to each gate's result.
- Enrich `failures[]` with structured `file`, `error`, and (unit) `coverage` fields parsed from
  the log so the orchestrator can route the fix without re-reading the log.
- Surface the raw head+tail preview **only for gates that fail**; passing gates surface the
  verdict alone.
- Keep the existing "never report `overall: pass` with any gate failing" rule.

### 5.4 MODIFY the reviewer agents/skills
`agents/code-reviewer.md`, `agents/security-reviewer.md`, `agents/infra-reviewer.md`,
`agents/mr-reviewer.md` and the skills `infra-review`, `coherence-review`, `mr-flow`:
- Any time they run a verbose tool (`npm audit`, `trivy`, `checkov`, `tfsec`, `gitleaks`,
  `git diff` of a huge change), invoke `output-bounding`.
- Their **findings** are already structured (severity-tagged) — keep those in context; route the
  raw scanner dumps to logs (`review-<task>-<tool>.log`).

### 5.5 MODIFY `skills/devops-gates/SKILL.md`
The infra gate suite (validate/fmt, tflint/hadolint/actionlint, gitleaks, checkov/tfsec/trivy,
conftest, trivy CVE, plan dry-run, infracost) is the **chattiest** surface in the harness. Run
every gate through `output-bounding` → `docs/graph/logs/devops-gate-<gate>.log`. The plain-English
"DEVOPS SAFETY CHECK" verdict stays in context; the raw tool output goes to logs.

### 5.6 MODIFY `settings.json` — permissions for the bounding primitives
The convention uses shell utilities not currently allow-listed. Add to `permissions.allow`:
```
"Bash(mkdir:*)",
"Bash(head:*)",
"Bash(tail:*)",
"Bash(wc:*)",
"Bash(grep:*)"
```
> Verify redirection works under the existing patterns: `npx vitest run > file.log` is matched by
> the existing `Bash(npx:*)` prefix rule (redirection is shell syntax, not a separate command), so
> no new perm is needed for the redirect itself — only for the head/tail/wc/grep/mkdir helpers.
> If your harness prefers the Read tool over `head`/`tail`, you can instead Read the log with an
> `offset`/`limit` for the head slice and compute the tail offset from `wc -l`; the `Bash(wc:*)`
> perm is still needed.

### 5.7 Hygiene — `.gitignore` + librarian cleanup
- Add `docs/graph/logs/` to `.gitignore` (logs are ephemeral build artifacts, never committed).
- In `agents/librarian.md` (and the `/harness-sync` flow): when a task reaches `done`, prune that
  task's logs from `OUTPUT_LOG_DIR`. Keep logs for tasks still in flight or escalated (a blocked
  task's logs are useful evidence for the human).

### 5.8 CI parity (optional but recommended)
CI mirrors the gates. In CI the full logs are already captured as job output, so bounding there is
unnecessary — but ensure the same structured verdict is emitted so local and CI failures read
identically. No behavioral change to `ci.yml`/`devops-gates.yml` required beyond keeping verdict
shape consistent.

---

## 6. Edge Cases & Rules
- **Already-small output** → pass through unchanged; do not create a log file or a preview.
- **Failure detail in the middle** → the agent greps/Reads the log on demand; never re-runs the command.
- **Coverage tables** → numbers go in the structured verdict; the raw table goes to the log.
- **Multiple commands per gate** (e.g. typecheck per app in a monorepo) → one log per gate,
  appended (`>>`) with a `=== <app> ===` separator, or one log per (gate, app).
- **Binary/media** (Maestro debug artifacts, screenshots) → keep file references; never bound media bytes.
- **Structured return values** consumers parse → bound the text projection only; structured value untouched.
- **Log write fails** → surface a bounded preview from stdout anyway + a one-line storage-failure note.
- **Greenfield** (no `docs/graph/` yet) → `mkdir -p` creates the path; treat as normal.

---

## 7. Acceptance Criteria (how the executing session verifies "done")
1. `harness.config.md` has a **Tool Output Bounding** section with the params, and no other file
   restates the numeric values (they reference config).
2. `skills/output-bounding/SKILL.md` exists and documents the redirect → measure → head/tail/marker
   procedure.
3. `gate-runner` writes a `.log` per gate, adds `fullLog` to each verdict, enriches failures with
   `file`/`error`/`coverage`, and surfaces a raw preview only on failing gates.
4. The reviewer agents and `devops-gates` route verbose scanner output to logs and keep only
   structured findings + previews in context.
5. `settings.json` allows `mkdir`/`head`/`tail`/`wc`/`grep` (or the Read-based equivalent).
6. `docs/graph/logs/` is git-ignored; the librarian prunes a task's logs on `done`.
7. **Smoke test:** force a unit-test failure on a sample task, run the gate. Confirm the model
   context receives the structured verdict + a ≤200-line preview (not the full multi-thousand-line
   dump), the failing `file:line` is visible, and the full log exists on disk and is greppable.

---

## 8. Rollout Order (lowest risk first)
1. Add config params + the `output-bounding` skill (no behavior change yet — just the primitive).
2. Add the `settings.json` permissions + `.gitignore` entry.
3. Wire `gate-runner` to it (biggest single win).
4. Wire `devops-gates` (chattiest surface).
5. Wire the reviewer agents/skills.
6. Add librarian log pruning.
7. Run the §7 smoke test; confirm the before/after token delta on a real failing gate.

---

## 9. One-line rationale (for the changelog/PR body)
> Verbose tool output (tests, builds, audits, IaC scans) flooded the context window and pushed
> long autonomous runs toward premature compaction. This convention redirects full output to
> ephemeral logs and surfaces only a structured verdict + bounded head/tail preview + the log path —
> same signal, ~98% fewer tokens, full detail one file-read away. Mirrors opencode's
> `tool-output-store` bounding, enforced at the skill layer since Claude Code owns its loop.
