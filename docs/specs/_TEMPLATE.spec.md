---
task-id: <module>-<NNN>
module: <module>
title: <short title>
status: draft            # draft | ready | in-progress | done
complexity: <S|M|L>
parallelizable: <Y|N>
parallel-group: <group-id or ->
blockedBy: []            # list of task-ids
dynamic-workflow: <Y|N>
source-features: []      # feature_id(s) from docs/requirements/features.csv this task delivers
clickup-url:             # ClickUp task URL (set by clickup-sync when the task is mirrored)
---

# <task-id> — <title>

## Goal
<one paragraph: what and why>

## Context links
- Source feature(s): `docs/requirements/REQUIREMENTS.md` (feature-ids: <…>) · `docs/requirements/features.csv`
- Overview: `docs/context/overview.md`
- Architecture: `docs/context/architecture.md`
- Conventions: `docs/context/conventions.md`
- Design system: `docs/context/design-system.md`
- Graphify: `/graphify query "<concept>"`

## Functional requirements
- FR1 …

## Non-functional requirements
- Performance · accessibility · security · observability …

## API / contract (remote backend API)
- Method + path · request/response shape (Zod schema / TS type) · status codes · error shapes. Auth (and any multi-tenancy header) is centralized in the `core/api` axios interceptor — never re-implement per call.

## State & data impact
- N/A for a pure frontend client unless the task: adds/changes `core/types`, alters React Query keys/caching, adds Zustand UI state, or touches secure/persisted storage (Keychain/MMKV). Note migrations of any persisted schema.

## UI / design notes
- Screens · states (empty/loading/error) · components reused vs new · NativeWind token / design-system refs.

## Platform divergence (iOS / Android)
- Behaviors that differ by OS (safe-area/notch, status bar, keyboard handling, back gesture, date/time pickers, permission prompts, elevation vs shadow). Note any `.ios.tsx`/`.android.tsx` or `Platform.select` split. State "no divergence" only if genuinely identical.

## Offline / degraded network
- Expected behavior on no/slow network **per surface**: what serves from the React Query cache, what shows a retry/empty state, what's disabled. NetInfo usage + React Query `networkMode`/retry policy. (Mobile networks are unreliable — never assume online.)

## Accessibility
- `accessibilityLabel` on **every** interactive element (also the Maestro selector anchor) + `accessibilityRole`; touch targets ≥ 44pt / 48dp; supports Dynamic Type / `fontScale`; never color-alone to convey state; sufficient contrast in **both** light and dark.

## Deep links & native permissions
- Deep-link routes exposed/consumed (`<yourapp>://…`) + how params are validated. Native permissions requested (camera/mic/files/notifications) + the pre-prompt rationale + denied-state handling.

## Performance budget
- Cold-start impact (is this on the boot critical path?); list rendering (FlatList virtualization for long lists); JS-bundle delta for any new dep; target frame-rate on a low-end Android device.

## Test plan
### Unit
- …
### Maestro E2E (flows) — module-edge, local-only
- Scenario: … → steps → assertions → on-device screenshot. Anchor on visible text / `accessibilityLabel` (not `testID`); no `clearState`; assert after `hideKeyboard`.

## Dependencies & blockedBy
- …

## Parallelizable?
- Y/N + group

## Dynamic-workflow needed?
- Y/N — what to research / spike

## Acceptance criteria (= the gates)
- Typecheck · lint · unit ≥80% changed / ≥70% global · build · E2E · security (no High/Critical) · code-review APPROVE.
- Plus task-specific acceptance: …

## Open questions
- [ ] … _(spec is NOT `ready` until every open question is resolved with the human)_

## Changelog
- 2026-06-19 — created (architect)
