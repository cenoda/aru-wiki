# 한국어 이름이 필요한 말

`scripts/theme/snapshots.mjs`가 만든다(손으로 고치지 않는다). 켄리아 스냅샷에서 검증을 통과한 문장을 모두 치환한 뒤 영어로 남은 이름이다.
3번 이상 나온 것만 적었다. 전체 0개, 여기 0개. 조사 방법은 [공식 한국어 이름 조사 계획](ko-names-plan.md)에 있다.

자동 치환에 쓸 한국어 이름이 없어서 남았다. 넘겨주기 대상 문서의 한국어는 정체가 드러날 수 있어 쓰지 않는다(예: Gold → 라인도티르).
찾은 이름은 `data/manual/ko-names.json`에 출처와 함께 넣는다. 그다음 `node scripts/theme/snapshots.mjs khaenriah --write --only none`을 실행하면 LLM 호출 없이 바뀐다.
게임 안 표기를 직접 본 것이면 출처는 `{ "site": "play", "by": "이름" }`.

| 영어 | 나온 횟수 | 나온 별 | 예문 |
|---|---|---|---|

