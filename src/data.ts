// The graph data is a separate hashed asset (scripts/build-runtime-data.mjs), fetched once at start.
// Bindings below are filled by loadData(); import the views only after it resolves (see App.tsx).
import graphUrl from '../data/runtime/graph.json?url';

export type QuestType = 'ARCHON' | 'STORY' | 'WORLD' | 'EVENT';

export interface Quest {
  id: string;
  level: 'ACT' | 'QUEST';
  quest_type: QuestType;
  act: string | null;
  names: { en: string; ko?: string };
  first_version: string | null;
  replayable: boolean;
  event?: string;
  region?: string;
  sources: { url: string }[];
}

export interface QuestEdge {
  source: string;
  target: string;
  relation: 'PREREQUISITE' | 'RECOMMENDED' | 'PART_OF';
  basis: string;
  revealed_version: string | null;
}

export interface Version {
  id: string; number: string; order: number; released: string; title: string;
  /** official Korean version title (Fandom Version/X.Y page) */
  title_ko?: string;
  /** areas the version opens (Fandom Version/X.Y page); ko from ko-names.json */
  areas?: { en: string; ko?: string }[];
}

export let versions: Version[] = [];
export let quests: Quest[] = [];
export let questEdges: QuestEdge[] = [];
export let questById = new Map<string, Quest>();
export let versionOrder = new Map<string, number>();

// Official Korean names, as in ko-names.json (Fandom {{Other Languages}} ko); never transliterated by hand.
export const REGION_KO: Record<string, string> = {
  Mondstadt: '몬드', Liyue: '리월', Inazuma: '이나즈마', Sumeru: '수메르', Fontaine: '폰타인',
  Natlan: '나타', 'Nod-Krai': '노드크라이', Snezhnaya: '스네즈나야', Other: '기타',
};

/** Korean title, or the English one. A wiki "(Act)" or "(Event)" suffix is not part of the name. */
export const displayName = (q: { names: { en: string; ko?: string } }) => q.names.ko ?? q.names.en.replace(/ \((?:Act|Event)\)$/, '');

export const TYPE_LABEL: Record<QuestType, string> = {
  ARCHON: '마신', STORY: '전설', WORLD: '월드', EVENT: '이벤트',
};

/** Act of a quest, or the node itself when it is an act. */
const actOf = (id: string) => {
  const q = questById.get(id);
  return q?.level === 'ACT' ? q.id : q?.act ?? null;
};

// ---------- quests outside acts, grouped (quest-units.json) ----------
export type UnitKind = 'series' | 'event' | 'chain' | 'single';
/**
 * How a unit hangs off the act map. requirement: the game asks for those acts.
 * region: after the Archon act that enters its region; a reading position, not a lock.
 * none: no act to hang it on (mostly time-limited events).
 */
export type AttachBasis = 'requirement' | 'region' | 'none';
export interface Unit {
  id: string;
  kind: UnitKind;
  names: { en: string; ko?: string };
  /** quest ids in play order */
  members: string[];
  quest_type: QuestType;
  region?: string;
  first_version: string | null;
  replayable: boolean;
  attach: { acts: string[]; basis: AttachBasis };
  /** series that continue this one */
  next?: string[];
  major?: boolean;
}
export let units: Unit[] = [];
export let unitById = new Map<string, Unit>();
/** region → the Archon act that enters it */
export let regionEntry: Record<string, string> = {};
export let unitOfQuest = new Map<string, string>();
let recommendedRaw: LlmEdge[] = [];

interface GraphData {
  versions: Version[];
  quests: Quest[];
  questEdges: QuestEdge[];
  units: { region_entry: Record<string, string>; units: Unit[] };
  recommended: LlmEdge[];
  figures: FiguresData;
  imageFiles: ImageFile[];
}

let loading: Promise<void> | undefined;
/** Fetch the graph data and fill the bindings above. Safe to call more than once. */
export function loadData() {
  return loading ??= (async () => {
    const res = await fetch(graphUrl);
    if (!res.ok) throw new Error(`graph data: HTTP ${res.status}`);
    const g = (await res.json()) as GraphData;
    versions = g.versions;
    quests = g.quests;
    questEdges = g.questEdges;
    questById = new Map(quests.map((q) => [q.id, q]));
    versionOrder = new Map(versions.map((v) => [v.id, v.order]));
    units = g.units.units;
    unitById = new Map(units.map((u) => [u.id, u]));
    regionEntry = g.units.region_entry;
    unitOfQuest = new Map(units.flatMap((u) => u.members.map((m) => [m, u.id] as const)));
    recommendedRaw = g.recommended;
    figureOf = buildFigures(g.figures, g.imageFiles);
  })().catch((err) => { loading = undefined; throw err; });
}
export const UNIT_LABEL: Record<UnitKind, string> = { series: '시리즈', event: '이벤트', chain: '연속 임무', single: '단일 임무' };

/** A node on the map: an act or a unit. Both carry names, type, version and replayability. */
export type MapItem = Quest | Unit;
export const isUnit = (x: MapItem): x is Unit => 'kind' in x;
export const itemById = (id: string): MapItem | undefined => questById.get(id) ?? unitById.get(id);
/** Map node of a quest id, act id or unit id. */
const nodeOf = (id: string) => actOf(id) ?? unitOfQuest.get(id) ?? (unitById.has(id) ? id : null);

export interface ActEdge { id: string; source: string; target: string; revealed: number }

/**
 * Act-level PREREQUISITE graph: act→act edges plus quest edges lifted to their acts.
 * `revealed` is the version order at which both ends exist.
 */
export function actGraph() {
  const acts = quests.filter((q) => q.level === 'ACT');
  const edges = new Map<string, ActEdge>();
  for (const e of questEdges) {
    if (e.relation !== 'PREREQUISITE') continue;
    const s = actOf(e.source), t = actOf(e.target);
    if (!s || !t || s === t) continue;
    const id = `${s}->${t}`;
    const revealed = versionOrder.get(e.revealed_version ?? '') ?? 0;
    const prev = edges.get(id);
    if (!prev || revealed < prev.revealed) edges.set(id, { id, source: s, target: t, revealed });
  }
  return { acts, edges: transitiveReduction([...edges.values()]) };
}

/**
 * Drop edge a→c when c is still reachable from a through other edges (a→b→…→c).
 * The lock is implied by the longer path, and dropping it removes most of the fan-out
 * from early acts. Cycles (data errors) are left as they are.
 */
function transitiveReduction(edges: ActEdge[]) {
  const out = new Map<string, string[]>();
  for (const e of edges) (out.get(e.source) ?? out.set(e.source, []).get(e.source)!).push(e.target);
  const reachableAvoiding = (from: string, to: string) => {
    const stack = (out.get(from) ?? []).filter((n) => n !== to);
    const seen = new Set(stack);
    while (stack.length) {
      const v = stack.pop()!;
      if (v === to) return true;
      for (const n of out.get(v) ?? []) if (!seen.has(n)) { seen.add(n); stack.push(n); }
    }
    return false;
  };
  return edges.filter((e) => !reachableAvoiding(e.source, e.target));
}

export type RecTier = 'strong' | 'medium' | 'light';
export const TIER_RANK: Record<RecTier, number> = { strong: 3, medium: 2, light: 1 };

export interface RecommendedEdge {
  id: string;
  source: string;
  target: string;
  basis: 'recommended' | 'llm';
  /** strong: spoils or depends on A; medium: relies on what A tells; light: reads better after A */
  tier: RecTier;
  reason_ko: string;
  /** LLM-written line. Absent until the pipeline fills it; the UI then uses recText. */
  gist_ko?: string;
  characters: string[];
  revealed: number;
  /** a person checked the LLM edge (data/manual/edge-reviews.json); infobox edges count as checked */
  reviewed: boolean;
}

/**
 * RECOMMENDED edges between map nodes (acts and units): the infobox `recommended` field lifted
 * to its act or unit, and LLM verdicts
 * checked by a second vendor (recommended-edges.json). Neither is required by the game.
 */
export function recommendedGraph() {
  const out = new Map<string, RecommendedEdge>();
  for (const e of questEdges) {
    if (e.relation !== 'RECOMMENDED') continue;
    const s = nodeOf(e.source), t = nodeOf(e.target);
    if (!s || !t || s === t) continue;
    const id = `rec:${s}->${t}`;
    out.set(id, { id, source: s, target: t, basis: 'recommended', tier: 'strong',
      reason_ko: 'Fandom 정보 상자에 권장 임무로 적혀 있습니다.', characters: [], reviewed: true,
      revealed: versionOrder.get(e.revealed_version ?? '') ?? 0 });
  }
  // edges the game already enforces were dropped when graph.json was built (scripts/build-runtime-data.mjs)
  for (const e of recommendedRaw) {
    // judged on an earlier data build; skip edges whose act or unit is no longer on the map
    if (!itemById(e.source) || !itemById(e.target)) continue;
    const id = `rec:${e.source}->${e.target}`;
    if (out.has(id)) continue; // the infobox says so already
    out.set(id, { id, source: e.source, target: e.target, basis: 'llm', tier: e.tier,
      reason_ko: e.reason_ko, gist_ko: e.gist_ko, characters: e.links, reviewed: e.review === 'verified',
      revealed: versionOrder.get(e.revealed_version) ?? 0 });
  }
  return [...out.values()];
}
interface LlmEdge { source: string; target: string; tier: RecTier; reason_ko: string; gist_ko?: string; links: string[]; revealed_version: string; review: 'unreviewed' | 'verified' }

// ---------- card figures and their images (docs/image-policy.md) ----------

export const IMAGE_NOTICE = '© All rights reserved by COGNOSPHERE. Other properties belong to their respective owners.';
export interface Figure {
  character: string;
  ko: string | null;
  /** an icon exists for the character; shown from `release` (version order) on */
  icon?: { src: string; source_url: string; fetched: string; release: number; release_version: string };
}
interface ImageFile { file: string; character: string; source_url: string; fetched: string; release_version: string }
interface FiguresData { acts: Record<string, { character: string }>; characters: Record<string, { ko: string | null }> }
/** act id → the character its card shows (scripts/images/card-figures.mjs); filled by loadData() */
export let figureOf = new Map<string, Figure>();
function buildFigures(figuresData: FiguresData, files: ImageFile[]) {
  const iconOf = new Map(files.map((f) => [f.character, f]));
  return new Map(Object.entries(figuresData.acts).map(([act, { character }]): [string, Figure] => {
    const f = iconOf.get(character);
    const release = f ? versionOrder.get(f.release_version) : undefined;
    return [act, {
      character, ko: figuresData.characters[character]?.ko ?? null,
      icon: f && release !== undefined ? {
        src: `${import.meta.env.BASE_URL}${f.file}`, source_url: f.source_url, fetched: f.fetched, release, release_version: f.release_version,
      } : undefined,
    }];
  }));
}

// The bindings above are filled once by loadData() and read by the views' top-level code.
// Re-running this module on a hot update would empty them under the views: reload the page instead.
if (import.meta.hot) import.meta.hot.accept(() => location.reload());
