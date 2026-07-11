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
| react-native-uuid | 2.0.4 | added STG-002, 2026-07-11 — pure-JS RFC4122 v4 uuid generator, no native linking/no `react-native-get-random-values` polyfill required (unlike the `uuid` package). Powers `core/lib/id.ts:newId()`; **`Math.random()`-backed, not a CSPRNG — non-security ids only**, see patterns-registry → "ID generation" |
| react-native-image-picker | 8.2.1 | added PRO-003, 2026-07-11 — RN-0.75-compatible, `npm install --legacy-peer-deps`. **Native config (grounded, not from memory):** Android needs **no manifest permissions** — the system photo picker + camera intent delegation at `targetSdk 34` handle both flows without a runtime prompt; declaring `CAMERA` in `AndroidManifest.xml` would *force* an unnecessary runtime prompt, so it was deliberately left out. iOS needs the 2 `Info.plist` usage strings (`NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`) + one `PrivacyInfo.xcprivacy` "Required Reason API" entry (`3B52.1`, file-timestamp API used by the picker). Single call site: `features/profile/lib/photoPicker.ts` — see patterns-registry → "Native image-picker pattern". |

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
- **✅ RESOLVED (FND-005, PR #7):** the `fnd005-design-inventory` stash (`stash@{0}`) has been **applied** — its content (design-system.md Component inventory + a11y baseline) is now in FND-005's PR #7. The stash entry itself is redundant now; **safe to `git stash drop` once PR #7 merges** (not dropped here — the librarian doesn't delete anything; leave it for the human/orchestrator).

## Spec-gap notes (flagged during FND-004, action for later tasks)
- **Deferred logo asset:** `react-native-bootsplash` is now fully configured on both platforms (FND-004) but still shows the library's placeholder mark — swapping in the real app logo + re-running `bootsplash generate` is a design-owned follow-up, not yet scheduled to a task.
- **2 non-blocking test-robustness nits (code review, FND-004):** (1) `BootstrapScreen.test.tsx`'s corrupted-flag case duplicates the fresh-install assertion rather than independently exercising a throwing/non-boolean MMKV read; (2) the no-network boot assertion spies on `fetch` only, not `XMLHttpRequest` — a library that boots via XHR wouldn't be caught. Neither blocks FND-004 (the guarded-read behavior itself is unit-tested in `launchStore.test.ts`, and nothing in the boot path currently uses XHR). Fold both into FND-005 or the FND module-edge E2E hardening pass.

## Forward spec-gaps from the FND coherence review (2026-07-11) — read this before the next `/module`
Structural coherence review (`docs/graph/coherence/FND.md`) recorded 5 items as forward guidance for
downstream modules — none blocked FND, all are architect input for the named `/module` run:

| # | Gap | Fix at | One-line detail |
|---|---|---|---|
| a | ProfileSetup gate is `hasLaunched`, not "profile exists" | `/module PRO` | PRO calls `setHasLaunched()` only when setup genuinely completes; do NOT add a second "profile exists" flag. |
| b | STG must ADOPT FND's raw MMKV keys, not replace them | `/module STG` | The typed storage service must wrap the existing `theme.mode` + `app.hasLaunched` keys on the default MMKV instance (no id/encryption change) or spec an explicit migration. |
| c | Deferred splash logo asset | design / PRO follow-up | `react-native-bootsplash` wired both platforms but still shows the library placeholder mark — swap in the real logo + `bootsplash generate`. |
| d | `taskId: string` route contract | `/module TSK` | Nav params fix task identity as `string` — TSK's data model must produce string ids (e.g. UUID); confirm before TSK builds. |
| e | `react-native-reanimated/plugin` must stay last in `babel.config.js` | STG/TSK spec note | Any new babel plugin/animation work must preserve plugin ordering. |

Full justification for each lives in `docs/graph/coherence/FND.md` → "Spec-gaps to fix in downstream specs".

## Forward spec-gaps from the STG coherence review (2026-07-11) — read this before `/module PRO` and `/module TSK`
Structural coherence review (`docs/graph/coherence/STG.md`) recorded 6 items as forward guidance for PRO/TSK/ORG
planning — none blocked STG, all are architect input for the named `/module` run. Items a–c were first flagged
during STG-002's per-task pass (superseded by this consolidated table); d–f are new from the module-edge review:

| # | Gap | Fix at | One-line detail |
|---|---|---|---|
| a | `upsertTask` update = wholesale field replace, not a patch/merge | `/module TSK` | `taskRepository.ts:upsertTask` keeps `id`/`createdAt`, bumps `updatedAt`, but replaces `title`/`description`/`status`/`dueDate` wholesale — TSK's edit-task form must submit the FULL business-field set every save, or a partial submit silently blanks omitted fields. |
| b | `Task.dueDate` requires full ISO-8601 (`z.string().datetime()`, UTC `Z`) | `/module TSK` | TSK's date-picker must serialize via `.toISOString()` before calling `upsertTask` — a bare `YYYY-MM-DD` fails Zod validation and the write throws. |
| c | `newId()` is non-security (uuid v4, `Math.random()`-backed, not a CSPRNG) | TSK / any id use | Fine for entity/task ids; never reuse for a security token / session / reset nonce — use a keychain/crypto generator if a security-grade id is ever needed. |
| d | `tasks` persists as one `Task[]` JSON blob (whole-collection read/rewrite per mutation) | later TSK/ORG | Fine for MVP; the "thousands of tasks" perf/pagination concern (PRD §17) is deferred, not solved. |
| e | First-launch routing seam is cross-module | ✅ **RESOLVED (PRO-001, PR #10)** | `ProfileSetupScreen.onValid` now calls `setHasLaunched()` exactly once, only on genuine setup completion (never on mount) — see patterns-registry.md → "App bootstrap / first-launch seam". |
| f | Write-time throws are unswallowed by contract | ✅ **RESOLVED for PRO (PRO-001, PR #10); still open for TSK** | PRO-001's form validates via `zodResolver(profileSchema)` at the boundary — `saveProfile`'s throw-on-invalid path is unreachable from `ProfileSetupScreen`, see patterns-registry.md → "RHF + Zod form pattern". TSK must still apply the same pattern to `saveTasks`/`upsertTask` when it builds its forms. **PRO-003 (PR #12) closes the `photo` half:** the image-picker/permission flow is now built (`features/profile/lib/photoPicker.ts` + `AvatarPhotoField`) and persists only the file-uri string through `profileRepository`, exactly as this gap specified. |

Full justification for each lives in `docs/graph/coherence/STG.md` → "Spec-gaps to fix in downstream specs".

## Spec-gap notes (flagged during PRO-002, action for later tasks)
- **2 non-blocking code-review nits (PRO-002, PR #11, low priority):** (1) `ProfileScreen`'s edit-mode `Save` handler doesn't add the `hasSubmittedRef` double-tap guard the RHF+Zod pattern row specifies (`patterns-registry.md`) — RHF's `isSubmitting` alone is currently enough here since a same-tick double-tap is a benign no-op (idempotent `setProfile` write), but a future form on this pattern with a non-idempotent submit side-effect should keep the guard; (2) `ProfileScreen.test.tsx` doesn't add a dedicated empty-name edge-case test mirroring `Avatar`'s own `getInitials('')` → icon-fallback unit test — `Avatar.test.tsx` already covers the fallback in isolation, so this is missing *screen-level* coverage of that path, not missing coverage overall. Neither blocked PRO-002 (both gate-green, code-review APPROVE). Fold into a future PRO-003/TSK form-hardening pass if a reviewer flags either again.

## Spec-gap notes (flagged during PRO-003, action for later tasks)
- **2 non-blocking code-review nits (PRO-003, PR #12, low priority):** (1) `AvatarPhotoField`'s camera-badge icon color is a literal `rgbFromTriplet('255 255 255')` constant rather than sourced from the `primary-fg` token (it happens to be the correct value — `primary-fg` is `255 255 255` in both themes, same reasoning `Button.tsx`'s `ACTIVITY_INDICATOR_COLOR` already documents — but reads as a fresh hardcode rather than a token reference); (2) `ActionSheet`'s options container uses `accessibilityRole="menu"` with per-option `accessibilityRole="menuitem"`, and the Cancel row's own `Pressable` has an empty `onPress={() => {}}` stub purely to stop backdrop-dismiss bubbling — both are functionally correct but could be polished (a named no-op helper instead of an inline empty arrow; confirm `menu`/`menuitem` is the best-matching RN a11y role pairing vs. `button`/`list`). Neither blocked PRO-003 (gate-green, code-review APPROVE, 0 fix loops). Fold into a future `components/ui` a11y-polish pass if a reviewer flags either again.
- **iOS build environment watch item:** the full `xcodebuild` gate was blocked during PRO-003 by `ENOSPC` (disk ~4.6GB free) — an environment condition, not a code defect; Android `assembleDebug` and `pod install` both passed cleanly. Disk pressure could recur for future iOS-touching tasks (PRO-003 is native-surface); if it does, free space before assuming a build regression. **Recurred at the PRO module edge** (blocked the local E2E gate too, see below) — tracked as a standing watch item in `docs/context/harness-debt.md`.

## Forward spec-gaps from the PRO coherence review (2026-07-11) — read this before `/module TSK` and `/module ORG`
Structural coherence review (`docs/graph/coherence/PRO.md`) recorded 5 items as forward guidance for TSK/ORG
planning — none blocked PRO, all are architect input for the named `/module` run:

| # | Gap | Fix at | One-line detail |
|---|---|---|---|
| a | RHF+Zod is the established form anchor | `/module TSK` | TSK **MUST** reuse `zodResolver(schema)` + `Controller` + `FormField` + `Button` (`ProfileSetupScreen`/`ProfileScreen` pattern) — not roll a second form pattern. Code-reviewer blocks a second validation approach. |
| b | `SegmentedControl<T>` is ORG-ready | `/module ORG` | Generic/tokened/a11y single-select control (first use: PRO-002's theme toggle) — reuse verbatim for filter-chip / sort-option controls (F-023–029), don't reinvent. |
| c | `ActionSheet` is ready for confirm/menu | `/module TSK` | Reuse for TSK's delete-confirmation (F-012) rather than a new `Modal` — same reuse-or-block contract as the other `components/ui` primitives. |
| d | 2 known non-blocking per-task nits | TSK/ORG reviewers | `AvatarPhotoField` badge `'255 255 255'` literal (= `primary-fg`, consistent w/ `Button` — cosmetic); `ActionSheet` `role=menu`/`menuitem` pairing — confirm it still reads as the best-matching a11y role on reuse. |
| e | **`hasLaunched` is decoupled from "profile exists"** | any clear-profile/reset/logout feature (TSK/ORG or a future Settings) | The boot gate keys on `launchStore.hasLaunched`, NOT on a profile existing — today `hasLaunched=true && profile=null` is unreachable (nothing clears the profile). **If TSK/ORG ever add a reset/clear-profile/logout affordance, it MUST reconcile `hasLaunched` + the persisted profile together**, or the boot flow and the Profile tab will disagree. Flag explicitly in any such spec. |

Full justification for each lives in `docs/graph/coherence/PRO.md` → "Spec-gaps to fix in downstream specs".

## Build & tooling
- **Package manager:** npm; installs `npm ci --legacy-peer-deps`. Lockfile: `mobile/package-lock.json`.
- **Node:** ≥18 (CI uses 20); **Java:** 17 (Android); **CocoaPods** for iOS.
- **CI:** repo-root `.github/workflows/ci.yml` (ADR-0038) — **LEAN tier**: typecheck · lint · promoted guards · traceability · Layer-0 token bridge. No build/unit/E2E jobs — those are LOCAL gates (Project Profile `ciTier: lean`).

## Version policy reminder
New installs resolve **current stable** via `npm view <pkg> version` — **except** the RN-coupled packages (`react`, `react-native`, `react-native-*`, `@react-native*`, `@react-navigation/*`), which track the installed **RN 0.75** major; an RN upgrade is its own human-reviewed task. See `.claude/harness.config.md` → Dependency Version Policy.
