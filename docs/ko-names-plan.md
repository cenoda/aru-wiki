# 공식 한국어 이름 조사 계획

대상은 [한국어 이름이 필요한 말](ko-names-needed.md)이다. 조사와 확정은 사용자가 한다.

**LLM 번역 (2026-11-12 사용자 결정)**: 출처가 없는 이름은 LLM(Claude 서브에이전트)이 옮겨도 된다. 확정 이름과 섞지 않고 `data/manual/ko-names-llm.json`(이름마다 하나)과 `data/manual/ko-context.json`(문장마다 고름)에 따로 둔다. `ko-names.json`의 확정 이름이 있으면 언제나 그것이 이긴다. 작업 순서는 `scripts/theme/ko-llm.mjs` 맨 위에 있다. 인터넷 자료는 쓰지 않고 로컬 덤프 후보와 기존 사전만 참고한다.

## 진행 순서

1. **빈도순으로 조사한다.** 상위 20개가 현재 표기 노출의 절반 이상이다.
2. **로컬 Fandom 덤프를 먼저 찾는다.** 다른 문서라도 `Other Languages`의 영어 `en`이 정확히 같고 한국어 `ko`가 있으면 후보로 쓴다. 넘겨주기 대상의 이름이나 문맥상 같은 존재라는 추론은 쓰지 않는다.
3. **남은 것은 출처별로 묶는다.** 우인단, 마신·강림자, 켄리아·오대 죄인, 달, 공식 영상·출판물 순서가 효율적이다. 한국어 인게임 표기나 공식 영상·공지에서 이름 자체를 확인한다.
4. **표기 변형을 함께 처리한다.** 단수·복수와 `The` 유무를 확인하고, 긴 이름을 먼저 등록한다. `Shouki no Kami` 같은 구절은 전체를 찾고 조각만 따로 번역하지 않는다.
5. **일반어는 고유명사와 나눈다.** `Abyssal`, `Snezhnayan`, `Natlanese`, `Moon`, `Ninth`처럼 문맥에 따라 달라지는 말은 억지로 한국어 이름 사전에 넣지 않는다.

나무위키는 사람이 읽고 위치를 찾는 단서로만 쓴다. HoYoWiki 자동 수집, 클라이언트 텍스트맵, 데이터마이닝 자료는 쓰지 않는다. 근거가 없으면 영어로 남긴다.

## 기록과 반영

확정한 이름은 `data/manual/ko-names.json`에 넣는다. 공개 문서·영상은 URL과 위치를, 직접 플레이는 `{ "site": "play", "by": "이름" }`과 임무·화면을 `note`에 남긴다.

```bash
node scripts/theme/snapshots.mjs khaenriah --write --only none
```

LLM 호출 없이 다시 치환된다. `text_raw`·검증 상태·출처가 그대로인지, 한영 혼합과 조사가 어색하지 않은지, `latin_left`가 줄었는지 확인한다.

## 문맥에 따라 다른 말

- **Archon**: 하나로 정하지 않고 문장마다 고른다. `ko-names.json`에 넣지 않는다(넣으면 모든 문장이 한 가지로 바뀐다). 정한 사람: 사용자(2026-11-11).
  - **마신**: 그 자체로 강하지만 그냥 강한 생명체. 마신 전쟁에 참여한 존재들 전반(`Archon War` = 마신 전쟁).
  - **집정관**: 마신 중 마신 전쟁에서 이겨 일곱 개의 신의 심장을 차지했던 자들(`The Seven Archons` = 7명의 집정관).
- **원소의 Archon**(Anemo/Pyro/Hydro/Electro/Geo/Dendro/Cryo Archon): "OO의 신"으로 통일한다(바람의 신, 불의 신 …). Fandom 표의 "불 신" 꼴 대신 쓴다. 작성 모델이 쓴 "풀 집정관", "얼음 신"도 `tidy()`가 바꾼다. 신의 심장(물 신의 심장)은 그대로. 정한 사람: 사용자(2026-11-12).
- **Irmin**: 사용자 표기 "이르민"을 쓴다. Fandom `Irmin` 문서의 표는 "엘민"이다(2026-11-12 기준).

## 덤프 후보와 넣기

`node scripts/fandom/ko-candidates.mjs khaenriah`가 [한국어 이름 후보](ko-name-candidates.md)를 만든다. 근거는 로컬 덤프의 `Other Languages` 행뿐이다(네트워크·LLM 없음).

- 같은 영어: 현재 덤프에서 `en`이 그 이름과 같은 행(`The`·복수 무시).
- 옛 판에만: 전체 기록 덤프의 예전 판에만 있는 행. 판 주소(`?oldid=`)가 출처가 된다. 지워진 이유는 알 수 없으니 판마다 값을 비교한다.
- 들어간 이름: `en`에 그 이름이 단어로 들어 있는 행. 그 이름의 번역이 아니라 사람이 고를 때 보는 참고다.

고른 이름은 `node scripts/fandom/ko-accept.mjs 'Harbinger|Harbingers=한국어'`로 넣는다. 고른 한국어가 들어 있는 후보 행만 출처로 붙고, 그런 행이 없으면 `--play`·`--url`·`--maintainer` 없이는 거부된다. 이미 다른 값이 있으면 `--force` 없이는 바꾸지 않는다.

## 덤프에 후보가 없는 것

종류별로 다르게 처리한다. 지금 목록은 [후보 문서](ko-name-candidates.md) 끝의 표에 있다.

1. **게임에서 확인한다.** 우인단(Il Dottore, Eleven Harbingers, Pedrelino, Ninth Company, Palestar Edict), 신·강림자(Electro/Geo Gnosis, First/Third/Fourth Descender, Divine Throne, Human Realm, Void Realm, Hydro Dragon Sovereign), 켄리아(Kingdom/Fall of Khaenri'ah, King Irmin, Chlothar Alberich, Primordial Human Project, Primordial Albedo, Riftwolves), 달(Dragon King Nibelung, Lunar Palace, Three Moon Sisters, Moon/Trilune Goddess, Goddess of the Iridescent Moon), 장소(Vahumana Darshan, Mondstadt Cathedral, Analyse Cardinale).
   - 「나온 문서」의 Fandom 문서에서 그 문장이 어느 임무·캐릭터 이야기·도감에서 왔는지 본다.
   - 게임 설정에서 **텍스트 언어**만 영어로 바꿔 그 화면에서 단어를 찾고, 한국어로 되돌려 같은 자리를 읽는다. 한 화면에서 여러 이름이 한 번에 나온다.
   - `--play 이름 --note '어디서'`로 넣는다.
2. **공식 영상·출판물 제목**(Teyvat Chapter Storyline (Preview), Collected Miscellany)은 원신 공식 한국어 채널·사이트의 제목을 직접 보고 `--url`로 넣는다. 자동 수집은 하지 않는다(YouTube 약관).
3. **일반어**(Sibling, Khaenri'ahn(s), Natlanese, Authorities, Goetic)는 공식 고유명사가 아니다. 문맥에 맞는 우리말을 정해 `--maintainer 이름 --note '일반어'`로 넣거나, 영어로 둔다. 게임 표기를 봤으면 `--play`를 쓴다.
4. **사람이 읽는 공개 자료**: HoYoLAB 약관 6(c)는 다운로드·스크래핑을 금지하므로 HoYoWiki를 브라우저로 직접 읽는 것은 그 조항에 걸리지 않는다. 다만 `ko-names.json`의 `$comment`는 지금 HoYoWiki를 출처로 쓰지 않는다고 적고 있어, 쓰려면 그 문구부터 바꿔야 한다(결정 전). 나무위키는 위치를 찾는 단서로만 쓴다.
