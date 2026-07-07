# Objects & Data Structures (Ch. 6) and Boundaries (Ch. 8)

## Objects vs. data structures

- **Objects** hide their data behind abstractions and expose **behavior**.
- **Data structures** expose their data and have **no meaningful behavior**.
- These are opposites, and the tension between them is fundamental:
  - **Procedural code** (functions over data structures) makes it easy to add
    new *functions* without changing the structures, but hard to add new data
    types (every function must change).
  - **OO code** makes it easy to add new *types* without changing functions, but
    hard to add new functions (every type must change).
  - Choose the style that matches where change is likely. Don't reflexively make
    everything an object — a pure data structure (DTO) is the right tool
    sometimes.

- **Data abstraction.** Hide implementation; expose the essence. Don't just put
  getters/setters on every private field — that's a data structure pretending to
  be an object. Express data in abstract terms.

- **Law of Demeter.** A method should only talk to: itself, its parameters,
  objects it creates, and its direct components — not strangers reached through
  another object's return. Avoid **train wrecks**:
  `ctxt.getOptions().getScratchDir().getAbsolutePath()`. If those are objects,
  it violates Demeter (ask the object to do the work, e.g.
  `ctxt.getScratchDirPath()`). If they're transparent data structures, it's
  fine. Don't create **hybrids** (half object, half data structure) — worst of
  both.

- **DTOs & Active Record.** A Data Transfer Object is a class with public fields
  and no behavior — good for boundaries (DB rows, message parsing). Don't bolt
  business logic onto Active Records; keep them as data structures and put logic
  in separate objects.

## Boundaries (third-party code)

- **Keep third-party interfaces contained.** Don't pass a raw `Map` (or any
  third-party type) around your system. Wrap it (e.g. a `Sensors` class hiding a
  `Map<String, Sensor>`) so the API surface you depend on is small and casts/
  generics live in one place. The boundary becomes a seam you control.
- **Learning tests.** When adopting a new library, write small tests that
  exercise *your* understanding of it. They're "better than free": they verify
  your assumptions and instantly tell you if a version upgrade changed behavior.
- **Code against an interface you wish you had.** When the real API doesn't
  exist yet (or is ugly), define the interface your code wants, then write an
  Adapter to the real thing. This keeps your code clean and testable (you can
  fake the boundary).
- **Manage boundaries with `Adapter` / wrapper classes.** Convert from their
  world to yours at the edge; everything inside speaks your domain's language.
  Minimizes the blast radius when the dependency changes.
