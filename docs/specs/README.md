# Specs layout

Task specs live under `docs/specs/`. **`docs/graph/modules.json` is the index** — every task's `spec` field is the authoritative path to its spec. Consumers (builders, reviewers, `/spec`, `verify-traceability`) resolve a spec **through that pointer**, never by rebuilding the path from the task-id. This is what makes the layout below transparent — you can nest freely without touching any consumer.

## Layout

```
docs/specs/
  _TEMPLATE.spec.md                 # skeleton — copied to author a new spec (NOT a task)
  <MODULE>/
    <MODULE>-<NNN>.spec.md          # flat: one spec per task (the default)
    <subgroup>/                     # OPTIONAL: group a cluster of related tasks in a large module
      _overview.spec.md             # the sub-group's SHARED contract (NOT a task)
      <task-id>.spec.md             # a task in the sub-group
```

- **Flat is the default.** Most modules just have `docs/specs/<MODULE>/<task>.spec.md`.
- **Sub-group dirs are for scale.** When a module has many tasks, or a monolith task splits into a cluster (e.g. Admin → Users · Departments · Patients · Branding · Billing-config), group them in a sub-directory so a big enterprise project doesn't scatter dozens of specs flat in one folder. Example: `docs/specs/<MODULE>/<subgroup>/<task-id>.spec.md`.

## `_`-prefixed files are NOT tasks
Anything whose filename starts with `_` is a non-task artifact and is **never** registered as a task in `modules.json`:

- **`_TEMPLATE.spec.md`** — the skeleton you copy.
- **`_overview.spec.md`** — a sub-group's **shared contract**: common API/types, cross-cutting decisions, and the **open questions that gate every child task in the group**. A child spec cannot reach `status: ready` while an `_overview` open-question it depends on is still open. Record the group's `source-features` on the `_overview` for traceability (the children reference it).

## Rules
- Set the task's `spec` path in `modules.json` when you create the spec — a task's `spec` pointer **must resolve to a file** (enforced by `.claude/scripts/verify-traceability.mjs`; a committed pointer to an uncommitted/missing spec is a drift error).
- Commit the spec file in the SAME change as its `modules.json` pointer — never commit the pointer alone.
- Keep specs authored from `_TEMPLATE.spec.md` so every task carries the mobile sections (Platform divergence · Offline · Accessibility · Deep links & permissions · Performance budget).
