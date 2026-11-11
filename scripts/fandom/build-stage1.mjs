// Stage 1 data build (design.md §5.1): versions, quest/act nodes and
// PREREQUISITE / RECOMMENDED / PART_OF edges, parsed from Fandom infoboxes
// and categories without any LLM.
//
// Usage: node scripts/fandom/build-stage1.mjs [--refresh] [--out data/generated]
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { FandomClient, pageUrl } from './client.mjs';
import { koNames } from './ko-names.mjs';
import { decodeEntities, infobox, linkTargets, normalizeTitle, plainText, sectionListLinks, slug } from './wikitext.mjs';

const args = process.argv.slice(2);
const outDir = args.includes('--out') ? args[args.indexOf('--out') + 1] : 'data/generated';
const client = new FandomClient({ refresh: args.includes('--refresh') });
const today = new Date().toISOString().slice(0, 10);

const QUEST_CATEGORIES = {
  'Category:Archon Quests': 'ARCHON',
  'Category:Story Quests': 'STORY',
  'Category:World Quests': 'WORLD',
  'Category:Event Quests': 'EVENT',
};
const TYPE_MAP = { archon: 'ARCHON', story: 'STORY', world: 'WORLD', event: 'EVENT' };
const ACT_REQ_FIELDS = ['archonQuestReq', 'storyQuestReq', 'worldQuestReq']
  .flatMap((f) => [f, `${f}2`, `${f}3`]);

const log = (...a) => console.error('[stage1]', ...a);

// ---------- versions ----------
function cleanField(v) {
  const s = plainText(v);
  return s && s !== '-->' && !/^none$/i.test(s) ? s : null;
}

function versionAreas(content) {
  const clean = content.replace(/<!--[\s\S]*?-->/g, '');
  const nc = clean.match(/==\s*New Content\s*==([\s\S]*?)(?=\n==[^=]|$)/i)?.[1] ?? '';
  const block = nc.match(/;(?:New|Returning)\s+(?:Limited[- ]Time\s+)?(?:Regions?|Subregions?|Areas?|Locations?)\b([\s\S]*?)(?=\n;|\n===|$)/i)?.[1] ?? '';
  const out = [];
  for (const line of block.split('\n').filter((l) => /^\*+/.test(l.trim()))) {
    if (/\b(?:New Feature|New Domain|Frostbearing Tree|Sacred Sakura|Statue of The Seven|Teleport Waypoint)\b/i.test(line)) continue;
    for (const t of linkTargets(line)) {
      if (/^(?:Domains?|Frostbearing Tree|Sacred Sakura.*|Statue of The Seven|Teleport Waypoint|Bounties|Requests|File:.*)$/i.test(t)) continue;
      if (!out.includes(t)) out.push(t);
    }
  }
  return out;
}

async function buildVersions() {
  const titles = (await client.prefixPages('Version/')).filter((t) => t !== 'Version/Gallery');
  const pages = await client.latest(titles);
  const seen = new Map();
  const rawAreas = new Map();
  const title2ByVer = new Map();
  for (const page of pages.values()) {
    const f = infobox(page.content, 'Version');
    if (!f?.version || !/^\d{4}-\d{2}-\d{2}$/.test(f.date ?? '')) continue;
    if (f.date < '2020-09-28' || f.date > today) continue; // skip betas and unreleased
    const title = plainText(f.title);
    const title2 = cleanField(f.title2);
    if (title2) title2ByVer.set(f.version, title2);
    rawAreas.set(f.version, versionAreas(page.content));
    seen.set(f.version, {
      id: f.version,
      number: f.number ?? f.version,
      title,
      released: f.date,
      source: { wiki: 'fandom', url: pageUrl(page.title), revision: page.revid },
    });
  }
  const list = [...seen.values()].sort((a, b) => a.released.localeCompare(b.released));
  const verLookupTitles = new Set();
  const allAreaTitles = new Set();
  for (const v of list) {
    verLookupTitles.add(`Version/${v.id}`);
    if (v.title) {
      verLookupTitles.add(v.title);
      if (v.title.includes(' - ')) verLookupTitles.add(v.title.split(' - ').pop().trim());
    }
    for (const a of rawAreas.get(v.id) ?? []) allAreaTitles.add(a);
  }
  const koRes = await koNames(client, [...verLookupTitles, ...allAreaTitles]);
  list.forEach((v, i) => {
    const title2 = title2ByVer.get(v.id);
    const kVer = koRes.out[`Version/${v.id}`]?.ko;
    const kTitle = koRes.out[v.title]?.ko;
    const titleKo = (title2 ? kTitle ?? kVer : kVer ?? kTitle) ?? null;
    if (titleKo) v.title_ko = titleKo;
    if (title2) {
      v.title2 = title2;
      if (kVer && kVer !== titleKo) v.title2_ko = kVer;
    }
    const areas = (rawAreas.get(v.id) ?? []).map((en) => ({
      en,
      ...(koRes.out[en]?.ko ? { ko: koRes.out[en].ko } : {}),
    }));
    if (areas.length) v.areas = areas;
    v.order = i;
  });
  return list;
}

/** Map<page title, version id> from the `Released in Version X` categories. */
async function releaseVersions(versions) {
  const byTitle = new Map();
  for (const v of versions) {
    for (const t of await client.categoryMembers(`Category:Released in Version ${v.id}`)) {
      if (!byTitle.has(t)) byTitle.set(t, v.id); // versions are in release order: keep earliest
    }
  }
  return byTitle;
}

// ---------- nodes ----------
async function main() {
  const versions = await buildVersions();
  const order = new Map(versions.map((v) => [v.id, v.order]));
  log(`versions: ${versions.length} (${versions[0].id} .. ${versions.at(-1).id})`);

  const released = await releaseVersions(versions);
  log(`release-version map: ${released.size} pages`);

  const actTitles = await client.categoryMembers('Category:Quest Acts');
  const questTitles = new Map(); // title -> category type
  const eventCategory = new Set();
  for (const [cat, type] of Object.entries(QUEST_CATEGORIES)) {
    for (const t of await client.categoryMembers(cat)) {
      if (type === 'EVENT') eventCategory.add(t);
      if (!questTitles.has(t)) questTitles.set(t, type);
    }
  }
  for (const t of actTitles) questTitles.delete(t);
  log(`acts: ${actTitles.length}, quests: ${questTitles.size}`);

  const pages = await client.latest([...actTitles, ...questTitles.keys()]);

  const nodes = new Map(); // canonical title -> node
  const raw = new Map(); // canonical title -> { fields, content }
  const transcludes = new Map(); // title -> page whose Other Languages table it reuses
  const aliases = {}; // character -> names they go by in dialogue (`Sandrone/as Marionette`)
  const characters = {}; // quest id -> character page names (kept out of quests.json, the UI bundles that)
  const report = { missingInfobox: [], missingVersion: [], missingKo: [], unresolvedLinks: {} };

  const addNode = (title, level, catType) => {
    const page = pages.get(title);
    if (!page || nodes.has(page.title)) return;
    const box = level === 'ACT' ? 'Act Infobox' : 'Quest Infobox';
    const fields = infobox(page.content, box);
    if (!fields) { report.missingInfobox.push(page.title); return; }
    const languages = infobox(page.content, 'Other Languages');
    if (languages?.Transclude) transcludes.set(page.title, normalizeTitle(languages.Transclude));
    const ko = plainText(languages?.ko);
    const version = released.get(page.title) ?? null;
    if (!version) report.missingVersion.push(page.title);
    if (!ko) report.missingKo.push(page.title);
    // Event quests are filed as World/Story in the infobox; an event name or the
    // Event Quests category marks them as time-limited.
    const isEvent = Boolean(fields.event_name) || eventCategory.has(page.title);
    const questType = isEvent ? 'EVENT' : TYPE_MAP[(fields.type ?? '').toLowerCase()] ?? catType ?? null;
    const character = cleanField(fields.character);
    const chapter = cleanField(fields.chapter);
    const actNum = cleanField(fields.actNum);
    const group = cleanField(fields.group);
    nodes.set(page.title, {
      id: `${level === 'ACT' ? 'act' : 'quest'}_${slug(page.title)}`,
      category: 'QUEST',
      level,
      quest_type: questType,
      act: null,
      names: { en: page.title, ...(ko ? { ko } : {}) },
      first_version: version,
      // Event quests are time-limited; world quests tied to an event are unknown until reviewed.
      replayable: !isEvent,
      ...(fields.region ? { region: plainText(fields.region).split(/\s*[;,]\s*/)[0] } : {}),
      ...(fields.event_name ? { event: plainText(fields.event_name) } : {}),
      ...(character ? { character } : {}),
      ...(chapter ? { chapter } : {}),
      ...(actNum ? { actNum } : {}),
      ...(group ? { group } : {}),
      sources: [{ wiki: 'fandom', url: pageUrl(page.title), revision: page.revid }],
    });
    raw.set(page.title, { fields, content: page.content });
    if (level === 'QUEST' && fields.characters) {
      characters[nodes.get(page.title).id] = characterList(fields.characters);
      for (const [name, alias] of characterAliases(fields.characters)) (aliases[name] ??= new Set()).add(alias);
    }
  };
  for (const t of actTitles) addNode(t, 'ACT');
  for (const [t, type] of questTitles) addNode(t, 'QUEST', type);

  // `{{Other Languages|Transclude=Page}}` reuses another page's table.
  const transcluded = await client.latest([...new Set(transcludes.values())]);
  for (const [title, from] of transcludes) {
    const node = nodes.get(title);
    const ko = plainText(infobox(transcluded.get(from)?.content ?? '', 'Other Languages')?.ko);
    if (node && ko && !node.names.ko) {
      node.names.ko = ko;
      report.missingKo.splice(report.missingKo.indexOf(title), 1);
    }
  }
  if (report.missingKo.length) {
    const fallbackKo = await koNames(client, [...report.missingKo]);
    for (const title of [...report.missingKo]) {
      const ko = fallbackKo.out[title]?.ko;
      const node = nodes.get(title);
      if (node && ko) {
        node.names.ko = ko;
        report.missingKo.splice(report.missingKo.indexOf(title), 1);
      }
    }
  }

  // Resolve every link target that is not already a known node (redirects, renamed pages).
  const known = new Set(nodes.keys());
  const wanted = new Set();
  const want = (t) => { if (!known.has(t)) wanted.add(t); };
  for (const { fields, content } of raw.values()) {
    for (const f of [...ACT_REQ_FIELDS, 'requirement', 'recommended', 'act', 'parent', 'prev']) {
      fieldLinks(fields, f).forEach(want);
    }
    sectionListLinks(content, 'Quests').forEach(want);
  }
  const resolved = await client.resolve([...wanted]);
  const toNode = (t) => nodes.get(t) ?? nodes.get(resolved.get(t));
  // Links to pages that exist but are not quests (Adventure Rank, Chapter I, NPCs) are dropped
  // silently; links to pages that do not exist at all are reported.
  const targets = (fields, f, from) => {
    const out = [];
    for (const t of fieldLinks(fields, f)) {
      const n = toNode(t);
      if (n) out.push(n);
      else if (!resolved.has(t)) (report.unresolvedLinks[from] ??= []).push(t);
    }
    return out;
  };

  // ---------- act membership ----------
  for (const [title, { fields, content }] of raw) {
    const node = nodes.get(title);
    if (node.level === 'QUEST' && fields.act) {
      const act = targets(fields, 'act', title).find((n) => n.level === 'ACT');
      if (act) node.act = act.id;
    }
    if (node.level === 'ACT') {
      for (const t of sectionListLinks(content, 'Quests')) {
        const q = toNode(t);
        if (q?.level === 'QUEST' && !q.act) q.act = node.id;
      }
    }
  }

  // Acts rarely state a region; use the most common region among their quests.
  const regionVotes = new Map();
  for (const n of nodes.values()) {
    if (n.level !== 'QUEST' || !n.act || !n.region) continue;
    const votes = regionVotes.get(n.act) ?? new Map();
    votes.set(n.region, (votes.get(n.region) ?? 0) + 1);
    regionVotes.set(n.act, votes);
  }
  for (const n of nodes.values()) {
    if (n.level !== 'ACT' || n.region) continue;
    const votes = regionVotes.get(n.id);
    if (votes) n.region = [...votes].sort((a, b) => b[1] - a[1])[0][0];
  }

  // ---------- edges ----------
  const edges = new Map();
  const addEdge = (src, dst, relation, basis, srcTitle) => {
    if (!src || !dst || src === dst) return;
    const key = `${src.id}|${dst.id}|${relation}`;
    if (edges.has(key)) return;
    const vs = [src.first_version, dst.first_version];
    const revealed = vs.includes(null) ? null : vs.sort((a, b) => order.get(a) - order.get(b))[1];
    edges.set(key, {
      source: src.id, target: dst.id, relation, basis,
      revealed_version: revealed,
      trust: 'CANON',
      review: 'unreviewed',
      sources: nodes.get(srcTitle).sources,
    });
  };

  for (const [title, { fields }] of raw) {
    const node = nodes.get(title);
    const reqFields = node.level === 'ACT' ? ACT_REQ_FIELDS : ['requirement'];
    for (const f of reqFields) {
      for (const pre of targets(fields, f, title)) addEdge(pre, node, 'PREREQUISITE', f.replace(/\d$/, ''), title);
    }
    for (const prev of targets(fields, 'prev', title)) {
      if (prev.level === node.level) addEdge(prev, node, 'PREREQUISITE', 'prev', title);
    }
    for (const rec of targets(fields, 'recommended', title)) addEdge(rec, node, 'RECOMMENDED', 'recommended', title);
    if (node.level === 'QUEST') {
      for (const parent of targets(fields, 'parent', title)) addEdge(node, parent, 'PART_OF', 'parent', title);
    }
  }

  // ---------- write ----------
  const nodeList = [...nodes.values()].sort((a, b) => a.id.localeCompare(b.id));
  const edgeList = [...edges.values()].sort((a, b) => `${a.source}|${a.target}`.localeCompare(`${b.source}|${b.target}`));
  const stats = {
    versions: versions.length,
    nodes: countBy(nodeList, (n) => `${n.level}:${n.quest_type}`),
    edges: countBy(edgeList, (e) => `${e.relation}:${e.basis}`),
    questsWithAct: nodeList.filter((n) => n.level === 'QUEST' && n.act).length,
    missingInfobox: report.missingInfobox.length,
    missingVersion: report.missingVersion.length,
    missingKo: report.missingKo.length,
    unresolvedLinkPages: Object.keys(report.unresolvedLinks).length,
  };
  await mkdir(outDir, { recursive: true });
  const write = (name, data) => writeFile(join(outDir, name), `${JSON.stringify(data, null, 1)}\n`);
  await write('versions.json', versions);
  await write('quests.json', nodeList);
  await write('quest-edges.json', edgeList);
  await write('quest-characters.json', Object.fromEntries(Object.entries(characters).sort()));
  await write('character-aliases.json', Object.fromEntries(Object.entries(aliases).sort().map(([k, v]) => [k, [...v].sort()])));
  await write('stage1-report.json', { stats, ...report });
  // Run metadata stays out of the files so a rebuild with unchanged data produces no diff.
  log(`fandom requests: ${client.requests}`);
  console.log(JSON.stringify(stats, null, 2));
}

// `prev`, `act` and `parent` usually hold bare page names (`prev = Wanderer's Trail`,
// several separated by `;`); the other fields are wikitext with links.
const BARE_FIELDS = new Set(['prev', 'act', 'parent']);
function fieldLinks(fields, f) {
  const v = fields[f];
  if (!v) return [];
  if (BARE_FIELDS.has(f) && !/\[\[|\{\{/.test(v)) return decodeEntities(v).split(/\s*;\s*/).map(normalizeTitle).filter(Boolean);
  return linkTargets(v);
}

// `characters = Amber;Paimon;Traveler` — plain page names, sometimes with links or notes.
function characterList(v) {
  // `Sandrone/as Marionette`, `Venti//'''Venti'''`: the page name is what precedes the slash.
  const names = decodeEntities(plainText(v.replace(/<!--[\s\S]*?-->/g, ''))).split(/\s*[;\n]\s*/)
    .map((n) => normalizeTitle(n.split('/')[0].replace(/^\*+\s*/, '')));
  return [...new Set(names.filter(Boolean))].sort();
}

function characterAliases(v) {
  const out = [];
  for (const entry of decodeEntities(v.replace(/<!--[\s\S]*?-->/g, '')).split(/\s*[;\n]\s*/)) {
    const m = entry.match(/^([^/]+)\/[^/]*\bas\s+"?([^"/]+?)"?\s*$/);
    if (m) out.push([normalizeTitle(plainText(m[1])), plainText(m[2]).replace(/[<>].*$/, "").trim()]);
  }
  return out.filter(([n, a]) => n && a && !/^\?+$/.test(a));
}

function countBy(list, key) {
  const out = {};
  for (const x of list) out[key(x)] = (out[key(x)] ?? 0) + 1;
  return Object.fromEntries(Object.entries(out).sort());
}

main().catch((e) => { console.error(e); process.exit(1); });
