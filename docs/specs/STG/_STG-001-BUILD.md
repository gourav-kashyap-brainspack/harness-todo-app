# `/build STG-001` — Build Report

> What the `/build STG-001` command produced, the gate loop it went through, and why the code looks the way it does. Written 2026-07-11.
> A **report** (the `_` prefix means it's never a build target). Authoritative code is `mobile/src/core/services/storage.ts` (+ tests + types); this doc explains it.

---

## 1. What STG-001 is

**STG-001 — Typed storage service** is the **anchor** of the Local Persistence module: the *single* primitive every domain (Profile, Tasks, and any future persisted state) reads and writes through. Nothing else in the app touches `react-native-mmkv` for domain data. It delivers two features:
- **F-037 — Restore Local Data** (load persisted state at boot)
- **F-038 — Handle Corrupted Local Data** (recover gracefully, never crash)

It runs in `human-gated` mode, so it went through the full gate loop to green and then **stopped for the human's merge** (PR #8 open at time of writing).

---

## 2. What was implemented

### The service — `mobile/src/core/services/storage.ts`
A generic, Zod-validated API over **one default MMKV instance**:

```ts
getItem<T>(key, schema: ZodSchema<T>, fallback: T): T   // read → unwrap envelope → validate → or fallback
setItem<T>(key, schema, value: T): void                 // validate → wrap → persist
removeItem(key): void
hasItem(key): boolean
createPersistedValue<T>(key, schema, fallback): { hydrate: () => T; persist: (v: T) => void }
export const CURRENT_STORAGE_VERSION = 1
export const StorageKeys = { … } // single registry of persisted key strings (STG-002 populates it)
```

**Three mechanisms make it robust:**
1. **`{version, data}` envelope** — every value is wrapped with a schema version, so the on-disk format can evolve later. A `migrate()` seam is stubbed (accepts v1, returns an `UNMIGRATABLE` sentinel otherwise) as the extension point.
2. **Total, never-throwing reads (F-038)** — `getItem` is wrapped so that *every* failure mode (absent key · malformed JSON · non-envelope shape · unhandled version · failed Zod validation · a thrown native read) returns the caller's `fallback` and emits a `__DEV__`-only warning. A corrupt store can never crash the boot.
3. **Hydration helper (F-037)** — `createPersistedValue` bundles the (key, schema, fallback) triple into `{hydrate, persist}`, the exact recipe a Zustand store uses to seed itself once at init and write back on change. **This is the pattern STG-002 / PRO / TSK copy verbatim.**

**A deliberate asymmetry:** `getItem` *never* throws (corrupt *storage* is expected and handled), but `setItem` *does* throw if the caller passes a value that fails its own schema — because that's a *programmer bug*, not corrupt data, and should surface loudly.

### The types — `mobile/src/core/types/storage.ts`
The `StorageEnvelope<T>` / `PersistedValue<T>` types (the on-disk shape), kept in `core/types` so the service imports them cleanly (correct layer direction).

---

## 3. Files changed — in order

STG-001 touched **only 3 application files** (+ orchestration/doc state). Pure data layer — no UI, no native changes.

| # | File | Action | What |
|---|---|---|---|
| 1 | `docs/graph/modules.json` | edited | STG-001 → `in-progress` + `startedAt` (orchestrator stamp at branch creation) |
| 2 | `mobile/src/core/types/storage.ts` | **created** | envelope types (the shape both service + tests reference) |
| 3 | `mobile/src/core/services/storage.ts` | **created** | the storage service (the substance) |
| 4 | `mobile/src/core/services/storage.test.ts` | **created** | 70-test suite — round-trips, every failure mode, mocked throwing read, hydration, same-instance |
| 5 | _(gate fixes, iteration 2)_ | edited `storage.ts` + `storage.test.ts` | the review fixes (see §4) |
| 6 | `docs/context/*` + `modules.json` + `TRACEABILITY.md` + `STATUS.md` | edited (librarian) | promoted 2 patterns; STG-001 → `review` |

**Order rationale:** types before the service (the service depends on them), service before tests, then the review-driven fixes, then the librarian's doc updates. One implementation commit + one librarian commit, both on `feat/STG-STG-001`.

---

## 4. The gate loop — 2 iterations (the interesting part)

STG-001 did **not** pass on the first try — and that's the system working.

### Iteration 1
All static + behavioral gates green: **typecheck · lint · unit (69 tests) · build · security PASS**. But the **code-review gate returned REQUEST_CHANGES** — and, notably, the **security reviewer independently flagged the same issue**:

> **Blocking bug:** `migrate()` used `null` as its "unmigratable / corrupt" sentinel, and `getItem` treated `migrated === null` as corrupt. But `null` is *also a valid persisted value*. A caller with a nullable schema that persists `{version:1, data:null}` would have its legitimate `null` **silently discarded as corrupt** and replaced with the fallback — plus a false "unhandled version" warning.

Why it mattered enough to block: this is the **anchor** — the bug would have been copied verbatim into STG-002, PRO, and TSK, where it's expensive to trace. A latent data-integrity defect in a foundation is worth stopping for.

### Iteration 2 (the fix)
The builder (resumed with full context) fixed three things:
1. **[blocking]** Replaced the `null` sentinel with a module-private **`Symbol('storage.unmigratable')`** — a symbol can never be produced by `JSON.parse`, so it can't collide with any persisted value (including `null`). Added a **non-tautological regression test**: persist `null` under a `z.string().nullable()` schema → assert `getItem` returns `null` (not the fallback) with no warning.
2. **[nit]** Fixed 3 tests that set a `mockReturnValueOnce`/`mockImplementationOnce` but called `getItem` twice — the second call ran on an exhausted mock, silently testing the wrong failure path. Now each captures the single call's result.
3. **[Low/security]** The corrupt-blob dev-warning logged `String(error)`, which could echo a fragment of a corrupt blob — a PII risk once STG-002 routes name/email through the service. Now logs `error.name` only.

Re-verified: **typecheck · lint · unit (70 tests) · build** green; **code-review re-APPROVE**. → all 6 gates green.

---

## 5. Key design decisions

| Decision | Why |
|---|---|
| **Default MMKV instance** (`new MMKV()`, no id/encryption) | **Coherence spec-gap (b):** FND's `theme.mode` + `app.hasLaunched` live on the default instance. A custom instance/encryption would make them unreadable → silently orphan the user's theme + first-launch state. The service coexists; it never touches those keys. |
| **`{version,data}` envelope + `migrate()` seam** | Future-proofs the on-disk format cheaply, without building a full migration framework now (YAGNI). |
| **`getItem` never throws; `setItem` may** | Corrupt *storage* is expected (handle it); an invalid *caller value* is a programmer bug (surface it). |
| **`Symbol` sentinel, not `null`** | (from the review) so the "unmigratable" marker can't collide with a real persisted value. |
| **Log `error.name`, not the error string** | (from the review) so a corrupt-blob parse error can't echo PII to the dev console. |
| **`StorageKeys` registry** | one source of truth for persisted key strings — prevents key-string drift across STG-002/PRO/TSK. |

---

## 6. How STG-001 is reused downstream

- **STG-002** defines the Profile + Task Zod schemas and builds `profileRepository`/`taskRepository` as thin `getItem`/`setItem` calls against this service; its stores hydrate via `createPersistedValue`.
- **PRO / TSK** build their feature stores on those repositories — they never import MMKV or re-implement persistence (the code-reviewer blocks it).
- The librarian promoted **2 Tier-1 patterns** to the registry — *Typed storage service* and *Store hydration pattern* — and marked FND's older "MMKV raw-preference" row **superseded**.

---

## 7. Verification (final gate results)

| Gate | Verdict |
|---|---|
| Typecheck (`tsc --noEmit`) | ✅ PASS |
| Lint (`eslint --max-warnings=0`, boundaries) | ✅ PASS |
| Unit + coverage | ✅ PASS — 15 suites / **70 tests**; `storage.ts` 100% stmts/funcs, ~89% branches |
| Build (`assembleDebug`) | ✅ PASS |
| Security | ✅ PASS — deserialization of untrusted local storage proven safe (0 High/0 Critical) |
| Code review | ✅ APPROVE (iteration 2) |

**Gate loop:** 2 iterations. **PR:** [#8](https://github.com/gourav-kashyap-brainspack/harness-todo-app/pull/8), base `development`.

---

## 8. Status & next

- **STG-001:** all gates green, **awaiting human merge** (PR #8). On merge → reconcile to `done` (branch preserved per preference), STG-002 unblocks.
- **STG-002** (the module's last task) is `ready`, blocked only on STG-001's *merge*. After it completes → the **STG Module DoD** (coherence + E2E).

---
_Generated by the orchestrator (`/build STG-001`). Authoritative artifacts: `mobile/src/core/services/storage.ts` + tests, `docs/specs/STG/STG-001.spec.md`, the run-ledger, and PR #8._
