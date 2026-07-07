# Error Handling (Ch. 7)

Error handling is necessary, but if it obscures logic, it's wrong. It should be
separable from the happy path so you can reason about each independently.

## Rules

- **Use exceptions, not return codes.** Return codes clutter the caller and are
  easy to forget. Throw instead, and keep the algorithm readable.
- **Write your try-catch-finally first.** When code can throw, start with the
  `try-catch` and build outward — it defines a transaction-like scope and forces
  you to consider the failure state up front. Pairs naturally with TDD: write a
  test that forces the exception, then make it pass.
- **Prefer unchecked exceptions.** Checked exceptions violate the Open/Closed
  Principle — a `throws` in a low-level method ripples up through every caller's
  signature, breaking encapsulation. Use unchecked unless writing a critical
  library where the cost is justified.
- **Provide context with exceptions.** Every exception should carry enough info
  (the operation that failed, the intent) to locate and diagnose the error.
  Include informative messages; mention the operation and type of failure.
- **Define exception classes in terms of the caller's needs.** Wrap third-party
  APIs and classify exceptions by *how the caller will handle them*, not by
  their source. Often a single exception type for a given area of code is enough.
  Wrapping also decouples you from the third-party API (a boundary, see
  objects-boundaries.md).
- **Define the normal flow** — use the **Special Case pattern** instead of
  scattering exception handling for predictable "exceptions." Return a special
  case object (e.g. a `MealExpenses` whose `getTotal()` returns a default) so the
  caller's code stays straight-line and doesn't special-case at all.
- **Don't return null.** Returning null invites NPEs and litters callers with
  `!= null` checks. Return an empty collection, a Special Case object, or throw.
- **Don't pass null.** Passing null into methods is worse than returning it.
  Forbid it by convention; there's usually no clean way to handle a null
  argument, so the best policy is to not allow them in the first place.

## Takeaway
Clean error handling treats failures as a first-class concern that is *separated*
from logic — wrapped, contextual, exception-based, and null-free — so the
normal-path code remains clean and the error-path code is centralized.
