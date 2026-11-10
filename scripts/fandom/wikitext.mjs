// Minimal wikitext helpers for reading Fandom infobox templates.
// Handles nested {{templates}} and [[links]] inside parameter values.

/** Find the first `{{Name ...}}` call and return its raw inner text, or null. */
export function findTemplate(text, name) {
  const re = new RegExp(`\\{\\{\\s*${escapeRe(name).replace(/ /g, '[ _]')}\\s*(?=[|}\\n])`, 'i');
  const m = re.exec(text);
  if (!m) return null;
  let depth = 0;
  for (let i = m.index; i < text.length - 1; i++) {
    const two = text.slice(i, i + 2);
    if (two === '{{') { depth++; i++; continue; }
    if (two === '}}') {
      depth--; i++;
      if (depth === 0) return text.slice(m.index + 2, i - 1);
    }
  }
  return null;
}

/** Split a template's inner text on top-level `|` into { name, positional[], named{} }. */
export function parseTemplate(inner) {
  const parts = [];
  let cur = '', curly = 0, square = 0;
  for (let i = 0; i < inner.length; i++) {
    const two = inner.slice(i, i + 2);
    if (two === '{{') { curly++; cur += two; i++; continue; }
    if (two === '}}') { curly--; cur += two; i++; continue; }
    if (two === '[[') { square++; cur += two; i++; continue; }
    if (two === ']]') { square--; cur += two; i++; continue; }
    if (inner[i] === '|' && curly === 0 && square === 0) { parts.push(cur); cur = ''; continue; }
    cur += inner[i];
  }
  parts.push(cur);
  const [name, ...rest] = parts;
  const positional = [], named = {};
  for (const p of rest) {
    const eq = p.indexOf('=');
    const key = eq > 0 ? p.slice(0, eq).trim() : '';
    if (eq > 0 && /^[\w ]+$/.test(key)) {
      const v = stripComments(p.slice(eq + 1)).trim();
      if (v) named[key] = v;
    } else {
      positional.push(stripComments(p).trim());
    }
  }
  return { name: name.trim(), positional, named };
}

/** Infobox fields as a plain object, or null when the template is absent. */
export function infobox(text, name) {
  const inner = findTemplate(text, name);
  return inner == null ? null : parseTemplate(inner).named;
}

/**
 * Page titles referenced by a field value, in order:
 * `[[Target]]`, `[[Target|label]]`, and `{{Quest|A;B|...}}`.
 */
export function linkTargets(value) {
  if (!value) return [];
  const out = [];
  const re = /\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]*)?\]\]|\{\{\s*Quest\s*\|([^|}]+)/gi;
  let m;
  while ((m = re.exec(value))) {
    if (m[1]) out.push(m[1]);
    else out.push(...m[2].split(';'));
  }
  // `{{Quest|40;Name}}` mixes Adventure Rank numbers into the list.
  return out.map(normalizeTitle).filter((t) => t && !/^\d+$/.test(t));
}

/** Links in the numbered list under a `==Heading==` section (e.g. an act's `==Quests==`). */
export function sectionListLinks(text, heading) {
  const re = new RegExp(`^==\\s*${escapeRe(heading)}\\s*==\\s*$`, 'mi');
  const m = re.exec(text);
  if (!m) return [];
  const rest = text.slice(m.index + m[0].length);
  const end = rest.search(/^==[^=]/m);
  const body = end === -1 ? rest : rest.slice(0, end);
  return body
    .split('\n')
    .filter((l) => /^#(?![#*:])/.test(l))
    .flatMap((l) => linkTargets(l).slice(0, 1));
}

/** Plain text of a short value: drops comments, templates and link markup. */
export function plainText(value) {
  if (!value) return '';
  let s = stripComments(value);
  s = s.replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1');
  // Tooltip/ruby templates keep their visible text: {{tt|왕생|往生}} -> 왕생
  s = s.replace(/\{\{\s*(?:tt|Tooltip|Rubi|Ruby)\s*\|([^|{}]*)(?:\|[^{}]*)?\}\}/gi, '$1');
  let prev;
  do { prev = s; s = s.replace(/\{\{[^{}]*\}\}/g, ''); } while (s !== prev);
  return s.replace(/'{2,}/g, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

const ENTITIES = { mdash: '—', ndash: '–', amp: '&', quot: '"', apos: "'", nbsp: ' ' };
export function decodeEntities(s) {
  return s.replace(/&(#\d+|#x[0-9a-f]+|\w+);/gi, (m, e) =>
    e[0] === '#' ? String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : Number(e.slice(1)))
      : ENTITIES[e.toLowerCase()] ?? m);
}

export function normalizeTitle(t) {
  const s = decodeEntities(t).replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  return s ? s[0].toUpperCase() + s.slice(1) : '';
}

export function slug(title) {
  return title
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

function stripComments(s) { return s.replace(/<!--[\s\S]*?(-->|$)/g, ''); }
function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
