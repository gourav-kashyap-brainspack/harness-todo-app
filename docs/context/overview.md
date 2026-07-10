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
**FND in progress.** FND-001 (stack + scaffolding) merged (PR #3). FND-002 (design system + theming, light + dark) done, all gates green — PR #4, `status: review`, awaiting human merge-go. Light/dark token system (`tailwind.config.js` + `global.css`), the `themeStore` (Zustand + MMKV) and `ThemeProvider`/`useTheme()` are now real — see `docs/context/architecture.md`. Next runnable after merge: **FND-003 ∥ FND-005** (both depend on FND-002).
