# 현재 상태와 남은 일

남은 일의 원본은 이 파일 하나다. 끝난 일은 지우고 `docs/log/`나 커밋에 남긴다. 날짜 붙은 기록(`docs/log/`)의 할 일 목록은 쓴 날 기준이라 여기와 다르면 이 파일이 맞다.

마지막 갱신: 2026-11-12

## 지금 위치

1단계(임무 지도)는 카드 이미지와 빈 공간 정리까지 끝났다(2026-11-11). 2단계(켄리아)는 3D 첫 화면, 스냅샷 카드, 항목 문서, 문서 본문(긴 글), 글 속 링크, 문서 검색까지 했다(2026-11-12). 다음 후보는 나머지 버전의 본문, 짧은 주소(`aru.wiki/wiki/켄리아`)다.

- 데이터: 2026-09-30 Fandom 덤프 기준, 7.1까지. 모든 스크립트가 덤프만 읽는다.
- 화면 데이터: 빌드 때 `scripts/build-runtime-data.mjs`가 `data/generated`에서 화면이 읽는 필드만 골라 `data/runtime/`(커밋 안 함)을 만들고, 화면은 이를 받아 쓴다. 개발 서버는 `data/generated`가 바뀌면 다시 만든다.
- 권장 연결선 210개(강함 84, 중간 27, 연함 99). 사람 확인 22개. 그중 33개는 게임이 이미 순서를 강제해 화면에서 숨긴다.
- 표본 27개 판정: 틀림 4, 애매 10(그중 9개는 "등급이 너무 높다").

## 남은 일

### 데이터

- [보류] 권장 연결선 등급 다시 매기기(2026-11-12 사용자: 안 해도 됨, 다음 작업 후보에서 뺌). 표본에서 LLM이 등급을 높게 매기는 경향이 보였다(사람 판정 26개: 강함 3, 중간 4, 연함 15, 틀림 4).
  - 2026-11-11 시도(`scripts/recommend/retier.mjs`, Ember, 엄격한 1~5 기준): 26개 중 25개를 3(연함)으로 매겨 사람 판정의 강함 3개를 모두 놓쳤다. 일치 14/26으로 "전부 연함"(15/26)보다 낮아 적용하지 않았다. 결과는 `recommended-retier.json`에 캐시로만 있다.
  - 다음 시도 후보: 요약된 이유·인용이 아니라 두 임무의 대사 발췌를 직접 주기, 사람 판정 사례를 few-shot으로 주기, 다른 모델.
- [ ] 7.2 막을 가리키는 연결선 9개. 덤프가 갱신되어야 노드가 생긴다.

### 2단계

- [x] 켄리아 후보 노드 46개 (`scripts/theme/candidates.mjs`, `data/generated/theme-khaenriah.json`). 공유 단위 수로 순위를 매겼고 너무 일반적인 문서는 `data/manual/theme-khaenriah.json`에서 뺐다.
- [x] 후보 목록: 2026-11-11 사용자 의견 두 차례 반영, 62개(`data/manual/theme-khaenriah.json` notes). design.md의 30~50개보다 많다. `Dragon`은 공식 한국어명이 데이터에 없다.
- [x] 버전 스냅샷 생성 스크립트(design.md 5절 2·3·4번, 2026-11-11): `scripts/theme/snapshots.mjs`, 평문 변환 `scripts/theme/render.mjs`.
  - 입력: 노드 문서 + `/Profile`·`/Storyline` 하위 문서(인물 이야기가 시기에 따라 이 문서들로 옮겨 다녔다)의 버전 기준 시각 리비전. 그 시점에 없으면 쓰지 않는다. 정보 상자·내비·`{{Quote}}`(게임 원문)·Trivia·목록 절은 뺀다. 위키가 문단에 단 `<ref>`의 인게임 출처(`Ref/Quest` 등)는 문단별 `wiki_refs`로 남긴다(우리가 확인한 것은 아님).
  - 스냅샷을 만드는 버전: 처음 글이 생긴 버전, 그 뒤로는 지난 스냅샷 이후 새 문장이 max(1,200자, 15%) 이상 늘어난 버전. 63개 노드에 505개(`snapshots-khaenriah-plan.json`). 기준은 `--min-new`로 바꾼다(600이면 607개, 3,000이면 312개).
  - 작성 Muse Ember(한 줄 요약 + 요점 3~6개, 각각 문단 번호와 영어 인용) → 인용 대조(실패 시 한 번 재시도, 그래도 없으면 버림) → Codex가 요점마다 문단과 대조. 이름은 영어로 쓰게 하고 `ko-names.json`으로 바꾼다. 공식 한국어명이 데이터에 없는 이름(Eclipse Dynasty, Harbingers 등)은 영어로 남고 `latin_left`에 적힌다.
  - 전체 실행(2026-11-11): 505개, LLM 호출 1,058번, 약 35분(6개 동시), 구독이라 추가 비용 없음. 노드당 평균 약 17번 호출. 스냅샷 464개 `ok`, 41개 `thin`(한 줄 요약이 검증을 통과하지 못했거나 통과한 요점이 2개 미만). 요점 3,207개 중 통과 2,922, 반박 277, 불명 8, 인용 불일치 0. 검증 지시가 처음에 너무 엄격해("티바트에서"를 덧붙였다고 반박) 고친 뒤 `--reverify thin`으로 다시 검증했다.
  - 이름: `ko-names.json`에 없는 이름은 덤프에서 찾되, 같은 이름(단수·복수 차이까지)이거나 넘겨주기 대상 문서의 `n_en`이 그 이름 그대로인 표의 한국어만 쓴다(`Tsaritsa`=얼음의 여왕, `Gold`=황금). 넘겨주기만 따라가면 정체가 드러나므로(`Gold`→라인도티르, `Scaramouche`→방랑자) 쓰지 않는다.
  - [ ] 통과한 요점의 31.0%(905개)에 영어가 남았다. 한국어로 다 바꿀 수 없는 구절은 통째로 영어로 둔다("God of the Woods"가 "마신 of the Woods"가 되지 않게). 남은 이름 274개(3회 이상 90개)는 최종 문장 기준의 [ko-names-needed.md](ko-names-needed.md)(스크립트가 만든다)에 있다. 사용자가 [조사 계획](ko-names-plan.md)에 따라 한국어 이름을 찾고 확정한다(2026-11-12 사용자: 지금은 검증이 어려워 나중에 한다). 덤프 후보는 [ko-name-candidates.md](ko-name-candidates.md)(`scripts/fandom/ko-candidates.mjs`, 3회 이상 86개 중 45개에 후보), 넣기는 `scripts/fandom/ko-accept.mjs`. 2026-11-12: 출처 없는 이름은 LLM 번역(`ko-names-llm.json` 이름 233개, `ko-context.json` 문장별 171개; Archon은 문장마다 마신/집정관)으로 채웠다. 남은 영어·어색한 문장은 문장 전체 고쳐 쓰기(`ko-rewrite.json` 191문장; 영어 밖 한국어가 바뀌면 버림, 어순이 바뀌는 5문장은 손으로)로 고쳤다. 통과한 요점 2,922개 중 영어가 남은 것은 1개(암호명 R). 찾은 이름은 `data/manual/ko-names.json`(출처 필수)에 넣고 `--write --only none`으로 다시 바꾼다(LLM 호출 없음).
- [x] 스냅샷 공개 방식: `미검수` 배지를 달고 보여 준다(2026-11-11 사용자 결정, design.md 5절 끝 문단 반영).
- [x] 스냅샷 카드(2026-11-11): 3D 뷰에서 별을 누르면 고른 버전 이전의 가장 최근 스냅샷을 보여 준다. `미검수` 배지, 한 줄 요약, 통과한 요점, 출처(문서·리비전 링크, CC BY-SA 3.0, 요약·번역 표시), 오류 신고. 화면 데이터는 `data/runtime/snapshots-khaenriah.json`(212KB, 3D 뷰에서만 받는다).
- [x] 항목 문서(2026-11-12 사용자 결정: 슬라이드 템플릿 대신 요약 카드 + 위키피디아 같은 문서, design.md 2절). `src/WikiArticle.tsx`. 3D 카드의 `자세히 보기`로 열고, 주소는 `?page=<문서>&v=<버전>`. 3D 화면은 뒤에 그대로 있어 `← 3D 위키`나 브라우저 뒤로 가기로 보던 화면에 돌아온다. 구성: `미검수` 안내, 정보 상자, 한 줄 요약, 목차, 개요(고른 버전 기준 최신 스냅샷), 버전별 서술(이전 스냅샷, 접어 둠), 관련 문서(3D 선으로 이어진 항목), 각주(Fandom 문서 판 하나에 번호 하나, 목록은 문서별로 묶음; 절 이름은 각주 번호의 툴팁), 출처와 라이선스, 오류 신고. 고른 버전에서 공개되지 않은 항목은 이름 없이 "공개되지 않은 항목"만 보인다. 각주를 위해 `data/runtime/snapshots-khaenriah.json`의 요점에 출처 번호(`r`)를 붙였다.
  - [x] 문서 본문(2026-11-12, 사용자: "내용이 고고학용 위키라기엔 너무 빈약"). `scripts/theme/articles.mjs`가 스냅샷 계획과 같은 버전 기준 리비전(문서 + `/Profile` + `/Storyline`)으로 여러 절의 한국어 본문을 쓴다. 목표 길이는 영어 입력의 약 35%(500~10,000자). 작성 Muse Ember → 문단마다 근거 문단 1~3개와 영어 인용(대조 실패 시 한 번 재시도) → Codex가 문장마다 근거 문단과 대조해 근거 없는 문장을 빼고, 절반 넘게 빠진 문단은 버린다 → 이름 치환(`scripts/theme/localize.mjs`, `snapshots.mjs`와 공유) → 남은 소문자 영어·다른 문자 정리(Ember, 한국어 부분이 바뀌면 버림). `Archon`은 문장마다 마신/집정관으로, `Harbinger`는 집행관으로 쓰게 했다. 결과 `data/generated/articles-khaenriah.json`, 화면 데이터는 문서마다 `data/runtime/articles/<문서>.json`(문서를 열 때만 받는다). 본문이 없는 버전은 예전처럼 요점을 보여 준다.
    - 최신 버전 본문 63개: 진행 상황은 아래 숫자를 갱신한다.
    - [ ] 나머지 버전(스냅샷 505개 중 최신 63개 외) 본문. 약 5시간 걸린다. `node scripts/theme/articles.mjs khaenriah --jobs 6`(이미 만든 것은 건너뛴다).
    - [ ] 공식 한국어 이름이 없는 대문자 영어 이름이 본문에 남는다(예: Herald, Lightkeeper Flins). 스냅샷 때처럼 `ko-names-llm.json`에 넣으면 `--relocalize-only`로 다시 바뀐다.
  - [x] 글 속 링크(2026-11-12 사용자 요청, `src/Linked.tsx`): 카드와 문서 글에서 다른 항목 이름이 처음 나오는 곳을 그 문서 링크로 만든다(카드는 카드마다, 문서는 절마다 한 번). 고른 버전에 공개된 항목만 링크한다.
  - [x] 문서 검색(2026-11-12, `src/Search.tsx`): 3D 화면 머리말의 검색창, 한국어·영어 이름으로 찾는다. 고른 버전에 공개된 항목만 나온다.
  - [x] 짧은 주소(2026-11-12, `src/route.ts`): `/wiki/<이름>?v=<버전>`. 경로 이름은 공식 한국어 이름, 없으면 영어 문서 이름, 공백은 `_`. 영어 이름·예전 `?page=` 링크로 들어오면 한국어 주소로 바꾼다(기록은 늘지 않음). 사이트가 만드는 링크는 모두 짧은 주소.
    - [x] 서버 Caddyfile(2026-11-12 적용, 백업 `/etc/caddy/Caddyfile.bak-20261112`): `aru.wiki` 블록에 `redir /wiki / 302`, `header /wiki/* Cache-Control "no-cache"`, `rewrite /wiki/* /index.html`. 새 화면 코드는 다음 배포부터 실린다(그 전에는 `/wiki/…`가 첫 화면을 연다).
  - [ ] 아직 없는 것: 본문 내용 검색, 신뢰도 배지(사람이 쓴 해석이 생길 때). 스냅샷은 위키 서술이라 신뢰도 등급을 붙이지 않는다.
- [x] 3D 뷰 미리보기(2026-11-11, `src/WikiGraph3D.tsx`; 2026-11-12부터 첫 화면). 모양을 보려는 것이고 **배치는 최종안이 아니다(사용자)**. 정한 것:
  - 별자리처럼 선을 줄인다: 공유 이야기 Jaccard 기준 최대 신장 트리 + 문서마다 가장 강한 연결 2개(`scripts/build-runtime-data.mjs`, 95개).
  - 황도면 배치: 별은 켄리아를 중심으로 한 평면에 퍼지고 높이는 공개 버전(이른 버전이 아래). 카메라는 약 32도 위에서 본다.
  - 별 크기·이름 크기·항상 보이는 이름 14개는 중요도(켄리아 문서와 공유하는 이야기 수, `theme_units`)로 정한다.
  - 다크 테마는 밤하늘, 라이트 테마는 낮하늘. 선은 화면 기준 굵기 고정, 공유 이야기가 많을수록 굵고 밝다. 이름은 화면 기준 크기 고정, 겹치면 중요도 낮은 쪽을 숨기고 밝기는 부드럽게 바뀐다.
  - 이름표 글꼴: 웹폰트 조각을 미리 받아야 글자마다 폰트가 섞이지 않는다(캔버스 글자는 조각 다운로드를 일으키지 않음).
- [x] 3D를 첫 화면으로(2026-11-12 사용자 요청). `aru.wiki/`가 켄리아 3D를 연다. 임무 지도는 `?view=quests`(예전 `?act=`·`?unit=` 링크는 그대로 임무 지도로 열린다, 예전 `?view=wiki3d`도 3D로 열린다). 두 화면 머리말에 서로 가는 버튼(`임무 지도`, `3D 위키`)이 있다. WebGL을 아예 못 쓰는 브라우저는 3D 대신 검색 화면을 보여 준다.
  - [x] 3D가 안 되는 기기(2026-11-12 사용자 결정, design.md 2절): 모바일도 3D가 기본이고 2D 그래프 전환은 만들지 않는다. WebGL을 쓸 수 없는 브라우저에서는 위키백과 대문처럼 가운데 검색창 하나만 있는 화면을 보여 준다(`WikiGraph3D`의 `w3d-portal`). 예전 2D 전환 계획(저사양 모드, 프레임 측정)은 버렸다. `feat/quest-3d`의 `src/settings.ts`는 쓰지 않는다.
- [ ] 임무 3D(막을 버전 층에 쌓은 3D 지도)는 `feat/quest-3d` 브랜치에 보관(사용자: 나중에 추가할 수 있음).

### 전체 위키 (2026-11-12 시작)

- [x] 테마 `all`: lore-links.json의 이야기 문서 전체 1,558개(`data/manual/theme-all.json`, `/Storyline` 하위 문서 4개는 인물 문서에 합쳐 읽으므로 뺌). 스냅샷 계획 3,548개(1분, LLM 없음), 최신 버전 본문이 있는 문서 1,383개. 대사 `dialogue.mjs all`(18초, 한 번 훑기로 바꿈).
- [x] 첫 100개(2026-11-12): `node scripts/theme/articles.mjs all --latest --order units --skip-theme khaenriah --limit 100 --writer kimi,ds,ds-pro,glm --verify claude-sonnet,codex-medium,grok --polish kimi,ds --jobs 16`. 99개 완료(Navia는 프로바이더 연결이 멈춰 다음 실행으로). 문단 대부분 검증 통과. 남은 영어가 있는 문장 5.8%(이름 1,184개를 에이전트가 번역해 `ko-names-llm.json`에 넣은 뒤). 켄리아 테마에 있는 문서는 그 테마 글을 쓴다(`--skip-theme`).
- [x] 화면: 테마 밖 문서는 검색·글 속 링크·`/wiki/<이름>`으로 열린다(`data/runtime/pages.json`). 3D 지도에는 켄리아 문서만. 대사 상자에 영어 원문을 작게 붙인다(사용자 2026-11-12).
- 모델(사용자 2026-11-12): 한도 있는 모델 먼저(Kimi), 프로바이더 DeepSeek Flash 12·Pro 8·GLM 4 동시, 생각 켬. 검증은 Sonnet→Codex→Grok(MiMo·Kimi는 검증이 약해 안 씀). 섹션도 빈 자리 모델이 쓴다.
- [ ] 프로바이더 연결이 응답 없이 멈추면 호출 하나가 한 시간 넘게 묶인다(20분 제한 × 재시도). 스트림 무응답 감지가 필요하다.
- [ ] 남은 영어: 문맥에 따라 다른 말(Chapter, Leader, Archon 등) 단계(`ko-llm.mjs tasks context`)가 아직 스냅샷만 읽는다. 본문에도 붙여야 한다.
- [ ] 나머지 약 1,280개 문서. 100개에 약 3시간(멈춤·재시작 포함).

### 독자가 쓰는 글 (`feat/reader-edits` 브랜치, 2026-11-12)

로그인 없이 문단 고치기·글 보태기·새 문서 제안. 보낸 글은 쓴 사람 브라우저에서만 바로 보이고 운영자가 승인해야 공개된다(사용자 결정: 안전한 방식). 설명과 운영 방법, 저작권법 조문 확인은 [reader-edits.md](reader-edits.md).

- [x] 화면(`src/Suggest.tsx`, `src/readerEdits.ts`), 받는 쪽(`scripts/suggest/server.mjs`), 운영 도구(`scripts/suggest/review.mjs`), 실린 글 `data/manual/reader-edits.json`. 로컬에서 브라우저로 고치기→승인→공개, 거절 사유 표시, 새 문서, 버전 가림을 확인했다.
- [x] 같이 고친 것: 오류 신고(`/api/report`)가 이름에 공백·아포스트로피가 있는 문서(`Abyss Order`, `Khaenri'ah` 등)를 400으로 거절하던 문제.
- [x] `main`에 합치기, 서버에 받는 쪽 올리기(Caddy `/api/suggest` 포함), 사이트 배포(2026-11-12 배포 확인).
- [x] 첫 화면 `＋ 새 문서` 버튼(2026-11-12 사용자 요청, `src/Search.tsx`의 `NewPage`): 검색창 옆(머리말, WebGL 없는 대문 둘 다). 제목을 받아 있는 문서면 열고, 없으면 빈 문서(첫 문단 쓰기)를 연다.
  - [ ] 없는 문서를 열면 제목이 「공개되지 않은 항목」으로 나온다(`WikiArticle.tsx`). 새 문서일 때는 그 제목을 보여 주는 게 낫다.
- [ ] LLM 검사(근거 대조·스포일러). 본문 파이프라인의 LLM 호출 코드가 정리된 뒤에 붙인다.
- [ ] 아직 없는 것: 글 속 빨간 링크, 최근 바뀜 페이지, 독자가 쓴 문서의 문단 고치기, 실린 뒤 내려간 글을 쓴 사람에게 알리기.
- [ ] 정할 것: 작은 수정을 승인 없이 바로 공개할지(지금은 전부 승인 후 공개).

### 1단계 마무리

- [x] 임무 카드 이미지(2026-11-11, [이미지 방침 4절](image-policy.md)). 중심 인물이 정해진 막 96개, 아이콘 81명(2026-11-12 진·한운 추가). 기록은 `data/generated/image-files.json`, 다시 만들기는 `node scripts/images/card-figures.mjs && node scripts/images/fetch-enka-icons.mjs`(이미 받은 파일은 다시 받지 않는다). 버전 선택기가 인물 공개 버전보다 앞이면 아이콘을 숨긴다.
- [x] 인물이 없거나 NPC인 카드: 자체 제작 지역 문장(`src/emblems.tsx`).
- [x] 빈 공간: 각 버전 열의 빈 칸(카드와 노선이 지나가지 않는 칸)에 버전 이름·새 지역·마신 임무·새 막 수를 둔다. 53개 버전 중 빈 칸이 없는 열은 생략.
- [x] 후보가 여럿인 카드 인물(2026-11-12, 사용자가 아무나 골라도 된다고 함): 「네가 있는 시공」 시틀라리, 「배리의 순간」 알베도, 「위험한 길, 수상한 발자취」 야란. `data/manual/card-figures.json`. 인물 카드 99개. 나머지(「뒤집힌 기원」과 Traveler 막 5개)는 모든 임무에 나오는 플레이 가능 캐릭터가 없어 문장으로 둔다.
- [x] 아이콘 짝 확인: 진(Jean)=`Qin`, 한운(Xianyun)=`Liuyun`(2026-11-12 사용자가 눈으로 확인, `data/manual/enka-icons.json`).
- [ ] 철자가 비슷해서 짝지은 9명은 아직 사람이 확인하지 않았다([이미지 방침 4절](image-policy.md)). 확인하면 `data/manual/enka-icons.json`.
- [x] 버전 메모를 잇는 선(2026-11-12): 레이아웃 때 최단 경로로 다시 그린다(`FocusView.tsx`의 `routeStem`). 사용자 결정: 멀리 돌아가지 말고 짧게, 노선과 겹치는 곳은 선을 끊어 밑으로 지나가게 한다. 겹침 세기 `node scripts/dev/memo-crossings.mjs`.
- [x] 시리즈·이벤트 카드(갈래 화면, 2026-11-12 사용자 결정): 갈래 카드 716개 모두 자체 제작 문장. 이벤트(이벤트형 시리즈 포함) 162개는 불꽃놀이 문장, 나머지는 지역 문장(지역 없음 3개는 나침반). 시리즈 60개는 겹친 종이 표시를 덧붙인다(이벤트형 시리즈 5개는 불꽃놀이 + 표시, 사용자: 그대로 둠). 인물 아이콘은 쓰지 않는다(이미지 방침 4절은 막 카드만).

### 이미지 (1단계 이후)

- [ ] 2단계 노드와 나머지 인물: 직접 촬영·기여. 경로가 생기는 만큼 붙인다.

### 공개 전

- [x] 아이콘 PNG를 리포지토리와 이력에서 뺐다(2026-11-11 결정). `main`·`feat/3d-main`을 다시 써서 강제 push했다. 배포 순서: `npm run fetch:icons` → `npm run build`.
- [x] GitHub의 옛 이력 정리(2026-11-12): 사용자가 저장소를 지우고 사용자가 같은 이름(공개)으로 다시 만든 뒤 `main`·`feat/3d-main`·`feat/quest-3d`를 push했다. 옛 커밋(6218e8b)은 웹 404·API 422로 더는 보이지 않는다. push한 세 브랜치 이력에 PNG는 없다. PR #1~#3 기록은 사라졌다.
- [x] `~/projects/aru-wiki-3d` 폴더를 새 이력으로 맞췄다(2026-11-11). 옛 브랜치(`backup/old-main`·`backup/old-feat-3d-main`)는 2026-11-12 사용자 결정으로 지웠다. 5174 미리보기 서버는 껐다.
- [ ] 화면에서 출처·라이선스 표시(카드 이미지는 2026-11-11 완료: 화면 아래 고지, 갈래 정보 카드에 출처·받은 날짜·공개 버전).
- [x] 삭제 요청 수단(2026-11-12, [docs/takedown.md](takedown.md)): `node scripts/takedown.mjs find|block|clean|check|list|unblock`, 막은 목록 `data/manual/takedown.json`. 아이콘은 받지 않고 카드는 지역 문장으로 바뀐다. `--apply` 없이는 아무것도 바꾸지 않는다.
  - [ ] 글(위키 문서) 막기: `scripts/build-runtime-data.mjs`가 `takedown.json`의 `pages`를 읽어 테마·스냅샷·본문·연표에서 빼야 실제로 사라진다(문서 작업이 끝난 뒤 넣는다). 그때 `src/data.ts`가 `takedown.json`을 통째로 가져오지 않게(요청자·사유가 번들에 실림) 막은 이름 목록만 넘긴다.
- [x] contact@aru.wiki 수신과 알림 확인(2026-11-12, 사용자).
- [x] OCI 배포(2026-11-12, https://aru.wiki 공개). 서버 `147.224.187.173`(A2 1 OCPU·2GB, Ubuntu 24.04, 사용자 `ubuntu`). 이 컴퓨터의 `~/.ssh/aru-deploy` 키로 접속한다(서버 `authorized_keys`에서 그 줄을 지우면 막힌다).
  - 서버에 한 것: 스왑 2GB, iptables 80·443 허용(저장), Caddy 2.6, Node 18(Ubuntu 패키지; report-server는 내장 모듈만 써서 돌아간다). 사이트 `/srv/aru/site`, 신고 데몬 `/opt/aru-report` + `aru-report.service`(DynamicUser, 기록 `/var/lib/aru-report/reports.jsonl`). Caddyfile: `aru.wiki` HTTPS(Let's Encrypt, Caddy가 자동 갱신), `www`와 IP 접속은 `https://aru.wiki`로 넘긴다. zstd/gzip 압축, `/assets/*` 1년 immutable 캐시, `/`·`/index.html` no-cache, HSTS. OCSP 경고 로그는 Let's Encrypt가 OCSP를 끝내서 나는 것이라 무시한다.
  - 배포: 로컬에서 `npm run fetch:icons` → `npm run build` → `rsync -az --delete -e "ssh -i ~/.ssh/aru-deploy" dist/ ubuntu@147.224.187.173:/srv/aru/site/`. 스킬로도 둔다: `.claude/skills/push`(GitHub), `.claude/skills/deploy`(서버, 2026-11-12 사용자 허락).
  - 사용자가 OCI 보안 목록 TCP 80·443 수신 허용, DNS A 레코드 `@`·`www` → 147.224.187.173을 넣었다(2026-11-12). 브라우저로 메인(당시 임무 지도)·`?view=wiki3d`가 오류 없이 뜨는 것을 확인했다.

## 기다리는 것

- Fandom 덤프 갱신(7.2): 위키 관리자만 요청할 수 있다. 우리가 정할 수 없다.
