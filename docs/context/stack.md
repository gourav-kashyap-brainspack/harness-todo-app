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
| @react-native-community/datetimepicker | ^8.6.0 | added TSK-005, 2026-07-12 — **RN-0.75/old-arch line, deliberately not the newest published major** (9.x targets the New Architecture only; this project runs `newArchEnabled=false`), per the Dependency Version Policy's RN-coupled-package exception. Docs grounded via Context7 (`resolve-library-id` → `query-docs`) before wiring the per-platform API split — see patterns-registry → "Native date+time picker". Pulls only `invariant` (already in-tree) — surgical lockfile diff. Native-surface dep → `MERGE_WAIT_FOR_CI=on` for TSK-005's PR #17; Android `assembleDebug` (native module linked) built green, iOS `pod install`/`xcodebuild` NOT run locally (toolchain/disk headroom, same standing risk as PRO-003). |

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
| a | `upsertTask` update = wholesale field replace, not a patch/merge | ✅ **CLOSED (TSK-003, PR #15)** | `taskRepository.ts:upsertTask` keeps `id`/`createdAt`, bumps `updatedAt`, but replaces `title`/`description`/`status`/`dueDate` wholesale. `EditTaskScreen.handleSubmit` applies it correctly: merges `TaskForm`'s validated `title`/`description` over the EXISTING task's `status`/`dueDate` before calling `updateTask` — see patterns-registry.md → `TaskForm` row, "Caller-side edit-merge contract". TSK-005 (due-date) must keep the same discipline for whatever it still doesn't add to the form's `.pick` set. |
| b | `Task.dueDate` requires full ISO-8601 (`z.string().datetime()`, UTC `Z`) | ✅ **CLOSED (TSK-005, PR #17, review — awaiting merge)** | `DueDateField` emits `.toISOString()` on every assign (both platforms) and `undefined` on Clear — see patterns-registry → "Native date+time picker". |
| c | `newId()` is non-security (uuid v4, `Math.random()`-backed, not a CSPRNG) | TSK / any id use | Fine for entity/task ids; never reuse for a security token / session / reset nonce — use a keychain/crypto generator if a security-grade id is ever needed. |
| d | `tasks` persists as one `Task[]` JSON blob (whole-collection read/rewrite per mutation) | later TSK/ORG | Fine for MVP; the "thousands of tasks" perf/pagination concern (PRD §17) is deferred, not solved. |
| e | First-launch routing seam is cross-module | ✅ **RESOLVED (PRO-001, PR #10)** | `ProfileSetupScreen.onValid` now calls `setHasLaunched()` exactly once, only on genuine setup completion (never on mount) — see patterns-registry.md → "App bootstrap / first-launch seam". |
| f | Write-time throws are unswallowed by contract | ✅ **CLOSED for every write path (PRO-001 PR #10; TSK-002 PR #14; TSK-003 PR #15; TSK-005 PR #17, review — awaiting merge)** | PRO-001's form validates via `zodResolver(profileSchema)` at the boundary — `saveProfile`'s throw-on-invalid path is unreachable from `ProfileSetupScreen`, see patterns-registry.md → "RHF + Zod form pattern". **PRO-003 (PR #12) closes the `photo` half:** the image-picker/permission flow persists only the file-uri string through `profileRepository`, exactly as this gap specified. **TSK-002 closes it for task creation** and **TSK-003 closes it for task edit:** both route through `TaskForm`'s `zodResolver(taskSchema.pick({...}))` boundary before calling `addTask`/`updateTask`. **TSK-005 closes the last remaining path:** `TaskForm`'s `.pick` widened to include `dueDate` (validated via `DueDateField`'s Controller), so `upsertTask`'s throw-on-invalid path is now unreachable from every TSK write flow — no TSK path left open. |

Full justification for each lives in `docs/graph/coherence/STG.md` → "Spec-gaps to fix in downstream specs".

## Spec-gap notes (flagged during PRO-002, action for later tasks)
- **2 non-blocking code-review nits (PRO-002, PR #11, low priority):** (1) `ProfileScreen`'s edit-mode `Save` handler doesn't add the `hasSubmittedRef` double-tap guard the RHF+Zod pattern row specifies (`patterns-registry.md`) — RHF's `isSubmitting` alone is currently enough here since a same-tick double-tap is a benign no-op (idempotent `setProfile` write), but a future form on this pattern with a non-idempotent submit side-effect should keep the guard; (2) `ProfileScreen.test.tsx` doesn't add a dedicated empty-name edge-case test mirroring `Avatar`'s own `getInitials('')` → icon-fallback unit test — `Avatar.test.tsx` already covers the fallback in isolation, so this is missing *screen-level* coverage of that path, not missing coverage overall. Neither blocked PRO-002 (both gate-green, code-review APPROVE). Fold into a future PRO-003/TSK form-hardening pass if a reviewer flags either again.

## Spec-gap notes (flagged during PRO-003, action for later tasks)
- **2 non-blocking code-review nits (PRO-003, PR #12, low priority):** (1) `AvatarPhotoField`'s camera-badge icon color is a literal `rgbFromTriplet('255 255 255')` constant rather than sourced from the `primary-fg` token (it happens to be the correct value — `primary-fg` is `255 255 255` in both themes, same reasoning `Button.tsx`'s `ACTIVITY_INDICATOR_COLOR` already documents — but reads as a fresh hardcode rather than a token reference); (2) `ActionSheet`'s options container uses `accessibilityRole="menu"` with per-option `accessibilityRole="menuitem"`, and the Cancel row's own `Pressable` has an empty `onPress={() => {}}` stub purely to stop backdrop-dismiss bubbling — both are functionally correct but could be polished (a named no-op helper instead of an inline empty arrow; confirm `menu`/`menuitem` is the best-matching RN a11y role pairing vs. `button`/`list`). Neither blocked PRO-003 (gate-green, code-review APPROVE, 0 fix loops). Fold into a future `components/ui` a11y-polish pass if a reviewer flags either again.
- **iOS build environment watch item:** the full `xcodebuild` gate was blocked during PRO-003 by `ENOSPC` (disk ~4.6GB free) — an environment condition, not a code defect; Android `assembleDebug` and `pod install` both passed cleanly. Disk pressure could recur for future iOS-touching tasks (PRO-003 is native-surface); if it does, free space before assuming a build regression. **Recurred at the PRO module edge** (blocked the local E2E gate too, see below) — tracked as a standing watch item in `docs/context/harness-debt.md`.

## Spec-gap notes (flagged during TSK-003, action for later tasks)
- **Description `undefined` vs `''` — now settled, do not re-litigate.** `TaskForm`'s `EMPTY_VALUES`/`defaultValues` fallback (`description: task.description ?? ''`) means BOTH the create path (TSK-002) and the edit path (TSK-003) submit an empty description as `''`, never `undefined` — confirmed 2x consistent, deliberate. `taskSchema.description` stays `z.string().optional()` so both are schema-valid; this note just closes the ambiguity flagged in TSK-002's spec-gap note. Not flagged `[promote]` — it's a benign, consistently-applied normalization, not a recurring defect.
- **✅ RESOLVED (TSK-005, PR #17).** The 3 coexisting `date-fns` format strings flagged here are now consolidated into `core/lib/formatDueDate.ts` (`formatDueDateCompact`/`formatDueDateFull`) — see patterns-registry → "Due-date formatting util" and the TSK-005 spec-gap note below. `TaskDetailScreen`'s separate `META_DATE_FORMAT` (Created/Updated metadata) was correctly left untouched, per the original note.

## Spec-gap notes (flagged during TSK-004, action for later tasks)
- **No new deps.** TSK-004 is JS/native-prop-color only (Feather glyphs already installed via `react-native-vector-icons`).
- **Confirm-gating convention (record here, not just the registry):** any destructive store mutation (delete, and by extension any future irreversible action) MUST route through an `ActionSheet`-with-`title` confirm via a shared feature hook (`useTaskActions` shape) — never a direct tap-to-mutate, never a bespoke `Alert.alert`. See patterns-registry.md → "Confirm-gated destructive action" + the extended `ActionSheet` row.
- **`nativeChromeColors.ts` mirror convention (record here, not just the registry):** when a native `color`/tint prop (Feather icon, `ActivityIndicator`, nav chrome) needs a *theme* color that already exists as a NativeWind token, MIRROR that token's RGB verbatim into `NATIVE_CHROME_RGB` — never hardcode a fresh hex, never invent a new semantic color for a native-prop need. TSK-004 mirrored the pre-existing `success` token this way (needed for the Detail toggle icon + `ActionSheet` option icons); `primary`/`danger` were already mirrored since FND-003.
- **TSK-005 is now the sole remaining TSK task.** Once it merges, the **TSK Module DoD** runs (coherence review + local E2E) — this is where the deferred-E2E debt (FND/STG/PRO, 0 local runs to date, tracked in `harness-debt.md`) finally matters: TSK is the first module with a dense, genuinely-interactive flow set (create/list/detail/edit/toggle/delete/duplicate), so recommend clearing disk headroom before the TSK module edge rather than deferring a 4th module's worth of untested assembled flows.
- **1 single-use shape flagged for promotion-on-2nd-consumer:** `TaskDetailScreen.tsx:ICON_BUTTON_BASE_CLASSNAME` (a 48dp outlined icon-button chrome backing the Detail Toggle/More buttons) — code-review nit, non-blocking. Tracked in `docs/context/harness-debt.md`; promote to `components/ui` the moment a second screen needs the identical icon-button shape.

## Spec-gap notes (flagged during TSK-005, action for later tasks — LAST TSK task, PR #17 open/review, NOT yet merged)
- **No new deps beyond `@react-native-community/datetimepicker@^8.6.0`** (RN-0.75/old-arch line — see the dependency table above).
- **iOS combined-picker UX nit — non-blocking code-review finding, carried forward as an explicit item for the TSK module-edge E2E.** iOS renders the date+time picker as one combined `mode="datetime"` native control (vs. Android's sequential date→time). The reviewer flagged (code-only review, unverified on a physical device) that the combined control *may* collapse/dismiss mid-pick before both date and time are committed. **Action at the TSK module-edge E2E run:** exercise the iOS date→time flow on a real device/simulator; if it does collapse mid-pick, wrap the trigger in a modal with an explicit "Done" commit step rather than relying on the native control's own dismiss behavior.
- **iOS `pod install`/`xcodebuild` NOT run locally for TSK-005** (toolchain/disk headroom) — Android `assembleDebug` (native module linked and built) was the decisive local build gate, same precedent as PRO-003. Standing disk-pressure risk, tracked in `harness-debt.md`.
- **`TSK-005` is the LAST TSK task.** All 18 TSK features are now implemented (done or review); once PR #17 merges, the **TSK Module DoD** (coherence review + local E2E, NOT yet run) is the next gate before TSK is `done` and ORG unblocks.

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

## Spec-gap notes (flagged during TSK-002, action for later tasks)
- **2 non-blocking code-review nits (TSK-002, PR #14, low priority):** (1) an empty description submits as `''` rather than `undefined` — `taskSchema`'s `description` is optional, so both are schema-valid, but the two aren't distinguished on read; TSK-003 (edit) re-touches this same field and should decide + apply one normalization consistently rather than inherit the ambiguity; (2) `FormField`'s new `multiline` mode (min-height + `textAlignVertical`) hasn't been visually verified on a physical Android device — flag for the TSK module-edge visual/E2E pass, same as other deferred visual nits this project has been carrying.
- **`TaskForm` promoted as a Tier-1-adjacent shared pattern** (see patterns-registry.md → "`TaskForm` (shared create+edit feature form)") — TSK-003 and TSK-005 extend it rather than forking a new form; TSK-005 runs in `TSK-pg1` parallel with TSK-003/004 after TSK-002 merges, so both touch `TaskForm.tsx` — coordinate merge ordering per the `parallel-integration` skill to avoid a silent field-set conflict.

## Spec-gap notes (flagged during ORG-001, action for ORG-002 — PR #18 merged 2026-07-12)
- **No new deps.** ORG-001 is JS-only (Zustand + the existing typed storage service).
- **2 forward security advisories — both ✅ RESOLVED + verified (ORG-002, PR #19, security review PASS):**
  1. **✅ RESOLVED — `matchesSearch` is ReDoS-safe.** `search.trim().toLowerCase().slice(0, 128)` then a plain, case-insensitive `String.includes` on title OR description — no `RegExp`/`.match()` anywhere in the path. See patterns-registry.md → "Untrusted search-input handling (ReDoS-safe)".
  2. **✅ RESOLVED — `FILTER_PREDICATES` fallback added.** `FILTER_PREDICATES[filter] ?? FILTER_PREDICATES.all` now guards the lookup, mirroring `SORT_COMPARATORS`'s existing `resolveComparator` shape (applied even though the map stays total today — forward-consistent).

## Spec-gap notes (flagged during ORG-002, action for later tasks — PR #19 merged 2026-07-12)
- **No new deps.** ORG-002 is JS/UI-only (Zustand + the existing typed storage service + `FormField`/`IconButton` primitives).
- **2 non-blocking code-review nits (ORG-002, PR #19, low priority):** (1) `matchesSearch` has a dead defensive empty-query branch — the outer pipeline (`selectVisibleTasks`) already guards the empty-search case before calling it, so the branch is unreachable in practice (the one uncovered line in an otherwise 94–100%-covered diff); (2) the no-results empty-state message interpolates the RAW (uncapped) query, not the capped/normalized string the matcher actually uses — cosmetic only, the matcher's own input stays capped. Neither blocks ORG-002 (all gates green, code-review APPROVE). Fold into ORG-003 or a future polish pass if a reviewer flags either again.
- **ORG-003 (sort) is the LAST ORG task and the last task overall — now `review`, PR #20, all gates green, NOT yet merged.** See the dedicated ORG-003 spec-gap note below. Its merge triggers the **ORG Module DoD** (coherence review + local E2E) and, per `docs/requirements/TRACEABILITY.md`, completes all 48/48 features.

## Spec-gap notes (flagged during ORG-003, action for the ORG Module DoD — PR #20 open/review, NOT yet merged, LAST task overall)
- **No new deps.** ORG-003 is JS-only (fills the last `selectVisibleTasks` comparator seams + extends `ActionSheet`).
- **ORG-001's derived-selector pipeline is now COMPLETE** — all 3 seams filled across ORG-001 (filter)/ORG-002 (search)/ORG-003 (sort), no seams left. See patterns-registry.md → "Derived selector over a store" (now marked PIPELINE COMPLETE).
- **`ActionSheet` extended a 3rd time** with `options[].active?: boolean` (single-select active-option indication — primary icon + semibold label, `destructive` precedence) — see patterns-registry.md → `ActionSheet` row. It is now the app's confirm-dialog **and** single-select-menu primitive.
- **2 non-blocking code-review nits (ORG-003, PR #20, low priority):** (1) the active menuitem could add `accessibilityState={{selected:true}}` for a11y (currently mitigated by the trigger's own announcement + the semibold visual cue — not a functional gap); (2) a redundant-but-harmless `.slice()` on an already-fresh array. Neither blocks ORG-003 (gate-green, code-review APPROVE). Fold into a future `components/ui` a11y-polish pass if a reviewer flags either again.
- **ORG-003 is the LAST task overall.** Once PR #20 merges, all 48/48 features are implemented and the **ORG Module DoD** (coherence review + local E2E) is the next and final module-edge gate — see `harness-debt.md` for the standing deferred-E2E debt this closes out.

## Build & tooling
- **Package manager:** npm; installs `npm ci --legacy-peer-deps`. Lockfile: `mobile/package-lock.json`.
- **Node:** ≥18 (CI uses 20); **Java:** 17 (Android); **CocoaPods** for iOS.
- **CI:** repo-root `.github/workflows/ci.yml` (ADR-0038) — **LEAN tier**: typecheck · lint · promoted guards · traceability · Layer-0 token bridge. No build/unit/E2E jobs — those are LOCAL gates (Project Profile `ciTier: lean`).

## Version policy reminder
New installs resolve **current stable** via `npm view <pkg> version` — **except** the RN-coupled packages (`react`, `react-native`, `react-native-*`, `@react-native*`, `@react-navigation/*`), which track the installed **RN 0.75** major; an RN upgrade is its own human-reviewed task. See `.claude/harness.config.md` → Dependency Version Policy.
