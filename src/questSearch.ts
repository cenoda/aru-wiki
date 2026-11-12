// Quest search for the site's one search box (Search.tsx): acts, units (series, events…) and the
// quests in either, by Korean or English name. A quest leads to its act or unit on the quest map.
// Reads the quest data, so call it only after loadData() (App.tsx loads it before any view).
import { displayName, isUnit, type MapItem, questById, quests, unitById, UNIT_LABEL, unitOfQuest, units, versionOrder } from './data';

/** The quest map lives at `?view=quests` (the site's home is the 3D lore view). */
export const QUESTS = '?view=quests';
/** `?act=` for an act, `?unit=` for a series, event or other unit outside acts. */
export const focusUrl = (id: string | null) => (!id ? QUESTS : unitById.has(id) ? `${QUESTS}&unit=${id}` : `${QUESTS}&act=${id}`);

export interface QuestHit {
  key: string;
  name: string;
  /** the act or unit the quest map opens */
  target: string;
  /** what the hit is, or where the quest sits */
  note: string;
  /** colour class of the quest type (site.css `.t-archon` …) */
  cls: string;
  unit: boolean;
  version?: string;
}

const vOrder = (q: MapItem) => versionOrder.get(q.first_version ?? '') ?? 0;

/** Quest hits for `query` among what is released at version order `vIdx`, at most `limit`. */
export function questHits(query: string, vIdx: number, limit = 12): QuestHit[] {
  const s = query.trim().toLowerCase();
  if (!s) return [];
  const visible = (q: MapItem) => vOrder(q) <= vIdx;
  const hit = (x: { names: { en: string; ko?: string } }) =>
    (x.names.ko ?? '').toLowerCase().includes(s) || x.names.en.toLowerCase().includes(s);
  const make = (key: string, name: string, target: MapItem, note: string, rank: number, v: number) => ({
    key, name, target: target.id, note, cls: `t-${target.quest_type.toLowerCase()}`, unit: isUnit(target), version: target.first_version ?? undefined, rank, v,
  });
  const out: (QuestHit & { rank: number; v: number })[] = [];
  for (const u of units) {
    if (!visible(u) || !hit(u)) continue;
    out.push(make(u.id, displayName(u), u, u.kind === 'single' ? UNIT_LABEL.single : `${UNIT_LABEL[u.kind]} · 임무 ${u.members.length}개`, 0, vOrder(u)));
  }
  for (const q of quests) {
    if (!visible(q) || !hit(q)) continue;
    if (q.level === 'ACT') { out.push(make(q.id, displayName(q), q, '막', 0, vOrder(q))); continue; }
    const host = q.act ? questById.get(q.act) : unitById.get(unitOfQuest.get(q.id) ?? '');
    if (!host || !visible(host)) continue;
    // a single-quest unit already matched under its own name
    if (isUnit(host) && displayName(host) === displayName(q) && hit(host)) continue;
    const note = isUnit(host) ? `${UNIT_LABEL[host.kind]} 「${displayName(host)}」` : `${displayName(host)} 막`;
    out.push(make(q.id, displayName(q), host, note, 1, vOrder(q)));
  }
  return out.sort((a, b) => a.rank - b.rank || a.v - b.v).slice(0, limit).map(({ rank: _r, v: _v, ...h }) => h);
}
