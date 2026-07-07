---
title: Feature Spec — Compaction Resilience (Structured State Checkpoint)
status: ready-to-implement
created: 2026-06-22
applies-to: the engineering harness (.claude/)
target-executor: a fresh Claude Code session with the harness already loaded
related: tool-output-bounding.feature.md (same philosophy — durable truth in files, lean disposable context)
---

# Feature: Compaction Resilience — Structured State Checkpoint

> **For the executing session:** This is a complete implementation spec, not a patch. Your harness
> may have drifted — implement the **intent and the canonical shape**, adapting file names/paths to
> the harness as it exists. `harness.config.md` is the single source of truth; the snapshot SHAPE is
> defined once and referenced, never duplicated.

---

## 1. Problem

The agent's working memory (task spec, what it built, which gates passed, error strings, decisions)
lives in the **context window**, which has a hard size limit. When a session gets long, Claude Code
**auto-compacts**: it summarizes everything so far, discards the original detail, and continues from
the summary. **We do not control what the summary keeps** — the compactor decides.

This is tolerable in `human-gated` mode (a human is watching). It is **dangerous in
`auto-until-development`**, where the orchestrator walks the task graph unattended for a long time —
which is exactly when compaction fires. A free-form summary can silently drop:
- the spec's acceptance criteria,
- which of the 7 gates already passed,
- the exact error string being fixed (`tasks.service.ts:84 — TypeError ... 'toISOString'`),
- the precise file path under edit.

The agent then resumes with fuzzy notes: it re-does work, or believes a gate passed when it did not.
**Silent amnesia mid-run.** We cannot replace Claude Code's compactor, so we (1) **bias** it toward
keeping the right things, and (2) **keep the load-bearing state in a file** so the conversation
memory becomes disposable.

This is the same philosophy as `tool-output-bounding.feature.md`: **durable truth on disk, context
lean and disposable.**

---

## 2. Goal & Non-Goals

### Goal
A long unattended run survives compaction (and crashes, restarts, `/clear`) with zero loss of
critical state. Two mechanisms:
- **Part 1 — Bias the compactor:** a fixed structured summary shape + a "preserve exact
  paths/commands/errors" rule, so even an auto-generated summary keeps the essentials.
- **Part 2 — Durable checkpoint (stronger):** the orchestrator proactively writes the same
  structured state to a file at safe moments, so the truth never depended on the summary at all.

### Non-Goals (do NOT do these)
- **Do not** try to replace, intercept, or re-implement Claude Code's compaction algorithm — we
  cannot, and emulating opencode's loop-level `context-epoch` machinery from a config layer is
  cargo-culting. We bias and back-up; we do not rebuild.
- **Do not** turn `STATUS.md` into a dumping ground — the checkpoint is **terse, current state
  only**, not a transcript. (See §6.)
- **Do not** duplicate the snapshot shape into multiple files — define it once; reference it.
- **Do not** write checkpoints so often it adds noise — write at the defined safe moments (§4.3),
  not on every token.

---

## 3. Design Principles
- **The durable truth lives in a file, not in the conversation.** Conversation memory is disposable.
- **Named slots beat free prose.** A template with labeled sections is where detail survives;
  free-form summaries are where it leaks.
- **Verbatim, not paraphrased.** Exact file paths, commands, error strings, identifiers, gate
  verdicts — copied, never summarized into vagueness. (This single rule does most of the work.)
- **Write before the crunch, not during it.** Proactive checkpoints at safe moments beat hoping the
  compactor does well under pressure.
- **Resume is automatic.** On session start/resume the checkpoint is surfaced, so the agent
  re-grounds itself without being told.

---

## 4. The Canonical Pattern

### 4.1 The state shape (define ONCE — derived from opencode's compaction template)
The canonical run-state shape. Store it as a fenced template in `harness.config.md` and reference it
everywhere:

```markdown
## Goal
- [single sentence: the task currently in flight, e.g. "TASK-013: tasks update endpoint"]

## Constraints & Preferences
- [spec acceptance criteria, user rules, harness gates that apply — or "(none)"]

## Progress
### Done
- [completed steps / gates passed, e.g. "gates 1–4 (typecheck/lint/unit/build) GREEN"]
### In Progress
- [current step, e.g. "gate 5 (e2e) — fixing failure"]
### Blocked
- [blockers, or "(none)"]

## Key Decisions
- [decision + why, e.g. "completedAt set in service, not DB default — spec §4.2"]

## Next Steps
- [ordered actions, e.g. "1. fix auth redirect in login flow  2. re-run e2e  3. PR"]

## Critical Context
- [exact errors / open questions / facts — VERBATIM:
   "e2e fail: login.spec.ts:22 expected /dashboard got /login (302 loop)"]

## Relevant Files
- [path: why it matters, e.g. "apps/api/src/tasks/tasks.service.ts:84 — bug site"]
```

**Rules (carry these verbatim wherever the shape is used):**
- Keep every section, even when empty (`(none)`).
- Terse bullets, not prose paragraphs.
- **Preserve exact file paths, commands, error strings, and identifiers** — copy, don't paraphrase.
- Do not narrate the compaction/checkpoint process itself.

### 4.2 Where the durable checkpoint lives
**Recommended:** a dedicated file `docs/graph/CHECKPOINT.md` holding the **live run state** in the
shape above (current in-flight task + gate state + next step + errors). Keep `STATUS.md` as the
**graph-wide board** (per-task statuses across modules) it already is. Rationale: separation of
concerns — the board is durable per-task truth maintained by `task-graph`/librarian; the checkpoint
is volatile per-run truth maintained by the orchestrator. Mixing them risks the drift you already
guard against.

> If you prefer to honor the original instinct of "enrich STATUS.md," add the shape as a clearly
> delimited `## Active Run Checkpoint` section at the TOP of `STATUS.md` instead of a separate file.
> Either works; pick one and reference it from config — do not maintain both.

### 4.3 When the orchestrator writes the checkpoint (safe moments)
Write/overwrite `CHECKPOINT.md` at these points in the `/build` loop — proactively, before context
grows large:
- After **branch creation** (task started).
- After **each gate result** (pass or fail) — capture which gates are green and any failure verbatim.
- **Before starting a new task** in a batch/auto run.
- Before any **long operation** (full build, e2e suite, devops scan).
- On **escalation** (5 failed loops / coherence can't PASS) — checkpoint is the human's evidence.
- On **task `done`** — clear the in-flight checkpoint (or mark "idle — next runnable: TASK-014").

It is **one overwrite of a small file**, not an append log — always reflects *current* state only.

### 4.4 Surfacing on resume
The harness already has a `SessionStart` hook that `cat`s `STATUS.md`. Extend it to also surface the
checkpoint so a resumed/compacted session re-grounds automatically (see §5.4).

---

## 5. Implementation — file by file

### 5.1 `harness.config.md` — add the shape + policy (single source of truth)
Add a section **Compaction Resilience / Run Checkpoint**:
- Embed the §4.1 state shape (fenced) + its rules.
- State the policy: *"In any compaction, summary, or handoff, produce exactly this shape and
  preserve exact paths/commands/errors verbatim. The orchestrator additionally writes this shape to
  `docs/graph/CHECKPOINT.md` at the safe moments below."*
- List the §4.3 safe moments.
- Note: checkpoint location = `docs/graph/CHECKPOINT.md` (or the STATUS.md section, per §4.2).

### 5.2 `CLAUDE.md` — Part 1, bias the auto-compactor
Add a short standing instruction (this is what auto-compaction reads when it fires):
> **When compacting or summarizing context, output exactly the Run Checkpoint shape defined in
> `.claude/harness.config.md` and preserve all exact file paths, commands, error strings, and
> identifiers verbatim. Never paraphrase an error into a vague description.**

Keep it brief — `CLAUDE.md` is always in context; reference the shape in config, don't inline the
whole template twice.

### 5.3 `agents/orchestrator.md` — Part 2, write the durable checkpoint
In the `/build` loop playbook, add a **Checkpoint** step:
- After each safe moment (§4.3), overwrite `docs/graph/CHECKPOINT.md` with the current run state in
  the canonical shape, copying gate verdicts and any error strings **verbatim** from the
  `gate-runner` JSON (which, per `tool-output-bounding.feature.md`, already carries structured
  `file`/`error`/`coverage`).
- On task `done`, reset the checkpoint to the next runnable task (or "idle").
- Treat the checkpoint as the resume contract: on Boot, **read `CHECKPOINT.md` first** — if it shows
  an in-flight task, resume from its "Next Steps" rather than restarting the task.

### 5.4 `settings.json` — extend the SessionStart hook
The existing hook:
```json
"command": "cat \"$CLAUDE_PROJECT_DIR/docs/graph/STATUS.md\" 2>/dev/null || true"
```
Extend to also surface the checkpoint:
```json
"command": "cat \"$CLAUDE_PROJECT_DIR/docs/graph/CHECKPOINT.md\" \"$CLAUDE_PROJECT_DIR/docs/graph/STATUS.md\" 2>/dev/null || true"
```
So a resumed (and post-compaction) session re-grounds on the live run state automatically.

### 5.5 (Recommended) `settings.json` — add a `PreCompact` hook (most reliable form of Part 1)
A `PreCompact` hook fires at the moment compaction triggers — the most reliable place to reinforce
the required summary shape (more reliable than `CLAUDE.md` alone, which competes with everything else
in context). Add a hook that re-injects the checkpoint-shape instruction right before compaction:
```json
"PreCompact": [
  { "matcher": "auto|manual",
    "hooks": [ { "type": "command",
      "command": "echo 'Before compacting: output the Run Checkpoint shape from .claude/harness.config.md; preserve exact file paths, commands, error strings, and identifiers verbatim.'" } ] }
  ]
]
```
> Verify the exact `PreCompact` hook contract in your Claude Code version (matcher values and how
> hook stdout is injected into the compaction). If `PreCompact` is unavailable, Part 1 via
> `CLAUDE.md` (§5.2) + Part 2 (§5.3) still cover the case — the durable checkpoint is the real safety
> net regardless.

### 5.6 `agents/librarian.md` + `.gitignore`
- `CHECKPOINT.md` is volatile run state, not durable project history → add `docs/graph/CHECKPOINT.md`
  to `.gitignore` (the per-task durable truth is `STATUS.md`/`modules.json`, which stay committed).
- No librarian indexing of the checkpoint needed; it is ephemeral.

---

## 6. Edge Cases & Rules
- **Checkpoint is current-state-only**, not a transcript — always overwrite, never append.
- **Verbatim or it's worthless** — an error paraphrased to "there was a date bug" defeats the point;
  copy `tasks.service.ts:84 — TypeError: cannot read 'toISOString'` exactly.
- **Gate state is the highest-value field** — always record which of the 7 gates are green and the
  exact failure of any red one, so a post-compaction agent never re-claims a false pass.
- **Parallel groups** — when ≥2 task branches run at once, the checkpoint records each branch's state
  under its own task-id (the shape repeats per active task).
- **Crash / `/clear` / restart** — same recovery path as compaction: the SessionStart hook surfaces
  `CHECKPOINT.md`, the orchestrator resumes from "Next Steps." No special handling.
- **Empty sections** stay as `(none)` — never omit a section.
- **Don't double-store** — pick `CHECKPOINT.md` *or* a STATUS.md section, not both.

---

## 7. Acceptance Criteria (how the executing session verifies "done")
1. `harness.config.md` contains the Run Checkpoint shape + rules + the safe-moment list, defined once.
2. `CLAUDE.md` has the compaction-bias instruction referencing that shape (not re-inlining it).
3. `orchestrator.md` writes/overwrites the checkpoint at the §4.3 safe moments and reads it first on
   Boot to resume in-flight work.
4. The `SessionStart` hook surfaces `CHECKPOINT.md` (and `STATUS.md`).
5. (If supported) a `PreCompact` hook re-injects the shape instruction at compaction time.
6. `docs/graph/CHECKPOINT.md` is git-ignored; `STATUS.md`/`modules.json` remain committed.
7. **Smoke test:** start a task, get 3–4 gates green, then force compaction (`/compact`) mid-task.
   Confirm the agent resumes from the checkpoint — knows which gates were green, the exact pending
   failure (file:line + error), and the next step — **without** re-running passed gates or losing the
   spec. Bonus: `/clear` and confirm the SessionStart hook re-grounds it identically.

---

## 8. Rollout Order (lowest risk first)
1. Add the shape + policy to `harness.config.md` (no behavior change — just the definition).
2. Add the `CLAUDE.md` bias instruction (Part 1 — cheap, immediate).
3. Add the orchestrator Checkpoint step + Boot-read (Part 2 — the real safety net).
4. Extend the `SessionStart` hook; add `.gitignore` entry.
5. Add the `PreCompact` hook if supported.
6. Run the §7 smoke test (force compaction mid-task) and confirm clean resume.

---

## 9. One-line rationale (for the changelog/PR body)
> Auto-compaction during long `auto-until-development` runs could silently drop the task spec, gate
> state, or the exact error being fixed — causing the agent to re-do work or claim a false pass. This
> adds a fixed structured state shape (biasing the compactor to keep exact paths/commands/errors) and
> has the orchestrator write that state to `docs/graph/CHECKPOINT.md` at safe moments, surfaced on
> resume — so the durable truth never lived in the fragile conversation memory. Mirrors opencode's
> structured compaction template; the checkpoint file is the config-layer stand-in for its durable
> context epoch.
