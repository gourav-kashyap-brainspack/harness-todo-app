# Coherence Review — PRO (Profile)

> Module-boundary Definition-of-Done, **structural lens** (coherence-review skill). Run 2026-07-11 after all 3 PRO tasks reached `done` (PRs #10, #11, #12 merged). READ-ONLY reviewers (architect + security-reviewer), concurrent. Emergent/cross-module only — distinct from per-task gate-runner.

## Verdict: **PASS** (structural)

```json
{
  "module": "PRO",
  "checks": { "shape": "pass", "authz": "pass", "dataModel": "pass",
              "integration": "pass", "specGap": "pass", "dynamic": "pass" },
  "findings": [],
  "verdict": "PASS"
}
```

Zero cross-module coherence defects in shipped PRO code. The forward spec-gaps below are guidance for TSK/ORG planning, not PRO blockers. One Low (a scaffold-leftover empty Info.plist location string) is a release-hardening hygiene item, not a gate finding.

## Checks

| # | Check | Owner | Verdict | Justification |
|---|---|---|---|---|
| 1 | Shape / pattern drift | architect | ✅ pass | Both forms (Setup + edit) use ONE RHF+Zod anchor (`zodResolver(profileSchema)` + Controller + FormField + `handleSubmit(onValid)` + Button loading). Single feature-state source (`useProfileStore`); primitives shape-consistent (controlled, token-only, a11y-roled). No screen hand-rolled a control a primitive covers. |
| 2 | Authz / PII + permission posture | security-reviewer | ✅ pass | No PII value-logging anywhere (grep zero). Minimal correct permissions: iOS 2 usage strings (camera+photo-library) w/ rationale, no ATS/URL-scheme; Android none added. Point-of-use request, denial-as-DATA (never throws). No direct MMKV; no network; photo = uri only. |
| 3 | Data-model coherence | architect | ✅ pass | Single Profile shape (`@/core/types/profile`) + single persistence path (profileRepository); zero direct MMKV in the feature; no new MMKV key; photo is `photo?: string` uri on the existing schema; theme single-sourced (controlled toggle). |
| 4 | Integration assumptions | architect | ✅ pass | First-launch seam single-writer (`setHasLaunched()` only in ProfileSetupScreen.onValid, guarded) + works end-to-end (first launch→Setup→save+flag→Home; returning→Home). Form pattern verbatim-reusable by TSK; SegmentedControl generic for ORG; photo persists uri-only (single Avatar render path). |
| 5 | Spec-gap inheritance | architect | ✅ pass (5 recorded) | See table. |
| 6 | Dynamic `coherenceChecks` (3) | architect | ✅ pass 3/3 | (1) both forms share RHF+Zod, no second validation approach; (2) zero direct MMKV in profile feature; (3) mandatory-setup gating driven solely by launchStore.hasLaunched, single writer, no parallel flag. |

## SCA (security-reviewer)
`npm audit --audit-level=high`: **0 High / 0 Critical** (11 moderate, pre-existing RN transitives). `react-native-image-picker@8.2.1` added no High/Critical. Log: `docs/graph/logs/coherence-PRO-audit.log`.

## Spec-gaps to fix in downstream specs (forward guidance for TSK/ORG)

| # | Gap | Fix at | Detail |
|---|---|---|---|
| a | RHF+Zod is the established form anchor | `/module TSK` | TSK MUST reuse `zodResolver(schema)` + Controller + FormField + Button — NOT roll its own. Code-reviewer blocks a second form pattern. |
| b | `SegmentedControl<T>` is ORG-ready | `/module ORG` | Generic/tokened/a11y — use for filter chips + sort options (F-023–029), don't reinvent. |
| c | `ActionSheet` is ready for confirm/menu | `/module TSK` | Reuse for TSK's delete-confirmation (F-012) rather than a new Modal. |
| d | 2 known non-blocking per-task nits | TSK/ORG reviewers | AvatarPhotoField badge `'255 255 255'` literal (= primary-fg, consistent w/ Button — cosmetic); ActionSheet `role=menu` already present (nit appears addressed) — confirm on reuse. |
| e | **NEW — hasLaunched is decoupled from "profile exists"** | any clear-profile/reset/logout feature | The boot gate keys on `hasLaunched`, NOT on a profile existing. Today `hasLaunched=true && profile=null` is unreachable (nothing clears the profile), so ProfileScreen's EmptyState fallback is purely defensive. **If TSK/ORG (or a future Settings) add a reset/clear-profile/logout affordance, it MUST reconcile `hasLaunched` + the persisted profile together**, or the boot flow and the Profile tab will disagree. Flag in any such spec. |

## Forward security posture (TSK/ORG must inherit)
- No PII/profile values in console/logs.
- Sensitive secrets/tokens → `react-native-keychain`; non-sensitive → MMKV **through the STG storage service** (never import `react-native-mmkv` in a feature).
- Any new native permission = point-of-use request + graceful denial-as-data (never throw/crash) + a matching Info.plist rationale + NO Android over-permissioning.
- Keep the no-network invariant until a backend module is deliberately scoped.
- **Low / release-hygiene (not a PRO fix):** an empty `NSLocationWhenInUseUsageDescription` exists in `Info.plist` from the RN scaffold (the app never requests location) — remove or give a real rationale at the release-hardening lane (`releaseHardening: advisory`); a stray empty usage string can draw an App Store review nit.

## E2E gate (behavioral half of Module DoD)
_Pending human decision at the integration go (below). **PRO is the first module with a genuinely-runnable E2E** — a real user journey exists: fresh launch → Profile Setup → submit name+email → Home → Profile tab view/edit → theme toggle → (photo). `mobile/.maestro/` has no flows yet; e2e-automator would author them + drive an Android emulator. Constraint: disk is tight (~4.6GB), which may block the emulator/build. Recorded here when it runs._

## Integration go
_Awaiting human integration go. Module DONE only on: coherence PASS (✅) ∧ local E2E green-or-deferred ∧ human go._

---
_Structural verdict by the coherence-review skill. E2E verdict to be appended when the local gate runs._
