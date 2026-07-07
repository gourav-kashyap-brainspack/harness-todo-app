# Classes (Ch. 10), Systems (Ch. 11), Emergence (Ch. 12), Concurrency (Ch. 13)

## Classes

- **Small.** Classes are measured in *responsibilities*, not lines. A class name
  should describe its responsibility; if you can't name it without "and"/"or"/
  vague words like `Processor`/`Manager`/`Super`, it does too much.
- **Single Responsibility Principle (SRP).** A class should have one, and only
  one, reason to change. Many small, single-purpose classes beat a few large
  ones. Beginners fear too many small classes — but a system with many small
  classes is easier to navigate than one with a few large ones.
- **Cohesion.** A class is cohesive when its methods use its instance variables.
  Maximal cohesion = every method uses every variable. When cohesion drops
  (some methods use only some fields), that's a signal to **split the class** —
  those fields and methods want to be their own class.
- **Organize for change.** Structure so new features are *additions*, not edits.
  Use polymorphism and the Open/Closed Principle (open for extension, closed for
  modification). Isolate from change by depending on **abstractions**
  (Dependency Inversion), not concretes — which also makes the code testable.

## Systems

- **Separate construction from use.** Startup/wiring (building objects, reading
  config) is a distinct concern from runtime logic. Don't scatter `new` and
  configuration through business code.
- **Move construction to main / factories / Dependency Injection.** `main` (or a
  startup module) builds the object graph and hands it to the app, which uses it
  via interfaces. Use Abstract Factory when the app must control *when* an object
  is created. Use DI containers to invert ownership of construction.
- **Scale up incrementally.** Systems, like cities, grow; you can't get the whole
  architecture right up front. A clean, decoupled design (especially separating
  cross-cutting concerns like persistence/security via aspect-like mechanisms)
  lets the architecture evolve without a big rewrite.
- **Use the simplest thing that works** at each level; defer decisions until you
  have the information to make them; add abstraction only when it pays.

## Emergent design — Kent Beck's four rules (in priority order)

A design is "simple" if it:
1. **Runs all the tests.** A testable system is, by necessity, low-coupled and
   cohesive — testing pressure drives good design.
2. **Contains no duplication.** DRY — duplication is the primary enemy; remove
   it via extraction and abstraction.
3. **Expresses the intent of the programmer.** Good names, small functions/
   classes, standard nomenclature, readable tests as documentation.
4. **Minimizes the number of classes and methods.** Keep it small — but this is
   the lowest priority; never sacrifice tests, DRY, or expressiveness to reduce
   counts. Avoid dogmatic over-splitting.

## Concurrency (when relevant)

- **Concurrency is decoupling** — what gets done from when it gets done — but it
  adds significant complexity; treat it as its own concern.
- **Keep concurrency code separate** from other code (SRP for threading).
- **Limit the scope of shared data.** Use `synchronized`/locks to protect
  critical sections; keep shared mutable data minimal and access points few
  (corollary: take copies of data; avoid sharing).
- **Make threads as independent as possible** — ideally each operates on its own
  un-shared data.
- **Know your library** (thread-safe collections, executors) and **your
  execution models** (Producer-Consumer, Readers-Writers, Dining Philosophers).
- **Keep synchronized sections small**; beware dependencies between synchronized
  methods.
- **Test threaded code hard** — make it pluggable/tunable, run on many platforms,
  treat spurious failures as real threading bugs, not "flakes."
