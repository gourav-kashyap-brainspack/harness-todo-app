# Requirements Digest — Todo App

> Planning source of truth, produced by `/intake` from `sources/Todo_PRD.docx` (v1.0, MVP) + `sources/features.xlsx`.
> Resolve the Open Questions with the human before `/scope` is finalized. Full PRD in [`prd.md`](./prd.md); feature inventory in [`features.csv`](./features.csv).

## Product goal
A cross-platform (iOS + Android) React Native to-do / task-management app. Users manage a personal profile and a list of daily tasks — create, edit, complete, search, filter, sort, and view task details — through a clean, fast, offline-first interface. Focus: **speed, simplicity, usability**.

## Personas
- **Primary user** — someone who wants an easy way to remember and organize daily work. Goals: quickly create tasks, organize/track work, view pending items, maintain a personal profile. Pain points: forgetting tasks, disorganization, over-complicated productivity apps, losing track of completed work.
- **Audience:** students, professionals, freelancers, teachers, personal-productivity enthusiasts.

## Screens (MVP)
Splash · Profile Setup (first launch) · Home (greeting · search bar · filter chips · task list · FAB) · Add Task · Edit Task · Task Detail · Profile.
**Navigation:** Splash → Profile Setup (first launch only) → Home → { Add Task · Task Detail · Edit Task · Profile }. Bottom-tab navigation between Home and Profile.

## Feature inventory (48 features)
### By priority
| Priority | Count | Meaning (assumed) |
|---|---|---|
| **P0** | 26 | MVP-critical — must ship |
| **P1** | 12 | Important — expected in MVP |
| **P2** | 10 | Nice-to-have — may defer |

### By area
| Area | Count | Feature IDs |
|---|---|---|
| Profile | 5 | F-001…F-005 |
| Storage | 4 | F-006, F-036, F-037, F-038 |
| Tasks | 14 | F-007…F-019, F-042 |
| Search | 3 | F-020, F-021, F-022 |
| Filter | 3 | F-023, F-024, F-025 |
| Sorting | 4 | F-026…F-029 |
| UI | 5 | F-030, F-031, F-032, F-045, F-046 |
| Validation | 3 | F-033, F-034, F-035 |
| Navigation | 3 | F-039, F-040, F-041 |
| Application | 3 | F-043, F-044, F-048 |
| Accessibility | 1 | F-047 |

Every one of the 48 is listed in [`features.csv`](./features.csv) and [`TRACEABILITY.md`](./TRACEABILITY.md) (currently all `unmapped` — `/scope` + `/module` will map them).

## Data model (from PRD §7.3)
- **Task:** `title` (required), `description`, `status` (active/completed), `dueDate` (optional), `createdAt`, `updatedAt`.
- **Profile:** `name` (required), `email` (optional), `photo` (optional). One profile per device.

## Non-functional requirements
- **Performance:** app startup < 3s; smooth scrolling; fast (real-time) search; responsive UI; minimal memory. (Risk: degradation at thousands of tasks.)
- **Reliability:** no crashes; safe local storage; recover from invalid/corrupted data; prevent duplicate task creation.
- **Security:** validate all user input; handle invalid/corrupted local data without crashing. (No auth in MVP.)
- **Usability / a11y:** mobile-first, clean UI, accessible touch targets, consistent spacing, responsive layouts, intuitive navigation, accessibility labels.
- **Maintainability:** modular architecture, reusable components, typed models, clean folder structure, unit-testable code.

## Constraints & assumptions (PRD §13–14)
- **Offline-first, local storage only. No backend. No cloud sync. No auth.** One profile per device. Internet not required. Data remains on device.
- Mobile app only; React Native only.

## Out of scope (PRD §15)
Login · Registration · Cloud Sync · REST APIs · Push Notifications · Calendar Integration · Task Sharing · Team Collaboration · Attachments · Voice Notes · AI Assistant · Widgets · Multi-user.

## PRD tech stack vs. harness stack — ⚠️ CONFLICT (see OQ-1)
The PRD §12 and the harness config **disagree on the persistence + networking layer**. This is the single most important thing to resolve before `/scope`.

| Concern | PRD §12 / §14 says | Harness (`harness.config.md`) says |
|---|---|---|
| Backend | **None** — offline-first, local only | "frontend-only client **consuming a remote backend API**" |
| Persistence | **AsyncStorage** | `react-native-keychain` + `react-native-mmkv` (no AsyncStorage) |
| Networking | **None** (no REST) | **Axios** + **TanStack React Query** against a remote API |
| Auth | **None** | JWT interceptor, `jwt-decode`, Keychain token storage |
| Icons | React Native Vector Icons | (not specified) |

**Agreements:** React Native + TypeScript, React Navigation, Zustand, Zod, React Hook Form, NativeWind, Jest + RN Testing Library.

The Project Profile is already set to `offlineTier: read-cache` (a React Query persister pattern), which itself assumes a server. **The PRD describes a purely local app with no server at all.** These cannot both be right — resolve via OQ-1 below.

> **✅ RESOLVED (OQ-1):** build **local-only per the PRD** (MMKV persistence, no server, no auth). The Axios/React Query/JWT layer stays installed but **dormant** for a future cloud-sync phase — it is not wired to any backend and must not gate the offline build.

## Open Questions — RESOLVED 2026-07-09
Sourced from the PRD §19 plus intake-detected gaps. Resolved with the human at intake.

### Resolved
- **OQ-1 (was BLOCKING) — ✅ Local-only now, keep API layer dormant.** Build offline-first per the PRD: **no backend, no auth, all data on-device**. Persist locally via **MMKV** (modern AsyncStorage replacement) + `react-native-keychain` for any sensitive bits. **Leave the Axios / React Query scaffolding in place but dormant** for a future cloud-sync phase — do NOT wire it to a server now, and do NOT let it gate the offline build. `harness.config.md` stays as-is (API layer carried but unused); the app is local-only. Cloud sync (OQ-11) is the future phase this dormant layer anticipates.
- **OQ-2 — ✅ Profile setup MANDATORY; name AND email both required.** First launch forces Profile Setup before Home (per §6 user journey). **Both `name` and `email` are required** (overrides the PRD's "email optional"); photo remains optional (OQ-3). Validation (F-033/Zod) enforces both.
- **OQ-3 — ✅ Profile photo optional** (P2 features F-003/F-004 confirm).
- **OQ-4 — ✅ No task categories** in MVP.
- **OQ-5 — ✅ No task priorities** in MVP.
- **OQ-6 — Reminders/notifications: out of MVP** (§15); future.
- **OQ-7 — ✅ Due dates optional** (F-016).
- **OQ-8 — Completed tasks stay in sort order** (no forced auto-move-to-bottom) unless a later design pass says otherwise; the sort options (F-026…029) govern ordering.
- **OQ-9 — ✅ No data export** in MVP.
- **OQ-10 — ✅ Dark mode INCLUDED in MVP** (extends F-045 "Light Theme" → light **and** dark). Design must define both token sets; theming is part of MVP scope.
- **OQ-11 — Cloud sync: future** (out of MVP; the dormant API layer from OQ-1 is what it will build on).
- **OQ-12 — ✅ Accepted:** acceptance criteria authored per-task at `/module` from the PRD (feature sheet has no acceptance column).
- **OQ-13 — ✅ Confirmed:** P0 = MVP-critical · P1 = important · P2 = nice-to-have (defer-able) — drives sequencing.

### Scope deltas from resolutions (carry into `/scope`)
- **Profile:** email is now **required** (not optional) — affects F-001, F-002, F-005, F-033.
- **Theming:** MVP now includes **dark mode** — affects F-045 and adds design-system work (light + dark token sets); the `design` agent owns both.
- **Storage:** local-only via **MMKV** (not AsyncStorage, not a remote API) — affects F-006, F-036, F-037, F-038. React Query/Axios remain installed but **dormant**.
- **Out of MVP (confirmed):** categories, priorities, export, reminders, cloud sync.
