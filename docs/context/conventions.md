# Conventions — {{APP_DISPLAY_NAME}}

> Coding standards every agent follows. The librarian appends only conventions **actually used**.
> Stack = **React Native** (`mobile/`).

## Language & style
- TypeScript **strict** mode (it's already on in `mobile/tsconfig.json`). No `any` without a `// reason:` comment. No unused locals/params (compiler-enforced).
- ESLint (legacy config, `ESLINT_USE_FLAT_CONFIG=false`) + Prettier; lint must be clean with **`--max-warnings=0`** (gate). `eslint-plugin-boundaries` enforces import layering — respect it.
- Functional React components + hooks only; no class components.
- Styling via **NativeWind** (`className="…"`) using Tailwind tokens; avoid inline `StyleSheet` objects except where NativeWind can't express it. No hard-coded hex colors — use theme tokens.

## Naming
- Files: `kebab-case.ts`; React components `PascalCase.tsx`; hooks `useThing.ts`.
- Screens: `*Screen.tsx`; navigators in `src/app/navigation`.
- Path alias: import via `@/…` (→ `mobile/src/*`), not deep relative `../../..`.

## Structure (single app, feature-sliced — enforced by `eslint-plugin-boundaries`)
- `src/app/**` — navigation + providers (the composition root).
- `src/features/<feature>/**` — feature screens/components/hooks (auth, dashboard, patient, …).
- `src/core/**` — cross-feature primitives: `api` (axios client + interceptors), `services` (REST calls), `hooks` (React Query wrappers), `store` (Zustand), `lib`, `config`, `types`.
- `src/components/ui/**` — shared presentational primitives. `src/platform/**` — native-bridge wrappers. `src/theme/**` — design tokens.
- **Layer direction:** `app → features → core / components / theme`. Features must NOT import from each other; shared logic goes to `core`. (A boundary violation is a hard lint fail.)
- Co-locate unit tests as `*.test.ts(x)` next to source. Device E2E lives at the app edge: **Maestro** flows in `mobile/.maestro/*.yaml` (ADR-0037), run via `scripts/e2e.sh` — module-edge, local-only.
- **E2E selectors:** Maestro reads RN `text` + `accessibilityText`, NOT `testID` (React-Navigation `tabBarButtonTestID` doesn't surface as a queryable Maestro `id` on Android). So anchor flows on **stable visible text or `accessibilityLabel`** (add `accessibilityLabel` when text is absent/ambiguous), and use regex anchors (`^Patients$`) to disambiguate substrings. Flows must **not** use `clearState` (it wipes Keychain/MMKV and the AuthGate hangs on "Validating…" — see `.maestro/README.md`).

## Patterns
- **Server state via React Query, UI state via Zustand** — never duplicate server data into Zustand. Data fetching lives in `core/hooks` (React Query) wrapping `core/services` (axios); **no axios calls directly inside components/screens**.
- **Validate external input with Zod** + `react-hook-form` `zodResolver` at the form boundary; parse/guard API responses where shape matters.
- **API auth (and any multi-tenancy header)** is centralized in the `core/api` axios interceptor (e.g. Bearer token + a tenant-scoping header); never re-implement per call.
- **Secrets/tokens** go in `react-native-keychain` (sensitive) or `react-native-mmkv` (non-sensitive cache) — never in plain `AsyncStorage`, never logged.
- Errors: surface user-facing failures via the toast layer (`sonner-native`); keep raw errors out of the UI.

## Docs-first grounding — read the external API before wiring it (ADR-0035, the `read-the-damn-docs` skill)
The Dependency Version Policy answers *which version* to install; Graphify grounds *our own code*. This convention grounds the third question — **how the external API actually behaves in the version we're on** — instead of coding it from stale model memory (most expensive to be wrong about at: auth, secrets, native modules, permissions, store policies).
- **Read the current official docs for the installed major BEFORE coding** any **external or hard-to-reverse surface**: adding/upgrading/configuring a package/native module; anything touching **auth · JWT · secure storage (keychain/mmkv) · native permissions (camera/mic/files) · deep links · push · the backend API contract · app-signing/CI**; an error hinting at **deprecation / changed default / RN-version mismatch**; or a choice expensive to reverse (persistent IDs, storage schema, navigation route params, customer-visible behavior).
- **Mechanism:** **Context7** (`resolve-library-id` → `query-docs`) is the primary source for third-party + RN-library behavior (RN libs change fast across RN majors); web search for the official page when Context7 is thin; **local** repo docs/types/tests first for *internal* contracts. Versions still come from `npm view <pkg> version` (RN-coupled packages excepted — see the version policy).
- **Proportionate:** trivial edits, language syntax, formatting, and self-contained code with no external contract proceed normally.
- **Traceability:** name the consulted doc in the PR/finding when it affects the implementation.

## Pattern policy (two-tier) — how we stop N tasks becoming N dialects
Two kinds of decisions live in every task. Only the first kind is standardized:

- **Tier 1 — Cross-cutting mechanics (ANCHOR once, reuse everywhere).** The recurring *how* that should be identical regardless of what the feature does: API success/error handling, the axios client + interceptor usage, React Query key/caching conventions, Zustand store shape, form (RHF+Zod) pattern, navigation param typing, screen/component folder layout, the NativeWind token usage, test structure. The **first task** that needs one solves it well; the **librarian promotes that decision** into the **Canonical patterns registry** (with a pointer to the reference implementation). Every later task **reuses** it.
- **Tier 2 — Task-specific logic (NEVER anchored).** The actual business rule the spec describes. Different every time, by design.

**The rule is not "every task looks identical" — it's "the same problem is never solved two ways by accident."**

### When a task genuinely needs a different pattern
Divergence is allowed but must be **deliberate, not silent**:
- **Will recur** → it becomes a **new canonical pattern** (add a registry row).
- **True one-off** → record an **ADR** in `docs/context/decisions/` ("diverges from pattern X because Y").
- **Accidental reinvention** (a fresh agent re-solved a Tier-1 concern that already has a registry entry, no ADR/new-pattern justification) → the code-reviewer marks it **[blocking]**.

### Roles
- **Architect (`/module`):** classify each spec element — *reuse registry pattern* / *promote new reusable pattern* / *one-off (ADR)* — and check the registry BEFORE inventing.
- **Builders:** ground in the registry + Graphify first; reuse the referenced implementation.
- **Librarian (task done):** extract newly-established Tier-1 decisions into the registry (with `ref:` pointer); record divergences as ADRs; **promote `[promote]`-tagged recurring findings into executable checks** (lint/grep/test with a fix-message — ADR 0029).
- **Code-reviewer:** check the diff against the registry; block accidental reinvention; allow divergence only when backed by a new registry row or an ADR; **tag a recurring Tier-1 anti-pattern `[promote]`**.

## Canonical patterns registry
> **Moved to [`patterns-registry.md`](./patterns-registry.md) to keep this always-loaded file lean.** The full Tier-1 patterns table + anchor caveats live there; it is read on demand (NOT `@`-imported).
>
> **Builders, architect, code-reviewer, and librarian MUST `Read` [`docs/context/patterns-registry.md`](./patterns-registry.md) before classifying / inventing / reviewing any Tier-1 pattern.**

## Do / Don't
- ✅ Small PRs, one task per branch · ✅ tests alongside code · ✅ update context docs (librarian step).
- ✅ Reuse a Canonical pattern before inventing · ✅ diverge only via a new registry row or an ADR.
- ✅ **Resolve current-stable versions** (`npm view <pkg> version`) before adding deps — **except RN-coupled packages**, which track RN 0.75 (Dependency Version Policy in `harness.config.md`).
- ✅ Respect the import-boundary layering (`app → features → core`).
- ❌ No direct edits to `main` · ❌ no secrets/keys in code · ❌ no skipping gates · ❌ no silent reinvention of a Tier-1 pattern · ❌ no axios in components · ❌ no cross-feature imports.
