---
name: maestro-e2e
description: Canonical playbook for authoring TRUSTWORTHY Maestro E2E flows for any mobile app (RN/native). How to ground anchors in real source+API before writing, pick stable selectors, drive steppers/modals/keyboards, and — the load-bearing rule — SERVER-CONFIRM every mutation (assert the success/error toast, not an optimistic row) so a green flow can never be a false-green. Use whenever writing, fixing, or reviewing a Maestro flow. Selector-key facts and run params stay in the e2e-automator agent + harness.config.md; this is the reusable methodology.
---

# Maestro E2E Authoring — trustworthy flows, not green checkmarks

The goal of an E2E flow is a **trustworthy assertion**: it passes **iff** the feature actually works, and fails loudly when it doesn't. A flow that goes green while the feature is broken (a *false-green*) is worse than no flow. Everything below serves that one goal. It is written to apply to **any** mobile app automated with Maestro, not one project.

## 0. The prime directive — don't guess, ground

Before writing or fixing a single anchor:
1. **Read the real component source** for the exact on-screen string and the exact `accessibilityLabel`. Never write an anchor from memory or from the mockup — read the `.tsx`/`.xml`/`.swift` that renders it.
2. **Verify against the live app/API** — do the fixtures exist? what are the real category/enum names? what is the *default* screen state? Query the backend directly (curl the endpoint) rather than assuming.
3. **When a step fails, dump the real UI** (`maestro hierarchy` + a screenshot) and read what is actually on screen. Fix the *actual* cause. Do **not** patch symptoms or retry on a hunch — that is how a stable cause gets masked by a wobblier one.

> One diagnostic dump beats three speculative edits. "It's probably X" is not a diagnosis.

## 1. Selectors — match what the device actually exposes

- Maestro `text:` matches **visible text OR the accessibility label** (Android content-desc), **whole-string**, **case-insensitive**, as a **regex**. Design anchors around that.
- **Whole-string regex bites:** `"Doctor"` does **not** match a rendered `"Doctor *"` (required-marker) or `"Doctor (primary)"`. Use `"Doctor.*"`, or anchor exactly. Conversely `^Foo$` disambiguates a short word from longer strings containing it (`"Complete"` vs `"Completed"`).
- **Prefer the stable a11y label over volatile visible text.** A control whose *visible* text changes (e.g. a date-range button reading "Last 30 Days" / "Custom") but whose `accessibilityLabel` is constant ("Select date range") — anchor on the constant. Same for an input: its placeholder is exposed as the Android hint and stays queryable **even after text is typed**, so `tapOn: "<placeholder>"` re-focuses it later.
- **Data-independent anchors so flows don't age out.** Prefer `"View bill for .*"` (index 0) over `"View bill for Jane Doe"` when the list content rotates. Hard-coding a fixture name that later falls out of the query window is a time-bomb.
- **Disambiguate repeats** with `index:`, and **relational** selectors `below:` / `above:` / `containsChild:` when several elements share a string (e.g. a submit button's a11y equals a FAB's a11y — filter `below:` the field that only exists inside the modal).
- If a needed anchor genuinely doesn't exist, request an `accessibilityLabel` from the app builder — don't contort the flow around an ambiguous match (and E2E authors don't edit app source).

## 2. Know the DEFAULT state before you anchor

Anchors written for the wrong variant fail even when the app is fine:
- **Default view/tab/filter matters.** If a list defaults to *card* view but you copied anchors from the *list*-row component, the action a11y may differ. Confirm which component renders by default (read the `useState(initial)` / default prop).
- **Required-field markers, pluralization, unit suffixes** (`"Amount (₹) *"`, `"Patients (116)"`) change the exact string. Read the render, don't assume the bare label.

## 3. Navigation & interaction mechanics (the physical device gotchas)

- **Steppers/tabs are usually forward-only via the primary CTA.** If step-pills only navigate to *completed* or *previous* steps (`canNav = isDone || idx < current`), you cannot tap *ahead* — advance with the "Next"/"Save & Next" button. Tapping the future pill silently does nothing.
- **Keyboard occlusion is invisible sabotage.** A tap on an element hidden *behind the soft keyboard* reports `COMPLETED` but does nothing (e.g. a date picker that never opens). `hideKeyboard` (or scroll it above the fold) before tapping below-fold controls.
- **Off-screen taps land in the last-focused field.** Always `scrollUntilVisible` a below-fold input into view *before* `tapOn`+`inputText`, or the text lands in the previously focused field (a classic "why is the address in the phone box" bug).
- **Bottom-edge taps hit the pinned footer.** When the target sits just above a sticky footer/CTA, a bottom-edge tap on it hits the footer instead. Use `scrollUntilVisible` with `centerElement: true` to center the target.
- **Full-screen modals are separate windows.** Elements from the screen behind may or may not be in the queryable hierarchy; use `below:`/`above:` relative to something *inside* the modal to pin the right match.
- **Tap the handler owner, not the label.** A field's caption `Text` often isn't the focusable input — tap the input's own a11y (e.g. "Blood pressure systolic over diastolic"), not the "BP (sys/dia)" label.
- **Clearing a controlled input can leave a stray char.** `eraseText` races a controlled (RHF/state-bound) input's re-render, and the previous value's **last character can reappear after** the freshly typed text (type "Acme Clinic" over "…ClinicD" → get "Acme ClinicD"). It is **non-deterministic** (passes most runs). Defenses, all three: (a) `eraseText: <count>` with an explicit count ≥ field length; (b) a **whole-string value guard** — `assertVisible: "<exact intended value>"` *before* the save (whole-string, so "…clinicD" fails the guard); (c) wrap clear→type→guard in a **`retry:`** block so the race converges. Never save an unguarded edited field — especially into **global/shared state** (a stray char there corrupts every screen).

## 4. SERVER-CONFIRM every mutation — the anti-false-green rule

This is the rule that most often separates a trustworthy flow from a decorative one.

- **A row appearing or vanishing may be OPTIMISTIC** — the screen mutating local state before/without the server confirming. `assertVisible`/`notVisible` on that row then proves **nothing** about the backend. A server that 500s can leave the exact same on-screen result.
- **Assert the success/error TOAST.** Mutation hooks fire `toast.success(...)` only in `onSuccess` (a real 2xx) and `toast.error(...)` in `onError`. That toast is the **authoritative server signal** — assert it. A rejected write then fails the flow instead of passing silently.
- **Probe the real endpoint to learn the exact message and route.** curl create/update/delete once to capture the true success string (it may be the server's `message`, not the app's fallback) and to confirm the endpoint — **watch for multiple HTTP clients with different base URLs** (an "admin"/"tenant" instance may drop a path segment the main client has; hitting the wrong base returns a misleading 404).
- **Toasts are transient (~seconds).** Assert the toast **first** (with a wait), *before* the slower list-refetch/empty-state — or it fades before you look.
- **For updates, assert the CHANGED VALUE, not just row presence.** Re-checking the row's *name* after an edit that changed its *price* is a false-green — a no-op or failed update passes identically. Assert the new value (`"₹150.00"`) that the card re-renders from the server refetch.
- **Distinguish server-refetch state from optimistic state.** Row from `invalidate + refetch()` after success = server-confirmed. Row from `setState(prev => prev.filter(...))` = optimistic; needs the toast to be trustworthy. Verify create/update/delete *each* — they often differ within one screen.

> Rule of thumb: for a mutation, name the exact server evidence you're asserting. If the answer is "the row disappeared," you're not done.

## 5. Fixtures & data discipline

- **Seed deterministic fixtures via the API as a pre-req.** Some flows can't assert without a known-shaped record: duplicate-detection may need a match on a specific field (e.g. DOB), a delete flow needs a target to delete. Create it via API before the run (pass identity in via `-e ENV`), rather than depending on fragile UI-driven setup or another flow's output.
- **Cross-flow data coupling breaks standalone runs.** If flow B deletes what flow A created via a shared run-id, B fails run alone. Either seed B's fixture independently, or document the dependency and the standalone seed command in the flow header.
- **Self-clean mutations or use unique ids.** A create→edit→delete lifecycle that deletes its own record is re-runnable; otherwise stamp records with a unique run-id so re-runs don't collide, and clean up orphans.
- **Prefer read-only flows where the scenario allows** — zero mutation, infinitely re-runnable. Don't invent a mutation the screen doesn't actually support (verify the real user path exists before scripting it — e.g. "pay from history" may simply not be a code path).
- **Mutating GLOBAL/shared state (branding, clinic config, settings): capture the real value first, and verify the restore.** Read the current value via API *before* the run so the flow restores the **true** value (not a guessed one), and **re-query the backend after** to confirm the restore landed (a UI green does not prove global state is clean). Honor field validation on the restore value too (e.g. letters-only name).
- **Honor input constraints:** letters-only names, exact-match vs partial search, digit-length rules — read the validation schema so seeded data actually matches.

## 6. Stability, sessions, and the environment

- **Robust role/shell entry:** settle on an anchor that is present in the target shell **and absent on the login/splash screen** (a landmark that also matches login text will "settle" then fail confusingly). Only perform a role/nav switch when the target shell isn't already showing.
- **Generous first-assertion timeouts.** The first post-launch wait must exceed the app's own boot/token/bundle timeout, or a slow cold boot dies mid-validation and looks like a flow bug.
- **Never wipe secure storage** (`clearState` / clearing Keychain-MMKV) if the app seeds its session from it — the auth gate will hang. 
- **Emulators degrade under sustained driving** — cold-restart the app (and periodically the emulator/driver) between long runs; treat a startup-timeout as an environment fault, not a flow fault (fix the environment, don't edit the flow).
- **Classify failures before retrying** (environment vs deterministic-code vs flaky). Re-running an unchanged command with no new information is the forbidden anti-pattern.

## 7. Loop discipline — bounded attempts

- **Diagnose → change hypothesis → retry.** Every retry must carry a *new* hypothesis backed by a diagnostic (a hierarchy dump, a screenshot, an API probe). 
- **Two-strikes rule:** if the same flow fails **twice** on the same signature without real progress, **stop** — record the exact failing step + verbatim error + what was ruled out, then **skip to the next flow**. Do not grind the iteration cap on one flow. A skipped-with-evidence flow is a clean backlog item; a blindly-looped one burns the budget and the context window.

## Author's checklist (per flow)

- [ ] Every anchor read from real source; default screen state confirmed.
- [ ] Fixtures exist (seeded via API if needed); standalone-runnable or dependency documented.
- [ ] Steppers advanced via CTA; below-fold inputs scrolled into view; keyboard handled.
- [ ] **Every mutation asserts a server-confirmation toast (success message probed from the real API); updates assert the changed value; deletes assert the success toast, not just a vanished row.**
- [ ] No false-green: re-read each assertion and ask "would this still pass if the feature were broken?"
- [ ] Verbose run output bounded to a log (see `output-bounding`); report the failing step as `what · why · how-to-fix`.
