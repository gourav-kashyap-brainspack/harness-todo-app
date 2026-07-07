---
name: output-bounding
description: Canonical procedure for running a verbose command without flooding context — redirect full output to a log file under docs/graph/logs/, then surface a bounded head+tail preview + the log path (+ a structured verdict where one applies). Use for ANY command that can emit large output (tests, build, lint, npm audit, IaC scans, graphify). Params live in harness.config.md.
---

# Output Bounding

Run verbose commands so the context window keeps only the **signal**. Full fidelity goes to disk; the context footprint stays flat across a long autonomous run. Params (`OUTPUT_MAX_LINES`, `OUTPUT_MAX_BYTES`, `OUTPUT_LOG_DIR`) live in `.claude/harness.config.md` → **Tool Output Bounding** — read them, never hardcode.

## Procedure
1. `mkdir -p <OUTPUT_LOG_DIR>` (greenfield-safe — creates it if missing).
2. Run the command redirecting BOTH streams to the log, and capture the exit code:
   `<cmd> > <OUTPUT_LOG_DIR>/<context>-<id>-<step>.log 2>&1; echo "exit=$?"`
3. Measure: `LINES=$(wc -l < <log>)` and the byte size.
4. **If** `LINES <= OUTPUT_MAX_LINES` **and** bytes `<= OUTPUT_MAX_BYTES` → surface the log verbatim. Done (it's already small; no preview, no bounding).
5. **Else** surface a head+tail preview:
   - head = `head -n ceil(MAX/2)` · tail = `tail -n floor(MAX/2)`
   - join with the marker between them:
     `... output truncated (<LINES> lines total); full content at <log> ...`
   - (Prefer the **Read** tool with `offset`/`limit` over `head`/`tail` if you like — same slices; `wc -l` still gives the total for the tail offset + the marker.)
6. **Structured verdict (gates/reviews):** emit it FIRST. On **success** surface the verdict alone; on **failure** surface the verdict THEN the head+tail preview THEN the log path.
7. **Need the elided middle later?** `grep -n <pattern> <log>` (Grep tool or Bash) or Read the log at an offset — do **NOT** re-run the command.

## Naming
`<OUTPUT_LOG_DIR>/<context>-<id>-<step>.log` — e.g. `gate-TASK-013-unit.log`, `gate-TASK-013-build.log`, `review-TASK-013-security.log`. One log per (task, step); overwrite on re-run within the same task. Multiple commands for one step (e.g. build per platform: android/ios) → append (`>>`) with a `=== <app> ===` separator, or one log per (step, app).

## Rules
- Read the numbers from `harness.config.md`; never hardcode them here.
- The tail is **mandatory** in any preview — stack traces, assertion failures, and summary lines live at the end.
- Bound model-visible **text** only — keep structured return values consumers parse, and media/screenshot references, intact.
- **Fail open:** if the log write fails, surface a bounded preview from stdout anyway + a one-line storage-failure note.
- Logs are ephemeral build artifacts: `docs/graph/logs/` is git-ignored and pruned by the librarian on task `done` (blocked/escalated tasks keep theirs as evidence).
