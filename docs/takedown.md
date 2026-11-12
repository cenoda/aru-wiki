# 삭제 요청 처리

권리자가 contact@aru.wiki로 삭제를 요청하면 이 순서대로 한다. 답변 기한과 방침은 [권리·운영 위험 검토](rights-risk.md) 7절, 이미지 기록은 [인물 이미지 방침](image-policy.md) 3절에 있다.

도구: `scripts/takedown.mjs`. 막은 목록: `data/manual/takedown.json`(git에 넣는다).

## 1. 메일을 받으면

1. 무엇을 지워 달라는지 적어 둔다: URL, 인물 이름, 파일 이름, 임무 이름, 위키 문서 이름.
2. 72시간 안에 "받았고 확인 중"이라고 먼저 답한다(rights-risk.md 7절).
3. HoYoverse의 요청은 바로 따른다. 다른 권리자의 요청은 무엇에 대한 권리인지 확인한다.

## 2. 찾기

```
node scripts/takedown.mjs find 알베도
node scripts/takedown.mjs find https://aru.wiki/img/characters/Albedo.png
node scripts/takedown.mjs find "page:Khaenri'ah"
```

- 인물 이름(한국어·영어), 파일 이름, URL(aru.wiki 이미지, Enka 아이콘, Fandom 문서), 임무 id나 임무 이름을 넣을 수 있다. 여러 개를 한 번에 넣어도 된다.
- "정확히 맞는 것"만 막는다. "비슷한 것"은 막지 않는다. 맞으면 그 이름으로 다시 찾는다.
- 글(위키 문서)은 `page:이름`이나 Fandom URL로 찾을 때만 막는다. 이미지 요청 때문에 같은 인물의 글까지 막히지 않게 하려는 것이다.
- 종류를 좁히려면 앞에 `character:` `file:` `act:` `page:`를 붙인다.

## 3. 막기와 로컬 파일 지우기

먼저 그냥 실행해서 무엇이 바뀌는지 본다(아무것도 바꾸지 않는다).

```
node scripts/takedown.mjs block 알베도 --requester "HoYoverse" --reason "2026-11-20 메일: 알베도 아이콘 삭제 요청"
```

맞으면 `--apply`를 붙여 다시 실행한다. 그러면:

- `data/manual/takedown.json`에 항목이 하나 생긴다(날짜, 요청자, 사유, 막은 인물·파일·임무·문서).
- `public/`과 `dist/`에서 그 파일을 지운다. 글이면 `data/runtime/articles/`와 `dist/assets/`의 그 문서 파일도 지운다.

`--requester`에는 개인 이름이나 메일 주소를 쓰지 않는다("HoYoverse", "권리자"처럼). 이 파일은 공개 저장소와 사이트 코드에 들어간다. 메일 원문은 메일함에 둔다.

막으면 이렇게 된다:

- 인물·파일: `npm run fetch:icons`가 받지 않는다. 화면 카드는 지역 문장을 보인다.
- 임무 카드: 그 카드만 아이콘 대신 지역 문장을 보인다.
- 글: 아직 화면에서 숨기는 연결이 없다(아래 5절). 그때까지는 사람이 알려 줘야 한다.

## 4. 다시 배포

```
node scripts/takedown.mjs check        # 로컬에 남은 것이 없는지
npm run fetch:icons
npm run build
rsync -az --delete -e "ssh -i ~/.ssh/aru-deploy" dist/ ubuntu@147.224.187.173:/srv/aru/site/
```

배포는 `.claude/skills/deploy` 스킬로 해도 된다. `--delete` 때문에 서버에서도 지운 파일이 사라진다. 그다음 `check`가 보여 주는 `curl` 명령으로 지운 이미지 주소가 404인지 본다. `takedown.json` 변경은 커밋하고 push한다.

마지막으로 요청자에게 무엇을 언제 지웠는지 답한다.

## 5. 남은 일

- 글: `scripts/build-runtime-data.mjs`가 `takedown.json`의 `pages`를 읽어 그 문서를 지식 그래프·스냅숏·본문에서 빼야 한다. 아직 연결하지 않았다.
- 이미지 기록: 같은 스크립트가 막은 인물·파일의 기록을 `imageFiles`에서 빼야 출처 URL도 사이트 데이터에서 사라진다. 지금은 `src/data.ts`가 화면에서만 숨긴다.
- 글은 `data/generated/`에 들어 있어 git 이력에도 남는다. 이력까지 지워 달라는 요청이면 사용자와 따로 정한다(아이콘 때처럼 이력을 다시 써야 한다).
- 이미 받아 간 브라우저 캐시와 남이 만든 사본은 우리가 지울 수 없다.

## 6. 잘못 막았을 때

```
node scripts/takedown.mjs list
node scripts/takedown.mjs unblock 2026-11-20-1 --apply
npm run fetch:icons && npm run build   # 그다음 배포
```
