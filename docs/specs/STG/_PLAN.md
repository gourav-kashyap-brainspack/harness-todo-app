# `/module STG` — Planning Report

> What the `/module STG` command produced, why, and how. Written 2026-07-11.
> This is a **report** (not a task spec — the `_` prefix means it is never a build target).
> The authoritative artifacts are the two task specs (`STG-001.spec.md`, `STG-002.spec.md`) and `docs/graph/modules.json`; this doc explains them.

---

## 1. What `/module STG` is

`/module <name>` is the **architect's planning pass** for one module. It does **not** write any application code. It turns a set of features into a **buildable plan**: one spec per task, wired into the task graph with dependencies, complexity, and traceability. Nothing is `ready` to build until every Open Question is resolved with the human.

For **STG (Local Persistence)** the command:
1. Booted + grounded itself in the real repo and the FND foundation.
2. Interrogated the human on the load-bearing architecture decisions (4 questions).
3. Decomposed the module into **2 tasks** and wrote a full spec for each.
4. Wired the tasks into the task graph + traceability matrix.
5. Committed the plan to `development` (`d78fe8b`).

ClickUp mirroring was **skipped** (the ClickUp MCP needs OAuth authorization, unavailable in this session) — the tasks will sync later via `/clickup-sync`.

---

## 2. Inputs & grounding (what was read before planning)

Planning is only as good as its grounding. Before writing anything, the architect read:

| Source | Why |
|---|---|
| `docs/requirements/TRACEABILITY.md` | which features belong to STG → **F-006, F-036, F-037, F-038** |
| `docs/requirements/features.csv` | the raw feature descriptions |
| `docs/graph/modules.json` → STG entry | the module `summary` + the 3 `coherenceChecks` the architect wrote at `/scope` |
| `mobile/src/core/store/themeStore.ts` + `launchStore.ts` | the **actual FND persistence code** STG must build on (the raw-MMKV guarded-read pattern) |
| `docs/context/stack.md` → FND spec-gaps | the coherence-review's forward guidance — esp. **gap (b)**: STG must adopt FND's existing MMKV keys without churn |
| `mobile/package.json` | confirmed **Zod 3** is installed (needed for guarded reads) and `core/services`/`core/types` are empty and waiting |

**Key facts this surfaced:**
- FND already persists two raw keys on the **default** MMKV instance: `theme.mode` (themeStore) and `app.hasLaunched` (launchStore).
- STG's job is the **typed storage service** that everything else persists through — but it must not disturb those existing keys, or the user's saved theme + first-launch state would be orphaned.

---

## 3. Interrogation — the 4 decisions that shaped the plan

The architect never invents answers to material questions. Four decisions genuinely changed the module's structure, so they were put to the human:

| # | Question | Decision | Consequence |
|---|---|---|---|
| 1 | Where do the persisted **Profile/Task shapes** (Zod schemas + types) live? | **STG owns them** in `core/types` + repositories | STG = **2 tasks** (service + repositories). The data model lives in the data layer; PRO/TSK build features on top. |
| 2 | How much **schema-migration machinery** now? | **Light `{version, data}` envelope** (no migration runners yet) | On-disk format is future-proofed cheaply; the first real migration is added only when a schema changes. |
| 3 | **Corrupt-data (F-038)** recovery behavior? | **Reset to safe default, never crash** (no quarantine) | Every read is "total" — returns a valid value for all inputs; a bad blob → empty list / null profile + a dev warning. |
| 4 | Where do **name + email** go? | **MMKV** (non-sensitive) | Consistent with FND's pattern; `react-native-keychain` stays reserved for real secrets (this local app has none). |

Because all four were resolved, both specs are `status: ready` (zero open questions) — the loop can build them without stalling.

---

## 4. How the work was divided & the reasoning

### The decomposition principle
STG has two genuinely different concerns, so it splits cleanly along that seam:

- **A generic capability** — "persist any typed value safely, restore it at boot, survive corruption." This is domain-agnostic plumbing. → **STG-001**
- **The concrete domain data** — the Profile and Task shapes + the repositories that persist them. This is specific. → **STG-002**

This mirrors the harness's **Tier-1 vs Tier-2 pattern rule**: the reusable *mechanism* (the storage service + hydration pattern) is solved **once** in the anchor task and reused everywhere; the domain-specific *repositories* sit on top. Building them as one blob would tangle "how we persist" with "what we persist" — two things that change for different reasons.

### Why STG-001 is first (and the anchor)
STG-002's repositories are literally `getItem`/`setItem` calls against STG-001's service — they cannot exist until the service does. So STG-001 `blockedBy: []` (runnable now), STG-002 `blockedBy: [STG-001]`. STG-001 is flagged the **anchor** — it establishes the storage + hydration pattern that not just STG-002 but **PRO and TSK** reuse, so it's built to an exceptional bar (the librarian later promotes its pattern to the registry).

### Why exactly 2 tasks (not 1, not 3)
- **Not 1:** the service and the domain repositories change for different reasons and have different blast radius; a reviewer approving "the MMKV envelope logic" shouldn't have to also review "the Task schema" in the same diff. Separable = smaller, focused PRs.
- **Not 3:** Profile and Task repositories are thin, near-identical layers over the same service — splitting them adds ceremony without isolating real risk. They share the schemas file and the repository pattern, so they belong in one task.

### Complexity & estimates
Both **M (≈4h)**. STG-001 carries the real complexity (the envelope, the total/never-throw read paths, the hydration helper, the default-instance adoption). STG-002 is mechanically simpler but spans two domains + schema validation + a uuid util + tests, so it's not an S. Total module ≈ **8h**.

### What STG deliberately does NOT do (boundary hygiene)
- It does **not** build the Profile/Task **feature stores** (business logic, screen actions) — those are PRO/TSK's. STG delivers the repositories + types + the hydration recipe; PRO/TSK plug into them.
- It does **not** rename or migrate FND's `theme.mode`/`app.hasLaunched` — it coexists on the same instance (spec-gap b).
- It does **not** add a migration framework, quarantine store, or encryption — all deferred as noted extension points (YAGNI for MVP).

---

## 5. What was produced — the two tasks

### STG-001 — Typed storage service ⚓ (`docs/specs/STG/STG-001.spec.md`)
Features **F-037** (Restore Local Data), **F-038** (Handle Corrupted Local Data).
- A single typed service in `core/services` over the **default** `MMKV` instance: `getItem<T>(key, schema, fallback)`, `setItem`, `removeItem`, `hasItem`, with a central `StorageKeys` registry.
- Every value wrapped in a `{ version, data }` envelope; reads unwrap + Zod-validate.
- **Total reads:** absent / malformed JSON / failed Zod / unknown version / thrown read → return `fallback`, never throw (F-038), dev-warn only.
- **Hydration helper / pattern** so a Zustand store seeds its persisted slice once at boot (F-037).
- **Adopts FND's keys** (spec-gap b): default instance, no churn; documents that themeStore/launchStore *could* later route through the service without breaking.

### STG-002 — Profile + Task schemas & repositories (`docs/specs/STG/STG-002.spec.md`)
Features **F-006** (Persist Profile Data), **F-036** (Persist Task Data); completes **F-037** for these domains.
- **`core/types`:** the persisted **Profile** (`name` req, `email` req, `photo?`) and **Task** (`id` uuid **string**, `title` req, `description?`, `status` enum, `dueDate?`, `createdAt`, `updatedAt`) Zod schemas + inferred types — the single source of truth.
- **`core/services`:** `profileRepository` (get/save/clear) + `taskRepository` (getTasks/saveTasks + `upsertTask`/`removeTask` transforms) — all via the STG-001 service; corrupt/absent → safe default.
- A `uuid` util in `core/lib`; the hydration wiring that restores both at boot.
- Documents the **STG-owns-persistence vs PRO/TSK-own-features** boundary.

---

## 6. Files changed — in order

The command touched **only planning/spec/graph docs** — zero application code (that's what `/build` does next).

| # | File | Action | What / why |
|---|---|---|---|
| 1 | `docs/specs/STG/` | created (dir) | home for STG task specs |
| 2 | `docs/specs/STG/STG-001.spec.md` | **created** | the storage-service spec (written first — it's the anchor/root) |
| 3 | `docs/specs/STG/STG-002.spec.md` | **created** | the repositories spec (depends on STG-001) |
| 4 | `docs/graph/modules.json` | edited | appended the 2 task nodes to `tasks[]` (id, featureIds, blockedBy, complexity, estimate, spec path, status `ready`) |
| 5 | `docs/graph/graph.mmd` | edited | replaced the STG "tasks pending" placeholder with the 2 real task nodes + the `STG-001 → STG-002` edge |
| 6 | `docs/requirements/TRACEABILITY.md` | edited | filled Task+Spec+status for F-006, F-036, F-037, F-038 (`mapped` → `ready`) |
| 7 | `docs/graph/STATUS.md` | edited | phase → "FND done; STG planned"; added the STG task table + decisions |
| 8 | _(commit)_ | `git commit` + push | `d78fe8b` on `development` — "plan(STG): module tasks + specs" |

**Order rationale:** specs first (the substance), then the graph/traceability that *index* them, then the board that *summarizes* them, then one atomic commit. The two specs were written anchor-first (STG-001 before STG-002) because STG-002's contract references STG-001's service API.

---

## 7. Traceability (no feature dropped)

| Feature | Title | Priority | Task | Spec |
|---|---|---|---|---|
| F-006 | Persist Profile Data | P0 | STG-002 | STG-002.spec.md |
| F-036 | Persist Task Data | P0 | STG-002 | STG-002.spec.md |
| F-037 | Restore Local Data | P0 | STG-001 | STG-001.spec.md |
| F-038 | Handle Corrupted Local Data | P1 | STG-001 | STG-001.spec.md |

**4/4 STG features mapped to a task** — 0 orphans.

---

## 8. Coherence spec-gaps applied (inherited from the FND review)

The FND module-edge coherence review recorded forward spec-gaps; two were STG's to honor and are now baked into the specs:

- **Gap (b) — adopt FND's MMKV keys, no churn** → STG-001 FR5: service uses the default MMKV instance; `theme.mode`/`app.hasLaunched` untouched. *(This is the one that would silently wipe user data if missed.)*
- **Gap (d) — `taskId: string`** → STG-002 FR1: Task `id` is a uuid **string**, matching the nav route contract TSK inherits.

---

## 9. Next steps

1. **`/build STG-001`** — the storage-service anchor. Pure data layer → no design step; loop = frontend → unit → security ∥ code-review → gate-runner → PR → human merge go.
2. **`/build STG-002`** — after STG-001 merges (it's `blockedBy` STG-001). Adds a small `uuid` dependency (resolved current-stable at build).
3. **STG Module DoD** — after STG-002 is done: coherence review + local E2E (per the same pattern FND followed).
4. **Then** PRO + TSK unblock (both need FND + STG).

---
_Generated by the architect (`/module STG`). Authoritative details live in the two task specs + `docs/graph/modules.json`; this report is the human-readable explanation._
