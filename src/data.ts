import edgesJson from '../data/generated/quest-edges.json';
import questsJson from '../data/generated/quests.json';
import versionsJson from '../data/generated/versions.json';
import recommendedJson from '../data/generated/recommended-edges.json';

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
  sources: { url: string; revision: number }[];
}

export interface QuestEdge {
  source: string;
  target: string;
  relation: 'PREREQUISITE' | 'RECOMMENDED' | 'PART_OF';
  basis: string;
  revealed_version: string | null;
}

export interface Version { id: string; number: string; order: number; released: string; title: string }

export const versions = versionsJson as Version[];
export const quests = questsJson as Quest[];
export const questEdges = edgesJson as QuestEdge[];

export const questById = new Map(quests.map((q) => [q.id, q]));
export const versionOrder = new Map(versions.map((v) => [v.id, v.order]));

export const REGION_KO: Record<string, string> = {
  Mondstadt: '몬드', Liyue: '리월', Inazuma: '이나즈마', Sumeru: '수메르', Fontaine: '폰타인',
  Natlan: '나타', 'Nod-Krai': '나드 크라이', Snezhnaya: '스네즈나야', Other: '기타',
};

/** Korean title, or the English one. A wiki "(Act)" suffix is not part of the name. */
export const displayName = (q: Quest) => q.names.ko ?? q.names.en.replace(/ \(Act\)$/, '');

export const TYPE_LABEL: Record<QuestType, string> = {
  ARCHON: '마신', STORY: '전설', WORLD: '월드', EVENT: '이벤트',
};

/** Act of a quest, or the node itself when it is an act. */
const actOf = (id: string) => {
  const q = questById.get(id);
  return q?.level === 'ACT' ? q.id : q?.act ?? null;
};

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

export interface RecommendedEdge {
  id: string;
  source: string;
  target: string;
  basis: 'recommended' | 'llm';
  strength: 'strong' | 'weak';
  reason_ko: string;
  /** LLM-written line. Absent until the pipeline fills it; the UI then uses recText. */
  gist_ko?: string;
  characters: string[];
  revealed: number;
}

/**
 * Act-level RECOMMENDED edges: the infobox `recommended` field lifted to acts, and LLM verdicts
 * checked by a second vendor (recommended-edges.json). Neither is required by the game.
 */
export function recommendedGraph() {
  const out = new Map<string, RecommendedEdge>();
  for (const e of questEdges) {
    if (e.relation !== 'RECOMMENDED') continue;
    const s = actOf(e.source), t = actOf(e.target);
    if (!s || !t || s === t) continue;
    const id = `rec:${s}->${t}`;
    out.set(id, { id, source: s, target: t, basis: 'recommended', strength: 'strong',
      reason_ko: 'Fandom 정보 상자에 권장 임무로 적혀 있습니다.', characters: [],
      revealed: versionOrder.get(e.revealed_version ?? '') ?? 0 });
  }
  for (const e of recommendedJson as LlmEdge[]) {
    const id = `rec:${e.source}->${e.target}`;
    if (out.has(id)) continue; // the infobox says so already
    out.set(id, { id, source: e.source, target: e.target, basis: 'llm', strength: e.strength,
      reason_ko: e.reason_ko, gist_ko: e.gist_ko, characters: e.characters, revealed: versionOrder.get(e.revealed_version) ?? 0 });
  }
  return [...out.values()];
}
interface LlmEdge { source: string; target: string; strength: 'strong' | 'weak'; reason_ko: string; gist_ko?: string; characters: string[]; revealed_version: string }
