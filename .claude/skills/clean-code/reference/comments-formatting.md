# Comments (Ch. 4) & Formatting (Ch. 5)

## Comments

"The proper use of comments is to compensate for our failure to express
ourselves in code." A comment is, at best, a necessary evil — code changes,
comments rot, and stale comments actively mislead.

**Explain yourself in code first.** Before writing a comment, ask if a better
name or an extracted, well-named function would remove the need.
`// Check if employee is eligible for full benefits` → `if
(employee.isEligibleForFullBenefits())`.

### Good comments (justified)
- **Legal** — copyright/license headers required by policy.
- **Informative** — explaining the format of a returned value or a regex.
- **Explanation of intent** — why a decision was made, not what the code does.
- **Clarification** — translating an obscure argument/return you can't rename
  (e.g. a standard library value).
- **Warning of consequences** — "Don't run unless you have time to kill."
- **TODO** — legitimate future work, but scan and prune them regularly.
- **Amplification** — stressing the importance of something easy to overlook.
- **Public API docs (Javadoc/docstrings)** — for published interfaces.

### Bad comments (delete / avoid)
- **Mumbling, redundant, or misleading** comments that restate the code.
- **Mandated** comments on every function/variable — they become noise.
- **Journal/changelog** comments — version control already does this.
- **Noise**: `// Default constructor`, `// the day of the month`.
- **Position markers**, **closing-brace comments** — sign the function is too big.
- **Attributions / bylines** — git blame handles this.
- **Commented-out code** — DELETE it; others fear removing it and it accumulates.
- **HTML in comments, nonlocal info, too much info, inobvious connection**
  (a comment whose link to the code isn't clear).
- **Function headers** — a short well-named function needs no header banner.

## Formatting

Formatting is communication; consistency within a team matters more than any
individual rule. Agree on a style and let tooling enforce it.

### Vertical
- **Newspaper metaphor** — top of file = high-level summary; detail increases as
  you read down. Most important concepts first.
- **Vertical openness** — blank lines separate concepts (between methods, between
  groups of related lines).
- **Vertical density** — tightly related lines stay together; don't pad them.
- **Vertical distance** — concepts that are related belong close. Declare
  variables near their use. Keep dependent functions near each other, caller
  above callee where possible. Conceptually similar functions group together.
- **File size** — most files should be small (a few hundred lines); large files
  are harder to navigate.

### Horizontal
- **Keep lines short** (~100–120 cols); you should rarely scroll right.
- **Horizontal openness/density** — spaces around operators and after commas to
  show association; no space between a function name and its `(`.
- **Indentation** reflects scope hierarchy; never collapse a short `if`/loop body
  onto one line by removing indentation. Avoid breaking indentation even for
  tiny scopes.

### Team rules
A team should adopt one formatting standard (ideally automated via a formatter/
linter) so the codebase looks like it was written by one person.
