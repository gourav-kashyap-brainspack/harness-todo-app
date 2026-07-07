---
description: One-time project preflight — verify env, resolve the Project Profile (all capability switches, asked once), write it to harness.config.md, then PRUNE the machinery behind OFF switches so the harness stays lean. Idempotent; re-run to change a switch.
---

Run the **setup** skill (`.claude/skills/setup/SKILL.md`) end-to-end:
environment preflight → batched Project Profile interrogation (`AskUserQuestion`, themed batches —
release-hardening enforcement is ALWAYS asked, never defaulted) → write the profile table in
`harness.config.md` → **prune pass** (remove/disable OFF-switch machinery, log rows to
`docs/context/harness-debt.md`, one ADR) → write `docs/graph/SETUP-COMPLETE.md`.

$ARGUMENTS
