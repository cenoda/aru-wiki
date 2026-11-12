// Korean text from the recommend pipeline: official names in place of English ones, and the
// particle after a replaced name chosen again for the new final syllable.
//
// The judge reads English wiki pages, so its Korean sentences carry English names ("Aksinya와")
// and quest titles in 「English title」. Names come only from Fandom `{{Other Languages}}`
// (ko-names.json) and quest titles (quests.json, quest-units.json).

const HANGUL = /[가-힣]/;

/** Final consonant of the last Hangul syllable: index 0-27 (0 = none); null when there is no Hangul. */
function finalOf(name) {
  const plain = name.replace(/\([^)]*\)/g, '');
  for (const ch of [...plain].reverse()) {
    if (HANGUL.test(ch)) return (ch.codePointAt(0) - 0xac00) % 28;
    if (/[A-Za-z0-9]/.test(ch)) return null;
  }
  return null;
}

// Particles and endings that may follow a name directly.
const PARTICLE = /(?:의|와|과|을|를|은|는|이|가|에|도|로|으로|만|라|이라|이자|처럼|까지|부터|보다|이며|며|나|이나)/;

// [with final consonant, without]
const PAIRS = [['으로', '로'], ['과', '와'], ['을', '를'], ['은', '는'], ['이나', '나'], ['이', '가']];

/**
 * The particle at the start of `rest`, re-chosen for `name`.
 * Returns { from, to }: replace `from` characters of `rest` with `to`. `from` is 0 when unchanged.
 */
export function fitParticle(name, rest) {
  const f = finalOf(name);
  if (f === null) return { from: 0, to: '' };
  // copula after a vowel: 악시냐이라는 -> 악시냐라는 (the other way cannot be told from words starting with 라)
  if (f === 0 && /^이라[\uAC00-\uD7A3]/.test(rest)) return { from: 2, to: '라' };
  for (const [withF, noF] of PAIRS) {
    const hit = [withF, noF].find((p) => rest.startsWith(p));
    if (!hit) continue;
    const next = rest[hit.length] ?? '';
    if (withF === '으로') {
      if (HANGUL.test(next) && !/^(서|써|부터|는|도|만)/.test(rest.slice(hit.length))) continue;
      const want = f !== 0 && f !== 8 ? '으로' : '로';
      return { from: hit.length, to: want };
    }
    // a particle stands alone: 이다, 이라는, 는데, 과정 ... are other words
    if (HANGUL.test(next)) return { from: 0, to: '' };
    return { from: hit.length, to: f !== 0 ? withF : noF };
  }
  return { from: 0, to: '' };
}

/**
 * Build a replacer from [English, Korean] pairs. Longer names win ("Mary-Ann Guillotin" before
 * "Mary-Ann" before "Ann"); a bare name matches only as a whole word. Titles in 「」 are looked
 * up whole, in `pairs` or `titles`. The particle after every replaced or bracketed name is re-chosen.
 */
export function makeLocalizer(pairs, titles = [], misspellings = []) {
  const map = new Map(pairs.filter(([en, ko]) => en && ko && en !== ko));
  // "The Knave" is also written "Knave"
  for (const [en, ko] of [...map]) {
    const bare = en.replace(/^The /, '');
    if (bare !== en && !map.has(bare)) map.set(bare, ko);
  }
  // and "Tsaritsa" is also written "The Tsaritsa": without this the phrase stays English whole
  for (const [en, ko] of [...map]) {
    if (!/^The /.test(en) && /^[A-Z]/.test(en) && !map.has(`The ${en}`)) map.set(`The ${en}`, ko);
  }
  // one-word quest titles ("Paradise", "Hell") are ordinary words too: only inside 「」.
  // Titles of two words or more are also replaced bare ("Windblume's Breath").
  const titled = titles.filter(([en, ko]) => en && ko && en !== ko);
  const bracketed = new Map([...titled, ...map]);
  for (const [en, ko] of titled) if (/\s/.test(en) && !map.has(en)) map.set(en, ko);
  const names = [...map.keys()].sort((a, b) => b.length - a.length);
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const word = names.length
    // an apostrophe joined to letters is part of a word (Khaenri'ah); one before or after a space is a quote mark ('Mother')
    ? new RegExp(`(?<![A-Za-z0-9-]|[A-Za-z0-9]['’])(${names.map(esc).join('|')})(?![A-Za-z0-9-]|['’][A-Za-z])`, 'g')
    : null;

  // Hangul spellings of our own ("아크신야"): a whole word, or one followed by a particle
  const wrong = new Map(misspellings.filter(([w, ko]) => w && ko && w !== ko));
  const wrongRe = wrong.size
    ? new RegExp(`(?<![\uAC00-\uD7A3])(${[...wrong.keys()].sort((a, b) => b.length - a.length).map(esc).join('|')})`
      + `(?=[^\uAC00-\uD7A3]|$|${PARTICLE.source})`, 'gu')
    : null;

  return function localize(text) {
    if (!text) return text;
    const hits = [];
    for (const m of text.matchAll(/「([^」]+)」/g)) {
      hits.push({ start: m.index, end: m.index + m[0].length, value: `「${bracketed.get(m[1]) ?? m[1]}」` });
    }
    if (word) {
      for (const m of text.matchAll(word)) {
        if (hits.some((h) => m.index >= h.start && m.index < h.end)) continue;
        hits.push({ start: m.index, end: m.index + m[0].length, value: map.get(m[1]) });
      }
    }
    if (wrongRe) {
      for (const m of text.matchAll(wrongRe)) {
        if (hits.some((h) => m.index < h.end && m.index + m[0].length > h.start)) continue;
        hits.push({ start: m.index, end: m.index + m[0].length, value: wrong.get(m[1]) });
      }
    }
    hits.sort((a, b) => a.start - b.start);
    let out = '';
    let at = 0;
    for (const h of hits) {
      out += text.slice(at, h.start) + h.value;
      at = h.end;
      // the particle may come after a closing mark: **벽난로의 집**을, 'Mother'를
      const close = text.slice(at).match(/^(?:\*{1,2}|['’"”」』])*/)[0];
      const p = fitParticle(h.value, text.slice(at + close.length));
      if (p.from) {
        out += close + p.to;
        at += close.length + p.from;
      }
    }
    // "아브렐리안(Avrelian)" became "아브렐리안(아브렐리안)": drop the repeat
    return (out + text.slice(at))
      .replace(/([^\s(),]+)\(\1\)/gu, '$1')
      .replace(/([^\s(),]+)\(\1,\s*/gu, '$1(');
  };
}

/** English names still left in a Korean sentence (for reports). */
export function latinNames(text) {
  // a trailing apostrophe is a closing quote mark ('Mother'), not part of the name
  return [...(text ?? '').matchAll(/[A-Z][A-Za-z'’-]+(?: (?:of|the|de|and|[A-Z][A-Za-z'’-]+))*/g)].map((m) => m[0].replace(/['’-]+$/, ''));
}
