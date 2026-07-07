---
name: clean-code
description: >-
  Apply Clean Code principles (Robert C. Martin) when WRITING, GENERATING, or
  REVIEWING code in any language. Use this skill whenever producing new code,
  refactoring existing code, doing a code review, or when the user mentions
  "clean code", "code quality", "best practices", "refactor", "code smell",
  "readability", "maintainability", "naming", "review this code", or asks
  whether code is well written. The principles are language-agnostic; apply the
  spirit even when examples differ from the target language.
---

# Clean Code

A distilled, working reference of the principles from *Clean Code: A Handbook of
Agile Software Craftsmanship* (Robert C. Martin, 2008). Use it in two modes:

- **Generation mode** — while writing or refactoring code, hold these rules as
  active constraints so the first draft is already clean.
- **Review mode** — when auditing code, walk the relevant checklist and report
  concrete, located issues with suggested fixes.

## Core philosophy

Clean code is code that is **easy to read, easy to change, and does one thing
well**. It reads like well-written prose: a later reader should grok intent
without decoding. The cost of a mess compounds — every shortcut taxes all future
work. Three anchoring rules:

- **The Boy Scout Rule** — leave the code cleaner than you found it. Every edit
  is a small chance to improve a name, split a function, or delete dead code.
- **Care over cleverness** — write for the human who reads it next, not to show
  off. Clever code that is hard to follow is a defect.
- **Judgment over dogma** — these are heuristics, not laws. Apply a rule when it
  makes the code clearer or cheaper to change; relax or skip it when enforcing
  it would be overkill (a 30-line script doesn't need 6 functions and an
  interface). Optimize for clarity in *this* context, not checklist compliance.

> **Language-agnostic.** Principles apply to every language; their *expression*
> follows each language's idioms. When a rule (often Java/OO-flavored) conflicts
> with an established idiom — e.g. Go returns errors as values rather than
> throwing — follow the idiom and keep the intent. See `reference/applying-judgment.md`.

## The non-negotiables (apply to every change)

1. **Meaningful names.** Names reveal intent. No abbreviations, no mental
   mapping, no encodings. A name should answer why it exists, what it does, how
   it's used.
2. **Small functions that do one thing.** A function should do one thing, do it
   well, and do it only. Prefer < ~20 lines, ideally fewer. One level of
   abstraction per function.
3. **Few arguments.** Zero is ideal, then one, then two. Avoid three+. Never
   pass flags (booleans) that make the function do two things. No output args.
4. **No side effects.** A function's name should tell the whole truth. Hidden
   state changes are lies.
5. **Comments are a last resort.** Explain yourself in code. A comment is an
   apology for failing to be clear. Delete commented-out code and noise.
6. **Don't Repeat Yourself (DRY).** Duplication is the root of most evil in
   software. Extract it.
7. **Handle errors with exceptions, not return codes.** Don't return or pass
   `null`. Keep error handling separate from logic.
8. **Tests are first-class.** Test code is as important as production code. Keep
   it clean. One assert / one concept per test. Follow F.I.R.S.T.
9. **Classes small and cohesive.** Single Responsibility Principle — one reason
   to change. High cohesion, low coupling. Depend on abstractions.
10. **Leave it cleaner.** Apply the Boy Scout Rule on every touch.

> These are defaults, not absolutes. Before enforcing any of them, sanity-check
> against `reference/applying-judgment.md` — context (prototype vs. production,
> small script vs. shared library, language idiom) decides how hard to apply.

## When to read the reference files

Load only the file relevant to the task at hand — don't read them all:

- `reference/applying-judgment.md` — **when to enforce, relax, or skip a rule;
  avoiding overkill; language-idiom adaptations.** Consult whenever a rule feels
  heavy-handed for the situation, or before flagging something in review.
- `reference/naming.md` — choosing names for variables, functions, classes.
- `reference/functions.md` — function size, arguments, one-thing, structure.
- `reference/comments-formatting.md` — good vs. bad comments, vertical/horizontal formatting.
- `reference/objects-boundaries.md` — objects vs. data structures, Law of Demeter, third-party boundaries.
- `reference/error-handling.md` — exceptions, null handling, error context.
- `reference/classes-systems-design.md` — SRP, cohesion, SOLID, systems, emergent design, concurrency.
- `reference/tests-tdd.md` — TDD laws, clean tests, F.I.R.S.T.
- `reference/code-smells.md` — the smells & heuristics catalog (G/N/F/C codes) for review.
- `reference/review-checklist.md` — the pass/fail rubric to run during a code review.

## Review workflow

When asked to review code: read `reference/review-checklist.md` and
`reference/code-smells.md`, then report findings as `file:line — smell — why —
suggested fix`, ordered by severity. Praise what's done well too. Never rewrite
silently; explain the principle behind each change so the author learns it.

## Generation workflow

When writing code: draft to satisfy the non-negotiables above on the first pass,
then self-review against `reference/review-checklist.md` before presenting.
Prefer small, well-named functions and intention-revealing structure over
comments.
