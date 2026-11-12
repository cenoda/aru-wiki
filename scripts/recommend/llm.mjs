// One adapter for the headless LLM CLIs (design.md "실행 도구").
// Input goes in through stdin only and the tools get no file or shell access, so text
// inside wiki pages cannot make them act. Output is JSON matching `schema`.
import { spawn } from 'node:child_process';
import Anthropic from '@anthropic-ai/sdk';
import { existsSync, readFileSync } from 'node:fs';
import { appendFile, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const EXAONE_ENV = join(homedir(), '.config/aru/exaone.env');

// LLM_TIMEOUT_MIN raises it for long outputs (full articles)
const TIMEOUT_MS = Number(process.env.LLM_TIMEOUT_MIN ?? 6) * 60 * 1000;
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
  // Claude Code on the user's subscription, Sonnet (not 'sonnet' below, which falls back to the paid API)
  async 'claude-sonnet'(prompt, schema, cwd) {
    const out = await run('claude', ['-p', '--model', 'claude-sonnet-5-5', '--output-format', 'json', '--json-schema', JSON.stringify(schema),
      '--tools', '', '--strict-mcp-config', '--no-session-persistence', '--setting-sources', ''], prompt, cwd);
    const res = JSON.parse(out);
    if (res.is_error) throw new Error(`claude: ${res.result}`);
    return { data: res.structured_output ?? JSON.parse(res.result), cost: null,
      usage: { in: (res.usage?.input_tokens ?? 0) + (res.usage?.cache_read_input_tokens ?? 0) + (res.usage?.cache_creation_input_tokens ?? 0), out: res.usage?.output_tokens ?? null } };
  },
  async codex(prompt, schema, cwd) {
    const schemaFile = join(cwd, 'schema.json'), outFile = join(cwd, 'out.json');
    await writeFile(schemaFile, JSON.stringify(schema));
    await run('codex', ['exec', '--sandbox', 'read-only', '--skip-git-repo-check', '--ephemeral',
      '--output-schema', schemaFile, '-o', outFile, '-'], prompt, cwd);
    return { data: JSON.parse(await readFile(outFile, 'utf8')), cost: null };
  },
  // Codex at medium reasoning: checking sentences against given text needs less than the default high.
  async 'codex-medium'(prompt, schema, cwd) {
    const schemaFile = join(cwd, 'schema.json'), outFile = join(cwd, 'out.json');
    await writeFile(schemaFile, JSON.stringify(schema));
    await run('codex', ['exec', '-c', 'model_reasoning_effort="medium"', '--sandbox', 'read-only', '--skip-git-repo-check', '--ephemeral',
      '--output-schema', schemaFile, '-o', outFile, '-'], prompt, cwd);
    return { data: JSON.parse(await readFile(outFile, 'utf8')), cost: null };
  },
  // Ollama Cloud models through the local ollama daemon (signed in with `ollama signin`; no key here).
  // Ollama does not train on inputs (docs/rights-risk.md 2.4); Pro allows 3 requests at a time.
  'ds': (prompt, schema) => rateDs('deepseek-v4.1-flash', prompt, schema),
  'ds-pro': (prompt, schema) => rateDs('deepseek-v4-pro', prompt, schema),
  // GLM 5.3 (Zhipu) from the same provider and key, 4 slots (2026-11-12)
  glm: (prompt, schema) => rateDs('glm-5.3', prompt, schema),
  deepseek: (prompt, schema) => ollama('deepseek-v4.1-flash:cloud', prompt, schema),
  // Xiaomi MiMo on Ollama Cloud: cheaper than DeepSeek and another company, so it can check DeepSeek's writing
  mimo: (prompt, schema) => ollama('mimo-v2.6-flash:cloud', prompt, schema),
  // Moonshot Kimi on Ollama Cloud: the user's own tests rate it highest of the Ollama models (2026-11-12)
  kimi: (prompt, schema) => ollama('kimi-k2.7-code:cloud', prompt, schema),
  // Grok Build (xAI) headless, single turn, no tools and no web (docs/rights-risk.md 2.4: training opted out).
  grok: (prompt, schema, cwd) => grok('grok-4.7', 'low', prompt, schema, cwd),
  // Muse Code subscription models. Ember is cheap enough to run freely; Spark is the larger one.
  // Muse Wonder must never be used (terms of service for the user's region), so it is not offered.
  ember: (prompt, schema, cwd) => muse('muse-ember-1.0', prompt, schema, cwd),
  spark: (prompt, schema, cwd) => muse('muse-spark-1.3', prompt, schema, cwd),
  // Gemini through Antigravity (`agy`), in a terminal sandbox inside the empty scratch directory.
  // `-p` must carry the prompt attached (-p=...), or it takes the next flag as the prompt.
  flash: (prompt, schema, cwd) => agy(process.env.AGY_MODEL ?? 'gemini-3.8-flash-low', prompt, schema, cwd),
  // article writer (user, 2026-11-12: Gemini 3.8 Flash, thinking medium or lower)
  'flash-medium': (prompt, schema, cwd) => agy('gemini-3.8-flash-medium', prompt, schema, cwd),
  'agy-sonnet': (prompt, schema, cwd) => agy('claude-sonnet-5-5-medium', prompt, schema, cwd),
  // Claude Sonnet 5.5 on the API credit, at the same effort as the Antigravity model above.
  async 'sonnet-api'(prompt, schema) {
    if (sonnetSpent >= SONNET_BUDGET) throw new Error(`sonnet API budget of $${SONNET_BUDGET} reached`);
    // Server-side fallback (on by default for Sonnet 5.5): a decline in a category it covers is
    // re-run on Claude Sonnet 5 inside the same call. It does not cover every category.
    const res = await anthropic().beta.messages.stream({
      model: 'claude-sonnet-5-5',
      max_tokens: 32000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'medium', format: { type: 'json_schema', schema: apiSchema(schema) } },
      messages: [{ role: 'user', content: prompt }],
    }).finalMessage();
    const u = res.usage;
    const cost = (u.input_tokens * 2 + u.output_tokens * 10) / 1e6; // $2 / $10 per million tokens
    sonnetSpent += cost;
    if (res.stop_reason === 'refusal') throw new Error(`sonnet refused: ${res.stop_details?.category ?? 'unknown'}`);
    if (res.stop_reason === 'max_tokens') throw new Error('sonnet hit max_tokens');
    const text = res.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
    return { data: checkShape(JSON.parse(text), schema), cost };
  },
  // Antigravity's Sonnet while its allowance lasts, then the API for the rest of the run.
  async sonnet(prompt, schema, cwd) {
    if (!agyExhausted) {
      try {
        return await TOOLS['agy-sonnet'](prompt, schema, cwd);
      } catch (e) {
        if (!QUOTA.test(e.message)) throw e;
        agyExhausted = true;
        console.error(`agy allowance used up (${e.message.slice(0, 160)}); switching to the API`);
      }
    }
    return TOOLS['sonnet-api'](prompt, schema, cwd);
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
// DeepSeek V4.1 Flash from a private OpenAI-compatible provider (llm.rate-cloud.com; it does not
// train on prompts, per the user 2026-11-12). Key in ~/.config/aru/deepseek.env (DEEPSEEK_API_KEY),
// read here only, never printed. Thinking is on (user decision 2026-11-12); DS_THINKING=off is for tests only.
const DS_ENV = join(homedir(), '.config/aru/deepseek.env');
let dsKey;
// the provider does not force the schema: a reply with a missing or mistyped field is asked again once, naming the fault
async function rateDs(model, prompt, schema) {
  try { return await rateDsOnce(model, prompt, schema); } catch (e) {
    if (!/^reply field|JSON|Unexpected token|Unterminated/.test(e.message)) throw e;
    return rateDsOnce(model, `${prompt}\n\nYour previous reply was rejected (${e.message.slice(0, 120)}). Include every required field with the right type.`, schema);
  }
}
// With thinking on, the provider loses the first few tokens of the answer, sometimes whole sentences (seen
// 2026-11-12 in 4 of 25 replies): a throwaway first line takes the loss instead of the JSON.
const DS_IDLE_MS = Number(process.env.DS_IDLE_SEC ?? 120) * 1000;
const DS_PAD = process.env.DS_THINKING === 'off' ? '' : 'Begin the reply with this exact line: ----- ----- ----- ----- ----- ----- ----- -----\nThen, on the next line, ';
async function rateDsOnce(model, prompt, schema) {
  dsKey ??= (existsSync(DS_ENV) && readFileSync(DS_ENV, 'utf8').match(/^\s*DEEPSEEK_API_KEY\s*=\s*['"]?([^'"\s]+)/m))?.[1];
  if (!dsKey) throw new Error(`no DEEPSEEK_API_KEY in ${DS_ENV}`);
  const body = { model, stream: true, stream_options: { include_usage: true }, messages: [{ role: 'user', content:
    `${prompt}\n\n${DS_PAD}Reply with one JSON object only, no prose and no code fence, matching this JSON Schema:\n${JSON.stringify(schema)}` }],
    ...(process.env.DS_THINKING === 'off' ? JSON.parse(process.env.DS_THINKING_OFF ?? '{"thinking":{"type":"disabled"}}') : {}) };
  // A busy provider (429 slot_limit: calls cut off on our side may still hold a slot there; 503
  // reply_buffer_busy) and a reply broken off mid-stream are waited out and asked again.
  const sleep = (sec) => new Promise((res) => setTimeout(res, sec * 1000));
  for (const wait of [15, 30, 60, 120, null]) {
    const ctrl = new AbortController();
    // Pro thinks long (up to ~7 min a call seen): at least 15 min for it
    const timer = setTimeout(() => ctrl.abort(), model.includes('pro') ? Math.max(TIMEOUT_MS, 15 * 60 * 1000) : TIMEOUT_MS);
    // The provider sends a ": waiting for…" line every ~10 s, also while the model thinks (measured
    // 2026-11-12). Nothing for 2 minutes means the connection hung (seen: a call held over an hour):
    // cut it and ask again.
    let stalled = false, idle;
    const alive = () => { clearTimeout(idle); idle = setTimeout(() => { stalled = true; ctrl.abort(); }, DS_IDLE_MS); };
    alive();
    try {
      let r;
      try {
        r = await fetch('https://llm.rate-cloud.com/v1/chat/completions', { method: 'POST', signal: ctrl.signal,
          headers: { Authorization: `Bearer ${dsKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      } catch (e) { // network drop: retry like a server error
        if (wait === null || (ctrl.signal.aborted && !stalled)) throw new Error(`rate-ds fetch failed: ${stalled ? 'stalled' : e.cause?.code ?? e.message}`);
        await new Promise((res) => setTimeout(res, wait * 1000)); continue;
      }
      if (!r.ok) {
        const body = (await r.text()).slice(0, 300);
        if (wait !== null && (r.status >= 500 || r.status === 429)) { await sleep(wait); continue; }
        // a slot limit is the provider being busy, not a used-up allowance: 3 minutes aside (askAny), not 10
        throw new Error(r.status === 429 && /slot_limit/.test(body) ? `rate-ds provider busy (slot_limit): ${body}` : `rate-ds ${r.status}: ${body}`);
      }
      // streamed (SSE): headers come back at once, so a long thinking call does not hit fetch's 300 s header timeout
      let text = '', u = {}, buf = '';
      const firstEvents = [];
      const dec = new TextDecoder();
      for await (const chunk of r.body) {
        alive();
        buf += dec.decode(chunk, { stream: true });
        let i;
        while ((i = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
          if (!line.startsWith('data:')) continue;
          const d = line.slice(5).trim();
          if (d === '[DONE]') continue;
          const ev = JSON.parse(d);
          if (process.env.DS_DEBUG && firstEvents.length < 6) firstEvents.push(d.slice(0, 400));
          if (ev.error) throw Object.assign(new Error(`rate-ds stream broke off (server error): ${JSON.stringify(ev.error).slice(0, 300)}`), { again: true });
          text += ev.choices?.[0]?.delta?.content ?? '';
          if (ev.usage) u = ev.usage;
        }
      }
      // with thinking on the provider sometimes drops the answer's first token, the opening brace
      // ("lead": ... or lead": ... when the dropped token was '{"')
      if (/^\s*"[A-Za-z_]+"\s*:/.test(text)) text = `{${text}`;
      else if (/^\s*[A-Za-z_]+"\s*:/.test(text)) text = `{"${text.trimStart()}`;
      if (process.env.DS_DEBUG) await appendFile(process.env.DS_DEBUG, JSON.stringify({ at: new Date().toISOString(), firstEvents, text }) + '\n');
      return { data: checkShape(parseJsonReply(text), schema), cost: null,
        usage: { in: u.prompt_tokens ?? null, out: u.completion_tokens ?? null, reasoning: u.completion_tokens_details?.reasoning_tokens ?? null } };
    } catch (e) {
      // a reply broken off mid-stream (server error event, or the connection closed while reading)
      if (wait !== null && (e.again || stalled || /terminated|ECONNRESET|other side closed/i.test(e.message))) { await sleep(wait); continue; }
      if (stalled) throw new Error(`rate-ds stalled: no data for ${DS_IDLE_MS / 1000} s`);
      throw e;
    } finally { clearTimeout(timer); clearTimeout(idle); }
  }
}
// Ollama Cloud sometimes answers 500/502/503 for a moment: two more tries, 20 s and 60 s later
async function ollama(model, prompt, schema) {
  for (const wait of [20, 60, null]) {
    try { return await ollamaOnce(model, prompt, schema); } catch (e) {
      if (wait === null || !/^ollama 5\d\d/.test(e.message)) throw e;
      await new Promise((r) => setTimeout(r, wait * 1000));
    }
  }
}
async function ollamaOnce(model, prompt, schema) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch('http://127.0.0.1:11434/api/chat', { method: 'POST', signal: ctrl.signal,
      body: JSON.stringify({ model, stream: false, format: schema, messages: [{ role: 'user', content:
        `${prompt}\n\nReply with one JSON object only, no prose and no code fence, matching this JSON Schema:\n${JSON.stringify(schema)}` }] }) });
    if (!r.ok) throw new Error(`ollama ${r.status}: ${(await r.text()).slice(0, 300)}`);
    const res = await r.json();
    return { data: checkShape(parseJsonReply(res.message.content), schema), cost: null, usage: { in: res.prompt_eval_count ?? null, out: res.eval_count ?? null } };
  } finally { clearTimeout(timer); }
}
async function grok(model, effort, prompt, schema, cwd) {
  const promptFile = join(cwd, 'prompt.txt');
  await writeFile(promptFile, prompt);
  const out = await run('grok', ['--prompt-file', promptFile, '-m', model, '--output-format', 'json', '--json-schema', JSON.stringify(schema),
    '--disable-web-search', '--tools', '', '--reasoning-effort', effort, '--cwd', cwd], '', cwd);
  const res = JSON.parse(out.slice(out.indexOf('{')));
  if (res.is_error || !res.structuredOutput) throw new Error(`grok: ${String(res.result ?? res.error ?? out).slice(0, 300)}`);
  const u = res.usage ?? res.stats ?? {};
  return { data: checkShape(res.structuredOutput, schema), cost: null,
    usage: { in: u.input_tokens ?? u.prompt_tokens ?? null, out: u.output_tokens ?? u.completion_tokens ?? null, raw: res.usage ? undefined : Object.keys(res).join(',') } };
}
// Contributor mode is always off. A Muse Code subscription defaults to it (Meta trains on the
// prompts and files sent, ToS §3.3/§6.1) and the saved choice is per machine, so every run says
// so itself. Fandom's terms forbid using its content to train an AI system.
async function muse(model, prompt, schema, cwd) {
  if (/wonder/i.test(model)) throw new Error('Muse Wonder is not allowed');
  const schemaFile = join(cwd, 'schema.json'), promptFile = join(cwd, 'prompt.txt');
  await writeFile(schemaFile, JSON.stringify(schema));
  await writeFile(promptFile, prompt);
  const out = await run('muse', ['exec', '--contributor-mode', 'off', '--model', model, '--output-schema', schemaFile, '--prompt-file', promptFile,
    '--disable-shell', '--disable-write', '--disable-web-tools', '--disable-request-user-input',
    '--no-session-log', '--trust-workspace', '--json'], '', cwd);
  const end = out.split('\n').filter(Boolean).map((l) => JSON.parse(l)).find((e) => e.payload_type?.startsWith('run.terminal.'));
  if (!end || end.payload.terminal !== 'completed') throw new Error(`muse: ${end?.payload?.reason ?? 'no terminal event'}`);
  return { data: checkShape(parseJsonReply(end.payload.text), schema), cost: null };
}

// Gemini or Claude through Antigravity (`agy`), in a terminal sandbox inside the empty scratch
// directory. `-p` must carry the prompt attached (-p=...), or it takes the next flag as the prompt.
async function agy(model, prompt, schema, cwd) {
  const schemaFile = join(cwd, 'schema.json');
  await writeFile(schemaFile, JSON.stringify(schema));
  const out = await run('agy', ['--model', model, '--output-format', 'json', '--json-schema', schemaFile, '--sandbox', `-p=${prompt}`], '', cwd);
  let res;
  try { res = JSON.parse(out); } catch { throw new Error(`agy: unreadable output ${out.slice(0, 200)}`); }
  if (res.status !== 'SUCCESS') throw new Error(`agy: ${res.status} ${JSON.stringify(res.error ?? res.response ?? '').slice(0, 300)}`);
  return { data: checkShape(res.structured_output ?? parseJsonReply(res.response), schema), cost: null };
}
// how an exhausted Antigravity allowance shows up (also matched against exit-code errors from run())
const UNRELIABLE = /\b5\d\d\b|timed? ?out|abort|ECONNRESET|ECONNREFUSED|ETIMEDOUT|fetch failed|socket hang up|provider busy|broke off|terminated|stalled/i;
const QUOTA = /quota|exhaust|usage limit|rate.?limit|resource.?exhausted|429|credits?|allowance|limit reached/i;
let agyExhausted = false;
const SONNET_BUDGET = Number(process.env.SONNET_API_BUDGET ?? 30);
let sonnetSpent = 0;

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
    const ok = want === 'array' ? Array.isArray(v) : want === 'integer' ? Number.isInteger(v) : typeof v === want;
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

// ---------- several tools at once ----------
// Which company each tool's model comes from: a writer's text is checked by another company's model.
export const COMPANY = { ds: 'deepseek', 'ds-pro': 'deepseek', claude: 'anthropic', 'claude-sonnet': 'anthropic', 'sonnet-api': 'anthropic', haiku: 'anthropic', sonnet: 'anthropic', 'agy-sonnet': 'anthropic',
  codex: 'openai', 'codex-medium': 'openai', ember: 'meta', spark: 'meta', flash: 'google', 'flash-medium': 'google', grok: 'xai', exaone: 'lg', deepseek: 'deepseek', mimo: 'xiaomi', kimi: 'moonshot', glm: 'zhipu' };
const slots = new Map();
/** At most `limit` calls of one tool at a time (LLM_SLOTS="grok=6,flash-medium=4" overrides). */
function slotOf(tool) {
  if (!slots.has(tool)) {
    const env = Object.fromEntries((process.env.LLM_SLOTS ?? '').split(',').filter(Boolean).map((x) => x.split('=')));
    slots.set(tool, { limit: Number(env[tool] ?? (tool === 'deepseek' ? 3 : 4)), busy: 0, waiting: [] });
  }
  return slots.get(tool);
}
const busy = new Map(); // tool → time until which it is set aside after a quota error
/**
 * Ask whichever of `tools` has a free slot (in the order given: the first takes every call it has a slot for), skipping tools of the companies in
 * `avoid`. A tool that fails with a quota or rate error is set aside for 10 minutes and the call
 * moves to another. Returns { data, tool }.
 */
const USAGE_LOG = new URL('../../.cache/llm-usage.jsonl', import.meta.url).pathname;
export async function askAny(tools, prompt, schema, { avoid = [] } = {}) {
  const usable = tools.filter((t) => TOOLS[t] && !avoid.includes(COMPANY[t]));
  if (!usable.length) throw new Error(`no tool left in ${tools} (avoiding ${avoid})`);
  let lastErr;
  const started = Date.now();
  for (let attempt = 0; attempt < usable.length + 1; attempt++) {
    const open = usable.filter((t) => (busy.get(t) ?? 0) < Date.now());
    if (!open.length) {
      // every tool set aside at once (2026-11-12 night: the provider's models "temporarily blocked" and
      // Kimi at its session limit): wait for the first one back, up to an hour, instead of failing at once
      if (Date.now() - started > 60 * 60 * 1000) throw lastErr ?? new Error('every tool is set aside after quota errors');
      await new Promise((r) => setTimeout(r, Math.max(1000, Math.min(...usable.map((t) => busy.get(t) ?? 0)) - Date.now())));
      attempt--;
      continue;
    }
    const tool = await new Promise((resolve) => {
      let done = false;
      // queued on every open tool; once served it declines, so the next waiter gets the slot
      const tryTake = () => {
        if (done) return false;
        // tools in the order given: the first takes every call it has a slot for, so list tools with a usage
        // allowance first (use it up) and an unlimited provider last (it takes the rest)
        const free = open.map((t) => [t, slotOf(t)]).filter(([, s]) => s.busy < s.limit).sort((a, b) => open.indexOf(a[0]) - open.indexOf(b[0]));
        if (free.length) { free[0][1].busy++; done = true; resolve(free[0][0]); return true; }
        return false;
      };
      if (!tryTake()) for (const t of open) slotOf(t).waiting.push(tryTake);
    });
    try {
      const t0 = Date.now();
      const r = await ask(tool, prompt, schema);
      // one line per call, for token and speed figures (.cache/llm-usage.jsonl)
      appendFile(USAGE_LOG, `${JSON.stringify({ at: new Date().toISOString(), tool, ms: Date.now() - t0, prompt_chars: prompt.length,
        out_chars: JSON.stringify(r.data).length, ...(r.usage ?? {}) })}\n`).catch(() => {});
      return { ...r, tool };
    } catch (e) {
      lastErr = e;
      if (QUOTA.test(e.message)) { busy.set(tool, Date.now() + 10 * 60 * 1000); console.error(`${tool} set aside: ${e.message.slice(0, 120)}`); continue; }
      // the provider itself failing (server errors after its own retries, timeouts, network):
      // set it aside for 3 minutes and let the next tool in the list take the call
      if (UNRELIABLE.test(e.message) && usable.length > 1) { busy.set(tool, Date.now() + 3 * 60 * 1000); console.error(`${tool} failing, set aside 3 min: ${e.message.slice(0, 120)}`); continue; }
      throw e;
    } finally {
      const s = slotOf(tool);
      s.busy--;
      // wake waiters until one takes the slot (others stay queued on their other tools)
      while (s.waiting.length) { const w = s.waiting.shift(); if (w()) break; }
    }
  }
  throw lastErr;
}
