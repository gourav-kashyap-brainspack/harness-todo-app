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
**FND in progress — critical path complete.** FND-001, FND-002 (design system + theming), and FND-003 (navigation shell) are all **done and merged** (PR #3, #4, #5). FND-004 (app bootstrap: splash · first-launch · offline) is **done, all gates green in 1 loop iteration — PR #6, `status: review`, awaiting human merge-go.** The boot sequence is now real end-to-end: native splash (react-native-bootsplash, both platforms) → `BootstrapScreen` reads the `app.hasLaunched` MMKV flag (`launchStore`) → routes to `ProfileSetup` (first launch) or `Tabs` (returning) → hides the native splash — zero network calls anywhere in the path (F-048). See `docs/context/architecture.md` + patterns-registry → "App bootstrap / first-launch seam".

**FND-005 (shared UI primitives) is the only remaining FND task** — runnable now (needs only FND-002, already merged). When it lands, the **FND Module DoD fires**: coherence review (architect + security-reviewer) + local E2E gate, both required before FND is declared done. Next runnable: **FND-005**.
