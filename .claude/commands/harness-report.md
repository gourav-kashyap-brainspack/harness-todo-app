---
description: Generate the harness telemetry dashboard — tokens · cost · time · context · agents, per task/agent, from the Claude Code transcripts + git.
argument-hint: (none)
---

Run the telemetry generator and surface the top-line KPIs.

1. `node .claude/scripts/telemetry-report.mjs` (from the repo root, so the transcript slug matches). It reads
   `~/.claude/projects/<slug>/` transcripts (main + `subagents/agent-*.jsonl`) + git + `docs/graph/telemetry/pricing.json`, and writes `docs/graph/telemetry/REPORT.md` (+ a trend row in `summary.json`).
2. Surface the KPI band (billable tokens · est. cost + ccusage anchor + Δ · agent wall-time · agent runs · cache-hit) and any `partial-data` note. Link `docs/graph/telemetry/REPORT.md`.

Notes:
- **On-demand snapshot**, not live. For a near-real-time view during a build, wrap it: `/loop 60s /harness-report` (regenerates every ~60s; one turn of lag since a turn's usage flushes to the transcript only when it completes).
- **`$` is an estimate** from `pricing.json` (verify the rates; ccusage is the authoritative dollar anchor — both are printed with their delta).
- **Cache-read is shown separately**, never in the headline total (summing it across turns double-counts; cost weights it 0.1×).
- **Per-agent rows fall back to model tier** (`agent:opus`/`agent:sonnet`/…) when `agent_type` isn't present on the subagent transcript lines — a Claude Code format limitation, not a bug.
- Heavyweight alternative (cross-session, real-time, needs a collector): native OTEL — `CLAUDE_CODE_ENABLE_TELEMETRY=1` + `OTEL_METRICS_EXPORTER=otlp`. Do not stand this up unless the in-repo `.md` is outgrown.
