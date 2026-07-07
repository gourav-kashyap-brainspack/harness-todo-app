# ADR 0023 — License-compliance gate (deny-by-default allowlist over the prod tree)

**Date:** 2026-06-23 · **Status:** accepted · **Context:** supply-chain completeness (HARNESS-AUDIT #14, the *license* axis — only this half of #14; the API-contract/breaking-change gate is deferred) · **Relates to:** the CI dependency-audit (vuln axis) + the dependency-maintenance skill

## Context
Every npm dependency (hundreds, transitively) carries a license. A stray **copyleft (GPL/AGPL)** or **unknown/UNLICENSED** transitive dep is a *legal* risk for a distributed product — and nothing checked it. The `pnpm audit` gate we added scans **vulnerabilities**, a different axis entirely. So license risk could ship silently.

## Decision
Add a **fail-closed, deny-by-default** license gate over the **production** dependency tree (dev deps don't ship): `scripts/check-licenses.mjs` (run via `pnpm licenses:check`), wired into `ci.yml` after the dependency audit. A dependency whose license is **not on the allowlist fails the PR** — so a future GPL/AGPL/unknown can't land without a deliberate, reviewed allowlist edit.

- **Allowlist grounded in the real tree** (so the gate is green on introduction, red only on a *new* license): the permissive set (MIT/ISC/BSD/Apache-2.0/0BSD/BlueOak/CC0/CC-BY-4.0/Unlicense/Python-2.0/…) **plus** the two **weak-copyleft** licenses already present — **LGPL-3.0-or-later** and **MPL-2.0**. Weak copyleft is acceptable for *unmodified library use* in a distributed app and is surfaced as a **NOTE** (visible, not failing) so the obligation stays on the radar.
- **SPDX-expression aware:** `(A OR B)` passes if any atom is allowed (we may pick the permissive branch); `A AND B` needs all allowed; `MIT (http://…)` normalizes to `MIT`. (The `MIT (url)` form is real — `slick@1.12.2` — and exposed a parser bug caught only by running against the actual tree.)
- **Scope = `--prod`** — the legally-relevant set that ships; dev tooling (eslint/vitest) is excluded.
- **To allow a new license:** add its SPDX id to `PERMISSIVE` or `WEAK_COPYLEFT` in the script — a deliberate, reviewed change, not a silent pass.

## Consequences
- A disallowed/unknown license now **fails CI on the PR that introduces it**, instead of shipping unnoticed.
- **Green today** (verified: 18 distinct licenses, all allowlisted; LGPL/MPL noted) — no false-positive break on introduction.
- **Honest limits:** an allowlist is only as good as its policy — weak-copyleft is *allowed*, which is a deliberate call (revisit if the product's distribution model changes, e.g. modifying an LGPL lib). Only the **license** half of audit #14 is done; the API-contract/breaking-change gate (the effort-L half) remains open.
- Files: `scripts/check-licenses.mjs`, `package.json` (`licenses:check`), `ci.yml` (License compliance step).

## Follow-ups
- Optionally add the same step to the scheduled `dependency-audit.yml` so a license that changes between versions (after a Dependabot bump) is caught out-of-band too.
