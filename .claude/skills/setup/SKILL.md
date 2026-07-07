---
name: setup
description: >
  One-time interactive project preflight (ADR-0046 + ADR-0038): verify the environment, resolve the
  Project Profile (every capability switch, asked ONCE), write it into harness.config.md, then PRUNE —
  remove/disable the harness machinery behind every OFF switch so the project carries only the harness
  it uses. Idempotent: on a configured project it shows the current profile and offers changes + re-prune.
---

# /setup — guided preflight + capability configuration + prune

The harness is a **product configured per project**. This skill is the configuration step. Run it
**before `/scope`** on a fresh project; re-run any time a capability decision changes. Everything it
resolves lives in ONE place — `harness.config.md` → **Project Profile** — and every consumer
(gate-runner, orchestrator, CI, agents) keys off that table. Never answer these questions ad-hoc
mid-build; that's how switches and machinery drift apart.

## Phase 1 — Environment preflight (fail loud, fix before continuing)
1. **Git remote sanity (ADR-0046):** `git remote -v` — origin must be the PROJECT repo, never a
   `*/harness-template*` remote. Wrong remote = STOP with the `gh repo create --template` fix.
2. **Tooling:** `gh auth status` · `node --version` (20+) · package manager per config
   (`npm ci --legacy-peer-deps` here) · platform toolchains only for the platforms chosen in Phase 2.
3. **MCP:** confirm `.mcp.json` is activated (staged as `.mcp.harness.json`). If ClickUp is wanted:
   resolve + **echo the authorized Workspace/Space and get confirmation BEFORE any createLists**
   (a wrong-workspace OAuth grant burned a real session — ADR-0046).
4. **CI location:** the workflow MUST be at **repo-root** `.github/workflows/` (GitHub reads only the
   root — HARNESS-AUDIT #15). If it sits under a subdir, relocate it now.

## Phase 2 — Resolve the Project Profile (batched interrogation, ONE session)
Ask via **`AskUserQuestion`**, grouped into at most 3–4 themed batches — never one drip per switch
(the batched-OQ rule, ADR-0038 #20). Your recommendation is always the FIRST option. Switches +
value vocabularies are defined in `harness.config.md` → **Project Profile** (the single source of
truth — do not restate them here). The themes:

1. **Platforms & CI** — `platforms` · `ciTier` · `buildGate` · `perfBudget`.
   Explain the lean-CI trade honestly: `lean` = CI is a static tripwire (typecheck/lint/guards); the
   unit suite + native build stay **local** gates; local-green/CI-red skew on native changes is then
   caught only by the gate-runner's mandatory local full-build path.
2. **Test & review gates** — `unitGate` (+ thresholds) · `e2eGate` · `visualParity` · taste reviewer
   (Design Profile `tasteReviewer`).
3. **Release & security** — **`releaseHardening: advisory | enforced`** — ALWAYS ASK, never default
   silently: `advisory` = hardening items (SSL pin values, ProGuard/R8, Hermes, release keystore,
   attestation) are a release-lane checklist reviewed at `development → main` time; `enforced` = a
   blocking `check-release-hardening.sh` local release gate. Also `offlineTier`.
4. **Workflow** — `intakeMode` · `timeTracking` · `telemetryDashboard` · `AUTONOMY_MODE` (if unset).

## Phase 3 — Write the profile
Edit the **"This project"** column of the Project Profile table in `harness.config.md` (+ Design
Profile switches if changed). Date-stamp the decision in the section preamble. One table, no copies.

## Phase 4 — PRUNE (the lean pass — mandatory, this is not optional polish)
For every switch resolved OFF/lean, **remove or disable its machinery** — an OFF switch whose
machinery still ships is token debt and drift risk. Work this map (extend it when new capabilities
land):

| Switch value | Prune |
|---|---|
| `ciTier: lean` | `ci.yml` = static+guards jobs only — delete unit / android-build / ios-build / bundle-budget jobs |
| `platforms: android` | no ios CI job; iOS steps in gate-runner/visual-parity marked platform-gated (skip, don't fail); no plist checks |
| `e2eGate: off` | remove e2e-automator dispatch from Module DoD + the `.maestro/` runner wiring; agent file → debt watchlist |
| `visualParity: off` | disable the visual-parity skill wiring + `visual-map` guard; design-reviewer stays only if `tasteReviewer: on` |
| `releaseHardening: advisory` | do NOT create/wire a blocking release gate; keep the checklist in the release lane |
| `offlineTier: none` | spec template Offline section optional; no persistQueryClient pattern task |
| `intakeMode: full-upfront` | do NOT build `/require` (input-gated) |
| `timeTracking: off` | no estimate/startedAt/doneAt stamps, no ETA table |
| `telemetryDashboard: off` | orchestrator never invokes `--dashboard`; on-demand `/harness-report` stays |
| `tasteReviewer: off` | design-reviewer agent not dispatched |

Prune rules:
- **Reversible by construction:** everything removed is in git history + the template repo; record
  the re-enable path ("flip the switch, re-run /setup") in the debt row.
- **Log every cut** as a row in `docs/context/harness-debt.md` (state: `removed — profile`), and cover
  the batch with one ADR. The ADR-0028 simplification pass owns them afterwards.
- **Never prune a guardrail:** main-guard, run-ledger, CHECKPOINT, output-bounding, and the Context
  Manifest are unconditional — they are the harness's spine, not capabilities.

## Phase 5 — Mark complete
Write `docs/graph/SETUP-COMPLETE.md`: the resolved profile snapshot + date + who answered.
`/scope` and `/build` should treat a missing marker on a fresh project as "run `/setup` first"
(soft gate — warn and offer, don't hard-block a project that predates this skill).

> **Template default:** run `/setup` **before `/scope`** on every new project instantiated from this
> template — it is the step that turns the generic harness into a configured one. Until it runs, the
> Project Profile carries the template DEFAULTS (release hardening = **ask**, never silently enforced).
