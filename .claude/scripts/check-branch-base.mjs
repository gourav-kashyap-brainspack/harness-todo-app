#!/usr/bin/env node
/**
 * check-branch-base.mjs — branch-base staleness preflight (ADR-0033, #7).
 *
 * WHY: a feature/scope branch cut from a STALE base (not fresh `origin/development`)
 * causes painful detours — this session, the PROF planning branch was based on an
 * old `feat/ui-reskin` and needed a cherry-pick to land cleanly (~15m). This catches
 * that the moment a branch starts diverging, before work piles on top.
 *
 * WHAT: compares the current branch's merge-base with the integration branch against
 * the integration branch tip, and reports how many commits the base is BEHIND.
 *
 * Default is a WARN (exit 0) — a tripwire, not a blocker. Pass `--strict` to exit 2
 * when stale (for a hook/CI that wants to fail-closed).
 *
 * Usage:
 *   node .claude/scripts/check-branch-base.mjs [--base development] [--threshold 0]
 *                                              [--no-fetch] [--strict]
 */
import { execSync } from 'node:child_process';

function git(args, { allowFail = false } = {}) {
  try {
    return execSync(`git ${args}`, { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch (err) {
    if (allowFail) return '';
    throw err;
  }
}

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const hasFlag = (name) => process.argv.includes(`--${name}`);

const base = arg('base', 'development');
const threshold = Number(arg('threshold', '0'));
const strict = hasFlag('strict');
const remoteRef = `origin/${base}`;

const current = git('rev-parse --abbrev-ref HEAD', { allowFail: true });
if (!current || current === 'HEAD') {
  console.log('[branch-base] not on a named branch — skipping.');
  process.exit(0);
}
if (current === base) {
  console.log(`[branch-base] on ${base} itself — nothing to check.`);
  process.exit(0);
}

if (!hasFlag('no-fetch')) {
  // Best-effort refresh; tolerate offline / no remote.
  git(`fetch origin ${base} --quiet`, { allowFail: true });
}

const mergeBase = git(`merge-base HEAD ${remoteRef}`, { allowFail: true });
if (!mergeBase) {
  console.log(
    `[branch-base] could not resolve ${remoteRef} (no remote / not fetched) — skipping.`,
  );
  process.exit(0);
}

const behind = Number(
  git(`rev-list --count ${mergeBase}..${remoteRef}`, { allowFail: true }) || '0',
);

if (behind > threshold) {
  const msg = [
    `[branch-base] ⚠️  '${current}' is based ${behind} commit(s) BEHIND ${remoteRef}.`,
    `  A stale base risks merge conflicts / a cherry-pick detour at land time (ADR-0033).`,
    `  Fix before piling on work:  git fetch origin ${base} && git rebase ${remoteRef}`,
    `  (or, if nothing committed yet, recut: git checkout ${base} && git pull && git checkout -b <branch>)`,
  ].join('\n');
  console.warn(msg);
  process.exit(strict ? 2 : 0);
}

console.log(`[branch-base] ✅ '${current}' is current with ${remoteRef}.`);
process.exit(0);
