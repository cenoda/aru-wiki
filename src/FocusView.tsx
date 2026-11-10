import {
  applyNodeChanges, type Edge, Handle, type Node, type NodeChange, type NodeProps, Position,
  MarkerType, ReactFlow, ReactFlowProvider, useReactFlow, useStore,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  actGraph, displayName, type Quest, questEdges, recommendedGraph, type RecommendedEdge, TIER_RANK, type QuestType, questById, quests, REGION_KO, TYPE_LABEL,
  type Version, versionOrder, versions,
} from './data';
import { recommendationGist, recommendationLead } from './recText';
import ELK from 'elkjs/lib/elk.bundled.js';
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
// Recommended (not required) order, shown only in a focused act's branch. A recommendation
// the game already enforces says nothing new and is dropped.
const recIn = Map.groupBy(
  recommendedGraph().filter((e) => questById.get(e.source)?.level === 'ACT' && questById.get(e.target)?.level === 'ACT'
    && !requiredBefore(e.target, e.source)),
  (e) => e.target);
const START_ACT = 'act_the_outlander_who_caught_the_wind';
const TYPE_RANK: Record<QuestType, number> = { ARCHON: 0, STORY: 1, WORLD: 2, EVENT: 3 };
const vOrder = (q: Quest) => versionOrder.get(q.first_version ?? '') ?? 0;
const typeClass = (q: Quest) => `t-${q.quest_type.toLowerCase()}`;
const region = (q: Quest) => REGION_KO[q.region ?? ''];

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

/**
 * The focused act's branch: every act needed to reach it, its own storyline onward,
 * and the acts it unlocks directly on other storylines.
 */
function branchOf(focus: string, visible: (q: Quest) => boolean) {
  const ok = (id: string) => visible(questById.get(id)!);
  const out = new Set([focus]);
  for (const r of recIn.get(focus) ?? []) if (ok(r.source)) out.add(r.source);
  const up = [focus];
  while (up.length) for (const p of before.get(up.pop()!) ?? []) if (ok(p) && !out.has(p)) { out.add(p); up.push(p); }
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
  return out;
}

const elk = new ELK();
type Pt = { x: number; y: number; h: number };

async function layoutBranch(ids: Set<string>, focus: string) {
  const list = [...ids].sort((a, b) => topoIndex.get(a)! - topoIndex.get(b)!);
  const height = (id: string) => cardHeight(questById.get(id)!);
  const res = await elk.layout({
    id: 'branch',
    layoutOptions: {
      'elk.algorithm': 'layered', 'elk.direction': 'RIGHT',
      'elk.layered.spacing.nodeNodeBetweenLayers': String(LAYER_GAP), 'elk.spacing.nodeNode': '28',
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
      'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
    },
    children: list.map((id) => ({ id, width: CARD_W, height: height(id) })),
    edges: [
      ...actEdges.filter((e) => ids.has(e.source) && ids.has(e.target)).map((e) => ({
        id: e.id, sources: [e.source], targets: [e.target],
        ...(lines.lineOf.get(e.source) === lines.lineOf.get(e.target)
          ? { layoutOptions: { 'elk.layered.priority.straightness': '20' } } : {}),
      })),
      // recommended sources sit left of the act like its prerequisites
      ...(recIn.get(focus) ?? []).filter((r) => ids.has(r.source)).map((r) => ({ id: r.id, sources: [r.source], targets: [focus] })),
    ],
  });
  // Re-anchor so the focused act keeps its atlas position: the branch unfolds around it.
  const f = res.children!.find((c) => c.id === focus)!;
  const home = atlas.pos.get(focus)!;
  return new Map(res.children!.map((c) => [c.id, {
    x: home.x + c.x! - f.x!, y: home.y + c.y! - f.y!, h: height(c.id),
  }]));
}

const actFromUrl = () => {
  const a = new URLSearchParams(location.search).get('act');
  return a && questById.get(a)?.level === 'ACT' ? a : null;
};

function Logo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
      <path d="M12 7.5l1.2 3.3 3.3 1.2-3.3 1.2L12 16.5l-1.2-3.3L7.5 12l3.3-1.2z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function FocusView() {
  return <ReactFlowProvider><Atlas /></ReactFlowProvider>;
}

function Atlas() {
  const [focus, setFocus] = useState<string | null>(actFromUrl);
  const [vIdx, setVIdx] = useState(versions.length - 1);
  const [query, setQuery] = useState('');
  const flow = useReactFlow();
  const zoom = useStore((s) => s.transform[2]);
  const visible = useCallback((q: Quest) => vOrder(q) <= vIdx, [vIdx]);

  useEffect(() => {
    const onPop = () => setFocus(actFromUrl());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const select = useCallback((id: string | null) => {
    if (id === focus) return;
    window.history.pushState(null, '', id ? `?act=${id}` : './');
    setFocus(id);
    setQuery('');
  }, [focus]);

  // A focused act that is not released in the chosen version is deselected (back to the atlas).
  useEffect(() => {
    if (focus && !visible(questById.get(focus)!)) {
      window.history.replaceState(null, '', './');
      setFocus(null);
    }
  }, [focus, visible]);

  const neighbours = useMemo(() => {
    if (!focus) return null;
    const keep = (ids: string[] = []) => ids.filter((id) => visible(questById.get(id)!));
    return {
      before: keep(before.get(focus)), after: keep(after.get(focus)),
      recommended: (recIn.get(focus) ?? []).filter((r) => visible(questById.get(r.source)!))
        .sort((a, b) => TIER_RANK[b.tier] - TIER_RANK[a.tier]),
    };
  }, [focus, visible]);

  // ---------- branch of the focused act, laid out on its own ----------
  const branch = useMemo(() => (focus ? branchOf(focus, visible) : null), [focus, visible]);
  // The layout is tagged with the branch it was made for, so a stale one is never used
  // while the next branch is still being laid out.
  const [layout, setLayout] = useState<{ branch: Set<string>; pos: Map<string, Pt> } | null>(null);
  useEffect(() => {
    let live = true;
    if (branch) layoutBranch(branch, focus!).then((pos) => { if (live) setLayout({ branch, pos }); });
    return () => { live = false; };
  }, [branch, focus]);
  const branchPos = layout && layout.branch === branch ? layout.pos : null;
  const inBranch = !!focus && !!branchPos;

  // ---------- nodes: atlas positions, or branch positions while an act is focused ----------
  const [nodes, setNodes] = useState<Node[]>([]);
  useEffect(() => {
    if (focus && !branchPos) return; // wait for the branch layout, keep the current frame
    const actNodes: Node[] = acts.filter(visible)
      .filter((a) => !inBranch || branch!.has(a.id))
      .map((a) => {
        const h = cardHeight(a);
        const at = inBranch ? branchPos!.get(a.id)! : { ...atlas.pos.get(a.id)!, h: CARD_H };
        return {
          id: a.id, type: 'act', width: CARD_W, height: inBranch ? h : CARD_H,
          position: { x: at.x, y: at.y },
          data: { quest: a, state: a.id === focus ? 'focus' : '', showVersion: inBranch && !!a.names.ko, tall: inBranch && h > CARD_H },
        };
      });
    const labelNodes: Node[] = inBranch ? [] : atlas.labels
      .filter((l) => l.kind === 'era' || versionOrder.get(l.text)! <= vIdx)
      .map((l) => ({ id: l.id, type: 'label', position: { x: l.x, y: l.y }, draggable: false, selectable: false, data: l }));
    setNodes([...labelNodes, ...actNodes]);
  }, [visible, focus, vIdx, branch, branchPos, inBranch]);

  // Atlas: storyline track only. Branch: every link inside the branch (track solid, cross dashed).
  const edges: Edge[] = useMemo(() => actEdges
    .filter((e) => visible(questById.get(e.source)!) && visible(questById.get(e.target)!))
    .flatMap((e): Edge[] => {
      const track = lines.trackEdges.has(e.id) || lines.lineOf.get(e.source) === lines.lineOf.get(e.target);
      if (inBranch ? !(branch!.has(e.source) && branch!.has(e.target)) : !lines.trackEdges.has(e.id)) return [];
      const hot = e.source === focus || e.target === focus;
      return [{
        id: e.id, source: e.source, target: e.target,
        type: inBranch ? 'smoothstep' : 'straight',
        className: `${typeClass(questById.get(e.target)!)} ${track ? 'track' : 'cross'}${hot ? ' hot' : ''}`,
        markerEnd: { type: MarkerType.ArrowClosed, width: inBranch ? 14 : 11, height: inBranch ? 14 : 11, color: 'var(--arrow)' },
      }];
    }).concat(inBranch ? (recIn.get(focus!) ?? []).filter((r) => branch!.has(r.source)).map((r) => ({
      id: r.id, source: r.source, target: r.target, type: 'smoothstep' as const,
      className: `rec ${r.tier}`,
      markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14, color: 'var(--rec)' },
    })) : []), [focus, visible, inBranch, branch]);

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
    const zoomFor = (box: { w: number; h: number }) => Math.min(PREFER_Z, innerW / box.w, innerH / box.h);
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
    if (box.minY * z + ty < PAD) ty += PAD - (box.minY * z + ty);
    if (box.maxY * z + ty > frame.height - PAD) ty -= box.maxY * z + ty - (frame.height - PAD);
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
  useEffect(() => {
    if (focus) document.querySelector('.stage')?.classList.remove('soft-edge');
    if (focus && !branchPos) return;
    const t = setTimeout(() => {
      if (focus) frameBranch(firstFrame.current ? 0 : 550);
      else if (wantFit.current) fitAll();
      else {
        // back to where the reader was, unless that act is hidden in the chosen version
        const back = lastFocus.current && visible(questById.get(lastFocus.current)!) ? lastFocus.current : START_ACT;
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
    const watch = new ResizeObserver(refit);
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

  const results = useMemo(() => {
    const s = query.trim().toLowerCase();
    if (!s) return [];
    return quests.filter((q) => visible(q) && (q.level === 'ACT' || q.act)
      && ((q.names.ko ?? '').toLowerCase().includes(s) || q.names.en.toLowerCase().includes(s)))
      .sort((a, b) => Number(a.level === 'QUEST') - Number(b.level === 'QUEST') || vOrder(a) - vOrder(b))
      .slice(0, 10)
      .map((q) => ({ q, target: q.level === 'ACT' ? q : questById.get(q.act!)! }));
  }, [query, visible]);

  const sel = focus ? questById.get(focus)! : null;
  const zoomClass = zoom < 0.45 ? 'far' : zoom < 0.75 ? 'mid' : 'near';

  return (
    <div className="site graph-page">
      <div className="wrap">
        <header>
          <a className="logo" href="./" onClick={(e) => { e.preventDefault(); select(null); }}><Logo />aru.wiki</a>
          <form className="find" onSubmit={(e) => { e.preventDefault(); if (results[0]) select(results[0].target.id); }}>
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Escape') { setQuery(''); e.currentTarget.blur(); } }}
              placeholder="막·임무 이름 검색" />
            {query.trim() && (results.length > 0 ? (
              <ul>
                {results.map(({ q, target }) => (
                  <li key={q.id}><button type="button" className={typeClass(target)} onClick={() => select(target.id)}>
                    <i className="dot" />
                    <span className="hit">{displayName(q)}{q !== target && <em>{displayName(target)} 막</em>}</span>
                    <small>{q.first_version}</small>
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
            <span className="hint">막을 누르면 갈래 · 끌어서 이동</span>
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
            nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodesChange={onNodesChange}
            onNodeClick={(_, n) => { if (n.type === 'act') select(n.id === focus ? null : n.id); }}
            onPaneClick={() => select(null)}
            nodesConnectable={false} minZoom={0.08} maxZoom={2} proOptions={{ hideAttribution: true }}
            onlyRenderVisibleElements
          />
        </div>

        {sel && neighbours && (
          <aside className={`info ${typeClass(sel)}`}>
            <div className="tags">
              <span className="tag">{TYPE_LABEL[sel.quest_type]}</span>
              {region(sel) && <span className="tag neutral">{region(sel)}</span>}
              <span className="tag neutral">{sel.first_version}</span>
              {!sel.replayable && <span className="badge">다시 플레이 불가</span>}
            </div>
            <div className="name">{displayName(sel)}</div>
            {sel.names.ko && <div className="en">{sel.names.en.replace(/ \(Act\)$/, '')}</div>}
            <LinkGroups focus={sel.id} before={neighbours.before} after={neighbours.after} go={select} />
            {neighbours.recommended.length > 0 && (
              <Recs edges={neighbours.recommended} targetName={displayName(sel)} go={select} />
            )}
            <ActQuests actId={sel.id} />
          </aside>
        )}
      </main>
    </div>
  );
}

function VersionPicker({ order, onChange }: { order: number; onChange: (order: number) => void }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const current = versions.find((v) => v.order === order) ?? versions[versions.length - 1];
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: PointerEvent) => {
      if (e.target instanceof globalThis.Node && !root.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onDoc);
    document.addEventListener('keydown', onKey);
    root.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
    return () => {
      document.removeEventListener('pointerdown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);
  const step = (next: number) => { onChange(next); setOpen(false); };
  return (
    <div className="version" ref={root}>
      <button type="button" className="band step" aria-label="이전 버전" disabled={order <= 0} onClick={() => step(order - 1)}>‹</button>
      <button type="button" className="band now" aria-expanded={open} aria-haspopup="listbox" onClick={() => setOpen((v) => !v)}>
        {current.id}까지 공개
      </button>
      <button type="button" className="band step" aria-label="다음 버전" disabled={order >= versions.length - 1} onClick={() => step(order + 1)}>›</button>
      {open && (
        <ul role="listbox" aria-label="공개 버전">
          {[...versions].reverse().map((x) => (
            <li key={x.id}>
              <button type="button" role="option" aria-selected={x.order === order} onClick={() => step(x.order)}>{x.id}까지 공개</button>
            </li>
          ))}
        </ul>
      )}
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
  const q = questById.get(id)!;
  const name = displayName(q);
  return (
    <button className={`jump ${typeClass(q)}`} onClick={() => go(id)} title={name}>
      {dir === 'before' && <span className="arrow">←</span>}
      <span className="label">{name}</span>
      {dir === 'after' && <span className="arrow">→</span>}
    </button>
  );
}

// Recommended acts as a short list. The shared context stays visible. The one-line
// gist (temporary regex, or gist_ko once the pipeline writes it) and the full reason
// open together. The unreviewed mark is shown once for the whole list.
function Recs({ edges, targetName, go }: { edges: RecommendedEdge[]; targetName: string; go: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const items = edges.map((edge) => {
    const q = questById.get(edge.source)!;
    const name = displayName(q);
    return { edge, q, name, gist: edge.gist_ko?.trim() || recommendationGist(edge.reason_ko, name) };
  });
  const lead = recommendationLead(items.map((it) => ({ name: it.name, reason: it.edge.reason_ko })), targetName);
  const llm = edges.some((e) => e.basis === 'llm');
  const strong = edges.some((e) => e.tier === 'strong');
  return (
    <section className="recs">
      <div className="recs-head">
        <h3>먼저 하면 좋은 이야기</h3>
        {llm && <span className="tag neutral" title="LLM 판정 후 다른 회사 모델이 검증했습니다. 사람 검수 전입니다.">미검수</span>}
        <div className="rec-toggle">
          {strong && <span className="badge">스포일러 주의</span>}
          <button type="button" className="rec-more" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
            {open ? '스포일러 접기' : '스포일러 보기'}
          </button>
        </div>
      </div>
      {lead && <p className="recs-lead">{lead}</p>}
      <ul className="rec-list">
        {items.map(({ edge, q, name, gist }) => (
          <li key={edge.id} className={`rec-${edge.tier}`}>
            <button type="button" className={`rec-jump ${typeClass(q)}`} onClick={() => go(edge.source)}>
              <span className="rec-title">{name}</span>
              <span className="rec-meta">{q.first_version}{!q.replayable && ' · 다시 플레이 불가'}</span>
            </button>
            {open && (
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
type ActData = { quest: Quest; state: '' | 'focus'; showVersion: boolean; tall: boolean };
const ActNode = memo(({ data }: NodeProps<Node<ActData>>) => (
  <div className={`card-node ${typeClass(data.quest)} ${data.state}${data.tall ? ' tall' : ''}`} title={data.quest.names.ko ? `${data.quest.names.ko} (${data.quest.names.en})` : displayName(data.quest)}>
    <Handle type="target" position={Position.Left} />
    <span className="name">{displayName(data.quest)}</span>
    {data.showVersion && <span className="ver">{data.quest.first_version}</span>}
    <Handle type="source" position={Position.Right} />
  </div>
));
type LabelData = { text: string; kind: 'era' | 'ver' };
const LabelNode = memo(({ data }: NodeProps<Node<LabelData>>) => <div className={`atlas-label ${data.kind}`}>{data.text}</div>);
const nodeTypes = { act: ActNode, label: LabelNode };
