# Setup Complete — Todo App

> Written by `/setup` (ADR-0038 + ADR-0046). Presence of this marker = the Project Profile has been
> resolved. `/scope` and `/build` treat a missing marker on a fresh project as "run `/setup` first".

- **Resolved:** 2026-07-07
- **Answered by:** varunprashar35@gmail.com
- **Repo:** https://github.com/gourav-kashyap-brainspack/harness-todo-app.git (origin verified — not a template remote ✅)

## Resolved Project Profile

| Switch | Value | Source |
|---|---|---|
| `platforms` | **both** (iOS + Android) | answered |
| `AUTONOMY_MODE` | **human-gated** | answered |
| `releaseHardening` | **advisory** | answered |
| `offlineTier` | **read-cache** | answered |
| `ciTier` | lean | default |
| `unitGate` | on (80% changed / 70% global) | default |
| `buildGate` | local | default |
| `e2eGate` | on (module-edge, local only) | default |
| `visualParity` | mockup | default |
| `perfBudget` | off | default |
| `intakeMode` | full-upfront | default |
| `timeTracking` | on | default |
| `telemetryDashboard` | on | default |
| `tasteReviewer` | off | default |

## Placeholders resolved
- `{{APP_DISPLAY_NAME}}` → **Todo App**
- `{{PRODUCT_DESCRIPTION}}` → A cross-platform to-do / task-management app — create, organize, complete, filter, and track tasks.
- `{{APP_TARGET}}` → **DEFERRED** — native scheme / applicationId is a persistent, hard-to-reverse ID; decide it when the RN app is scaffolded into `mobile/`.
- ClickUp IDs (`{{CLICKUP_*}}`) → filled on first `/clickup-sync` after `/scope` creates the lists.

## Environment preflight (2026-07-07)

| Check | Result |
|---|---|
| Git remote = project repo | ✅ |
| Node 20+ / npm | ✅ Node 20.19.6 · npm 10.8.2 |
| Xcode (iOS) | ✅ 16.2 |
| MCP `.mcp.json` active · root CI | ✅ |
| Android SDK | ⚠️ present, but `ANDROID_HOME` unset |
| Java | ⚠️ Java 21 installed; RN 0.75 Gradle wants **Java 17** |
| `gh` CLI | ❌ not installed (required for PR/merge flow) |
| Maestro CLI | ❌ not installed (module-edge E2E; local only) |
| `mobile/` RN app | ❌ **not scaffolded** — the harness builds into `mobile/` |

## Blockers to clear BEFORE `/build` can complete a task
1. **Scaffold the RN 0.75 app** into `mobile/` (RN CLI init). Decide `{{APP_TARGET}}` (applicationId/scheme) here.
2. **Install `gh`** and `gh auth login` — no PR/merge flow without it.
3. **Java 17** for Gradle: `brew install openjdk@17`, point `JAVA_HOME` at it.
4. **`export ANDROID_HOME`** = `~/Library/Android/sdk` (+ `platform-tools` on PATH).
5. Install **Maestro** before the first module-edge E2E gate (not needed for per-task gates).

## Next step
Run `/intake` (drop the PRD + feature list into `docs/requirements/sources/`), then `/scope`.
