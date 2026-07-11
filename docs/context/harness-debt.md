# Harness Debt — simplification watchlist

> Candidates for removal/lightening, worked once per module at `/harness-sync` (ADR-0028).
> The **librarian** seeds rows; the simplification pass ablates the top `watch` candidate against the
> next module's gates and removes it if nothing degrades. Bias the cut toward always-loaded prose first.

| Candidate | Why it's a candidate | State | Evidence |
|---|---|---|---|
| Graphify tooling referenced but not installed | `CLAUDE.md`/`harness.config.md`/`librarian.md`/`harness-sync.md` describe live machinery — a `graphify` CLI (`graphify query/explain/path`, `graphify update .` via a post-commit hook) and a `/graphify ./mobile` slash-command — as running on every task/module edge. None of it exists: no `.claude/commands/graphify.md`, no `.claude/skills/graphify/`, no `graphify` binary on PATH or via `npx`, no real `.git/hooks/post-commit` (only `*.sample` files). At the FND module edge (2026-07-11) the rebuild was attempted and skipped gracefully rather than fabricated. This is either dead prose to prune (if the tool was never actually going to be built) or a real gap to fill (install/build it) — not a "watch, ablate later" item; flagging now so the next simplification pass or a `/setup` re-run makes a deliberate call instead of the docs silently continuing to describe non-existent machinery. | watch | `docs/graph/logs/graphify-FND.log`; `docs/context/architecture.md` → "Graphify graph summary" |

## Onboarding / setup gaps (additions — work TO DO, not simplification candidates)

> Tracked here because the debt watchlist is the harness's standing "things to fix" surface. These are **additive** fixes (new mechanism), distinct from the ablation candidates above. Source: ADR-0036 — first live setup of a project (todo-app) from this template, 2026-06-26.

| Item | Why it's needed (evidence) | State | Owner / next step |
|---|---|---|---|
| Ship template AS a GitHub Template Repository | Plain `git clone` leaves `origin` = the read-only template; project commits got pushed to `harness-template` itself. "Use this template" / `gh repo create --template` makes `origin` correct by construction — removes the error class for every clone. | todo | Toggle Settings → "Template repository"; rewrite `QUICKSTART.md` step 1 (ADR-0036 §3). |
| ~~`/setup` (init-project) interactive preflight~~ | Onboarding is passive prose + placeholders; nothing verifies env before `/scope`. Two real failures in one session (wrong remote, wrong ClickUp workspace). | **DONE (ADR-0038)** | Built: `.claude/skills/setup/SKILL.md` + `/setup` command — env preflight + batched **Project Profile** interrogation + **prune pass** (removes OFF-switch machinery) + `docs/graph/SETUP-COMPLETE.md` marker. Every capability is now a switch resolved once. |
| Lean CI is the default (`ciTier: lean`, ADR-0038) | The root `.github/workflows/ci.yml` ships the lean tier only (typecheck · lint · guards · traceability · token bridge). Unit + native build are LOCAL gates. A project that wants CI to re-run them flips `ciTier` via `/setup`. | reference | Not debt — documents the default. Re-add unit/android-build jobs by flipping `ciTier` to `standard`/`full`; job shapes recoverable from git history. |
| Release-hardening gate deferred (`releaseHardening: advisory`) | Default is advisory (release-lane checklist), never silently enforced. `check-release-hardening.sh` is deliberately NOT built until a project flips `releaseHardening: enforced` via `/setup`. | deferred — re-ask at release | On `enforced`, build the script (promoted-check idiom) + wire it as a blocking local release gate before `development → main`. |
| Origin-guard (PreToolUse, sibling to `main-guard`) | Make "push the product to the engine repo" *impossible*, not just documented-against. | todo | Block push/PR when the remote resolves to `*/harness-template` unless overridden (ADR-0036 §2). |
| `setup-complete` gate on `/scope` + `/build` | Make onboarding a real gate, not a doc the operator may skip. | todo | Refuse to run until the marker exists (ADR-0036 §Gate). |
| ClickUp workspace-grant confirmation in preflight | OAuth grant pointed at a different (reference) workspace than intended; lists were created in the wrong place before re-auth. | todo | Resolve + echo the authorized Workspace/Space for confirmation BEFORE any `createLists` (ADR-0036 §1). |
| _(re-justify later)_ `setup-complete` marker + origin-guard | Per ADR-0028, new always-present machinery must be re-justified; the template-repo change alone may make some of this redundant. | watch | Ablate once template-repo distribution is proven. |

## Prune pass — Todo App `/setup` (2026-07-07)

> Ran the Phase-4 prune after resolving the Project Profile. Almost every capability resolved ON; the OFF/lean switches all map to machinery that is either already lean or input-gated (never built). No physical removals were required. Re-enable path for each = flip the switch in `harness.config.md` → Project Profile and re-run `/setup`.

| Switch (resolved) | Machinery | Prune outcome |
|---|---|---|
| `ciTier: lean` | root `ci.yml` job set | already lean (`detect` · `static` · `guards`) — no unit/build/bundle jobs present to delete |
| `perfBudget: off` | CI bundle-budget job | none present — nothing removed |
| `releaseHardening: advisory` | `check-release-hardening.sh` blocking gate | never built (deferred until `enforced`); release-lane checklist retained |
| `tasteReviewer: off` | design-reviewer dispatch | opt-in; not dispatched — no wiring to remove |
| `intakeMode: full-upfront` | `/require` incremental entry point | input-gated; never built — no wiring to remove |
