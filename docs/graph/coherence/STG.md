# Coherence Review — STG (Local Persistence)

> Module-boundary Definition-of-Done, **structural lens** (coherence-review skill). Run 2026-07-11 after both STG tasks reached `done` (PRs #8, #9 merged). READ-ONLY reviewers (architect + security-reviewer), concurrent. Emergent/cross-module only — distinct from per-task gate-runner.

## Verdict: **PASS** (structural)

```json
{
  "module": "STG",
  "checks": { "shape": "pass", "authz": "pass", "dataModel": "pass",
              "integration": "pass", "specGap": "pass", "dynamic": "pass" },
  "findings": [],
  "verdict": "PASS"
}
```

Zero cross-module coherence defects in shipped STG code. STG is a clean, consistent persistence anchor for PRO/TSK. The 6 spec-gaps below are **forward guidance for PRO/TSK/ORG planning**, not STG blockers.

## Checks

| # | Check | Owner | Verdict | Justification |
|---|---|---|---|---|
| 1 | Shape / pattern drift | architect | ✅ pass | Both repositories follow one shape — reads via `storage.getItem(key,schema,fallback)` (total, safe default), writes via `setItem` (Zod-validate, throw on invalid). One persistence path; `storage.ts` is the sole `new MMKV()` owner in STG; schemas defined once in `core/types` (z.infer), never re-declared. |
| 2 | Authz / data-at-rest posture | security-reviewer | ✅ pass | No auth surface (local-only). Only non-sensitive data in MMKV (name/email/tasks); keychain-for-secrets boundary left clean. **No PII value-logging anywhere** (only key + `error.name`/Zod-path). Dormant-deps invariant holds; both repos go through the service (no bypass). |
| 3 | Data-model coherence | architect | ✅ pass | 4 persisted keys, disjoint namespaces (`theme.mode`/`app.hasLaunched` raw scalars vs `profile`/`tasks` enveloped) → no collision possible. `{version,data}` envelope applied consistently to STG keys. `Task.id` = `z.string().uuid()` everywhere, matches nav `taskId: string` (spec-gap d). |
| 4 | Integration assumptions | architect | ✅ pass | Repositories expose exactly the seams PRO/TSK need. FND raw-key adoption churn-free: default `new MMKV()`, STG never touches the two FND keys → coexistence sound (spec-gap b holds). `createPersistedValue → {hydrate,persist}` is the single hydration recipe PRO/TSK use once each. |
| 5 | Spec-gap inheritance | architect | ✅ pass (6 recorded) | See table below. |
| 6 | Dynamic `coherenceChecks` (3) | architect | ✅ pass 3/3 | (1) single storage service — repos import neither `react-native-mmkv` nor AsyncStorage; (2) every read Zod-guarded, corrupt→safe default (F-038); (3) shared hydrate-once recipe in place for PRO/TSK. |

## SCA (security-reviewer)
`npm audit --audit-level=high`: **0 High / 0 Critical** (11 moderate, all build-time dev/native tooling — `uuid → xcode → @expo/config-plugins → react-native-bootsplash`; fix is a human-reviewed RN-bootsplash major, not a blocker). New dep `react-native-uuid@2.0.4` introduces no High/Critical. Log: `docs/graph/logs/coherence-STG-audit.log`.

## Spec-gaps to fix in downstream specs (forward guidance)

| # | Gap | Fix at | Detail |
|---|---|---|---|
| a | `upsertTask` is **wholesale field-replace** on update (not a patch/merge) | `/module TSK` | TSK's edit form must submit the FULL business-field set (`title`, `description`, `status`, `dueDate`) every save — a partial submit silently blanks omitted fields. |
| b | `Task.dueDate` requires full **ISO-8601** (`z.string().datetime()`, UTC `Z`) | `/module TSK` | TSK's date picker must serialize via `.toISOString()`; a bare `YYYY-MM-DD` fails validation → the task is dropped as corrupt on read. |
| c | `newId()` is **non-security** (uuid v4, `Math.random`-backed, not CSPRNG) | TSK / any id use | Fine for entity/task ids; never reuse for a security token / session / reset nonce. Use a keychain/crypto generator if a security-grade id is ever needed. |
| d | `tasks` persists as **one `Task[]` JSON blob** (whole-collection read/rewrite per mutation) | later TSK/ORG | Fine for MVP; the "thousands of tasks" perf/pagination concern (PRD §17) is deferred, not solved. |
| e | **NEW — first-launch routing seam is cross-module** | `/module PRO` | `launchStore.setHasLaunched()` (FND) is never called by FND by design — **PRO must call it once first-run Profile Setup completes**, or the app never leaves `ProfileSetup`. PRO owns this wiring. |
| f | **NEW — write-time throws are unswallowed by contract** | `/module PRO` + `/module TSK` | `saveProfile`/`saveTasks`/`upsertTask` **throw** on schema-invalid input (programmer-error signal). PRO/TSK must validate at the form boundary (RHF + `zodResolver`) so this path is never user-reachable. Also: PRO owns the `photo` image-picker/permission flow (STG persists only the file-uri string). |

## Forward security posture (PRO/TSK/ORG must inherit)
- **Sensitive fields → keychain, never MMKV.** Established rule: non-sensitive → MMKV via the service; tokens/passwords/secrets → `react-native-keychain` (currently dormant). Don't widen the profile/task blob to hold secrets.
- **`newId()` non-security only** (see gap c).
- **Keep going through the service** — no repository may re-`JSON.parse` or import `react-native-mmkv` directly; no PII values in any log sink.
- **Note (not a finding):** profile `email` is PII persisted **unencrypted** on the default MMKV instance — acceptable under the LOCAL-ONLY single-profile decision (OQ-1); re-evaluate if a backend/multi-tenant/device-loss threat model is ever introduced.

## E2E gate (behavioral half of Module DoD) — ⏭️ DEFERRED (human decision, 2026-07-11)
The STG layer is **headless** (no screens), so persistence E2E is deferred by explicit human decision — it is naturally exercised at the module edge of the first UI module that consumes it (PRO/TSK): create → kill-relaunch → data restored; corrupted store still boots. Full E2E remains a **mandatory local gate before any `development → main` release**.

## Integration go
✅ **Human integration go given 2026-07-11.** STG module = **DONE** (`status: done`, `coherenceStatus: pass`, `e2eStatus: deferred`). Unblocks PRO + TSK.

---
_Structural verdict by the coherence-review skill. E2E verdict to be appended if/when the local gate runs._
