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
| react-native-bootsplash | 7.3.2 | **configured (FND-004)** — both platforms wired (Android theme/manifest/MainActivity, iOS storyboard/AppDelegate/Info.plist); see patterns-registry → "Native splash config". Still using the library's placeholder mark — real logo asset + `bootsplash generate` remains a deferred design follow-up |
| eslint-plugin-boundaries | ^7.0.2 (dev) | layer-boundary lint, see patterns-registry |
| babel-plugin-module-resolver | ^5.0.3 (dev) | `@/*` alias at bundle/test time |
| axios | 1.18.1 | **dormant** — no API client wired (OQ-1); not imported by feature code |
| @tanstack/react-query | 5.101.2 | **dormant** — no provider mounted |
| jwt-decode | 4.0.0 | **dormant** |
| date-fns | 4.4.0 | **dormant** |
| react-native-keychain | 10.0.0 | **dormant** |

**Dormant deps** (axios, react-query, jwt-decode, date-fns, keychain): installed for a future cloud-sync phase per OQ-1; must stay unimported by feature code until that phase is scoped.

## Spec-gap notes (flagged during FND-001, action for later tasks)
- **✅ RESOLVED (FND-002):** `react-native-reanimated/plugin` is now registered as the **last** plugin in `mobile/babel.config.js` (NativeWind 4's babel preset depends on Reanimated's worklet transform; Reanimated requires it last). Was flagged during FND-001, fixed as a carry-forward in FND-002.
- **react-native-vector-icons (10.3.0, unscoped) is deprecated upstream** in favor of the scoped `@react-native-vector-icons/*` packages at v12+. 10.3.0 is still the current-stable unscoped release and is RN-0.75-safe, so FND-001 kept it. Flag for a future icon-library decision if/when this project upgrades past RN 0.75 or wants the scoped packages.

## Spec-gap notes (flagged during FND-002, action for later tasks)
- **Custom font face is out of FND-002 scope** — the type scale (`tailwind.config.js` `fontSize`) uses the system font; no `expo-font`/custom-typeface pipeline was added. Flagged by the design agent as a future typography follow-up if/when the product needs a branded typeface.
- **Cold-boot dark-flash (non-blocking review nit):** on a device already in dark mode, the very first frame can briefly render the light palette before `ThemeProvider`'s effect pushes `colorScheme.set('dark')`. Not a gate failure. **Forward action:** validate visually at the FND module-edge visual gate; if it's perceptible, fix is likely reading `Appearance.getColorScheme()` synchronously before first paint (already done in `themeStore`'s `initialMode`/`resolvedScheme` init) or an `Appearance`-driven `colorScheme.set` at module load rather than only in the provider effect.
- **`ThemeProvider.test.tsx` title overpromises (non-blocking review nit):** a test title reads more broadly than what it actually asserts (it asserts the `colorScheme.set` call, not full theming behavior). No functional impact — a future FND-002-adjacent task should tighten the title to match the assertion.

## Spec-gap notes (flagged during FND-003, action for later tasks)
- **FR4 was under-specified in the original spec** — the clause "status-bar style flips with the resolved scheme" was easy to miss alongside the more prominent nav-container theming clause; the code-review caught it as unimplemented in the first iteration. Fixed by homing a themed `<StatusBar>` in `ThemeProvider` (not the navigator — `NavigationContainer`'s `theme.dark` never drives the OS status bar). This is now the reference — see patterns-registry.md → "Themed StatusBar". Future specs with a similar "theme X AND OS-chrome Y" requirement should call out the OS-chrome clause as its own FR/sub-bullet, not a trailing clause.
- **FND-005's design inventory (EmptyState/LoadingIndicator/Screen component work) is preserved in `git stash@{0}` ("fnd005-design-inventory")** from an earlier interrupted parallel-group overlap — NOT lost, but also not yet applied to any branch. **Restore it (`git stash apply stash@{0}`) when FND-005 actually builds**; do not let it silently age out or get dropped by an unrelated `git stash clear`.

## Spec-gap notes (flagged during FND-004, action for later tasks)
- **Deferred logo asset:** `react-native-bootsplash` is now fully configured on both platforms (FND-004) but still shows the library's placeholder mark — swapping in the real app logo + re-running `bootsplash generate` is a design-owned follow-up, not yet scheduled to a task.
- **2 non-blocking test-robustness nits (code review, FND-004):** (1) `BootstrapScreen.test.tsx`'s corrupted-flag case duplicates the fresh-install assertion rather than independently exercising a throwing/non-boolean MMKV read; (2) the no-network boot assertion spies on `fetch` only, not `XMLHttpRequest` — a library that boots via XHR wouldn't be caught. Neither blocks FND-004 (the guarded-read behavior itself is unit-tested in `launchStore.test.ts`, and nothing in the boot path currently uses XHR). Fold both into FND-005 or the FND module-edge E2E hardening pass.

## Build & tooling
- **Package manager:** npm; installs `npm ci --legacy-peer-deps`. Lockfile: `mobile/package-lock.json`.
- **Node:** ≥18 (CI uses 20); **Java:** 17 (Android); **CocoaPods** for iOS.
- **CI:** repo-root `.github/workflows/ci.yml` (ADR-0038) — **LEAN tier**: typecheck · lint · promoted guards · traceability · Layer-0 token bridge. No build/unit/E2E jobs — those are LOCAL gates (Project Profile `ciTier: lean`).

## Version policy reminder
New installs resolve **current stable** via `npm view <pkg> version` — **except** the RN-coupled packages (`react`, `react-native`, `react-native-*`, `@react-native*`, `@react-navigation/*`), which track the installed **RN 0.75** major; an RN upgrade is its own human-reviewed task. See `.claude/harness.config.md` → Dependency Version Policy.
