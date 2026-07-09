# Setup Summary — Todo App

> Human-readable record of the `/setup` run and the environment bootstrap that followed.
> Date: 2026-07-07 → 2026-07-08 · Operator: varunprashar35@gmail.com
> Machine marker (canonical): [`docs/graph/SETUP-COMPLETE.md`](./graph/SETUP-COMPLETE.md)

---

## 1. What the `/setup` command is

A **one-time project preflight + configuration** step. The harness ships as a generic template;
`/setup` turns it into *this* configured project. It does **not** write app code or scaffold anything.

It runs in 5 phases:

1. **Environment preflight** — verify the machine has the tools the harness needs.
2. **Resolve the Project Profile** — ask the capability-switch questions.
3. **Write the profile** — record answers into `harness.config.md`.
4. **Prune** — remove/disable machinery for any capability turned OFF (keeps the harness lean).
5. **Mark complete** — write `SETUP-COMPLETE.md`.

---

## 2. Phase 1 — Environment preflight (required tools)

These are **prerequisites the harness requires** — detected, not chosen.

| Checked | Found | Required for |
|---|---|---|
| Git remote = project repo (not template) | ✅ `harness-todo-app.git` | never push to the template repo |
| Node 20+ / npm | ✅ 20.19.6 / 10.8.2 | RN build tooling |
| `gh` CLI | ❌ → fixed later | PR/merge flow (`GIT_PLATFORM=github`) |
| Java | ⚠️ 21 active, 17 present → fixed | Gradle (Android) |
| Android SDK | ✅ present, `ANDROID_HOME` unset → fixed | Android builds |
| Xcode | ✅ 16.2 | iOS builds |
| CocoaPods | ✅ 1.16.2 | iOS deps |
| Maestro | ❌ → installed later | module-edge E2E |
| MCP `.mcp.json` · root CI | ✅ | tooling / CI |
| `mobile/` RN app | ❌ → scaffolded later | the app the harness builds into |

---

## 3. Phase 2 — The questions asked (the real decisions)

Surfaced the 4 most consequential capability switches (from `harness.config.md → Project Profile`);
the rest took template defaults.

| Question | Answer |
|---|---|
| **Platforms** (android / ios / both) | **both** |
| **Autonomy** (how much `/build` runs unattended) | **human-gated** |
| **Release hardening** (advisory checklist vs. blocking gate) | **advisory** |
| **Offline behavior** for todos | **read-cache** |

**Defaults taken without asking** (changeable by re-running `/setup`):
`ciTier=lean` · `unitGate=on (80/70)` · `buildGate=local` · `e2eGate=on` · `visualParity=mockup` ·
`perfBudget=off` · `intakeMode=full-upfront` · `timeTracking=on` · `telemetryDashboard=on` ·
`tasteReviewer=off`.

*(The applicationId `com.todoapp` was decided later, during scaffolding — not part of `/setup`.)*

---

## 4. Where RN 0.75 / Java 17 / Android SDK come from

**The key point: these are template-pinned requirements, NOT asked of you and NOT hardcoded on a whim.**
Three categories:

### a) Template-pinned (set in `harness.config.md → Tech Stack`, before this session)
- **React Native 0.75**, React 18.3, TypeScript 5 (strict)
- **NativeWind 4**, React Navigation 6, React Query 5, Zustand 5, React Hook Form 7 + Zod 3, Axios 1.7
- **Java 17 for Gradle** — dictated by RN 0.75 (its Gradle requires Java 17). Your machine defaulted to
  Java 21, which would break the Android build, so `JAVA_HOME` was pointed at the Java 17 already installed.
- npm (not pnpm/yarn), ESLint 8, Jest, Maestro.

### b) Resolved live within the pin (Dependency Version Policy)
- The template pins the **major** (`0.75`); the exact patch is resolved at install:
  `npm view react-native@0.75 version` → **0.75.5** (latest stable in the 0.75 line).

### c) Just the machine's existing installs (not version choices)
- **Android SDK** — the existing install; component versions follow what RN 0.75 asks Gradle for.
- Node 20.19.6, Xcode 16.2, CocoaPods 1.16.2 — detected, not chosen.

> Summary: everything RN 0.75 / Java 17 / Android is a **requirement inherited from the template's
> chosen stack**. The only things *decided* were the 4 capability switches + the applicationId.

---

## 5. What `/setup` changed in the repo

1. **`.claude/harness.config.md`** — added a "This project" column to the Project Profile table with the
   4 answers + defaults; date-stamped the decision.
2. **10 files** — replaced `{{APP_DISPLAY_NAME}}` → "Todo App" and `{{PRODUCT_DESCRIPTION}}`
   (CLAUDE.md, harness.config.md, context docs, modules.json, STATUS.md, TRACEABILITY.md, …).
3. **`docs/context/harness-debt.md`** — logged the Phase-4 prune pass (nothing to physically remove —
   CI was already lean; OFF switches are input-gated).
4. **`docs/graph/SETUP-COMPLETE.md`** — new marker with the full resolved profile + preflight results.

`{{APP_TARGET}}` was intentionally left deferred until scaffold time (persistent, hard-to-reverse ID).

---

## 6. Environment bootstrap done after `/setup` (clearing the blockers)

| Blocker | Resolution |
|---|---|
| Disk 100% full (root cause of install failures) | Cleared ~9 GB via `npm cache clean --force` (now ~8 GB free) |
| `mobile/` RN app missing | Scaffolded **RN 0.75.5** into `mobile/` (`applicationId` + iOS bundle ID = **com.todoapp**, display "Todo App"); `npm install --legacy-peer-deps` OK |
| `gh` CLI missing | `brew install gh` → **2.96.0**; you ran `gh auth login` → authenticated as `gourav-kashyap-brainspack` (scopes `repo`, `workflow`, `read:org`) |
| Java 17 not active | Already in `~/.zshrc` (`JAVA_HOME` → jdk-17); now resolves correctly |
| `ANDROID_HOME` unset | Already in `~/.zshrc`; `adb` works |
| Maestro missing | Installed **2.6.1** at `~/.maestro/bin`, added to PATH |

### Known follow-ups (not blocking planning)
- `mobile/` is a **bare** RN app — the harness stack (NativeWind, navigation, React Query, Zustand,
  `eslint-plugin-boundaries`, `@/*` alias, `src/` feature-sliced layout, `.maestro/`, `scripts/e2e.sh`)
  is **not wired yet**. That wiring is the first **foundation module** (`/scope` → `/module` → `/build`).
- iOS **Pods** not installed yet (`pod install`) — only needed when the iOS build gate runs.
- Harness config references Maestro at `~/.maestro-cli/maestro/bin/maestro`; actual install is
  `~/.maestro/bin/maestro` (on PATH, so the `maestro` command works).
- `mobile/` is currently **untracked** in git — nothing committed yet.

---

## 7. Next step

Requirements → plan → build: **`/intake` → `/scope` → `/module <name>` → `/build`**.
Start by getting requirements in: drop a PRD (`.docx`) + feature list (`.xlsx`/`.csv`) into
`docs/requirements/sources/` and run `/intake` — or draft `docs/requirements/features.csv` first.
