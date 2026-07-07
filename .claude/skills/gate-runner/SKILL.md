---
name: gate-runner
description: The canonical command sequence for the strict quality gates (typecheck -> lint -> unit+coverage -> build -> e2e -> security -> code-review). Use at the "evaluate gates" step of /build. Returns a machine-readable pass/fail per gate.
---

# Gate Runner

Run the Definition of Done gates and return a per-gate verdict. Always report ALL results.

> ✅ **GATE CADENCE (ADR 0018, amends 0013):** the per-task **ACTIVE gate set this skill evaluates** is **typecheck · lint · unit+coverage · build · security · code-review**. **Unit+coverage (step 3) is ACTIVE** (re-enabled) — run it, report `pass`/`fail`, include it in `overall`. **E2E (step 5) is NOT a per-task gate** — it is a **module-edge, local-only** gate run by the orchestrator's Module-DoD loop (and a pre-release gate), NOT here: report e2e as `"moduleEdge"` and EXCLUDE it from the per-task `overall`. Do **not** run device E2E (Maestro) in this per-task skill. (E2E also never runs in CI — ADR 0012.) **CI is the LEAN tier (ADR-0038, Project Profile `ciTier: lean`):** typecheck · lint · promoted guards · traceability · token bridge only — the **unit suite and native build are gated here, locally, and nowhere else**; local-green IS the gate of record.

## Sequence (React Native app: `mobile/` — Jest + Maestro)
> **All commands run from inside `mobile/`.** The Vite/React web app under `src/` is reference-only and is NOT gated here. Package manager is **npm** (installs use `npm ci --legacy-peer-deps`).
1. **typecheck** — `npx tsc --noEmit` (TS strict mode is on; no shared-types pre-build step — single app).
2. **lint** — `ESLINT_USE_FLAT_CONFIG=false npx eslint . --max-warnings=0` (legacy config; `eslint-plugin-boundaries` import-layer rules — **zero warnings**, a boundary violation is a hard fail).
3. **unit+coverage** — **per task**: `npm run test:changed` (`jest --changedSince origin/development --coverage`) → assert ≥80% lines on changed files. Run the **full** `npm test -- --coverage` (≥70% global) at the **module edge**. (Scoped per-task keeps the loop fast; the full suite still gates the module.) **NOT in CI** when `ciTier: lean` (ADR-0038) — this gate is local-only; never assume CI re-verifies it.
4. **build** — **JS-only short-circuit (P2-4), decided by a dumb file check:** if the diff touches `android/`, `ios/`, `package.json`, or the lockfile → **full native build**; else the Metro bundle is a sufficient proxy: `npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output /tmp/rn.bundle` (catches Metro/Babel/import breakage `tsc` misses). Full native build: **Android** `cd android && ./gradlew assembleDebug` (locally keep the **Gradle daemon** — do NOT pass `--no-daemon`; use `--no-daemon` only in CI; build one ABI for the loop: `-PreactNativeArchitectures=x86_64` for an emulator / `arm64-v8a` for a device); **iOS** (macOS only) `cd ios && bundle exec pod install && xcodebuild -workspace *.xcworkspace -scheme <Scheme> -configuration Debug -sdk iphonesimulator build`. Run the **full all-ABI `gradlew assembleDebug`** at the module edge and whenever native/config files change. Do **not** build a smarter diff-classifier — the four-path check above is the whole design.
5. **e2e** — **NOT run here.** E2E is a **module-edge, local-only** gate (ADR 0018): the orchestrator runs `e2e-automator` (Maestro on a device/emulator) once per module in the Module-DoD loop, never per task and never in CI. This per-task skill reports e2e as `"moduleEdge"` and excludes it from `overall`. (Maestro E2E is set up — ADR-0037; flows in `mobile/.maestro/`, runner `scripts/e2e.sh`.)
6. **security** — `security-reviewer` verdict = PASS (no High/Critical) AND `npm audit --omit=dev` clear of High/Critical.
7. **code-review** — `code-reviewer` verdict = APPROVE (no blocking comments).

> **Gates 6 & 7 run CONCURRENTLY.** Both reviewers are READ-ONLY and independent — the orchestrator dispatches them in a single message (two Agent calls) on the same diff, and this skill consumes both verdicts together. They do not serialize.

## Output bounding (every gate command — see the `output-bounding` skill)
Each gate command can emit thousands of lines (Jest, `gradlew`, `npm audit`). Run **each** gate through the **`output-bounding`** procedure: redirect full output to `docs/graph/logs/gate-<task-id>-<gate>.log`, then surface only the structured verdict + (on failure) a bounded head+tail preview + the log path. Numeric limits live in `.claude/harness.config.md` → Tool Output Bounding.
- **Passing gate** → surface the verdict alone (no raw preview).
- **Failing gate** → surface the verdict, THEN the head+tail preview, THEN the `fullLog` path.
- Parse the log into structured `failures[]` (`file`, `error`, **`fix`** — the concrete change to make, and for unit the `coverage` numbers) so the orchestrator can route a self-correcting fix WITHOUT re-reading the log. The `fix` field is the **how-to-fix** half of the agent-oriented finding format (`harness.config.md` → Reviewer Verdict & Finding Format) — never surface a bare "X failed". Need the elided middle? `grep -n`/Read the log — never re-run the gate.

## Output (machine-readable)
Return JSON (per-gate verdict + the log path per gate + structured failures):
```json
{ "typecheck":"pass|fail", "lint":"pass|fail", "unit":"pass|fail",
  "coverage":{"changed":0,"global":0}, "build":"pass|fail",
  "e2e":"moduleEdge", "security":"pass|fail", "codeReview":"pass|fail",
  "overall":"pass|fail",
  "flaky": [],
  "logs": { "<gate>": "docs/graph/logs/gate-<task-id>-<gate>.log" },
  "failures": [ { "gate":"build", "file":"mobile/src/...:NN", "error":"…", "fix":"the concrete change to make",
                 "class":"environment|code|flaky", "errorSignature":"<gate>:<file:line>:<normalized-error>" } ] }
```
`overall` = pass only if every **active per-task** gate passes (typecheck · lint · unit+coverage · build · security · code-review). `e2e` is always `"moduleEdge"` here and is **excluded** from `overall` — it is evaluated separately at the module boundary (ADR 0018). For any fail, include the responsible area + the exact error + a **how-to-fix** (the `what · why · how-to-fix` finding format — `harness.config.md` → Reviewer Verdict & Finding Format) so the orchestrator can route a self-correcting fix to the right builder.

## Rules
- Coverage thresholds and "no High/Critical" come from `.claude/harness.config.md` — read them; don't hardcode if changed. **Coverage:** `unit+coverage` runs `npm test -- --coverage` (Jest). `mobile/jest.config.js` is **configured** (`setupFiles`/`setupFilesAfterEnv` with native-module mocks in `jest.setup.js`, `collectCoverageFrom` scoped to `src/`, and a `coverageThreshold.global` **anti-regression floor**). The floor **ratchets toward the ≥70% target** as modules gain tests — raise it when coverage climbs. Report the actual `coverage.global`; the **≥80%-on-changed-files** bar is the operative per-task check (unit-tester + code-reviewer) until diff-coverage tooling lands. Component tests use `@testing-library/react-native`.
- **Error-Handling Discipline (ADR-0033) — classify + signature every failure.** For each entry in `failures[]` set `class` (`environment` | `code` | `flaky`) and a stable `errorSignature` (`<gate>:<file:line>:<normalized-error>`). The orchestrator uses `class` to ROUTE (an **environment** failure — stale build/cache, port/service down, CORS/env, tool-version skew — is fixed in the environment, **never** by editing app code) and `errorSignature` to detect **no progress** (two identical signatures across consecutive iterations ⇒ escalate immediately, do not walk to the 5-cap). A failure surfaced without `class` + `errorSignature` + the `what·why·how-to-fix` triple is itself a STOP — fix the reporting before retrying.
- The ACTIVE per-task gate set is defined in `.claude/harness.config.md` (Task DoD) — read it. Per ADR 0018: **unit+coverage is active** (report `pass`/`fail`); **e2e is NOT a per-task gate** (report `"moduleEdge"`, excluded from `overall`).
- Never report `overall: pass` with any **active per-task** gate failing. No partial credit.
- **Output bounding is mandatory** (`output-bounding` skill): full logs to `docs/graph/logs/gate-<task-id>-<gate>.log`; only the verdict + (on-fail) a bounded head+tail preview + the path reach context. Never paste a full multi-thousand-line gate dump into the conversation. Keep the structured JSON above intact — bound the human-visible log text only.
- **Flaky gates: re-run ONCE to confirm, a flip is a STOP — never an auto-pass (HARNESS-AUDIT #10).** A single run's binary result is trusted *only when it is internally consistent*. If a gate's result is suspect — it failed with a non-deterministic signature (timeout, `429`/self-throttle, port/Postgres-connection race, "worker terminated", an assertion that references timing/order) rather than a real `file:line` defect — **run that one gate exactly once more**:
  - **fail → fail:** it's a real failure. Route to the builder as normal.
  - **pass → pass** (the suspect signature didn't recur): treat as pass, but **record `"flaky":["<gate>"]`** in the JSON so the flap is visible (don't silently bless it).
  - **fail ⇄ pass (flips):** the gate is **non-deterministic — this is a STOP, not an auto-pass.** Set `overall:"fail"`, add the gate to `"flaky"`, and **escalate to the human** with both run logs. A flake-pass must never merge an intermittently-broken change (ADR 0013 cites a real flaky unit test + `429` self-throttling as history). Re-run **once**, not in a loop — repeated re-running until green is exactly the anti-pattern this prevents.
