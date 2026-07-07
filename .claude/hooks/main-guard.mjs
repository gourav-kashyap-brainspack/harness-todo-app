#!/usr/bin/env node
/**
 * main-guard.mjs — authoritative PreToolUse guard for the protected `main` branch.
 *
 * The settings.json deny-list is brittle blocklist-matching: it guards command *text*,
 * so a new flag spelling / refspec form / compound command slips through (HARNESS-AUDIT #2 —
 * its headline deny even guarded a `gh pr merge --base` flag that does not exist). This hook is
 * the flag-position-INDEPENDENT layer: it parses each git/gh invocation, resolves the EFFECTIVE
 * target, and hard-fails anything that would push/merge/commit/PR-base to `main` (or a tag).
 *
 * Governs the MAIN THREAD *and* subagents (unlike agent-authz.mjs, which skips the main thread
 * and fails open). The harness runs unattended in auto-until-development mode — exactly when no
 * human is present to deny a prompt — so this guard is the load-bearing local control.
 *
 * FAIL-CLOSED on the risky surface: if a command IS a git/gh invocation we cannot prove safe
 * (parser error), we BLOCK. Non-git/gh commands (npm, ls, …) are never touched, so a bug here
 * can never freeze the whole shell — only the dangerous surface fails toward "blocked".
 *
 * Escape hatch (the "explicit human instruction" the policy allows): prefix the command with
 *   HARNESS_ALLOW_MAIN=1
 * e.g. `HARNESS_ALLOW_MAIN=1 git push origin main`. The human is then the one deciding.
 *
 * Known limits (defense-in-depth, not a sole control): command-substitution `$(…)`/`eval`, or a
 * `cd` into an unrelated repo before the git call, can evade branch resolution. The deny-list +
 * this hook + server-side branch protection are layers; none is a silver bullet. See ADR (main-guard).
 */

import fs from 'node:fs';
import path from 'node:path';

const OVERRIDE = 'HARNESS_ALLOW_MAIN=1';

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

/** Quote-aware split of a compound command into individual simple-command segments. */
function splitSegments(s) {
  const segs = [];
  let cur = '';
  let q = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    const n = s[i + 1];
    if (q) {
      cur += c;
      if (c === q) q = null;
      continue;
    }
    if (c === '"' || c === "'") {
      q = c;
      cur += c;
      continue;
    }
    if (c === '\n' || c === ';') {
      segs.push(cur);
      cur = '';
      continue;
    }
    if ((c === '&' && n === '&') || (c === '|' && n === '|')) {
      segs.push(cur);
      cur = '';
      i++;
      continue;
    }
    if (c === '|' || c === '&') {
      segs.push(cur);
      cur = '';
      continue;
    }
    cur += c;
  }
  if (cur) segs.push(cur);
  return segs;
}

/** Quote-stripping whitespace tokenizer. */
function tokenize(s) {
  const out = [];
  let cur = '';
  let q = null;
  let had = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) {
      if (c === q) q = null;
      else cur += c;
      had = true;
      continue;
    }
    if (c === '"' || c === "'") {
      q = c;
      had = true;
      continue;
    }
    if (/\s/.test(c)) {
      if (had) {
        out.push(cur);
        cur = '';
        had = false;
      }
      continue;
    }
    cur += c;
    had = true;
  }
  if (had) out.push(cur);
  return out;
}

const isTagRef = (r) => /^(\+)?refs\/tags\//.test(r);
/** A refspec's destination ref, normalized: strip a leading '+', take the part after ':'. */
function refDest(spec) {
  let s = spec.replace(/^\+/, '');
  const colon = s.lastIndexOf(':');
  if (colon >= 0) s = s.slice(colon + 1);
  return s;
}
const destIsMain = (dest) => dest === 'main' || dest === 'refs/heads/main' || dest === 'heads/main';

/** Best-effort current branch via .git/HEAD (handles worktrees) — no child process spawned. */
function currentBranch(projectDir) {
  try {
    let gitPath = path.join(projectDir, '.git');
    const st = fs.statSync(gitPath);
    if (st.isFile()) {
      const m = fs.readFileSync(gitPath, 'utf8').trim().match(/^gitdir:\s*(.+)$/);
      if (m) gitPath = path.isAbsolute(m[1]) ? m[1] : path.join(projectDir, m[1]);
    }
    const head = fs.readFileSync(path.join(gitPath, 'HEAD'), 'utf8').trim();
    const m = head.match(/^ref:\s*refs\/heads\/(.+)$/);
    return m ? m[1] : null; // detached HEAD → null (unknown)
  } catch {
    return null;
  }
}

/** Drop leading env assignments + wrappers so we land on the real `git`/`gh` token. */
function effectiveArgv(tokens) {
  let i = 0;
  const wrappers = new Set(['sudo', 'command', 'env', 'nice', 'time', 'nohup', 'xargs']);
  while (i < tokens.length && (/^[A-Za-z_][A-Za-z0-9_]*=/.test(tokens[i]) || wrappers.has(tokens[i]))) i++;
  return tokens.slice(i);
}

/** Skip git global options (`-C dir`, `-c k=v`, `--git-dir=…`) to reach the subcommand. */
function gitSubArgs(args) {
  let i = 0;
  while (i < args.length) {
    const a = args[i];
    if (a === '-C' || a === '-c' || a === '--namespace' || a === '--git-dir' || a === '--work-tree') {
      i += 2;
      continue;
    }
    if (a.startsWith('--git-dir=') || a.startsWith('--work-tree=') || a.startsWith('-c')) {
      i += 1;
      continue;
    }
    if (a.startsWith('-')) {
      i += 1;
      continue;
    }
    break;
  }
  return args.slice(i);
}

/** @returns {{block:boolean, reason?:string}} */
function classifyGit(rawArgs, projectDir) {
  const args = gitSubArgs(rawArgs);
  const sub = args[0];
  const rest = args.slice(1);

  if (sub === 'push') {
    const flags = rest.filter((a) => a.startsWith('-'));
    const positionals = rest.filter((a) => !a.startsWith('-'));
    if (flags.includes('--mirror'))
      return { block: true, reason: '`git push --mirror` pushes every ref, including main.' };
    if (flags.includes('--all'))
      return { block: true, reason: '`git push --all` pushes every local branch, including main.' };
    if (flags.includes('--tags'))
      return { block: true, reason: '`git push --tags` pushes protected tags.' };
    // positionals: [remote, ...refspecs]. With no refspec, push uses the current branch.
    const refspecs = positionals.slice(1);
    for (const spec of refspecs) {
      if (isTagRef(spec)) return { block: true, reason: `pushes a protected tag (\`${spec}\`).` };
      if (destIsMain(refDest(spec)))
        return { block: true, reason: `pushes to main (refspec \`${spec}\`).` };
    }
    if (refspecs.length === 0) {
      const br = currentBranch(projectDir);
      if (br === 'main') return { block: true, reason: 'pushes the current branch, which is `main`.' };
    }
    return { block: false };
  }

  // Operations that mutate the CURRENT branch — block only when that branch is main.
  if (['commit', 'merge', 'rebase', 'cherry-pick', 'revert', 'am'].includes(sub)) {
    const br = currentBranch(projectDir);
    if (br === 'main') return { block: true, reason: `\`git ${sub}\` would modify the checked-out \`main\` branch.` };
    return { block: false };
  }
  if (sub === 'reset' && rest.includes('--hard')) {
    const br = currentBranch(projectDir);
    if (br === 'main') return { block: true, reason: '`git reset --hard` would rewrite the checked-out `main` branch.' };
  }

  return { block: false };
}

/** @returns {{block:boolean, reason?:string}} */
function classifyGh(rawArgs) {
  // value of an option given as `--opt val` or `--opt=val` / `-X val`
  const valueOf = (names) => {
    for (let i = 0; i < rawArgs.length; i++) {
      const a = rawArgs[i];
      for (const nm of names) {
        if (a === nm) return rawArgs[i + 1];
        if (a.startsWith(nm + '=')) return a.slice(nm.length + 1);
      }
    }
    return undefined;
  };

  if (rawArgs[0] === 'pr' && rawArgs[1] === 'create') {
    const base = valueOf(['--base', '-B']);
    if (base && destIsMain(base))
      return { block: true, reason: 'opens a PR based on `main` (a main-based PR is what a later merge lands INTO main).' };
  }
  if (rawArgs[0] === 'pr' && rawArgs[1] === 'merge') {
    if (rawArgs.includes('--admin'))
      return { block: true, reason: '`gh pr merge --admin` bypasses branch protection.' };
  }
  // `gh pr edit <n> --base main` retargets an OPEN PR onto main; a later `gh pr merge`
  // never re-resolves the base, so it would slip through. Block the retarget itself. (P1-10)
  if (rawArgs[0] === 'pr' && rawArgs[1] === 'edit') {
    const base = valueOf(['--base', '-B']);
    if (base && destIsMain(base))
      return { block: true, reason: '`gh pr edit --base main` retargets an open PR onto main.' };
  }
  if (rawArgs[0] === 'api') {
    const method = (valueOf(['-X', '--method']) || 'GET').toUpperCase();
    const mutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
    // ref-path forms (refs/heads/main…) AND form-param forms (`-f base=main`, `-f branch=main`). (P1-10)
    const touchesMain = rawArgs.some(
      (a) =>
        a.includes('refs/heads/main') || a.includes('heads/main') || a.includes('branches/main') ||
        /^(base|branch|ref)=(main|refs\/heads\/main|heads\/main)$/.test(a)
    );
    if (mutating && touchesMain)
      return { block: true, reason: `\`gh api -X ${method}\` mutates or targets a main branch ref.` };
  }
  return { block: false };
}

function classifySegment(seg, projectDir) {
  const argv = effectiveArgv(tokenize(seg));
  if (argv.length === 0) return { block: false };
  if (argv[0] === 'git') return classifyGit(argv.slice(1), projectDir);
  if (argv[0] === 'gh') return classifyGh(argv.slice(1));
  return { block: false };
}

const looksLikeGitOrGh = (s) => /\b(git|gh)\b/.test(s);

function deny(reason, seg) {
  process.stderr.write(
    `🛑 BLOCKED by main-guard (HARNESS-AUDIT #2): this command targets the protected \`main\` branch.\n` +
      `Attempted: ${seg.trim()}\n` +
      `Reason: ${reason}\n` +
      '`main` is off-limits — no push/merge/commit/PR-base to main without an explicit human instruction (CLAUDE.md).\n' +
      `To override deliberately, prefix the command with ${OVERRIDE}.\n`
  );
  process.exit(2);
}

function main() {
  const raw = readStdin();
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    process.exit(0); // unparseable payload → not our risk surface
  }
  if (payload.tool_name !== 'Bash') process.exit(0);
  const command = (payload.tool_input && payload.tool_input.command) || '';
  if (!command) process.exit(0);

  // Explicit human override — ONLY when it's a leading env-assignment (command start or
  // right after a shell separator), not merely present anywhere (an echoed/quoted
  // occurrence must not disarm the guard for the whole command). (P1-10)
  const OVERRIDE_LEADING = new RegExp(`(?:^|[;&|(]\\s*)${OVERRIDE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\s|$)`);
  if (OVERRIDE_LEADING.test(command)) process.exit(0);

  const projectDir = payload.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd();

  try {
    for (const seg of splitSegments(command)) {
      const verdict = classifySegment(seg, projectDir);
      if (verdict.block) deny(verdict.reason, seg);
    }
  } catch {
    // Fail CLOSED, but only for the dangerous surface: a parser bug must not freeze all bash.
    if (looksLikeGitOrGh(command)) {
      deny('main-guard could not verify this git/gh command — failing closed.', command);
    }
  }
  process.exit(0);
}

main();
