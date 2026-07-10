# Canonical Patterns Registry — &lt;PROJECT_NAME&gt;

> **Tier-1 cross-cutting patterns** — the recurring *how* that must be identical across tasks (response envelope, DTO/validation style, auth guard, ownership checks, pagination, data-access, module layout, forms, async UI states…). Established by the first task that needs each, reused thereafter.
>
> **This file is split out of `conventions.md` to keep always-loaded context lean.** It is NOT `@`-imported — it is read on demand. **Builders, architect, code-reviewer, and librarian MUST `Read` this file before classifying / inventing / reviewing any Tier-1 pattern.** The *policy* that governs this registry (two-tier rule + roles) lives in `conventions.md` → "Pattern policy (two-tier)".
>
> **Maintained by the librarian** (append a row on task done). `ref:` = the reference implementation to copy. **Empty until the first foundation task lands** — the first task to solve a Tier-1 concern well establishes the pattern; every later task reuses it rather than re-deciding.

| pattern | rule (one line) | ref (file:symbol) | established by | ADR |
|---|---|---|---|---|
| Feature-sliced folder structure + `@/*` alias | `mobile/src/{app,core,features,components/ui,platform,theme}`; import via `@/…`, never deep-relative `../../..` | `mobile/tsconfig.json` (`paths`) + `mobile/babel.config.js` (`module-resolver`) | FND-001 | — |
| eslint-plugin-boundaries layer config | Element types `app/feature/core/components/theme/platform` by path; allowed direction `app→feature→core|components|theme|platform`, no cross-feature imports, default `disallow`, violation = `error` (gate is `--max-warnings=0`) | `mobile/.eslintrc.js` (`settings['boundaries/elements']`, `rules['boundaries/dependencies']`) | FND-001 | — |
| NativeWind `className` styling | Style via Tailwind `className`; `StyleSheet.create` only as an escape hatch for third-party native wrappers NativeWind can't intercept (e.g. `GestureHandlerRootView`) | `mobile/tailwind.config.js` (content globs + `nativewind/preset`) + `mobile/babel.config.js` (`nativewind/babel`) + `mobile/metro.config.js` (`withNativeWind`) + `mobile/src/app/AppProviders.tsx` (StyleSheet escape-hatch example) | FND-001 | — |
| AppProviders composition root | One root component in `src/app/` wraps the provider stack (`GestureHandlerRootView` → `SafeAreaProvider` → …); later foundation tasks (theme, nav) add a layer each rather than each screen mounting its own providers; no network/query provider mounted while local-only (OQ-1) | `mobile/src/app/AppProviders.tsx:AppProviders` | FND-001 | — |
