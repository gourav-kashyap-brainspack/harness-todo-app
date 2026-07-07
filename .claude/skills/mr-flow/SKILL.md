---
name: mr-flow
description: Branch naming, commit hygiene, opening the PR, attaching the AI review, resolving comments, and merge criteria for GitHub (gh). Use during the PR step of /build and for /review.
---

# PR Flow (GitHub / gh)

GIT_PLATFORM = github → **Pull Request**, `gh` CLI.

## Branch & commits
- Branch: `feat/<module>-<task-id>` off latest `development` (NEVER off `main`).
- Conventional commits: `feat(<module>): …`, `fix(<module>): …`, `test:`, `chore:`. Small, focused commits.

## Open the PR
1. Push: `git push -u origin feat/<module>-<task-id>`.
2. `gh pr create --base development --title "<task-id>: <title>" --body <generated>`.
   - Body: summary · spec link · gate-results table · screenshots · checklist.

## Review on the PR
- `mr-reviewer` posts the consolidated security + code review as comments (`gh pr review` / `gh pr comment`), each [blocking]/[nit].
- The builder resolves each comment, pushes; mr-reviewer re-checks. Loop until zero blocking comments.

## Merge criteria
- ALL local gates green (gate-runner `overall: pass`) AND mr-reviewer APPROVE.
- **Idempotency FIRST:** `node .claude/scripts/run-ledger.mjs has --task <id>` — exit 0 means it already merged; skip (don't double-merge / double-`done`).
- **CI green at merge time is `MERGE_WAIT_FOR_CI`-gated** (`harness.config.md`, default `off`): by default the **local** gates (which mirror CI) plus the post-merge `push:development` re-gate are the safety net; set `on` to additionally **block the merge on the PR's CI** (`gh pr checks <pr> --watch --fail-fast`, CI red → STOP / "development red → STOP").
- **Merge timing is mode-driven** (`AUTONOMY_MODE` in `harness.config.md` → Autonomy):
  - `human-gated` (default): merge ONLY on explicit human go (auto-merge OFF): `gh pr merge --squash` into `development`.
  - `auto-until-development`: once the criteria above are met, **auto-merge** `gh pr merge --squash --delete-branch` into `development` (no prompt) and continue. With `MERGE_WAIT_FOR_CI=on`, defer `--delete-branch` until the post-merge re-gate is green.
- **After ANY merge (auto or human): append to the Run Ledger** — `node .claude/scripts/run-ledger.mjs append --json '{"task":"<id>","pr":<n>,"mergeSha":"<sha>","initiator":"auto|human",…}'` (ADR-0022: durable audit trail + the next boot's idempotency key).
- The criteria themselves never relax — only *who triggers* the merge changes. `main` is never a merge target without an explicit human instruction in either mode.

## Rules
- PRs target `development`. Never push to or merge into `main` without an explicit human instruction. Never merge with a red gate or an open blocking comment.
- **Bound verbose output** (the `output-bounding` skill): when `gh pr diff` / `gh pr checks` / a CI-log fetch is large, redirect it to a log under `docs/graph/logs/` and surface only the relevant slice + the path — don't flood context with a full diff or CI dump. Limits live in `harness.config.md`.
