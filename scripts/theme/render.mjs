// Plain text of a lore page revision, in numbered paragraphs, for the version snapshots
// (design.md §5 2-3). The LLM writes from these paragraphs and quotes them; quotes are checked
// against the same text, so what the model reads and what the check reads are one string.
//
// - Templates are dropped except a few inline ones whose visible text belongs to the sentence
//   ({{w}}, {{tt}}, language tags, {{MC}}). Infoboxes, navboxes and {{Quote}} (game text) go.
// - <ref> footnotes are taken out of the sentence. The in-game sources they name
//   ({{Ref/Quest|…}}, {{Ref/Book|…}}, …) are kept per paragraph as `refs`.
// - Sections that are lists, gameplay or page upkeep are left out (SKIP_SECTIONS). Trivia is left
//   out too: it mixes real-world notes and speculation with the story.
import { decodeEntities } from '../fandom/wikitext.mjs';

export const SKIP_SECTIONS = new Set([
  'references', 'change history', 'other languages', 'navigation', 'gallery', 'gameplay info',
  'availability', 'video guides', 'soundtracks', 'character mentions', 'quests and events', 'quests',
  'drops', 'puzzles', 'media', 'trivia', 'notes', 'see also', 'areas and subareas', 'points of interest',
  'features', 'types', 'npcs', 'characters',
]);

const KEEP_FIRST = new Set(['tt', 'tooltip', 'rubi', 'ruby', 'lang', 'zh', 'ja', 'ko', 'ru', 'it', 'en', 'fr', 'de', 'es', 'quest', 'nihongo']);

/** Parameters of a template body (the text between {{ and }}, no nested braces left). */
function params(body) {
  const [name, ...rest] = body.split('|');
  const pos = [], named = {};
  for (const p of rest) {
    const m = p.match(/^\s*([\w ]+?)\s*=([\s\S]*)$/);
    if (m) named[m[1].toLowerCase()] = m[2].trim(); else pos.push(p.trim());
  }
  return { name: name.trim().replace(/_/g, ' '), pos, named };
}

function inlineTemplate(body) {
  const { name, pos } = params(body);
  const n = name.toLowerCase();
  if (n === 'mc' || n === 'traveler') return 'Traveler';
  if (n === '!') return '|';
  if (n === 'w' || n === 'wt' || n === 'wp') return pos[1] || pos[0] || '';
  if (n === 'color' || n === 'c') return pos[1] ?? pos[0] ?? '';
  if (KEEP_FIRST.has(n)) return pos[0] ?? '';
  return '';
}

/** In-game source named by a {{Ref/Type|Name|…}} body, or null. */
function refSource(body) {
  const { name, pos, named } = params(body);
  const m = name.match(/^Ref\/(\w+)$/i);
  if (!m) return null;
  const title = (named.title ?? pos[0] ?? '').replace(/\s+/g, ' ').trim();
  return title ? { type: m[1].toLowerCase(), name: title } : null;
}

/** Replace innermost {{…}} until none are left. */
function expandTemplates(s, fn) {
  let prev;
  do { prev = s; s = s.replace(/\{\{([^{}]*)\}\}/g, (_, body) => fn(body)); } while (s !== prev);
  return s.replace(/\{\{|\}\}/g, '');
}

function stripLinks(s) {
  // files and categories may hold links in their captions: drop them innermost first
  let prev;
  do {
    prev = s;
    s = s.replace(/\[\[\s*(?:File|Image|Category|[a-z]{2}(?:-[a-z]+)?)\s*:[^[\]]*\]\]/gi, '');
    s = s.replace(/\[\[([^[\]|]*)\|([^[\]]*)\]\]/g, '$2').replace(/\[\[([^[\]|]*)\]\]/g, (_, t) => t.replace(/#.*$/, ''));
  } while (s !== prev);
  return s.replace(/\[(?:https?:)?\/\/\S+\s([^\]]*)\]/g, '$1').replace(/\[(?:https?:)?\/\/\S+\]/g, '');
}

const MARK = '\u0001';

/**
 * { paragraphs: [{ id, section, text, refs: [{ type, name }] }] } for one page revision.
 * `prefix` keeps ids unique when several pages are given to one prompt (e.g. "A" → A1, A2, …).
 */
export function renderPage(content, { prefix = 'P' } = {}) {
  let s = content.replace(/<!--[\s\S]*?(?:-->|$)/g, '').replace(/\r/g, '');
  // footnotes → markers; named refs may be reused later as <ref name="x" />
  const refs = [], named = new Map();
  const addRef = (body, name) => {
    const found = [];
    expandTemplates(body, (b) => { const r = refSource(b); if (r) found.push(r); return ''; });
    refs.push(found);
    if (name) named.set(name, refs.length - 1);
    return `${MARK}${refs.length - 1}${MARK}`;
  };
  const refName = (attrs) => attrs.match(/name\s*=\s*"?([^"/>]+?)"?\s*(?:\/|$)/i)?.[1]?.trim();
  s = s.replace(/<ref([^>]*?)(?<!\/)>([\s\S]*?)<\/ref\s*>/gi, (_, attrs, body) => (/group\s*=/i.test(attrs) ? '' : addRef(body, refName(attrs))));
  s = s.replace(/<ref([^>]*?)\/>/gi, (_, attrs) => {
    const i = named.get(refName(attrs));
    return i == null ? '' : `${MARK}${i}${MARK}`;
  });
  s = s.replace(/<references[^>]*\/>|<references[^>]*>[\s\S]*?<\/references>/gi, '');
  s = s.replace(/<gallery[\s\S]*?<\/gallery>/gi, '');
  s = expandTemplates(s, inlineTemplate);
  s = stripLinks(s);
  s = decodeEntities(s.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '').replace(/'{2,}/g, ''));

  const paragraphs = [];
  let section = '', skip = false;
  const lines = s.split('\n');
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const h = line.match(/^(=+)\s*(.*?)\s*\1\s*$/);
    if (h) {
      const level = h[1].length, title = h[2].replace(new RegExp(`${MARK}\\d+${MARK}`, 'g'), '').trim();
      if (level <= 2) { section = title; skip = SKIP_SECTIONS.has(title.toLowerCase()); } else if (!skip) section = `${section.split(' > ')[0]} > ${title}`;
      continue;
    }
    if (skip) continue;
    // table rows become one line each, cells joined by " · "
    if (/^\s*\{\|/.test(line)) {
      const rows = [];
      let row = [];
      for (i++; i < lines.length && !/^\s*\|\}/.test(lines[i]); i++) {
        const l = lines[i].trim();
        if (/^\|-/.test(l)) { if (row.length) rows.push(row); row = []; continue; }
        if (/^\|\+/.test(l)) continue;
        if (/^[|!]/.test(l)) {
          for (let cell of l.slice(1).split(/\|\||!!/)) {
            const bar = cell.indexOf('|');
            if (bar >= 0 && /=/.test(cell.slice(0, bar))) cell = cell.slice(bar + 1);
            if (cell.trim()) row.push(cell.trim());
          }
        } else if (l && row.length) row[row.length - 1] += ` ${l}`;
      }
      if (row.length) rows.push(row);
      for (const r of rows) push(r.join(' · '));
      continue;
    }
    push(line.replace(/^[\s:;*#]+/, ''));
  }
  function push(raw) {
    const ids = [...raw.matchAll(new RegExp(`${MARK}(\\d+)${MARK}`, 'g'))].map((m) => Number(m[1]));
    const text = raw.replace(new RegExp(`${MARK}\\d+${MARK}`, 'g'), '').replace(/__[A-Z]+__/g, '').replace(/\s+/g, ' ').replace(/\s+([.,;:])/g, '$1').trim();
    if (text.length < 3 || !/[\p{L}]/u.test(text)) return;
    const seen = new Set();
    const pr = ids.flatMap((k) => refs[k] ?? []).filter((r) => { const key = `${r.type}|${r.name}`; if (seen.has(key)) return false; seen.add(key); return true; });
    paragraphs.push({ id: `${prefix}${paragraphs.length + 1}`, section, text, refs: pr });
  }
  return { paragraphs };
}

/** Sentences of a rendered page, for measuring how much text a newer revision adds. */
export function sentences(paragraphs) {
  return paragraphs.flatMap((p) => p.text.split(/(?<=[.!?])\s+/)).map((x) => x.trim()).filter((x) => x.length > 20);
}
