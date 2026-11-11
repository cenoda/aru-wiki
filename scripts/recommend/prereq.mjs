// Required order between map nodes (acts and units), lifted from quest-level PREREQUISITE edges so
// a lock between member quests of two units counts too. requires(a, b): the game makes a come before b.
export function makeRequires(quests, unitData, questEdges) {
  const nodeOf = new Map();
  for (const u of unitData.units) for (const m of u.members) nodeOf.set(m, u.id);
  for (const q of quests) if (!nodeOf.has(q.id)) nodeOf.set(q.id, q.level === 'ACT' ? q.id : q.act ?? q.id);
  const adj = new Map();
  for (const e of questEdges) {
    if (e.relation !== 'PREREQUISITE') continue;
    const s = nodeOf.get(e.source) ?? e.source, t = nodeOf.get(e.target) ?? e.target;
    if (s === t) continue;
    if (!adj.has(s)) adj.set(s, new Set());
    adj.get(s).add(t);
  }
  return (from, to) => {
    const seen = new Set([from]), todo = [from];
    while (todo.length) for (const y of adj.get(todo.pop()) ?? []) {
      if (y === to) return true;
      if (!seen.has(y)) { seen.add(y); todo.push(y); }
    }
    return false;
  };
}
