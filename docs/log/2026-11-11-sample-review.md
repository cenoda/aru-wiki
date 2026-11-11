# 2026-11-11 권장 연결선 표본 검수

## 1. 목적

LLM이 만든 권장 선행 연결선 216개(강함 89, 중간 32, 연함 95)는 모두 사람 검수 전이다. design.md §5의 2·5번과 [2026-11-10 점검](2026-11-10-review.md) §2.2·§5에 따라 27개를 뽑아 사람이 판정하고 오류율을 잰다. `verified`는 사람만 표시한다.

이 문서의 "사전 점검"은 저장소의 `data/generated/`만 보고 기계와 Claude가 붙인 표시다. 사람 판정이 아니다. 위키 본문이나 게임 대사 원문은 보지 않았다(LLM에 넣어도 되는지 아직 정하지 않음). 판단 근거는 연결선에 저장된 이유(`reason_ko`)와 인용 몇 줄, 노드 이름과 버전, 필수 선행(`quest-edges.json`)뿐이다.

기계로 읽는 같은 내용은 `data/manual/sample-review-2026-11-11.json`에 있다. 판정을 채운 뒤 이 파일을 근거로 `recommended-edges.json`의 `review`를 사람이 바꾼다.

## 2. 표본 추출

- 등급별 층화 무작위 추출. 강함 9, 중간 9, 연함 9, 모두 27개.
- 시드 `20261111`. 난수는 mulberry32 하나를 쓴다.
- 등급마다 연결선을 `source->target` 문자열 오름차순으로 정렬하고, 강함, 중간, 연함 순서로 Fisher-Yates 셔플을 한 뒤 앞 9개를 뽑는다. 같은 데이터와 시드면 같은 표본이 나온다.
- 추출 스크립트는 저장소에 넣지 않았다(/tmp에서 실행). 위 방법만 따르면 다시 만들 수 있다.

## 3. 사전 점검 요약

| 등급 | 문제 없어 보임 | 확인 필요 | 의심 |
|---|---|---|---|
| 강함 | 4 | 4 | 1 |
| 중간 | 4 | 4 | 1 |
| 연함 | 5 | 4 | 0 |
| 합계 | 13 | 12 | 2 |

기계로 본 항목: 출시 순서(역전 0건), 필수 선행 중복(직접·간접, 3건: 2·14·22번), 반대 방향 필수 선행(0건), Fandom 권장 선행과 중복(1건: 23번), 노드 누락(2건: 8·27번), 이유의 영문 용어가 인용에 없는지. 그 위에 인용이 이유를 뒷받침하는지, 등급이 맞는지, 이유의 한국어 표기가 공식명과 맞는지를 Claude가 읽고 표시했다.

표본 밖에서도 보이는 점:

- 필수 선행 중복 3건은 후보 스크립트(`candidates2.mjs`)가 막 단위로만 필수 선행을 따라가서 연쇄 임무·단일 임무를 거치는 경로를 놓친 탓으로 보인다. 같은 검사를 전체 216개에 돌리면 33개가 이미 필수 선행으로 이어져 있다(강함 18, 중간 5, 연함 10). 반대로 B가 A의 필수 선행인 연결선도 2개 있다(연함 `series_neko_is_a_cat->series_seirai_stormchasers`, `chain_tadhla_the_falcon->series_the_dirge_of_bilqis`). 둘 다 표본 밖이다.
- 7.2 막을 가리키는 연결선은 덤프 이관 뒤 노드가 없다(전체 9개, [덤프 이관](2026-11-11-dump-migration.md) 참고). `versions.json`에도 7.2가 없다.
- 선행(A)이 복각되지 않는 이벤트인 연결선이 전체 29개다(강함 10, 중간 2, 연함 17). 지금 하려 해도 할 수 없는 임무를 권하는 셈이라 따로 정할 문제다.
- 이유(`reason_ko`)의 한국어 표기가 공식명과 다른 곳이 여럿 있다(카논→캐넌, 봉고헤드→둥둥 모자 등). 판정과 별개로 화면에 내기 전에 고쳐야 한다.

## 4. 검수 방법

항목마다 아래를 보고 "사람 판정"에 맞음 / 틀림 / 애매 중 하나와 메모를 적는다. 사전 점검 표시는 참고만 한다.

1. **A를 건너뛰면 B에서 길을 잃는가.** B를 할 때 A에서 나온 인물·사건·설정을 모르면 이해가 안 되거나, B가 A의 결말을 미리 밝히는가. 인용은 몇 줄뿐이니 기억이나 직접 플레이로 판단한다. 다른 임무(특히 B의 필수 선행)에서 같은 정보를 이미 얻는다면 "틀림" 또는 "애매"다.
2. **순서가 맞는가.** A가 B보다 먼저 나왔고, 방향이 거꾸로가 아닌가(B를 먼저 해야 A가 이해되는 경우).
3. **등급이 맞는가.** 강함 = B가 A의 큰 사건을 스포일러하거나 그 사건에 기댄다. 중간 = 누가 누구인지, 무슨 일이 있었는지를 A에서 알아야 한다(혼란 정도 4~5). 연함 = A를 알면 좋지만 B만으로도 따라갈 수 있다(혼란 정도 3). 선 자체는 맞고 등급만 다르면 "애매"로 적고 메모에 맞는 등급을 쓴다.
4. 이유 문장에 인용에 없는 사실이 섞였으면 그 사실이 맞는지도 메모한다.

오류율은 "틀림"을 등급별로 세어 낸다. "애매"는 따로 센다. 판정은 `data/manual/sample-review-2026-11-11.json`의 `human_verdict`(맞음/틀림/애매)와 `human_note`에도 옮긴다.

## 5. 표본 목록

| # | 등급 | A (선행) | B (후행) | 사전 점검 | 사람 판정 |
|---|---|---|---|---|---|
| 1 | 강함 | 비마나 경전 | 「바나」가 치유될 때까지 | 문제 없어 보임 | 맞음 |
| 2 | 강함 | 「거울 속 왕국」 | 해초 바다 탐색 | 확인 필요 | 맞음 |
| 3 | 강함 | 달의 동쪽, 태양의 서쪽 | 시간을 초월한 유성 | 확인 필요 | 애매 (중간이 맞음) |
| 4 | 강함 | 눈물 없는 내일을 위해 | 돌아온 바람 잡는 이방인 | 확인 필요 | 맞음 |
| 5 | 강함 | 키니치의 거래 | 뜨거운 환혼시 | 문제 없어 보임 | 애매 (연함이 맞음) |
| 6 | 강함 | 허공의 선동, 타오르는 겁화 | 오가는 나비들 | 문제 없어 보임 | 애매 (중간이 맞음) |
| 7 | 강함 | 눈물 없는 내일을 위해 | 여름! 섬? 모험! | 문제 없어 보임 | 애매 (연함이 맞음) |
| 8 | 강함 | 궁전과 무덤 | A Mirror That Reflects the Foe | 확인 필요 | 애매 |
| 9 | 강함 | 우리가 잃어버린 것 | 신이 사랑하지 않은 설국 | 의심 | 애매 (연함이 맞음) |
| 10 | 중간 | 유적 조사·생존 훈련소 | 공허 겁회의 푸라나 | 확인 필요 | 애매 (연함이 맞음) |
| 11 | 중간 | 바람 잡는 이방인 | 돌아온 바람 잡는 이방인 | 문제 없어 보임 | 맞음 |
| 12 | 중간 | 눈보라와 푸른숲의 춤 | 무인선 | 확인 필요 | 애매 (연함이 맞음) |
| 13 | 중간 | 긴 밤의 서막 | 악행의 대가 | 문제 없어 보임 | 애매 (연함이 맞음) |
| 14 | 중간 | 희미한 메아리 | 울려 퍼지는 기도 | 확인 필요 | 맞음 |
| 15 | 중간 | 이야기라는 이름의 마법 | 마녀의 계시・강시 | 의심 | 틀림 |
| 16 | 중간 | 윈드블룸의 숨결 | 세계 | 문제 없어 보임 | 애매 (연함이 맞음) |
| 17 | 중간 | 약속과 망각 사이에서 | 타오를 운명의 무지개 | 확인 필요 | 애매 (연함이 맞음) |
| 18 | 중간 | 배리의 순간 | 해답 | 문제 없어 보임 | 틀림 |
| 19 | 연함 | 미니 버섯몬 판타지 | 느긋한 리듬 댄스 파티 | 문제 없어 보임 | 틀림 |
| 20 | 연함 | 용에게 선택받은 자의 여정 | 귀환의 날갯짓 | 문제 없어 보임 | 맞음 |
| 21 | 연함 | 잔 속에서 울리는 노래 | 원정을 떠난 이에게 | 확인 필요 | 맞음 |
| 22 | 연함 | 신이 사랑하지 않은 설국 | 여왕의 새 초상화 | 확인 필요 | 맞음 |
| 23 | 연함 | 의사의 마음 | 봄볕의 복숭아 부적 | 확인 필요 | 맞음 |
| 24 | 연함 | 버섯몬 기관 대전 | 버섯몬 여행기 | 문제 없어 보임 | 맞음 |
| 25 | 연함 | 눈보라와 푸른숲의 춤 | 총과 실의 포위망 | 문제 없어 보임 | 맞음 |
| 26 | 연함 | 안개와 어두운 숲을 지나 | 천국 | 문제 없어 보임 | 틀림 |
| 27 | 연함 | 천국 | Hour of Ruin | 확인 필요 | 맞음 |

## 6. 판정 결과

판정은 2026-11-11에 저장소 관리자 의견과 아카라이브 게시글 댓글을 종합해 정했다. 게시글에는 임무 이름·버전·등급만 올렸고 이유와 인용은 올리지 않았다.

| 등급 | 맞음 | 애매 | 틀림 |
|---|---|---|---|
| 강함 | 3 | 6 | 0 |
| 중간 | 2 | 5 | 2 |
| 연함 | 7 | 0 | 2 |
| 합계 | 12 | 11 | 4 |

- 틀림은 4/27(15%)이다. 모집단 등급 비율(89/32/95)로 가중하면 약 13%다. 15·18·19·26번.
- 애매 11개 중 10개는 선은 맞고 등급이 높다는 판정이다(강함→중간 2, 강함→연함 3, 중간→연함 5). 등급을 올리라는 판정은 없다. 8번은 등급 의견 없이 애매다.
- 등급까지 맞은 것은 12/27(44%)이다. LLM이 등급을 체계적으로 높게 매긴다.
- 사전 점검은 틀림 4개 중 3개를 "문제 없어 보임"으로 표시했다. 사전 점검만으로 거를 수 없다.
- 등급당 9개라 비율의 오차는 크다. 등급이 높게 매겨지는 경향은 뚜렷하다.

**데이터 반영 (2026-11-11).** 판정은 `data/manual/edge-reviews.json`에 옮기고 `scripts/recommend/apply-reviews.mjs`가 `recommended-edges.json`에 적용한다. 틀림 4개는 지웠다. 맞음 12개와 등급 의견이 있는 애매 10개는 `verified`로 바꾸었고, 애매 10개는 사람이 정한 등급으로 낮췄다(원래 등급은 `llm_tier`에 남김). 등급 의견이 없는 8번은 `unreviewed`로 둔다. 표본 밖 187개는 그대로 둔다. 화면의 미검수 표시는 목록 안에 사람이 확인하지 않은 LLM 연결선이 있을 때만 나온다. 결과는 210개(강함 84, 중간 27, 연함 99)이며 그중 22개가 `verified`다.

## 7. 항목별 자료

### 1. 비마나 경전 → 「바나」가 치유될 때까지 (강함)

- 연결선: `series_vimana_agama->single_until_vana_is_healed`
- A: 비마나 경전 (Vimana Agama). 시리즈, 3.0, WORLD, Sumeru
- B: 「바나」가 치유될 때까지 (Until Vana is Healed). 단일 임무, 3.0, WORLD, Sumeru
- 공개 버전(revealed_version): 3.0. 등급: strong. 판정 sonnet, 검증 ember
- 이유: 「비마나 경전」에서 폐허 골렘, 크샤레와르, 그리고 사고로 연구 결과를 잃은 피르 카비카부스가 소개되고, 「「바나」가 치유될 때까지」는 이를 이미 아는 것으로 전제하며 사고로 사라진 연구 결과가 발견되는 결말을 보여준다. 따라서 먼저 플레이하지 않으면 이 미스터리의 결과가 스포일러가 된다.
- A 인용:
  - Jazari: With his achievements, he would have become a sage sooner or later. But he met with an accident during an expedition, and his research results were lost.
  - Jazari: Exploring the Ruin Golem from the inside seems to be the only solution, and I am presently looking for a way in.
- B 인용:
  - Paimon: But he also said Pir Kavikavus got into an accident on an expedition and all his key findings were lost.
  - Paimon: But he wasn't making headway until we finally got into the Ruin Golem with him last time.
  - Jazari: Not only have records of Pir Kavikavus's long-lost research been recovered, but now I'm testing his theory, and it was a success.
- 검증 메모(ember): A에서 소개된 피르 카비카부스의 사고로 사라진 연구 결과가 B에서 회복되는 전개로 이어져 먼저 플레이하지 않으면 그 결과가 스포일러가 된다는 점이 인용문으로 확인된다.
- 출처: [Royinjan's Chapter: Linga](https://genshin-impact.fandom.com/wiki/Royinjan's_Chapter%3A_Linga) rev 2131114, [Until Vana is Healed](https://genshin-impact.fandom.com/wiki/Until_Vana_is_Healed) rev 2139031
- **사전 점검: 문제 없어 보임.** 인용이 A의 연구 분실과 B의 연구 회복을 그대로 보여 준다. 같은 버전(3.0)이다.
- 표기: 이유의 "폐허 골렘"은 공식명 "유적 거상", "피르 카비카부스"는 "대스승 카비카부스"다. "크샤레와르"는 인용에 없고 데이터에 공식명이 없다.
- **사람 판정: 맞음.**

### 2. 「거울 속 왕국」 → 해초 바다 탐색 (강함)

- 연결선: `act_kingdom_through_the_looking_glass->act_search_in_the_algae_sea`
- A: 「거울 속 왕국」 (Kingdom Through the Looking-Glass). 막, 4.0, WORLD, Fontaine
- B: 해초 바다 탐색 (Search in the Algae Sea). 막, 4.2, WORLD, Fontaine
- 공개 버전(revealed_version): 4.2. 등급: strong. 판정 sonnet, 검증 ember
- 이유: 「「거울 속 왕국」」은 릴리스 공주를 구하러 간다는 동화 속 모험과 안, 알, 작은 양배추를 소개하고 릴리스의 정체를 미스터리로 남깁니다. 「해초 바다 탐색」은 릴리스가 사실 붉은 여제이자 마리안과 하나로 섞인 인물이라는 답을 밝히고, 앞선 이야기에서 만난 안, 알 일행을 이미 아는 사이로 전제합니다.
- A 인용:
  - Paimon: Well, let's continue on. Princess Lyris is still waiting for us at the end of the line!
  - Ann: If she isn't... Our adventures... their meaning... Al, Petit Chou, and the others...
- B 인용:
  - Ann: Well, I didn't do that! I actually had to get to know Petit Chou, Al, and the others first.
  - Traveler: If so, then "Mary-Ann" is Lyris. Another piece of evidence we have is that they can both use Oceanid powers to control Annapausis.
  - Al: Hohoho! Yes, it is us. And you are... Knight and Paimon?
- 검증 메모(ember): A에서 리리스 공주 구조 모험과 안·알·프티 슈가 소개되고 B에서 이미 아는 사이로 전제되며 리리스가 붉은 여제이자 메리앤과 섞인 존재라는 답이 드러나므로 주장이 뒷받침된다.
- 출처: [Kingdom Through the Looking-Glass](https://genshin-impact.fandom.com/wiki/Kingdom_Through_the_Looking-Glass) rev 2171444, [Search in the Algae Sea](https://genshin-impact.fandom.com/wiki/Search_in_the_Algae_Sea) rev 2139817
- **사전 점검: 확인 필요.** A는 이미 B의 필수 선행이다(「거울 속 왕국」 > 「그녀가 더는 당신을 꿈꾸지 않는다면…」 > 최초의 사실 > 해초 바다 탐색). 내용은 인용과 맞지만 권장선이 중복된다.
- 표기: 이유에 「「거울 속 왕국」」으로 괄호가 겹쳐 있다.
- **사람 판정: 맞음.**

### 3. 달의 동쪽, 태양의 서쪽 → 시간을 초월한 유성 (강함)

- 연결선: `series_east_of_the_moon_west_of_the_sun->act_a_star_out_of_time`
- A: 달의 동쪽, 태양의 서쪽 (East of the Moon, West of the Sun). 시리즈, Luna I, WORLD, Nod-Krai
- B: 시간을 초월한 유성 (A Star Out of Time). 막, Luna IV, WORLD, Nod-Krai
- 공개 버전(revealed_version): Luna IV. 등급: strong. 판정 sonnet, 검증 codex
- 이유: 「시간을 초월한 유성」은 「달의 동쪽, 태양의 서쪽」에서 처음 등장한 궁극의 재앙과 그 주인 로트왕(교수), 그리고 리드 밀러라는 이름의 계승 설정을 이미 아는 것을 전제로 합니다. 「달의 동쪽, 태양의 서쪽」에서 재앙이 교수를 주인으로 섬기며 "리드 밀러"를 사칭한 인물이 있었다는 내용이 나오는데, 「시간을 초월한 유성」은 그 교수와의 대면 및 알리아가 리드 밀러의 이름을 잇겠다는 결말로 이어집니다.
- A 인용:
  - Ultimate Calamity: No, no, you're not Grazina... I can't detect your scent. What are you? A living being, or another spirit flying aimlessly across the bedeviled sky?
  - Ultimate Calamity: My master... Professor Rotwang... reduced that pathetic world to ashes with the "SAMPO." After all that destruction, this bunker is all that remains, isolated amid the bedeviled sky...
- B 인용:
  - 30px|link=Paimon Paimon: What!? Didn't we already beat this thing before...
  - Alia: You might have called me Relya by mistake, but it suits me all the same. I carry his role and legacy, and the name Reed Miller is one I will take without hesitation.
- 검증 메모(codex): A에서 궁극의 재앙이 로트방 교수를 주인으로 부르고 여행자에게 패배하며 리드 밀러의 사칭·계승 설정이 제시되는데, B는 재앙을 이미 쓰러뜨렸다는 회상과 알리아의 이름 계승 선언으로 이를 이어갑니다.
- 출처: [The Shoemaker's Children Go Barefoot](https://genshin-impact.fandom.com/wiki/The_Shoemaker's_Children_Go_Barefoot) rev 2150088, [A Star Out of Time](https://genshin-impact.fandom.com/wiki/A_Star_Out_of_Time) rev 2151709
- **사전 점검: 확인 필요.** 이유의 "리드 밀러를 사칭한 인물" 설정이 A 인용에 없고, B의 "this thing"이 궁극의 재앙인지 인용만으로는 알 수 없다.
- 표기: "로트왕"(Rotwang)은 데이터에 공식 한국어명이 없다. B 인용에 위키 마크업 "30px|link=Paimon"이 남아 있다.
- **사람 판정: 애매.** 등급은 중간이 맞음.

### 4. 눈물 없는 내일을 위해 → 돌아온 바람 잡는 이방인 (강함)

- 연결선: `act_for_a_tomorrow_without_tears->event_homeward_he_who_caught_the_wind`
- A: 눈물 없는 내일을 위해 (For a Tomorrow Without Tears). 막, 1.0, ARCHON, Mondstadt
- B: 돌아온 바람 잡는 이방인 (Homeward, He Who Caught the Wind). 이벤트, Luna V, EVENT, Mondstadt
- 공개 버전(revealed_version): Luna V. 등급: strong. 판정 sonnet, 검증 codex
- 이유: 「눈물 없는 내일을 위해」에서 벤티가 바르바토스라는 정체가 드러나고, 다이루크가 기사단을 떠난 인물로 소개되며, 시뇨라가 등장합니다. 「돌아온 바람 잡는 이방인」은 이런 사실을 이미 아는 것으로 전제하며 연극으로 재연되는 성금 탐색 사건의 결말도 보여 줍니다.
- A 인용:
  - Venti: I, the best wandering bard of the mortal world, shall begin my performance with the Holy Lyre.
  - Diluc: No. 8 of The Eleven Harbingers. Goes by the name Signora.
  - Diluc: That's one of the reasons I don't like the Knights of Favonius.
- B 인용:
  - Jean: Luckily, Venti... Or, rather, Lord Barbatos agreed to help. After that, I opened up recruitment to the people of Mondstadt.
  - Diluc: Well, Jean wanted my input on everything... Even though I left the Knights, Grand Master Varka has done a lot for me.
  - Venti: Heh, her Harbingers do often tend to take a rather extreme approach. Just look at Childe or Signora.
- 검증 메모(codex): A는 시뇨라를 우인단 집행관으로 소개하고 성금 회수 사건을 보여 주며, B는 시뇨라를 이미 아는 인물로 언급하고 해당 사건을 과거의 일로 재연하므로 선행 플레이 권고가 뒷받침됩니다.
- 출처: [For a Tomorrow Without Tears](https://genshin-impact.fandom.com/wiki/For_a_Tomorrow_Without_Tears) rev 2188925, [Honorary Knight's Notes on Mixology](https://genshin-impact.fandom.com/wiki/Honorary_Knight's_Notes_on_Mixology) rev 2138044
- **사전 점검: 확인 필요.** 이유의 핵심인 벤티=바르바토스 공개와 다이루크의 기사단 탈퇴가 A 인용에 직접 나오지 않는다(시뇨라 소개만 확인됨). 정체 공개가 서막 1~3막 중 어디인지 봐야 한다. 같은 B에 11번(1막, medium)도 있다.
- **사람 판정: 맞음.**

### 5. 키니치의 거래 → 뜨거운 환혼시 (강함)

- 연결선: `act_kinich_s_deal->act_incandescent_ode_of_resurrection`
- A: 키니치의 거래 (Kinich's Deal). 막, 5.0, STORY, Natlan
- B: 뜨거운 환혼시 (Incandescent Ode of Resurrection). 막, 5.3, ARCHON, Natlan
- 공개 버전(revealed_version): 5.3. 등급: strong. 판정 sonnet, 검증 ember
- 이유: 「키니치의 거래」에서 산의 왕(콩가마토)이 폭주 끝에 번개 같은 불꽃(회고의 불)으로 구원받고, 부르키나가 그를 위해 희생했다는 사연과 회고의 불의 의미가 밝혀집니다. 「뜨거운 환혼시」는 콩가마토가 부르키나를 꿈에서 보았다는 이야기와 회고의 불의 '대가' 개념을 이미 아는 것으로 전제하므로 먼저 보는 것이 좋습니다.
- A 인용:
  - Kinich: Burkina didn't fall to the Abyss — he was killed by the Mountain King in an episode of madness. In his final moments, Burkina made the fateful decision to not fight back, and instead pass his blood and power onto the Mountain King.
  - Wayna: And that fire is what saved the Mountain King.
  - Kongamato: Burkina...?
- B 인용:
  - Kongamato: Recently, I saw him again in my dreams... my most trusted partner, Burkina.
  - Kinich: The name of "Turnfire" teaches us that everything comes at a price. We've offered generations of blood and tears to this war, and now, it's time to collect.
  - Kongamato: During the Turnfire Night, I once said... "May the will of Kongamato... march ever on, until the Abyss is stamped out."
- 검증 메모(ember): A에서 버키나가 산의 왕에게 혈액과 힘을 넘겨준 희생과 Turnfire가 산의 왕을 구했다는 설명이 나오고, B에서는 Turnfire의 대가 개념과 버키나를 꿈에서 본다는 이야기를 이미 아는 것으로 사용하므로 주장이 성립합니다.
- 출처: [Kinich's Deal](https://genshin-impact.fandom.com/wiki/Kinich's_Deal) rev 2199488, [Incandescent Ode of Resurrection](https://genshin-impact.fandom.com/wiki/Incandescent_Ode_of_Resurrection) rev 2200850
- **사전 점검: 문제 없어 보임.** 부르키나의 희생과 회고의 불이 양쪽 인용에 모두 나오고, B가 이를 설명 없이 쓴다.
- 표기: "번개 같은 불꽃"이라는 표현은 인용에 근거가 없다.
- **사람 판정: 애매.** 등급은 연함이 맞음.

### 6. 허공의 선동, 타오르는 겁화 → 오가는 나비들 (강함)

- 연결선: `act_akasha_pulses_the_kalpa_flame_rises->act_comings_and_goings`
- A: 허공의 선동, 타오르는 겁화 (Akasha Pulses, the Kalpa Flame Rises). 막, 3.2, ARCHON, Sumeru
- B: 오가는 나비들 (Comings and Goings). 막, 3.6, EVENT, Sumeru
- 공개 버전(revealed_version): 3.6. 등급: strong. 판정 ember, 검증 codex
- 이유: 「오가는 나비들」에서 아자르와 그 일행이 이미 축출되었다는 것을 전제로 하므로, 먼저 「허공의 선동, 타오르는 겁화」를 끝내야 그 결말을 스포일러 없이 볼 수 있다.
- A 인용:
  - Nilou: It's such a blessing that Lesser Lord Kusanali was able to return to power at the Akademiya.
  - Dehya: Why? Because he dethroned Azar from power?
- B 인용:
  - Tighnari: Well, the atmosphere at the Akademiya has improved immensely since Azar and his ilk were deposed.
- 검증 메모(codex): A에서 아자르의 실각과 나히다의 권력 복귀가 확인되고, B는 아자르 일행이 축출된 뒤 아카데미아의 분위기가 개선되었다고 명시하므로 A의 결말을 스포일러한다는 주장은 타당하다.
- 출처: [Akasha Pulses, the Kalpa Flame Rises](https://genshin-impact.fandom.com/wiki/Akasha_Pulses%2C_the_Kalpa_Flame_Rises) rev 2139075, [Comings and Goings](https://genshin-impact.fandom.com/wiki/Comings_and_Goings) rev 2172098
- **사전 점검: 문제 없어 보임.** A에서 아자르가 실각하고 B가 이를 전제로 말하는 것이 인용으로 바로 확인된다.
- **사람 판정: 애매.** 등급은 중간이 맞음.

### 7. 눈물 없는 내일을 위해 → 여름! 섬? 모험! (강함)

- 연결선: `act_for_a_tomorrow_without_tears->event_midsummer_island_adventure`
- A: 눈물 없는 내일을 위해 (For a Tomorrow Without Tears). 막, 1.0, ARCHON, Mondstadt
- B: 여름! 섬? 모험! (Midsummer Island Adventure). 이벤트, 1.6, EVENT, Mondstadt
- 공개 버전(revealed_version): 1.6. 등급: strong. 판정 sonnet, 검증 ember
- 이유: 「눈물 없는 내일을 위해」에서 벤티가 바르바토스(풍신)임이 드러나고 드발린과 친구 관계라는 점이 밝혀지며, 플레이어는 진, 다이루크, 벤티와 처음 만나 서로를 아는 사이가 됩니다. 「여름! 섬? 모험!」은 벤티가 드발린을 불러내는 장면과 다이루크, 진의 역할을 이미 아는 것을 전제로 하므로, 먼저 보지 않으면 정체 반전이 스포일러가 되고 상황이 혼란스럽습니다.
- A 인용:
  - Venti: Hehe... You've known my true identity for some time now, haven't you Jean?
  - Venti: Dvalin used to be my friend... I still regard him as such.
  - Jean: This is not something that an Honorary Knight can accomplish alone. I will mobilize the rest of the knights to assist.
- B 인용:
  - Venti: This is a secret between us here, so don't tell anyone else.
  - Traveler: (Oh jeez, has he discovered that Venti is...)
  - Kaeya: Who knew that everyone's favorite bard had the power to summon dragons?
- 검증 메모(ember): A에서 Venti의 정체와 Dvalin과의 친구 관계가 드러나고 B에서는 Venti가 Dvalin을 불러내는 것을 전제하며 그 비밀로 취급하므로 A를 먼저 볼 필요가 있다는 주장이 발췌문으로 뒷받침된다.
- 출처: [For a Tomorrow Without Tears](https://genshin-impact.fandom.com/wiki/For_a_Tomorrow_Without_Tears) rev 2188925, [A Trip Through Fog and Wind](https://genshin-impact.fandom.com/wiki/A_Trip_Through_Fog_and_Wind) rev 1809530
- **사전 점검: 문제 없어 보임.** A에서 벤티의 정체와 드발린과의 관계가 드러나고, B는 벤티가 용을 부른 일을 비밀로 다룬다.
- **사람 판정: 애매.** 등급은 연함이 맞음.

### 8. 궁전과 무덤 → A Mirror That Reflects the Foe (강함)

- 연결선: `series_on_one_side_a_palace_on_the_other_a_tomb->act_a_mirror_that_reflects_the_foe`
- A: 궁전과 무덤 (On One Side a Palace, On the Other a Tomb). 시리즈, 7.0, WORLD, Snezhnaya
- B: A Mirror That Reflects the Foe (한국어명 없음). 막, 버전 모름(quests.json에 노드 없음)
- 공개 버전(revealed_version): 7.2. 등급: strong. 판정 sonnet, 검증 codex
- 이유: 「궁전과 무덤」에서는 도모보이 대공 알비스가 죽었다는 사실과 그가 누구인지에 대한 의문이 제기됩니다. 「증오를 비추는 거울」은 알비스의 시신 발견과 그의 죽음에 얽힌 진실(빛나는 자가 알비스의 살로 만들어졌고 알비스를 함께 죽였다는 것)을 밝히며, 알비스가 이미 죽었다는 사실을 전제로 합니다.
- A 인용:
  - Eye of Graeae: However, it seems he has recently passed away.
  - Paimon: Paimon wonders who this "Alvis" is...
  - Eye of Graeae: The Grand Duke of the Domovoy... This is the member for whom the most information may be found.
- B 인용:
  - Paimon: Grand Duke Alvis... There's a deep wound in his chest.
  - The Shimmering One: She and I killed Alvis together, yet she claimed that fragment of power before I could... She and I still have a score to settle.
  - Paimon: Still, with Grand Duke Alvis gone, and Princess Thrud... what's going to happen to Novokitezhgrad now?
- 검증 메모(codex): A에서 도모보이 대공 알비스의 신원과 사망 사실이 제시되고, B에서는 그의 시신과 살해 경위가 드러나며 사망 이후의 통치 문제까지 다루므로 주장이 뒷받침됩니다.
- 출처: [To Gaze Upon the Dreaming Pale Crown](https://genshin-impact.fandom.com/wiki/To_Gaze_Upon_the_Dreaming_Pale_Crown) rev 2199276, [A Mirror That Reflects the Foe](https://genshin-impact.fandom.com/wiki/A_Mirror_That_Reflects_the_Foe) rev 2203384
- **사전 점검: 확인 필요.** B(7.2 막)가 quests.json에 없어 이름과 버전을 확인할 수 없다(덤프 이관으로 빠짐). A 인용은 "알비스가 최근 죽었다"는 언급뿐이라, B가 A의 큰 사건을 스포일러한다기보다 이어받는 정도로 보여 strong이 높을 수 있다.
- 표기: B의 한국어명 「증오를 비추는 거울」은 데이터에 없다.
- **사람 판정: 애매.**

### 9. 우리가 잃어버린 것 → 신이 사랑하지 않은 설국 (강함)

- 연결선: `act_those_we_have_lost->act_everwinter_without_mercy`
- A: 우리가 잃어버린 것 (Those We Have Lost). 막, Luna VIII, EVENT, Fontaine
- B: 신이 사랑하지 않은 설국 (Everwinter Without Mercy). 막, 7.0, ARCHON, Snezhnaya
- 공개 버전(revealed_version): 7.0. 등급: strong. 판정 ember, 검증 codex
- 이유: 「신이 사랑하지 않은 설국」에서는 이미 죽은 줄 알았던 산드로네가 살아서 전권으로 활동하는 모습으로 등장하는데, 그 부활은 「우리가 잃어버린 것」에서 설명되는 죽음과 귀환의 중심 사건이므로 먼저 보지 않으면 스포일러이자 혼란이 된다.
- A 인용:
  - I've already "died" once. I'd be stupid not to make the most of this second chance.
  - Because we've been one all along...
- B 인용:
  - Greetings, Lady Marionette.
  - I'll take care of our guest here. It's first time in Snezhnaya, so it's no surprise that doesn't know the rules yet.
- 검증 메모(codex): 필수 선행 이야기에서는 샌드로네가 죽었다고 알려지지만, A에서는 죽음 이후 두 번째 기회를 얻어 살아 있음을 확인하고 B에서는 하빈저로 활동하므로, 귀환 과정의 세부 묘사와 무관하게 핵심 스포일러 주장은 뒷받침된다.
- 출처: [Those We Have Lost](https://genshin-impact.fandom.com/wiki/Those_We_Have_Lost) rev 2128192, [Everwinter Without Mercy](https://genshin-impact.fandom.com/wiki/Everwinter_Without_Mercy) rev 2179182
- **사전 점검: 의심.** B 인용의 "Lady Marionette"는 산드로네를 가리키지만, A 인용 두 줄은 화자가 없어 "한 번 죽었다"가 산드로네의 대사인지 인용만으로 확인할 수 없다. 검증 메모도 "귀환 과정의 세부 묘사와 무관하게"라며 이유 일부를 유보했다. A는 복각되지 않는 이벤트 막인데 마신 임무의 strong 선행으로 올라 있다.
- **사람 판정: 애매.** 등급은 연함이 맞음.

### 10. 유적 조사·생존 훈련소 → 공허 겁회의 푸라나 (중간)

- 연결선: `event_ruins_exploration_fieldwise_center->act_truth_amongst_the_pages_of_purana`
- A: 유적 조사·생존 훈련소 (Ruins Exploration: Fieldwise Center). 이벤트, Luna II, EVENT, Sumeru
- B: 공허 겁회의 푸라나 (Truth Amongst the Pages of Purana). 막, Luna VII, ARCHON, Sumeru
- 공개 버전(revealed_version): Luna VII. 등급: medium, rating 4. 판정 sonnet, 검증 ember
- 이유: 「유적 조사·생존 훈련소」에서 헤리샤프(염소왕)와 세 왕의 관계, 그리고 Zandik이라는 인물과 그에 대한 경고가 처음 소개됩니다. 「공허 겁회의 푸라나」는 플레이어가 이미 헤리샤프를 알고 있고 Zandik이 누구인지 안다고 전제하고 이야기를 진행합니다.
- A 인용:
  - Sethos: The middle one is the Goat King Heryshaf, Minister of Ministers, the god Amun's most trusted chancellor.
  - Layla: The author of those notes we found? The student named Zandik?
  - Recorded on the final day — Zandik.
- B 인용:
  - Thoth: Zandik... So it was him. I saw him in the desert once... A man of supreme arrogance... So this is where it has taken him.
  - Heryshaf: Naturally.
  - Il Dottore: "I," that is, Zandik, created Segments of various ages in his later years. To achieve this, he had to freeze time and part with a portion of his soul.
- 검증 메모(ember): A가 Heryshaf와 Zandik를 소개하고 B가 설명 없이 그들을 전제로 사용하므로 두 이야기의 선후 관계 주장이 성립한다.
- 혼란 정도 평가(4): Story B treats Zandik's identity, his fate, and Heryshaf's role as already known, so a player without A would lack who these figures are, though B's own dialogue partly explains Zandik's Segments.
- 출처: [Fieldwise Mastery, Unyielding Progress!](https://genshin-impact.fandom.com/wiki/Fieldwise_Mastery%2C_Unyielding_Progress!) rev 2133364, [Truth Amongst the Pages of Purana](https://genshin-impact.fandom.com/wiki/Truth_Amongst_the_Pages_of_Purana) rev 2199111
- **사전 점검: 확인 필요.** "헤리샤프와 잔디크가 처음 소개된다"는 주장이 맞는지 봐야 한다(그전 수메르 임무에 나왔을 수 있음). B의 도토레 대사가 잔디크를 일부 스스로 설명한다. A는 복각되지 않는 이벤트다.
- 표기: "Zandik"은 데이터에 공식 한국어명이 없어 영문 그대로 쓰였다.
- **사람 판정: 애매.** 등급은 연함이 맞음.

### 11. 바람 잡는 이방인 → 돌아온 바람 잡는 이방인 (중간)

- 연결선: `act_the_outlander_who_caught_the_wind->event_homeward_he_who_caught_the_wind`
- A: 바람 잡는 이방인 (The Outlander Who Caught the Wind). 막, 1.0, ARCHON, Mondstadt
- B: 돌아온 바람 잡는 이방인 (Homeward, He Who Caught the Wind). 이벤트, Luna V, EVENT, Mondstadt
- 공개 버전(revealed_version): Luna V. 등급: medium, rating 4. 판정 sonnet, 검증 ember
- 이유: 「바람 잡는 이방인」에서 암버·케이아·진과의 첫 만남, 바르바토스와 스톰테러(드발린)의 정체가 소개되는데, 「돌아온 바람 잡는 이방인」은 이들을 이미 아는 사이로 전제하고 드발린과 벤티를 재연 행사의 인물로 등장시킵니다.
- A 인용:
  - Lisa: The Dragon of the East, Stormterror — its real name, is Dvalin.
  - Amber: Oh... right. This is Kaeya, our Cavalry Captain.
  - Lisa: They are the Four Winds of Mondstadt, affiliated with Barbatos, the God of Anemo.
- B 인용:
  - Paimon: Back then, Dvalin was tainted by the Abyss, and Tone-Deaf Bard was about to heal his wounds.
  - Jean: Luckily, Venti... Or, rather, Lord Barbatos agreed to help.
  - Paimon: Ooh, that means we'll get to see Kaeya on stage!
- 검증 메모(ember): A에서 케이아와 드발린의 정체가 소개된 뒤 B에서는 두 인물이 이미 아는 사이로 설명 없이 등장하므로 주장이 뒷받침된다.
- 혼란 정도 평가(4): Story B is a reenactment of A's events and assumes the player knows Dvalin's corruption, Venti's identity as Barbatos, and characters like Jean and Kaeya, so a newcomer would be confused and also have A's reveals spoiled, though the festival context partly explains itself.
- 출처: [The Outlander Who Caught the Wind](https://genshin-impact.fandom.com/wiki/The_Outlander_Who_Caught_the_Wind) rev 2061397, [Honorary Knight's Notes on Mixology](https://genshin-impact.fandom.com/wiki/Honorary_Knight's_Notes_on_Mixology) rev 2138044
- **사전 점검: 문제 없어 보임.** 인용이 이유를 뒷받침한다. 다만 A는 게임 첫 임무라 모든 플레이어가 이미 했으므로 선의 정보 가치는 낮다. 4번(3막, strong)과 같은 B다.
- **사람 판정: 맞음.**

### 12. 눈보라와 푸른숲의 춤 → 무인선 (중간)

- 연결선: `act_a_dance_of_snowy_tides_and_hoarfrost_groves->series_the_unmanned_vessel`
- A: 눈보라와 푸른숲의 춤 (A Dance of Snowy Tides and Hoarfrost Groves). 막, Luna I, ARCHON, Nod-Krai
- B: 무인선 (The Unmanned Vessel). 시리즈, Luna VIII, WORLD, Nod-Krai
- 공개 버전(revealed_version): Luna VIII. 등급: medium, rating 4. 판정 sonnet, 검증 ember
- 이유: 「눈보라와 푸른숲의 춤」에서는 세 달의 여신(서리달 등)이 강림자들이 일으킨 전쟁 중 죽었다는 사실과 서리달의 정체가 설명됩니다. 「무인선」은 카논(서리달), 아리아, 소네트 자매와 강림자를 이미 아는 것처럼 다루므로 배경 지식으로 먼저 보면 도움이 됩니다.
- A 인용:
  - Lauma: Next was the Frost Moon... Smaller than her big sister, yet brightest in radiance. Her glow became the cold, undying lantern of the night.
  - Lauma: Afterwards... Well, as you have seen, the three Moon Goddesses perished.
- B 인용:
  - Aria: But I wasn't talking about that. I mean, I didn't expect you, the "Frost Moon," to have such a sentimental side. It's endearing.
  - Canon: That Descender's servant said they had matters to discuss with me about this world's gravitational potential and metric tensor.
- 검증 메모(ember): A는 서리달과 강림자들이 일으킨 전쟁을 소개하고 B는 서리달이라는 호칭과 강림자의 종을 설명 없이 이미 아는 것으로 전제하므로 약한 주장으로 지지됩니다.
- 혼란 정도 평가(4): B treats Canon as the Frost Moon goddess, Aria and Sonnet as her sisters, and the Descenders as already-known figures, so a player without A's account of the Moon Goddesses' deaths and Frost Moon's identity would be confused, though the scene's dialogue still partly works on its own.
- 출처: [A Dance of Snowy Tides and Hoarfrost Groves](https://genshin-impact.fandom.com/wiki/A_Dance_of_Snowy_Tides_and_Hoarfrost_Groves) rev 2171792, [The Unmanned Vessel (I)](https://genshin-impact.fandom.com/wiki/The_Unmanned_Vessel_(I)) rev 2202584
- **사전 점검: 확인 필요.** B는 캐넌을 서리달로 다루는데 A 인용은 서리달이 "죽었다"는 내용뿐이라, 캐넌=서리달이라는 정보의 출처가 A인지 불분명하다. "강림자"는 A 인용에 없다.
- 표기: 이유의 "카논"은 공식명 "캐넌", "소네트"는 "소넷"이다.
- **사람 판정: 애매.** 등급은 연함이 맞음.

### 13. 긴 밤의 서막 → 악행의 대가 (중간)

- 연결선: `act_prelude_to_the_night_vigil->single_to_turn_each_sin_against_the_sinner`
- A: 긴 밤의 서막 (Prelude to the Night Vigil). 막, Luna IV, WORLD, Nod-Krai
- B: 악행의 대가 (To Turn Each Sin Against the Sinner). 단일 임무, Luna IV, WORLD, Nod-Krai
- 공개 버전(revealed_version): Luna IV. 등급: medium, rating 4. 판정 sonnet, 검증 ember
- 이유: 「긴 밤의 서막」에서 일루가가 분대장으로 처음 소개되고 플레이어가 그의 분대 '나이트메어 오리올즈'에 정식 합류하며 '교수'(Professor)라는 존재가 설명됩니다. 「악행의 대가」는 플레이어가 이미 일루가 분대의 일원이라는 점과 이 괴물에 대한 배경을 전제로 대화합니다.
- A 인용:
  - Illuga: I hereby officially invite you to join my Investigation Squad, the Nightmare Orioles.
  - Illuga: By the "Professor," do you mean the fiend who was sealed within Kipumaki Cliff five hundred years ago by the Torchforger and the Moonchanter of the Frostmoon Scions?
- B 인용:
  - Paimon: We're not quite the "outsiders" you think, hehe. and I are already card-carrying members of Illuga's squad.
  - Janusz: To earn Captain Illuga's approval... You two really are extraordinary. But when it comes to that monster, knowing too much might not necessarily be a boon.
- 검증 메모(ember): A에서 일루가가 나이트메어 오리올즈에 정식 합류를 제안하며 교수·일루가를 설명하고 B는 플레이어가 이미 일루가 분대원이며 일루가를 설명 없이 사용하는 점을 전제로 하므로 주장이 뒷받침된다.
- 혼란 정도 평가(4): Story B presumes the player is already in Illuga's Nightmare Orioles squad and knows the Professor monster, both established in A, so a player skipping A would be confused about who Illuga is and what 'that monster' refers to.
- 출처: [Prelude to the Night Vigil](https://genshin-impact.fandom.com/wiki/Prelude_to_the_Night_Vigil) rev 2046299, [To Turn Each Sin Against the Sinner](https://genshin-impact.fandom.com/wiki/To_Turn_Each_Sin_Against_the_Sinner) rev 2187420
- **사전 점검: 문제 없어 보임.** 분대 합류 제안과 "교수"가 A 인용에 그대로 있고 B가 이를 전제한다. 같은 버전(Luna IV)이다.
- **사람 판정: 애매.** 등급은 연함이 맞음.

### 14. 희미한 메아리 → 울려 퍼지는 기도 (중간)

- 연결선: `chain_hoarse_echoes->act_melodious_chant`
- A: 희미한 메아리 (Hoarse Echoes). 연쇄 임무, 5.0, STORY, Natlan
- B: 울려 퍼지는 기도 (Melodious Chant). 막, 5.1, STORY, Natlan
- 공개 버전(revealed_version): 5.1. 등급: medium, rating 4. 판정 sonnet, 검증 ember
- 이유: 「희미한 메아리」에서 쉐븐, 트라졸리, 네히자와 그녀의 병, 고대 이름 장인이라는 배경, 화산 수정과 Blazegem Inscription 선물이 처음 소개되는데, 「울려 퍼지는 기도」는 플레이어가 이미 이들을 알고 있다고 가정하고 같은 선물과 생일 방문 이야기를 이어갑니다.
- A 인용:
  - Cheven: Ah, right, you wouldn't know. Tlazolli is a former Ancient Name artisan, and Nechca is her daughter.
  - Cheven: Her birthday's in a few days, so Tlazolli asked me to find a pure Volcanic Crystal to give her as a present.
  - Tlazolli: Well, it's a Blazegem Inscription. I made it from the purest ore, so it's almost completely resistant to erosion.
- B 인용:
  - Paimon: Hmm, it's been several days now... wonder if Tlazolli has finished making the Blazegem Inscription!
  - Traveler: Sounds just like one of Cheven's schemes...
  - Xilonen: So that's how you met her... She even wants to use Volcanic Crystal as a forging material... Guess she's really pulling out all the stops for her daughter.
- 검증 메모(ember): A가 소개한 Tlazolli, Nechca와 Volcanic Crystal 및 Blazegem Inscription 선물을 B가 이미 아는 것으로 전제하고 이어가므로 주장이 뒷받침됩니다.
- 혼란 정도 평가(4): Story B continues the Blazegem Inscription birthday-gift plot and refers to Tlazolli, Cheven's scheme, and the Volcanic Crystal as already known, so a player without A would not know who these people are or what the gift is about.
- 출처: [Tepetli Dissonance](https://genshin-impact.fandom.com/wiki/Tepetli_Dissonance) rev 2168835, [Melodious Chant](https://genshin-impact.fandom.com/wiki/Melodious_Chant) rev 2197069
- **사전 점검: 확인 필요.** A는 이미 B의 직접 필수 선행이다(quest-edges.json). 내용은 인용과 맞지만 권장선이 중복된다.
- **사람 판정: 맞음.**

### 15. 이야기라는 이름의 마법 → 마녀의 계시・강시 (중간)

- 연결선: `act_the_magic_known_as_storytelling->single_witch_s_revelation_instruction_of_curious_form`
- A: 이야기라는 이름의 마법 (The Magic Known as Storytelling). 막, Luna III, STORY, Mondstadt
- B: 마녀의 계시・강시 (Witch's Revelation: Instruction of Curious Form). 단일 임무, Luna VIII, WORLD, Fontaine
- 공개 버전(revealed_version): Luna VIII. 등급: medium, rating 4. 판정 sonnet, 검증 ember
- 이유: 「이야기라는 이름의 마법」에서 바르벨로스의 예언이 처음 소개되고 설명되는데, 「마녀의 계시・강시」는 플레이어가 이미 그 예언과 그 안에 등장하는 인물들을 안다고 가정하고 치치가 그중 한 명이었는지 언급합니다.
- A 인용:
  - After learning of Miss Barbeloth's prophecy, Durin and I finally came up with a way to settle the Dragonspine-Durin problem for good.
- B 인용:
  - Traveler: Wait... Those people in Barbeloth's prophecy...
  - Traveler: Wasn't Qiqi one of them?
- 검증 메모(ember): A에서 바르벨로스의 예언이 언급되며 소개되고 B에서는 설명 없이 예언의 인물들을 이미 아는 것으로 가정하므로 주장이 뒷받침된다.
- 혼란 정도 평가(4): B's line about Qiqi being one of the people in Barbeloth's prophecy only makes sense if the player knows the prophecy and its figures from A, so a player who skipped A would be confused, though it is a single exchange rather than the whole story.
- 출처: [The Magic Known as Storytelling](https://genshin-impact.fandom.com/wiki/The_Magic_Known_as_Storytelling) rev 2197321, [Witch's Revelation: Instruction of Curious Form](https://genshin-impact.fandom.com/wiki/Witch's_Revelation%3A_Instruction_of_Curious_Form) rev 2135453
- **사전 점검: 의심.** A 인용은 화자 없는 한 줄로 예언을 지나가며 언급할 뿐, 예언 속 인물이나 치치는 나오지 않는다. B도 두 줄짜리 언급이라 rating 4(medium)는 높아 보이고, 예언 속 인물을 소개한 임무가 따로 있을 수 있다. 평가 메모도 "한 번의 대화"라고 스스로 단서를 달았다.
- **사람 판정: 틀림.**

### 16. 윈드블룸의 숨결 → 세계 (중간)

- 연결선: `event_windblume_s_breath->act_of_this_world`
- A: 윈드블룸의 숨결 (Windblume's Breath). 이벤트, 3.5, EVENT, Mondstadt
- B: 세계 (Of This World). 막, Luna III, WORLD, Mondstadt
- 공개 버전(revealed_version): Luna III. 등급: medium, rating 4. 판정 sonnet, 검증 ember
- 이유: 「윈드블룸의 숨결」에서 헥센치르켈(마녀회)과 그 구성원들, 그리고 M이 어떤 인물인지 처음 소개되는데, 「세계」는 플레이어가 이를 이미 알고 있다고 전제하고 라인도티르의 전언과 'M의 아이'라는 언급을 다룹니다.
- A 인용:
  - Alice: Ever heard of the Hexenzirkel? As the spooky name suggests, it's a secret society
  - Alice: Hehe, it's also one of my favorite stories. M was an exceptional human writer who used her prose to teach me the meaning of grief.
  - Rhinedottir: I'm raising a son
- B 인용:
  - Traveler: So we're here at the Hexenzirkel's behest...
  - Durin: No, I... I'm just surprised. Rhinedottir is my mom's friend... And the mother of the dragon that once existed in my stead.
  - "Rhinedottir": "This is the first time we're meeting, so I'm not sure how to address you. But since you're M's child, I suppose I'll stick with 'Mini Durin.'"
- 검증 메모(ember): A에서 헥센치르켈과 M이 소개되고 B에서 설명 없이 이들을 전제하며 M의 아이와 Rhinedottir의 전언을 언급하므로 주장이 입증됩니다.
- 혼란 정도 평가(4): Story B relies on the player knowing what the Hexenzirkel is, who Rhinedottir is, and who M is (the 'M's child' address), all introduced in A, so a newcomer would be confused though the main plot could still be followed.
- 출처: [A Gathering of Outlanders](https://genshin-impact.fandom.com/wiki/A_Gathering_of_Outlanders) rev 1801555, [Of This World](https://genshin-impact.fandom.com/wiki/Of_This_World) rev 2189444
- **사전 점검: 문제 없어 보임.** 마녀회, M, 라인도티르가 A 인용에 있고 B가 설명 없이 쓴다. A는 복각되지 않는 이벤트다.
- 표기: 이유의 "헥센치르켈"은 공식명 "마녀회"와 병기돼 있다.
- **사람 판정: 애매.** 등급은 연함이 맞음.

### 17. 약속과 망각 사이에서 → 타오를 운명의 무지개 (중간)

- 연결선: `series_between_pledge_and_forgettance->act_the_rainbow_destined_to_burn`
- A: 약속과 망각 사이에서 (Between Pledge and Forgettance). 시리즈, 5.0, WORLD, Natlan
- B: 타오를 운명의 무지개 (The Rainbow Destined to Burn). 막, 5.1, ARCHON, Natlan
- 공개 버전(revealed_version): 5.1. 등급: medium, rating 4. 판정 sonnet, 검증 ember
- 이유: 「약속과 망각 사이에서」에서 고대 이름, 밤의 나라, 와요(대영혼) 같은 개념이 처음 소개되고 설명됩니다. 「타오를 운명의 무지개」는 플레이어가 이를 이미 알고 있다고 전제하고 고대 이름 수여와 밤의 나라의 군주 이야기를 전개합니다.
- A 인용:
  - Manqu: The Wayob and the Night Kingdom also reject this power, and as such, refuse to accept such Saurians.
  - Manqu: He obtained no Ancient Name, but Pacal is not to be taken lightly... so long as he's kept his training up these last few years.
- B 인용:
  - Paimon: The Lord of the Night? As in... the one who rules over the Night Kingdom!?
  - Sanhaj: You are the inheritor of my name, the hero from the Masters of the Night-Wind who shall fight for this generation.
- 검증 메모(ember): A의 인용문에서 밤의 나라와 Ancient Name가 처음 제기되고 B의 인용문에서는 이 개념을 설명 없이 이미 알려진 것으로 사용하므로 약한 연결 주장이 뒷받침된다.
- 혼란 정도 평가(4): B's story of Ancient Name inheritance and the Lord of the Night presumes the player knows what the Ancient Name, the Night Kingdom, and the Wayob are, as introduced in A, though B's dialogue gives some context.
- 출처: [Lost in the Woods](https://genshin-impact.fandom.com/wiki/Lost_in_the_Woods) rev 2197447, [The Rainbow Destined to Burn](https://genshin-impact.fandom.com/wiki/The_Rainbow_Destined_to_Burn) rev 2154937
- **사전 점검: 확인 필요.** 고대 이름과 밤의 신의 나라는 B의 필수 선행인 「영광의 꽃과 태양의 길」(5.0 마신 임무)에서 먼저 나왔을 가능성이 크다. 세계 임무 A가 "처음 소개"인지 확인해야 한다.
- 표기: "밤의 나라"는 공식명 "밤의 신의 나라"다. "와요"는 데이터에 없다(공식명 "대영혼").
- **사람 판정: 애매.** 등급은 연함이 맞음.

### 18. 배리의 순간 → 해답 (중간)

- 연결선: `act_paralogism->act_solution`
- A: 배리의 순간 (Paralogism). 막, 5.6, ARCHON, Mondstadt
- B: 해답 (Solution). 막, Luna III, WORLD, Mondstadt
- 공개 버전(revealed_version): Luna III. 등급: medium, rating 4. 판정 sonnet, 검증 ember
- 이유: 「배리의 순간」에서 삼자 회담(Tripartite Conference)이 소개되고 앨리스가 도도코 모습으로 등장하는데, 「해답」은 플레이어가 삼자 회담에서 헥세지르켈이 바르카에게 한 약속과 앨리스의 도도코 모습을 이미 알고 있다고 전제합니다.
- A 인용:
  - Jean: Anyway, the Tripartite Conference is a gathering of three parties — the Hexenzirkel, the Anemo Archon, and the joint forces of the Knights and Church of Favonius.
  - Alice: Darling, isn't it? It even has its own hat, hehe.
- B 인용:
  - Alice: Oh dear. Where should I begin... Ah, you know about the promise the Hexenzirkel made to Varka at the Tripartite Conference, yes?
  - (Alice pops out of the book in her Dodoco form)
- 검증 메모(ember): A에서 삼자 회의와 도도코 모습의 앨리스가 소개되고 B에서는 설명 없이 전제하므로 주장이 성립합니다.
- 혼란 정도 평가(4): Solution has Alice explicitly assume the player knows the Hexenzirkel's promise to Varka at the Tripartite Conference and shows her Dodoco form, so a player who skipped Paralogism would miss what the conference is, what was promised, and why Alice looks like Dodoco.
- 출처: [Paralogism](https://genshin-impact.fandom.com/wiki/Paralogism) rev 2039879, [Solution](https://genshin-impact.fandom.com/wiki/Solution) rev 2172575
- **사전 점검: 문제 없어 보임.** B의 앨리스가 삼자 회담의 약속을 아는지 직접 묻고, A 인용이 삼자 회담을 소개한다.
- 표기: "헥세지르켈"은 오타다(공식명 "마녀회"). "삼자 회담"은 데이터에 공식명이 없다.
- **사람 판정: 틀림.**

### 19. 미니 버섯몬 판타지 → 느긋한 리듬 댄스 파티 (연함)

- 연결선: `event_lil_fungi_s_fun_tastic_fiesta->event_dance_dance_easy_breezy_disco`
- A: 미니 버섯몬 판타지 (Lil' Fungi's Fun-Tastic Fiesta). 이벤트, 4.2, EVENT, Fontaine
- B: 느긋한 리듬 댄스 파티 (Dance Dance Easy-Breezy Disco). 이벤트, Luna VIII, EVENT, Natlan
- 공개 버전(revealed_version): Luna VIII. 등급: light, rating 3. 판정 sonnet, 검증 ember
- 이유: 「미니 버섯몬 판타지」에서 안지안느가 튀렌나의 옛 교관이자 법률 집행청 소속으로 처음 소개되는데, 「느긋한 리듬 댄스 파티」는 플레이어가 이미 안지안느와 튀렌나를 알고 있다고 전제하며 안지안느가 더 이상 법률 집행청 소속이 아니라는 변화도 보여줍니다.
- A 인용:
  - Enghiene: I'm Enghiene, and I was Turenna's drillmaster before she entered the Special Patrol!
  - Paimon: Uh, so this super arrogant Melusine... used to be Turenna's drillmaster?
- B 인용:
  - Enghiene: *sigh*... I'm no longer a member of the Maison Gardiennage. Under confidentiality regulations, Turenna can no longer report her work to me either.
  - Paimon: A Melusine and... Nusta?
- 검증 메모(ember): A에서 Enghiene이 Turenna의 옛 교관으로 소개되고 B에서는 Enghiene이 더 이상 Maison Gardiennage 소속이 아니며 Turenna가 업무를 보고할 수 없다고 전제하므로 주장이 뒷받침됩니다.
- 혼란 정도 평가(3): Enghiene's line about leaving the Maison Gardiennage and Turenna's confidentiality makes more sense with A's introduction of their drillmaster relationship, but the scene is still followable on its own.
- 출처: [Lil' Fungi's Fun-Tastic Fiesta!](https://genshin-impact.fandom.com/wiki/Lil'_Fungi's_Fun-Tastic_Fiesta!) rev 1644300, [Disco in Motion, Holiday Emotion!](https://genshin-impact.fandom.com/wiki/Disco_in_Motion%2C_Holiday_Emotion!) rev 2171001
- **사전 점검: 문제 없어 보임.** A에서 안지안느와 튀렌나의 관계가 소개되고 B가 그 변화를 보여 준다. light에 맞다.
- **사람 판정: 틀림.**

### 20. 용에게 선택받은 자의 여정 → 귀환의 날갯짓 (연함)

- 연결선: `series_in_the_footsteps_of_the_chosen_of_dragons->act_up_toward_homecoming_wings`
- A: 용에게 선택받은 자의 여정 (In the Footsteps of the Chosen of Dragons). 시리즈, 5.0, WORLD, Natlan
- B: 귀환의 날갯짓 (Up! Toward Homecoming Wings). 막, Luna VI, STORY, Nod-Krai
- 공개 버전(revealed_version): Luna VI. 등급: light, rating 3. 판정 sonnet, 검증 ember
- 이유: 「용에게 선택받은 자의 여정」에서 아기 테페틀리사우루스에게 '아구아라'라는 이름이 붙고 저주가 풀리는 과정이 소개되는데, 「귀환의 날갯짓」은 플레이어가 이미 아구아라를 알고 있다고 전제하고 재회 장면과 동료 관계를 그립니다.
- A 인용:
  - Oh right! Also, while hiding the egg, I gave it the name that I had long since planned to give it: Aguara.
  - Now that the little one's curse has been lifted, he can finally grow up big and strong!
- B 인용:
  - Paimon: Huh...? Aguara! What are you doing here?
  - Linnea: Hey, I'm curious — why does Aguara have a ribbon tied around his tail? And how did you two meet, anyway?
- 검증 메모(ember): A에서 아과라라는 이름과 저주가 풀리는 내용이 제시되고 B에서 이미 아는 동료처럼 재회하므로 주장은 뒷받침된다.
- 혼란 정도 평가(3): Aguara's identity and bond with the player make the reunion more meaningful, and Linnea's question about how they met recaps the context, so a player without A still follows the scene but misses some emotional weight.
- 출처: [A Saurian Lover's Ordinary Days](https://genshin-impact.fandom.com/wiki/A_Saurian_Lover's_Ordinary_Days) rev 2197258, [Up! Toward Homecoming Wings](https://genshin-impact.fandom.com/wiki/Up!_Toward_Homecoming_Wings) rev 2197170
- **사전 점검: 문제 없어 보임.** A에서 아구아라의 이름이 붙고, B가 재회로 이어진다. B에서 리네아가 만남 경위를 물어 일부 설명되므로 light에 맞다.
- **사람 판정: 맞음.**

### 21. 잔 속에서 울리는 노래 → 원정을 떠난 이에게 (연함)

- 연결선: `event_of_ballads_and_brews->act_to_those_who_embark_on_the_expedition`
- A: 잔 속에서 울리는 노래 (Of Ballads and Brews). 이벤트, 3.1, EVENT, Mondstadt
- B: 원정을 떠난 이에게 (To Those Who Embark on the Expedition). 막, Luna V, STORY, Nod-Krai
- 공개 버전(revealed_version): Luna V. 등급: light, rating 3. 판정 sonnet, 검증 ember
- 이유: 「잔 속에서 울리는 노래」에서 바르카와 미카가 처음 소개되고, 미카가 원정에 차출되었다가 기사단으로 돌아온 오랜 단원이며 수줍은 성격이라는 설명이 나옵니다. 「원정을 떠난 이에게」는 플레이어가 이미 바르카와 미카를 알고 있다고 전제하고 이야기를 진행합니다.
- A 인용:
  - Eula: Mika, the front-line land surveyor. He was a vital member of our team before the Grand Master borrowed him for the expedition.
  - Rosaria: Varka taught you how to use that sword, I take it? Swift but powerful. Heh, I can spot that old-timer's style anywhere.
- B 인용:
  - Paimon: Geez... How many people has he sent to deliver his mail now? Mika, Ineffa, Lohen... He should just hire a full-time mailman already!
  - Mika: Phew... The expedition is finally wrapping up. I hope the maps I made on our way there are good enough to get them safely home.
- 검증 메모(ember): A에서 미카가 원정에 차출된 기사단의 오랜 단원이며 수줍은 성격으로 소개되고 B에서는 설명 없이 메일 전달자와 지도 제작자로 전제되므로 이 주장은 뒷받침된다.
- 혼란 정도 평가(3): Story B treats Mika and Varka as already-known characters, so knowing A's introductions (Mika as the surveyor loaned out for the expedition) helps, but the quoted lines are self-explanatory enough that the story still works without A.
- 출처: [Sounds From Afar (Quest)](https://genshin-impact.fandom.com/wiki/Sounds_From_Afar_(Quest)) rev 2125279, [To Those Who Embark on the Expedition](https://genshin-impact.fandom.com/wiki/To_Those_Who_Embark_on_the_Expedition) rev 2197444
- **사전 점검: 확인 필요.** A 인용에서 바르카는 이름만 나올 뿐 소개되지 않아 "바르카와 미카가 처음 소개된다"는 주장이 맞는지 봐야 한다. A는 복각되지 않는 이벤트다. light라 영향은 작다.
- **사람 판정: 맞음.**

### 22. 신이 사랑하지 않은 설국 → 여왕의 새 초상화 (연함)

- 연결선: `act_everwinter_without_mercy->single_the_tsaritsa_s_new_portrait`
- A: 신이 사랑하지 않은 설국 (Everwinter Without Mercy). 막, 7.0, ARCHON, Snezhnaya
- B: 여왕의 새 초상화 (The Tsaritsa's New Portrait). 단일 임무, 7.1, WORLD, Snezhnaya
- 공개 버전(revealed_version): 7.1. 등급: light, rating 3. 판정 sonnet, 검증 ember
- 이유: 「신이 사랑하지 않은 설국」에서 로코트(포효단)와 스네즈나그라드 베체, 보댜니차 등이 처음 소개·설명되는데, 「여왕의 새 초상화」는 로코트 일원이 차르비차의 특사가 되었다는 사실과 보댜니차·알료샤의 관계를 이미 아는 것처럼 다룹니다. 먼저 보면 배경 이해에 도움이 됩니다.
- A 인용:
  - Vodyanitsa: As for Lelek... You won't have heard of him yet. He's currently the most famous member of the Rokot... Well, more like infamous.
  - Vodyanitsa: She's just rephrasing what Mr. Pantalone said. The Rokot are the critics he accuses of taking no responsibility for their actions.
- B 인용:
  - Vodyanitsa: Gotta say, I was pretty surprised by your letter, you two! A member of the Rokot serving as the Tsaritsa's special envoy?
  - Alyosha: Snezhnaya is covered in snow, even during the spring, so we commissioned an artist from Fontaine to bring our vision to life. We didn't even use all the funds... Guess I'll give the rest to the Rokot.
- 검증 메모(ember): A에서 로코트가 설명되고 B에서는 설명 없이 이미 아는 조직으로 사용되므로 약한 주장도 성립합니다.
- 혼란 정도 평가(3): Story B's references to the Rokot, Vodyanitsa, and Alyosha make more sense with A's introductions, but the quotes suggest B explains enough in context (an envoy letter, funds for the Rokot) that the story still works without A.
- 출처: [Everwinter Without Mercy](https://genshin-impact.fandom.com/wiki/Everwinter_Without_Mercy) rev 2179182, [The Tsaritsa's New Portrait](https://genshin-impact.fandom.com/wiki/The_Tsaritsa's_New_Portrait) rev 2199588
- **사전 점검: 확인 필요.** A는 이미 B의 필수 선행이다(신이 사랑하지 않은 설국 > 영혼의 야상곡 > 꿈에서 깨어난 백야 > 얼음 궁전의 편지 > 여왕의 새 초상화). 권장선이 중복된다.
- 표기: "Lelek"은 데이터에 공식명이 없다(이유에는 쓰이지 않음).
- **사람 판정: 맞음.**

### 23. 의사의 마음 → 봄볕의 복숭아 부적 (연함)

- 연결선: `act_the_heart_of_healing->event_springtime_charms`
- A: 의사의 마음 (The Heart of Healing). 막, 3.6, STORY, Liyue
- B: 봄볕의 복숭아 부적 (Springtime Charms). 이벤트, 5.3, EVENT, Liyue
- 공개 버전(revealed_version): 5.3. 등급: light, rating 3. 판정 sonnet, 검증 ember
- 이유: 「봄볕의 복숭아 부적」에서 장생이 "지난번 강리와 가양 사건"과 Mt. Qingce의 신의 잔해를 언급하며 이를 전제로 추측하는데, 이는 「의사의 마음」에서 소개되고 해결된 사건과 인물 배경입니다. 따라서 먼저 보면 맥락을 이해하는 데 도움이 됩니다.
- A 인용:
  - Baizhu: ...Nothing gets past you, Jiangli.
  - Jiangli: ...But you took such a huge risk. If we hadn't destroyed the gods' remains back there, then even you might have—
- B 인용:
  - Changsheng: Still musing about that, hmm... I suppose you're remembering the events with Jiangli and Jialiang from last time? It did cross our minds as well.
  - Traveler: About the god remains in Mt. Qingce...
- 검증 메모(ember): A에서 Jiangli와 Jialiang의 사건 및 신의 잔해 파괴가 전개되고 B에서 이를 지난번 사건으로 전제해 추측하므로 주장이 성립합니다.
- 혼란 정도 평가(3): Changsheng's reference to the Jiangli and Jialiang incident and the god remains at Mt. Qingce is a recap-style callback that adds context, but the player can still follow Springtime Charms without having played The Heart of Healing.
- 출처: [The Heart of Healing](https://genshin-impact.fandom.com/wiki/The_Heart_of_Healing) rev 2086628, [Custom Gift Envelope No. 1](https://genshin-impact.fandom.com/wiki/Custom_Gift_Envelope_No._1) rev 1785999
- **사전 점검: 확인 필요.** 같은 쌍이 Fandom 정보 상자의 권장 선행(quest-edges.json RECOMMENDED)에 이미 있다. 내용은 인용과 맞지만 LLM 선과 중복된다.
- **사람 판정: 맞음.**

### 24. 버섯몬 기관 대전 → 버섯몬 여행기 (연함)

- 연결선: `event_fungus_mechanicus->event_sightseeing_with_friends`
- A: 버섯몬 기관 대전 (Fungus Mechanicus). 이벤트, 3.5, EVENT, Sumeru
- B: 버섯몬 여행기 (Sightseeing With Friends). 이벤트, Luna V, EVENT, Sumeru
- 공개 버전(revealed_version): Luna V. 등급: light, rating 3. 판정 sonnet, 검증 ember
- 이유: 「버섯몬 여행기」는 「버섯몬 기관 대전」에서 소개된 하니야, 소우카, 봉고헤드, 킨들조이와의 관계, 그리고 밸푸어와 함께하는 보드게임 사업을 이미 아는 것으로 전제합니다. 소우카가 하니야와 동행하게 된 경위와 이들의 변화된 상황도 「버섯몬 기관 대전」에서 설명되므로 먼저 보면 맥락 이해에 도움이 됩니다.
- A 인용:
  - Haniyyah: Mr. Balfour will stay here to promote the test version of Fungus Mechanicus, so if you've not yet had your fill of fun, you can keep playing.
  - Haniyyah: It was her suggestions that led Najah to make all kinds of new Marvelous Jelly flavors. Our shroom buddies really do enjoy them.
- B 인용:
  - Haniyyah: Recently, aside from raising funds by operating tabletop games like Fungus Mechanicus and Lil' Fungi's Fun-Tastic Fiesta with Mr. Balfour's help...
  - Haniyyah: It's all thanks to Souka's guidance. She encouraged me to follow the students' lead and challenge myself to master the skills I needed to learn.
- 검증 메모(ember): A에서 발포어와 함께하는 보드게임 사업, 소우카가 하니야를 지도하는 관계, 봉고헤드 등 균류 친구들이 제시되고 B에서 이를 이미 아는 관계로 전제해 사용하므로 주장이 뒷받침됩니다.
- 혼란 정도 평가(3): B mentions Fungus Mechanicus, Mr. Balfour, and Souka's guidance of Haniyyah in passing with enough context to follow, but the characters' relationships and the business backstory make more sense with A, so the story still works without it.
- 출처: [Old Friends, New Game](https://genshin-impact.fandom.com/wiki/Old_Friends%2C_New_Game) rev 1683597, [Reunite, My Shroom Buddies!](https://genshin-impact.fandom.com/wiki/Reunite%2C_My_Shroom_Buddies!) rev 2071538
- **사전 점검: 문제 없어 보임.** 밸푸어와의 보드게임 사업, 소우카와 하니야의 관계가 양쪽 인용에 있다.
- 표기: "봉고헤드", "킨들조이"는 공식명 "둥둥 모자", "기쁨의 화염"이 아니며 인용에도 없다.
- **사람 판정: 맞음.**

### 25. 눈보라와 푸른숲의 춤 → 총과 실의 포위망 (연함)

- 연결선: `act_a_dance_of_snowy_tides_and_hoarfrost_groves->act_encirclement_of_bullets_and_silk`
- A: 눈보라와 푸른숲의 춤 (A Dance of Snowy Tides and Hoarfrost Groves). 막, Luna I, ARCHON, Nod-Krai
- B: 총과 실의 포위망 (Encirclement of Bullets and Silk). 막, Luna VI, EVENT, Nod-Krai
- 공개 버전(revealed_version): Luna VI. 등급: light, rating 3. 판정 sonnet, 검증 ember
- 이유: 「눈보라와 푸른숲의 춤」에서 네페르와 비밀의 전당(Curatorium of Secrets)이 처음 소개되고, 야호다가 네페르의 직원으로 복귀하는 관계가 나옵니다. 「총과 실의 포위망」은 이 세력과 인물들을 이미 아는 것처럼 전제하고 이야기를 진행합니다.
- A 인용:
  - Nefer: Wasn't that the deal?
  - Paimon: Wait a sec, how did you— Ohhh right, like you told us before... Your business is "dealing in information."
  - Jahoda: A... m—member of staff? Does that mean you're... accepting me back!?!
- B 인용:
  - Yelan: , you should come with me to meet the buyer. After all, we promised Nefer you would be involved in all our operations.
  - Beidou: Take these kids to the Curatorium. I'll update Yelan and tell her to meet you there.
  - Nefer: Looks like I'll need to enlist your services for a bit longer, .
- 검증 메모(ember): A에서 네페르의 정보 사업과 야호다의 직원 복귀 관계가 소개되고 B에서는 네페르와 전당을 설명 없이 이미 아는 것처럼 사용하므로 이 주장은 발췌 기준에서도 지지됩니다.
- 혼란 정도 평가(3): B mentions Nefer, the Curatorium, and a prior promise involving the Traveler, which make more sense with A's introductions, but the quotes show only light references so the story remains followable without A.
- 출처: [A Dance of Snowy Tides and Hoarfrost Groves](https://genshin-impact.fandom.com/wiki/A_Dance_of_Snowy_Tides_and_Hoarfrost_Groves) rev 2171792, [Encirclement of Bullets and Silk](https://genshin-impact.fandom.com/wiki/Encirclement_of_Bullets_and_Silk) rev 2133430
- **사전 점검: 문제 없어 보임.** A에서 네페르와 야호다의 관계가 소개되고 B가 네페르를 설명 없이 쓴다. light에 맞다.
- 표기: "비밀의 전당"(Curatorium of Secrets)은 데이터에 공식명이 없고 A 인용에도 없다.
- **사람 판정: 맞음.**

### 26. 안개와 어두운 숲을 지나 → 천국 (연함)

- 연결선: `act_through_mists_of_smoke_and_forests_dark->act_paradise`
- A: 안개와 어두운 숲을 지나 (Through Mists of Smoke and Forests Dark). 막, 3.0, ARCHON, Sumeru
- B: 천국 (Paradise). 막, Luna VI, WORLD, Other
- 공개 버전(revealed_version): Luna VI. 등급: light, rating 3. 판정 sonnet, 검증 ember
- 이유: 「안개와 어두운 숲을 지나」에서 적왕이 Rukkhadevata에게 배신당해 몰락했고 사후 부활을 믿는 추종자들이 있다는 설정이 처음 소개됩니다. 「천국」은 적왕과 그의 시대, 몰락을 플레이어가 이미 아는 것처럼 언급하므로 먼저 보면 맥락 이해에 도움이 됩니다.
- A 인용:
  - Tariq: King Deshret was the rightful God of Wisdom, but he was betrayed by a companion he trusted... She even stripped him of his title, "God of Wisdom."
  - Asfand: You bet they are. *sigh* King Deshret's been dead for thousands of years. Now they start spreading rumors of his return. Ridiculous!
- B 인용:
  - Venipi: But since Dex is with you, I suppose you're backup. My name is Venipi, and I come from an era when King Deshret's divine form still walked among us.
  - Vitruvius: This one over here got worked up upon hearing Kshama talk about the King's fall that he actually cried, "You lie! You lie!"
- 검증 메모(ember): A에서 King Deshret의 배신·몰락과 부활을 믿는 추종자 설정이 소개되고 B에서 King Deshret 시대와 그의 몰락이 설명 없이 이미 알려진 사실처럼 쓰이므로 주장이 뒷받침된다.
- 혼란 정도 평가(3): B's mentions of King Deshret and his fall make more sense with A's background on him, but the quotes show only a self-introduction and a reaction, so a new player can still follow B from context.
- 출처: [Through Mists of Smoke and Forests Dark](https://genshin-impact.fandom.com/wiki/Through_Mists_of_Smoke_and_Forests_Dark) rev 2139071, [Paradise](https://genshin-impact.fandom.com/wiki/Paradise) rev 2088537
- **사전 점검: 문제 없어 보임.** A에서 적왕의 배신과 몰락이 소개되고 B가 이를 알려진 사실로 쓴다. light에 맞다.
- 표기: "Rukkhadevata"는 데이터에 공식 한국어명이 없어 영문 그대로 쓰였다.
- **사람 판정: 틀림.**

### 27. 천국 → Hour of Ruin (연함)

- 연결선: `act_paradise->act_hour_of_ruin`
- A: 천국 (Paradise). 막, Luna VI, WORLD, Other
- B: Hour of Ruin (한국어명 없음). 막, 버전 모름(quests.json에 노드 없음)
- 공개 버전(revealed_version): 7.2. 등급: light, rating 3. 판정 sonnet, 검증 ember
- 이유: 「천국」에서 덱스(오른쪽이)가 공간을 재구성하는 힘을 지닌 존재로 소개되고 공간의 신전(공간의 신전)이 언급되는데, 「종말의 서막」은 플레이어가 이미 덱스와 그 능력을 안다고 가정하고 덱스가 섬을 재건하는 장면을 보여줍니다.
- A 인용:
  - Istoria: But after Nihilita fell, Dex seems to have gained the ability to carry people of the living world between the Pillar Hall and the surface.
  - Paimon: Dex seems to be really interested in this thing.
- B 인용:
  - Paimon: D—Dex!? What are you doing here?
  - Alice: Normally, the journey there would take forever, but with this little chap's help, it'll be much easier.
  - (Dex uses its power to reconstruct an island in the distance)
- 검증 메모(ember): A에서 Dex의 공간 이동·재구성 능력이 소개되고 B에서는 그 설명 없이 Dex가 섬을 재건하므로 약한 연결 청구가 성립합니다.
- 혼란 정도 평가(3): Dex's appearance and its power to reconstruct the island make more sense if the player knows Dex from A, but Paimon's reaction and Alice's explanation in B convey enough that the scene still works without it.
- 출처: [Paradise](https://genshin-impact.fandom.com/wiki/Paradise) rev 2088537, [Hour of Ruin](https://genshin-impact.fandom.com/wiki/Hour_of_Ruin) rev 2202699
- **사전 점검: 확인 필요.** B(7.2 막)가 quests.json에 없어 이름과 버전을 확인할 수 없다(덤프 이관으로 빠짐). 내용은 인용과 맞는다.
- 표기: B의 한국어명 「종말의 서막」과 "공간의 신전"은 데이터와 인용에 없다("공간의 신전(공간의 신전)"으로 겹쳐 적힘). "덱스(오른쪽이)"의 공식명은 "오른쪽이"다.
- **사람 판정: 맞음.**
