#!/usr/bin/env node
/**
 * agent-authz.mjs — per-agent action×resource authorization (PreToolUse hook).
 *
 * Reads the acting subagent identity (agent_type) from the PreToolUse payload and
 * checks the attempted write/mutation against .claude/hooks/agent-authz-policy.json.
 *
 *   mode: "warn"    → NEVER blocks. Logs every would-be violation to docs/graph/logs/authz.log.
 *                     Run a build or two here, read the log, tune the rules.
 *   mode: "enforce" → a matched deny exits 2 (PreToolUse block) + tells the model why.
 *
 * Fails OPEN by design (any internal error → allow): a flaky authz script must never
 * freeze a build. The threat model is accidental off-role drift, not a malicious agent.
 *
 * See harness.config.md → "Agent Authorization" and ADR-0020.
 */

import fs from "node:fs";
import path from "node:path";

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const POLICY_PATH = path.join(PROJECT_DIR, ".claude/hooks/agent-authz-policy.json");
const LOG_PATH = path.join(PROJECT_DIR, "docs/graph/logs/authz.log");

// --- write-tools: which tool + which field carries the target path -----------
const WRITE_TOOL_PATH_FIELDS = {
  Write: ["file_path"],
  Edit: ["file_path"],
  MultiEdit: ["file_path"],
  NotebookEdit: ["notebook_path"],
  mcp__filesystem__write_file: ["path"],
  mcp__filesystem__edit_file: ["path"],
  mcp__filesystem__move_file: ["destination", "source"],
  mcp__filesystem__create_directory: ["path"],
};

// --- mutating-shell tripwire (best-effort; tune in warn mode) -----------------
// Sanctioned write targets that must NEVER count as a mutation (the output-bounding
// skill REQUIRES reviewers to write logs here; a mkdir/redirect to these is legitimate).
const ALLOWED_WRITE_MARKER = "(?:docs/graph/logs|/scratchpad/|/tmp/|/dev/null)";
const BASH_MUTATION_PATTERNS = [
  /\bsed\b[^|]*\s-i\b/, // in-place sed
  /\btee\b(?![^\n|&;]*(?:docs\/graph\/logs|\/scratchpad\/|\/tmp\/))/,
  // redirect to a file — exempt redirects whose target (within this segment) is a sanctioned log/tmp/scratchpad path
  new RegExp(`(^|[^0-9&|>])>>?(?!\\s*/dev/null)(?![^\\n|&;]*${ALLOWED_WRITE_MARKER})`),
  /\brm\s+-/, /\bmv\s/, /\bcp\s/, /\btouch\s/,
  // mkdir — exempt when the target within this segment is a sanctioned path (e.g. `mkdir -p docs/graph/logs`)
  new RegExp(`\\bmkdir\\b(?![^\\n|&;]*${ALLOWED_WRITE_MARKER})`),
  /\bgit\s+(commit|add|merge(?!-base)|push|rebase|reset|checkout\s+--)\b/, // merge(?!-base): `git merge-base` is read-only
  /\b(pnpm|npm|yarn)\s+(add|install|i|remove|rm|uninstall)\b/,
];

function readStdin() {
  try {
    return fs.readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function globToRegExp(glob) {
  // minimal glob: ** = any chars, * = any chars except /, escape the rest.
  // Anchored with (?:^|/) rather than ^ so a deny glob (e.g. "docs/specs/**") also
  // matches when the write lands inside an external git worktree — the path then
  // relativizes to "../worktree-XX/docs/specs/..." (P1-9 worktree-bypass fix).
  let re = "";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === "*") {
      if (glob[i + 1] === "*") { re += ".*"; i++; }
      else re += "[^/]*";
    } else if ("\\^$.|?+()[]{}".includes(c)) {
      re += "\\" + c;
    } else {
      re += c;
    }
  }
  return new RegExp("(?:^|/)" + re + "$");
}

function toRepoRelative(p) {
  if (!p) return null;
  let rel = p;
  if (path.isAbsolute(p)) rel = path.relative(PROJECT_DIR, p);
  return rel.split(path.sep).join("/").replace(/^\.\//, "");
}

function log(line) {
  try {
    fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
    fs.appendFileSync(LOG_PATH, line + "\n");
  } catch {
    /* fail open: a missing log never blocks a tool call */
  }
}

function main() {
  const raw = readStdin();
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    process.exit(0); // can't parse → allow
  }

  const agent = payload.agent_type; // present ONLY inside a subagent context
  if (!agent) process.exit(0); // main-thread call → not governed here

  const toolName = payload.tool_name;
  const toolInput = payload.tool_input || {};

  let policy;
  try {
    policy = JSON.parse(fs.readFileSync(POLICY_PATH, "utf8"));
  } catch {
    process.exit(0); // no/broken policy → allow
  }

  const rules = (policy.rules || []).filter((r) => (r.agents || []).includes(agent));
  if (rules.length === 0) process.exit(0);

  const violations = [];

  // 1) write-tool path checks
  const pathFields = WRITE_TOOL_PATH_FIELDS[toolName];
  if (pathFields) {
    const targets = pathFields.map((f) => toRepoRelative(toolInput[f])).filter(Boolean);
    for (const rule of rules) {
      const denyGlobs = rule.deny?.writePaths || [];
      for (const target of targets) {
        for (const g of denyGlobs) {
          if (globToRegExp(g).test(target)) {
            violations.push({ rule, detail: `${toolName} → ${target} (matches deny "${g}")` });
          }
        }
      }
    }
  }

  // 2) mutating-shell tripwire
  if (toolName === "Bash" && typeof toolInput.command === "string") {
    for (const rule of rules) {
      if (rule.deny?.bashMutations) {
        const hit = BASH_MUTATION_PATTERNS.find((p) => p.test(toolInput.command));
        if (hit) {
          const cmd = toolInput.command.replace(/\s+/g, " ").slice(0, 200);
          violations.push({ rule, detail: `Bash mutation → "${cmd}" (matched ${hit})` });
        }
      }
    }
  }

  if (violations.length === 0) process.exit(0);

  const mode = policy.mode === "enforce" ? "enforce" : "warn";
  const ts = new Date().toISOString();
  for (const v of violations) {
    log(`${ts}\t${mode.toUpperCase()}\tagent=${agent}\trule=${v.rule.id}\t${v.detail}`);
  }

  if (mode === "warn") process.exit(0); // warn-only: log, never block

  // enforce: block the call and tell the model why
  const first = violations[0];
  process.stderr.write(
    `BLOCKED by agent authorization (rule "${first.rule.id}"): ${first.rule.reason}\n` +
      `Attempted: ${first.detail}\n` +
      `This agent (${agent}) is not permitted this action. Stay within your role; another agent owns this.\n`
  );
  process.exit(2);
}

try {
  main();
} catch {
  process.exit(0); // fail open
}
