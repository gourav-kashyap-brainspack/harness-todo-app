# Functions (Ch. 3)

The first rule of functions is that they should be small. The second rule is
that they should be smaller than that.

## Size & structure

- **Small.** Aim for a handful of lines. Blocks inside `if`/`else`/`while`
  should be one line — usually a function call. This keeps the enclosing
  function small and adds a documenting name.
- **One level of abstraction per function.** Don't mix high-level policy with
  low-level detail in the same function. Read top-down: each function is
  followed by those one level below it (the "Stepdown Rule" — the code reads
  like a narrative of paragraphs).
- **Do one thing.** "A function should do one thing, do it well, and do it
  only." Test: can you extract another function from it with a name that isn't
  just a restatement of its implementation? If yes, it was doing more than one
  thing.

## Arguments

- **Fewer is better.** Niladic (0) > monadic (1) > dyadic (2) > triadic (3,
  avoid) > polyadic (needs a very good reason). More args = more to understand
  and test.
- **No flag arguments.** Passing a boolean proclaims the function does more than
  one thing (`render(true)`). Split into `renderForSuite()` /
  `renderForSingleTest()`.
- **Avoid output arguments.** Arguments are naturally inputs. If a function must
  change state, change the state of its owning object. `appendFooter(report)` →
  `report.appendFooter()`.
- **Wrap related args into an object** when you have several that belong
  together: `makeCircle(x, y, radius)` → `makeCircle(center, radius)`.
- **Argument + name should form a verb/noun pair**: `write(name)`,
  `assertExpectedEqualsActual(expected, actual)`.

## Side effects & purity

- **No side effects.** The name promises one thing; doing a hidden second thing
  (e.g. initializing a session inside `checkPassword`) is a lie and a temporal
  coupling trap.
- **Command Query Separation.** A function should either *do* something or
  *answer* something, not both. `if (set("username", "bob"))` is confusing —
  separate the command from the query.

## Errors

- **Prefer exceptions to returned error codes** — error codes force the caller to
  handle them immediately and breed nested `if`s.
- **Extract try/catch bodies** into their own functions; error handling is one
  thing, so a function that handles errors should do nothing else (`try` should
  be the first word, nothing after the `catch`/`finally`).
- **DRY.** Error-code switch ladders duplicate handling logic everywhere;
  exceptions centralize it.

## Switch statements

- A `switch` does N things by nature. Tolerate it once, buried low, to **create
  polymorphic objects** (e.g. inside an Abstract Factory) so the rest of the
  system depends on an interface and never sees the switch again. Avoid
  repeated parallel switches on the same type code.

## How to get there
Nobody writes clean functions first try. Get it working, with tests, then
massage: split functions, rename, eliminate duplication, until it reads well.
