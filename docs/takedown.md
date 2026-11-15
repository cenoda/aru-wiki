# 삭제 요청 처리

권리자가 contact@aru.wiki로 삭제를 요청하면 이 순서대로 한다. 답변 기한과 방침은 [권리·운영 위험 검토](rights-risk.md) 7절, 이미지 기록은 [인물 이미지 방침](image-policy.md) 3절에 있다.

도구: `scripts/takedown.mjs`. 막은 목록: `data/manual/takedown.json`(git에 넣는다).

## 1. 메일을 받으면

1. 무엇을 지워 달라는지 적어 둔다: URL, 인물 이름, 파일 이름, 임무 이름, 위키 문서 이름, YouTube 영상 주소.
2. 72시간 안에 "받았고 확인 중"이라고 먼저 답한다(rights-risk.md 7절).
3. HoYoverse의 요청은 바로 따른다. 다른 권리자의 요청은 무엇에 대한 권리인지 확인한다.

## 2. 찾기

```
node scripts/takedown.mjs find 알베도
node scripts/takedown.mjs find https://aru.wiki/img/characters/Albedo.png
node scripts/takedown.mjs find "page:Khaenri'ah"
node scripts/takedown.mjs find https://www.youtube.com/watch?v=VAkFSNajRe8
node scripts/takedown.mjs find video:알베도
```

- 인물 이름(한국어·영어), 파일 이름, URL(aru.wiki 이미지, Enka 아이콘, Fandom 문서), 임무 id나 임무 이름을 넣을 수 있다. 여러 개를 한 번에 넣어도 된다.
- "정확히 맞는 것"만 막는다. "비슷한 것"은 막지 않는다. 맞으면 그 이름으로 다시 찾는다.
- 글(위키 문서)은 `page:이름`이나 Fandom URL로 찾을 때만 막는다. 이미지 요청 때문에 같은 인물의 글까지 막히지 않게 하려는 것이다.
- 공식 영상(YouTube)은 영상 ID(`VAkFSNajRe8`), YouTube 주소(`youtube.com/watch?v=`, `youtu.be/`, `youtube-nocookie.com/embed/`, `i.ytimg.com/vi/<ID>/...` 미리보기 그림), `video:<ID>`로 찾을 때 그 영상 하나만 막는다. `video:문서이름`(예: `video:알베도`)은 그 문서에 붙은 영상을 모두 막는다.
- 문서 이름만 넣거나 `page:`로 찾으면 그 문서의 영상은 "비슷한 것"으로만 보인다. 글을 막아도 영상은 막히지 않고, 영상을 막아도 글은 막히지 않는다. 둘 다 막으려면 `page:이름`과 `video:이름`을 함께 넣는다.
- `video:<ID>`는 지금 `videos.json`에 없는 영상도 막는다(나중에 다시 붙지 않게 미리 막을 때).
- 종류를 좁히려면 앞에 `character:` `file:` `act:` `page:` `video:`를 붙인다.

## 3. 막기와 로컬 파일 지우기

먼저 그냥 실행해서 무엇이 바뀌는지 본다(아무것도 바꾸지 않는다).

```
node scripts/takedown.mjs block 알베도 --requester "HoYoverse" --reason "2026-11-20 메일: 알베도 아이콘 삭제 요청"
```

맞으면 `--apply`를 붙여 다시 실행한다. 그러면:

- `data/manual/takedown.json`에 항목이 하나 생긴다(날짜, 요청자, 사유, 막은 인물·파일·임무·문서·영상 ID).
- `public/`과 `dist/`에서 그 파일을 지운다. 글이면 `data/runtime/articles/`의 그 문서 파일과, 버전별로 나눈 데이터(`public/assets/d/`, `dist/assets/d/`, design.md 6절)에서 그 문서의 본문·스냅샷·연표 파일도 지운다(파일 이름이 해시라 위키 블록의 목록으로 찾는다). 블록에 남은 문서 이름은 다시 빌드하면 빠진다.
- 영상이면 `data/runtime/videos.json`과 나눈 데이터의 위키 블록에서 그 영상만 뺀다(이 파일들에는 다른 문서의 영상도 들어 있어서 지우지 않고 고쳐 쓴다).

영상 예:

```
node scripts/takedown.mjs block https://youtu.be/VAkFSNajRe8 --requester "HoYoverse" --reason "2026-11-20 메일: 알베도 플레이 영상 삭제 요청"
```

`--requester`에는 개인 이름이나 메일 주소를 쓰지 않는다("HoYoverse", "권리자"처럼). 이 파일은 공개 저장소와 사이트 코드에 들어간다. 메일 원문은 메일함에 둔다.

막으면 이렇게 된다:

- 인물·파일: `npm run fetch:icons`가 받지 않는다. `scripts/build-runtime-data.mjs`가 그 이미지 기록(파일 이름, 출처 URL)을 사이트 데이터에서 뺀다. 화면 카드는 지역 문장을 보인다.
- 임무 카드: 빌드가 그 카드에 "아이콘 없음" 표시를 붙여 보낸다. 그 카드만 아이콘 대신 지역 문장을 보인다.
- 글: 다시 빌드하면(`npm run build`) `scripts/build-runtime-data.mjs`가 그 문서를 `data/runtime/`에서 모두 뺀다. 그다음 단계(나눈 데이터, 본문 검색, 검색 엔진용 페이지)는 모두 `data/runtime/`만 읽으므로 거기서도 빠진다. 빠지는 것:
  - 본문·스냅숏·연표 파일(`data/runtime/articles/`, 나눈 데이터의 글 파일)
  - 3D 차트의 별과 그 별에 닿는 선, 서로 언급하는 점선(`chart.json`), 차트 밖 문서 목록(`pages.json`)
  - 본문 검색 색인, 이름 해시 목록, `dist/wiki/<이름>.html`, 첫 화면의 문서 목록, `sitemap.xml`
  - 최근 바뀜의 줄, 그 문서에 붙은 공식 영상(보일 문서가 없으므로)
  - 그 문서에 대한 독자 글(문서 id나 한국어 이름이 같은 것): 사이트는 `data/manual/reader-edits.json`이 아니라 빌드가 고쳐 쓴 `data/runtime/reader-edits.json`을 받는다
  - 빨간 링크: 그 문서 이름은 빨간 링크로도 나오지 않는다(다시 써 달라는 초대가 되지 않게)
  - 추천 임무 근거의 `links` 목록에서 그 문서 이름
- 다른 문서 본문에 그 문서 이름이 나오면 글은 그대로 두고 링크만 사라진다. 본문 안 링크는 사이트에 있는 문서 목록으로 만들기 때문이다. 문장을 지우면 다른 문서의 뜻이 깨지고, 이름 자체는 게임 속 명칭이라 삭제 대상이 아니라고 보았다.
- 다른 문서가 그 Fandom 문서를 근거로 쓴 문단과 그 출처 표시(`"kind":"wiki","page":"<이름>"`)는 남는다. CC BY-SA 때문에 출처 표시만 지우고 글을 남길 수는 없다. 요청이 Fandom 원문 자체에 대한 것이면 그 문단들도 지울지 사용자와 따로 정한다(아래 5절).
- 사이트 코드(`src/`)는 `takedown.json`을 읽지 않는다. 요청자와 사유가 JS에 실리지 않는다.
- 영상: `scripts/build-runtime-data.mjs`가 `data/runtime/videos.json`을 쓸 때 빼고, `scripts/youtube/refresh.mjs`(2주마다 cron)가 `data/generated/videos.json`에서 뺀다. 그래서 정기 갱신이 다시 넣지 않는다. 사이트 코드(`src/`)는 `takedown.json`을 읽지 않는다. `data/generated/videos.json`에는 다음 갱신 때까지 남아 있을 수 있지만 사이트에는 실리지 않는다(`check`가 "참고"로 알려 준다).

## 4. 다시 배포

```
node scripts/takedown.mjs check        # 로컬에 남은 것이 없는지
npm run fetch:icons
npm run build
rsync -az --delete -e "ssh -i ~/.ssh/aru-deploy" dist/ ubuntu@147.224.187.173:/srv/aru/site/
```

영상은 우리 서버에 파일이 없으므로 `curl`로 볼 것이 없다. 배포 뒤 그 문서에서 영상이 사라졌는지 화면으로 본다.

배포는 `.claude/skills/deploy` 스킬로 해도 된다. `--delete` 때문에 서버에서도 지운 파일이 사라진다. 그다음 `check`가 보여 주는 `curl` 명령으로 지운 이미지 주소가 404인지 본다. `takedown.json` 변경은 커밋하고 push한다.

마지막으로 요청자에게 무엇을 언제 지웠는지 답한다.

## 5. 남은 일

- 다른 문서가 막은 Fandom 문서를 근거로 쓴 문단은 남는다(3절). 그것까지 지워야 하는 요청이면 그 문단을 찾아 빼는 기능을 따로 만든다.
- 막은 문서 이름으로 독자가 새 문서를 쓰자고 보낼 수는 있다. 승인할 때 사람이 거른다.
- 글은 `data/generated/`에 들어 있어 git 이력에도 남는다. 이력까지 지워 달라는 요청이면 사용자와 따로 정한다(아이콘 때처럼 이력을 다시 써야 한다).
- 이미 받아 간 브라우저 캐시와 남이 만든 사본은 우리가 지울 수 없다.

## 6. 잘못 막았을 때

```
node scripts/takedown.mjs list
node scripts/takedown.mjs unblock 2026-11-20-1 --apply
npm run fetch:icons && npm run build   # 그다음 배포
```
