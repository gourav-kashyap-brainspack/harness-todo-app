# ADR 0020 — Agent authorization: mechanism-enforced role boundaries via a PreToolUse hook

**Date:** 2026-06-22 · **Status:** accepted (warn-only trial) · **Context task:** harness foundation tuning (before the LIST/DUE/PROF module wave)

## Context
The harness's entire orchestration model rests on role separation: reviewers are READ-ONLY, devops never touches application source, builders never rewrite specs/task-graph, nobody touches `main`. But mechanically those rules were **prose in agent files** — true only while the model chose to obey. An audit found the real enforcement state:

| Rule (in prose) | Mechanically enforced? |
|---|---|
| Reviewers can't Edit/Write | ✅ via each agent's `tools:` field (Edit/Write absent) |
| Reviewers can't mutate **at all** | ❌ they still have **Bash** → `sed -i`, `git commit`, `> file` bypass "READ-ONLY" |
| devops never touches `apps/**` | ❌ prose-only |
| builders never touch `docs/specs/**` | ❌ prose-only |
| nobody edits `main`-protected paths | ⚠️ partial — `git push origin main` denied in `settings.json`, but file edits aren't path-scoped |

So the **tool axis** was half-covered (`tools:` removes Edit/Write but cannot scope Bash by command — confirmed against the Claude Code subagents docs) and the **resource (path) axis** was uncovered. This is the long-standing "roles are prose-enforced, not mechanism-enforced" gap.

**Key capability verified** (against the current Claude Code hooks contract): a `PreToolUse` hook **fires for subagent tool calls** and its payload carries **`agent_type`** + `agent_id` (present only inside a subagent context). That makes per-agent, tool-call-layer authorization buildable — this is opencode's `policy.evaluate(action, resource)` reproduced at the config layer.

## Decision
Enforce the load-bearing role boundaries mechanically via **one** project-level `PreToolUse` hook switching on `agent_type`, NOT per-agent frontmatter hooks (which would recreate the exact drift the Context Manifest, ADR-0019, eliminated).

1. **Single machine source of truth:** `.claude/hooks/agent-authz-policy.json` — `mode` + a list of `{agents, deny:{writePaths, bashMutations}, reason}` rules. The human-readable mirror is the **Agent Authorization** table in `harness.config.md` (edit both together).
2. **Hook:** `.claude/hooks/agent-authz.mjs`, wired in `settings.json` under `hooks.PreToolUse` (matcher covers Write/Edit/MultiEdit/NotebookEdit/Bash + the filesystem-MCP write tools). Reads `agent_type`; main-thread calls (no `agent_type`) are ungoverned.
3. **Two axes, two strengths:**
   - **Write tools** matched by repo-relative path glob → the **strong, low-false-positive guarantee** (Edit/Write/NotebookEdit/filesystem-MCP).
   - **Mutating Bash** → a **best-effort tripwire** (denylist: `sed -i`, file redirects, `git commit/add/merge/push/rebase/reset`, `rm/mv/cp/touch/mkdir`, `pnpm/npm/yarn add|install|remove`). Catches *accidental* off-role moves — explicitly **not** an airtight perimeter (a determined shell evades it). Our threat model is drift, not malice.
   - **`main` guardrail stays in git / `settings.json` deny-rules** — branch state isn't a file path, so it does not belong in this hook.
4. **Hybrid policy, NOT literal deny-by-default.** opencode denies-by-default because it runs untrusted agents; our 14 are cooperative same-model roles. Full deny-by-default would force allow-listing every legal write path of every agent, and any gap stalls a build (false positive ×14). Instead we enumerate the **boundaries that must not be crossed**: reviewers → deny all writes + mutating Bash (trivial, highest value); `devops` → deny `apps/**`,`packages/**`; `backend`/`frontend` → deny `docs/specs/**`,`docs/graph/**`. Unlisted agents are ungoverned; add a row when a boundary proves load-bearing.
5. **Warn-only first.** `mode:"warn"` logs every would-be violation to `docs/graph/logs/authz.log` and **never blocks** — a safe trial against real builds to harvest false positives before arming. Flip `mode:"enforce"` (matched deny → `exit 2` + reason to the model) only after a clean trial. Currently **warn**.
6. **Fails OPEN by design.** Any internal error (unparseable payload, missing/broken policy, log-write failure) → allow. A flaky authz script must never freeze a build; this is defense-in-depth over a cooperative system, not a security airlock.

## Consequences
- **Role separation becomes guaranteed, not aspirational** — once in enforce, a reviewer literally cannot mutate, devops literally cannot corrupt app source, a builder literally cannot rewrite a spec, regardless of what the model "decides."
- **One source, no drift** — boundaries live in one JSON + one mirror table, switched on `agent_type`; adding a boundary is a one-row edit (same win as ADR-0019).
- **Honest limits:** Bash blocking is a tripwire, not a wall; the strong lock is on write tools. `main` protection remains git/settings-level. Fail-open means the hook is a safety net, not a sandbox.
- **Rollout risk owned:** warn-only defers any build-stalling false positive to a safe observation window; the log is the tuning input before enforce.
- Files: `.claude/hooks/agent-authz-policy.json`, `.claude/hooks/agent-authz.mjs`, `settings.json` (PreToolUse), `harness.config.md` (Agent Authorization section). Log is git-ignored under `docs/graph/logs/`.

## Follow-ups
- Run the warn-only trial across a LIST/DUE/PROF build; review `authz.log`; tune globs + Bash patterns against any false positives (e.g. a reviewer legitimately redirecting to `docs/graph/logs/`).
- Then flip to `enforce` and confirm builds stay green.
- Consider later rows: `librarian`/`architect` boundaries, `orchestrator` → deny feature-code writes — only if warn-data shows they're needed.
