# Smells & Heuristics (Ch. 17)

The catalog Martin compiled from real reviews. Use these codes when reporting
review findings (e.g. "G5 — duplication"). Grouped by area.

## Comments (C)
- **C1 Inappropriate information** — info better held elsewhere (VCS, issue
  tracker) doesn't belong in comments.
- **C2 Obsolete comment** — old, irrelevant, or wrong. Delete.
- **C3 Redundant comment** — describes what the code already says.
- **C4 Poorly written comment** — if you write one, make it good and brief.
- **C5 Commented-out code** — delete it; VCS remembers.

## Environment (E)
- **E1 Build requires more than one step** — should be a single command.
- **E2 Tests require more than one step** — one command runs all tests.

## Functions (F)
- **F1 Too many arguments** — prefer few; three+ is suspect.
- **F2 Output arguments** — counterintuitive; change owning object's state.
- **F3 Flag arguments** — boolean args signal a function doing >1 thing.
- **F4 Dead function** — never called; delete it.

## General (G)
- **G1 Multiple languages in one file** — minimize.
- **G2 Obvious behavior is unimplemented** — follow Principle of Least Surprise.
- **G3 Incorrect behavior at the boundaries** — test every edge/corner case.
- **G4 Overridden safeties** — don't turn off warnings/tests/checks.
- **G5 Duplication** — DRY; every duplication is a missed abstraction.
- **G6 Code at wrong level of abstraction** — keep high/low concepts separated.
- **G7 Base classes depending on derivatives** — they should be independent.
- **G8 Too much information** — small, tight interfaces; expose little.
- **G9 Dead code** — code that never runs; delete it.
- **G10 Vertical separation** — declare variables/functions near their use.
- **G11 Inconsistency** — do similar things the same way.
- **G12 Clutter** — remove useless default constructors, unused vars, noise.
- **G13 Artificial coupling** — don't couple things that don't belong together.
- **G14 Feature envy** — a method wanting another class's data belongs there.
- **G15 Selector arguments** — like flag args; avoid args that pick behavior.
- **G16 Obscured intent** — don't write dense/cryptic code.
- **G17 Misplaced responsibility** — put code where a reader expects it.
- **G18 Inappropriate static** — prefer instance methods unless truly static.
- **G19 Use explanatory variables** — break expressions into named intermediates.
- **G20 Function names should say what they do.**
- **G21 Understand the algorithm** — don't leave it "working by luck."
- **G22 Make logical dependencies physical** — depend explicitly, not on
  assumptions.
- **G23 Prefer polymorphism to if/else or switch/case.**
- **G24 Follow standard conventions** — team-agreed style.
- **G25 Replace magic numbers with named constants.**
- **G26 Be precise** — don't be lazy about decisions (nulls, concurrency,
  rounding).
- **G27 Structure over convention** — enforce design with structure, not just
  naming rules.
- **G28 Encapsulate conditionals** — extract complex booleans into named funcs.
- **G29 Avoid negative conditionals** — positives are easier to read.
- **G30 Functions should do one thing.**
- **G31 Hidden temporal couplings** — make order dependencies explicit in the API.
- **G32 Don't be arbitrary** — structure should communicate why it's that way.
- **G33 Encapsulate boundary conditions** — put `+1`/`-1` edge logic in one place.
- **G34 Functions should descend only one level of abstraction.**
- **G35 Keep configurable data at high levels** — constants/config at the top.
- **G36 Avoid transitive navigation** — Law of Demeter; don't depend on the
  shape of the object graph.

## Names (N)
- **N1 Choose descriptive names.**
- **N2 Names at the appropriate level of abstraction.**
- **N3 Use standard nomenclature where possible** (patterns, conventions).
- **N4 Unambiguous names.**
- **N5 Long names for long scopes** (short names only for tiny scopes).
- **N6 Avoid encodings** (no Hungarian/prefixes).
- **N7 Names should describe side effects** — don't hide what a function does.

## Tests (T)
- **T1 Insufficient tests** — test everything that could break.
- **T2 Use a coverage tool** — reveals gaps.
- **T3 Don't skip trivial tests** — they document.
- **T4 An ignored test is a question about ambiguity** — express it.
- **T5 Test boundary conditions.**
- **T6 Exhaustively test near bugs** — bugs cluster.
- **T7 Patterns of failure are revealing** — read the pattern.
- **T8 Test coverage patterns can be revealing.**
- **T9 Tests should be fast.**
