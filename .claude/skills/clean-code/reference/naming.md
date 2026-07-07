# Meaningful Names (Ch. 2)

Names are everywhere in code, so getting them right pays off constantly.

## Rules

- **Use intention-revealing names.** The name should say why it exists, what it
  does, and how it is used. If it needs a comment to explain, the name failed.
  `int d; // elapsed time in days` → `int elapsedTimeInDays`.
- **Avoid disinformation.** Don't use names that imply something false. Don't
  call a grouping `accountList` unless it's actually a List. Avoid names that
  vary in small ways (`XYZControllerForHandlingOfStrings` vs `...Storage`).
- **Make meaningful distinctions.** No number series (`a1`, `a2`) and no noise
  words (`ProductInfo` vs `ProductData`, `theMessage` vs `message`,
  `nameString`). The distinction must carry information.
- **Use pronounceable names.** `genymdhms` → `generationTimestamp`. Code is
  discussed out loud.
- **Use searchable names.** Single letters and raw constants are hard to grep.
  Reserve single-letter names for short local loop scopes only. Prefer named
  constants over magic numbers.
- **Avoid encodings.** No Hungarian notation, no type/scope prefixes (`m_`,
  `str`). Modern IDEs make these obsolete and they add mental decoding cost.
- **Avoid member prefixes.** Don't prefix members with `m_`; keep classes small
  enough that members are obvious.
- **Interfaces/implementations.** Prefer a clean interface name; if you must
  encode, encode the implementation (`ShapeFactoryImpl`) not the interface
  (`IShapeFactory`).
- **Avoid mental mapping.** Readers shouldn't have to translate your names into
  concepts they already know. Clarity is king; being "smart" is not.

## Naming by kind

- **Classes / objects** — noun or noun phrase: `Customer`, `WikiPage`,
  `AddressParser`. Not a verb. Avoid vague `Manager`, `Processor`, `Data`,
  `Info`.
- **Methods** — verb or verb phrase: `postPayment`, `deletePage`, `save`.
  Accessors/mutators/predicates per convention: `getName`, `setName`,
  `isPosted`.
- **Use static factory methods** with named arguments when constructors are
  ambiguous: `Complex.fromRealNumber(23.0)` beats `new Complex(23.0)`.

## Consistency

- **Don't be cute.** No jokes/slang (`whack()` for `kill()`, `eatMyShorts()`
  for `abort()`). Say what you mean.
- **Pick one word per concept.** One of `fetch` / `retrieve` / `get` across the
  codebase — not all three. Same for `controller` / `manager` / `driver`.
- **Don't pun.** Don't reuse one word for two different ideas. If `add` means
  concatenation elsewhere, don't use `add` for inserting into a collection — use
  `insert` or `append`.
- **Use solution-domain names** (CS terms, patterns, algorithms) where readers
  are programmers: `JobQueue`, `AccountVisitor`. Use **problem-domain names**
  when the concept is business logic, so a domain expert recognizes it.
- **Add meaningful context** via well-named classes/namespaces, not by
  prefixing every variable. `addr` fields → an `Address` class. But **don't add
  gratuitous context**: `GSDAccountAddress` in an app called "Gas Station
  Deluxe" is noise — just `Address`.

## Quick test
If you renamed a thing and a teammate could no longer guess what it holds or
does, the new name is worse. Names should let readers predict behavior.
