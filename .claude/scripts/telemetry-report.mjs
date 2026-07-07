#!/usr/bin/env node
/**
 * telemetry-report.mjs — end-to-end harness accounting → a markdown dashboard (Phase P5).
 *
 * Reads what is already on disk (Claude Code transcripts + git) and renders
 * docs/graph/telemetry/REPORT.md + appends a trend row to summary.json.
 *
 *   Sources (verified schema):
 *     main transcript      ~/.claude/projects/<slug>/<session>.jsonl
 *     subagent transcripts ~/.claude/projects/<slug>/<session>/subagents/agent-*.jsonl
 *     each assistant line: { timestamp, gitBranch, message:{ model, usage:{ input_tokens,
 *       output_tokens, cache_read_input_tokens, cache_creation_input_tokens } } }
 *     git   — per task branch numstat (files / +lines / -lines)
 *     pricing.json — fallback $ table (ccusage is the authoritative anchor if present)
 *
 * Fail-soft everywhere: a missing/unreadable source degrades to a "partial" banner, never a crash.
 * No npm deps. Run: `node .claude/scripts/telemetry-report.mjs` (or `npm run harness:report`).
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execSync } from "node:child_process";

// ---------- resolve project root + transcript dir ----------
function sh(cmd) { try { return execSync(cmd, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim(); } catch { return ""; } }
function resolveRoot() {
  if (process.env.CLAUDE_PROJECT_DIR) return process.env.CLAUDE_PROJECT_DIR;
  const top = sh("git rev-parse --show-toplevel");
  if (top) return top;
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) { if (fs.existsSync(path.join(dir, "docs/graph"))) return dir; const up = path.dirname(dir); if (up === dir) break; dir = up; }
  return process.cwd();
}
const ROOT = resolveRoot();
// --dashboard (ADR-0038, HARNESS-AUDIT #19): write/overwrite the compact live DASHBOARD.md only —
// no REPORT.md, no summary.json trend append, no ccusage network call. Cheap enough to run at every
// CHECKPOINT safe moment. Full report stays the default (no flag) via /harness-report.
const DASHBOARD = process.argv.includes("--dashboard");
const SLUG = ROOT.replace(/[^a-zA-Z0-9]/g, "-");
const PROJ = path.join(os.homedir(), ".claude", "projects", SLUG);
const OUT_DIR = path.join(ROOT, "docs/graph/telemetry");
const partial = [];

// ---------- helpers ----------
const num = (x) => (typeof x === "number" && isFinite(x) ? x : 0);
function walk(dir, matchFn, acc = []) {
  let ents = [];
  try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return acc; }
  for (const e of ents) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, matchFn, acc);
    else if (matchFn(full)) acc.push(full);
  }
  return acc;
}
function* jsonl(file) {
  let raw = "";
  try { raw = fs.readFileSync(file, "utf8"); } catch { return; }
  for (const line of raw.split("\n")) { if (!line.trim()) continue; try { yield JSON.parse(line); } catch { /* skip */ } }
}
function fmtDur(sec) {
  sec = Math.round(num(sec)); const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  if (h) return `${h}h ${String(m).padStart(2, "0")}m`;
  if (m) return `${m}m ${String(s).padStart(2, "0")}s`;
  return `${s}s`;
}
function fmtTok(n) { n = num(n); if (n >= 1e6) return (n / 1e6).toFixed(2) + " M"; if (n >= 1e3) return (n / 1e3).toFixed(1) + "k"; return String(n); }
function bar(frac, width = 22) { const f = Math.max(0, Math.min(1, frac || 0)); const n = Math.round(f * width); return "█".repeat(n) + "░".repeat(width - n); }

// ---------- pricing ----------
let pricing = { rates: {}, _default: { input: 3, output: 15, cacheWrite: 3.75, cacheRead: 0.3 } };
try { pricing = JSON.parse(fs.readFileSync(path.join(OUT_DIR, "pricing.json"), "utf8")); } catch { partial.push("pricing.json missing — using built-in default rates"); }
function rateFor(model) {
  const rates = pricing.rates || {};
  for (const key of Object.keys(rates)) if ((model || "").startsWith(key)) return rates[key];
  return pricing._default || { input: 3, output: 15, cacheWrite: 3.75, cacheRead: 0.3 };
}
function costOf(u, model) {
  const r = rateFor(model);
  return (num(u.input) * r.input + num(u.output) * r.output + num(u.cacheCreate) * r.cacheWrite + num(u.cacheRead) * r.cacheRead) / 1e6;
}

// ---------- collect subagent transcripts (one file = one agent invocation) ----------
if (!fs.existsSync(PROJ)) partial.push(`transcript dir not found: ${PROJ} (run from the project so the slug matches)`);
const subFiles = walk(PROJ, (f) => /\/subagents\/agent-.*\.jsonl$/.test(f));
const mainFiles = (() => { try { return fs.readdirSync(PROJ).filter((f) => f.endsWith(".jsonl")).map((f) => path.join(PROJ, f)); } catch { return []; } })();

// agentId -> {subagent_type, branch} from Task/Agent tool_use blocks in the main transcripts
const agentMeta = new Map();
for (const mf of mainFiles) {
  for (const o of jsonl(mf)) {
    const c = o?.message?.content;
    if (!Array.isArray(c)) continue;
    for (const b of c) {
      if (b?.type === "tool_use" && (b.name === "Task" || b.name === "Agent")) {
        // the resulting agentId isn't in the tool_use; best-effort map by label/type + branch here,
        // and we key subagent files by their own type below. Store type by tool_use_id as a fallback.
        agentMeta.set(b.id, { type: b.input?.subagent_type || "agent", branch: o.gitBranch });
      }
    }
  }
}

function reduceUsage(file) {
  let inTok = 0, outTok = 0, cr = 0, cc = 0, model = null, turns = 0, firstCtx = null, t0 = null, t1 = null, tools = 0, type = null, branch = null;
  for (const o of jsonl(file)) {
    if (o.timestamp) { if (!t0) t0 = o.timestamp; t1 = o.timestamp; }
    if (o.gitBranch && !branch) branch = o.gitBranch;
    if (o.agent_type && !type) type = o.agent_type;
    const c = o?.message?.content;
    if (Array.isArray(c)) for (const b of c) if (b?.type === "tool_use") tools++;
    const u = o?.message?.usage;
    if (u) {
      turns++; model = o.message.model || model;
      const inn = num(u.input_tokens), out = num(u.output_tokens), r = num(u.cache_read_input_tokens), w = num(u.cache_creation_input_tokens);
      inTok += inn; outTok += out; cr += r; cc += w;
      if (firstCtx === null) firstCtx = inn + r + w;
    }
  }
  const wallSec = t0 && t1 ? (new Date(t1) - new Date(t0)) / 1000 : 0;
  return { u: { input: inTok, output: outTok, cacheRead: cr, cacheCreate: cc }, model, turns, firstCtx: firstCtx || 0, wallSec, tools, type, branch };
}

// ---------- per-agent + per-task rollups ----------
const agents = []; // {type, model, u, firstCtx, wallSec, tools, branch}
for (const f of subFiles) {
  const r = reduceUsage(f);
  const idMatch = f.match(/agent-([^/.]+)\.jsonl$/);
  const meta = idMatch && agentMeta.get(idMatch[1]);
  // agent_type isn't always on subagent transcript lines; fall back to the model tier
  // (reviewers→opus, builders→sonnet, cheap→haiku) so the breakdown is still meaningful.
  const tier = (r.model || "?").replace("claude-", "").split("-").slice(0, 2).join("-");
  r.type = r.type || meta?.type || `agent:${tier}`;
  r.branch = r.branch || meta?.branch || null;
  agents.push(r);
}
// main-thread orchestration cost (sum across main transcripts, attributed to "orchestrator/main")
let mainU = { input: 0, output: 0, cacheRead: 0, cacheCreate: 0 }, mainModel = null, mainTools = 0;
for (const mf of mainFiles) { const r = reduceUsage(mf); mainU.input += r.u.input; mainU.output += r.u.output; mainU.cacheRead += r.u.cacheRead; mainU.cacheCreate += r.u.cacheCreate; mainModel = r.model || mainModel; mainTools += r.tools; }

// aggregate per agent-type
const byAgent = new Map();
for (const a of agents) {
  const k = a.type;
  const cur = byAgent.get(k) || { type: k, invocations: 0, u: { input: 0, output: 0, cacheRead: 0, cacheCreate: 0 }, ctx: [], dur: 0, model: a.model };
  cur.invocations++; cur.u.input += a.u.input; cur.u.output += a.u.output; cur.u.cacheRead += a.u.cacheRead; cur.u.cacheCreate += a.u.cacheCreate;
  cur.ctx.push(a.firstCtx); cur.dur += a.wallSec; cur.model = a.model || cur.model;
  byAgent.set(k, cur);
}
// aggregate per task (git branch of the subagent), plus git numstat
const byTask = new Map();
for (const a of agents) {
  const k = a.branch && /feat\//.test(a.branch) ? a.branch : (a.branch || "(unattributed)");
  const cur = byTask.get(k) || { task: k, agents: 0, u: { input: 0, output: 0, cacheRead: 0, cacheCreate: 0 }, dur: 0, ctx: [], cost: 0 };
  cur.agents++; cur.u.input += a.u.input; cur.u.output += a.u.output; cur.u.cacheRead += a.u.cacheRead; cur.u.cacheCreate += a.u.cacheCreate; cur.dur += a.wallSec; cur.ctx.push(a.firstCtx); cur.cost += costOf(a.u, a.model);
  byTask.set(k, cur);
}
function gitStat(branch) {
  if (!branch || !/feat\//.test(branch)) return null;
  const out = sh(`git -C "${ROOT}" diff --numstat origin/development...${branch} 2>/dev/null`);
  if (!out) return null;
  let files = 0, add = 0, del = 0, tadd = 0;
  for (const line of out.split("\n")) { const m = line.split("\t"); if (m.length < 3) continue; files++; add += num(+m[0]); del += num(+m[1]); if (/\.test\.|__tests__|\.spec\./.test(m[2])) tadd += num(+m[0]); }
  return { files, add, del, tadd };
}

// ---------- totals ----------
const allU = { input: 0, output: 0, cacheRead: 0, cacheCreate: 0 };
for (const a of agents) { allU.input += a.u.input; allU.output += a.u.output; allU.cacheRead += a.u.cacheRead; allU.cacheCreate += a.u.cacheCreate; }
allU.input += mainU.input; allU.output += mainU.output; allU.cacheRead += mainU.cacheRead; allU.cacheCreate += mainU.cacheCreate;
const billable = allU.input + allU.cacheCreate + 0.1 * allU.cacheRead;
const cacheHit = (allU.cacheRead + allU.input + allU.cacheCreate) > 0 ? allU.cacheRead / (allU.cacheRead + allU.input + allU.cacheCreate) : 0;
let totalCost = mainU ? costOf(mainU, mainModel) : 0;
for (const a of agents) totalCost += costOf(a.u, a.model);
const totalWall = agents.reduce((s, a) => s + a.wallSec, 0);

// ccusage anchor (fail-soft; skipped in --dashboard mode — no network call on the hot path)
let ccAnchor = null;
if (!DASHBOARD) {
  try { const j = JSON.parse(sh("npx -y ccusage@latest --json 2>/dev/null") || "null"); if (j) { const c = JSON.stringify(j).match(/"totalCost"\s*:\s*([0-9.]+)/); if (c) ccAnchor = parseFloat(c[1]); } } catch { /* ignore */ }
  if (ccAnchor == null) partial.push("ccusage anchor unavailable (offline / not installed) — showing computed cost only");
}

// ---------- dashboard mode (overwrite one small file, then exit) ----------
if (DASHBOARD) {
  const branch = sh(`git -C "${ROOT}" branch --show-current`) || "(detached)";
  const cur = byTask.get(branch);
  // ETA line: carried by the orchestrator in CHECKPOINT.md (## ETA) — pass through verbatim, fail-soft
  let eta = null;
  try {
    const cp = fs.readFileSync(path.join(ROOT, "docs/graph/CHECKPOINT.md"), "utf8");
    const m = cp.match(/^ETA:.*$|^## ETA\s*\n[-\s]*(.+)$/m);
    if (m) eta = (m[1] || m[0]).trim();
  } catch { /* no checkpoint — fine */ }
  // last-5 merged tasks from the run ledger (fail-soft)
  const ledger = [];
  try {
    const raw = fs.readFileSync(path.join(ROOT, "docs/graph/run-ledger.jsonl"), "utf8");
    for (const line of raw.split("\n")) { if (!line.trim()) continue; try { ledger.push(JSON.parse(line)); } catch { /* skip */ } }
  } catch { partial.push("run-ledger.jsonl unreadable"); }
  const last5 = ledger.filter((e) => e.task).slice(-5).reverse();

  const D = [];
  D.push(`# ⚡ Harness Dashboard — ${path.basename(ROOT)}`);
  D.push(`\`${process.env.TELEMETRY_TS || "ts: pass TELEMETRY_TS"}\` · overwritten at CHECKPOINT safe moments · full report: \`/harness-report\``);
  D.push("");
  D.push(`**Totals:** ${fmtTok(billable)} billable · $${totalCost.toFixed(2)} est · ${agents.length} agent runs · ${fmtDur(totalWall)} agent wall-time · cache-hit ${(cacheHit * 100).toFixed(0)}%`);
  if (eta) D.push(`\n**${eta.startsWith("ETA") ? eta : "ETA: " + eta}**`);
  D.push("");
  D.push(`## Current branch — \`${branch}\``);
  if (cur) {
    const b = cur.u.input + cur.u.cacheCreate + 0.1 * cur.u.cacheRead;
    D.push(`${cur.agents} agent runs · ${fmtTok(b)} billable · $${num(cur.cost).toFixed(2)} · ${fmtDur(cur.dur)}`);
  } else D.push("_no subagent activity attributed to this branch yet_");
  D.push("");
  D.push("## Per agent (top 5 by spend)");
  D.push("| Agent | Runs | Billable | Avg dur |");
  D.push("|---|---:|---:|---:|");
  const top = [...byAgent.values()].map((a) => ({ ...a, bill: a.u.input + a.u.cacheCreate + 0.1 * a.u.cacheRead })).sort((a, b) => b.bill - a.bill).slice(0, 5);
  for (const a of top) D.push(`| ${a.type} | ${a.invocations} | ${fmtTok(a.bill)} | ${fmtDur(a.dur / Math.max(1, a.invocations))} |`);
  D.push("");
  D.push("## Last 5 merged tasks (run ledger)");
  D.push("| Task | PR | Iterations | Initiator | Merged |");
  D.push("|---|---:|---:|---|---|");
  for (const e of last5) D.push(`| ${e.task} | ${e.pr ?? "—"} | ${e.iterations ?? "—"} | ${e.initiator ?? "—"} | ${e.ts ?? "—"} |`);
  if (!last5.length) D.push("| _none recorded_ | | | | |");
  D.push("");
  D.push(`_partial-data: ${partial.length ? partial.join(" · ") : "none"}._`);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, "DASHBOARD.md"), D.join("\n") + "\n");
  console.log(`✓ dashboard: ${fmtTok(billable)} billable · $${totalCost.toFixed(2)} · ${agents.length} agent runs → docs/graph/telemetry/DASHBOARD.md`);
  process.exit(0);
}

// ---------- render ----------
const now = process.env.TELEMETRY_TS || "(run date not captured — pass TELEMETRY_TS)";
const L = [];
L.push(`# 📊 Harness Telemetry — ${path.basename(ROOT)}`);
L.push(`\`generated ${now}\` · source: transcripts+git · slug: \`${SLUG}\`${ccAnchor != null ? ` · $ anchor: ccusage $${ccAnchor.toFixed(2)}` : ""}`);
L.push("");
L.push("## ⌂ Totals");
L.push("| 🎟️ Tokens (billable) | 💵 Est. cost | ⏱️ Agent wall-time | 🤖 Agent runs | 🧵 Main tools | ♻️ Cache-hit |");
L.push("|---:|---:|---:|---:|---:|---:|");
L.push(`| **${fmtTok(billable)}** | **$${totalCost.toFixed(2)}** | **${fmtDur(totalWall)}** | **${agents.length}** | **${mainTools}** | **${(cacheHit * 100).toFixed(0)}%** |`);
L.push("");
L.push(`> 🎟️ billable = input + cacheCreate + 0.1×cacheRead · raw cache-read (${fmtTok(allU.cacheRead)}) shown separately, never folded into the headline${ccAnchor != null ? ` · computed $ vs ccusage anchor Δ ${(Math.abs(totalCost - ccAnchor)).toFixed(2)}` : ""}`);
L.push("");

// per-task
L.push("## 🧩 Per spec task (by feature branch)");
L.push("| Task branch | Agents | Tokens (billable) | $ | Files | +/− Lines | Ctx-in avg/peak |");
L.push("|---|---:|---:|---:|---:|---:|---:|");
const taskRows = [...byTask.values()].sort((a, b) => (b.u.input + b.u.cacheCreate) - (a.u.input + a.u.cacheCreate));
for (const t of taskRows) {
  const b = t.u.input + t.u.cacheCreate + 0.1 * t.u.cacheRead;
  const gs = gitStat(t.task);
  const avg = t.ctx.length ? Math.round(t.ctx.reduce((s, x) => s + x, 0) / t.ctx.length) : 0;
  const peak = t.ctx.length ? Math.max(...t.ctx) : 0;
  L.push(`| ${t.task.replace(/^refs\/heads\//, "")} | ${t.agents} | ${fmtTok(b)} | $${num(t.cost).toFixed(2)} | ${gs ? gs.files : "—"} | ${gs ? `+${gs.add}/−${gs.del}` : "—"} | ${fmtTok(avg)}/${fmtTok(peak)} |`);
}
L.push("");

// per-agent
L.push("## 🤖 Per agent (rollup)");
L.push("| Agent | Runs | Tokens (billable) | % | Avg ctx-in | Avg dur | Model |");
L.push("|---|---:|---:|---:|---:|---:|---|");
const agentRows = [...byAgent.values()].map((a) => ({ ...a, bill: a.u.input + a.u.cacheCreate + 0.1 * a.u.cacheRead })).sort((a, b) => b.bill - a.bill);
const agentTot = agentRows.reduce((s, a) => s + a.bill, 0) || 1;
for (const a of agentRows) {
  const avg = a.ctx.length ? Math.round(a.ctx.reduce((s, x) => s + x, 0) / a.ctx.length) : 0;
  L.push(`| ${a.type} | ${a.invocations} | ${fmtTok(a.bill)} | ${((a.bill / agentTot) * 100).toFixed(0)}% | ${fmtTok(avg)} | ${fmtDur(a.dur / Math.max(1, a.invocations))} | ${(a.model || "").replace("claude-", "")} |`);
}
L.push("");
L.push("```");
for (const a of agentRows) L.push(`${a.type.padEnd(18)} ${bar(a.bill / agentTot)} ${((a.bill / agentTot) * 100).toFixed(0)}%`);
L.push("```");
L.push("");

// token split
L.push("## 🎟️ Token split");
L.push("```mermaid");
L.push("pie showData title Token mix (billable-weighted)");
L.push(`  "input" : ${Math.round(allU.input)}`);
L.push(`  "cacheCreate" : ${Math.round(allU.cacheCreate)}`);
L.push(`  "output" : ${Math.round(allU.output)}`);
L.push(`  "cacheRead (0.1x)" : ${Math.round(allU.cacheRead * 0.1)}`);
L.push("```");
L.push("");
L.push(`---`);
L.push(`_partial-data: ${partial.length ? partial.join(" · ") : "none — all sources read"}._`);
L.push(`_Cache-read (${fmtTok(allU.cacheRead)} raw) is excluded from the headline to avoid cross-turn double-count; cost weights it at 0.1×._`);

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, "REPORT.md"), L.join("\n") + "\n");

// summary.json trend append
const summaryPath = path.join(OUT_DIR, "summary.json");
let summary = [];
try { summary = JSON.parse(fs.readFileSync(summaryPath, "utf8")); if (!Array.isArray(summary)) summary = []; } catch { /* new */ }
summary.push({ ts: now, billableTokens: Math.round(billable), estCostUsd: +totalCost.toFixed(2), ccusageUsd: ccAnchor, agentRuns: agents.length, cacheHitPct: +(cacheHit * 100).toFixed(1) });
fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2) + "\n");

console.log(`✓ telemetry: ${agents.length} agent runs · ${fmtTok(billable)} billable tokens · $${totalCost.toFixed(2)}${ccAnchor != null ? ` (ccusage $${ccAnchor.toFixed(2)})` : ""} · cache-hit ${(cacheHit * 100).toFixed(0)}%`);
console.log(`  report: docs/graph/telemetry/REPORT.md${partial.length ? `  (partial: ${partial.length} note[s])` : ""}`);
