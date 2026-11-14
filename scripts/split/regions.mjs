// Quest regions: their official Korean names (ko-names.json, Fandom {{Other Languages}} ko; never
// transliterated by hand) and the emblem each card draws (src/emblems.tsx EMBLEMS, by position).
// Kept out of the site's code so a region's name reaches the browser only with the version that
// reveals it (scripts/split/build.mjs puts each in the quest block of its first quest).
export const REGIONS = {
  Mondstadt: { ko: '몬드', emblem: 0 },
  Liyue: { ko: '리월', emblem: 1 },
  Inazuma: { ko: '이나즈마', emblem: 2 },
  Sumeru: { ko: '수메르', emblem: 3 },
  Fontaine: { ko: '폰타인', emblem: 4 },
  Natlan: { ko: '나타', emblem: 5 },
  'Nod-Krai': { ko: '노드크라이', emblem: 6 },
  // places inside a region that the data names on their own
  'Nasha Town': { emblem: 6 },
  Snezhnaya: { ko: '스네즈나야', emblem: 7 },
  Other: { ko: '기타', emblem: 8 },
};
/** the emblem of a region the table does not know (Simulanka, none) */
export const OTHER_EMBLEM = 8;
