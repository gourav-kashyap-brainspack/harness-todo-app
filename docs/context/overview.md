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
**FND in progress.** FND-001 (stack + scaffolding) and FND-002 (design system + theming, light + dark) both merged (PR #3, PR #4). FND-003 (navigation shell) done, all gates green after a 2-iteration loop — PR #5, `status: review`, awaiting human merge-go. The navigation tree is now real: `RootStack` (Splash → ProfileSetup → Tabs → Add/Edit/TaskDetail) + bottom-tabs (Home/Profile), typed params, nav theming from tokens, and a themed StatusBar — see `docs/context/architecture.md`. Next runnable after merge: **FND-004** (bootstrap: splash · first-launch · offline, needs FND-003) — **FND-005** (shared UI primitives) is also still runnable independently (needs only FND-002, already merged).
