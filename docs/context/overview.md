# Overview — Todo App

> Living doc, maintained by the **librarian** after every task. Keep it factual and lean.
> `/intake` + `/scope` fill in the real domains and status.

## What it is
**Todo App** is a React Native (iOS + Android) client. _A cross-platform to-do / task-management app — create, organize, complete, filter, and track tasks._
It is a **frontend-only client** that consumes a remote backend API.

_(Replace this paragraph with the real product summary once `/intake` has ingested the PRD.)_

## Domains
_(empty — `/scope` fills this in with the confirmed feature slices from `mobile/src/features/*`.)_

## App brand
- **Display name:** Todo App
- **Native target / scheme / applicationId:** {{APP_TARGET}}

## Glossary
_(empty — the librarian appends domain terms as they are confirmed.)_

## Current status
**All 5 FND tasks are task-complete; only FND-005 still awaits merge.** FND-001 through FND-004 are **done and merged** (PR #3, #4, #5, #6). FND-005 (shared UI primitives) is **done, all gates green in 1 loop iteration — PR #7, `status: review`, awaiting human merge-go.** `EmptyState`/`LoadingIndicator`/`Screen` now live in `src/components/ui` (barrel `@/components/ui`), promoted as Tier-1 reuse-or-block patterns (patterns-registry.md) — plus the app-wide Feather icon-family convention and the generalized native-prop-color rule (`nativeChromeColors.ts`).

**Next: human merge-go on PR #7, then the FND Module DoD fires** — coherence review (architect + security-reviewer) + local E2E gate + the full Graphify semantic rebuild (deferred to this module edge, `/coherence FND`). Only after that does FND become `done` and STG unblock.
