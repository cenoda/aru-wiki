// Minimal anonymous error-report receiver for behind Caddy (`reverse_proxy /api/report 127.0.0.1:8787`).
// Zero external dependencies. Never writes client IPs or headers to disk.
//
// Environment variables:
//   PORT         Listening port (default: 8787)
//   REPORT_FILE  JSONL output path (default: ./data/reports.jsonl)
//   WEBHOOK_URL  Optional webhook URL (Discord/Slack/custom) notified asynchronously
import { createHash, randomBytes } from 'node:crypto';
import { appendFile, mkdir } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const CATEGORIES = new Set(['order', 'spoiler', 'name', 'other']);
const CATEGORY_KO = {
  order: '순서 오류',
  spoiler: '스포일러(버전) 오류',
  name: '명칭 오류',
  other: '기타',
};
const MAX_BODY_BYTES = 4096;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_MAX_HITS = 10;

export function createReportHandler({
  reportFile = resolve(process.cwd(), process.env.REPORT_FILE ?? 'data/reports.jsonl'),
  webhookUrl = process.env.WEBHOOK_URL ?? '',
  rateMax = RATE_MAX_HITS,
  rateWindowMs = RATE_WINDOW_MS,
} = {}) {
  let saltDay = '';
  let dailySalt = '';
  const hits = new Map(); // ipHash -> number[] (timestamps)
  let dirReady = false;

  function anonIpHash(req) {
    const today = new Date().toISOString().slice(0, 10);
    if (today !== saltDay) {
      saltDay = today;
      dailySalt = randomBytes(16).toString('hex');
      hits.clear();
    }
    const xff = req.headers['x-forwarded-for'];
    const rawIp = (typeof xff === 'string' ? xff.split(',')[0] : '')?.trim()
      || req.socket?.remoteAddress
      || 'unknown';
    return createHash('sha256').update(`${rawIp}|${dailySalt}`).digest('hex').slice(0, 12);
  }

  function allowRate(ipHash, now = Date.now()) {
    const prev = (hits.get(ipHash) ?? []).filter((t) => now - t < rateWindowMs);
    if (prev.length >= rateMax) {
      hits.set(ipHash, prev);
      return false;
    }
    prev.push(now);
    hits.set(ipHash, prev);
    if (hits.size > 5000) {
      for (const [k, ts] of hits) {
        if (ts.every((t) => now - t >= rateWindowMs)) hits.delete(k);
      }
    }
    return true;
  }

  function validatePayload(body) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: 'invalid_json' };
    const nodeId = typeof body.nodeId === 'string' ? body.nodeId.trim() : '';
    const edgeId = typeof body.edgeId === 'string' ? body.edgeId.trim() : '';
    const version = typeof body.version === 'string' ? body.version.trim() : '';
    const category = typeof body.category === 'string' ? body.category.trim() : '';
    const comment = typeof body.comment === 'string' ? body.comment.replace(/\s+/g, ' ').trim() : '';

    if (!nodeId || nodeId.length > 120 || !/^[\w:.-]+$/.test(nodeId)) return { error: 'invalid_nodeId' };
    if (edgeId && (edgeId.length > 240 || !/^[\w:>.-]+$/.test(edgeId))) return { error: 'invalid_edgeId' };
    if (!version || version.length > 32) return { error: 'invalid_version' };
    if (!CATEGORIES.has(category)) return { error: 'invalid_category' };
    if ([...comment].length > 200) return { error: 'comment_too_long' };

    return {
      record: {
        ts: new Date().toISOString(),
        nodeId,
        ...(edgeId ? { edgeId } : {}),
        version,
        category,
        ...(comment ? { comment } : {}),
      },
    };
  }

  async function notifyWebhook(record) {
    if (!webhookUrl) return;
    const target = record.edgeId ? `${record.nodeId} (${record.edgeId})` : record.nodeId;
    const text = [
      `[aru.wiki 오류 제보] ${CATEGORY_KO[record.category] ?? record.category}`,
      `• 대상: \`${target}\` (버전: \`${record.version}\`)`,
      record.comment ? `• 내용: ${record.comment}` : '• 내용: (메모 없음)',
    ].join('\n');
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ content: text, text, report: record }),
      });
    } catch {
      // Webhook failures must never break or delay report saving.
    }
  }

  return async function handleRequest(req, res) {
    const send = (status, obj) => {
      res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(obj));
    };

    const url = new URL(req.url ?? '/', 'http://localhost');
    if (url.pathname !== '/api/report') return send(404, { ok: false, error: 'not_found' });
    if (req.method !== 'POST') return send(405, { ok: false, error: 'method_not_allowed' });

    const ipHash = anonIpHash(req);
    if (!allowRate(ipHash)) return send(429, { ok: false, error: 'rate_limited' });

    let raw = '';
    let bytes = 0;
    try {
      for await (const chunk of req) {
        bytes += chunk.length;
        if (bytes > MAX_BODY_BYTES) return send(413, { ok: false, error: 'payload_too_large' });
        raw += chunk.toString('utf8');
      }
    } catch {
      return send(400, { ok: false, error: 'read_error' });
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return send(400, { ok: false, error: 'invalid_json' });
    }

    const { error, record } = validatePayload(parsed);
    if (error) return send(400, { ok: false, error });

    try {
      if (!dirReady) {
        await mkdir(dirname(reportFile), { recursive: true });
        dirReady = true;
      }
      await appendFile(reportFile, `${JSON.stringify(record)}\n`, 'utf8');
    } catch {
      return send(500, { ok: false, error: 'write_failed' });
    }

    void notifyWebhook(record);
    return send(200, { ok: true });
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT ?? 8787);
  const reportFile = resolve(process.cwd(), process.env.REPORT_FILE ?? 'data/reports.jsonl');
  const server = createServer(createReportHandler({ reportFile }));
  server.listen(port, '127.0.0.1', () => {
    console.log(`report-server listening on http://127.0.0.1:${port}/api/report -> ${reportFile}`);
  });
}
