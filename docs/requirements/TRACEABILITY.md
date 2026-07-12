# Traceability Matrix — Todo App

> Every feature maps **feature → module → task → spec → status**. Seeded by `/intake`,
> grown by `/scope` + `/module`, kept honest by the librarian. **No feature is ever dropped silently.**
>
> `/scope` (2026-07-09) assigned every feature to a module. Task + spec columns fill in at `/module <id>`.

| Feature | Title | Priority | Area | Module | Task | Spec (brief) | Status |
|---|---|---|---|---|---|---|---|
| F-001 | Create User Profile | P0 | Profile | PRO | PRO-001 | Profile store + setup form | done |
| F-002 | Edit User Profile | P0 | Profile | PRO | PRO-002 | Profile view + edit | done |
| F-003 | Update Profile Picture | P2 | Profile | PRO | PRO-003 | Profile photo | done |
| F-004 | Remove Profile Picture | P2 | Profile | PRO | PRO-003 | Profile photo | done |
| F-005 | View User Profile | P0 | Profile | PRO | PRO-002 | Profile view + edit | done |
| F-006 | Persist Profile Data | P0 | Storage | STG | STG-002 | Profile + Task repositories | done |
| F-007 | Create Task | P0 | Tasks | TSK | TSK-002 | Create task | done |
| F-008 | View Task List | P0 | Tasks | TSK | TSK-001 | Tasks store + Home list | done |
| F-009 | View Task Details | P0 | Tasks | TSK | TSK-003 | Task detail + edit | done |
| F-010 | Edit Task | P0 | Tasks | TSK | TSK-003 | Task detail + edit | done |
| F-011 | Delete Task | P0 | Tasks | TSK | TSK-004 | Lifecycle actions | done |
| F-012 | Confirm Task Deletion | P1 | Tasks | TSK | TSK-004 | Lifecycle actions | done |
| F-013 | Mark Task as Completed | P0 | Tasks | TSK | TSK-004 | Lifecycle actions | done |
| F-014 | Mark Task as Pending | P0 | Tasks | TSK | TSK-004 | Lifecycle actions | done |
| F-015 | Duplicate Task | P2 | Tasks | TSK | TSK-004 | Lifecycle actions | done |
| F-016 | Assign Due Date | P1 | Tasks | TSK | TSK-005 | Due date | review |
| F-017 | Remove Due Date | P2 | Tasks | TSK | TSK-005 | Due date | review |
| F-018 | Display Task Creation Date | P2 | Tasks | TSK | TSK-003 | Task detail + edit | done |
| F-019 | Display Last Updated Date | P2 | Tasks | TSK | TSK-003 | Task detail + edit | done |
| F-020 | Search Tasks by Title | P0 | Search | ORG | ORG-002 | ORG-002.spec.md | ready |
| F-021 | Search Tasks by Description | P1 | Search | ORG | ORG-002 | ORG-002.spec.md | ready |
| F-022 | Real-Time Search | P1 | Search | ORG | ORG-002 | ORG-002.spec.md | ready |
| F-023 | Filter All Tasks | P0 | Filter | ORG | ORG-001 | ORG-001.spec.md | ready |
| F-024 | Filter Active Tasks | P0 | Filter | ORG | ORG-001 | ORG-001.spec.md | ready |
| F-025 | Filter Completed Tasks | P0 | Filter | ORG | ORG-001 | ORG-001.spec.md | ready |
| F-026 | Sort by Due Date | P1 | Sorting | ORG | ORG-003 | ORG-003.spec.md | ready |
| F-027 | Sort by Creation Date | P1 | Sorting | ORG | ORG-003 | ORG-003.spec.md | ready |
| F-028 | Sort Alphabetically | P2 | Sorting | ORG | ORG-003 | ORG-003.spec.md | ready |
| F-029 | Sort by Recently Updated | P2 | Sorting | ORG | ORG-003 | ORG-003.spec.md | ready |
| F-030 | Display Empty State | P1 | UI | FND | FND-005 | Shared UI primitives | done |
| F-031 | Display No Search Results | P1 | UI | ORG | ORG-002 | ORG-002.spec.md | ready |
| F-032 | Show Loading Indicator | P1 | UI | FND | FND-005 | Shared UI primitives | done |
| F-033 | Display Validation Errors | P0 | Validation | PRO | PRO-001 | Profile store + setup form | done |
| F-034 | Require Task Title | P0 | Validation | TSK | TSK-002 | Create task | done |
| F-035 | Prevent Duplicate Submission | P1 | Validation | TSK | TSK-002 | Create task | done |
| F-036 | Persist Task Data | P0 | Storage | STG | STG-002 | Profile + Task repositories | done |
| F-037 | Restore Local Data | P0 | Storage | STG | STG-001 | Typed storage service | done |
| F-038 | Handle Corrupted Local Data | P1 | Storage | STG | STG-001 | Typed storage service | done |
| F-039 | Bottom Tab Navigation | P0 | Navigation | FND | FND-003 | Navigation shell | done |
| F-040 | Navigate to Task Details | P0 | Navigation | TSK | TSK-003 | Task detail + edit | done |
| F-041 | Navigate to Edit Task | P0 | Navigation | TSK | TSK-003 | Task detail + edit | done |
| F-042 | Pull to Refresh | P2 | Tasks | TSK | TSK-001 | Tasks store + Home list | done |
| F-043 | Application Splash Screen | P1 | Application | FND | FND-004 | Bootstrap: splash·first-launch·offline | done |
| F-044 | First Launch Detection | P0 | Application | FND | FND-004 | Bootstrap: splash·first-launch·offline | done |
| F-045 | Light Theme (+dark) | P0 | UI | FND | FND-002 | Design system + theming | done |
| F-046 | Responsive Layout | P0 | UI | FND | FND-005 | Shared UI primitives | done |
| F-047 | Accessibility Labels | P2 | Accessibility | FND | FND-005 | Shared UI primitives | done |
| F-048 | Offline Operation | P0 | Application | FND | FND-004 | Bootstrap: splash·first-launch·offline | done |

**Coverage:** 48 features · 48 mapped to a module · **48 mapped to a task (9 FND + 4 STG + 6 PRO + 18 TSK + 11 ORG)** · 0 orphans. **FND, STG, PRO, and TSK modules all DONE** (coherence PASS + human integration go; local E2E deferred on all four — carried as a mandatory pre-`main` gate). All 18 TSK features (F-007–F-019, F-034, F-035, F-040, F-041, F-042) `done` (PRs #13–17 merged 2026-07-12). **ORG (the final module) planned + specs ready:** F-023/024/025 → ORG-001, F-020/021/022/031 → ORG-002, F-026/027/028/029 → ORG-003 — all `ready`, ORG-001 runnable. Once ORG is built + its Module DoD passes, all 48 features are delivered.

### Per-module coverage
| Module | Features | IDs |
|---|---|---|
| FND · Foundation & App Shell | 9 | F-030, F-032, F-039, F-043, F-044, F-045, F-046, F-047, F-048 |
| STG · Local Persistence | 4 | F-006, F-036, F-037, F-038 |
| PRO · Profile | 6 | F-001–F-005, F-033 |
| TSK · Task Management | 18 | F-007–F-019, F-034, F-035, F-040, F-041, F-042 |
| ORG · Search, Filter, Sort | 11 | F-020–F-029, F-031 |

## Notes
- Specs live at `docs/specs/<MODULE>/<MODULE>-<NNN>.spec.md`, authored just-in-time when a task enters the `/build` loop.
- **✅ OQ-1 RESOLVED:** build **local-only** (MMKV persistence, no backend, no auth) per the PRD; Axios/React Query layer stays **dormant** for future cloud sync. Other resolutions (email required, dark mode in MVP, no categories/priorities/export) in `REQUIREMENTS.md` → Open Questions.
- **Note on F-045 (Light Theme):** dark mode is now IN scope (OQ-10), so FND delivers **both** light and dark token sets — F-045 is realized as part of the theming task, extended to dark.
