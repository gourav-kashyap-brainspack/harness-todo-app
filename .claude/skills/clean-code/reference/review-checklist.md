# Clean Code Review Checklist

Run this when reviewing or self-reviewing code. For each item, flag concrete
violations as `file:line — code — issue — suggested fix`. Cite the smell code
from `code-smells.md` where it applies. Praise good practices too.

## Names
- [ ] Names reveal intent; no abbreviations, encodings, or mental mapping (N1–N7)
- [ ] Classes are nouns, methods are verbs; one word per concept; no puns
- [ ] Magic numbers/strings replaced by named constants (G25)
- [ ] Name length matches scope (N5)

## Functions
- [ ] Small; does one thing; one level of abstraction (G30, G34)
- [ ] ≤2–3 arguments; no flag/selector args; no output args (F1–F3, G15)
- [ ] No hidden side effects; name tells the whole truth (N7, G31)
- [ ] Command/query separated
- [ ] No dead/unreachable functions (F4, G9)

## Comments
- [ ] No commented-out code (C5); no redundant/obsolete comments (C2–C3)
- [ ] Remaining comments explain *why*, not *what*; could a name replace it?

## Error handling
- [ ] Exceptions over return codes; no returned or passed null
- [ ] Exceptions carry context; classified by caller need
- [ ] Error handling separated from happy-path logic

## Duplication & abstraction
- [ ] No duplicated logic (G5) — extracted to one place
- [ ] Code sits at a consistent level of abstraction (G6)
- [ ] Conditionals encapsulated/positive where possible (G28, G29)
- [ ] Polymorphism preferred over repeated if/else / switch (G23)

## Classes & design
- [ ] Single Responsibility — one reason to change; cohesive
- [ ] Small; depends on abstractions, not concretes (testable)
- [ ] No Law-of-Demeter train wrecks / transitive navigation (G36)
- [ ] Construction separated from use where it matters

## Tests
- [ ] Logic is covered by tests; boundaries tested (T1, T5)
- [ ] Tests are F.I.R.S.T.; one concept per test; clear names
- [ ] No flaky/order-dependent/slow tests (T9)

## Formatting & consistency
- [ ] Consistent with project style (ideally enforced by a formatter/linter)
- [ ] Related code grouped; declarations near use; lines reasonably short
- [ ] No clutter — unused vars, imports, noise (G12)

## Output format for a review
1. Summary verdict (clean / needs work / blocking issues).
2. Issues, ordered by severity, each: location, smell code, why it matters, fix.
3. What's done well.
4. If asked to fix: apply changes and explain the principle behind each, so the
   author learns — don't just silently rewrite.
