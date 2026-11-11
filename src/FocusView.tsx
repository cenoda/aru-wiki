import {
  applyNodeChanges, BaseEdge, type Edge, type EdgeProps, Handle, type Node, type NodeChange, type NodeProps, Position,
  MarkerType, ReactFlow, ReactFlowProvider, useReactFlow, useStore,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  actGraph, displayName, isUnit, itemById, type MapItem, type Quest, questEdges, recommendedGraph, type RecommendedEdge, TIER_RANK,
  type QuestType, questById, quests, REGION_KO, regionEntry, TYPE_LABEL, type Unit, unitById, UNIT_LABEL, unitOfQuest, units,
  type Version, versionOrder, versions,
} from './data';
import { recommendationGist, recommendationLead } from './recText';
import { ReportBox } from './ReportBox';
import { VersionPicker } from './VersionPicker';
import ELK, { type ElkExtendedEdge } from 'elkjs/lib/elk.bundled.js';
import './site.css';
import './focus.css';

// ---------- static graph data ----------
const { acts, edges: actEdges } = actGraph();
const questsByAct = Map.groupBy(quests.filter((q) => q.level === 'QUEST' && q.act), (q) => q.act!);
const before = new Map<string, string[]>();
const after = new Map<string, string[]>();
for (const e of actEdges) {
  (before.get(e.target) ?? before.set(e.target, []).get(e.target)!).push(e.source);
  (after.get(e.source) ?? after.set(e.source, []).get(e.source)!).push(e.target);
}
const requiredBefore = (target: string, source: string) => {
  const stack = [target], seen = new Set(stack);
  while (stack.length) {
    for (const p of before.get(stack.pop()!) ?? []) {
      if (p === source) return true;
      if (!seen.has(p)) { seen.add(p); stack.push(p); }
    }
  }
  return false;
};
const item = (id: string): MapItem => itemById(id)!;
const isAct = (id: string) => questById.get(id)?.level === 'ACT';

// ---------- quests outside acts (units: series, events, chains, single quests) ----------
/** Units hung on an act: the act the game asks for, or the act that enters the unit's region. */
const attachedTo = new Map<string, Unit[]>();
for (const u of units) for (const a of u.attach.acts) (attachedTo.get(a) ?? attachedTo.set(a, []).get(a)!).push(u);
const entryActs = new Map(Object.entries(regionEntry).map(([r, a]) => [a, r]));
/** series that lead into a series (the reverse of `next`) */
const seriesPrev = new Map<string, string[]>();
for (const u of units) for (const n of u.next ?? []) (seriesPrev.get(n) ?? seriesPrev.set(n, []).get(n)!).push(u.id);
const seriesNext = new Map(units.map((u) => [u.id, u.next ?? []]));
const KIND_RANK = { series: 0, chain: 1, event: 2, single: 3 } as const;
/** Fold order: what the game asks for first, then series before single quests, then release. */
const unitRank = (u: Unit) => [u.attach.basis === 'requirement' ? 0 : 1, KIND_RANK[u.kind], u.major ? 0 : 1] as const;
const byUnitRank = (a: Unit, b: Unit) => {
  const [x, y] = [unitRank(a), unitRank(b)];
  return x[0] - y[0] || x[1] - y[1] || x[2] - y[2] || vOrder(a) - vOrder(b) || displayName(a).localeCompare(displayName(b), 'ko');
};

// Recommended (not required) order, shown only in a focused node's branch. A recommendation
// the game already enforces says nothing new and is dropped.
const enforced = (e: RecommendedEdge) => {
  if (isAct(e.source) && isAct(e.target)) return requiredBefore(e.target, e.source);
  const u = unitById.get(e.target);
  return !!u && u.attach.basis === 'requirement' && isAct(e.source)
    && u.attach.acts.some((a) => a === e.source || requiredBefore(a, e.source));
};
const recEdges = recommendedGraph().filter((e) => (isAct(e.source) || unitById.has(e.source))
  && (isAct(e.target) || unitById.has(e.target)) && !enforced(e));
const recIn = Map.groupBy(recEdges, (e) => e.target);
const recOut = Map.groupBy(recEdges, (e) => e.source);
const START_ACT = 'act_the_outlander_who_caught_the_wind';
const TYPE_RANK: Record<QuestType, number> = { ARCHON: 0, STORY: 1, WORLD: 2, EVENT: 3 };
const vOrder = (q: MapItem) => versionOrder.get(q.first_version ?? '') ?? 0;
const typeClass = (q: MapItem) => `t-${q.quest_type.toLowerCase()}`;
const region = (q: MapItem) => REGION_KO[q.region ?? ''];

// ---------- atlas layout: one row per era (1.x … Luna … 7.x), one column per version ----------
const ROMAN: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10 };
function eraOf(v: Version) {
  const m = /^(\d+)\.(\d+)$/.exec(v.id);
  if (m) return { era: `${m[1]}.x`, col: Number(m[2]) };
  const [name, num] = v.id.split(' ');
  return { era: name, col: (ROMAN[num] ?? 1) - 1 };
}
const CARD_W = 236, CARD_H = 40, TALL_H = 56, STEP_X = 276, STEP_Y = 54, HEAD = 64, ERA_GAP = 90, VER_GAP = 30;
const LAYER_GAP = 88;
const LAYER = CARD_W + LAYER_GAP;
/** English-only titles need the whole card, on two lines when they are long. */
const cardHeight = (q: Quest) => (!q.names.ko && displayName(q).length > 22 ? TALL_H : CARD_H);

type FlowRect = { id: string; x: number; y: number; w: number; h: number };

/** How much of a card is left hanging across the viewport edge. Fully in or fully out costs nothing. */
function sliverCost(tx: number, ty: number, z: number, cards: FlowRect[], view: { w: number; h: number }, pad: number) {
  const right = view.w - pad, bottom = view.h - pad;
  let cost = 0;
  for (const n of cards) {
    const x1 = n.x * z + tx, y1 = n.y * z + ty;
    const x2 = x1 + n.w * z, y2 = y1 + n.h * z;
    const visW = Math.min(x2, right) - Math.max(x1, pad);
    const visH = Math.min(y2, bottom) - Math.max(y1, pad);
    if (visW <= 1 || visH <= 1) continue;
    const cutW = n.w * z - visW, cutH = n.h * z - visH;
    if (cutW <= 1 && cutH <= 1) continue;
    const overhang = Math.max(cutW > 1 ? Math.min(cutW, visW) : 0, cutH > 1 ? Math.min(cutH, visH) : 0);
    cost += overhang * overhang;
  }
  return cost;
}

/**
 * A card may be fully on screen or fully off it. A sliver gets pushed out; a card that is
 * mostly visible gets pulled in, unless that would push the anchor card off screen.
 * Rows disagree, so the pushes can oscillate: keep the calmest frame, not the last shove.
 */
function expelSlivers(tx: number, ty: number, z: number, cards: FlowRect[], view: { w: number; h: number }, anchorId: string, pad: number) {
  const bounds = { left: pad, top: pad, right: view.w - pad, bottom: view.h - pad };
  const anchor = cards.find((c) => c.id === anchorId);
  const anchorInside = (x: number, y: number) => {
    if (!anchor) return true;
    const x1 = anchor.x * z + x, y1 = anchor.y * z + y;
    const x2 = x1 + anchor.w * z, y2 = y1 + anchor.h * z;
    return x1 >= bounds.left - 0.5 && x2 <= bounds.right + 0.5 && y1 >= bounds.top - 0.5 && y2 <= bounds.bottom + 0.5;
  };
  let bestTx = tx, bestTy = ty, bestCost = sliverCost(tx, ty, z, cards, view, pad);
  for (let guard = 0; guard < 10; guard++) {
    let moved = false;
    for (const n of cards) {
      if (n.id === anchorId) continue;
      const x1 = n.x * z + tx, y1 = n.y * z + ty;
      const x2 = x1 + n.w * z, y2 = y1 + n.h * z;
      const visW = Math.min(x2, bounds.right) - Math.max(x1, bounds.left);
      const visH = Math.min(y2, bounds.bottom) - Math.max(y1, bounds.top);
      if (visW <= 1 || visH <= 1) continue;
      const fullW = n.w * z, fullH = n.h * z;
      if (visW >= fullW - 1 && visH >= fullH - 1) continue;
      const pull = { dx: 0, dy: 0 };
      if (x1 < bounds.left) pull.dx = bounds.left - x1;
      else if (x2 > bounds.right) pull.dx = bounds.right - x2;
      if (y1 < bounds.top) pull.dy = bounds.top - y1;
      else if (y2 > bounds.bottom) pull.dy = bounds.bottom - y2;
      const push = { dx: 0, dy: 0 };
      // One extra pixel so the card clears the viewport instead of sitting on the edge.
      if (x1 < bounds.left && x2 > bounds.left) push.dx = bounds.left - x2 - 1;
      else if (x2 > bounds.right && x1 < bounds.right) push.dx = bounds.right - x1 + 1;
      if (y1 < bounds.top && y2 > bounds.top) push.dy = bounds.top - y2 - 1;
      else if (y2 > bounds.bottom && y1 < bounds.bottom) push.dy = bounds.bottom - y1 + 1;
      const fraction = Math.min(visW / fullW, visH / fullH);
      for (const d of fraction >= 0.55 ? [pull, push] : [push, pull]) {
        if (d.dx === 0 && d.dy === 0) continue;
        if (!anchorInside(tx + d.dx, ty + d.dy)) continue;
        tx += d.dx; ty += d.dy; moved = true;
        break;
      }
    }
    if (!moved) break;
    const cost = sliverCost(tx, ty, z, cards, view, pad);
    if (cost < bestCost) { bestCost = cost; bestTx = tx; bestTy = ty; }
  }
  return { tx: bestTx, ty: bestTy };
}

type Pad = { l: number; t: number; r: number; b: number };

/** tx ranges that leave this box sliced, at a fixed zoom and vertical pan. Endpoints are the in/out boundaries. */
function slicedTx(z: number, ty: number, rect: FlowRect, view: { w: number; h: number }, pad: Pad): [number, number][] {
  const y1 = rect.y * z + ty, y2 = y1 + rect.h * z;
  if (y2 <= -1 || y1 >= view.h + 1) return [];
  const leftOut = -(rect.x + rect.w) * z - 1;
  const leftIn = -rect.x * z + pad.l;
  const rightIn = view.w - pad.r - (rect.x + rect.w) * z;
  const rightOut = view.w + 1 - rect.x * z;
  const vertIn = y1 >= pad.t && y2 <= view.h - pad.b;
  if (!vertIn) return [[leftOut, rightOut]];
  const bad: [number, number][] = [];
  if (leftOut < leftIn) bad.push([leftOut, leftIn]);
  if (rightIn < rightOut) bad.push([rightIn, rightOut]);
  return bad;
}

function gapsAfter(window: [number, number], cuts: [number, number][]): [number, number][] {
  const merged: [number, number][] = [];
  for (const [a, b] of [...cuts].sort((p, q) => p[0] - q[0] || p[1] - q[1])) {
    const last = merged.at(-1);
    if (!last || a > last[1]) merged.push([a, b]);
    else last[1] = Math.max(last[1], b);
  }
  let spans: [number, number][] = [window];
  for (const [b0, b1] of merged) {
    const next: [number, number][] = [];
    for (const [s0, s1] of spans) {
      if (b1 <= s0 || b0 >= s1) { next.push([s0, s1]); continue; }
      if (b0 > s0) next.push([s0, b0]);
      if (b1 < s1) next.push([b1, s1]);
    }
    spans = next;
    if (!spans.length) break;
  }
  return spans.filter(([a, b]) => b - a > 0.5);
}

type Placed = { z: number; tx: number; ty: number; fadeR: number; fadeB: number };

/**
 * How a frame treats the cards it cannot swallow whole. A half-visible card costs a lot.
 * A hairline, or a stub thin enough to hide in the fade, costs little. Era labels are
 * never faded: they sit on the left, and a sliced "1.x" is rejected.
 */
function edgeFit(
  z: number, tx: number, ty: number, boxes: FlowRect[], eras: FlowRect[],
  anchor: { x: number; y: number }, view: { w: number; h: number },
) {
  let harsh = 0, needR = 0, needB = 0, roomR = view.w, roomB = view.h, eraBad = false;
  const seen = (rect: FlowRect, allowFade: boolean) => {
    const x1 = rect.x * z + tx, y1 = rect.y * z + ty;
    const x2 = x1 + rect.w * z, y2 = y1 + rect.h * z;
    const visW = Math.min(x2, view.w) - Math.max(x1, 0);
    const visH = Math.min(y2, view.h) - Math.max(y1, 0);
    if (visW <= 1 || visH <= 1) return;
    const fw = rect.w * z, fh = rect.h * z;
    const cutW = fw - visW, cutH = fh - visH;
    if (cutW <= 1 && cutH <= 1) {
      roomR = Math.min(roomR, view.w - x2);
      roomB = Math.min(roomB, view.h - y2);
      return;
    }
    if (!allowFade) { eraBad = true; return; }
    const frac = Math.min(visW / fw, visH / fh);
    harsh += Math.min(frac, 1 - frac) ** 2 * Math.max(fw, fh);
    // A few pixels of the next card still read as a sliced edge. Prefer pushing that stub off.
    if (frac < 0.22 && ((cutW > 1 && visW > 2) || (cutH > 1 && visH > 2))) harsh += 12;
    if (cutW > 1) needR = Math.max(needR, frac < 0.5 ? visW + 2 : cutW + 4);
    if (cutH > 1) needB = Math.max(needB, frac < 0.5 ? visH + 2 : cutH + 4);
  };
  for (const c of boxes) seen(c, true);
  for (const e of eras) seen(e, false);
  const ax1 = anchor.x * z + tx, ay1 = anchor.y * z + ty;
  if (ax1 < 4 || ay1 < 8 || ax1 + CARD_W * z > view.w - 4 || ay1 + CARD_H * z > view.h - 8) eraBad = true;
  const fadeR = Math.min(needR, Math.max(0, roomR - 6));
  const fadeB = Math.min(needB, Math.max(0, roomB - 6));
  return { harsh, eraBad, fadeR, fadeB, uncovered: Math.max(0, needR - fadeR) + Math.max(0, needB - fadeB) };
}

/** Least-harsh frame near the preferred anchor, when no zoom can clear every card. */
function gentleFrame(
  anchor: { x: number; y: number }, cards: FlowRect[], eras: FlowRect[], vers: FlowRect[],
  view: { w: number; h: number }, preferZ: number, preferLeft: number,
): Placed | null {
  const boxes = cards.concat(vers);
  const slot: { best: (Placed & { rank: number }) | null } = { best: null };
  const consider = (z: number, left: number, top: number) => {
    const tx = left - anchor.x * z;
    const ty = top - anchor.y * z;
    const fit = edgeFit(z, tx, ty, boxes, eras, anchor, view);
    if (fit.eraBad) return;
    const drift = Math.abs(left - preferLeft) + Math.abs(z - preferZ) * 500 + Math.abs(top - 28) * 1.5;
    const rank = fit.uncovered * 1000 + fit.harsh * 10 + drift * 0.02;
    if (!slot.best || rank < slot.best.rank) slot.best = { z, tx, ty, fadeR: fit.fadeR, fadeB: fit.fadeB, rank };
  };
  const zLo = Math.round((preferZ - 0.1) * 100), zHi = Math.round((preferZ + 0.1) * 100);
  for (let zi = zLo; zi <= zHi; zi += 2) {
    const z = zi / 100;
    const topHi = Math.min(64, view.h - CARD_H * z - 8);
    for (let top = 16; top <= topHi; top += 4)
      for (let left = preferLeft - 160; left <= preferLeft + 160; left += 8) consider(z, left, top);
  }
  const seed = slot.best;
  if (!seed) return null;
  for (let zi = Math.round(seed.z * 100) - 2; zi <= Math.round(seed.z * 100) + 2; zi++) {
    const z = zi / 100;
    const top0 = anchor.y * seed.z + seed.ty;
    const left0 = anchor.x * seed.z + seed.tx;
    for (let top = top0 - 4; top <= top0 + 4; top += 2)
      for (let left = left0 - 8; left <= left0 + 8; left += 2) consider(z, left, top);
  }
  const picked = slot.best ?? seed;
  return { z: picked.z, tx: picked.tx, ty: picked.ty, fadeR: Math.ceil(picked.fadeR), fadeB: Math.ceil(picked.fadeB) };
}

/**
 * Park the atlas where the frame edge falls in a gap. Era rows do not share column
 * edges, so a single pan at the preferred zoom always slices a card on some row.
 * A nearby zoom lines the columns up with the frame. When none does, keep the
 * anchor put and fade whatever hairline is left.
 */
function readingFrame(
  anchor: { x: number; y: number },
  cards: FlowRect[],
  eras: FlowRect[],
  vers: FlowRect[],
  view: { w: number; h: number },
): Placed | null {
  const cardPad: Pad = { l: 1, t: 1, r: 1, b: 1 };
  const eraPad: Pad = { l: 14, t: 2, r: 2, b: 2 };
  const preferZ = view.w < 720 ? 0.84 : 0.94;
  const preferLeft = Math.min(260, Math.max(72, view.w * 0.22));
  let best: { z: number; tx: number; ty: number; score: number } | null = null;
  for (let zi = 72; zi <= 106; zi++) {
    const z = zi / 100;
    const topHi = Math.min(72, view.h - CARD_H * z - 8);
    if (topHi < 12) continue;
    for (let top = 12; top <= topHi; top += 2) {
      const ty = top - anchor.y * z;
      const aLo = -anchor.x * z + 4;
      const aHi = view.w - 4 - (anchor.x + CARD_W) * z;
      if (aLo > aHi) continue;
      const cuts: [number, number][] = [];
      for (const c of cards) cuts.push(...slicedTx(z, ty, c, view, cardPad));
      for (const c of vers) cuts.push(...slicedTx(z, ty, c, view, cardPad));
      for (const c of eras) cuts.push(...slicedTx(z, ty, c, view, eraPad));
      const spans = gapsAfter([aLo, aHi], cuts);
      if (!spans.length) continue;
      const want = preferLeft - anchor.x * z;
      let tx = spans[0][0], dist = Infinity;
      for (const [lo, hi] of spans) {
        const x = Math.min(hi, Math.max(lo, want));
        const d = Math.abs(x - want);
        if (d < dist) { dist = d; tx = x; }
      }
      const left = anchor.x * z + tx;
      // Sliding the opening act into the middle of a wide window is a worse reading
      // position than a soft edge. Keep the frame near the preferred anchor.
      if (Math.abs(left - preferLeft) > 160 || Math.abs(z - preferZ) > 0.1) continue;
      const score = Math.abs(z - preferZ) * 500 + Math.abs(left - preferLeft) + Math.abs(top - Math.min(28, topHi)) * 1.5;
      if (!best || score < best.score) best = { z, tx, ty, score };
    }
  }
  if (best) return { z: best.z, tx: best.tx, ty: best.ty, fadeR: 0, fadeB: 0 };
  return gentleFrame(anchor, cards, eras, vers, view, preferZ, preferLeft);
}

/** Keep the graph frame out of the info column (wide) or from under the bottom sheet (narrow). */
function applyFlowInset(stage: HTMLElement) {
  const info = stage.querySelector('.info');
  if (!info) {
    stage.style.removeProperty('--flow-left');
    stage.style.removeProperty('--flow-bottom');
    return;
  }
  const sr = stage.getBoundingClientRect();
  const ir = info.getBoundingClientRect();
  if (sr.width >= 1100) {
    stage.style.setProperty('--flow-left', `${Math.max(0, Math.round(ir.right - sr.left))}px`);
    stage.style.setProperty('--flow-bottom', '0px');
  } else {
    stage.style.setProperty('--flow-left', '0px');
    stage.style.setProperty('--flow-bottom', `${Math.max(0, Math.round(sr.bottom - ir.top))}px`);
  }
}

/** Quests of one act, prerequisite order, name as the tie break. */
const questsInAct = (() => {
  const cache = new Map<string, Quest[]>();
  return (actId: string) => {
    const hit = cache.get(actId);
    if (hit) return hit;
    const list = questsByAct.get(actId) ?? [];
    const ids = new Set(list.map((q) => q.id));
    const indeg = new Map(list.map((q) => [q.id, 0]));
    const next = new Map<string, string[]>();
    const seen = new Set<string>();
    for (const e of questEdges) {
      if (e.relation !== 'PREREQUISITE' || !ids.has(e.source) || !ids.has(e.target)) continue;
      const key = `${e.source}>${e.target}`;
      if (seen.has(key)) continue;
      seen.add(key);
      indeg.set(e.target, indeg.get(e.target)! + 1);
      (next.get(e.source) ?? next.set(e.source, []).get(e.source)!).push(e.target);
    }
    const byName = (a: Quest, b: Quest) => displayName(a).localeCompare(displayName(b), 'ko');
    const ready = list.filter((q) => !indeg.get(q.id));
    const out: Quest[] = [];
    const placed = new Set<string>();
    while (ready.length) {
      ready.sort(byName);
      const q = ready.shift()!;
      out.push(q); placed.add(q.id);
      for (const t of next.get(q.id) ?? []) {
        indeg.set(t, indeg.get(t)! - 1);
        if (indeg.get(t) === 0) ready.push(questById.get(t)!);
      }
    }
    for (const q of [...list].sort(byName)) if (!placed.has(q.id)) out.push(q);
    cache.set(actId, out);
    return out;
  };
})();

// Within a version, acts follow prerequisite order (Kahn), ties by type then name.
const topoIndex = (() => {
  const indeg = new Map(acts.map((a) => [a.id, 0]));
  for (const e of actEdges) indeg.set(e.target, (indeg.get(e.target) ?? 0) + 1);
  const key = (q: Quest) => [vOrder(q), TYPE_RANK[q.quest_type], displayName(q)] as const;
  const cmp = (a: Quest, b: Quest) => {
    const [x, y] = [key(a), key(b)];
    return x[0] - y[0] || x[1] - y[1] || x[2].localeCompare(y[2]);
  };
  let ready = acts.filter((a) => !indeg.get(a.id));
  const out = new Map<string, number>();
  while (ready.length) {
    ready.sort(cmp);
    const a = ready.shift()!;
    out.set(a.id, out.size);
    for (const t of after.get(a.id) ?? []) {
      indeg.set(t, indeg.get(t)! - 1);
      if (indeg.get(t) === 0) ready.push(questById.get(t)!);
    }
  }
  for (const a of acts) if (!out.has(a.id)) out.set(a.id, out.size); // cycles, if the data ever has one
  return out;
})();

/**
 * Storylines ("lines" on a metro map): each act continues the line of one prerequisite of the
 * same quest type whose line has not continued yet (Archon → Archon, a character's Act I → Act II).
 * Links along a line are drawn as straight horizontal track; every other prerequisite is a
 * cross link, shown only for the focused act.
 */
const lines = (() => {
  const lineOf = new Map<string, number>();
  const tail: string[] = [];
  const ordered = [...acts].sort((a, b) => topoIndex.get(a.id)! - topoIndex.get(b.id)!);
  for (const a of ordered) {
    let best: Quest | null = null, bestScore = -1;
    for (const pid of before.get(a.id) ?? []) {
      const p = questById.get(pid)!;
      if (p.quest_type !== a.quest_type || tail[lineOf.get(pid)!] !== pid) continue;
      const score = (p.region === a.region ? 2 : 0) + vOrder(p) / 1000;
      if (score > bestScore) { best = p; bestScore = score; }
    }
    const line = best ? lineOf.get(best.id)! : tail.length;
    lineOf.set(a.id, line);
    tail[line] = a.id;
  }
  // A line that runs on into the next era row is not drawn as track (it would cut across the map).
  const versionById = new Map(versions.map((v) => [v.id, v]));
  const era = (id: string) => eraOf(versionById.get(questById.get(id)!.first_version ?? '')!).era;
  const trackEdges = new Set(actEdges
    .filter((e) => lineOf.get(e.source) === lineOf.get(e.target) && era(e.source) === era(e.target))
    .map((e) => e.id));
  return { lineOf, trackEdges };
})();

/**
 * One row per era; inside a row every storyline keeps one height (its slot), so its track is a
 * horizontal line. A version column is as wide as the longest run of one line in that version.
 */
const atlas = (() => {
  const eras: { name: string; versions: Version[] }[] = [];
  for (const v of versions) {
    const { era } = eraOf(v);
    if (eras.at(-1)?.name !== era) eras.push({ name: era, versions: [] });
    eras.at(-1)!.versions.push(v);
  }
  const pos = new Map<string, { x: number; y: number }>();
  const labels: { id: string; text: string; x: number; y: number; kind: 'era' | 'ver' }[] = [];
  const byTopo = (a: Quest, b: Quest) => topoIndex.get(a.id)! - topoIndex.get(b.id)!;
  let y = 0;
  for (const era of eras) {
    labels.push({ id: `era-${era.name}`, text: era.name, x: -230, y: y + HEAD - 10, kind: 'era' });
    // x of every act in this era
    const xOf = new Map<string, number>();
    let x = 0;
    for (const v of era.versions) {
      labels.push({ id: `ver-${v.id}`, text: v.id, x, y, kind: 'ver' });
      const inVer = acts.filter((a) => a.first_version === v.id).sort(byTopo);
      const perLine = Map.groupBy(inVer, (a) => lines.lineOf.get(a.id)!);
      let width = 1;
      for (const run of perLine.values()) {
        run.forEach((a, i) => xOf.set(a.id, x + i * STEP_X));
        width = Math.max(width, run.length);
      }
      x += width * STEP_X + VER_GAP;
    }
    // pack the era's storylines into slots: Archon first, then by where they start
    const eraActs = [...xOf.keys()].map((id) => questById.get(id)!);
    const spans = [...Map.groupBy(eraActs, (a) => lines.lineOf.get(a.id)!).values()].map((run) => ({
      run,
      start: Math.min(...run.map((a) => xOf.get(a.id)!)),
      end: Math.max(...run.map((a) => xOf.get(a.id)!)) + CARD_W,
      archon: run[0].quest_type === 'ARCHON',
    })).sort((a, b) => Number(b.archon) - Number(a.archon) || a.start - b.start);
    const slotEnds: number[] = [];
    for (const s of spans) {
      let slot = slotEnds.findIndex((end) => end + 30 <= s.start);
      if (slot === -1) slot = slotEnds.length;
      slotEnds[slot] = s.end;
      for (const a of s.run) pos.set(a.id, { x: xOf.get(a.id)!, y: y + HEAD + slot * STEP_Y });
    }
    y += HEAD + slotEnds.length * STEP_Y + ERA_GAP;
  }
  return { pos, labels };
})();

type EdgeKind = 'track' | 'cross' | 'rec' | 'req' | 'region' | 'series' | 'more';
type BEdge = { id: string; source: string; target: string; kind: EdgeKind; rec?: RecommendedEdge };
type FoldBasis = 'requirement' | 'region';
type Fold = { id: string; basis: FoldBasis; hidden: number; total: number; open: boolean };
type Branch = { ids: Set<string>; edges: BEdge[]; folds: Fold[] };
/**
 * More units than FOLD_AT on one act fold into "외 N개" cards, one for the units the game
 * unlocks with this act and one for those that only need its region.
 */
const FOLD_AT = 7;
const FOLD_SHOW: Record<FoldBasis, number> = { requirement: 4, region: 3 };

/**
 * The focused node's branch.
 * Act: every act needed to reach it, its own storyline onward, the acts it unlocks directly on
 * other storylines, what it is recommended with, and the units hung on it (folded when many).
 * Unit: the acts it hangs on (with their prerequisites when the game asks for them), its series
 * before and after, and what it is recommended with.
 */
function branchOf(focus: string, visible: (q: MapItem) => boolean, isOpen: (key: string) => boolean): Branch {
  const ok = (id: string) => visible(item(id));
  const out = new Set([focus]);
  const edges: BEdge[] = [];
  const pairs = new Set<string>();
  const link = (source: string, target: string, kind: EdgeKind, rec?: RecommendedEdge) => {
    // one line per pair: a lock or a series link already says more than a recommendation
    if (pairs.has(`${source}>${target}`) || pairs.has(`${target}>${source}`)) return;
    pairs.add(`${source}>${target}`);
    edges.push({ id: `${kind}:${source}->${target}`, source, target, kind, rec });
  };
  const upAll = (from: string) => {
    const up = [from];
    while (up.length) for (const p of before.get(up.pop()!) ?? []) if (ok(p) && !out.has(p)) { out.add(p); up.push(p); }
  };
  const recs = [
    ...(recIn.get(focus) ?? []).filter((r) => ok(r.source)),
    ...(recOut.get(focus) ?? []).filter((r) => ok(r.target)),
  ];
  const folds: Fold[] = [];

  if (isAct(focus)) {
    for (const r of recs) out.add(r.source === focus ? r.target : r.source);
    upAll(focus);
    const line = lines.lineOf.get(focus);
    const down = [focus];
    while (down.length) {
      const v = down.pop()!;
      for (const c of after.get(v) ?? []) {
        if (!ok(c) || out.has(c)) continue;
        if (lines.lineOf.get(c) === line) { out.add(c); down.push(c); }
        else if (v === focus) out.add(c);
      }
    }
    const hung = (attachedTo.get(focus) ?? []).filter((u) => visible(u) && !out.has(u.id)).sort(byUnitRank);
    const fold = hung.length > FOLD_AT;
    for (const basis of ['requirement', 'region'] as const) {
      const group = hung.filter((u) => u.attach.basis === basis);
      const id = `more:${focus}:${basis}`;
      const open = isOpen(id);
      const cut = fold && group.length > FOLD_SHOW[basis] + 1;
      for (const u of cut && !open ? group.slice(0, FOLD_SHOW[basis]) : group) out.add(u.id);
      if (!cut) continue;
      folds.push({ id, basis, hidden: group.length - FOLD_SHOW[basis], total: group.length, open });
      out.add(id);
    }
  } else {
    const u = unitById.get(focus)!;
    for (const a of u.attach.acts) {
      if (!ok(a)) continue;
      out.add(a);
      if (u.attach.basis === 'requirement') upAll(a);
    }
    for (const map of [seriesPrev, seriesNext]) {
      const walk = [focus];
      while (walk.length) for (const n of map.get(walk.pop()!) ?? []) if (ok(n) && !out.has(n)) { out.add(n); walk.push(n); }
    }
    for (const r of recs) out.add(r.source === focus ? r.target : r.source);
  }

  // required act links inside the branch
  for (const e of actEdges) {
    if (!out.has(e.source) || !out.has(e.target)) continue;
    link(e.source, e.target, lines.lineOf.get(e.source) === lines.lineOf.get(e.target) ? 'track' : 'cross');
  }
  // series order, then where each unit hangs, then recommendations
  // In an act's branch the units form one column after it; series order between them would
  // stagger that column and send its links across cards. A unit's own branch shows it.
  if (!isAct(focus)) for (const id of out) for (const n of unitById.get(id)?.next ?? []) if (out.has(n)) link(id, n, 'series');
  // Where each unit hangs, only where the focus is one end: a unit that came in through a
  // recommendation stays beside the focus, not pulled back to an early act it also hangs on.
  // A lock outranks a recommendation; a recommendation outranks "after the region".
  const hosts = [...out].flatMap((id) => {
    const u = unitById.get(id);
    return u ? u.attach.acts.filter((a) => out.has(a) && (id === focus || a === focus)).map((a) => ({ a, u })) : [];
  });
  for (const { a, u } of hosts) if (u.attach.basis === 'requirement') link(a, u.id, 'req');
  for (const r of recs) link(r.source, r.target, 'rec', r);
  for (const { a, u } of hosts) if (u.attach.basis === 'region') link(a, u.id, 'region');
  for (const f of folds) link(focus, f.id, f.basis === 'requirement' ? 'req' : 'more');
  return { ids: out, edges, folds };
}

const elk = new ELK();
type Pt = { x: number; y: number; h: number };
type XY = { x: number; y: number };
type BranchLayout = { pos: Map<string, Pt>; routes: Map<string, XY[]> };

const UNIT_H = 56, UNIT_TALL_H = 72;
const unitHeight = (u: Unit) => (!u.names.ko && displayName(u).length > 22 ? UNIT_TALL_H : UNIT_H);
const nodeHeight = (id: string) => {
  if (id.startsWith('more:')) return CARD_H;
  const u = unitById.get(id);
  return u ? unitHeight(u) : cardHeight(questById.get(id)!);
};
/**
 * Model order for ELK: acts by prerequisite order, a unit just after the act it hangs on
 * (required ones before region-only ones), each fold card after the units it folds.
 */
const modelOrder = (id: string) => {
  const fold = /^more:(.+):(requirement|region)$/.exec(id);
  if (fold) return (topoIndex.get(fold[1]) ?? acts.length) + (fold[2] === 'requirement' ? 0.69 : 0.99);
  const u = unitById.get(id);
  if (!u) return topoIndex.get(id)!;
  const host = Math.max(-1, ...u.attach.acts.map((a) => topoIndex.get(a) ?? -1));
  return (host >= 0 ? host : acts.length) + (u.attach.basis === 'region' ? 0.7 : 0.4) + vOrder(u) / 1000;
};

async function layoutBranch(branch: Branch, focus: string) {
  const list = [...branch.ids].sort((a, b) => modelOrder(a) - modelOrder(b));
  const res = await elk.layout({
    id: 'branch',
    layoutOptions: {
      'elk.algorithm': 'layered', 'elk.direction': 'RIGHT',
      'elk.layered.spacing.nodeNodeBetweenLayers': String(LAYER_GAP), 'elk.spacing.nodeNode': '28',
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
      'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
      // Keep a column in model order: required units, their fold, then region-only ones.
      'elk.layered.crossingMinimization.forceNodeModelOrder': 'true',
    },
    children: list.map((id) => ({ id, width: CARD_W, height: nodeHeight(id) })),
    edges: branch.edges.map((e) => ({
      id: e.id, sources: [e.source], targets: [e.target],
      ...(e.kind === 'track' || e.kind === 'series' ? { layoutOptions: { 'elk.layered.priority.straightness': '20' } } : {}),
    })),
  });
  // Re-anchor so the focused act keeps its atlas position: the branch unfolds around it.
  // A unit has no atlas position; it unfolds around the act it hangs on.
  const anchorId = atlas.pos.has(focus) ? focus : unitById.get(focus)!.attach.acts.find((a) => atlas.pos.has(a) && branch.ids.has(a));
  const f = res.children!.find((c) => c.id === anchorId) ?? res.children!.find((c) => c.id === focus)!;
  const home = anchorId ? atlas.pos.get(anchorId)! : { x: 0, y: 0 };
  const dx = home.x - f.x!, dy = home.y - f.y!;
  const pos = new Map(res.children!.map((c) => [c.id, { x: c.x! + dx, y: c.y! + dy, h: nodeHeight(c.id) }]));
  // ELK's own orthogonal routes: a link that spans several columns goes around the cards in between.
  const routes = new Map<string, XY[]>();
  for (const e of (res.edges ?? []) as ElkExtendedEdge[]) {
    const sec = e.sections?.[0];
    if (!sec) continue;
    routes.set(e.id, [sec.startPoint, ...(sec.bendPoints ?? []), sec.endPoint].map((p) => ({ x: p.x + dx, y: p.y + dy })));
  }
  return { pos, routes } satisfies BranchLayout;
}

/** `?act=` for an act, `?unit=` for a series, event or other unit outside acts. */
const focusFromUrl = () => {
  const p = new URLSearchParams(location.search);
  const a = p.get('act'), u = p.get('unit');
  if (a && isAct(a)) return a;
  if (u && unitById.has(u)) return u;
  return null;
};
const focusUrl = (id: string | null) => (!id ? './' : unitById.has(id) ? `?unit=${id}` : `?act=${id}`);

function Logo() {
  return (
    // Same drawing as public/logo.svg (the favicon), with the empty margin cropped for the header.
    <svg viewBox="76 54 360 390" aria-hidden="true">
      <path d="M195 64H317L256 138Z" fill="#22B6EE" />
      <path d="M256 64H317L256 138Z" fill="#057FCB" />
      <path d="M256 160 86 434 192 375 256 267Z" fill="#59D9FF" />
      <path d="M256 160 256 267 320 375 426 434Z" fill="#149DE9" />
      <path d="M86 434H426L320 375H192Z" fill="#2578BD" />
    </svg>
  );
}

export default function FocusView() {
  return <ReactFlowProvider><Atlas /></ReactFlowProvider>;
}

function Atlas() {
  const [focus, setFocus] = useState<string | null>(focusFromUrl);
  const [vIdx, setVIdx] = useState(versions.length - 1);
  const [query, setQuery] = useState('');
  /** Folded unit groups ("외 N개") the reader has opened. */
  const [opened, setOpened] = useState<ReadonlySet<string>>(() => new Set());
  const flow = useReactFlow();
  const zoom = useStore((s) => s.transform[2]);
  const visible = useCallback((q: MapItem) => vOrder(q) <= vIdx, [vIdx]);

  useEffect(() => {
    const onPop = () => setFocus(focusFromUrl());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const select = useCallback((id: string | null) => {
    if (id === focus) return;
    window.history.pushState(null, '', focusUrl(id));
    setFocus(id);
    setQuery('');
  }, [focus]);

  // A focused node that is not released in the chosen version is deselected (back to the atlas).
  useEffect(() => {
    if (focus && !visible(item(focus))) {
      window.history.replaceState(null, '', './');
      setFocus(null);
    }
  }, [focus, visible]);

  const neighbours = useMemo(() => {
    if (!focus) return null;
    const keep = (ids: string[] = []) => ids.filter((id) => visible(item(id)));
    const byTier = (a: RecommendedEdge, b: RecommendedEdge) => TIER_RANK[b.tier] - TIER_RANK[a.tier];
    return {
      before: keep(before.get(focus)), after: keep(after.get(focus)),
      recommended: (recIn.get(focus) ?? []).filter((r) => visible(item(r.source))).sort(byTier),
      leadsTo: (recOut.get(focus) ?? []).filter((r) => visible(item(r.target))).sort(byTier),
      hung: (attachedTo.get(focus) ?? []).filter(visible).sort(byUnitRank),
      seriesBefore: keep(seriesPrev.get(focus)), seriesAfter: keep(seriesNext.get(focus)),
    };
  }, [focus, visible]);

  // ---------- branch of the focused node, laid out on its own ----------
  const branch = useMemo(() => (focus ? branchOf(focus, visible, (k) => opened.has(k)) : null), [focus, visible, opened]);
  // The layout is tagged with the branch it was made for, so a stale one is never used
  // while the next branch is still being laid out.
  const [layout, setLayout] = useState<{ branch: Branch } & BranchLayout | null>(null);
  useEffect(() => {
    let live = true;
    if (branch) layoutBranch(branch, focus!).then((l) => { if (live) setLayout({ branch, ...l }); });
    return () => { live = false; };
  }, [branch, focus]);
  const branchPos = layout && layout.branch === branch ? layout.pos : null;
  const routes = layout && layout.branch === branch ? layout.routes : null;
  const inBranch = !!focus && !!branchPos;

  // ---------- nodes: atlas positions, or branch positions while a node is focused ----------
  const [nodes, setNodes] = useState<Node[]>([]);
  useEffect(() => {
    if (focus && !branchPos) return; // wait for the branch layout, keep the current frame
    if (inBranch) {
      setNodes([...branchPos!.entries()].map(([id, at]): Node => {
        const state = id === focus ? 'focus' : '';
        const base = { id, width: CARD_W, height: at.h, position: { x: at.x, y: at.y } };
        const fold = branch!.folds.find((f) => f.id === id);
        if (fold) return { ...base, type: 'more', data: fold };
        const u = unitById.get(id);
        if (u) return { ...base, type: 'unit', data: { unit: u, state } };
        const a = questById.get(id)!;
        return { ...base, type: 'act', data: { quest: a, state, showVersion: !!a.names.ko, tall: at.h > CARD_H, opens: 0 } };
      }));
      return;
    }
    const actNodes: Node[] = acts.filter(visible).map((a) => ({
      id: a.id, type: 'act', width: CARD_W, height: CARD_H,
      position: atlas.pos.get(a.id)!,
      data: {
        quest: a, state: '', showVersion: false, tall: false,
        opens: (attachedTo.get(a.id) ?? []).filter(visible).length, entry: entryActs.get(a.id),
      },
    }));
    const labelNodes: Node[] = atlas.labels
      .filter((l) => l.kind === 'era' || versionOrder.get(l.text)! <= vIdx)
      .map((l) => ({ id: l.id, type: 'label', position: { x: l.x, y: l.y }, selectable: false, data: l }));
    setNodes([...labelNodes, ...actNodes]);
  }, [visible, focus, vIdx, branch, branchPos, inBranch]);

  // Atlas: storyline track only. Branch: every link inside the branch.
  const edges: Edge[] = useMemo(() => {
    const arrow = (color: string, size = 14) => ({ type: MarkerType.ArrowClosed, width: size, height: size, color });
    if (inBranch) {
      return branch!.edges.map((e): Edge => {
        const hot = e.source === focus || e.target === focus ? ' hot' : '';
        // a fold card takes the colour of the act it hangs on
        const target = item(e.target.startsWith('more:') ? e.source : e.target);
        const base = { id: e.id, source: e.source, target: e.target, type: 'route', data: { points: routes?.get(e.id) } };
        switch (e.kind) {
          case 'rec': return { ...base, className: `rec ${e.rec!.tier}`, markerEnd: arrow('var(--rec)') };
          case 'region': case 'more': return { ...base, className: 'region', markerEnd: arrow('var(--muted)', 12) };
          case 'req': return { ...base, className: `${typeClass(target)} cross attach${hot}`, markerEnd: arrow('var(--arrow)') };
          case 'series': return { ...base, className: `${typeClass(target)} track${hot}`, markerEnd: arrow('var(--arrow)') };
          default: return { ...base, className: `${typeClass(target)} ${e.kind}${hot}`, markerEnd: arrow('var(--arrow)') };
        }
      });
    }
    return actEdges
      .filter((e) => lines.trackEdges.has(e.id) && visible(item(e.source)) && visible(item(e.target)))
      .map((e) => ({
        id: e.id, source: e.source, target: e.target, type: 'straight',
        className: `${typeClass(item(e.target))} track`, markerEnd: arrow('var(--arrow)', 11),
      }));
  }, [focus, visible, inBranch, branch, routes]);

  // ---------- camera ----------
  // The graph frame is already inset away from the info card. Frame one or two columns
  // of the branch inside that rectangle, and don't leave a card cut in half.
  const frameBranch = useCallback((duration: number) => {
    if (!focus || !branchPos) return;
    const stageEl = document.querySelector('.stage') as HTMLElement | null;
    const frameEl = stageEl?.querySelector('.flow-frame');
    if (!stageEl || !frameEl) return;
    stageEl.classList.remove('soft-edge');
    applyFlowInset(stageEl);
    const stage = stageEl.getBoundingClientRect();
    const frame = frameEl.getBoundingClientRect();
    if (frame.width < 40 || frame.height < 40) return;
    const sheet = stage.width < 1100;
    const PAD = 20;
    const innerW = Math.max(160, frame.width - PAD * 2);
    const innerH = Math.max(140, frame.height - PAD * 2);
    const cards: FlowRect[] = [...branchPos.entries()].map(([id, p]) => ({ id, x: p.x, y: p.y, w: CARD_W, h: p.h }));
    const f = branchPos.get(focus)!;
    const PREFER_Z = 0.92;
    // Two columns of prerequisites plus the next act. Below COLUMN_Z the label is
    // hard to read, so the extra column stays off to the side. The sheet (under
    // 1100px) asks for 0.8: an iPad portrait (~820px) otherwise keeps both columns
    // and the card text lands near 9px. Wider screens keep the longer chain.
    const MIN_Z = 0.64;
    const COLUMN_Z = sheet ? 0.8 : MIN_Z;
    const spanOf = (group: FlowRect[]) => {
      const minX = Math.min(...group.map((p) => p.x));
      const maxX = Math.max(...group.map((p) => p.x + p.w));
      const minY = Math.min(...group.map((p) => p.y));
      const maxY = Math.max(...group.map((p) => p.y + p.h));
      return { minX, maxX, minY, maxY, w: maxX - minX, h: maxY - minY };
    };
    const around = (layersLeft: number) => cards.filter((p) => p.x >= f.x - layersLeft * LAYER - 48 && p.x <= f.x + LAYER + 48);
    // A tall column of units must not shrink the text: past READ_Z the column runs off the
    // frame and the camera centres on the focus instead.
    const READ_Z = sheet ? 0.8 : 0.78;
    const zoomFor = (box: { w: number; h: number }) => Math.min(PREFER_Z, innerW / box.w, Math.max(innerH / box.h, READ_Z));
    let group = around(2);
    let z = zoomFor(spanOf(group));
    if (z < COLUMN_Z) {
      group = around(1);
      z = zoomFor(spanOf(group));
    }
    z = Math.max(MIN_Z, Math.min(PREFER_Z, z));
    const box = spanOf(group);
    let tx = PAD + (innerW - box.w * z) / 2 - box.minX * z;
    let ty = PAD + (innerH - box.h * z) / 2 - box.minY * z;
    if (box.minX * z + tx < PAD) tx += PAD - (box.minX * z + tx);
    if (box.maxX * z + tx > frame.width - PAD) tx -= box.maxX * z + tx - (frame.width - PAD);
    if (box.h * z > innerH) {
      // centre the focus, but never leave empty space past either end of the column
      ty = PAD + innerH / 2 - (f.y + f.h / 2) * z;
      ty = Math.min(ty, PAD - box.minY * z);
      ty = Math.max(ty, frame.height - PAD - box.maxY * z);
    } else {
      if (box.minY * z + ty < PAD) ty += PAD - (box.minY * z + ty);
      if (box.maxY * z + ty > frame.height - PAD) ty -= box.maxY * z + ty - (frame.height - PAD);
    }
    ({ tx, ty } = expelSlivers(tx, ty, z, cards, { w: frame.width, h: frame.height }, focus, 0));
    flow.setViewport({ x: tx, y: ty, zoom: z }, { duration });
  }, [focus, branchPos, flow]);

  // Atlas at reading size, anchored on an act. Prefer a zoom where no card is cut in half.
  // When the rows will not line up, fall back to pushing slivers out and fade the cut.
  const frameAtlasAt = useCallback((id: string, duration: number) => {
    const p = atlas.pos.get(id);
    const stageEl = document.querySelector('.stage') as HTMLElement | null;
    if (!p || !stageEl) return;
    stageEl.style.removeProperty('--flow-left');
    stageEl.style.removeProperty('--flow-bottom');
    const frame = stageEl.querySelector('.flow-frame')!.getBoundingClientRect();
    if (frame.width < 40 || frame.height < 40) return;
    const cards: FlowRect[] = acts.filter(visible).map((a) => {
      const at = atlas.pos.get(a.id)!;
      return { id: a.id, x: at.x, y: at.y, w: CARD_W, h: CARD_H };
    });
    const eras: FlowRect[] = [];
    const vers: FlowRect[] = [];
    for (const l of atlas.labels) {
      if (l.kind === 'ver' && (versionOrder.get(l.text) ?? Infinity) > vIdx) continue;
      const box = l.kind === 'era'
        ? { w: 200, h: 78 }
        : { w: Math.max(36, l.text.length * 13), h: 34 };
      (l.kind === 'era' ? eras : vers).push({ id: l.id, x: l.x, y: l.y, ...box });
    }
    const view = { w: frame.width, h: frame.height };
    const placed = readingFrame(p, cards, eras, vers, view);
    const fade = !placed || placed.fadeR > 1 || placed.fadeB > 1;
    stageEl.classList.toggle('soft-edge', fade);
    stageEl.style.setProperty('--fade-r', `${placed?.fadeR ?? 36}px`);
    stageEl.style.setProperty('--fade-b', `${placed?.fadeB ?? 16}px`);
    if (placed) {
      flow.setViewport({ x: placed.tx, y: placed.ty, zoom: placed.z }, { duration });
      return;
    }
    // Nothing near the opening act keeps the era label whole. Hold the preferred frame.
    const z = view.w < 720 ? 0.84 : 0.94;
    const left = Math.min(260, Math.max(72, view.w * 0.22));
    flow.setViewport({ x: left - p.x * z, y: 28 - p.y * z, zoom: z }, { duration });
  }, [flow, visible, vIdx]);

  const fitAll = useCallback(() => flow.fitView({ padding: 0.04, duration: 500 }), [flow]);

  const lastFocus = useRef<string | null>(null);
  const firstFrame = useRef(true);
  const wantFit = useRef(false);
  /**
   * A fold card was opened or closed. The camera keeps its zoom and column: opening scrolls to
   * the first unit of the opened group, closing leaves the fold card where it was on screen.
   */
  const keepFrame = useRef<{ id: string; opening: boolean; screenX: number; screenY: number } | null>(null);
  useEffect(() => {
    if (focus) document.querySelector('.stage')?.classList.remove('soft-edge');
    if (focus && !branchPos) return;
    const kept = keepFrame.current;
    keepFrame.current = null;
    if (kept && focus && focus === lastFocus.current && branchPos) {
      const vp = flow.getViewport();
      const basis = kept.id.endsWith(':region') ? 'region' : 'requirement';
      const group = (attachedTo.get(focus) ?? []).filter((u) => u.attach.basis === basis && branchPos.has(u.id));
      const fold = branchPos.get(kept.id);
      const y = kept.opening && group.length ? Math.min(...group.map((u) => branchPos.get(u.id)!.y)) : fold?.y;
      // the column can move sideways when its links need more room: keep it under the reader
      const x = fold ? kept.screenX - fold.x * vp.zoom : vp.x;
      if (y !== undefined) flow.setViewport({ zoom: vp.zoom, x, y: (kept.opening ? 24 : kept.screenY) - y * vp.zoom }, { duration: 350 });
      return;
    }
    const t = setTimeout(() => {
      if (focus) frameBranch(firstFrame.current ? 0 : 550);
      else if (wantFit.current) fitAll();
      else {
        // back to where the reader was, unless that act is hidden in the chosen version
        // a unit has no atlas card: go back to the act it hangs on
        const last = lastFocus.current && (unitById.get(lastFocus.current)?.attach.acts[0] ?? lastFocus.current);
        const back = last && atlas.pos.has(last) && visible(item(last)) ? last : START_ACT;
        frameAtlasAt(back, firstFrame.current ? 0 : 500);
      }
      wantFit.current = false;
      firstFrame.current = false;
      lastFocus.current = focus;
    }, 60);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus, branchPos]);

  // Refit when the window changes, or when the info card grows (the reason text opens).
  useEffect(() => {
    const stage = document.querySelector('.stage') as HTMLElement | null;
    if (!stage) return;
    let t: ReturnType<typeof setTimeout>;
    const apply = () => {
      if (!focus) {
        stage.style.removeProperty('--flow-left');
        stage.style.removeProperty('--flow-bottom');
        return;
      }
      applyFlowInset(stage);
    };
    const refit = () => {
      apply();
      clearTimeout(t);
      t = setTimeout(() => { if (focus) frameBranch(0); }, 150);
    };
    apply();
    window.addEventListener('resize', refit);
    // The observer reports once on observe. That is not a resize: the frame effect already
    // placed the camera, and a fold toggle must leave it where the reader is.
    let primed = false;
    const watch = new ResizeObserver(() => { if (primed) refit(); primed = true; });
    watch.observe(stage);
    const card = document.querySelector('.site .info');
    if (card) watch.observe(card);
    return () => {
      window.removeEventListener('resize', refit);
      watch.disconnect();
      clearTimeout(t);
      stage.style.removeProperty('--flow-left');
      stage.style.removeProperty('--flow-bottom');
    };
  }, [frameBranch, focus]);

  const onNodesChange = useCallback((c: NodeChange[]) => setNodes((ns) => applyNodeChanges(c, ns)), []);

  // Graph bounds for elastic pan recovery: the current branch, or the visible atlas.
  const bounds = useMemo(() => {
    if (inBranch && branchPos) {
      const pts = [...branchPos.values()];
      return {
        minX: Math.min(...pts.map((p) => p.x)),
        maxX: Math.max(...pts.map((p) => p.x + CARD_W)),
        minY: Math.min(...pts.map((p) => p.y)),
        maxY: Math.max(...pts.map((p) => p.y + p.h)),
      };
    }
    const visActs = acts.filter(visible);
    const visLabels = atlas.labels.filter((l) => l.kind === 'era' || versionOrder.get(l.text)! <= vIdx);
    return {
      minX: Math.min(-230, ...visActs.map((a) => atlas.pos.get(a.id)!.x)),
      maxX: Math.max(...visActs.map((a) => atlas.pos.get(a.id)!.x + CARD_W)),
      minY: Math.min(0, ...visLabels.map((l) => l.y)),
      maxY: Math.max(
        ...visActs.map((a) => atlas.pos.get(a.id)!.y + CARD_H + 40),
        ...visLabels.map((l) => l.y + (l.kind === 'era' ? 78 : 34)),
      ),
    };
  }, [inBranch, branchPos, visible, vIdx]);

  // Spring back into view when a reader-initiated pan or zoom drags the graph past the frame margin.
  const onMoveEnd = useCallback((event: MouseEvent | TouchEvent | null, vp: { x: number; y: number; zoom: number }) => {
    if (!event) return;
    const frame = document.querySelector('.stage .flow-frame')?.getBoundingClientRect();
    if (!frame || frame.width < 40 || frame.height < 40) return;
    const z = vp.zoom;
    const keepX = Math.min(220, frame.width * 0.35);
    const keepTop = Math.min(80, frame.height * 0.2);
    const keepBottom = Math.min(140, frame.height * 0.25);
    const minTx = keepX - bounds.maxX * z;
    const maxTx = frame.width - keepX - bounds.minX * z;
    const minTy = keepTop - bounds.maxY * z;
    const maxTy = frame.height - keepBottom - bounds.minY * z;
    const x = Math.max(minTx, Math.min(maxTx, vp.x));
    const y = Math.max(minTy, Math.min(maxTy, vp.y));
    if (Math.abs(x - vp.x) > 1 || Math.abs(y - vp.y) > 1) {
      flow.setViewport({ x, y, zoom: z }, { duration: 280 });
    }
  }, [bounds, flow]);

  // Acts, units (series, events…) and the quests in either. A quest leads to its act or unit.
  const results = useMemo(() => {
    const s = query.trim().toLowerCase();
    if (!s) return [];
    const hit = (x: { names: { en: string; ko?: string } }) =>
      (x.names.ko ?? '').toLowerCase().includes(s) || x.names.en.toLowerCase().includes(s);
    type Hit = { key: string; name: string; target: MapItem; note: string; rank: number; v: number };
    const out: Hit[] = [];
    for (const u of units) {
      if (!visible(u) || !hit(u)) continue;
      out.push({ key: u.id, name: displayName(u), target: u, note: `${UNIT_LABEL[u.kind]} · 임무 ${u.members.length}개`, rank: 0, v: vOrder(u) });
    }
    for (const q of quests) {
      if (!visible(q) || !hit(q)) continue;
      if (q.level === 'ACT') { out.push({ key: q.id, name: displayName(q), target: q, note: '', rank: 0, v: vOrder(q) }); continue; }
      const host = q.act ? questById.get(q.act) : unitById.get(unitOfQuest.get(q.id) ?? '');
      if (!host || !visible(host)) continue;
      // a single-quest unit already matched under its own name
      if (isUnit(host) && displayName(host) === displayName(q) && hit(host)) continue;
      const note = isUnit(host) ? `${UNIT_LABEL[host.kind]} 「${displayName(host)}」` : `${displayName(host)} 막`;
      out.push({ key: q.id, name: displayName(q), target: host, note, rank: 1, v: vOrder(q) });
    }
    return out.sort((a, b) => a.rank - b.rank || a.v - b.v).slice(0, 12);
  }, [query, visible]);

  const sel = focus ? item(focus) : null;
  const zoomClass = zoom < 0.45 ? 'far' : zoom < 0.75 ? 'mid' : 'near';

  return (
    <div className="site graph-page">
      <div className="wrap">
        <header>
          <a className="logo" href="./" onClick={(e) => { e.preventDefault(); select(null); }}><Logo />aru.wiki</a>
          <form className="find" onSubmit={(e) => { e.preventDefault(); if (results[0]) select(results[0].target.id); }}>
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Escape') { setQuery(''); e.currentTarget.blur(); } }}
              placeholder="막·시리즈·이벤트·임무 이름 검색" />
            {query.trim() && (results.length > 0 ? (
              <ul>
                {results.map((r) => (
                  <li key={r.key}><button type="button" className={`${typeClass(r.target)}${isUnit(r.target) ? ' unit' : ''}`} onClick={() => select(r.target.id)}>
                    <i className="dot" />
                    <span className="hit">{r.name}{r.note && <em>{r.note}</em>}</span>
                    <small>{r.target.first_version}</small>
                  </button></li>
                ))}
              </ul>
            ) : <ul><li className="empty">없는 이름입니다</li></ul>)}
          </form>
          <div className="legend" aria-label="범례">
            <span className="t-archon"><i />마신</span><span className="t-story"><i />전설</span>
            <span className="t-world"><i />월드</span><span className="t-event"><i />이벤트</span>
            <span className="ln solid">같은 이야기</span><span className="ln dashed">다른 흐름</span>
            {focus && <span className="ln rec">권장</span>}
            {focus && <span className="ln loose">지역 도착 이후</span>}
            <span className="hint">카드를 누르면 갈래 · 끌어서 이동</span>
          </div>
          <nav>
            <VersionPicker order={vIdx} onChange={setVIdx} />
            {!focus && zoom < 0.45 ? (
              <button type="button" className="band" onClick={() => {
                const st = document.querySelector('.flow-frame')!.getBoundingClientRect();
                const c = flow.screenToFlowPosition({ x: st.left + st.width / 2, y: st.top + st.height / 2 });
                let best = START_ACT, bestD = Infinity;
                for (const a of acts) {
                  if (!visible(a)) continue;
                  const p = atlas.pos.get(a.id)!;
                  const d = (p.x + CARD_W / 2 - c.x) ** 2 + (p.y + CARD_H / 2 - c.y) ** 2;
                  if (d < bestD) { bestD = d; best = a.id; }
                }
                frameAtlasAt(best, 450);
              }}>읽기 크기로</button>
            ) : (
              <button type="button" className="band" onClick={() => { if (focus) { wantFit.current = true; select(null); } else fitAll(); }}>전체 보기</button>
            )}
          </nav>
        </header>
      </div>

      <main className={`stage ${zoomClass}${focus ? ' focusing' : ''}`}>
        <div className="flow-frame">
          <ReactFlow
            nodes={nodes} edges={edges} nodeTypes={nodeTypes} edgeTypes={edgeTypes} onNodesChange={onNodesChange}
            onNodeClick={(_, n) => {
              if (n.type === 'more') {
                const vp = flow.getViewport();
                keepFrame.current = {
                  id: n.id, opening: !opened.has(n.id),
                  screenX: n.position.x * vp.zoom + vp.x, screenY: n.position.y * vp.zoom + vp.y,
                };
              }
              if (n.type === 'more') setOpened((o) => {
                const next = new Set(o);
                if (!next.delete(n.id)) next.add(n.id);
                return next;
              });
              else if (n.type === 'act' || n.type === 'unit') select(n.id === focus ? null : n.id);
            }}
            onPaneClick={() => select(null)}
            onMoveEnd={onMoveEnd}
            nodesDraggable={false} nodesConnectable={false} minZoom={0.08} maxZoom={2} proOptions={{ hideAttribution: true }}
            onlyRenderVisibleElements
          />
        </div>

        {sel && neighbours && (
          <aside className={`info ${typeClass(sel)}`}>
            <div className="tags">
              {isUnit(sel) && <span className="tag unit-tag">{UNIT_LABEL[sel.kind]}</span>}
              {(!isUnit(sel) || UNIT_LABEL[sel.kind] !== TYPE_LABEL[sel.quest_type]) && <span className="tag">{TYPE_LABEL[sel.quest_type]}</span>}
              {region(sel) && <span className="tag neutral">{region(sel)}</span>}
              <span className="tag neutral">{sel.first_version ?? '버전 미상'}</span>
              {!sel.replayable && <span className="badge">다시 플레이 불가</span>}
            </div>
            <div className="name">{displayName(sel)}</div>
            {sel.names.ko && <div className="en">{sel.names.en.replace(/ \(Act\)$/, '')}</div>}
            {isUnit(sel) ? (
              <UnitLinks unit={sel} before={neighbours.seriesBefore} after={neighbours.seriesAfter} visible={visible} go={select} />
            ) : (
              <LinkGroups focus={sel.id} before={neighbours.before} after={neighbours.after} go={select} />
            )}
            {neighbours.recommended.length > 0 && (
              <Recs edges={neighbours.recommended} targetName={displayName(sel)} go={select} />
            )}
            {neighbours.leadsTo.length > 0 && <RecsOut edges={neighbours.leadsTo} go={select} />}
            {!isUnit(sel) && neighbours.hung.length > 0 && (
              <HungUnits key={sel.id} list={neighbours.hung} entry={entryActs.get(sel.id)} go={select} />
            )}
            {isUnit(sel) ? <UnitQuests unit={sel} /> : <ActQuests actId={sel.id} />}
            <ReportBox nodeId={sel.id} version={versions.find((v) => v.order === vIdx)?.id ?? ''} />
          </aside>
        )}
      </main>
    </div>
  );
}

function sameLine(a: string, b: string) {
  return lines.lineOf.get(a) === lines.lineOf.get(b);
}

function LinkGroups({ focus, before, after, go }: { focus: string; before: string[]; after: string[]; go: (id: string) => void }) {
  const groups = [
    { title: '이 이야기의 앞', ids: before.filter((id) => sameLine(focus, id)), dir: 'before' as const },
    { title: '다른 흐름에서 필요', ids: before.filter((id) => !sameLine(focus, id)), dir: 'before' as const },
    { title: '이 이야기의 다음', ids: after.filter((id) => sameLine(focus, id)), dir: 'after' as const },
    { title: '여기서 열리는 다른 흐름', ids: after.filter((id) => !sameLine(focus, id)), dir: 'after' as const },
  ].filter((g) => g.ids.length);
  if (!groups.length) return null;
  return groups.map((g) => (
    <div className="jump-group" key={g.title}>
      <h3>{g.title}</h3>
      <div className="jumps">
        {g.ids.map((id) => <Jump key={id} id={id} dir={g.dir} go={go} />)}
      </div>
    </div>
  ));
}

function ActQuests({ actId }: { actId: string }) {
  const list = questsInAct(actId);
  if (!list.length) return null;
  return (
    <section className="act-quests">
      <h3>이 막의 임무</h3>
      <ul>
        {list.map((q) => <li key={q.id}>{displayName(q)}</li>)}
      </ul>
    </section>
  );
}

function Jump({ id, dir, go }: { id: string; dir: 'before' | 'after'; go: (id: string) => void }) {
  const q = item(id);
  const name = displayName(q);
  return (
    <button className={`jump ${typeClass(q)}${isUnit(q) ? ' unit' : ''}`} onClick={() => go(id)} title={name}>
      {dir === 'before' && <span className="arrow">←</span>}
      <span className="label">{name}</span>
      {isUnit(q) && <span className="kind">{UNIT_LABEL[q.kind]}{q.members.length > 1 ? ` · ${q.members.length}` : ''}</span>}
      {!q.replayable && <span className="kind gone">불가</span>}
      {dir === 'after' && <span className="arrow">→</span>}
    </button>
  );
}

/** Where a unit hangs on the act map, and the series around it. */
function UnitLinks({ unit, before, after, visible, go }: {
  unit: Unit; before: string[]; after: string[]; visible: (q: MapItem) => boolean; go: (id: string) => void;
}) {
  const hosts = unit.attach.acts.filter((a) => visible(item(a)));
  const area = REGION_KO[unit.region ?? ''];
  return (
    <>
      {unit.attach.basis === 'requirement' && hosts.length > 0 && (
        <div className="jump-group">
          <h3>먼저 끝내야 하는 막</h3>
          <div className="jumps">{hosts.map((id) => <Jump key={id} id={id} dir="before" go={go} />)}</div>
        </div>
      )}
      {unit.attach.basis === 'region' && hosts.length > 0 && (
        <div className="jump-group">
          <h3>{area ? `${area} 도착 이후` : '지역 도착 이후'} <span className="loose-note">필수 아님</span></h3>
          <div className="jumps">{hosts.map((id) => <Jump key={id} id={id} dir="before" go={go} />)}</div>
        </div>
      )}
      {unit.attach.basis === 'none' && (
        <p className="unit-note">{unit.replayable ? '연결된 막이 없습니다.' : '기간 한정 이벤트였습니다. 연결된 막이 없고, 지금은 다시 플레이할 수 없습니다.'}</p>
      )}
      {before.length > 0 && (
        <div className="jump-group"><h3>앞 시리즈</h3>
          <div className="jumps">{before.map((id) => <Jump key={id} id={id} dir="before" go={go} />)}</div></div>
      )}
      {after.length > 0 && (
        <div className="jump-group"><h3>다음 시리즈</h3>
          <div className="jumps">{after.map((id) => <Jump key={id} id={id} dir="after" go={go} />)}</div></div>
      )}
    </>
  );
}

function UnitQuests({ unit }: { unit: Unit }) {
  if (unit.members.length < 2) return null;
  return (
    <section className="act-quests">
      <h3>{UNIT_LABEL[unit.kind]}의 임무 · {unit.members.length}개</h3>
      <ol className="unit-quests">{unit.members.map((id) => <li key={id}>{displayName(questById.get(id)!)}</li>)}</ol>
    </section>
  );
}

/** Units hung on an act, required ones apart from the ones that only need the region. */
function HungUnits({ list, entry, go }: { list: Unit[]; entry?: string; go: (id: string) => void }) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const area = REGION_KO[entry ?? ''];
  const groups = [
    { key: 'requirement', title: '이 막을 마치면 열리는 임무', note: '', units: list.filter((u) => u.attach.basis === 'requirement') },
    { key: 'region', title: area ? `${area} 도착 이후 할 수 있는 임무` : '지역 도착 이후 할 수 있는 임무', note: '필수 아님', units: list.filter((u) => u.attach.basis === 'region') },
  ].filter((g) => g.units.length);
  const LIMIT = 8;
  return (
    <section className="hung">
      {groups.map((g) => {
        const all = open[g.key] || g.units.length <= LIMIT + 2;
        const shown = all ? g.units : g.units.slice(0, LIMIT);
        return (
          <div className="jump-group" key={g.key}>
            <h3>{g.title} · {g.units.length}개 {g.note && <span className="loose-note">{g.note}</span>}</h3>
            <div className="jumps">
              {shown.map((u) => <Jump key={u.id} id={u.id} dir="after" go={go} />)}
              {!all && (
                <button type="button" className="rec-more" onClick={() => setOpen((o) => ({ ...o, [g.key]: true }))}>
                  외 {g.units.length - LIMIT}개 더 보기
                </button>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}

/** Stories that read better after this one. Names only: the reasons would spoil this node. */
function RecsOut({ edges, go }: { edges: RecommendedEdge[]; go: (id: string) => void }) {
  return (
    <section className="recs">
      <div className="recs-head"><h3>이어서 하면 좋은 이야기</h3></div>
      <ul className="rec-list">
        {edges.map((edge) => {
          const q = item(edge.target);
          return (
            <li key={edge.id} className={`rec-${edge.tier}`}>
              <button type="button" className={`rec-jump ${typeClass(q)}`} onClick={() => go(edge.target)}>
                <span className="rec-title">{displayName(q)}</span>
                <span className="rec-meta">
                  {isUnit(q) ? `${UNIT_LABEL[q.kind]} · ` : ''}{q.first_version}{!q.replayable && ' · 다시 플레이 불가'}
                  {edge.tier !== 'strong' && ` · ${edge.tier === 'medium' ? '배경 이해' : '참고'}`}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// Recommended acts as a short list. The shared context stays visible. The one-line
// gist (temporary regex, or gist_ko once the pipeline writes it) and the full reason
// open together. The unreviewed mark is shown once for the whole list, while any LLM edge in it
// is unchecked by a person.
function Recs({ edges, targetName, go }: { edges: RecommendedEdge[]; targetName: string; go: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const items = edges.map((edge) => {
    const q = item(edge.source);
    const name = displayName(q);
    // Infobox edges carry only a fixed provenance line, not a story reason: no gist, nothing to hide.
    const infobox = edge.basis === 'recommended' && !edge.gist_ko;
    const gist = infobox ? '' : edge.gist_ko?.trim() || recommendationGist(edge.reason_ko, name);
    return { edge, q, name, infobox, gist };
  });
  const told = items.filter((it) => !it.infobox);
  const lead = recommendationLead(told.map((it) => ({ name: it.name, reason: it.edge.reason_ko })), targetName);
  const unchecked = edges.filter((e) => e.basis === 'llm' && !e.reviewed).length;
  const checked = edges.some((e) => e.basis === 'llm' && e.reviewed);
  const strong = told.some((it) => it.edge.tier === 'strong');
  const spoilers = told.length > 0;
  return (
    <section className="recs">
      <div className="recs-head">
        <h3>먼저 하면 좋은 이야기</h3>
        {unchecked > 0 && (
          <span className="tag neutral" title={`LLM 판정 후 다른 회사 모델이 검증했습니다. ${checked ? `이 중 ${unchecked}개는` : '모두'} 사람 검수 전입니다.`}>미검수</span>
        )}
        <div className="rec-toggle">
          {strong && <span className="badge">스포일러 주의</span>}
          {spoilers && (
            <button type="button" className="rec-more" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
              {open ? '스포일러 접기' : '스포일러 보기'}
            </button>
          )}
        </div>
      </div>
      {lead && <p className="recs-lead">{lead}</p>}
      <ul className="rec-list">
        {items.map(({ edge, q, name, infobox, gist }) => (
          <li key={edge.id} className={`rec-${edge.tier}`}>
            <button type="button" className={`rec-jump ${typeClass(q)}`} onClick={() => go(edge.source)}>
              <span className="rec-title">{name}</span>
              <span className="rec-meta">
                {isUnit(q) ? `${UNIT_LABEL[q.kind]} · ` : ''}{q.first_version}{!q.replayable && ' · 다시 플레이 불가'}
                {infobox && <span title={edge.reason_ko}> · Fandom 권장 임무</span>}
              </span>
            </button>
            {open && !infobox && (
              <div className="rec-spoiler">
                {gist && <p className="rec-gist">{gist}</p>}
                {edge.tier !== 'strong' && <span className="tag neutral">{edge.tier === 'medium' ? '배경 이해' : '참고'}</span>}
                <p className="rec-reason">{edge.reason_ko}</p>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

// ---------- node renderers ----------
type ActData = { quest: Quest; state: '' | 'focus'; showVersion: boolean; tall: boolean; opens: number; entry?: string };
const ActNode = memo(({ data }: NodeProps<Node<ActData>>) => (
  <div className={`card-node ${typeClass(data.quest)} ${data.state}${data.tall ? ' tall' : ''}`} title={data.quest.names.ko ? `${data.quest.names.ko} (${data.quest.names.en})` : displayName(data.quest)}>
    <Handle type="target" position={Position.Left} />
    <span className="name">{displayName(data.quest)}</span>
    {data.showVersion && <span className="ver">{data.quest.first_version}</span>}
    {/* atlas only: what opens after this act, drawn as a strip under the card */}
    {data.opens > 0 && (
      <span className={`opens${data.entry ? ' entry' : ''}`}>
        <span className="opens-text">{data.entry ? `${REGION_KO[data.entry]} 도착 · ` : ''}이후 열리는 임무 {data.opens}개</span>
      </span>
    )}
    <Handle type="source" position={Position.Right} />
  </div>
));
type UnitData = { unit: Unit; state: '' | 'focus' };
/** A unit card: stacked when it holds several quests, dashed when it only needs the region. */
const UnitNode = memo(({ data }: NodeProps<Node<UnitData>>) => {
  const u = data.unit;
  const loose = u.attach.basis === 'region';
  return (
    <div className={`card-node unit ${typeClass(u)} ${data.state}${unitHeight(u) > UNIT_H ? ' tall' : ''}${u.members.length > 1 ? ' stack' : ''}${loose ? ' loose' : ''}${!u.replayable ? ' gone' : ''}`}
      title={u.names.ko ? `${u.names.ko} (${u.names.en})` : u.names.en}>
      <Handle type="target" position={Position.Left} />
      <span className="name">{displayName(u)}</span>
      <span className="unit-meta">
        <b>{UNIT_LABEL[u.kind]}</b>
        {u.members.length > 1 && <span>임무 {u.members.length}</span>}
        <span>{u.first_version ?? '?'}</span>
        {!u.replayable && <span className="gone-mark">다시 플레이 불가</span>}
        {loose && <span className="loose-mark">지역 도착 이후</span>}
      </span>
      <Handle type="source" position={Position.Right} />
    </div>
  );
});
const MoreNode = memo(({ data }: NodeProps<Node<Fold>>) => (
  <div className={`card-node more${data.basis === 'region' ? ' loose' : ''}`}>
    <Handle type="target" position={Position.Left} />
    <span className="name">
      {data.open ? `접기 · ${data.total}개 모두 보는 중`
        : data.basis === 'region' ? `지역 도착 이후 외 ${data.hidden}개` : `외 ${data.hidden}개 더 보기`}
    </span>
    <Handle type="source" position={Position.Right} />
  </div>
));
/** A branch link along the orthogonal route ELK computed, with rounded corners. */
const RouteEdge = memo((p: EdgeProps<Edge<{ points?: XY[] }>>) => {
  const pts = p.data?.points;
  const path = pts && pts.length >= 2 ? roundedPath(pts) : `M${p.sourceX},${p.sourceY} L${p.targetX},${p.targetY}`;
  return <BaseEdge path={path} markerEnd={p.markerEnd} style={p.style} />;
});
function roundedPath(pts: XY[], r = 10) {
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [a, b, c] = [pts[i - 1], pts[i], pts[i + 1]];
    const k = Math.min(r, Math.hypot(b.x - a.x, b.y - a.y) / 2, Math.hypot(c.x - b.x, c.y - b.y) / 2);
    const u = (from: XY, to: XY) => { const l = Math.hypot(to.x - from.x, to.y - from.y) || 1; return { x: (to.x - from.x) / l, y: (to.y - from.y) / l }; };
    const [ua, uc] = [u(b, a), u(b, c)];
    d += ` L${b.x + ua.x * k},${b.y + ua.y * k} Q${b.x},${b.y} ${b.x + uc.x * k},${b.y + uc.y * k}`;
  }
  const z = pts.at(-1)!;
  return `${d} L${z.x},${z.y}`;
}
const edgeTypes = { route: RouteEdge };
type LabelData = { text: string; kind: 'era' | 'ver' };
const LabelNode = memo(({ data }: NodeProps<Node<LabelData>>) => <div className={`atlas-label ${data.kind}`}>{data.text}</div>);
const nodeTypes = { act: ActNode, unit: UnitNode, more: MoreNode, label: LabelNode };
