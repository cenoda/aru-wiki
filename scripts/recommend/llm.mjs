// One adapter for the headless LLM CLIs (design.md "실행 도구").
// Input goes in through stdin only and the tools get no file or shell access, so text
// inside wiki pages cannot make them act. Output is JSON matching `schema`.
import { spawn } from 'node:child_process';
import Anthropic from '@anthropic-ai/sdk';
import { existsSync, readFileSync } from 'node:fs';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const EXAONE_ENV = join(homedir(), '.config/aru/exaone.env');

const TIMEOUT_MS = 6 * 60 * 1000;
const run = (cmd, args, input, cwd, env = {}) => new Promise((resolve, reject) => {
  const p = spawn(cmd, args, { cwd, stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, ...env } });
  const timer = setTimeout(() => { p.kill('SIGKILL'); reject(new Error(`${cmd} timed out after ${TIMEOUT_MS / 1000}s`)); }, TIMEOUT_MS);
  p.on('close', () => clearTimeout(timer));
  if (process.env.LLM_DEBUG) p.stdout.on('data', (d) => process.stderr.write(d));
  let out = '', err = '';
  p.stdout.on('data', (d) => { out += d; });
  p.stderr.on('data', (d) => { err += d; });
  p.on('error', reject);
  p.on('close', (code) => (code === 0 ? resolve(out) : reject(new Error(`${cmd} exited ${code}: ${err.slice(-500)}`))));
  p.stdin.end(input);
});

const TOOLS = {
  async claude(prompt, schema, cwd) {
    const out = await run('claude', ['-p', '--output-format', 'json', '--json-schema', JSON.stringify(schema),
      '--tools', '', '--strict-mcp-config', '--no-session-persistence', '--setting-sources', ''], prompt, cwd);
    const res = JSON.parse(out);
    if (res.is_error) throw new Error(`claude: ${res.result}`);
    return { data: res.structured_output ?? JSON.parse(res.result), cost: res.total_cost_usd ?? null };
  },
  async codex(prompt, schema, cwd) {
    const schemaFile = join(cwd, 'schema.json'), outFile = join(cwd, 'out.json');
    await writeFile(schemaFile, JSON.stringify(schema));
    await run('codex', ['exec', '--sandbox', 'read-only', '--skip-git-repo-check', '--ephemeral',
      '--output-schema', schemaFile, '-o', outFile, '-'], prompt, cwd);
    return { data: JSON.parse(await readFile(outFile, 'utf8')), cost: null };
  },
  // Muse Code subscription models. Ember is cheap enough to run freely; Spark is the larger one.
  // Muse Wonder must never be used (terms of service for the user's region), so it is not offered.
  ember: (prompt, schema, cwd) => muse('muse-ember-1.0', prompt, schema, cwd),
  spark: (prompt, schema, cwd) => muse('muse-spark-1.3', prompt, schema, cwd),
  // Spark in contributor mode: same input price, half the output price. Ember costs 3x once a
  // request passes 200K input tokens; extraction pieces are about 15K tokens, well under that.
  'spark-contrib': (prompt, schema, cwd) => muse('muse-spark-1.3', prompt, schema, cwd, ['--contributor-mode', 'on']),
  // Gemini through Antigravity (`agy`), in a terminal sandbox inside the empty scratch directory.
  // `-p` must carry the prompt attached (-p=...), or it takes the next flag as the prompt.
  async flash(prompt, schema, cwd) {
    const schemaFile = join(cwd, 'schema.json');
    await writeFile(schemaFile, JSON.stringify(schema));
    const out = await run('agy', ['--model', process.env.AGY_MODEL ?? 'gemini-3.8-flash-low', '--output-format', 'json',
      '--json-schema', schemaFile, '--sandbox', `-p=${prompt}`], '', cwd);
    const res = JSON.parse(out);
    if (res.status !== 'SUCCESS') throw new Error(`agy: ${res.status} ${String(res.error ?? res.response ?? '').slice(0, 200)}`);
    return { data: checkShape(res.structured_output ?? parseJsonReply(res.response), schema), cost: null };
  },
  // Claude Haiku 5.5 through the API, billed to the prepaid API credit (not usable from Claude Code).
  // The key is read from ~/.config/aru/anthropic.env and handed to this client only: exported as
  // ANTHROPIC_API_KEY it would also switch Claude Code itself from the subscription to the API key.
  async haiku(prompt, schema) {
    // Higher effort thinks longer and thinking counts against max_tokens, so leave room and
    // stream (the SDK needs streaming for large max_tokens). Thinking is billed as output.
    const res = await anthropic().messages.stream({
      model: 'claude-haiku-5-5',
      max_tokens: 64000,
      output_config: { effort: process.env.HAIKU_EFFORT ?? 'low', format: { type: 'json_schema', schema: apiSchema(schema) } },
      messages: [{ role: 'user', content: prompt }],
    }).finalMessage();
    if (res.stop_reason === 'refusal') throw new Error(`haiku refused: ${res.stop_details?.category ?? 'unknown'}`);
    if (res.stop_reason === 'max_tokens') throw new Error('haiku hit max_tokens');
    const text = res.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
    const u = res.usage;
    // $0.10 / $0.50 per million tokens for prompts up to 100K tokens
    const cost = (u.input_tokens * 0.10 + u.output_tokens * 0.50) / 1e6;
    return { data: checkShape(JSON.parse(text), schema), cost };
  },
  // K-EXAONE through opencode. opencode has no schema option, so the schema goes into the prompt
  // and the reply is checked here. Every tool is switched off in the config.
  async exaone(prompt, schema, cwd) {
    const config = { tools: Object.fromEntries(OPENCODE_TOOLS.map((t) => [t, false])),
      permission: { edit: 'deny', bash: 'deny', webfetch: 'deny' } };
    const full = `${prompt}\n\nReply with one JSON object only, no prose and no code fence, matching this JSON Schema:\n${JSON.stringify(schema)}`;
    // one call in flight per key: each key allows one request per second and a call takes longer
    const slot = await exaoneSlots.acquire();
    let out;
    try {
      out = await run('opencode', ['run', '-m', `${slot}/k-exaone_v2.5`, '--format', 'json', '--archived', full], '', cwd,
        { OPENCODE_CONFIG_CONTENT: JSON.stringify(config), ...exaoneEnv });
    } finally { exaoneSlots.release(slot); }
    const events = out.split('\n').filter(Boolean).map((l) => JSON.parse(l));
    const err = events.find((e) => e.type === 'error');
    if (err) throw new Error(`exaone: ${JSON.stringify(err.error ?? err).slice(0, 300)}`);
    const text = events.filter((e) => e.type === 'text').map((e) => e.part.text).join('');
    return { data: checkShape(parseJsonReply(text), schema), cost: null };
  },
};
async function muse(model, prompt, schema, cwd, extra = []) {
  if (/wonder/i.test(model)) throw new Error('Muse Wonder is not allowed');
  const schemaFile = join(cwd, 'schema.json'), promptFile = join(cwd, 'prompt.txt');
  await writeFile(schemaFile, JSON.stringify(schema));
  await writeFile(promptFile, prompt);
  const out = await run('muse', ['exec', ...extra, '--model', model, '--output-schema', schemaFile, '--prompt-file', promptFile,
    '--disable-shell', '--disable-write', '--disable-web-tools', '--disable-request-user-input',
    '--no-session-log', '--trust-workspace', '--json'], '', cwd);
  const end = out.split('\n').filter(Boolean).map((l) => JSON.parse(l)).find((e) => e.payload_type?.startsWith('run.terminal.'));
  if (!end || end.payload.terminal !== 'completed') throw new Error(`muse: ${end?.payload?.reason ?? 'no terminal event'}`);
  return { data: checkShape(parseJsonReply(end.payload.text), schema), cost: null };
}

const ANTHROPIC_ENV = join(homedir(), '.config/aru/anthropic.env');
let anthropicClient;
function anthropic() {
  if (anthropicClient) return anthropicClient;
  const line = existsSync(ANTHROPIC_ENV) && readFileSync(ANTHROPIC_ENV, 'utf8').match(/^\s*ANTHROPIC_API_KEY\s*=\s*(\S+)/m);
  if (!line) throw new Error(`no ANTHROPIC_API_KEY in ${ANTHROPIC_ENV}`);
  anthropicClient = new Anthropic({ apiKey: line[1], maxRetries: 4 });
  return anthropicClient;
}
// Structured outputs accept a subset of JSON Schema; array length limits are left to the prompt.
function apiSchema(schema) {
  return JSON.parse(JSON.stringify(schema, (k, v) => (k === 'maxItems' || k === 'minItems' ? undefined : v)));
}

// Keys live in ~/.config/aru/exaone.env (EXAONE_API_KEY_1, _2, ...); opencode.json reads them as
// {env:EXAONE_API_KEY_n} in providers `exaone`, `exaone2`, ... Without the file, the single
// provider `exaone` is used with whatever opencode.json holds.
const exaoneEnv = Object.fromEntries((existsSync(EXAONE_ENV) ? readFileSync(EXAONE_ENV, 'utf8') : '')
  .split('\n').map((l) => l.match(/^\s*(EXAONE_API_KEY_\d+)\s*=\s*(\S+)/)).filter(Boolean).map((m) => [m[1], m[2]]));
const exaoneProviders = Object.keys(exaoneEnv).sort().map((k) => (k.endsWith('_1') ? 'exaone' : `exaone${k.split('_').pop()}`));
const exaoneSlots = pool(exaoneProviders.length ? exaoneProviders : ['exaone']);
export const exaoneKeys = () => Math.max(1, exaoneProviders.length);

function pool(items) {
  const free = [...items], waiting = [];
  return {
    acquire: () => (free.length ? Promise.resolve(free.shift()) : new Promise((r) => waiting.push(r))),
    release: (x) => { const next = waiting.shift(); if (next) next(x); else free.push(x); },
  };
}

const OPENCODE_TOOLS = ['bash', 'edit', 'write', 'read', 'grep', 'glob', 'list', 'webfetch', 'websearch', 'task', 'todowrite', 'patch', 'skill'];

// first balanced {...} in the reply (models sometimes add a fence or a sentence)
function parseJsonReply(text) {
  const start = text.indexOf('{');
  if (start < 0) throw new Error(`no JSON in reply: ${text.slice(0, 200)}`);
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') inStr = false; continue; }
    if (c === '"') inStr = true;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) return JSON.parse(text.slice(start, i + 1));
  }
  throw new Error(`unterminated JSON in reply: ${text.slice(0, 200)}`);
}

// required keys with the right basic types; enough for the two schemas used here
function checkShape(data, schema) {
  for (const k of schema.required ?? []) {
    const want = schema.properties[k].type, v = data[k];
    const ok = want === 'array' ? Array.isArray(v) : typeof v === want;
    if (!ok) throw new Error(`reply field ${k} is not ${want}: ${JSON.stringify(data).slice(0, 200)}`);
    const allowed = schema.properties[k].enum;
    if (allowed && !allowed.includes(v)) throw new Error(`reply field ${k}=${v} not in ${allowed}`);
  }
  return data;
}

export const toolNames = Object.keys(TOOLS);

export async function ask(tool, prompt, schema) {
  if (!TOOLS[tool]) throw new Error(`unknown tool ${tool}; have ${toolNames.join(', ')}`);
  // an empty scratch directory, so the CLI sees no project files
  const cwd = await mkdtemp(join(tmpdir(), 'aru-llm-'));
  try { return await TOOLS[tool](prompt, schema, cwd); } finally { await rm(cwd, { recursive: true, force: true }); }
}
