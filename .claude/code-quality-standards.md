# Code Quality Standards (Clean Code)

> Harness-wide coding standards, registered in `harness.config.md` → **Context
> Manifest** (key `code-quality-standards`; consumed by builders · reviewers ·
> unit-tester). This is the **always-on layer** — short enough to live in every
> code-writing agent's context so the first draft is already clean. Depth lives
> in the **`clean-code` skill** (`.claude/skills/clean-code/`), which loads on
> demand for naming nuance, the smell catalog, and the full review checklist.

Write and review all code to these standards. For depth, naming nuance, smell
catalog, or a full review, use the `clean-code` skill.

**These are heuristics, not laws — apply with judgment.** Use a rule when it
makes the code clearer or cheaper to change; relax or skip it when enforcing it
would be overkill (a small script doesn't need many tiny functions or an
abstraction layer). They are **language-agnostic in principle but idiomatic in
expression** — follow each language's conventions (e.g. Go returns errors as
values, not exceptions; Python uses EAFP; Rust uses `Result`/`Option`) and keep
the intent rather than imposing Java/OO mechanics. In review, tag severity
(blocking vs. suggestion vs. nit), match the bar to the code's purpose, and don't
drown the author in nits.

- **Names reveal intent.** No abbreviations, encodings, or single letters
  outside tiny scopes. Classes are nouns; methods are verbs; one word per
  concept. Replace magic numbers with named constants.
- **Small functions, one thing.** Keep functions short and at one level of
  abstraction. Prefer ≤3 arguments; no boolean/flag args; no output args; no
  hidden side effects (the name must tell the whole truth).
- **Express intent in code, not comments.** Prefer a better name or an extracted
  function over a comment. Never leave commented-out or dead code. Comments
  explain *why*, not *what*.
- **DRY.** Remove duplication by extraction; it's the primary design smell.
- **Errors via exceptions, not return codes.** Never return or pass `null`
  (use empty collections / Special Case objects). Give exceptions context. Keep
  error handling separate from the happy path.
- **SRP & low coupling.** One reason to change per class; keep classes small and
  cohesive; depend on abstractions, not concretes (keeps code testable).
- **Tests are first-class.** Cover logic and boundaries. Tests are F.I.R.S.T.
  (Fast, Independent, Repeatable, Self-validating, Timely), one concept each,
  clearly named. When generating non-trivial code, generate its tests.
- **Prefer polymorphism** over repeated if/else / switch on type.
- **Boy Scout Rule.** Leave every file you touch cleaner than you found it.

Before presenting generated code, self-review it against these points. When
asked to review code, invoke the `clean-code` skill and use its checklist.

## Structure & design

Default to the **simplest** design. For React Native / functional code, prefer
hooks + composition over class hierarchies and premature abstraction; introduce
a pattern only when a concrete, present problem matches it (rigid coupling,
conditional sprawl on type, real runtime variation). If you can't name the pain
it removes, don't add it.
