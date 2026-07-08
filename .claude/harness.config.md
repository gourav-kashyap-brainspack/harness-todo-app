---
title: Harness Config — Single Source of Truth
status: active
created: 2026-06-30
project: Todo App
---

# Harness Configuration

> This file is the **single source of truth** for the engineering harness.
> Every agent reads it FIRST. Change values here, never in scattered docs.
>
> ✅ **Target stack = React Native** (the `mobile/` app). All gate commands below run **inside `mobile/`**.
> The framework majors named here are descriptive of the *current pins* — the Dependency Version Policy still
> governs any new install (resolve current stable, don't recall).

## Project
- **Name:** Todo App
- **Purpose:** React Native (iOS + Android) client. A cross-platform to-do / task-management app — create, organize, complete, filter, and track tasks. — a frontend-only client consuming a remote backend API.

## Tech Stack
> The harness's target stack. **Target = the `mobile/` React Native app** (frontend-only client; no backend/DB in this repo).

| Layer | Choice |
|---|---|
| Platform | **React Native 0.75** (RN CLI, not Expo) + React 18.3 + TypeScript 5 (**strict mode on**) — app at `mobile/` |
| Styling | **NativeWind 4** (Tailwind CSS 3.4 for RN) — tokens in `tailwind.config.js` + `global.css`; theme in `mobile/src/theme` |
| Navigation | **React Navigation 6** — `native-stack` + `bottom-tabs` (in `mobile/src/app/navigation`) |
| State | **TanStack React Query 5** (server state) + **Zustand 5** (UI state) — `mobile/src/core/store` |
| Forms / validation | **React Hook Form 7** + **Zod 3** (`@hookform/resolvers`) |
| API client | **Axios 1.7** (`mobile/src/core/api`) against the remote backend API; `jwt-decode`, `date-fns` |
| Secure storage | `react-native-keychain` + `react-native-mmkv` |
| Backend / Database | **None** — this is a frontend-only client that consumes a remote backend API. No backend/DB/DevOps capability in this harness (ADR 0036). |
| Unit tests | **Jest** (`preset: react-native`) + `react-test-renderer` |
| E2E tests | **Maestro** (device/emulator flows) — SET UP (ADR-0037). Flows in `mobile/.maestro/*.yaml`; runner `mobile/scripts/e2e.sh`; CLI `~/.maestro-cli/maestro/bin/maestro` (2.6.1). Android emulator (iOS pending a full Xcode toolchain). Module-edge, local-only, never CI. *(Playwright is web-only and does NOT apply.)* |
| Lint / format | **ESLint 8** (legacy config — `ESLINT_USE_FLAT_CONFIG=false`, `@react-native/eslint-config` + `eslint-plugin-boundaries`) + Prettier 2.8 |
| Native build | Android: `cd android && ./gradlew assembleDebug` (Gradle, Java 17) · iOS: `xcodebuild` (CocoaPods, macOS only) |
| Package manager | **npm** — installs use **`npm ci --legacy-peer-deps`** (RN peer-dep graph). NOT pnpm. |
| CI | GitHub Actions at **repo-root** `.github/workflows/ci.yml` (ADR-0038; GitHub only reads the root — never `mobile/.github/`) — **LEAN tier by default**: typecheck · lint · promoted guards · traceability · Layer-0 token bridge. **No native build, no unit suite, no E2E in CI** — those are LOCAL gates (Project Profile `ciTier`). |

**Repo layout (single app, feature-sliced):** `mobile/src/app` (navigation + providers) · `mobile/src/core` (api · config · hooks · lib · services · store · types) · `mobile/src/features/{auth,…}` · `mobile/src/components/ui` · `mobile/src/platform` · `mobile/src/theme`. Native projects in `mobile/android` + `mobile/ios`. Path alias `@/* → mobile/src/*`.

> **`eslint-plugin-boundaries` is load-bearing:** the import-boundary rules enforce the `app → features → core/components` layering. The lint gate runs with `--max-warnings=0`, so a boundary violation is a **hard fail** — respect the layer direction.

## Dependency Version Policy (always current stable — resolved live, never from memory)
Applies to **every** dependency install in **any** task (app deps, dev tooling, native build tooling, GitHub Actions).
- **Resolve the current STABLE version from the source of truth at build time** — never from training-memory defaults (which trend stale). For npm: `npm view <pkg> version` (latest) / `npm view <pkg> dist-tags`. For Actions: the registry, pinned by SHA. Optionally cross-check via **Context7**.
- **⚠️ React Native exception — do NOT blindly bump RN-ecosystem deps to "latest".** React Native, `react`, and the `react-native-*` / `@react-native*` / `@react-navigation/*` packages are tightly coupled to the installed **RN 0.75** version. Adopt versions **compatible with the current RN major**, not the newest published — the RN upgrade is its own deliberate, human-reviewed task (use the RN Upgrade Helper). This overrides the generic "current stable" default for the RN-coupled packages only.
- **Stable only:** exclude prereleases (`alpha`/`beta`/`rc`/`canary`/`next`/`dev`/`-0`). Use the highest stable.
- **Pin what you resolve:** exact version (or caret per ecosystem norm) in `package.json`; commit `package-lock.json`; record resolved versions + date in `docs/context/stack.md` (librarian).
- **Upgrades of an existing pin** (a live project): patch/minor are safe to take, **majors are human-reviewed** (RN-coupled majors especially — see the RN exception above); Dependabot keeps pins fresh after.
- **Surgical adds (don't re-resolve the world):** to add a dep mid-branch use **`npm install <pkg> --legacy-peer-deps`** — keep the `package-lock.json` diff limited to the deps you intended; do not let an unrelated transitive re-resolve and break a gate.

## Git Platform
- **GIT_PLATFORM:** `github`
- **Vocabulary:** Pull Request (**PR**), `gh` CLI
- **Integration branch:** `development` — all feature branches branch off it and merge back into it.
- **Release branch:** `main` — **protected. NEVER branched from, committed to, pushed to, or merged into without an explicit human instruction.** Releases flow `development → main` only when the human asks.
- **Branch per task:** `feat/<module>-<task-id>` off `development`.
- **Rule:** every task → one branch (off `development`) → one PR (base = `development`) → AI review before merge.

## Design Profile (UI capability — the control panel)
> The harness is a **product configured per project**; this is the switch set the `design` / `frontend` / `e2e-automator` agents read. Scope is **comprehensive: every capability ON except multi-brand** (decision of record: `docs/research/ui-frontend-design/00-product-framing.md` → 🔒 LOCKED SCOPE; ADRs **0025–0027**). Defaults live here; override per project (or per `/build`, one-shot) the way `AUTONOMY_MODE` is.

- **Design source of truth:** **code** — the **NativeWind/Tailwind tokens** in `mobile/tailwind.config.js` + `mobile/global.css` + `mobile/src/theme`, and the owned RN components in `mobile/src/components/ui` (`.tsx`). Figma / Claude Design / token pipeline are best-effort **mirrors** (ADR-0027), never build-blocking. The reference design system lives in `mobile/MOBILE_DESIGN_SYSTEM.md`.
- The `design` agent owns the tokens + `docs/context/design-system.md` (intent + anti-patterns/banned-defaults) + per-task visual specs; `frontend` implements (RN/NativeWind); `e2e-automator` runs the module-edge visual checks **on a device/emulator** (Detox/Maestro), not in a browser.

**Switches (defaults = the locked comprehensive scope):**
| Field | Values | Default | Drives |
|---|---|---|---|
| `designSource` | scratch · full-figma · partial-figma | **scratch** | intake path (Figma import lights up when a Figma file exists) |
| `designTool` | none · claude-design · figma | **none** | whether the Claude Design / Figma mirror is wired (needs a login / a file) |
| `taste` | on · off | **on** | distinctive aesthetic at genesis (harvested guidance; `frontend-design` plugin optional) |
| `tokenConsumers` | single · multi | **single** | the token pipeline (generate-with-a-guard) |
| `brands` | single · multi | **single** | multi-brand theming — the ONE capability OFF / switch-only |
| `visualRegression` | off · +pixel-local | **off** | on-device screenshot regression (Detox/Maestro), LOCAL only, never CI — deferred until the RN E2E harness is set up |
| `tasteReviewer` | off · on | **off** | the agent-judged design-review pass (local, capped iterations) |

**CI-seconds rule (hard):** a check runs in CI **only if it finishes in seconds** → off-system-color lint · responsive checks · bundle budget · vendor-quarantine grep. **Everything heavier runs LOCAL only** → on-device screenshots · the AI design critic · all design-tool sync (Figma / Claude Design / token generation). ADR-0012 (no slow/E2E checks in CI) holds.

## Project Profile (per-project capability switches — ADR-0038)
> The generalization of the Design Profile to **every** capability: one keyed table, resolved **once per project** by the **`/setup`** preflight (`.claude/skills/setup/SKILL.md`), consumed by gate-runner (active gates), orchestrator (Module-DoD composition, CI expectations), and CI. **After the questions are answered, `/setup` runs a PRUNE pass:** machinery behind an OFF switch is removed/disabled (CI jobs, skills, agent dispatch steps, always-loaded prose) and logged to `harness-debt.md` — the harness a project runs is only the harness it uses. Change a value here → re-run the matching prune/enable step; never leave a switch and its machinery disagreeing. **The `Default` column is the template default; `/setup` confirms/overrides it per project.**

> **This project resolved 2026-07-07** (by varunprashar35@gmail.com, via `/setup`). Answered switches: `platforms=both`, `AUTONOMY_MODE=human-gated`, `releaseHardening=advisory`, `offlineTier=read-cache`; all others took template defaults. See `docs/graph/SETUP-COMPLETE.md`.

| Switch | Values | **This project** | Default | Drives |
|---|---|---|---|---|
| `platforms` | android · ios · both | **both** ✅ answered | both | build-gate targets, E2E/visual platforms, CI jobs, plist/gradle checks |
| `ciTier` | lean · standard · full | **lean** (default) | lean — typecheck · lint · promoted guards · traceability · token bridge ONLY | root `ci.yml` job set. `standard` adds the unit suite; `full` adds native build. Never E2E (ADR-0012). |
| `unitGate` | on(lines/branches) · off | **on (80/70)** (default) | on — LOCAL per-task + module edge; **not in CI** when `ciTier: lean` | gate-runner step 3, jest floor |
| `buildGate` | local · local+ci | **local** (default) | local — per-task via gate-runner (JS-only short-circuit); full assembleDebug at module edge | gate-runner step 4, CI android/ios jobs |
| `e2eGate` | on · off | **on** (default) | on — module-edge, LOCAL only, never CI (ADR-0012/0018) | Module-DoD step 3, e2e-automator dispatch |
| `visualParity` | mockup · pixel-only · off | **mockup** (default) | mockup (= Design Profile `visualRegression`; module-edge, local; Layer-0 token bridge is the only CI-side piece) | visual-parity skill |
| `releaseHardening` | advisory · enforced | **advisory** ✅ answered | ask | `advisory` = hardening items (SSL pin values, ProGuard/R8, Hermes, release keystore, jail-monkey, plist keys) are a release-lane CHECKLIST, not a gate. Any `development → main` request re-asks whether to flip to `enforced`. |
| `offlineTier` | none · read-cache · full-queue | **read-cache** ✅ answered | read-cache — persistQueryClient + MMKV persister (Tier-1 pattern); never build `full-queue` unprompted | spec Offline section, Tier-1 pattern, offline flow tier |
| `perfBudget` | on · off | **off** (default) | off in lean CI; Hermes/ProGuard checks live in the advisory release checklist | CI bundle job |
| `intakeMode` | full-upfront · incremental | **full-upfront** (default) | ask — `incremental` lights up a thin `/require <text>` entry point (input-gated) | intake path |
| `timeTracking` | on · off | **on** (default) | on — see Time Tracking & ETA below | estimate/startedAt/doneAt fields, ETA table |
| `telemetryDashboard` | on · off | **on** (default) | on — see Telemetry Dashboard below | `--dashboard` writes at safe moments |

## Time Tracking & ETA (ADR-0038) — active when `timeTracking: on`
- **Schema (in `docs/graph/modules.json` tasks):** `estimate` (hours; architect sets at `/module`, mapping S=2 · M=4 · L=8 until real actuals exist) · `startedAt` · `doneAt` (ISO timestamps).
- **Stamps:** orchestrator sets `startedAt` when flipping a task to `in-progress` (it already writes STATUS.md there) and `doneAt` at task `done`; the run-ledger merge `ts` corroborates. Duration is **derived** — no new files.
- **Forecast:** at batch start (`/build <module>` / `all`) the orchestrator prints an ETA table — remaining runnable tasks × **historical median duration per complexity class** (from the ledger + `startedAt`/`doneAt`; fall back to `estimate` until ≥3 actuals), respecting parallelGroups — and re-prints at each task boundary. Carry one `## ETA` line in `CHECKPOINT.md`. Estimate-vs-actual drift per class is a signal the architect reads at the next `/module`.

## Telemetry Dashboard (ADR-0038) — active when `telemetryDashboard: on`
- **Command:** `node .claude/scripts/telemetry-report.mjs --dashboard` → overwrites `docs/graph/telemetry/DASHBOARD.md` (compact: totals · current-branch cost · per-agent top rows · last-5 task table · the CHECKPOINT `## ETA` line). Full report stays `/harness-report` (on demand).
- **Cadence:** the orchestrator invokes it at the **same safe moments it writes CHECKPOINT.md** (after each gate result · task boundary) during auto runs — one node invocation, no daemon, fail-soft (a telemetry failure never blocks a build). Attribution keys by task branch; join to task-id via `modules.json`. At merge time, stamp the ledger entry with `tokensBillable`/`costUsd` when the dashboard run computed them (durable per-task cost history).

## Open-Question Batching (ADR-0038) — autonomy-friendly OQs
- **`/module` exit rule (architect):** after writing all the module's specs, consolidate EVERY unresolved OQ across them into **one** batched `AskUserQuestion` session (grouped by theme, your recommendation first) — one interrogation, not N drips.
- **`/build <batch>` boot rule (orchestrator):** before an autonomous walk starts, scan all target specs for unchecked OQs + unresolved `OQ-*` coordination items (STATUS.md registry) and surface them in **one** confirmation — "resolve these N now, or I skip the affected tasks and walk the rest." An autonomous run never stalls mid-walk on a question.

## Lean Execution — token-efficiency rules (ADR-0038; the harness must not eat the window)
The harness's own context/token discipline, consolidated (mostly pointers — details live in the named mechanisms):
1. **Output bounding is mandatory** for every verbose command (`output-bounding` skill; params above). Never paste a multi-thousand-line dump into the conversation.
2. **Graphify rebuild once per module** (module edge), never per task; per-task librarian = docs-only. Ground via `graphify query/explain/path` — never bulk-read the graph or blind-read file trees.
3. **Load context via the Context Manifest keys** — agents never paste doc bodies into subagent prompts; hand paths/keys + the task-id, let the subagent read its own rows.
4. **Overwrite, don't append**, for run-state (`CHECKPOINT.md`, `DASHBOARD.md`) — one small file each; append-only files (`run-ledger.jsonl`) are read via the helper (`tail`), never whole.
5. **CI is lean** (`ciTier: lean`) — no runner re-does what local gates proved; no giant CI logs to re-ingest.
6. **Always-loaded prose has a budget:** every addition to `CLAUDE.md`/this file competes with task context. New always-on prose needs to earn its lines; the ADR-0028 simplification pass ablates the stale (bias the cut toward always-loaded prose first).
7. **`/setup` prunes:** OFF-switch machinery is removed, not carried — dead skills/jobs/prose are token debt.
8. **Scoped reruns:** on a gate failure, re-run the failing gate only (per-task unit uses `test:changed`); never re-run green gates for comfort (the checkpoint records them).

## Quality Gates — Definition of Done
There are **two tiers** of DoD: per-task gates (every task) and a per-module coherence gate (every module).

### Task Definition of Done (per task)
A task is **DONE** only when **EVERY active** gate is green. The loop auto-repeats on any failure (cap **5** iterations, then escalate to human).
1. **Typecheck** — `tsc --noEmit` clean
2. **Lint** — ESLint clean
3. **Unit + coverage** — all green; **≥ 80% line coverage on changed files**, **≥ 70% global** — **ACTIVE (ADR 0018; LOCAL per-task + module edge — NOT in CI when `ciTier: lean`, ADR-0038)**
4. **Build** — production build succeeds
5. ~~**E2E**~~ — **NOT a per-task gate** — moved to the **Module DoD, local-only** (ADR 0018; see below). Never runs in CI (ADR 0012).
6. **Security** — no **High/Critical** findings open
7. **Code review** — verdict **APPROVE** (a blocking nit fails the gate)

> ✅ **GATE CADENCE (ADR 0018, amends 0013; CI tier per ADR-0038):** the per-task **ACTIVE gate set** is **Typecheck · Lint · Unit+coverage · Build · Security · Code-review** — all evaluated **LOCALLY by the gate-runner**. **CI mirrors only the lean tier** (typecheck · lint · promoted guards · traceability · token bridge; Project Profile `ciTier: lean`): the unit suite and native build are **local gates, not CI jobs** — CI-green means "static checks green", never "fully gated". **E2E is not per-task**: it runs **once per module, LOCAL ONLY, as a blocking Module-DoD gate** (and again pre-release) and is **never added to CI** (ADR 0012). 0013's unit-disable is reversed; only its E2E-out-of-CI rationale survives (0012 + 0018).

### Module Definition of Done (per module — system-level, anti-drift)
Task gates prove each part works; this proves the parts form one coherent system. When a module's **last task** passes all task gates, **two module-edge gates run before the module is declared done**: the **coherence review** (structural — emergent cross-module drift that per-task gates can't see) and the **local E2E gate** (behavioral — the assembled user flows actually run on a real device/emulator).
A module is **DONE** only when:
1. **All its tasks** meet the Task DoD above, **AND**
2. **Coherence review = PASS** — `coherence-review` skill: architect (shape drift · data-model · integration · spec-gap + the module's dynamic checks) + security-reviewer (cross-module authz consistency). READ-ONLY reviewers emit findings → builders fix → re-run (cap **5**, then escalate), **AND**
3. **E2E gate = GREEN (local only)** — `e2e-automator` runs the module's Detox/Maestro flows on a device/emulator once per module (NOT in CI). Findings route to builders; re-run (cap **5**, then escalate). The verdict + run-log path is recorded as an **E2E section in `docs/graph/coherence/<module>.md`** so the local run leaves an audit trail, **AND**
4. **Human integration go** — explicit human sign-off (same "merge on human go" gate).

Output: `docs/graph/coherence/<module>.md` (coherence verdict + E2E verdict + the `## Visual` subsection) + `coherenceStatus` (and `visualStatus`, when `visualRegression: +pixel-local`) in `modules.json`. This is **distinct** from the per-task `gate-runner`. **Production note:** before any `development → main` promotion, the **full E2E suite is a mandatory (local) release gate**.

## Context Manifest (the canonical Boot reads — agents reference this, never restate it)
Every agent used to hand-list its own startup reads in a `## Boot` section. Five-plus near-identical lists drift: **add a shared doc and you must edit every agent — miss one and that agent goes silently blind** (no error, just wrong work). The fix is **one keyed table, here**: agents point at it and load the rows tagged for their role. Add a doc → add **one row** → every agent that needs it picks it up. (This is a config-layer table, not a loader — each subagent still reads the bytes into its own window; the win is **no drift + correct missing-source semantics**, not cross-agent dedup.)

**Consumed-by group aliases (expand once, used in the table):**
- **all** = every agent.
- **builders** = architect · frontend · design.
- **reviewers** = code-reviewer · security-reviewer · mr-reviewer.
- **graph-grounders** = architect · frontend · code-reviewer · security-reviewer (agents that *query* the codebase graph before acting).

| key | source | consumed by | when | if absent |
|---|---|---|---|---|
| `project-rules` | `CLAUDE.md` | all | always | **hard error** |
| `harness-config` | `.claude/harness.config.md` | all | always | **hard error** |
| `conventions` | `docs/context/conventions.md` | builders · reviewers · unit-tester · librarian | always | **pending** (pre-FND) |
| `code-quality-standards` | `.claude/code-quality-standards.md` | builders · reviewers · unit-tester | always | **optional** — clean-code always-on layer; depth in the `clean-code` skill |
| `overview` | `docs/context/overview.md` | architect · design · librarian | always | **pending** (pre-FND) |
| `architecture` | `docs/context/architecture.md` | architect · security-reviewer | always | **pending** (pre-DAT) |
| `design-system` | `docs/context/design-system.md` | design · frontend | UI tasks | **pending** (pre-UIF) |
| `stack` | `docs/context/stack.md` | architect | always | **pending** (early) |
| `patterns-registry` | `docs/context/patterns-registry.md` | architect · builders · code-reviewer · librarian | before classifying / inventing / reviewing a **Tier-1** pattern | **pending** (pre-first-pattern) |
| `clickup-mirror` | `docs/context/clickup-mirror.md` | orchestrator | clickup-sync / mirror work | **optional** |
| `harness-debt` | `docs/context/harness-debt.md` | librarian · orchestrator | module-edge / `/harness-sync` | **optional** — absent = nothing queued for simplification |
| `task-graph` | `docs/graph/modules.json` + `docs/graph/STATUS.md` | orchestrator · architect | always | **pending** (pre-scope) |
| `run-checkpoint` | `docs/graph/CHECKPOINT.md` | orchestrator | boot / resume | **optional** — absent = **no run in flight** (not an error) |
| `run-ledger` | `docs/graph/run-ledger.jsonl` (via `.claude/scripts/run-ledger.mjs`) | orchestrator | boot / resume · every merge | **optional** — absent/seed-only = **no merges recorded yet** (not an error) |
| `requirements` | `docs/requirements/REQUIREMENTS.md` + `features.csv` | architect | scope / module planning | **special** → if raw files sit in `docs/requirements/sources/`, run `/intake` FIRST; else **pending** |
| `task-spec` | `docs/specs/<MODULE>/<MODULE>-<NNN>.spec.md` | builders · reviewers · unit-tester · e2e-automator (module flows) | building / reviewing a task | **hard error** |
| `codebase-graph` | `graphify-out/` — **query, never bulk-read** (`graphify query/explain/path`) | graph-grounders | if code exists | **pending** — see callout below |

**`if absent` vocabulary (define ONCE — the load-bearing part):** a missing source has *two* unrelated meanings and an agent must never confuse them.
- **hard error** — required; **STOP** and surface exactly what's missing. Do not proceed or guess.
- **pending** — legitimately **not built yet** (greenfield / early phase). **Proceed**, and **do NOT infer that the thing it represents is absent.** "Couldn't load it" ≠ "it doesn't exist." Preserve the last known truth and treat absence as *not-ready*, never as *gone*.
- **optional** — fine if missing; carry on.

> **The one mistake this prevents — `codebase-graph` pending ≠ "no code exists".** The harness builds `graphify-out/` *lazily* (after the first module's code lands; rebuilt per task by the librarian). So an empty/missing graph means **"graph not built yet"** (greenfield, or a not-yet-run rebuild) — it is **NOT** evidence the project has no code. A naive agent that reads the empty graph and concludes "from scratch" will re-plan over an existing codebase and corrupt the build. **`pending` = not-ready; verify against the real tree (a repo scan) before ever concluding greenfield.**

**Agent contract:** an agent's `## Boot` does **not** restate document lists — it says *"Load context per the Context Manifest (the rows tagged for my role)"* and then keeps only its **role-specific operational steps** (graphify grounding, Context7 version checks, diff retrieval, run-mode resolution, PR identification, etc. — these are mechanics, not doc-drift). Numeric/path facts live **HERE only**; never duplicate the read-list into an agent. See **ADR 0019**.

## Agent Authorization (role boundaries — mechanism-enforced, not prose-enforced)
Our whole orchestration model rests on role separation (reviewers READ-ONLY · builders never rewrite specs · design never touches app source). Historically those rules lived only as **prose in agent files** — true only while the model chose to obey. We now enforce the load-bearing boundaries **mechanically**, at the tool-call layer, via a single `PreToolUse` hook that reads the acting subagent's identity (`agent_type`, present only inside a subagent context) and checks the attempted write/mutation against a policy table. Same philosophy as the Context Manifest: **one keyed source of truth, switched on `agent_type` — never N copies scattered into agent frontmatter** (that's how a rule silently rots).

- **Machine source of truth:** `.claude/hooks/agent-authz-policy.json` (the enforced copy). **Hook:** `.claude/hooks/agent-authz.mjs`, wired as a `PreToolUse` hook in `settings.json`. The table below is the **human-readable mirror** — edit the JSON and this table together.
- **Two axes (opencode's model):** `agent_type` × `(action, resource)`. The strong, low-false-positive guarantee is on **write tools** (Edit/Write/NotebookEdit/filesystem-MCP) matched by **repo-relative path glob**. Mutating **Bash** is a **best-effort tripwire** (a denylist of `sed -i`, redirects, `git commit`, `rm/mv/cp`, `pnpm add`, …) — it catches *accidental* off-role moves (our real threat: drift, not malice), but is **not** an airtight perimeter (a determined shell can evade it). The `main` guardrail is **not** here — it has its own dedicated, fail-closed hook (`.claude/hooks/main-guard.mjs`, **ADR-0021**) that parses git/gh commands and blocks `main`/tag targets for all roles.
- **Hybrid policy, NOT literal deny-by-default.** Our 11 agents are cooperative same-model roles, so we enumerate the **boundaries that must not be crossed** rather than allow-listing every legal path of every agent (which would stall builds on every gap). Reviewers get a true deny-all-writes (trivial + highest value); builder/design get targeted denies.

| `agent_type` | Denied action → resource | Why |
|---|---|---|
| `code-reviewer` · `security-reviewer` · `mr-reviewer` · `design-reviewer` | **any** write · **any** mutating Bash | Reviewers are READ-ONLY — emit findings; builders fix. |
| `frontend` | write → `docs/specs/**`, `docs/graph/**` | Builders implement to spec; specs & task-graph are architect/orchestrator/librarian territory. |
| `design` | write → `mobile/src/**` | Design owns tokens/specs/visual direction and hands implementation to `frontend`; not application source. (warn-mode: tune for the NativeWind token files `mobile/tailwind.config.js`, `mobile/global.css`, `mobile/src/theme/**` during the trial.) |
| _(any agent not listed)_ | _(nothing — ungoverned)_ | Cooperative default; add a row when a boundary proves load-bearing. |

- **Mode (`mode` field in the JSON):** **`warn`** = logs every would-be violation to `docs/graph/logs/authz.log`, **never blocks** (the safe trial — run a build or two, read the log, confirm it catches ONLY real violations, tune the globs/Bash patterns against false positives). **`enforce`** = a matched deny **blocks** the call (`exit 2`) and tells the model why. **Flip to `enforce` only after a clean warn-only trial.** Currently: **`warn`**.
- **Fails OPEN by design:** any internal hook error (unparseable payload, missing/broken policy, log-write failure) → **allow**. A flaky authz script must never freeze a build; the boundary is defense-in-depth over a cooperative system, not a security airlock. See **ADR-0020**.

## Tool Output Bounding (context hygiene — applies to EVERY verbose command)
Agent-issued commands that can emit large output MUST write the **full** output to a log file and surface into context only: a **structured verdict** (where one applies), a **bounded head+tail preview**, and the **log path**. Full fidelity stays on disk; the context footprint stays flat across a long run. This protects unattended `auto-until-development` runs from **premature compaction** — logs filling the window trigger compaction sooner, exactly where task specs / gate state / decisions get summarized away. Loop-level interception is impossible in Claude Code, so this is a **convention enforced by the skills/agents that issue the commands** — the same principle the harness already applies to Graphify (send semantic descriptions, never raw source), extended from codebase knowledge to runtime output.

| Param | Value | Meaning |
|---|---|---|
| `OUTPUT_MAX_LINES` | `200` (gates/reviews) · `2000` (non-gate verbose) | Max lines surfaced before bounding kicks in |
| `OUTPUT_MAX_BYTES` | `20480` / 20 KB (gates/reviews) · `51200` / 50 KB (non-gate) | Max bytes surfaced before bounding kicks in |
| `OUTPUT_LOG_DIR` | `docs/graph/logs/` | Where full logs are written (git-ignored, ephemeral) |
| `OUTPUT_LOG_RETENTION` | task lifetime | Logs pruned by the librarian when the task reaches `done` |

- **Why two limit sets:** gates/reviews already carry the signal in a structured verdict, so the raw preview is a fallback only → tight (200 / 20 KB). Non-gate verbose commands with no verdict get the looser 2000 / 50 KB.
- **Pattern:** redirect both streams to `OUTPUT_LOG_DIR/<context>-<id>-<step>.log`; if over the limit, surface `head (MAX/2)` + the marker + `tail (MAX/2)`. Marker (verbatim): `... output truncated (<N> lines total); full content at <path> ...`. The tail is **mandatory** — failures live at the end.
- **Never bound:** already-small output (≤ limits) · structured return values a consumer parses · media/screenshots (keep file references as-is).
- **Fail open:** if the log write fails, surface a bounded preview anyway + a one-line storage-failure note — a missing log never turns a real result into a fake one.
- **Canonical procedure:** the **`output-bounding`** skill. Consumers (gate-runner, the reviewer agents/skills) reference it; numeric values live **HERE only** — never restate them elsewhere.

## Harness Maintenance — simplify, don't only accumulate (ADR 0028)
> The harness has a strong **additive** bias: every audit/ADR adds a gate, hook, doc, or rule, and nothing ever removes one. This section is the counter-force. A component added for a weaker model becomes dead weight once the model can do it natively (Anthropic retired sprint-splitting on a comparable model and the builder ran *smoother*); always-loaded prose competes with the task for the window.
- **Watchlist:** `docs/context/harness-debt.md` — candidates for removal/lightening, each `watch | ablating | kept | removed | replaced`. The **librarian** seeds it; the simplification pass works it.
- **Cadence:** once per **module completion**, as a step of `/harness-sync` (next to the module-edge graphify rebuild).
- **Ablation protocol (one candidate/pass, reversible):** disable the top `watch` candidate → run the next module's full gate set as the benchmark → **no degradation ⇒ remove** (record an ADR, flip the row to `removed`); **degradation ⇒ restore or replace** with a lighter form, mark `kept`/`replaced` + evidence. **Bias the cut toward always-loaded prose first** (highest ROI — returns window budget every task).
- Pairs with **review-feedback promotion** (ADR 0029): promotion *adds* mechanical checks, simplification *removes* stale ones — same maintenance loop, both directions.

## Reviewer Verdict & Finding Format — reproducible + self-correcting (ADR 0030)
> Two properties every review/gate verdict must have.
> **(1) Reproducible** — the per-task gate reviewers (`code-reviewer`, `security-reviewer`) score the diff against a **fixed rubric** (named dimensions, each with a hard pass bar — tables in their agent files). The verdict is mechanical (code-review APPROVE only if every dimension `pass`; security PASS only if every dimension clear of High/Critical), so the same diff yields the same verdict twice — not a per-run vibe.
> **(2) Self-correcting** — **every** finding from **any** reviewer (`code` · `security` · `infra` · `mr` · `design`) and **every** failing gate surfaced by `gate-runner` carries the **what · why · how-to-fix** triple: *what* (exact `file:line` + rule), *why* (risk / violated invariant), *how-to-fix* (the concrete change) — never just "X failed". Agent-oriented findings let the build loop fix without re-deriving the cause (same style as the `eslint` fix-messages, ADR 0029). Keep it bounded per the `output-bounding` skill — the triple is the structured signal, not a raw dump.

## Compaction Resilience / Run Checkpoint (durable run-state — survives compaction, crash, `/clear`)
When a session runs long, Claude Code **auto-compacts**: it summarizes history and discards the detail — and *we don't control what the summary keeps*. This is dangerous in `auto-until-development`, where the loop runs unattended for exactly as long as compaction needs to fire; a lossy summary can silently drop the spec's acceptance criteria, which gates already passed, the exact error being fixed, or the file under edit — and the agent then re-does work or claims a false pass. Same philosophy as Tool Output Bounding above: **durable truth on disk, context lean and disposable.** Two mechanisms: **Part 1** biases any summary toward the shape below; **Part 2** has the orchestrator proactively write that shape to a file so the truth never depended on the summary.

**Checkpoint location:** `docs/graph/CHECKPOINT.md` — the **live run state** (current in-flight task + gate state + next step + verbatim errors). Git-ignored, ephemeral, **one overwrite of a small file** (never an append log) — always current state only. Distinct from `docs/graph/STATUS.md` (the durable graph-wide board, per-task across modules, maintained by `task-graph`/librarian). Don't double-store: checkpoint here, board there.

**The Run Checkpoint shape (define ONCE — referenced, never duplicated):**
~~~markdown
## Goal
- [one sentence: the task in flight, e.g. "TASK-013: tasks update endpoint"]
## Constraints & Preferences
- [spec acceptance criteria, user rules, gates that apply — or "(none)"]
## Progress
### Done
- [completed steps / gates passed, e.g. "typecheck/lint/unit/build GREEN"]
### In Progress
- [current step, e.g. "security review — fixing finding"]
### Blocked
- [blockers, or "(none)"]
## Key Decisions
- [decision + why, e.g. "completedAt set in service, not DB default — spec §4.2"]
## Next Steps
- [ordered actions, e.g. "1. fix IDOR in tasks.controller  2. re-run security  3. PR"]
## Critical Context
- [exact errors / open questions / facts — VERBATIM, e.g. "unit fail: tasks.service.ts:84 — TypeError: cannot read 'toISOString'"]
## Relevant Files
- [path: why it matters, e.g. "mobile/src/features/<feature>/hooks/useThing.ts:84 — bug site"]
~~~
**Rules (carry verbatim wherever the shape is produced — including any compaction / summary / handoff):**
- Keep **every** section, even when empty (`(none)`). Terse bullets, not prose.
- **Preserve exact file paths, commands, error strings, identifiers, and gate verdicts — copy, never paraphrase.** (This single rule does most of the work — "there was a date bug" is worthless; `tasks.service.ts:84 — TypeError ... 'toISOString'` is not.)
- **Gate state is the highest-value field** — always record which gates are GREEN and the exact failure of any RED one, so a post-compaction agent never re-claims a false pass or re-runs a passed gate.
- Parallel groups: repeat the shape per active task-id.
- **Visual gate (when `visualRegression: +pixel-local`):** carry a verbatim `visual:` line — e.g. `visual: RED — 1 changed baseline: tasks-list@375@dark — awaiting human approve; diff at docs/graph/logs/visual-TASK-contact.png`. A module is not DONE while `visualStatus != GREEN`, so a compaction must never lose this (UI design harness, ADR-0026).
- Do not narrate the checkpoint/compaction process itself.

**Policy:** *In any compaction, summary, or handoff, produce exactly this shape and preserve exact paths/commands/errors verbatim.* The **orchestrator additionally overwrites `CHECKPOINT.md`** with this shape at these **safe moments** (proactive, before context grows large): after **branch creation**; after **each gate result** (pass or fail — capture greens + any failure verbatim); **before starting a new task** in a batch/auto run; before any **long operation** (full native build, module E2E suite); on **escalation** (5 failed loops / coherence can't PASS — the checkpoint is the human's evidence); on **task `done`** (reset to "idle — next runnable: <id>"). On resume the **SessionStart hook re-surfaces `CHECKPOINT.md`** automatically — its matcher fires on `startup|resume|compact|clear`, so it covers the post-auto-compaction case. See **ADR 0017**.

> **Why no `PreCompact` hook:** verified against the current Claude Code hook contract — a `PreCompact` hook's stdout is **not** injected into the summary (it can only *block* compaction or do side-effects), so it cannot bias what the summary keeps. The durable `CHECKPOINT.md` + the **SessionStart `compact` source** (which *is* surfaced to the model after compaction) is the correct, reliable mechanism. Part 1 (the `CLAUDE.md` standing instruction) biases the in-conversation summary as defense-in-depth; Part 2 (the file) is the real safety net.

## Parallelism
- **Max concurrent task-branches / subagents:** 3
- Isolation via **git worktrees** when concurrent branches touch shared files.
- **Integration is not free:** isolation (above) only prevents *build-time* collisions. Landing concurrent branches follows the **`parallel-integration`** skill — pre-fan-out conflict pre-check → merge ordering → rebase + **re-verify** each follower → **post-merge re-gate on `development`** (CI `ci.yml`). Two schema-mutating tasks must NOT share a `parallelGroup` — serialize them.

## MCP Servers
> Configured in `.mcp.json` (staged as `.mcp.harness.json` — activate per QUICKSTART). Postgres dropped (no DB in this repo); Playwright/Chrome-DevTools dropped (web-only — RN uses Detox/Maestro on a device).

| Server | Purpose | Key needed | Status |
|---|---|---|---|
| Filesystem | file ops within the repo | no | enabled |
| Context7 | current library docs (avoid stale RN/RN-lib APIs) | optional 🔑 | enabled |
| ClickUp | PM mirror (optional) | 🔑 (OAuth) | enabled (optional) |
| GitHub | issues / PRs / CI | 🔑 GitHub PAT | **disabled** — GitHub ops go through the `gh` CLI |
| ~~Postgres~~ | — | — | **removed** (frontend-only client, no DB) |
| ~~Playwright / Chrome DevTools~~ | — | — | **removed** (web-only; RN E2E = Detox/Maestro) |

## Graphify (codebase knowledge graph)
- Lives in `graphify-out/` (`graph.json`, `graph.html`, `GRAPH_REPORT.md`).
- **Build target:** the **librarian** rebuilds (`/graphify ./mobile`) after every completed task — graph the RN app.
- **NOTE:** once `mobile/src` contains code, an empty/missing `graphify-out/` means "graph not built yet," **not** "greenfield" — verify against the real tree before concluding the project is empty.
- **Bounded reads only:** never read `graph.json` (~2.6MB) or `GRAPH_REPORT.md` (~36KB) whole into context — query via the CLI (`graphify query/explain/path`) and pull report facts via Grep/section-scoped Read (same principle as the `output-bounding` skill).
- Privacy: only **semantic descriptions** are sent to the configured model — never raw source.

## Autonomy (run mode) — how much the loop does without stopping for you
The harness supports **two run modes**. The mode governs *only* the human stop-points up to and including merge into `development`; it **never** relaxes a quality gate, and it **never** touches the `main`/deploy guardrails below.

- **AUTONOMY_MODE:** `human-gated`  ← template default — start here; flip to `auto-until-development` once your team trusts the gate loop (values: `human-gated` | `auto-until-development`)
- **Set:** project default lives here; overridable per `/build` invocation (one-shot, doesn't rewrite this value).

| Mode | What the loop does without asking | Where it still STOPS for you |
|---|---|---|
| **`human-gated`** (current behaviour) | Runs the per-task gate loop to green. | Before **every** PR merge, and at **every** module integration boundary. Auto-merge OFF. |
| **`auto-until-development`** | Walks the runnable task graph unattended: build → all 7 gates green → **auto-merge PR into `development`** (`gh pr merge --squash`) → librarian → next runnable task → coherence review at module edges. | Only on a **hard stop**: 5 failed gate loops, a coherence review that can't reach PASS, an un-resolvable security High/Critical — or reaching `main`/deploy. **Plus one soft-stop:** the usage-budget window hits ≥95% (it checkpoints + schedules a resume, see **Usage-Budget Awareness** below). |

**How the mode is chosen (the orchestrator asks):**
- Mode **unset / first ever `/build`** → orchestrator **asks** via `AskUserQuestion` (human-gated / auto-until-development / auto-this-batch-only), then offers to persist the choice here.
- Mode **set** + single explicit task-id → proceed silently in that mode.
- Mode **set to autonomous** + a batch target (`/build <module>` or `/build all`) → **one** confirmation before the unattended run begins, then no per-task prompts.
- It asks **at the boundary, not per task** — an autonomous run that re-prompts each task isn't autonomous.

**Guardrails the mode can NEVER override** (these stay human in *both* modes):
- `development → main` promotion — always an explicit human instruction (see "`main` is off-limits" below).
- App-store release — always explicit human approval.
- Every quality gate still must pass — autonomous means "don't ask me when it's green," **not** "skip checks." Hard stops still escalate to you with a summary.

### Usage-Budget Awareness (auto-run soft-stop — ADR-0034)
An `auto-until-development` walk can outlast the account's active **5-hour** (or **weekly**) usage window. Without awareness the run exhausts the window **mid-task** and stops at an arbitrary point. The soft-stop pauses it at a **safe boundary** instead, reusing existing durability (`CHECKPOINT.md` + `ScheduleWakeup`). Mechanism lives in the **`stay-within-limits`** skill; the numeric params live **HERE only**.

| Param | Value | Meaning |
|---|---|---|
| `BUDGET_CHECK_CMD` | `npx -y ccusage@latest blocks --active --json` | Reads the active 5-hour block (start ts · cost/% · time remaining) |
| `BUDGET_STOP_THRESHOLD` | `95%` | Active 5-hour **or** weekly window at/above this ⇒ stop launching new work |
| `BUDGET_CHECK_CADENCE` | task/wave boundary | Check **before** a new task or a new parallel wave — **never** mid-task (interrupting in-flight work loses it) |
| `BUDGET_RESUME_DELAY` | `min(3600, secondsUntilWindowClears)` | `ScheduleWakeup` delay; chain wakeups if longer (each re-checks) |

- **Scope:** `auto-until-development` only (`human-gated` already stops at every merge). It changes *when* the loop pauses, **never** what the gates check, and **never** touches the `main`/deploy guardrails above.
- **On threshold:** write `CHECKPOINT.md` (canonical Run Checkpoint shape — the self-contained resume packet) → `ScheduleWakeup` with a self-contained resume prompt (remaining plan · re-check-then-reschedule rule · threshold · `ccusage` cmd · previous active-block start ts) → report which window crossed + when the next check is.
- **On resume:** re-check the real window (a **new** active-block start ts beats elapsed wall-clock); reschedule if still ≥ threshold, else resume from `CHECKPOINT.md` Next Steps.
- **Fails OPEN:** `ccusage` missing / no network / parse error ⇒ log one line and continue — a missing budget reading must never freeze a build.

## Error-Handling & Retry Discipline (ADR-0033 — diagnose before you retry)
> A retrospective of the PROF build found the loop's most expensive failure mode is **retrying on a guess**: a dark-mode E2E failure burned the full 5-iteration cap on dead-end fixes and was then **misdiagnosed** as a "stale server" (escalated with a theory, not evidence) — ~2h lost. The lesson is not "more retries" — it is **information before iteration**. Every agent that runs a gate/loop (orchestrator, builders, e2e-automator) follows this discipline.

- **1. Classify before acting — error taxonomy.** A failure is one of:
  - **environment / infra** — port/stack down, stale `dist`/`.next` build cache, missing service (DB/SMTP), CORS/env misconfig, **tool-version skew** (local vs CI). ⇒ **Fix the environment, NEVER edit app code.** On the **first** environment-sensitive failure (any E2E/a11y/integration gate), run the **env-sanity check** before touching anything: *is the stack actually up? does a clean rebuild reproduce it? do the local tool versions match CI?* (This single check would have prevented the 3 dead-end dark-mode commits.)
  - **deterministic code** — reproduces on a clean environment. ⇒ route to the builder with the structured finding.
  - **flaky / non-deterministic** — pass⇄fail on identical input. ⇒ re-run **ONCE**, then escalate (never loop-to-green; ADR-0013). Add to the gate-runner `flaky` list.
- **2. Diagnose before retry — no blind loops.** A retry MUST carry a **changed hypothesis backed by the failure's diagnostic data** (the gate-runner / e2e `what · why · how-to-fix`, ADR-0030/0032). Re-running an unchanged command/test with no new information is the forbidden anti-pattern.
- **3. No-progress early-stop.** Record an **error signature** per iteration (gate + `file:line` + error class, in `CHECKPOINT.md`). **Two consecutive iterations with the same signature ⇒ escalate immediately** — do NOT walk to the 5-cap. "5 blind tries" must become "1 try, then think."
- **4. Escalation contract — evidence, not theory.** Every escalation includes: the **verbatim** error/command, the **diagnostic data** (gate-runner JSON / `e2e-results.json` / `failure-context.json` / trace path), and **what was ruled out**. A bare "X failed", or a hypothesis with no supporting artifact (e.g. "probably a stale server"), is **rejected** — the human's evidence must be self-contained.
- **5. Self-diagnosing failures are mandatory (ADR-0030/0032).** A gate that can fail must emit structured diagnostics, not just a pass/fail bit — a "bare failure, no diagnostic" is itself a STOP (fix the gate's reporting first). The gate-runner emits `what · why · how-to-fix`; E2E emits the `json` reporter + `failure-context.json` + trace.
- **Local must mirror CI (verify-the-verifier).** Local-green is not real-green when local tool versions/commands diverge from CI. For **high-stakes** PRs (native/config/CI changes), `MERGE_WAIT_FOR_CI` is forced **on** (see below) so a local-green/CI-red is caught **before** merge.

## Iteration / Escalation / Merge
- Gate-loop cap: **5** iterations, then escalate to human with a summary. **The cap is durable** — it is read back from the Run Ledger / CHECKPOINT on resume, so it does **not** reset to 0 after a compaction or `/clear` (ADR-0022). **The cap is a ceiling, not a target** — the no-progress early-stop (Error-Handling Discipline above) usually stops well before 5; reaching 5 on repeating failures is itself a bug in the loop.
- Merge policy: **mode-driven** (see Autonomy above). `human-gated` = **on human go** (auto-merge OFF); `auto-until-development` = **auto-merge into `development` when every gate is green**. PR base is **always** `development` in both modes.
- **`MERGE_WAIT_FOR_CI`** (values `off` | `on`; **default `off`**): controls whether `auto-until-development` waits for the PR's **CI** to go green before merging, not just the **local** gates.
  - **`off` (default):** merge on local gate-runner green (today's behaviour). Rationale: CI can be slow and the local gates mirror it; the post-merge `push:development` re-gate still runs. Faster unattended throughput; the trade-off is a local-green/CI-red change can land and is only caught on the next CI run.
  - **`on`:** before completing an auto-merge, run `gh pr checks <pr> --watch --fail-fast`; **merge only if CI passes**, and on CI failure **STOP** (mark the task `gates-red`, escalate) instead of walking onto a possibly-broken `development` ("development red → STOP"). Defer `--delete-branch` until the post-merge re-gate is green (keep the forensic branch). Use `on` for high-stakes / pre-promotion runs.
  - **Native / high-stakes override — always `on` (ADR-0033):** regardless of the default, treat `MERGE_WAIT_FOR_CI` as **`on`** for any PR touching a **native/CI surface** — `.github/workflows/**` (repo root), `mobile/android/**`, `mobile/ios/**`, `package.json`/lockfile dep bumps. These carry a high **local-green / CI-red** risk from tool-version skew between local and CI. Never auto-merge them until CI is green.
  - **⚠️ Lean-CI semantics (ADR-0038):** with `ciTier: lean`, CI runs **no native build and no unit suite** — CI-green means the static tier only. For native-surface PRs the real protection is the gate-runner's **full local `assembleDebug`** path (mandatory when the diff touches `android/`/`ios/`/lockfile) — never skip it on the theory that "CI will catch it"; CI can't. Flip `ciTier` to `standard`/`full` via `/setup` if that trade stops being acceptable.
- **Run Ledger (durable merge history) — see the section below.** Every completed merge (auto *or* human) appends one line; the orchestrator reads it on boot for the durable iteration cap + **idempotency** (never re-process a task already recorded merged).
- **`main` is off-limits:** no agent merges, pushes, or commits to `main` without an explicit human instruction in the current request — **regardless of AUTONOMY_MODE**. Promotion `development → main` happens only when the human says so. **Mechanically enforced** by `.claude/hooks/main-guard.mjs` (a fail-closed PreToolUse hook that parses every `git`/`gh` Bash call, resolves the effective target ref, and blocks any push/merge/commit/PR-base to `main` or a tag — main thread *and* subagents; **ADR-0021**). Deliberate override: prefix the command with `HARNESS_ALLOW_MAIN=1` (the auditable "explicit human instruction"). Layers: `settings.json` deny-list (text filter) → main-guard hook (authoritative local guard) → server-side branch protection (cross-machine wall; currently blocked by the GitHub free/private plan).

## Run Ledger (durable, append-only merge history — survives compaction, crash, `/clear`)
The orchestrator's safety state — the gate-loop iteration count, which gates passed, what got merged — used to live **only in conversation memory**, so a compaction/resume **reset the iteration cap to 0** and left **no record of what the machine auto-merged**. The **Run Ledger** is the durable fix (HARNESS-AUDIT #4, **ADR-0022**).

- **File:** `docs/graph/run-ledger.jsonl` — **TRACKED** (committed), one JSON object per completed task/merge. This is the durable *history*; it is **distinct from** `CHECKPOINT.md` (gitignored, a single overwritten snapshot of the **current** task) and from `STATUS.md` (the per-task board). Checkpoint = "where am I now"; ledger = "everything that has merged".
- **Never hand-write it** — append via the helper so every line is well-formed:
  - `node .claude/scripts/run-ledger.mjs append --json '{"task":"…","pr":N,"mergeSha":"…","initiator":"auto|human","mode":"…","iterations":N,"gates":{…},"reviewer":"APPROVE"}'` (stamps `ts`).
  - `node .claude/scripts/run-ledger.mjs has --task <id>` — **idempotency guard** (exit 0 = already merged). Run BEFORE merging / marking a task `done`.
  - `node .claude/scripts/run-ledger.mjs iterations --task <id>` — recorded loop count; `tail [--n N]` — recent entries for audit.
- **Orchestrator contract:**
  1. **On boot/resume:** read the ledger. A task already present = **already merged** → do **not** re-merge or re-`done` it (kills the *triple-fire on merge/status* race: orchestrator + `clickup-sync.yml` + Boot `reconcile` can each flip a task to `done` — the ledger is the idempotency key). Restore the iteration cap from it instead of resetting to 0.
  2. **On every merge (auto OR human):** append one entry — `initiator` distinguishes machine-merged from human-merged work; `mergeSha` gives blast-radius traceability.
- **Five things, one artifact:** crash-recovery (durable cap) · audit trail (what merged, on what evidence) · idempotent merge handling · blast-radius data (which SHA) · auto-vs-human attribution.

## Project Management — ClickUp (mirror)
> **Detail moved to `docs/context/clickup-mirror.md`** (mapping · status-sync milestones · automation) — read it for `/clickup-sync` or any ClickUp mirror work; operational specifics also live in the **clickup-sync** skill + `docs/graph/modules.json`. Harness **mirrors the plan** (ClickUp reflects the harness, never the reverse): `/scope`+`/module` create Lists/Tasks, `/build` syncs status. **Resolved IDs (fill after `/scope` creates the lists):** Workspace `{{CLICKUP_WORKSPACE_ID}}` · Space `{{CLICKUP_SPACE_ID}}` · Lists: one `{{CLICKUP_LIST_ID}}` per module. Full task→ClickUp-id map in `docs/graph/modules.json` (`clickupMirror`). Status map `started→in progress · review→in progress · done→complete`. Merge→`complete` needs the `CLICKUP_TOKEN` repo secret.
