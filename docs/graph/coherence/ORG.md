# Coherence Review — ORG (Search, Filter, Sort) · the final module

**Module:** ORG · **Date:** 2026-07-12 · **Baseline:** `06bdbd0..development` (the `/module ORG` plan commit → feature-complete `development`)
**Tasks:** ORG-001..003 all `done` (PRs #18–20 merged). **Reviewers:** architect + security-reviewer (READ-ONLY, concurrent). **Diff logs:** `docs/graph/logs/coherence-ORG-diff.log` (architect, 2460 lines, bounded) · `docs/graph/logs/coherence-ORG-sec-diff.log` (security).

## Verdict

```json
{ "module": "ORG",
  "checks": { "shape":"pass", "authz":"pass", "dataModel":"pass",
              "integration":"pass", "specGap":"pass", "dynamic":"pass" },
  "findings": [],
  "verdict": "PASS" }
```

**Structural coherence = PASS** (both lenses, zero unresolved findings). **Local E2E = DEFERRED** (human decision — see below). Module DONE pending **human integration go**.

## Architect lens (checks #1, #3, #4, #5 + DC1–DC5) — PASS

| Check | Verdict | Basis |
|---|---|---|
| **#1 Shape drift** | PASS | The 3 tasks form ONE shape — the pipeline seams (`FILTER_PREDICATES`, `matchesSearch`, `SORT_COMPARATORS`) all use the same lookup-map-with-safe-fallback idiom; the organize header is one coherent `View` (slot-1 search / slot-2 filter / slot-3 sort), not 3 bolted-on pieces. No later task re-solved an earlier one differently. |
| **#3 Data-model coherence** | PASS | `taskQueryStore` holds filter/sort (persisted) + search (in-memory) — no redundant state; never copies `tasks` (reads `useTaskStore`, derives). Persisted `{filter,sort}` is ONE Zod envelope via `createPersistedValue(StorageKeys.taskQuery, …)` — the STG typed-storage pattern, NOT the `themeStore` raw-key regression. `TaskFilter`/`TaskSortKey` `z.infer`-single-sourced. |
| **#4 Integration assumptions** | PASS | Every field ORG sorts/filters/searches on exists in `taskSchema` as assumed (`dueDate?` ISO → lexical `localeCompare` correct without `Date` parsing). Reads its OWN feature's store (same-feature); greeting reads `profileRepository` from core (no features→features). No `features/organize` slice. `ActionSheet.active` is presentational (reuses `NATIVE_CHROME_RGB.primary`, no new token, `destructive` precedence). Layering intact. |
| **#5 Spec-gap inheritance** | PASS | ORG is the last module — no downstream module. Two E2E/release notes recorded below. |
| **DC1** derived, non-mutating selector | PASS | `selectVisibleTasks` pure; `.slice()` before `.sort()`; store array never copied/reordered. |
| **DC2** one `{filter,sort}` envelope via typed service; search in-memory | PASS | `setFilter`/`setSort` rewrite the full envelope (no partial-write skew); `setSearch` never persisted; `search:''` on fresh read. |
| **DC3** reuse-or-block primitives | PASS | All 4 empty states reuse `EmptyState`; filter reuses `SegmentedControl`; sort reuses `ActionSheet`. No bespoke re-implementations. |
| **DC4** lives in features/tasks, no features→features | PASS | No `features/organize`; zero `features/profile|organize` imports in ORG files. |
| **DC5** OQ-8 (toggle never forces re-sort) | PASS | `created-desc`/`due`/`alpha` comparators don't read `updatedAt`, so a status toggle can't reorder under them; only `sort='updated'` reflects the bumped `updatedAt` (correct). |

## Security lens (check #2 — cross-module consistency) — PASS

| Check | Verdict |
|---|---|
| Untrusted-input consistency (ReDoS) | PASS — `matchesSearch` uses plain `String.includes` (trimmed + 128-char cap); grep across the whole `features/tasks` module found NO `RegExp`/`.match`/`.test`/`.search` built from user data (only a doc comment). ORG-003 introduced no new user-input string op. The promoted `[blocking]` "never regex-from-user-input" rule held module-wide. |
| Persisted-value integrity consistency | PASS — `{filter,sort}` persists ONLY via `createPersistedValue` (Zod `z.enum`, total-read → default); no raw MMKV write bypasses the schema (the only raw-key MMKV in `src` is FND's grandfathered theme/launch stores); `resolveComparator` + `FILTER_PREDICATES ?? .all` degrade safely. |
| View-layer purity | PASS — every predicate/comparator read-only; `.slice().sort()` guards in-place mutation; store persistence-order never corrupted. |
| Crash-resilience | PASS — `DUE_COMPARATOR` guards both `!dueDate`; `matchesSearch` guards optional `description`; ORG assumes nothing beyond the Zod schema. |
| Injection / sinks / secrets | PASS — search/labels/no-results message flow only into RN `Text`/menu/`.includes`; no eval/Linking/WebView; nothing logged; `ActionSheet.active` presentational. |
| Dependencies | PASS — none added across the module. |

## Findings

**None.** No emergent cross-module drift on either lens. All three module-level security invariants (ReDoS-safe search · schema-guarded persistence · pure view layer) are applied uniformly across ORG-001/002/003. (One a11y nit — the active sort option could add `accessibilityState={{selected:true}}` — is already tracked as a non-blocking ORG-003 per-task review follow-up, mitigated by the semibold+color cue + the trigger's dynamic announcement; not a coherence finding.)

## E2E gate (behavioral half of Module DoD)

**Status: DEFERRED (explicit human decision, 2026-07-12) — the 5th consecutive module deferral (FND, STG, PRO, TSK, ORG).**

The `e2e-automator` local Maestro run was not executed at this edge (disk pressure ~4.4 GB blocks the emulator + Maestro). **ORG is the last module**, so this was the final per-module E2E opportunity; the accumulated deferred-E2E debt now covers the entire app and MUST be paid down as the **combined all-module flow suite before any `development → main` promotion** (a mandatory local release gate regardless of the per-module deferrals).

**Two architect notes the combined E2E suite MUST heed (or it will false-fail):**
1. **The sort trigger is icon-only with a DYNAMIC accessibility label** — `IconButton icon="sliders"`, `accessibilityLabel = `Sort tasks, currently ${SORT_LABELS[sort]}`` (changes with the persisted sort). A flow tapping it must anchor on a stable prefix (regex `^Sort tasks`), never the full string. The sort *options* inside the sheet carry stable visible text (`Due date`/`Creation date`/`Alphabetical`/`Recently updated`); search/filter anchor on `Search tasks` / `All`·`Active`·`Completed` / `No results`.
2. **Cross-run non-determinism: filter+sort PERSIST in MMKV, search resets.** Conventions forbid `clearState` (wipes Keychain/MMKV, hangs the boot gate), so a prior flow that changed filter/sort leaves it persisted into the next run. An ORG flow asserting a specific list order MUST explicitly set the sort/filter it expects at the start, not assume the `created-desc`/`all` defaults. Search is safe (in-memory).

## Module DoD status

1. All 3 tasks meet the Task DoD (per-task gates green) — ✅
2. Coherence review = **PASS** (architect + security, zero findings) — ✅
3. Local E2E = **DEFERRED** (human decision; mandatory before `development → main`) — ⏸️
4. Human integration go — **PENDING** (awaiting sign-off)

Module is DONE upon the human integration go. **ORG is the final module** — its completion delivers all 48 features; the deferred all-module E2E batch + the `development → main` release lane are the only remaining steps.
