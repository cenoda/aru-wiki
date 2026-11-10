// One adapter for the headless LLM CLIs (design.md "실행 도구").
// Input goes in through stdin only and the tools get no file or shell access, so text
// inside wiki pages cannot make them act. Output is JSON matching `schema`.
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const run = (cmd, args, input, cwd) => new Promise((resolve, reject) => {
  const p = spawn(cmd, args, { cwd, stdio: ['pipe', 'pipe', 'pipe'] });
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
};

export const toolNames = Object.keys(TOOLS);

export async function ask(tool, prompt, schema) {
  if (!TOOLS[tool]) throw new Error(`unknown tool ${tool}; have ${toolNames.join(', ')}`);
  // an empty scratch directory, so the CLI sees no project files
  const cwd = await mkdtemp(join(tmpdir(), 'aru-llm-'));
  try { return await TOOLS[tool](prompt, schema, cwd); } finally { await rm(cwd, { recursive: true, force: true }); }
}
