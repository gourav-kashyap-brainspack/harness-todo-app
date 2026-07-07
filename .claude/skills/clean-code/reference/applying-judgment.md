# Applying Judgment — when to enforce, relax, or skip

These principles are **heuristics, not laws**. Clean Code itself says rules are a
matter of discipline *and* judgment — the goal is readable, changeable code, not
a checklist score. Enforcing a rule where it doesn't pay is its own code smell
(over-engineering, premature abstraction, dogmatism). Optimize for the human who
reads this next, in *this* context.

## The deciding question
For any rule, ask: **does applying it here make the code clearer and easier to
change, or just more "compliant"?** If it doesn't improve clarity or
changeability, don't apply it. Cost of the change must be worth the benefit.

## Calibrate to context

Apply rules **strictly** when:
- The code is production, long-lived, shared, or on a hot path for change.
- It's a public API, library, or module boundary others depend on.
- The codebase is large or the team is big — consistency and low coupling pay off.
- The logic is complex, security-sensitive, or error-prone.

**Relax** (favor simplicity/speed over ceremony) when:
- Throwaway code: scripts, spikes, prototypes, one-off migrations, glue.
- Small scripts where a single 40-line `main` is clearer than 6 tiny functions.
- Tests/fixtures where some duplication reads better than a clever abstraction.
- Early exploration where the right abstraction isn't known yet — duplicate
  first, extract once the pattern is real (Rule of Three: abstract on the third
  occurrence, not the first).
- Performance-critical sections where an extra function call or indirection
  measurably hurts — measure, don't guess.

## Don't over-apply — common overkill traps
- **Too many tiny functions.** Splitting until names just restate one line, or
  forcing readers to jump across 8 functions to follow one idea, hurts more than
  a single coherent 15-line function. Extract for *reuse* or a *real* second
  level of abstraction — not to chase a line count.
- **Premature abstraction / speculative generality.** Don't build interfaces,
  factories, or config hooks for needs that don't exist yet (YAGNI). Wrong
  abstraction is costlier than duplication — "prefer duplication over the wrong
  abstraction."
- **DRY zealotry.** Two pieces of code that look alike but change for different
  reasons are *not* duplication. Coupling them via a shared helper creates a
  worse problem. DRY is about single sources of *knowledge*, not identical text.
- **Comment purism.** A short comment explaining a non-obvious *why*, a tricky
  algorithm, a regex, or a workaround is good. Don't delete genuinely helpful
  context just because "comments are smells."
- **One-assert dogma.** "One concept per test" is the real rule; a few related
  asserts checking one behavior is fine.
- **Argument-count dogma.** Sometimes a constructor or a math/graphics call
  legitimately needs several parameters. Prefer grouping, but don't contort the
  design to hit "≤3."
- **SRP over-splitting.** Don't shatter a cohesive class into anemic fragments;
  cohesion matters as much as responsibility count.

## Respect language & ecosystem idioms (language-agnostic ≠ identical)
The *principles* are universal; their *expression* is per-language. When a Clean
Code rule (Java/OO-flavored) conflicts with an established idiom, follow the
idiom and keep the underlying intent (clarity, explicit error handling, small
units):
- **Go** — errors are values returned explicitly (`if err != nil`), *not*
  exceptions. That's idiomatic, not a smell. Short variable names in small
  scopes (`i`, `r`, `ctx`) are normal. Don't impose getter/setter or
  exception-based error handling.
- **Python** — prefer EAFP (`try/except`) and context managers; follow PEP 8;
  dataclasses/namedtuples are fine "data structures." `_private` convention, not
  access modifiers. Comprehensions over hand-rolled loops when clear.
- **Rust** — `Result`/`Option` and the `?` operator instead of exceptions or
  null; ownership shapes design. "Don't return null" maps to "use `Option`."
- **JS/TS** — modules over classes is fine; async/await error handling; favor
  pure functions; `null`/`undefined` discipline via types.
- **Functional languages / styles** — immutability, pure functions, and
  composition replace many OO rules; "no side effects" is the default, not the
  exception.
- **SQL / declarative / config** — most function/class rules simply don't apply;
  focus on naming, readability, and avoiding duplication.

## In review mode
- **Severity-tag findings:** blocking (bug, security, real maintainability
  hazard) vs. suggestion vs. nit. Don't drown a review in nits.
- **Match the bar to the code's purpose** — hold a prototype PR to a lighter
  standard than a core-library PR, and say so.
- **Explain the *why* and the tradeoff**, and acknowledge when a rule is
  optional here. "This is fine as-is; if this grows, consider extracting X."
- Prefer recommending the highest-leverage 20% of changes over flagging every
  deviation.

## Bottom line
Clean code is a means, not an end. Use these rules to make code clearer and
cheaper to change. When a rule would do the opposite in the situation at hand,
that's the rule telling you to stop — note the tradeoff and move on.
