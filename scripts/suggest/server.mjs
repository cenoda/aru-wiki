// Receiver for reader suggestions: POST /api/suggest, served by scripts/report-server.mjs next to
// /api/report. No dependencies. Like the report receiver it never writes client IPs or headers to
// disk: the IP is only hashed with a salt that changes daily, in memory, to limit the rate.
// The queue is a JSONL file the operator reads with scripts/suggest/review.mjs; nothing in it is
// public until approved.
import { createHash, randomBytes } from 'node:crypto';
import { appendFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { validateSuggestion } from './shared.mjs';

const MAX_BODY_BYTES = 24 * 1024;

export function createSuggestHandler({
  file,
  webhookUrl = process.env.WEBHOOK_URL ?? '',
  rateMax = 5, // per address per hour
  rateWindowMs = 60 * 60 * 1000,
  dayMax = 200, // all addresses per day: one operator reads the queue
  now = () => Date.now(),
} = {}) {
  if (!file) throw new Error('createSuggestHandler: file is required');
  let saltDay = '';
  let salt = '';
  let dayCount = 0;
  const hits = new Map();
  let dirReady = false;

  const rollDay = () => {
    const today = new Date(now()).toISOString().slice(0, 10);
    if (today !== saltDay) { saltDay = today; salt = randomBytes(16).toString('hex'); hits.clear(); dayCount = 0; }
  };
  const ipHash = (req) => {
    const xff = req.headers['x-forwarded-for'];
    const ip = (typeof xff === 'string' ? xff.split(',')[0] : '')?.trim() || req.socket?.remoteAddress || 'unknown';
    return createHash('sha256').update(`${ip}|${salt}`).digest('hex').slice(0, 12);
  };
  const allow = (key) => {
    const t = now();
    const prev = (hits.get(key) ?? []).filter((x) => t - x < rateWindowMs);
    if (prev.length >= rateMax) { hits.set(key, prev); return false; }
    prev.push(t);
    hits.set(key, prev);
    return true;
  };
  const notify = async (rec) => {
    if (!webhookUrl) return;
    const KO = { edit: '문단 고치기', add: '문단 추가', page: '새 문서' };
    const text = `[aru.wiki 글 제안] ${KO[rec.kind]} · \`${rec.page}\` (${rec.v}) · ${[...rec.text].length}자 · ${rec.id}`;
    try {
      await fetch(webhookUrl, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ content: text, text }) });
    } catch { /* a failed notice must not fail the save */ }
  };

  return async function handleSuggest(req, res) {
    const send = (status, obj) => {
      res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
      res.end(JSON.stringify(obj));
    };
    if (req.method !== 'POST') return send(405, { ok: false, error: 'method_not_allowed' });
    rollDay();
    if (!allow(ipHash(req))) return send(429, { ok: false, error: 'rate_limited' });
    if (dayCount >= dayMax) return send(503, { ok: false, error: 'queue_full' });

    let raw = '';
    let bytes = 0;
    try {
      for await (const chunk of req) {
        bytes += chunk.length;
        if (bytes > MAX_BODY_BYTES) return send(413, { ok: false, error: 'payload_too_large' });
        raw += chunk.toString('utf8');
      }
    } catch { return send(400, { ok: false, error: 'read_error' }); }
    let parsed;
    try { parsed = JSON.parse(raw); } catch { return send(400, { ok: false, error: 'invalid_json' }); }

    const { error, record } = validateSuggestion(parsed);
    // a bot that filled the hidden field hears "ok" and nothing is saved
    if (error === 'bot') return send(200, { ok: true, id: randomBytes(6).toString('hex') });
    if (error) return send(400, { ok: false, error });

    const saved = { id: randomBytes(6).toString('hex'), ts: new Date(now()).toISOString(), ...record };
    try {
      if (!dirReady) { await mkdir(dirname(file), { recursive: true }); dirReady = true; }
      await appendFile(file, `${JSON.stringify(saved)}\n`, 'utf8');
    } catch { return send(500, { ok: false, error: 'write_failed' }); }
    dayCount += 1;
    void notify(saved);
    return send(200, { ok: true, id: saved.id });
  };
}
