# ADR 0021 — `main`-branch protection: a dedicated flag-position-independent PreToolUse hook

**Date:** 2026-06-23 · **Status:** accepted (enforce) · **Context:** harness safety hardening (HARNESS-AUDIT #2, the last open Critical) · **Relates to:** [ADR 0020](0020-agent-authorization-pretooluse-hook.md) (which deliberately left `main` to the deny-list), [ADR 0003](0003-autonomy-mode.md) (the unattended mode this protects)

## Context
`main` is off-limits in both autonomy modes — no branch-from, commit, push, merge, or PR-base without an explicit human instruction (CLAUDE.md). The only mechanical enforcement was the `settings.json` **deny-list**, which the harness audit found multiply bypassable:

- It matches command **text**, so it is blocklist-by-enumeration — anything not spelled out slips through. The headline rule `gh pr merge * --base main*` guarded a **flag that does not exist**, so it never matched anything.
- No `gh pr create --base main`, no `--admin`, no refspec variants (`HEAD:main`, `+main`, `:main`), no compound-command handling (`cd x && git push origin main`), and `git commit` while checked out on `main` was fully allowed.

ADR-0020's agent-authz hook does **not** cover this: it skips the main thread (`if (!agent) exit 0`), **fails open**, and §3 explicitly scoped `main` out ("branch state isn't a file path, so it does not belong in this hook"). So `main` protection had no authoritative mechanical guard — most dangerous in `auto-until-development`, which runs unattended exactly when no human is present to deny a prompt.

We hardened the deny-list (added the create/admin/refspec denies) as defense-in-depth, but a deny-list can never be complete. The audit's prescription: a **flag-position-independent PreToolUse hook** that resolves the *effective target ref* and hard-fails anything touching `main`/a tag.

## Decision
Add a **dedicated** PreToolUse hook — `.claude/hooks/main-guard.mjs` — separate from agent-authz, wired under `hooks.PreToolUse` with `matcher: "Bash"`, running **before** agent-authz.

1. **Governs everyone.** Unlike agent-authz it does **not** skip the main thread — it inspects every Bash call from the main loop *and* subagents (the `main` rule binds all roles equally).
2. **Parses, doesn't pattern-match.** It splits compound commands (quote-aware, on `&& || ; | &`), strips env-assignments / wrappers / git global options (`-C`, `-c`, …), then classifies the real `git`/`gh` invocation:
   - **`git push`** → blocks any refspec whose destination is `main` (`main`, `HEAD:main`, `+main`, `:main`, `refs/heads/main`), plus `--all`/`--mirror`/`--tags`, and a no-refspec push **while the current branch is `main`**.
   - **`git commit`/`merge`/`rebase`/`cherry-pick`/`revert`/`am`/`reset --hard`** → blocks when the checked-out branch is `main` (resolved by reading `.git/HEAD`, worktree-aware — no subprocess). This closes the `checkout main + commit` bypass the deny-list cannot see.
   - **`gh pr create --base/-B main`** and **`gh pr merge --admin`** → blocked; **`gh api -X {POST,PUT,PATCH,DELETE}`** touching a `…heads/main` ref → blocked.
3. **Fail-CLOSED on the risky surface only.** A parser error on a git/gh command → **block**; a non-git/gh command (npm, ls, tsc…) is returned immediately, so a bug in the hook can never freeze the whole shell — only the dangerous surface fails toward "blocked." (Contrast ADR-0020's fail-open: that hook guards cooperative drift; this one guards an irreversible release branch.)
4. **Explicit-human escape hatch.** Prefixing a command with `HARNESS_ALLOW_MAIN=1` bypasses the guard — this *is* the "explicit human instruction" the policy permits, made auditable (the override is visible in the command).
5. **Defense-in-depth, three layers:** deny-list (quick text filter) → this hook (authoritative local guard) → **server-side branch protection** (the only cross-machine wall). The third is currently **unavailable**: the repo is private on the GitHub free plan, so classic protection *and* rulesets return `403 — Upgrade to Pro or make public`. Documented as a follow-up, not a code fix.

## Consequences
- **`main` protection is now mechanism-enforced, not prose** — every push/merge/commit/PR-base to `main` is blocked at the tool-call layer regardless of flag spelling, refspec form, or compound nesting, for the main thread and subagents alike. Verified across 19 allow/block/override cases + the on-`main` branch-resolution path (commit/merge/push blocked on `main`, allowed on a feature branch).
- **Enforce from day one** (unlike ADR-0020's warn trial): the rule is narrow and high-precision (only `main`/tag targets), the false-positive surface is tiny, and the protected resource is irreversible — a warn window would leave the Critical open for no benefit. The escape hatch covers any legitimate need.
- **Honest limits:** command-substitution `$(…)`/`eval`, or a `cd` into an *unrelated* repo before the git call, can still evade branch resolution — this is a strong local guard, not a sandbox. The real cross-machine guarantee is server-side protection, blocked only by the plan tier.
- Files: `.claude/hooks/main-guard.mjs`, `settings.json` (new PreToolUse `Bash` entry). The deny-list remains as the defense-in-depth first layer.

## Follow-ups
- Enable GitHub server-side branch protection / a ruleset on `main` when the repo goes public or onto a paid plan (the authoritative cross-machine control).
- If `$(…)`/`eval` evasion ever becomes a real risk vector, extend the splitter to recurse into command substitutions.
