// How strong a video title is as the page's main (infobox) video, from the title alone.
// 2: demo/trailer/PV/teaser/story PV/collected miscellany, region trailer, OST, 풍물집;
// 0: birthday greetings, split shorts "(No.N)", event and wish notices, other shorts;
// 1: everything else (full uploads that are neither).
// Used by candidates.mjs (when to look past the title for more candidates) and judge.mjs
// (main choice: the LLM's main is kept only if no other pick has a higher tier).
const STRONG = /캐릭터\s*(플레이|트레일러|PV|시연|실연|소개)|데인 여담|원소 편|스토리\s*PV|막간\s*PV|아로새김|트레일러|티저|PV|풍물집|탐사 영상|Disc\s*\d|OST|비하인드 스토리|컷신/i;
const NOTICE = /기원 알림|버전 오픈|이벤트 오픈|이벤트 총정리|오픈\s*#/;

export function tier(title) {
  if (/\(No\.\d+\)/.test(title) || NOTICE.test(title)) return 0;
  if (/생일 축하/.test(title) && !/캐릭터\s*PV/.test(title)) return 0;
  if (STRONG.test(title)) return 2;
  // shorts carry no "원신 |" prefix and usually end in hashtags
  if (!/^원신\s*[|｜·]/.test(title) || /#\S+\s*$/.test(title)) return 0;
  return 1;
}

// title is about the named subject itself: 「Name: …」, 「『Name』: …」, Name 캐릭터 PV, …·Name
export function namesSubject(title, name) {
  const n = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`「\\s*『?${n}』?\\s*(\\([^)]*\\))?\\s*[:：]|${n}\\s*캐릭터|·\\s*${n}\\s*$`).test(title);
}
