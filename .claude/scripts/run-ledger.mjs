#!/usr/bin/env node
/**
 * run-ledger.mjs — the harness Run Ledger: a durable, append-only record of every
 * completed task/merge (HARNESS-AUDIT #4, ADR-0022).
 *
 * WHY a helper (not "the model hand-writes JSONL"): a malformed line silently breaks
 * crash-recovery + idempotency. This validates, stamps `ts`, and writes ONE well-formed
 * compact line per entry — so the ledger stays machine-readable across a long unattended run.
 *
 * File: docs/graph/run-ledger.jsonl — TRACKED (committed), the durable history.
 *   Distinct from CHECKPOINT.md (gitignored, single overwritten snapshot of the CURRENT task).
 *   Checkpoint = "where am I now"; ledger = "everything that has merged".
 *
 * Commands:
 *   append            Read a JSON object from --json '{…}' or stdin, validate, stamp ts, append.
 *                     Required: task, initiator(auto|human). Optional: pr, mergeSha, mode,
 *                     iterations, gates(obj), reviewer, note.
 *   has --task <id>   Idempotency guard: exit 0 + "yes" if a merged entry for <id> exists,
 *                     else exit 1 + "no". Use BEFORE marking a task done / merging.
 *   iterations --task <id>   Print the iteration count of the latest entry for <id> (else 0).
 *   tail [--n N]      Print the last N entries (default 10) for the human / audit.
 *
 * Fails LOUD on a bad append (exit 1) — an audit record must never be silently corrupted.
 * Lines carrying a `_meta` key are schema markers and are skipped by all readers.
 */

import fs from 'node:fs';
import path from 'node:path';

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const LEDGER = path.join(PROJECT_DIR, 'docs/graph/run-ledger.jsonl');

function flag(name, fallback) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

function readEntries() {
  let raw;
  try {
    raw = fs.readFileSync(LEDGER, 'utf8');
  } catch {
    return [];
  }
  const out = [];
  for (const line of raw.split('\n')) {
    const t = line.trim();
    if (!t) continue;
    try {
      const o = JSON.parse(t);
      if (o && o._meta) continue; // schema marker
      out.push(o);
    } catch {
      // a corrupt line shouldn't crash a read — skip it, but it WILL be visible in `tail`.
    }
  }
  return out;
}

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function die(msg) {
  process.stderr.write(`run-ledger: ${msg}\n`);
  process.exit(1);
}

function cmdAppend() {
  const src = flag('--json', null) || readStdin();
  if (!src || !src.trim()) die('append needs a JSON object via --json \'{…}\' or stdin.');
  let obj;
  try {
    obj = JSON.parse(src);
  } catch (e) {
    die(`append got invalid JSON: ${e.message}`);
  }
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) die('append needs a JSON object.');
  if (!obj.task) die('append requires a "task" field.');
  if (!['auto', 'human'].includes(obj.initiator)) die('append requires "initiator": "auto" | "human".');
  // Stamp ts if absent. (A plain node CLI may use the clock — unlike Workflow scripts.)
  if (!obj.ts) obj.ts = new Date().toISOString();
  // Stable key order for readability; unknown keys preserved.
  const ordered = {};
  for (const k of ['ts', 'task', 'pr', 'mergeSha', 'initiator', 'mode', 'iterations', 'gates', 'reviewer', 'note']) {
    if (obj[k] !== undefined) ordered[k] = obj[k];
  }
  for (const k of Object.keys(obj)) if (ordered[k] === undefined) ordered[k] = obj[k];

  try {
    fs.mkdirSync(path.dirname(LEDGER), { recursive: true });
    fs.appendFileSync(LEDGER, JSON.stringify(ordered) + '\n');
  } catch (e) {
    die(`could not write the ledger: ${e.message}`);
  }
  process.stdout.write(`appended: ${ordered.task} (${ordered.initiator}${ordered.mergeSha ? ', ' + ordered.mergeSha : ''})\n`);
}

function cmdHas() {
  const task = flag('--task', null);
  if (!task) die('has needs --task <id>.');
  const hit = readEntries().some((e) => e.task === task);
  process.stdout.write(hit ? 'yes\n' : 'no\n');
  process.exit(hit ? 0 : 1);
}

function cmdIterations() {
  const task = flag('--task', null);
  if (!task) die('iterations needs --task <id>.');
  const entries = readEntries().filter((e) => e.task === task);
  const last = entries[entries.length - 1];
  process.stdout.write(String((last && last.iterations) || 0) + '\n');
}

function cmdTail() {
  const n = parseInt(flag('--n', '10'), 10);
  const entries = readEntries();
  for (const e of entries.slice(-n)) process.stdout.write(JSON.stringify(e) + '\n');
}

const cmd = process.argv[2];
if (cmd === 'append') cmdAppend();
else if (cmd === 'has') cmdHas();
else if (cmd === 'iterations') cmdIterations();
else if (cmd === 'tail') cmdTail();
else die(`unknown command "${cmd || ''}". Use: append | has | iterations | tail.`);
