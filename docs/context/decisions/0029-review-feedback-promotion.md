# ADR 0029 — Review-feedback promotion (recurring review finding → executable check)

**Date:** 2026-06-24 · **Status:** accepted · **Context:** harness-engineering self-review (adopted from *learn-harness-engineering*, lecture 10) · **Relates to:** the `code-reviewer` + `librarian` agents, `docs/context/conventions.md` → Pattern policy, `eslint.config.base.mjs`, ADR 0028 (the subtractive twin)

## Context
We already turn some invariants into mechanical checks with agent-oriented messages — the web ESLint config bans raw `fetch()` ("HARNESS-AUDIT #5") and off-system hex colors, each with a message that states the fix. But that promotion happens *ad hoc*, when a human happens to notice. The recurring path goes unmanaged: the code-reviewer flags the same class of finding across tasks, builders fix it each time, and it never becomes a guard. A reviewer finding is enforced only while a reviewer happens to catch it; a lint rule is enforced on **every** commit and can't be bypassed — the same "primitive, not document" argument as the traceability gate (ADR 0024). Architecture invariants that today live only as prose in `conventions.md` ("no DB calls in React components", "controllers stay thin") are exactly this kind of unenforced rule.

## Decision
Make promotion an explicit loop owned by two roles we already run:
- **Code-reviewer flags candidates.** When a blocking finding is a *recurring* Tier-1 anti-pattern (seen on a prior task, or an obvious class that will recur — e.g. DB call in a React component, a controller touching Prisma directly, a hand-rolled response envelope), tag it **`[promote]`** in addition to `[blocking]`. The builder still fixes it this task; the tag means "this class should become a mechanical check."
- **Librarian promotes it.** On task done (and at the module edge), the librarian converts each `[promote]` finding into the cheapest durable check that catches the class — an ESLint `no-restricted-syntax`/`no-restricted-imports` rule, a `grep` guard, or a test — **with an agent-oriented message** (what · why · how-to-fix, like the existing `fetch` ban). If a check isn't yet feasible, it records the rule in `conventions.md`/`patterns-registry.md` so the reviewer keeps enforcing it by hand until it can be mechanized.
- **Every promoted check cites its origin** in an inline comment (`// promoted from <task>/<finding>, ADR 0029`), the way the `fetch` ban cites "HARNESS-AUDIT #5". That inline citation *is* the index — no separate tracking file to drift.

## Consequences
- Prose-only architecture invariants get a mechanical path to enforcement, closing the prose-vs-enforced gap that the agent-authz / main-guard hooks already close for roles and `main`.
- The harness gets *stronger per review*, automatically — each recurring finding becomes a permanent line of defense (lecture 10's "review-feedback promotion makes the harness automatically stronger").
- Composes with **ADR 0028**: a promoted check is itself ablatable later if a stronger model makes it redundant — promotion and simplification are the two directions of the same loop.
- Scope guard: promote only **recurring Tier-1** classes — a one-off bug is never promoted (it would just add lint noise). Mirrors the patterns-registry's "promote only when genuinely reusable" rule.
