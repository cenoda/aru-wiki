// Categories of a page from its wikitext alone (no template expansion).
//
// A dump has page text, not the rendered category links, and most categories on this wiki
// are added by templates. This module reproduces:
//   1. explicit [[Category:X]] links in the page text;
//   2. the template rules the build scripts depend on, read from the templates and modules
//      as of the 2026-09-30 dump:
//        Template:Change History    {{Change History|V}} → Released in Version V (V in its #switch list)
//                                   otherwise, without introduced= → Released in Unknown Version
//                                   introduced=W (≠ V, in the list) → Introduced in Version W
//        Template:Act Infobox       → Quest Acts, Act
//        Template:Chapter Infobox   → Quest Chapters, Chapter
//        Template:Quest Infobox     → Quests; type Archon/Story/World/Commission/Anecdote →
//                                   Archon Quests/…; event_name → Event Quests, "<event> Quests";
//                                   past_event_name → Past Event Quests, "<event> Quests";
//                                   region → "<region> Quests"   (Module:Quest Chapter Act,
//                                   Template:Quest Infobox/Inner)
//        Template:Shop, Vendor      → Shops  ({{Shop}} is Module:Shop; {{Vendor|NPC}} transcludes
//                                   the NPC's Shop section, which the expander cannot follow)
//   3. for other templates, categories the template text adds without conditions
//      (`templateCategories`, see unconditionalCategories()).
// Anything else a template adds is not seen. The 2026-11-11 migration measured the gap (docs/log/2026-11-11-dump-migration.md).
import { findTemplate, parseTemplate } from './wikitext.mjs';

/** Version ids accepted by {{Change History}}: the case list of its `{{#switch:{{{1|}}}` block. */
export function releaseVersionList(templateText) {
  const text = String(templateText ?? '').replace(/<!--[\s\S]*?(?:-->|$)/g, '');
  const at = text.indexOf('{{#switch:{{{1|}}}');
  if (at === -1) return new Set();
  const end = text.indexOf('=', at);
  const body = text.slice(at + '{{#switch:{{{1|}}}'.length, end);
  return new Set(body.split('|').map((s) => s.trim()).filter(Boolean));
}

/** Remove what never renders on the page itself: comments, nowiki, includeonly. */
export function clean(text) {
  return String(text ?? '')
    .replace(/<!--[\s\S]*?(?:-->|$)/g, '')
    .replace(/<nowiki\s*>[\s\S]*?<\/nowiki\s*>/gi, '')
    .replace(/<includeonly\s*>[\s\S]*?(?:<\/includeonly\s*>|$)/gi, '')
    .replace(/<\/?(?:noinclude|onlyinclude)\s*>/gi, '');
}

const CATEGORY_LINK = /\[\[\s*category\s*:\s*([^\]|]+?)\s*(?:\|([^\]]*))?\]\]/gi;
const DEFAULTSORT = /\{\{\s*(?:DEFAULTSORT|DEFAULTSORTKEY|DEFAULTCATEGORYSORT)\s*:\s*([^}]*?)\s*\}\}/i;

/** Every `{{Name ...}}` call (any depth) as { name, named, positional }. */
export function templateCalls(text) {
  const out = [];
  const stack = [];
  for (let i = 0; i < text.length - 1; i++) {
    if (text[i] === '{' && text[i + 1] === '{') {
      if (text[i + 2] === '{' && text[i + 3] !== '{') { // {{{param}}}
        stack.push(-1); i += 2; continue;
      }
      stack.push(i); i++; continue;
    }
    if (text[i] === '}' && text[i + 1] === '}') {
      const start = stack.pop();
      if (start === -1) { i += 2; continue; }
      if (start !== undefined) {
        const inner = text.slice(start + 2, i);
        const name = inner.split(/[|\n]/, 1)[0].trim();
        if (name && !name.startsWith('#') && !name.includes(':') && !/^[A-Z_]+$/.test(name)) {
          out.push({ name: name.replace(/_/g, ' '), ...parseTemplate(inner) });
        }
      }
      i++;
    }
  }
  return out;
}

/**
 * Text outside every {{template}} / {{{parameter}}}. Brace runs are matched the way the
 * MediaWiki preprocessor does: a closing run takes 3 braces from an opening run when both
 * have at least 3, otherwise 2 (so `{{{a|{{{b}}}}}}` and `{{#if:x|{{{y}}}}}` balance).
 */
export function topLevelText(text) {
  const stack = []; // remaining brace counts of open runs
  let out = '';
  for (let i = 0; i < text.length;) {
    const c = text[i];
    if (c !== '{' && c !== '}') { if (!stack.length) out += c; i++; continue; }
    let j = i;
    while (text[j] === c) j++;
    let n = j - i;
    if (c === '{') {
      if (n >= 2) stack.push(n);
      else if (!stack.length) out += c;
    } else {
      while (n >= 2 && stack.length) {
        const top = stack[stack.length - 1];
        const k = top >= 3 && n >= 3 ? 3 : 2;
        stack[stack.length - 1] -= k;
        n -= k;
        if (stack[stack.length - 1] < 2) stack.pop();
      }
      if (!stack.length) out += '}'.repeat(n);
    }
    i = j;
  }
  return out;
}

/**
 * Categories a template adds unconditionally: [[Category:X]] with a literal name, outside any
 * parser function or parameter default, inside <includeonly> or plain text, not in <noinclude>.
 */
export function unconditionalCategories(templateText) {
  let t = String(templateText ?? '')
    .replace(/<!--[\s\S]*?(?:-->|$)/g, '')
    .replace(/<noinclude\s*>[\s\S]*?(?:<\/noinclude\s*>|$)/gi, '')
    .replace(/<\/?(?:includeonly|onlyinclude)\s*>/gi, '');
  const out = topLevelText(t);
  const cats = [];
  for (const m of out.matchAll(CATEGORY_LINK)) if (!/[{}]/.test(m[1])) cats.push(m[1].trim());
  return cats;
}

/** Category names linked in (expanded) wikitext, without "Category:". */
export function categoryLinks(text) {
  const out = [];
  for (const m of String(text).matchAll(CATEGORY_LINK)) {
    const n = m[1].replace(/[_\s]+/g, ' ').trim();
    if (n && !/[{}|[\]<>]/.test(n)) out.push(n);
  }
  return out;
}

const QUEST_TYPE = { Archon: 'Archon Quests', Story: 'Story Quests', World: 'World Quests', Commission: 'Commissions', Anecdote: 'Anecdotes' };

/**
 * Categories of a main-namespace page.
 *   releaseVersions     Set from releaseVersionList()
 *   templateCategories  (templateName) => string[] | undefined, for rule 3
 * Returns { categories: string[] (without "Category:"), sortkey(category) }.
 */
export function pageCategories(content, title, { releaseVersions = new Set(), templateCategories } = {}) {
  const text = clean(content);
  const cats = [];
  const keys = new Map();
  const add = (name, key) => {
    const n = String(name).replace(/[_\s]+/g, ' ').trim();
    if (!n || /[{}|[\]]/.test(n)) return;
    cats.push(n);
    if (key && !keys.has(n)) keys.set(n, key);
  };

  // a blank sort key (`| `) is kept: MediaWiki sorts it first
  for (const m of text.matchAll(CATEGORY_LINK)) add(m[1], m[2] == null ? undefined : m[2].trim() || (m[2] ? ' ' : undefined));

  const box = (name) => {
    const inner = findTemplate(text, name);
    return inner == null ? null : parseTemplate(inner);
  };

  const ch = box('Change History');
  if (ch) {
    const v = ch.positional[0] ?? ch.named['1'] ?? '';
    const introduced = ch.named.introduced ?? '';
    if (v && releaseVersions.has(v)) { add(`Released in Version ${v}`); add('Version'); }
    else if (!introduced) { add('Released in Unknown Version'); add('Version'); }
    if (introduced && introduced !== v && releaseVersions.has(introduced)) add(`Introduced in Version ${introduced}`);
  }
  if (box('Act Infobox')) { add('Quest Acts'); add('Act'); }
  if (box('Chapter Infobox')) { add('Quest Chapters'); add('Chapter'); }
  if (/\{\{\s*(?:Shop|Vendor)\s*[|}]/i.test(text)) add('Shops');
  const quest = box('Quest Infobox');
  if (quest) {
    const f = quest.named;
    add('Quests');
    if (QUEST_TYPE[f.type]) add(QUEST_TYPE[f.type]);
    if (f.event_name) { add('Event Quests'); add(`${f.event_name} Quests`); }
    if (f.past_event_name) { add('Past Event Quests'); add(`${f.past_event_name} Quests`); }
    if (f.region) add(`${f.region} Quests`);
  }

  if (templateCategories) {
    for (const call of templateCalls(text)) for (const c of templateCategories(call.name) ?? []) add(c);
  }

  const defaultSort = text.match(DEFAULTSORT)?.[1];
  const sortkey = (category) => {
    const name = category.replace(/^Category:/, '');
    const prefix = keys.get(name) ?? defaultSort;
    return (prefix ? `${prefix}\n${title}` : title).toUpperCase();
  };
  return { categories: [...new Set(cats)], sortkey };
}
