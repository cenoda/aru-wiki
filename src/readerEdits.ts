// Text written by readers, laid over the generated articles.
//
// Published text comes from data/manual/reader-edits.json (the operator approved each entry with
// scripts/suggest/review.mjs). A reader's own suggestions wait in this browser's storage and are
// laid over the same way, marked "검토 중", so the writer sees the result at once while nobody
// else does. When a deploy carries the decision (approved or not), the stored copy is settled.
// Generated articles are never changed: an edit attaches to a paragraph by its exact text, so when
// an article is written again the edit simply no longer attaches (review.mjs stale lists those).
import editsUrl from '../data/manual/reader-edits.json?url';
import { versions } from './data';
import type { ArtPara, Article } from './lore';

export type EditKind = 'edit' | 'add' | 'page';
export interface ReaderEdit {
  id: string; kind: EditKind; page: string;
  /** version id the writer was reading at: never shown at an earlier version */
  v: string;
  /** version id of the article the paragraph belongs to */
  from?: string;
  /** section heading; null is the lead */
  section?: string | null;
  /** the paragraph's text before the edit */
  orig?: string;
  text: string; evidence?: string; nick?: string; submitted?: string | null; approved?: string;
}
export interface Published { edits: ReaderEdit[]; rejected: { id: string; note?: string; date: string; removed?: boolean }[] }
/** A suggestion kept in this browser until the site carries its decision. */
export interface Mine extends ReaderEdit { sent: string; settled?: 'rejected'; note?: string }

/** How a paragraph written or changed by a reader is marked. */
export interface Human { id: string; kind: EditKind; pending: boolean; nick?: string; evidence?: string; date?: string | null }
export type Para = ArtPara & { h?: Human };

let cache: Promise<Published> | null = null;
export const loadPublished = (): Promise<Published> => (cache ??= fetch(editsUrl).then((r) => (r.ok ? r.json() : { edits: [], rejected: [] }), () => ({ edits: [], rejected: [] })));

// ---------- this browser's own suggestions ----------
const KEY = 'aru.suggestions.v1';
const NICK = 'aru.nick';
const listeners = new Set<() => void>();
let mineCache: Mine[] | null = null;
function readMine(): Mine[] {
  if (mineCache) return mineCache;
  try { const v = JSON.parse(localStorage.getItem(KEY) ?? '[]'); mineCache = Array.isArray(v) ? v : []; } catch { mineCache = []; }
  return mineCache!;
}
function writeMine(list: Mine[]) {
  mineCache = list;
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* private mode: kept for this visit only */ }
  listeners.forEach((f) => f());
}
export const mine = { get: readMine, subscribe: (f: () => void) => { listeners.add(f); return () => { listeners.delete(f); }; } };
export const addMine = (e: Mine) => writeMine([...readMine(), e]);
export const dropMine = (id: string) => writeMine(readMine().filter((e) => e.id !== id));
export const savedNick = () => { try { return localStorage.getItem(NICK) ?? ''; } catch { return ''; } };
export const saveNick = (n: string) => { try { if (n) localStorage.setItem(NICK, n); else localStorage.removeItem(NICK); } catch { /* ignore */ } };

/** Settles stored suggestions the published file has decided: approved ones go, rejected ones keep the note. */
export function settleMine(pub: Published) {
  const list = readMine();
  const approved = new Set(pub.edits.map((e) => e.id));
  const rejected = new Map(pub.rejected.map((r) => [r.id, r]));
  const next = list.filter((e) => !approved.has(e.id)).map((e) => (rejected.has(e.id) && !e.settled ? { ...e, settled: 'rejected' as const, note: rejected.get(e.id)!.note } : e));
  if (next.length !== list.length || next.some((e, i) => e !== list[i])) writeMine(next);
}

// ---------- laying text over an article ----------
export const titleKey = (s: string) => s.replace(/_/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
const flat = (t: string | undefined) => (t ?? '').replace(/\s+/g, ' ').trim();
export const paraText = (p: ArtPara) => flat(p.s.map((x) => x.t).join(' '));
const orderOf = (id: string | undefined) => (id === undefined ? -1 : versions.findIndex((v) => v.id === id));
const human = (e: ReaderEdit, pending: boolean): Human => ({ id: e.id, kind: e.kind, pending, nick: e.nick, evidence: e.evidence, date: e.approved ?? e.submitted });
const paras = (e: ReaderEdit, pending: boolean): Para[] => e.text.split(/\n+/).map((t) => t.trim()).filter(Boolean).map((t) => ({ s: [{ t }], r: [], h: human(e, pending) }));

export interface Overlaid {
  lead: Para | null;
  sections: (Omit<Article['sections'][number], 'p'> & { p: Para[] })[];
  /** added paragraphs whose section this article does not have */
  loose: Para[];
}
/** Suggestions for the page that may show at the chosen version: published first, then this browser's waiting ones. */
export function editsFor(page: string, vIdx: number, pub: Published | null, own: Mine[]): { e: ReaderEdit; pending: boolean }[] {
  const k = titleKey(page);
  const ok = (e: ReaderEdit) => titleKey(e.page) === k && orderOf(e.v) >= 0 && orderOf(e.v) <= vIdx;
  return [
    ...(pub?.edits ?? []).filter(ok).map((e) => ({ e, pending: false })),
    ...own.filter((e) => !e.settled && ok(e)).map((e) => ({ e, pending: true })),
  ];
}
/** The article with readers' edits and additions laid over it. Applied in order, so an edit of an edit attaches. */
export function overlay(art: Article, list: { e: ReaderEdit; pending: boolean }[]): Overlaid {
  const out: Overlaid = { lead: art.lead, sections: art.sections.map((s) => ({ ...s, p: [...s.p] })), loose: [] };
  const fromId = versions[art.from]?.id;
  for (const { e, pending } of list) {
    if (e.kind === 'edit') {
      if (e.from !== fromId) continue;
      const swap = (p: Para): Para => ({ s: [{ t: e.text }], r: p.r, h: human(e, pending) });
      if (out.lead && paraText(out.lead) === flat(e.orig)) { out.lead = swap(out.lead); continue; }
      for (const s of out.sections) {
        const i = s.p.findIndex((p) => paraText(p) === flat(e.orig));
        if (i >= 0) { s.p[i] = swap(s.p[i]); break; }
      }
    } else if (e.kind === 'add') {
      const s = out.sections.find((x) => x.h === e.section);
      (s ? s.p : out.loose).push(...paras(e, pending));
    }
  }
  return out;
}
/** A page readers wrote (no generated page has the title): its paragraphs in order, or null when there is none to show. */
export function humanPage(title: string, list: { e: ReaderEdit; pending: boolean }[]): { title: string; p: Para[]; pending: boolean } | null {
  const first = list.find((x) => x.e.kind === 'page');
  if (!first) return null;
  return {
    title: first.e.page, pending: first.pending,
    p: list.filter((x) => x.e.kind === 'page' ? x === first : x.e.kind === 'add').flatMap((x) => paras(x.e, x.pending)),
  };
}
/** Whether a reader-written page with this title exists at all (at any version). */
export const hasHumanPage = (title: string, pub: Published | null) => !!pub?.edits.some((e) => e.kind === 'page' && titleKey(e.page) === titleKey(title));

export interface Draft { kind: EditKind; page: string; v: string; from?: string; section?: string | null; orig?: string; text: string; evidence: string; nick: string; hint: { paste: boolean; ms: number }; website: string }
export type SendResult = 'sent' | 'rate_limited' | 'queue_full' | 'offline' | 'rejected';
/** Sends a suggestion; on success it is kept in this browser so the writer sees it at once. */
export async function send(d: Draft): Promise<SendResult> {
  const { website, hint, ...e } = d;
  const body = { ...e, evidence: e.evidence.trim() || undefined, nick: e.nick.trim() || undefined, hint, website, agree: true, own: true };
  let res: Response;
  try { res = await fetch('/api/suggest', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }); } catch { return 'offline'; }
  if (res.status === 429) return 'rate_limited';
  if (res.status === 503) return 'queue_full';
  if (res.status === 400) return 'rejected';
  const data = res.ok ? ((await res.json().catch(() => null)) as { ok?: boolean; id?: string } | null) : null;
  if (!data?.ok || !data.id) return 'offline';
  saveNick(e.nick.trim());
  addMine({ id: data.id, kind: e.kind, page: e.page, v: e.v, from: e.from, section: e.section, orig: e.orig, text: e.text.trim(), evidence: e.evidence.trim() || undefined, nick: e.nick.trim() || undefined, sent: new Date().toISOString() });
  return 'sent';
}
