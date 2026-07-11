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
**FND and STG modules both COMPLETE (2026-07-11).** FND (5/5 tasks, PRs #3–#7) and STG (2/2 tasks, PRs #8–#9) are both `status: done`, `coherenceStatus: pass`, `e2eStatus: deferred` — human integration go given for both. See `docs/graph/coherence/FND.md` and `docs/graph/coherence/STG.md` for the full verdicts.

FND provides: a fully offline boot path (splash → first-launch check → ProfileSetup/Tabs), one semantic light/dark token set consumed everywhere, typed navigation (`RootStack` + bottom-tabs, typed params), two Zustand stores following one guarded-MMKV-preference shape (`themeStore`, `launchStore`), and three reusable UI primitives (`EmptyState`/`LoadingIndicator`/`Screen`, plus the app-wide Feather icon-family convention and the generalized native-prop-color rule). STG adds the complete typed-persistence layer on top: `core/services/storage.ts` (the single MMKV service — Zod-guarded, `{version,data}` envelope, total corrupt→safe-default reads, `createPersistedValue` store-hydration helper) → `core/services/{profileRepository,taskRepository}.ts` (the only read/write path for Profile/Task) → `core/types/{profile,task}.ts` (the domain model) → `core/lib/id.ts:newId()` — all on the same default MMKV instance FND's `themeStore`/`launchStore` already use (no key churn). See `docs/context/architecture.md` → "STG — module complete" for the full picture and `patterns-registry.md` for the 5 Tier-1 patterns it established. Both modules' local E2E is **deferred** by explicit human decision (headless/no-UI-yet), naturally exercised at the first UI module's edge instead; zero network/auth surface remains — dormant deps only (axios, react-query, jwt-decode, date-fns, keychain), per OQ-1.

**Next: PRO and TSK are both unblocked** (`blockedBy: [FND, STG]`, both satisfied) — need `/module PRO` and `/module TSK` to plan tasks. The human has a **build-order preference: PRO before TSK** (recorded as `sequencePreference` on the TSK module in `docs/graph/modules.json` — technically buildable in parallel, but TSK's task-validation reuses the RHF+Zod form pattern PRO's profile-setup form establishes first). Six forward spec-gaps from the STG coherence review are recorded in `docs/context/stack.md` for the architect to read before planning either module — notably: PRO must call `launchStore.setHasLaunched()` on setup-complete (or the app never leaves ProfileSetup), and PRO/TSK must validate at the form boundary since the repository write path throws on invalid input.
