// Whether some page, at any version, answers to a name (scripts/split/names.mjs). The list holds
// short hashes, not names, and is fetched only when an address or a new-page title names a page the
// loaded versions do not know: "revealed later" keeps the name hidden, "no such page" is a new page.
import { fetchData, langData } from './split';

const fold = (s: string) => s.replace(/_/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
let keys: Promise<Set<string>> | null = null;

async function keyOf(name: string) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(fold(name)));
  return [...new Uint8Array(d).slice(0, 6)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** true when a page has this name at some version; false when none does */
export async function knownName(name: string): Promise<boolean> {
  keys ??= fetchData<string[]>(langData().names).then((l) => new Set(l), (e) => { keys = null; throw e; });
  const [set, k] = await Promise.all([keys, keyOf(name)]);
  return set.has(k);
}
