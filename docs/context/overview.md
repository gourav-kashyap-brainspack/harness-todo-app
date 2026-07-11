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

**PRO in progress.** PRO-001 (profile store + RHF/Zod form pattern + Profile Setup) is built and gate-green (design→implement→1 polish loop) — PR #10, `status: review`, awaiting human merge-go. The app now has its **first interactive screen and first feature slice** (`features/profile`): `ProfileSetup` replaces the FND-003 placeholder with the real mandatory Name+Email form (no skip, OQ-2), backed by `profileStore` (hydrates from STG's `profileRepository`, never raw MMKV) and the app's first RHF+Zod form pattern (new Tier-1 `Button`/`FormField` primitives in `components/ui`, `Screen`'s `scroll` mode now keyboard-aware by default). On a valid submit it persists the profile and calls `setHasLaunched()` — closing the FND/STG first-launch seam (STG coherence gap e, the app can now genuinely leave `ProfileSetup`) — then routes to `Tabs`. Form-boundary validation (STG coherence gap f) is also now proven end-to-end: `zodResolver(profileSchema)` makes `saveProfile`'s throw-on-invalid path unreachable from the UI.

**Next runnable after PRO-001 merges: PRO-002** (profile view/edit + theme toggle, `blockedBy: [PRO-001]`). PRO-003 (profile photo) stays blocked on both PRO-001 and PRO-002. TSK remains `ready` (`/module TSK` not yet run) — the human's build-order preference is PRO before TSK, and TSK's task-validation form is expected to reuse the RHF+Zod pattern PRO-001 just anchored.
