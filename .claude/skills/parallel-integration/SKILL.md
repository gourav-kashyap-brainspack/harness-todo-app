---
name: parallel-integration
description: How to safely fan out a parallel task group AND land the branches without breaking the integration branch. Covers the pre-fan-out conflict pre-check, worktree isolation, merge ordering, rebase-and-re-verify, and the post-merge re-gate. Use whenever the orchestrator runs >1 task concurrently (a parallelGroup), or whenever two open PRs touch shared files. Complements the per-task gates (which only prove a branch is green in isolation).
---

# Parallel Integration

The per-task gates prove a branch is green **in isolation**. They do NOT prove two
independently-green branches can land together. This skill covers the missing half:
detecting and resolving integration conflicts so `development` never breaks.

## When to use
- The orchestrator is about to fan out a `parallelGroup` (≥2 tasks concurrently), OR
- ≥2 open PRs target `development` and may touch shared files (root `package.json`,
  `package-lock.json`, the screen manifest `mobile/src/app/navigation/screenManifest.ts`, native config (`android/`, `ios/`, `.env`)).

## 1. Pre-fan-out conflict pre-check (BEFORE dispatching builders)
For the tasks in the group, predict shared-file overlap from their specs (touched paths)
and decide isolation + merge order **up front**:
- **Always isolate** concurrent branches in **git worktrees** (`git worktree add <path> -b feat/<module>-<task-id> development`). Builders work only in their worktree; never the main checkout.
- If two tasks will both edit a **shared file** (lockfile, root `package.json`, the screen manifest, native config), note it: they CANNOT both fast-merge. Pick a **merge order** now (smaller/foundational first), and tell each builder to **stay in its lane** (minimize edits to shared files).
- **Hard rule — shared files:** never let two concurrent tasks both edit the same shared file (`package-lock.json`, root `package.json`, the screen manifest `mobile/src/app/navigation/screenManifest.ts`, native config in `android/`/`ios/`/`.env`). Serialize them (set `blockedBy`) — a parallelGroup must not contain two tasks that mutate the same shared file.

## 2. Build + gate each branch in its worktree
Run the full relaxed/normal gates **inside each worktree** (each needs its own `npm ci --legacy-peer-deps`).
Reviewers (security + code) run per branch. Commit on the branch; do NOT merge yet.

## 3. Detect conflicts before opening/merging
```
git merge-tree --write-tree feat/<A> feat/<B>     # exit 1 + "CONFLICT" => they clash
comm -12 <(git diff --name-only development...feat/<A>|sort) \
         <(git diff --name-only development...feat/<B>|sort)   # shared files
```
Record the verdict on the PRs ("merge #A first, then #B rebases").

## 4. Land in order — rebase + RE-VERIFY each follower
Merge the first PR. Then for **each** remaining branch, before it merges:
1. `git merge development` (or rebase) into the branch — resolve shared-file conflicts (for `package.json`, take the **union**; for `package-lock.json`, resolve the manifests then **`npm install --legacy-peer-deps` to regenerate** it).
2. **Re-run the gates** on the merged result (a green-in-isolation branch can break once it absorbs the other's changes). Respect build ordering.
3. Push; confirm the PR is `MERGEABLE`/`CLEAN` (`gh pr view <n> --json mergeable,mergeStateStatus`).
Only then is it the human's to merge. **Never merge a stale branch.**

## 5. Post-merge re-gate (the integration branch must stay green)
After each merge into `development`, the gates must run **on `development`** — not just on the branch. This is enforced server-side by CI (FND-005 `ci.yml` runs on `push: development`). Locally, the orchestrator's Boot `reconcile` + the next build re-verify. If `development` ever goes red, STOP and fix before new work.

## 6. Defer shared-doc edits to a single post-merge pass
Concurrent tasks must NOT each edit the same context doc (e.g. `conventions.md`
Canonical patterns registry) — that just creates a third conflict. Keep feature PRs
code-only; do **one librarian pass on `development`** after the group lands.

## Rules
- Worktrees for all concurrent branches; builders never touch the main checkout or each other's worktree.
- A `parallelGroup` may not contain two schema-mutating (or otherwise hard-shared-file) tasks — serialize them.
- Re-verify gates after every integration merge; a branch is only "ready" when MERGEABLE **and** re-gated.
- `development` is sacred: if a merge breaks it, that's a STOP-the-line.
