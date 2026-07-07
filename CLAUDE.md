# {{APP_DISPLAY_NAME}} — Engineering Harness

> Loaded every session. Keep it tight. The single source of truth is `.claude/harness.config.md`.
>
> **Target codebase:** the React Native app in `mobile/`. The harness plans and builds the **mobile** app;
> gate commands run inside `mobile/`.

@.claude/harness.config.md
@docs/context/overview.md
@docs/context/conventions.md

## How we work (non-negotiable)
- **Ask the architect before coding anything non-trivial.** Plans/specs precede implementation: `/intake` (PRD + feature sheet) → `/scope` → `/module` → `/build`.
- **Requirements are traceable.** Every feature in `docs/requirements/features.csv` maps to a module → task → spec, tracked in `docs/requirements/TRACEABILITY.md`. Never drop a feature silently.
- **ClickUp is the live mirror.** `/scope` + `/module` create the Lists/Tasks; `/build` syncs status (In Progress → In Review → Complete). The harness is the source of truth; PM sync is best-effort and never blocks a build.
- **One task = one branch = one PR.** Branch `feat/<module>-<task-id>` off `development`; PRs target `development`. **Never touch `main`** (no branch-from, commit, push, or merge) unless the human explicitly asks in that request.
- **Never merge without passing every gate.** The orchestrator runs the loop until green. **Merge timing is mode-driven** (`AUTONOMY_MODE` in `harness.config.md`): `human-gated` = merge only on explicit human go (default); `auto-until-development` = auto-merge green PRs into `development` and walk the runnable graph unattended. **Either way, gates are never skipped, `main` is never touched, and production (app-store release) is never shipped without an explicit human instruction.**
- **Reviewers are READ-ONLY — and run CONCURRENTLY.** The READ-ONLY reviewers are `security-reviewer`, `code-reviewer`, `mr-reviewer`, **and the coherence-mode reviewers (`architect` + `security-reviewer` when running the coherence review)** — they never edit source, they emit findings; builders fix. The per-task **security + code-review** gates are independent, so the orchestrator dispatches them **in parallel** (one message, two Agent calls); likewise the coherence review's **architect + security-reviewer**. One review pass, not two. (Note: read-only is a role contract here — only some of these agents are *tool*-restricted; the architect in coherence mode still inherits write tools, per HARNESS-AUDIT #7.)
- **Always run the librarian after a task — but batch the full Graphify rebuild to the module edge.** Per task: update context docs + specs + task graph (the post-commit hook keeps the fast AST graph live). The expensive full semantic rebuild (`/graphify ./mobile`) runs **once per module** at the coherence boundary, not per task — the next task still starts smarter without N redundant rebuilds. The librarian also **promotes recurring review findings into executable checks** — a finding the code-reviewer tags `[promote]` becomes a lint/grep/test guard with a fix-message, so a class caught once is enforced on every commit, not only when a reviewer notices (ADR 0029).
- **Ground in Graphify before touching code.** `graphify query/explain/path` — don't blind-read files.
- **Boot from the Context Manifest, never a hand-listed file set.** Every agent loads its startup context via the single keyed table in `harness.config.md` → **Context Manifest** (one source of truth: what-to-read · who-reads-it · what-a-missing-source-means). Add a shared doc **once, there** — never restate per-agent read-lists (that's how an agent goes silently blind). Respect the `if absent` column: a **pending** source is *not-yet-built* (proceed; preserve last-known truth) — in particular, an empty `graphify-out/` means **"graph not built yet," NOT "this project has no code"** (verify against the real tree — `mobile/src` — before ever concluding greenfield).
- **Bound verbose tool output — protect the context window.** Any agent-issued command that can emit large output (tests, build, `npm audit`, lint, graphify) writes its full output to an ephemeral log under `docs/graph/logs/` and surfaces only a structured verdict + bounded head+tail preview + the log path (the **`output-bounding`** skill; params in `harness.config.md`). Same signal, a fraction of the tokens — this is what keeps `auto-until-development` runs from premature compaction. Never paste a multi-thousand-line gate/scanner dump into the conversation.
- **Survive compaction — keep run-state in a file, not just the chat.** When compacting, summarizing, or handing off context, output **exactly** the Run Checkpoint shape defined in `harness.config.md` → Compaction Resilience and preserve all exact file paths, commands, error strings, identifiers, and gate verdicts **verbatim** (never paraphrase an error into a vague description). The orchestrator also writes that shape to `docs/graph/CHECKPOINT.md` at safe moments and re-reads it on Boot — so a long `auto-until-development` run's load-bearing state never lives only in fragile conversation memory.
- **Two graphs, never conflated:** `docs/graph/` = task/build orchestration; `graphify-out/` = codebase knowledge graph.
- **Simplify the harness, don't only grow it.** It has an additive bias — every audit adds machinery and nothing removes it. Once per module the simplification pass ablates one stale candidate against the next module's gates and removes it if nothing degrades (`harness.config.md` → Harness Maintenance; watchlist `docs/context/harness-debt.md`; ADR 0028).

## Definition of Done (EVERY active gate must pass) — run inside `mobile/`
1. **Typecheck** — `npx tsc --noEmit` clean (TS strict mode is on)
2. **Lint** — `ESLINT_USE_FLAT_CONFIG=false npx eslint . --max-warnings=0` clean (incl. `eslint-plugin-boundaries`)
3. **Unit + coverage** — `npm test -- --coverage` (Jest) all green; **≥80% lines on changed files, ≥70% global** — ✅ **ACTIVE (ADR 0016; LOCAL only when `ciTier: lean` — ADR-0038)**
4. **Build** — native build succeeds LOCALLY: Android `cd android && ./gradlew assembleDebug` (iOS `xcodebuild` on macOS per `platforms`). **CI has no build job when `ciTier: lean`** (ADR-0038) — the local build IS the gate.
5. **E2E** — **Maestro** device flows (`mobile/.maestro/`, runner `scripts/e2e.sh`; ADR-0037) — **NOT per-task**: runs **once per module, LOCAL ONLY** as a Module-DoD gate (ADR 0016). **Never in CI** (ADR 0012).
6. **Security** — no **High/Critical** findings open (`npm audit` + security-reviewer)
7. **Code review** — verdict **APPROVE** (a blocking nit fails the gate)

> ✅ **Gate cadence (ADR 0016, amends 0013; ADR-0038):** per-task active gates = **Typecheck · Lint · Unit+coverage · Build · Security · Code-review** — all **evaluated LOCALLY** by the gate-runner. **CI is the LEAN tier** (root `.github/workflows/ci.yml`: typecheck · lint · promoted guards · traceability · token bridge — **no build/unit/E2E jobs**; Project Profile `ciTier: lean`). **E2E**: once per module, locally (blocking Module DoD) + pre-release — never in CI. Capabilities are switched in `harness.config.md` → **Project Profile** (resolved by `/setup`; release hardening = **advisory** until the human flips it).

A task is NOT done until ALL active per-task gates pass. The loop auto-repeats on any failure (cap **5** iterations → escalate to human).

**Module DoD (anti-drift, system-level):** when a module's last task is done, **two module-edge gates run** before the module is complete — the **coherence review** (architect + security-reviewer, READ-ONLY — emergent cross-module drift: API-shape drift, inconsistent authz, data-model conflicts, broken assumptions, inherited spec gaps) **and the local E2E gate** (`e2e-automator` drives the assembled flows on a device/emulator, once per module, NOT in CI; verdict recorded in the coherence report). A module is DONE only when: all task gates green ∧ coherence review **PASS** ∧ **local E2E green** ∧ human integration go. Full E2E is also a mandatory local gate before `development → main`. See `harness.config.md` → "Module Definition of Done".

## GIT_PLATFORM = github
- Vocabulary: **Pull Request (PR)**, `gh` CLI. (Not MR/glab.)
- **Integration branch: `development`** — feature branches merge here via `gh pr merge --squash` on human go (auto-merge OFF).
- **Release branch: `main`** — protected. NEVER branched-from, committed-to, pushed-to, or merged-into without an explicit human instruction. `development → main` only on request.

## Entry points
- `/setup` — one-time project preflight: env checks + resolve the **Project Profile** (every capability switch, asked once — incl. release-hardening enforce/advisory) + **prune** OFF-switch machinery so the harness stays lean (ADR-0038). Run before `/scope`.
- `/intake` — ingest PRD (.docx) + feature list (.xlsx/.csv) → requirements digest + traceability
- `/scope` — module breakdown (architect interrogates you)
- `/module <name>` — specs + task graph for a module
- `/spec <task-id>` — refine/inspect one spec
- `/build <task-id|module|group>` — run the SDLC loop
- `/coherence <module>` — module-boundary coherence review (system-level Module DoD)
- `/review <branch|pr>` — security + code + PR review
- `/harness-sync` — librarian re-scan + Graphify rebuild
- `/clickup-sync` — mirror the task graph into ClickUp + reconcile statuses

## Agents (`.claude/agents/`)
orchestrator · architect · frontend · design · unit-tester · e2e-automator · security-reviewer · code-reviewer · mr-reviewer · librarian · design-reviewer _(opt-in taste pass — Design Profile `tasteReviewer: on`)_

> **Stack note:** this is a **frontend-only React Native client** (consumes a remote backend API). There is no backend/DB/DevOps capability in this harness (removed — ADR 0036); `frontend` owns RN/NativeWind screen+component work. If a backend module is ever scoped, re-add those roles then.
