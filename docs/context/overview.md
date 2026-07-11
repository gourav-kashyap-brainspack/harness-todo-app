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
**FND module COMPLETE (2026-07-11).** All 5 tasks merged (PRs #3–#7); coherence review **PASS** (structural, zero findings); human integration go given; local E2E **deferred** by explicit human decision (no end-to-end-testable surfaces yet — `.maestro/` has no flows, PRO/TSK screens are still placeholders). See `docs/graph/coherence/FND.md` for the full verdict and the 5 forward spec-gaps (mirrored in `docs/context/stack.md`).

The foundation now provides: a fully offline boot path (splash → first-launch check → ProfileSetup/Tabs), one semantic light/dark token set consumed everywhere, typed navigation (`RootStack` + bottom-tabs, typed params), two Zustand stores following one guarded-MMKV-preference shape (`themeStore`, `launchStore`), and three reusable UI primitives (`EmptyState`/`LoadingIndicator`/`Screen`, plus the app-wide Feather icon-family convention and the generalized native-prop-color rule). Zero network/auth surface — dormant deps only (axios, react-query, jwt-decode, date-fns, keychain), per OQ-1.

**STG in progress.** STG-001 (typed storage service — the module's anchor) done: all gates green after a 2-iteration loop — PR #8, `status: review`, awaiting human merge-go. It ships `core/services/storage.ts`, the app's single persistence primitive (`getItem`/`setItem`/`removeItem`/`hasItem`, Zod-guarded, `{version,data}` envelope with a `migrate()` seam, corrupt→safe-default reads that never throw, a `StorageKeys` registry, and the `createPersistedValue` store-hydration helper) on the same default MMKV instance FND's `themeStore`/`launchStore` already use (no key churn — coherence spec-gap b). See `docs/context/architecture.md` → "core/services" and `patterns-registry.md` → "Typed storage service" / "Store hydration pattern". **Next runnable after merge: STG-002** (Profile + Task persisted schemas & repositories, needs STG-001). PRO and TSK remain blocked on STG.
