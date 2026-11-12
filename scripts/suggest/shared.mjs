// Reader suggestions (문단 고치기, 문단 추가, 새 문서 제안): the rules shared by the receiver
// (server.mjs) and the operator's review tool (review.mjs). Nothing here calls an LLM.
//
// A suggestion is never shown to other readers until the operator approves it (review.mjs writes
// data/manual/reader-edits.json, which ships with the next deploy). The writer sees their own
// suggestion at once, from their browser's storage (src/readerEdits.ts).

export const KINDS = new Set(['edit', 'add', 'page']);
export const LIMITS = { text: 1500, evidence: 300, nick: 20, page: 120, section: 120, orig: 6000 };

const clean = (v) => (typeof v === 'string' ? v.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '') : '');
const oneLine = (v) => clean(v).replace(/\s+/g, ' ').trim();
/** paragraphs kept (blank line between), spaces tidied */
export const tidyText = (v) => clean(v).split(/\n+/).map((p) => p.replace(/[ \t]+/g, ' ').trim()).filter(Boolean).join('\n\n');
const len = (s) => [...s].length;

/**
 * Checks what a browser sent. Returns { record } (without id and time) or { error }.
 * `agree` and `own` are the two boxes under the form: the CC BY-SA 4.0 licence and "I wrote this".
 */
export function validateSuggestion(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: 'invalid_json' };
  if (typeof body.website === 'string' && body.website) return { error: 'bot' }; // hidden field only bots fill
  const kind = typeof body.kind === 'string' ? body.kind : '';
  if (!KINDS.has(kind)) return { error: 'invalid_kind' };
  if (body.agree !== true || body.own !== true) return { error: 'not_agreed' };

  const page = oneLine(body.page);
  if (!page || len(page) > LIMITS.page || /[<>[\]{}|#]/.test(page)) return { error: 'invalid_page' };
  const v = oneLine(body.v);
  if (!v || v.length > 32) return { error: 'invalid_version' };
  const from = oneLine(body.from);
  if (from.length > 32) return { error: 'invalid_version' };
  const section = body.section === null || body.section === undefined ? null : oneLine(body.section);
  if (section !== null && len(section) > LIMITS.section) return { error: 'invalid_section' };

  const text = kind === 'edit' ? oneLine(body.text) : tidyText(body.text);
  if (len(text) < 2) return { error: 'text_too_short' };
  if (len(text) > LIMITS.text) return { error: 'text_too_long' };
  const orig = kind === 'edit' ? oneLine(body.orig) : '';
  if (kind === 'edit') {
    if (!orig || len(orig) > LIMITS.orig) return { error: 'invalid_orig' };
    if (orig === text) return { error: 'no_change' };
    if (!from) return { error: 'invalid_version' };
  }
  const evidence = oneLine(body.evidence);
  if (len(evidence) > LIMITS.evidence) return { error: 'evidence_too_long' };
  const nick = oneLine(body.nick);
  if (len(nick) > LIMITS.nick) return { error: 'nick_too_long' };

  const h = body.hint && typeof body.hint === 'object' ? body.hint : {};
  const hint = { paste: h.paste === true, ms: Number.isFinite(h.ms) ? Math.max(0, Math.min(86_400_000, Math.round(h.ms))) : 0 };

  return {
    record: {
      kind, page, v,
      ...(from ? { from } : {}),
      ...(kind !== 'page' ? { section } : {}),
      ...(kind === 'edit' ? { orig } : {}),
      text,
      ...(evidence ? { evidence } : {}),
      ...(nick ? { nick } : {}),
      hint,
    },
  };
}

// Marks left by pasting from namu.wiki (CC BY-NC-SA: its sentences cannot go into this CC BY-SA
// site) or from another wiki. A hint for the operator, not proof.
const NAMU = [
  [/\[\[[^\]]+\]\]/, '[[문서]] 링크 문법'],
  [/\[\*[^\]]*\]/, '[* 각주] 문법'],
  [/\{\{\{/, '{{{ }}} 문법'],
  [/\[(목차|각주|include|br|age|date|youtube)\b/i, '[목차]·[각주] 같은 매크로'],
  [/~~[^~]+~~|--[^-\s][^-]*--/, '취소선 문법'],
  [/'''[^']+'''/, "''' 굵게 문법"],
  [/(^|\n)\s*={2,}\s*[^=\n]+\s*={2,}/, '== 문단 제목 == 문법'],
  [/\[\d{1,3}\]/, '[1] 같은 각주 번호'],
  [/\[편집\]/, '[편집] 표시'],
];

/** Reasons to look twice before approving. An empty list is not a clearance. */
export function flagsOf(rec) {
  const out = [];
  const t = rec.text ?? '';
  for (const [re, label] of NAMU) if (re.test(t)) out.push(`복붙 흔적: ${label}`);
  if (/https?:\/\/|www\.\S/i.test(t)) out.push('본문에 주소가 있음');
  // typing Korean takes roughly 150 ms a character or more; far faster with a paste is a pasted text
  const n = len(t);
  if (rec.hint?.paste && n >= 200 && rec.hint.ms < n * 60) out.push(`붙여넣기: ${n}자를 ${Math.round((rec.hint.ms ?? 0) / 1000)}초에 냄`);
  else if (rec.hint?.paste && n >= 200) out.push('붙여넣기 있음');
  if (n >= 800) out.push(`긴 글(${n}자): 특이한 문장을 따옴표로 검색해 볼 것`);
  if (!rec.evidence) out.push('근거를 적지 않음');
  const latin = (t.match(/[A-Za-z]/g) ?? []).length;
  if (n >= 40 && latin / n > 0.5) out.push('영어가 절반 이상');
  if (/유출|리크|leak|데이터\s*마이닝|datamin|베타\s*(서버|테스트)/i.test(`${t} ${rec.evidence ?? ''}`)) out.push('유출·데이터마이닝을 말함');
  return out;
}

/** The same title whatever the spacing, underscores or letter case. */
export const titleKey = (s) => String(s).replace(/_/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
