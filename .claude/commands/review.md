---
description: Run security + code + PR review on demand for a branch or PR.
argument-hint: <branch | pr-url>
---

Target: $ARGUMENTS

1. Resolve the diff (`git diff development...<branch>` or the PR's diff via `gh`).
2. Dispatch **security-reviewer** (read-only) → severity-tagged findings + PASS/FAIL.
3. Dispatch **code-reviewer** (read-only) → [blocking]/[nit] comments + APPROVE/REQUEST_CHANGES.
4. If a PR URL was given, dispatch **mr-reviewer** to post the consolidated review via `gh` and track resolution (**mr-flow** skill).
5. Report the consolidated verdict.

Reviewers never edit code — route any fixes back to the responsible builder.
