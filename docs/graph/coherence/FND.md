# Coherence Review — FND (Foundation & App Shell)

> Module-boundary Definition-of-Done, **structural lens** (coherence-review skill). Run 2026-07-10 after all 5 FND tasks reached `done` (PRs #3–#7 merged). READ-ONLY reviewers (architect + security-reviewer), concurrent. Distinct from per-task gate-runner — emergent/cross-module only.

## Verdict: **PASS** (structural)

```json
{
  "module": "FND",
  "checks": { "shape": "pass", "authz": "pass", "dataModel": "pass",
              "integration": "pass", "specGap": "pass", "dynamic": "pass" },
  "findings": [],
  "verdict": "PASS"
}
```

Zero unresolved findings in shipped FND code. The 5 spec-gaps below are **forward guidance for downstream `/module` planning**, not FND blockers.

## Checks

| # | Check | Owner | Verdict | Justification |
|---|---|---|---|---|
| 1 | Shape / pattern drift | architect | ✅ pass | Both Zustand stores (`themeStore`, `launchStore`) follow one identical MMKV-guarded-read + seed-at-load shape; all screens style via NativeWind `className` tokens (zero hardcoded hex in source); one uniform nav param-typing pattern. |
| 2 | Authz / boundary posture | security-reviewer | ✅ pass | No auth surface (local-only). Dormant-deps invariant holds module-wide (axios/react-query/jwt/keychain unimported). No secrets/PII persisted; MMKV holds only non-sensitive `theme.mode` + `app.hasLaunched`. |
| 3 | Data-model coherence (persistence) | architect | ✅ pass | Two sanely-namespaced keys, no overlap; single "resolved theme" notion (`resolveScheme` in themeStore only); one native-color source (`nativeChromeColors.ts`), no duplicated palette. |
| 4 | Integration assumptions | architect | ✅ pass | First-launch seam is single-writer clean (`app.hasLaunched`: one reader `BootstrapScreen`, one writer seam `setHasLaunched` PRO consumes; FND never self-writes). Nav routes typed coherently (`taskId: string`). Theme/UI/nav seams exported via clean barrels for reuse. |
| 5 | Spec-gap inheritance | architect | ✅ pass (5 recorded) | See table below — forward guidance, none break FND. |
| 6 | Dynamic `coherenceChecks` (3) | architect | ✅ pass 3/3 | (1) all consume shared theme tokens, no rogue palette; (2) exactly one nav tree (one NavigationContainer/stack/tabs), no ad-hoc navigators; (3) EmptyState/LoadingIndicator exist only in `components/ui`, reused not re-implemented. |

## Native attack surface (security-reviewer)
Android: only RN-default `INTERNET`; the one `exported=true` is `MainActivity` (standard LAUNCHER); no cleartext, no custom schemes/deep-links. iOS: ATS on (`NSAllowsArbitraryLoads=false`); no URL types. No `openURL`/`Linking` handlers. **SCA: 0 High / 0 Critical** (11 pre-existing moderate transitive dev-toolchain advisories — below bar; `docs/graph/logs/coherence-FND-audit.log`).

## Spec-gaps to fix in downstream specs (forward guidance for the architect)

| # | Gap | Fix at | Detail |
|---|---|---|---|
| a | ProfileSetup gate is `hasLaunched`, not "profile exists" | `/module PRO` | PRO calls `setHasLaunched()` **only** when setup genuinely completes (FR3); must NOT add a second "profile exists" flag — keep `app.hasLaunched` the single source of truth. |
| b | STG must ADOPT FND's raw MMKV keys, not replace them | `/module STG` | The typed storage service must wrap the existing `theme.mode` + `app.hasLaunched` keys on the **default MMKV instance** (no id/encryption change) or provide an explicit migration — else it orphans persisted state. Spec the two `new MMKV()` handles consolidating without key churn. |
| c | Deferred splash logo asset | design / PRO follow-up | bootsplash is wired both platforms but uses the placeholder mark; real logo + `bootsplash generate` is un-done (patterns-registry #25). |
| d | `taskId: string` route contract | `/module TSK` | Nav params fix task identity as `string`; TSK's data model must produce string ids (e.g. UUID) — confirm before TSK builds. |
| e | reanimated-plugin / NativeWind babel coupling | STG/TSK spec note | `react-native-reanimated/plugin` must stay **last** in `babel.config.js`; any new babel plugin / animation work must preserve ordering. |

## Forward authz note (security-reviewer)
FND leaves a clean seam (single on-device profile, no login/AuthGate, no network). Two to watch downstream: (a) when STG activates the network layer, wire auth centrally in the `core/api` axios interceptor (per conventions), not per-call; (b) any sensitive profile field goes to `react-native-keychain`, NOT MMKV — keep MMKV = non-sensitive cache.

## E2E gate (behavioral half of Module DoD) — ⏳ PENDING
The coherence review is the **structural** lens. The sibling **local E2E gate** (`e2e-automator`, Maestro on emulator, local-only) has **not run** — `mobile/.maestro/` has no flows yet. Flows to author: fresh-launch → Profile Setup; returning (`hasLaunched=true`) → Home; offline (airplane-mode) cold start; tab switch Home↔Profile. **The FND module is DONE only when BOTH this coherence PASS ∧ local E2E green ∧ human integration go.**

---
_Structural verdict recorded by the coherence-review skill. E2E verdict + `## Visual` subsection to be appended when the local E2E gate runs._
