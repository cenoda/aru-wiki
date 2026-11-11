# 2026-11-11 Fandom 공식 덤프 입력 전환

[권리·운영 위험 검토](../rights-risk.md) 3절 6번에 따라 Fandom 텍스트 취득 경로를 `api.php` 자동 호출에서 공식 데이터베이스 덤프로 바꾼 기록이다. 덤프로 바꾼 것은 취득 경로다. 덤프의 텍스트를 외부 LLM에 입력하거나 공개해도 된다는 판단은 아니며, 그 검토는 위험 검토 문서를 따른다. 이번 작업에서 외부 LLM 호출, 이미지 다운로드, Fandom 네트워크 접근은 하지 않았다.

## 1. 덤프 구조

| 파일 | 내용 | 비고 |
|---|---|---|
| `.cache/dump/genshinimpact_pages_current.7z` | 문서마다 최신 리비전 1개. XML 565MB, 문서 466,701개(일반 문서 57,728, 파일 351,216, 분류 38,239, 틀 2,333, 모듈 510 등) | 마지막 편집 2026-09-30T18:15:44Z |
| `.cache/dump/genshinimpact_pages_full.7z` | 모든 리비전. XML 9.99GB, 리비전 2,097,641개 | 마지막 편집 2026-09-30T18:09:53Z |

형식은 MediaWiki export 0.11(MediaWiki 1.43.9)이다. `<siteinfo>`에 이름공간 목록이 있고, `<page>`마다 제목·이름공간·문서 ID와 `<revision>`(리비전 ID, 상위 리비전, 시각, 본문, sha1)이 있다. 분류·링크 표는 들어 있지 않으며 이미지도 없다. 두 덤프의 일반 문서 마지막 리비전은 57,726개가 같고 2개(`The Seven`, `Music Gadget`)는 현재판이 약 6분 늦게 만들어져 더 새 리비전을 담고 있다.

## 2. 구현

| 기존 조회 (`api.php`) | 덤프 대체 | 모듈 |
|---|---|---|
| `list=allpages` (접두사) | 현재판의 일반 문서 제목 | `dump.mjs` |
| `list=categorymembers` | 원문의 `[[Category:]]` + 틀 규칙(아래) | `dump.mjs`, `dump-categories.mjs` |
| `titles=…&redirects` | 현재판의 `#REDIRECT`를 따라감(연쇄·순환 처리) | `dump.mjs` |
| `prop=revisions` (최신) | 현재판의 리비전 ID·시각·본문 | `dump.mjs` |
| `prop=categories` (`!hidden`) | 위 규칙 + 간이 틀 전개로 얻은 분류, `__HIDDENCAT__` 분류 제외 | `expand.mjs` |
| 캐시 디렉터리 전체 읽기 (`build-lore`) | `FandomClient.pageTexts()` | `client.mjs` |
| (신규) 특정 시점의 리비전 | 전체 이력 색인(`.cache/dump-index/`)에서 그 시각 이하의 마지막 리비전 | `dump.mjs`, `client.revisionAt()` |

- **분류 규칙.** 덤프에는 렌더링된 분류가 없고 이 위키의 분류는 대부분 틀이 붙인다. 빌드가 쓰는 분류는 해당 틀·모듈을 읽고 규칙으로 옮겼다. `{{Change History|V}}` → `Released in Version V`(V는 그 틀의 `#switch` 목록에서 읽음), Act Infobox → `Quest Acts`, Chapter Infobox → `Quest Chapters`, Quest Infobox의 `type`·`event_name` → `Archon/Story/World/Event Quests`(Module:Quest Chapter Act), `{{Shop}}`·`{{Vendor}}` → `Shops`(판매 목록 표와 그 끌어오기. 기존 캐시 대비 89건 일치, 오탐 3·누락 1). 정렬은 MediaWiki의 대문자 정렬 키를 흉내 낸다.
- **간이 틀 전개.** `build-lore`는 임의 문서의 분류(인물·장소·용어 등)를 본다. 이 분류는 틀의 조건문 안에서 붙으므로 틀을 전개한다. 파서 함수(#if, #ifeq, #switch, #expr, 문자열 함수, Variables)와 `Module:Namespace detect`만 직접 구현했고, 나머지 Lua 모듈과 DPL은 빈 값으로 처리한다.
- **버전 시점 리비전.** `revisionAt(title, at)`은 `ok`(at 이하의 마지막 리비전), `not-yet`(그 시점에 문서가 없음), `missing`, `beyond-dump`(at이 덤프 마지막 편집보다 늦음) 중 하나를 돌려준다. 이후 리비전으로 대체하지 않는다. 넘겨주기는 현재판 기준으로 따라가며, 문서 이동 이력은 따로 추적하지 않는다. "버전 V 당시"의 기준 시각은 다음 버전 출시일 전날 00:00 UTC다(`versionCutoff`, `client.revisionAtVersion`; 2026-11-11 결정). 업데이트는 UTC+8 출시일 아침, 즉 UTC로는 전날 저녁에 적용되므로 전날 전체를 뺀다. 마지막 버전(현재 7.1)은 다음 버전이 데이터에 없어 `open`(기준 시각 없음)이다.
- **덤프 이후 버전 제외.** `build-stage1`은 덤프 마지막 편집일 이후 출시 버전을 넣지 않는다. 덤프에 출시 전 문서가 있더라도 출시 후 내용을 반영하지 못하기 때문이다. `stage1-report.json`에 입력 출처와 기준일(`input`)을 기록한다.
- **보존.** `data/generated/`와 `.cache/fandom/`은 쓰지 않는다. 출력 경로는 `ARU_GENERATED_DIR`로 바꿀 수 있고, 대조는 `.cache/dump-build/`에서만 한다. 기존 캐시는 `ARU_FANDOM_SOURCE=legacy`일 때 대조용으로만 읽는다. `--refresh`와 캐시 누락은 여전히 네트워크 없이 실패한다.
- **기존 파서 수정.** `wikitext.mjs`의 `parseTemplate`이 주석을 지우기 전에 `|`로 나누는 바람에, 주석 처리된 `|event_name = …`이 `"-->"` 값으로 읽혔다. 주석을 먼저 지우도록 고쳤다. 커밋본에도 있던 버그로, 일반 퀘스트 11개(`A Decision (Hangout Event)`, `Dreamy Paititi`, `A Wall of Ships` 등)가 `event: "-->"`인 이벤트 퀘스트로 분류되어 있었다. 그 결과 이름이 빈 `event_` 단위와 `-->` 한국어 이름 항목도 생겼다. 수정 후 이들은 원래 유형(세계·전설 임무)과 개별 단위로 돌아간다.

실행: `npm run dump:compare` (덤프·기존 캐시 두 경로로 빌드 체인을 다시 돌리고 `.cache/dump-build/report.{json,md}`를 쓴다. 약 1분 30초). 전체 이력 색인은 처음 한 번 약 70초 걸린다.

## 3. 검증

- 테스트 31개 통과(`npm test`). 덤프 테스트는 작은 7z 덤프를 즉석에서 만들어 쓰므로 `.cache/dump/` 없이 돈다. `fetch`를 막아 네트워크 호출이 없는 것도 확인한다.
- **기준선.** 바뀐 코드로 기존 캐시를 입력해 다시 빌드하면 커밋본과 같다. 차이는 위 파서 수정에 따른 퀘스트 11개와 단위 10개(`single_…` 9개 추가, `event_` 삭제)뿐이다. 파서 수정 전에는 기존 캐시에 여러 리비전이 섞여 생긴 `lore-links.json` 2항목 외에 모두 바이트 단위로 같았다. 따라서 아래 차이는 덤프 데이터에서 온다.
- **분류 재현도(기존 캐시 대비).** 퀘스트 분류 6종과 `Released in Version 1.0`~`5.8`은 멤버와 순서가 같고, 차이는 덤프 이후 생성·이동된 문서뿐이다. 임의 문서 2,211개의 분류로 `build-lore`의 종류 판정(lore/character/제외)을 하면 2,168개(98.1%)가 같다. 분류 집합 전체가 같은 문서는 1,558개다. 나머지는 주로 Lua 모듈이 붙이는 분류(캐릭터 능력치·체형, 가게의 판매 품목 등)와 덤프 이후 편집이다.

## 4. 커밋본과 덤프 재빌드의 차이

| 파일 | 항목(전→후) | 추가 | 삭제 | 변경 | 리비전만 변경 |
|---|---|---|---|---|---|
| versions.json | 54→53 | 0 | 1 | 0 | 8 |
| quests.json | 2,470→2,427 | 1 | 44 | 5 | 392 |
| quest-edges.json | 2,154→2,118 | 4 | 40 | 0 | 333 |
| quest-series.json | 69→67 | 0 | 2 | 1 | 23 |
| quest-units.json | 734→724 | 3 | 13 | 4 | 0 |
| quest-characters.json | 2,231→2,194 | 1 | 38 | 18 | 0 |
| character-aliases.json | 35→29 | 0 | 6 | 4 | 0 |
| characters.json | 3,506→3,439 | 4 | 71 | 18 | 361 |
| ko-names.json | 4,566→4,475 | 15 | 106 | 25 | 610 |
| lore-links.json | 1,590→1,563 | 20 | 47 | 457 | 0 |

- **덤프 이후 버전.** 7.2(2026-11-04 출시)와 그 퀘스트 36개가 빠진다. 7.1 퀘스트 8개도 덤프 이후 문서가 만들어지거나 이동해서 빠진다(`A Gift for the Children`, `Swords and Secrets (Quest)` 등). 문서 이동으로 `series_swords_and_secrets`는 `single_swords_and_secrets`가 된다.
- **리비전만 변경.** 내용은 같고 인용 리비전만 덤프의 것으로 바뀐다. 커밋본이 인용한 리비전 7,096개 중 5,924개는 덤프의 현재 리비전과 같고 1,172개는 덤프 이후 리비전이라 덤프에 없다. 기존 캐시의 리비전 7,381개도 6,165개 동일, 1,216개 덤프 이후다(캐시의 가장 새 리비전 2026-11-10T23:50:57Z). 커밋본 생성 당시 캐시에는 같은 문서의 여러 리비전이 섞여 있었다(34개 문서).
- **lore-links.json.** 변경 457개 중 분류 목록 변경 290개는 대부분 Lua 모듈 분류가 빠진 탓이고, 연결 단위 변경 281개는 덤프 시점의 본문 링크 차이다. 처음 재빌드에서 추가된 49개 중 29개는 가게·식당 문서였다(`Wanmin Restaurant` 등). `{{Vendor}}`가 끌어오는 판매 목록의 `Shops` 분류를 보지 못한 탓이라 `Shops` 규칙을 넣어 제외했다. 이 규칙으로 원래 lore였던 주점 `The Cat's Tail`도 제외된다(덤프 시점 문서에 판매 목록이 있음. 같은 주점 `Angel's Share`는 원래부터 제외). 삭제된 47개는 `The Cat's Tail`을 빼면 덤프 시점에 넘겨주기였거나 없던 문서다(`Rotwang`, `Water Imp` 등).
- **LLM 생성물(재생성하지 않음).** 덤프 빌드에 없는 ID를 가리키는 항목: `recommended-edges.json` 4개(`act_hour_of_ruin` 등 7.2 막과 `series_swords_and_secrets`), `recommended-judgments-2.json`·`recommended-candidates-2.json` 각 15개, `unit-facts-haiku.json` 18개.

## 5. 버전 시점 리비전

덤프 빌드의 퀘스트 2,427개를 그 퀘스트 첫 버전 기준으로 조회했다.

| 기준 시각 | ok | not-yet |
|---|---|---|
| 출시일 00:00 UTC | 190 | 2,237 |
| 다음 버전 출시일 전날 00:00 UTC (채택) | 2,359 | 34 (그 외 7.1 퀘스트 34개는 `open`) |

퀘스트 문서는 대부분 출시 당일 이후 만들어진다. 출시 시각을 기준으로 하면 거의 모든 문서가 `not-yet`이며, 정책상 이후 리비전으로 채우지 않는다. 채택한 기준에서도 34개는 그 시점에 문서가 없으며 비워 둔다.

## 6. 남은 차이와 한계

- 덤프는 2026-09-30 기준이다. 7.2와 이후 편집은 덤프가 갱신되어야 반영된다. 갱신은 위키 관리자만 요청할 수 있어 프로젝트가 시점을 정할 수 없다.
- Lua 모듈과 DPL이 붙이는 분류는 보이지 않는다. 빌드에 필요한 분류는 규칙으로 옮겼지만, 틀·모듈이 바뀌면 규칙도 다시 맞춰야 한다. `categorymembers` 결과가 비면 경고를 낸다.
- `recommend/judge.mjs`·`extract.mjs`(LLM 판정)의 `loadPages()`는 여전히 기존 캐시를 읽는다. 외부 LLM 입력 근거를 확인하기 전에는 실행하지 않으므로 이번에는 바꾸지 않았다.
- 커밋본 `quests.json`에는 중복 ID가 2개 있다(`quest_everlasting_as_the_moon`, `quest_finches_are_still_the_cutest`). 덤프 전환과는 별개의 기존 문제다.
- 문서 이동 이력은 따로 추적하지 않는다. 과거 시점 조회는 현재 제목의 이력을 쓴다.

## 7. 결정 사항 (2026-11-11)

1. `data/generated/`의 Fandom 파생 파일을 덤프 재빌드로 교체했다(7.2 제외). LLM 생성물은 그대로 두며, 화면은 지도에 없는 막·단위를 가리키는 LLM 추천 연결선을 건너뛴다(`src/data.ts`).
2. 사라진 ID를 가리키는 LLM 생성물은 그대로 둔다. 해당 막·단위가 덤프 갱신으로 돌아오면 다시 쓰인다.
3. "버전 V 당시"의 기준 시각은 다음 버전 출시일 전날 00:00 UTC다.
4. 가게·식당 문서는 `Shops` 분류 규칙으로 lore에서 제외한다.
5. 덤프 갱신은 프로젝트에 권한이 없어 시점을 정하지 않는다. 그동안 데이터는 7.1까지다.
