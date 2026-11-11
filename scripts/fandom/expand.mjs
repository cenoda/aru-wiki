// A small wikitext template expander, enough to see which categories a page's templates add.
//
// Supported: template transclusion (with redirects, includeonly/noinclude/onlyinclude),
// {{{parameters|defaults}}}, ParserFunctions (#if #ifeq #iferror #ifexist #switch #expr #ifexpr),
// string functions (#pos #rpos #sub #len #replace #explode #urlencode #titleparts), Variables
// (#vardefine #vardefineecho #var #varexists), lc/uc/lcfirst/ucfirst, page-name magic words,
// DEFAULTSORT. Not supported (expand to nothing): #invoke (Lua modules), #dpl, #time, tags.
// Categories added by Lua modules or DPL queries are therefore not seen.

const MAX_DEPTH = 40;
const NAMESPACED = /^\s*(?:Template|Module|Category|File|Image|User|Help|Project|MediaWiki|Genshin Impact Wiki)\s*:/i;

// ---------- parse ----------

/** Parse wikitext into nodes: string | { t: 'tpl' | 'arg', parts: Node[][] }. */
export function parseWikitext(text) {
  const root = [];
  const stack = []; // { count, parts: Node[][], link: number }
  const cur = () => (stack.length ? stack[stack.length - 1].parts.at(-1) : root);
  const push = (list, s) => {
    if (typeof list[list.length - 1] === 'string' && typeof s === 'string') list[list.length - 1] += s;
    else list.push(s);
  };
  let i = 0;
  const n = text.length;
  while (i < n) {
    const c = text[i];
    if (c === '{' || c === '}') {
      let j = i;
      while (text[j] === c) j++;
      let run = j - i;
      if (c === '{') {
        if (run >= 2) stack.push({ count: run, parts: [[]], link: 0 });
        else push(cur(), '{');
      } else {
        while (run >= 2 && stack.length) {
          const top = stack[stack.length - 1];
          const k = top.count >= 3 && run >= 3 ? 3 : 2;
          const node = { t: k === 3 ? 'arg' : 'tpl', parts: top.parts };
          top.count -= k;
          run -= k;
          if (top.count >= 2) {
            top.parts = [[node]];
            top.link = 0;
          } else {
            stack.pop();
            const list = cur();
            if (top.count === 1) push(list, '{');
            list.push(node);
          }
        }
        if (run) push(cur(), '}'.repeat(run));
      }
      i = j;
      continue;
    }
    if (stack.length) {
      const top = stack[stack.length - 1];
      if (c === '[' && text[i + 1] === '[') { top.link++; push(cur(), '[['); i += 2; continue; }
      if (c === ']' && text[i + 1] === ']' && top.link > 0) { top.link--; push(cur(), ']]'); i += 2; continue; }
      if (c === '|' && top.link === 0) { top.parts.push([]); i++; continue; }
    }
    let j = i + 1;
    while (j < n && !'{}[]|'.includes(text[j])) j++;
    push(cur(), text.slice(i, j));
    i = j;
  }
  // unclosed braces are plain text
  while (stack.length) {
    const top = stack.pop();
    const list = cur();
    push(list, '{'.repeat(top.count));
    top.parts.forEach((p, idx) => {
      if (idx) push(list, '|');
      for (const x of p) typeof x === 'string' ? push(list, x) : list.push(x);
    });
  }
  return root;
}

// ---------- expand ----------

const stripComments = (s) => s.replace(/<!--[\s\S]*?(?:-->|$)/g, '').replace(/<(?:noinclude|includeonly|onlyinclude)\s*\/>/gi, '');

/** Template text as transcluded. */
function transclusionText(text) {
  let s = stripComments(text);
  if (/<onlyinclude>/i.test(s)) {
    s = [...s.matchAll(/<onlyinclude>([\s\S]*?)(?:<\/onlyinclude>|$)/gi)].map((m) => m[1]).join('');
  }
  return s.replace(/<noinclude\s*>[\s\S]*?(?:<\/noinclude\s*>|$)/gi, '').replace(/<\/?includeonly\s*>/gi, '');
}

/** Page text as viewed. */
function pageText(text) {
  return stripComments(text)
    .replace(/<includeonly\s*>[\s\S]*?(?:<\/includeonly\s*>|$)/gi, '')
    .replace(/<\/?(?:noinclude|onlyinclude)\s*>/gi, '');
}

const nowikiOut = (s) => s.replace(/<nowiki\s*>[\s\S]*?<\/nowiki\s*>/gi, '').replace(/<nowiki\s*\/>/gi, '');

/**
 * new Expander({ getPage(title) → { title, content, redirect? } | undefined, canonicalTitle, siteName })
 * expandPage(title, content) → { text, defaultSort }
 */
export class Expander {
  constructor({ getPage, canonicalTitle, siteName = '' }) {
    this.getPage = getPage;
    this.norm = canonicalTitle;
    this.siteName = siteName;
    this.parsed = new Map();
  }

  parsedTemplate(title) {
    if (this.parsed.has(title)) return this.parsed.get(title);
    let page = this.getPage(title);
    for (let k = 0; k < 5 && page?.redirect; k++) page = this.getPage(page.redirect);
    const nodes = page?.content != null ? parseWikitext(nowikiOut(transclusionText(page.content))) : null;
    this.parsed.set(title, nodes);
    return nodes;
  }

  /** `invokes`: optional Map that counts #invoke calls by module name (all are reported, supported or not). */
  expandPage(title, content, { invokes } = {}) {
    const ctx = { title, vars: new Map(), defaultSort: null, budget: 200000, invokes };
    const nodes = parseWikitext(nowikiOut(pageText(content)));
    const text = this.nodes(nodes, { args: new Map(), depth: 0, stack: new Set() }, ctx);
    return { text, defaultSort: ctx.defaultSort };
  }

  nodes(list, frame, ctx) {
    let out = '';
    for (const x of list) out += typeof x === 'string' ? x : this.node(x, frame, ctx);
    return out;
  }

  node(x, frame, ctx) {
    if (--ctx.budget < 0) return '';
    if (x.t === 'arg') {
      const name = this.nodes(x.parts[0], frame, ctx).trim();
      const v = frame.args.get(name);
      if (v !== undefined) return v();
      if (x.parts.length > 1) return this.nodes(x.parts[1], frame, ctx);
      return `{{{${name}}}}`;
    }
    return this.template(x, frame, ctx);
  }

  template(x, frame, ctx) {
    const head = this.nodes(x.parts[0], frame, ctx).replace(/^\s*(?:safesubst|subst)\s*:/i, '');
    const colon = head.indexOf(':');
    const word = (colon === -1 ? head : head.slice(0, colon)).trim();
    const fn = PARSER_FUNCTIONS[word.toLowerCase()] ?? (word.startsWith('#') ? PARSER_FUNCTIONS['#unknown'] : null);
    if (colon !== -1 && fn) {
      const first = head.slice(colon + 1);
      const rest = x.parts.slice(1).map((p) => {
        let memo;
        return { raw: p, value: () => (memo ??= this.nodes(p, frame, ctx)) };
      });
      return fn.call(this, first, rest, frame, ctx);
    }
    const magic = MAGIC[head.trim()];
    if (magic && x.parts.length === 1) return magic(ctx, this);
    if (frame.depth >= MAX_DEPTH) return '';
    const name = head.trim();
    if (!name || /[<>[\]{}]/.test(name)) return `{{${head}}}`;
    const title = name.startsWith(':') ? this.norm(name.slice(1))
      : NAMESPACED.test(name) ? this.norm(name) : this.norm(`Template:${name}`);
    if (frame.stack.has(title)) return '';
    const nodes = this.parsedTemplate(title);
    if (!nodes) return `[[${title}]]`;
    const args = new Map();
    let pos = 1;
    for (const part of x.parts.slice(1)) {
      const eq = part.findIndex((p) => typeof p === 'string' && p.includes('='));
      if (eq !== -1) {
        const s = part[eq];
        const at = s.indexOf('=');
        const keyNodes = [...part.slice(0, eq), s.slice(0, at)];
        const valNodes = [s.slice(at + 1), ...part.slice(eq + 1)];
        const key = this.nodes(keyNodes, frame, ctx).trim();
        let memo;
        args.set(key, () => (memo ??= this.nodes(valNodes, frame, ctx).trim()));
      } else {
        let memo;
        const k = String(pos++);
        args.set(k, () => (memo ??= this.nodes(part, frame, ctx)));
      }
    }
    const stack = new Set(frame.stack);
    stack.add(title);
    return this.nodes(nodes, { args, depth: frame.depth + 1, stack }, ctx);
  }
}

// ---------- parser functions ----------

const isNum = (s) => /^\s*[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?\s*$/i.test(s);
const eq = (a, b) => (isNum(a) && isNum(b) ? Number(a) === Number(b) : a === b);

function splitDefault(part) {
  // for #switch: does this case have a top-level '=' in its raw nodes?
  const idx = part.raw.findIndex((p) => typeof p === 'string' && p.includes('='));
  return idx;
}

const PARSER_FUNCTIONS = {
  '#if'(first, rest) {
    return (first.trim() ? rest[0]?.value() : rest[1]?.value())?.trim() ?? '';
  },
  '#ifeq'(first, rest) {
    const a = first.trim();
    const b = rest[0]?.value().trim() ?? '';
    return (eq(a, b) ? rest[1]?.value() : rest[2]?.value())?.trim() ?? '';
  },
  '#iferror'(first, rest) {
    const err = /class="error"/.test(first);
    if (err) return rest[0]?.value().trim() ?? '';
    return rest.length > 1 ? rest[1].value().trim() : first.trim();
  },
  '#ifexist'(first, rest) {
    const t = first.trim();
    const exists = t && this.getPage(this.norm(t));
    return (exists ? rest[0]?.value() : rest[1]?.value())?.trim() ?? '';
  },
  '#switch'(first, rest, frame, ctx) {
    const v = first.trim();
    let found = false;
    let dflt;
    for (let i = 0; i < rest.length; i++) {
      const part = rest[i];
      const idx = splitDefault(part);
      if (idx === -1) {
        const key = part.value().trim();
        if (i === rest.length - 1) return found ? '' : key; // last bare value is the default
        if (eq(key, v) || key === '#default') found = true; // fall through
        continue;
      }
      const s = part.raw[idx];
      const at = s.indexOf('=');
      const key = this.nodes([...part.raw.slice(0, idx), s.slice(0, at)], frame, ctx).trim();
      const val = () => this.nodes([s.slice(at + 1), ...part.raw.slice(idx + 1)], frame, ctx).trim();
      if (found || eq(key, v)) return val();
      if (key === '#default') dflt = val;
    }
    return dflt ? dflt() : '';
  },
  '#expr'(first) {
    const r = evalExpr(first);
    return r == null ? '<strong class="error">Expression error</strong>' : formatNum(r);
  },
  '#ifexpr'(first, rest) {
    const r = evalExpr(first);
    return (r ? rest[0]?.value() : rest[1]?.value())?.trim() ?? '';
  },
  '#pos'(first, rest) {
    const s = first, needle = rest[0]?.value() ?? ' ';
    const i = s.indexOf(needle || ' ', Number(rest[1]?.value() || 0));
    return i === -1 ? '' : String(i);
  },
  '#rpos'(first, rest) {
    const i = first.lastIndexOf(rest[0]?.value() || ' ');
    return String(i);
  },
  '#len'(first) { return String(first.trim().length); },
  '#sub'(first, rest) {
    const s = first.trim();
    let start = Number(rest[0]?.value() || 0);
    if (start < 0) start = Math.max(0, s.length + start);
    const len = rest[1] ? Number(rest[1].value()) : undefined;
    const end = len === undefined || Number.isNaN(len) ? s.length : len < 0 ? s.length + len : start + len;
    return s.slice(start, end);
  },
  '#replace'(first, rest) {
    const from = rest[0]?.value() || ' ';
    return first.trim().split(from).join(rest[1]?.value() ?? '');
  },
  '#explode'(first, rest) {
    const parts = first.trim().split(rest[0]?.value() || ' ');
    let k = Number(rest[1]?.value() || 0);
    if (k < 0) k = parts.length + k;
    return parts[k] ?? '';
  },
  '#urlencode'(first) { return encodeURIComponent(first.trim()); },
  urlencode(first) { return encodeURIComponent(first.trim()); },
  '#titleparts'(first, rest) {
    const parts = first.trim().split('/');
    const count = Number(rest[0]?.value() || 0);
    const start = Number(rest[1]?.value() || 1);
    const from = start > 0 ? start - 1 : parts.length + start;
    const sel = parts.slice(from);
    return (count > 0 ? sel.slice(0, count) : count < 0 ? sel.slice(0, count) : sel).join('/');
  },
  '#vardefine'(first, rest, _f, ctx) { ctx.vars.set(first.trim(), rest[0]?.value().trim() ?? ''); return ''; },
  '#vardefineecho'(first, rest, _f, ctx) { const v = rest[0]?.value().trim() ?? ''; ctx.vars.set(first.trim(), v); return v; },
  '#var'(first, rest, _f, ctx) { const v = ctx.vars.get(first.trim()); return v ? v : rest[0]?.value().trim() ?? ''; },
  '#varexists'(first, rest, _f, ctx) { return ctx.vars.has(first.trim()) ? (rest[0]?.value() ?? '1') : (rest[1]?.value() ?? ''); },
  lc(first) { return first.trim().toLowerCase(); },
  uc(first) { return first.trim().toUpperCase(); },
  lcfirst(first) { const s = first.trim(); return s.charAt(0).toLowerCase() + s.slice(1); },
  ucfirst(first) { const s = first.trim(); return s.charAt(0).toUpperCase() + s.slice(1); },
  '#lc'(first) { return first.trim().toLowerCase(); },
  '#uc'(first) { return first.trim().toUpperCase(); },
  defaultsort(first, _r, _f, ctx) { ctx.defaultSort = first.trim(); return ''; },
  defaultsortkey(first, _r, _f, ctx) { ctx.defaultSort = first.trim(); return ''; },
  defaultcategorysort(first, _r, _f, ctx) { ctx.defaultSort = first.trim(); return ''; },
  displaytitle() { return ''; },
  fullurl(first) { return `//genshin-impact.fandom.com/wiki/${encodeURIComponent(first.trim())}`; },
  localurl(first) { return `/wiki/${encodeURIComponent(first.trim())}`; },
  ns() { return ''; },
  '#tag'() { return ''; },
  '#invoke'(first, rest, frame, ctx) {
    const mod = MODULES[first.trim().replace(/^Module:/i, '')];
    ctx.invokes?.set(first.trim(), (ctx.invokes.get(first.trim()) ?? 0) + 1);
    return mod ? mod.call(this, rest, frame, ctx) : '';
  },
  '#dpl'() { return ''; },
  '#time'() { return ''; },
  '#unknown'() { return ''; },
};
for (const k of ['pagename', 'fullpagename', 'subpagename', 'basepagename', 'namespace', 'pagenamee']) {
  PARSER_FUNCTIONS[k] = function (first) { return pageNameMagic(k, this.norm(first.trim())); };
}

function pageNameMagic(k, title) {
  const c = title.indexOf(':');
  const ns = c > 0 && /^(Template|Category|File|User|Module|Help|MediaWiki|Talk)$/.test(title.slice(0, c)) ? title.slice(0, c) : '';
  const name = ns ? title.slice(c + 1) : title;
  switch (k) {
    case 'pagename': return name;
    case 'pagenamee': return name.replace(/ /g, '_');
    case 'fullpagename': return title;
    case 'namespace': return ns;
    case 'subpagename': return name.split('/').at(-1);
    case 'basepagename': return name.includes('/') ? name.split('/').slice(0, -1).join('/') : name;
    default: return '';
  }
}

const MAGIC = {
  PAGENAME: (ctx) => pageNameMagic('pagename', ctx.title),
  PAGENAMEE: (ctx) => pageNameMagic('pagenamee', ctx.title),
  FULLPAGENAME: (ctx) => pageNameMagic('fullpagename', ctx.title),
  NAMESPACE: (ctx) => pageNameMagic('namespace', ctx.title),
  SUBPAGENAME: (ctx) => pageNameMagic('subpagename', ctx.title),
  BASEPAGENAME: (ctx) => pageNameMagic('basepagename', ctx.title),
  ROOTPAGENAME: (ctx) => pageNameMagic('pagename', ctx.title).split('/')[0],
  SITENAME: (_ctx, ex) => ex.siteName,
  '!': () => '|',
};

// ---------- Lua modules reimplemented ----------

/** Module:Namespace detect — returns the parent template's argument for the page's namespace. */
function namespaceDetect(_rest, frame, ctx) {
  const ns = pageNameMagic('namespace', ctx.title).toLowerCase();
  const get = (k) => frame.args.get(k)?.();
  const v = ns === '' ? get('main') : get(ns);
  return (v ?? get('other') ?? '').trim();
}

const MODULES = {
  'Namespace detect': namespaceDetect,
};

// ---------- #expr ----------

const PREC = { or: 1, and: 2, '=': 3, '!=': 3, '<>': 3, '<': 3, '>': 3, '<=': 3, '>=': 3, '+': 4, '-': 4, '*': 5, '/': 5, div: 5, mod: 5, round: 0.5, '^': 6 };
const UNARY = new Set(['not', 'neg', 'pos', 'floor', 'ceil', 'trunc', 'abs']);

/** Evaluate a ParserFunctions #expr expression; null on error. */
export function evalExpr(src) {
  const toks = String(src).toLowerCase().match(/\d+\.?\d*(?:e[-+]?\d+)?|\.\d+|<=|>=|<>|!=|[-+*/^()=<>]|[a-z]+/g);
  if (!toks) return 0;
  const out = [], ops = [];
  let expectOperand = true;
  const apply = (op) => {
    if (UNARY.has(op)) {
      const a = out.pop();
      if (a === undefined) throw new Error();
      out.push({ not: +!a, neg: -a, pos: +a, floor: Math.floor(a), ceil: Math.ceil(a), trunc: Math.trunc(a), abs: Math.abs(a) }[op]);
      return;
    }
    const b = out.pop(), a = out.pop();
    if (a === undefined || b === undefined) throw new Error();
    const r = {
      '+': a + b, '-': a - b, '*': a * b, '/': a / b, div: a / b, mod: Math.trunc(a) % Math.trunc(b), '^': a ** b,
      '=': +(a === b), '!=': +(a !== b), '<>': +(a !== b), '<': +(a < b), '>': +(a > b), '<=': +(a <= b), '>=': +(a >= b),
      and: +(a && b), or: +(a || b), round: Math.round(a * 10 ** b) / 10 ** b,
    }[op];
    out.push(r);
  };
  try {
    for (const t of toks) {
      if (/^[\d.]/.test(t)) { out.push(Number(t)); expectOperand = false; continue; }
      if (t === 'e' || t === 'pi') { out.push(t === 'e' ? Math.E : Math.PI); expectOperand = false; continue; }
      if (t === '(') { ops.push(t); expectOperand = true; continue; }
      if (t === ')') {
        while (ops.length && ops.at(-1) !== '(') apply(ops.pop());
        ops.pop();
        expectOperand = false;
        continue;
      }
      let op = t;
      if (expectOperand && (t === '-' || t === '+')) op = t === '-' ? 'neg' : 'pos';
      if (UNARY.has(op)) { ops.push(op); expectOperand = true; continue; }
      if (!(op in PREC)) return null;
      while (ops.length && ops.at(-1) !== '(' && (UNARY.has(ops.at(-1)) || PREC[ops.at(-1)] >= PREC[op])) apply(ops.pop());
      ops.push(op);
      expectOperand = true;
    }
    while (ops.length) apply(ops.pop());
  } catch {
    return null;
  }
  return out.length === 1 && Number.isFinite(out[0]) ? out[0] : null;
}

function formatNum(n) {
  if (Number.isInteger(n)) return String(n);
  return String(Number(n.toPrecision(14)));
}
