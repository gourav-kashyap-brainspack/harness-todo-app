# Unit Tests (Ch. 9)

Test code is just as important as production code. It is not a second-class
citizen — it requires thought, design, and care, and it must be kept clean.
Dirty tests are worse than no tests: they rot, become a maintenance liability,
and get discarded, taking your safety net with them.

## The Three Laws of TDD

1. You may not write production code until you have written a failing unit test.
2. You may not write more of a unit test than is sufficient to fail (and not
   compiling is failing).
3. You may not write more production code than is sufficient to pass the
   currently failing test.

These lock you into a tight ~30-second cycle and produce comprehensive,
regression-proof test suites.

## Keeping tests clean

- **Readability is everything** in tests — clarity, simplicity, density of
  expression. A test should read like a small story: **Build-Operate-Check**
  (a.k.a. Arrange-Act-Assert).
- **Use a domain-specific testing language** — build helper functions/utilities
  so each test expresses intent, not plumbing. Refactor tests as they grow.
- **One concept per test.** Don't test many unrelated things in one method.
  Minimize asserts per test; ideally one assert, or one concept, per test.
- **Tests enable change.** A clean test suite is what makes production code
  *flexible* — without it you fear every edit. Tests keep your code malleable.

## F.I.R.S.T.

- **Fast** — run quickly, so you run them often.
- **Independent** — no test depends on another; any order, no shared state.
- **Repeatable** — same result in any environment (laptop, CI, offline).
- **Self-validating** — boolean pass/fail, no manual log-reading.
- **Timely** — write them just before the production code they cover.

## Practical guidance
When generating code, generate the tests with it (or first). When reviewing,
flag untested logic, slow/order-dependent/flaky tests, multi-concept tests, and
unclear test names. A test's name should describe the scenario and expected
outcome.
