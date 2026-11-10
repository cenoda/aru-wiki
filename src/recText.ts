/**
 * Temporary one-line summary. The recommend pipeline will write `gist_ko` itself;
 * keep this regex only until that field is present on an edge.
 */
export function recommendationGist(reason: string, sourceName: string): string {
  const mark = `「${sourceName}」`;
  const sentences = reason.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
  const hit = sentences.find((s) => s.includes(mark)) ?? sentences[0] ?? reason;
  const at = hit.indexOf(mark);
  if (at < 0) return clip(clean(hit));
  const before = clean(hit.slice(0, at));
  const afterRaw = hit.slice(at + mark.length).trim();
  const after = clean(afterRaw);
  const locatesBefore = /에서(?:만)?\s*(?:다뤄|일어|밝혀)/.test(afterRaw);
  const afterIsContent = /^(?:에서|로)\s*\S/.test(afterRaw) && !locatesBefore;
  const picked = thin(before) || afterIsContent ? after : before;
  return clip(picked || clean(hit));
}

/** Shared setup when several recommendations explain the same jump. Null when there is only one. */
export function recommendationLead(items: { name: string; reason: string }[], targetName: string): string | null {
  if (items.length < 2) return null;
  const sets = items.map((it) => new Set([...it.reason.matchAll(/「([^」]+)」/g)].map((m) => m[1])));
  const sources = new Set(items.map((it) => it.name));
  const counts = new Map<string, number>();
  for (const set of sets) {
    for (const title of set) {
      if (title === targetName || sources.has(title)) continue;
      counts.set(title, (counts.get(title) ?? 0) + 1);
    }
  }
  const best = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  const enough = best && (best[1] === items.length || (items.length >= 3 && best[1] >= items.length - 1));
  if (best && enough) return `「${best[0]}」 이후의 변화가 이 막에서는 설명 없이 나옵니다.`;
  return '이 막은 아래 이야기의 결과를 설명 없이 이어 갑니다.';
}

function clean(text: string) {
  return text
    .replace(/\s+/g, ' ')
    .replace(/^[\s,，.]+|[\s,，.]+$/g, '')
    .replace(/^(?:또한|다만|그리고|이미 플레이한 스토리에서)\s*/, '')
    .replace(/^(?:은|는|이|가|을|를|의|도|에서|로|에게)\s*/, '')
    .replace(/^(?:그녀|그|이)(?:가|는|은|를)?\s+/, '')
    .replace(/^(?:보여\s*준|밝혀지는|일어나는)\s*/, '')
    .replace(/\s*(?:을|를)\s*전제로.*$/, '')
    .replace(/\s*(?:므로|어서|아서)\s*.*$/, '')
    .replace(/(?:입니다|합니다|됩니다|있습니다|없습니다)\s*$/, '')
    .replace(/(?:은|는|이|가|을|를|의|도)\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function thin(text: string) {
  const t = text.trim();
  return [...t].length < 8 || /^「[^」]+」$/.test(t);
}

/** A clause cut on a comma can end on 고/며/지만. Close it so the line reads as a sentence. */
function closeClause(text: string) {
  const t = text.trim();
  if (!/(?:고|며|지만|는데|면서)$/.test(t)) return t;
  const stem = t.replace(/(?:지만|는데|면서|이며|고|며)$/, '').trim();
  if (/(?:었|았|였|했)$/.test(stem)) return stem + '다';
  return stem.length >= 8 ? stem + '…' : t;
}

function clip(text: string, max = 46) {
  const t = text.trim();
  const chars = [...t];
  if (chars.length <= max) return closeClause(t);
  let quoted = false;
  let comma = -1;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (ch === '"') quoted = !quoted;
    if (!quoted && (ch === ',' || ch === '，') && i >= 12 && i <= max + 8) { comma = i; break; }
  }
  if (comma >= 12) return closeClause(t.slice(0, comma));
  const head = chars.slice(0, max).join('');
  const space = head.lastIndexOf(' ');
  return (space > 16 ? head.slice(0, space) : head).trim() + '…';
}
