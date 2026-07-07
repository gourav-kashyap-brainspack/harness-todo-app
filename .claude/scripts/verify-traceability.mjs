#!/usr/bin/env node
/**
 * verify-traceability.mjs — status-drift guard (ADR-0024, re-ported for the RN/npm harness, P1-12).
 *
 * The status of a task fans out across several files; one merge must be reflected in all of them and
 * reliably isn't (P0-5 found WP10 "merged" in the ledger but "planned" in modules.json/features.csv).
 * This checks the MACHINE-READABLE sources against each other (no fragile markdown parsing):
 *   - docs/graph/modules.json        (tasks[].id + status — the source of truth for status)
 *   - docs/graph/run-ledger.jsonl    (durable merge history — a task here has merged)
 *   - docs/requirements/features.csv (id,...,status — the requirements mirror)
 *
 * ERRORS (exit 1):
 *   A. a task with a run-ledger merge entry is NOT `done` in modules.json          (merged-but-not-done drift)
 *   B. a features.csv row whose id maps to a modules.json task has a mismatched status (done vs not-done)
 * WARNINGS (exit 0):
 *   C. a modules.json `done` task has no ledger entry   (fine for pre-harness adoptions)
 *   D. a features.csv id has no modules.json task        (e.g. a monolith row mid re-plan)
 *
 * Fail-soft: a missing/unreadable source is a warning, never a crash. Runs in seconds — CI-safe.
 */
import fs from "node:fs";
import path from "node:path";

// Resolve the repo root robustly: honor CLAUDE_PROJECT_DIR, else walk up from cwd
// looking for docs/graph/modules.json (so it works whether run from the repo root or the app dir).
function resolveRoot() {
  if (process.env.CLAUDE_PROJECT_DIR) return process.env.CLAUDE_PROJECT_DIR;
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    if (fs.existsSync(path.join(dir, "docs/graph/modules.json"))) return dir;
    const up = path.dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  return process.cwd();
}
const ROOT = resolveRoot();
const p = (rel) => path.join(ROOT, rel);
const errors = [];
const warnings = [];
const DONE = new Set(["done"]);

function readJSON(rel) {
  try { return JSON.parse(fs.readFileSync(p(rel), "utf8")); }
  catch (e) { warnings.push(`could not read ${rel} (${e.code || e.message}) — skipping its checks`); return null; }
}
function readLines(rel) {
  try { return fs.readFileSync(p(rel), "utf8").split("\n").filter((l) => l.trim()); }
  catch (e) { warnings.push(`could not read ${rel} (${e.code || e.message}) — skipping its checks`); return null; }
}
// minimal CSV line split honoring double-quoted fields
function csvSplit(line) {
  const out = []; let cur = ""; let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { if (q && line[i + 1] === '"') { cur += '"'; i++; } else q = !q; }
    else if (c === "," && !q) { out.push(cur); cur = ""; }
    else cur += c;
  }
  out.push(cur);
  return out;
}

const modules = readJSON("docs/graph/modules.json");
const taskStatus = new Map(); // id -> status
if (modules && Array.isArray(modules.tasks)) {
  for (const t of modules.tasks) if (t && t.id) taskStatus.set(t.id, String(t.status || "").toLowerCase());
} else if (modules) {
  warnings.push("modules.json has no tasks[] array — skipping task-status checks");
}

// E. specs resolve (ADR-0024 "C"): every task's modules.json `spec` pointer must exist on disk.
// This is the guard for nested spec layouts — a broken subdir path (e.g. docs/specs/M/sub/X.spec.md)
// is caught mechanically instead of surfacing only when a builder can't find the file.
if (modules && Array.isArray(modules.tasks)) {
  for (const t of modules.tasks) {
    if (!t || !t.id) continue;
    if (!t.spec) { warnings.push(`E: task "${t.id}" has no \`spec\` pointer in modules.json`); continue; }
    if (!fs.existsSync(p(t.spec))) errors.push(`E: task "${t.id}" spec pointer does not resolve: ${t.spec}`);
  }
}

// A. run-ledger merged → must be done in modules.json
const ledger = readLines("docs/graph/run-ledger.jsonl");
if (ledger) {
  for (const line of ledger) {
    let o; try { o = JSON.parse(line); } catch { continue; }
    const id = o.task;
    if (!id || !taskStatus.has(id)) continue; // non-task entries (e.g. coherence-fix) are fine
    if (!DONE.has(taskStatus.get(id)))
      errors.push(`A: task "${id}" is merged in run-ledger (pr=${o.pr ?? "?"}, sha=${(o.mergeSha || "").slice(0, 7)}) but modules.json status="${taskStatus.get(id)}" (expected "done")`);
  }
}

// B/D. features.csv statuses vs modules.json
const csv = readLines("docs/requirements/features.csv");
if (csv) {
  for (const line of csv) {
    const cols = csvSplit(line);
    if (cols.length < 2) continue;
    const id = cols[0].trim();
    if (!id || /^id$/i.test(id) || id.startsWith("#")) continue; // header/comment
    const status = cols[cols.length - 1].trim().toLowerCase();
    if (!/^(done|planned|ready|in-progress|blocked|review|escalated|gates-red)$/.test(status)) continue; // not a status row
    if (!taskStatus.has(id)) { warnings.push(`D: features.csv id "${id}" has no modules.json task (re-plan in flight?)`); continue; }
    const mj = taskStatus.get(id);
    if (DONE.has(mj) !== DONE.has(status))
      errors.push(`B: features.csv "${id}" status="${status}" disagrees with modules.json status="${mj}"`);
  }
}

// C. modules.json done but no ledger entry (informational)
if (modules && ledger) {
  const merged = new Set(ledger.map((l) => { try { return JSON.parse(l).task; } catch { return null; } }).filter(Boolean));
  for (const [id, st] of taskStatus) if (DONE.has(st) && !merged.has(id)) warnings.push(`C: "${id}" is done in modules.json but has no run-ledger entry (ok if pre-harness adoption)`);
}

for (const w of warnings) console.log(`⚠︎  ${w}`);
if (errors.length) {
  console.error(`\n✗ traceability: ${errors.length} status drift(s):`);
  for (const e of errors) console.error(`   ${e}`);
  console.error(`\nFix: reconcile the disagreeing file(s) with docs/graph/modules.json (the status source of truth).`);
  process.exit(1);
}
console.log(`✓ traceability OK — ${taskStatus.size} tasks; modules.json ⇔ run-ledger ⇔ features.csv consistent${warnings.length ? ` (${warnings.length} warning[s])` : ""}.`);
