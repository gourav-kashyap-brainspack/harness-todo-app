# Stack — Todo App

> Living doc, maintained by the **librarian**. Records the **resolved** dependency versions + date.
> Full stack rationale lives in `.claude/harness.config.md` → Tech Stack. This is the version-of-record table.

## Resolved dependency versions
Installed **2026-07-10** by FND-001 (`feat/FND-FND-001`). Sourced from `mobile/package.json` / `package-lock.json`.

| Dependency | Resolved version | Notes |
|---|---|---|
| nativewind | 4.1.23 | RN-0.75/old-arch compatible NativeWind 4 line |
| tailwindcss | 3.4.19 (dev) | NativeWind 4 preset requires the 3.4.x line |
| @react-navigation/native | 6.1.18 | RN-0.75-coupled; v7 not adopted (RN exception) |
| @react-navigation/native-stack | 6.11.0 | pairs with native@6 |
| @react-navigation/bottom-tabs | 6.6.1 | pairs with native@6 |
| react-native-screens | 4.8.0 | nav peer, RN-0.75 old-arch compatible |
| react-native-safe-area-context | 5.8.0 | nav peer |
| react-native-gesture-handler | 2.25.0 | nav peer; wraps `AppProviders` root |
| react-native-reanimated | 3.19.0 | **hard NativeWind-4 requirement, not in FND-001 FR1** — see spec-gap note below |
| zustand | 5.0.14 | UI-state store |
| react-hook-form | 7.81.0 | forms |
| zod | 3.25.76 | validation |
| @hookform/resolvers | 5.4.0 | RHF↔Zod bridge |
| react-native-mmkv | 2.12.2 | **pinned to v2 (old-arch)** — v3+ requires the New Architecture; `newArchEnabled=false` in this project |
| react-native-vector-icons | 10.3.0 | unscoped package; see deprecation note below |
| react-native-bootsplash | 7.3.2 | native splash, config deferred to FND-004 |
| eslint-plugin-boundaries | ^7.0.2 (dev) | layer-boundary lint, see patterns-registry |
| babel-plugin-module-resolver | ^5.0.3 (dev) | `@/*` alias at bundle/test time |
| axios | 1.18.1 | **dormant** — no API client wired (OQ-1); not imported by feature code |
| @tanstack/react-query | 5.101.2 | **dormant** — no provider mounted |
| jwt-decode | 4.0.0 | **dormant** |
| date-fns | 4.4.0 | **dormant** |
| react-native-keychain | 10.0.0 | **dormant** |

**Dormant deps** (axios, react-query, jwt-decode, date-fns, keychain): installed for a future cloud-sync phase per OQ-1; must stay unimported by feature code until that phase is scoped.

## Spec-gap notes (flagged during FND-001, action for later tasks)
- **react-native-reanimated is a hard NativeWind-4 peer requirement** that FND-001's FR1 didn't list explicitly (NativeWind 4's babel preset depends on Reanimated's worklet transform). It is installed. **Forward action for FND-002+:** when any task first uses an animation/worklet, register `react-native-reanimated/plugin` as the **last** plugin in `babel.config.js` (`mobile/babel.config.js` currently only has `module-resolver`) — Reanimated's docs require it to be last.
- **react-native-vector-icons (10.3.0, unscoped) is deprecated upstream** in favor of the scoped `@react-native-vector-icons/*` packages at v12+. 10.3.0 is still the current-stable unscoped release and is RN-0.75-safe, so FND-001 kept it. Flag for a future icon-library decision if/when this project upgrades past RN 0.75 or wants the scoped packages.

## Build & tooling
- **Package manager:** npm; installs `npm ci --legacy-peer-deps`. Lockfile: `mobile/package-lock.json`.
- **Node:** ≥18 (CI uses 20); **Java:** 17 (Android); **CocoaPods** for iOS.
- **CI:** repo-root `.github/workflows/ci.yml` (ADR-0038) — **LEAN tier**: typecheck · lint · promoted guards · traceability · Layer-0 token bridge. No build/unit/E2E jobs — those are LOCAL gates (Project Profile `ciTier: lean`).

## Version policy reminder
New installs resolve **current stable** via `npm view <pkg> version` — **except** the RN-coupled packages (`react`, `react-native`, `react-native-*`, `@react-native*`, `@react-navigation/*`), which track the installed **RN 0.75** major; an RN upgrade is its own human-reviewed task. See `.claude/harness.config.md` → Dependency Version Policy.
