# 2026-11-11 권리·운영 위험 검토

이 문서는 aru.wiki가 게임 이미지와 Fandom 텍스트를 쓰는 방식에 관련된 확인 사실, 판단, 미확인 범위를 공개한다. 법률 의견이나 HoYoverse·Fandom의 승인서가 아니며, 위험이 없거나 사이트 운영이 보장된다고 주장하지 않는다. 확인 기준일은 2026-11-11이다. 약관·지침은 본문을 직접 읽고 해당 조항을 원문으로 인용했다.

## 1. 운영 원칙과 결정

aru.wiki는 광고·후원·유료 기능이 없는 비공식 팬 위키이며, 사이트는 아직 공개되지 않았다. **유출 자료는 절대 사용·게시하지 않으며 HoYoverse의 이용약관(ToS)을 위반하는 행위를 하지 않는다**는 운영 원칙을 따른다. 위반이 확인된 자료·방식은 사용을 중단하고 수정·삭제한다.

출시되어 게임 화면에서 확인할 수 있는 인물 이미지는 추출본이라는 이유만으로 배제하지 않는다([이미지 방침 B안](image-policy-2026-11-11.md)). **B안은 약관 적합성이 확인된 방식이 아니라, Legal FAQ의 비상업 팬사이트 안내를 고려하면서 남는 불확실성을 받아들이는 운영 선택이다.** 직접 역공학·보호조치 우회·클라이언트 추출 작업은 허용하지 않는다. 이미지의 취득 경로, 게시 용도, 제3자 권리와 공개 버전을 파일별로 검토하며, 이미지 사용 결정과 Fandom 텍스트 취득·LLM 처리 결정은 분리한다.

## 2. 확인한 사실

### 2.1 HoYoverse

| 자료 | 확인 내용 | 적용 범위와 한계 |
|---|---|---|
| [원신 이용약관](https://genshin.hoyoverse.com/en-us/company/terms) | 3(b)(vii) "Copy, reproduce, adapt, reverse engineer, decompile, disassemble or otherwise create derivative works based on any of the COGNOSPHERE Services" 금지. 3(b)(viii) "extracting source code, hacking, cracking" 등 금지. 3(d) 명시적 허락 외 복제 금지, (ii) 비공개 정보 공개 금지, (iii) "individual enjoyment and non-commercial purpose" 외 사용 금지. 3(e) 사전 서면 동의 없는 사용 금지. 7(b)는 이미지·그래픽·텍스트·이름 등을 보호 대상으로 열거. 7(c) "modified, copied, distributed, framed, reproduced, republished, downloaded, scraped, displayed, posted … without COGNOSPHERE's express prior written permission" 금지. 23(i) "In case of any inconsistency between this Agreement and local laws of your country or residence, local laws shall prevail and govern" | 문언상 7(c)는 인게임 스크린샷과 추출 아이콘을 구분하지 않고 게임 자료의 게시 전반을 서면 허락 대상으로 둔다. 취득 과정에는 3(b)(vii)의 복제·변형·역공학과 3(b)(viii)의 소스 코드 추출 등 관련 제한도 별도로 검토해야 한다. 이번에 읽은 본문에는 개정일 표시가 없었다(이전 검색 색인 확인으로는 2026-05-20 개정) |
| [원신 Legal FAQ](https://www.hoyolab.com/article/143107) Q2 | 질문은 "re-creation (excluding direct reposting), **or** post materials on their personal fansite or any other websites"이다. 답변은 "We do not prohibit non-commercial personal use"이며, 권리 이전이나 법적 승인(묵시적 승인 포함)이 아니고, 권리 고지 `© All rights reserved by COGNOSPHERE. Other properties belong to their respective owners.`를 요구하며, 프로젝트에 부정적 영향이 있으면 책임을 물을 수 있다고 한다. 미공개 자료는 제외한다 | "직접 재게시 제외"는 재창작 갈래에 붙어 있고, 팬사이트 게시는 별도 갈래로 질문에 포함되어 있다. 그러나 묵인 표명이며 허락(license)이 아니다. 음악 단락의 "your use shall be in accordance with the terms and regulations of the Terms of Service"가 Q2 전체에 적용되는지는 문언상 불분명하며, 전체에 적용된다고 읽으면 7(c)로 순환한다 |
| 같은 FAQ Q3(4), Q6, Q9, Q11 | Q3(4)(영상 지침): "reposting of trailers, soundtracks, gameplay sequences, and art collections are not allowed", "you may not split our project content into a single piece of material for profit". 직접 재게시 제한은 창작 의견·아이디어 추가 여부의 맥락에서 제시된다. Q6: "reasonable reposting and quoting of our published information to the extent permitted by local law" 허용. Q9: 유출된 미공개 콘텐츠의 공유·사용 금지, 법적 책임 추궁. Q11: 별도 서면 합의가 우선 | Q3은 영상 지침이며 콘텐츠 분리 금지에는 영리 목적이라는 한정이 있다. 비영리 위키의 에셋 모음을 직접 금지하는 근거로 일반화하지 않는다. Q9는 유출 금지 원칙의 직접 근거다 |
| [공식 고객지원](https://support.hoyoverse.com/hc/en-us/articles/50333834244633-Can-I-use-in-game-music-for-my-fan-made-content) | 2025-10-03 갱신된 원신 음악 사용 안내가 위 Legal FAQ로 연결한다 | FAQ가 공식 안내임을 뒷받침한다. 음악 안내 자체를 이미지 허락으로 쓰지 않는다 |
| [공식 커뮤니티 규칙 Rule 7](https://www.hoyolab.com/article/88) | datamines를 명시해 논의·배포를 금지한다 | 공식 커뮤니티 운영 규칙이다. 외부 위키의 모든 출시 이미지 사용 금지로 일반화하지 않는다 |
| [Honey Hunter 사건의 회사 답변, PCGamesN](https://www.pcgamesn.com/genshin-impact/honey-hunter-world) | 2021년 사건에 대한 miHoYo 답변은 해당 사이트의 미공개 정보 삭제 및 재게시 금지 요구를 설명한다 | 출시 이미지만 사용하는 위키에 대한 사례가 아니다 |
| [Cognosphere v. X Corp. 결정문](https://torrentfreak.com/images/3-23-mc-80294-PHK-Cognosphere-v-X-Corp-Doc-18-deny-motion-tto-quash-240918-.pdf), 2024-09-18, 23-mc-80294-PHK | 미출시 업데이트의 이미지 등을 게시한 계정들의 신원정보에 관한 DMCA 소환장 취소 신청을 기각했다(2·11쪽) | 출시된 아이콘의 위키 사용에 대한 판결이 아니다 |

### 2.2 Fandom

| 자료 | 확인 내용 | 적용 범위와 한계 |
|---|---|---|
| [Fandom 이용약관](https://www.fandom.com/terms-of-use), USER CONDUCT | "Except as expressly permitted by the Company (for example with respect to the use of text content … as set forth at our licensing page), you may not modify, publish, transmit, reproduce, scrape, create derivative works from, distribute, perform, adapt, aggregate … any of the content". "Use any robot, spider, site search and/or retrieval application, or other device to scrape, extract, retrieve or index any portion of the content" 금지. "not use any robot, spider, scraper or other automated means to access the Services for any purpose without our express written permission". "Without our express, prior written consent, use or copy the content for the development of any software program, including … training a machine learning or artificial intelligence (AI) system" 금지 | 예외로 명시된 것은 라이선스 페이지에 따른 텍스트 사용이다. 자동 접근은 목적과 무관하게 서면 허락 대상이다 |
| 같은 약관, 비텍스트 콘텐츠 | 이용자가 올린 비텍스트 콘텐츠에 대해서는 올린 사람이 권리를 보증할 뿐("you agree that you have the right to submit such content") 재사용 라이선스를 정하지 않는다 | |
| [Fandom Licensing](https://www.fandom.com/licensing) | 위키 텍스트는 "Creative Commons Attribution-Share Alike License **3.0** (Unported)". "Non-text media on Fandom should not be assumed to be available under the same license as the text. Please view the media description page". 출처 표기는 문서 URL·하이퍼링크로 충족(Attribution a) | 프로젝트 콘텐츠 라이선스(CC BY-SA 4.0)와 판이 다르다(4절) |
| Fandom 파일 페이지 예시(`File:Paimon_Icon.png`) | 라이선스 태그 "This file is copyrighted to HoYoverse". fair use 주장은 "when used on *Genshin Impact* Wiki, hosted on servers in the United States by Fandom, Inc."로 한정되며, "This file's usage should also comply with HoYoverse's intellectual property guidelines"라고 적혀 있다 | 이 파일 페이지는 aru.wiki에 대한 재사용 허락을 제공하지 않는다. HoYoverse의 게임 IP 권리와 게시자의 별도 권리·사용 조건은 각각 확인해야 한다 |
| 원신 Fandom 위키 Rules and Guidelines | 출시된 아이템·무기의 데이터마이닝 아이콘과 출시 캐릭터 정보(아이콘·이미지 등)를 허용하고, 미출시·기간 한정 미개방 콘텐츠·출시 후 베타 자료·유출을 금지한다. "Make sure you have permission to use something before you copy it" | 그 위키에 무엇을 올릴 수 있는지에 관한 규칙이며 외부 재사용 허락이 아니다. 출시 여부로 선을 긋는 B안과 기준이 같은 운영 사례다 |
| Fandom 도움말: 데이터베이스 덤프 | 각 위키의 `Special:Statistics`에서 텍스트 덤프(현재판, 전체 이력)를 내려받을 수 있다. "can be used as a personal backup or for bot maintenance tasks". 덤프에도 위키의 라이선스가 적용된다. 이미지와 비공개 사용자 정보는 포함하지 않는다. 갱신은 관리자 요청 또는 `Special:Contact`로 7일에 한 번 | 회사가 직접 제공하는 텍스트 취득 경로다 |

### 2.3 Enka.Network

| 자료 | 확인 내용 | 적용 범위와 한계 |
|---|---|---|
| [개인정보처리방침](https://enka.network/privacy-policy) | 요청 로그(일시, URL, IP, 요청 헤더) 저장, 계정, Patreon 기능을 다룬다. "Enka.Network is not related in any way to miHoYo Co., Ltd. and Cognosphere Pte., Ltd." | 이용약관은 확인되지 않았다 |
| [원신 API 문서: Icons and Images](https://github.com/EnkaNetwork/API-docs/blob/master/docs/gi/api.md#icons-and-images) | 캐릭터·무기·성유물 아이콘을 `https://enka.network/ui/[icon_name].png`로 취득할 수 있다고 안내한다 | Enka 운영자가 이미지 취득 경로를 안내한다는 근거다. 외부 재배포·자체 호스팅에 필요한 HoYoverse의 저작권 허락을 제공하는 것은 아니다. 별도의 이미지 이용 조건은 확인하지 못했다 |
| [API 운영 안내](https://github.com/EnkaNetwork/API-docs/blob/master/api.md) | UID 요청에는 동적 요청 제한이 있으며, `ttl`에 따른 캐시를 권고한다. 과도한 요청에는 429로 응답한다 | UID API 지침을 이미지 URL의 구체적인 요청 한도로 일반화하지 않는다. 이미지도 필요한 파일만 소량·저속으로 취득하고 반복 요청을 피한다 |

확인 방법: 최초 작성 시 Legal FAQ와 커뮤니티 규칙은 HoYoLAB 공개 게시물 본문을 확인했다. 원신 이용약관, Legal FAQ 전문, Fandom 이용약관·Licensing·위키 규칙·덤프 도움말·파일 페이지, Enka 개인정보처리방침은 사람이 브라우저에서 연 본문(일부는 화면)을 확인했다. Fandom 페이지는 자동 요청에 HTTP 402로 응답했으며 이를 우회하지 않았다. 회사 답변은 기사 본문, 법원 결정은 PDF 본문을 확인했다. 이번 수정 검토에서는 Legal FAQ를 HoYoLAB 공개 API의 게시물 본문으로, Enka의 이미지 취득·UID 요청 안내를 공식 API 문서로 재확인했다. Fandom 약관 전문은 이번에도 HTTP 402로 재확인하지 못했으므로 해당 부분은 최초 작성 시 확인한 인용을 전제로 한다.

## 3. 판단

1. **취득 경로가 바뀌어도 게임 IP 권리 문제는 남는다.** 게임 이미지에는 HoYoverse의 권리가 남으며, 촬영자·편집자·제작자 등의 별도 권리도 확인한다. B안의 운영 판단은 Legal FAQ Q2의 비상업 개인 사용 안내를 고려한 것이며, 명시적 허락이나 면제를 확보한 것은 아니다. 법률상 인용·공정이용 가능성은 개별 사용에 대해 별도로 검토한다.
2. **게시 제한과 취득 과정은 별도로 검토한다.** 이용약관 7(c)는 스크린샷과 추출 아이콘을 구분하지 않고 게시를 제한한다. 이는 양쪽 모두 검토 대상이라는 뜻이며 B안의 허용 근거가 아니다. 3(b)(vii)의 복제·변형·역공학, 3(b)(viii)의 무단 이용 방법, 3(d)의 복제·비공개 정보 등 관련 제한도 함께 검토한다. 직접 촬영으로 취득 경로의 불확실성을 줄여도 게시 권한 문제가 자동으로 해결되지는 않는다.
3. **이미지 출처로 Fandom은 쓰지 않는다.** Fandom 이용약관은 텍스트 외 콘텐츠의 복제·스크래핑을 허락하지 않고, 파일 페이지의 fair use 주장도 그 위키에 한정된다. 같은 HoYoverse 이미지라도 Fandom을 거치면 HoYoverse 지침과 별개로 Fandom 약관이 추가로 걸린다.
4. **Enka의 이미지 취득 안내와 저작권 허락을 구분한다.** Enka는 공식 API 문서에서 이미지 URL을 안내한다. 별도 약관을 찾지 못했다는 사실로 약관이 없다고 단정하거나 자유로운 재배포를 추론하지 않는다. 확인한 사용 조건과 출처를 기록하고 요청은 필요한 파일에 한해 소량·저속으로 한다. 원신 API는 플레이 가능 캐릭터 등의 아이콘을 안내하지만, 약 3,370명에 이르는 비플레이 인물 초상의 확보 경로는 확인되지 않았다.
5. **원본 에셋 모음을 만들지 않는다.** 이미지는 인물·임무 설명에 붙여 쓰고, 일괄 다운로드나 독립 자료실을 제공하지 않는다. 이는 사용 범위를 좁히기 위한 자체 운영 제한이다. Legal FAQ Q3(4)는 영상 제작 지침이며, 창작 의견·아이디어 추가 없는 직접 재게시 제한과 영리 목적의 콘텐츠 분리 금지를 다룬다. 이를 비영리 위키에 직접 적용되는 포괄적 에셋 모음 금지로 해석하지 않는다.
6. **Fandom 텍스트 취득과 후속 처리를 분리한다.** 회사가 직접 제공하는 덤프를 취득 경로로 선택하고 `api.php` 자동 호출은 중단한다. 덤프 제공은 CC 조건 준수, 게임 대사 등 제3자 원문 사용, 외부 LLM 입력을 모두 허용한다는 근거가 아니다. 요약·정보 추출을 위한 추론과 모델 학습도 구분하되, 학습이 아니라는 사실만으로 소프트웨어 개발 관련 조항의 적용을 배제하지 않는다. 기존 캐시와 생성물은 보존하면서 덤프의 문서·리비전과 대조하고, 대조 결과와 권리 검토 없이 새 입력으로 재사용하거나 공개 승인된 자료로 취급하지 않는다.
7. **저작권법상 제한 규정과 약관상 의무를 구분한다.** 한국법이 적용되는 개별 이용에서 [저작권법 제28조의 인용](https://www.law.go.kr/LSW/lsLinkCommonInfo.do?chrClsCd=010202&lsJoLnkSeq=1030281913)·[제35조의5의 공정이용](https://www.law.go.kr/LSW/lsSideInfoP.do?docCls=jo&joBrNo=05&joNo=0035&lsiSeq=283335&urlMode=lsScJoRltInfoR)을 검토할 여지는 있다. 적용법·저작권 제한·약관상 의무의 관계를 23(i)만으로 확정하지 않는다. 비영리·출처 표기·축소만으로 성립하는 것은 아니며, 사용 목적·범위·저작물 성격·시장 영향 등을 개별 검토한다. 개별 사용의 성립 여부는 판단하지 않았다(5절).

## 4. 라이선스 정합성

- Fandom 위키 작성자의 텍스트는 원칙적으로 CC BY-SA 3.0이다. [CC BY-SA 3.0 §4(b)](https://creativecommons.org/licenses/by-sa/3.0/legalcode.en)는 같은 라이선스 요소의 상위 버전으로 2차적 저작물을 배포할 수 있게 한다. 번역·각색분에 4.0을 적용하더라도 원저작물의 권리·라이선스 고지와 출처 표시 의무는 유지한다. 그대로 재사용하는 원문은 3.0을 유지하고 변경한 부분은 변경 사실을 표시한다.
- 사실만 추출해 독립적으로 작성한 부분, 위키 표현의 번역·각색, 게임 대사 등 제3자 표현, 프로젝트의 새로운 작성·편집을 구분한다. LLM 처리 여부는 이 구분을 대신하지 않으며 원문 권리를 해소하지 않는다. 프로젝트가 보유한 권리의 범위에서만 4.0을 적용한다.
- 문서 URL·리비전·원문 라이선스·변경 사실을 기록하고 이용자가 확인할 수 있게 표시한다. 구체적인 적용 범위는 [콘텐츠 라이선스](../LICENSE-CONTENT.md)에 따른다.
- 게임 이미지와 대사·서적 원문에는 프로젝트의 CC 라이선스를 적용하지 않는다. COGNOSPHERE와 해당 제3자의 권리를 구분해 표시한다.

## 5. 확인하지 못한 범위

- 출시된 추출 아이콘을 외부 비영리 위키에 게시·자체 호스팅하는 방식에 대한 HoYoverse의 명시적 허용 또는 면제.
- Legal FAQ Q2와 이용약관 7(c)의 관계, 음악 단락의 이용약관 준수 문구가 Q2 전체에 미치는지 여부.
- 한국법상 개별 사용의 인용·공정이용 성립 여부, 식별용 이미지 사용의 크기·수량 기준.
- Fandom 덤프의 위키 글을 외부 LLM의 추론 입력으로 쓰는 경우 소프트웨어 개발 관련 조항의 적용 및 CC 라이선스와의 관계. 추론과 학습은 구분하되 덤프 제공 자체로 허용을 확정하지 않는다.
- 덤프·캐시에 포함된 게임 대사·서적 등 제3자 원문을 외부 LLM에 입력할 근거와 제공자별 처리·보관·학습 이용 조건. Fandom 텍스트의 CC 조건만으로 해결되지 않는다.
- Enka 이미지의 외부 재배포·자체 호스팅에 관한 별도 조건 및 아직 확인하지 못한 이용 조건의 존재 여부.
- Project Amber가 받았다는 통지의 원문과 대상. 커뮤니티의 주장만으로 사유를 확정하지 않는다.
- 출시된 식별용 이미지만 쓰는 비영리 위키에 대한 권리행사 사례. 이번 조사에서 찾지 못했으며, 사례가 없다고 단정하지 않는다.
- 플레이 가능 캐릭터 외 인물(약 3,370명)의 이미지 확보 경로.
- HoYoverse나 Fandom이 aru.wiki의 운영을 승인하거나 권리행사를 하지 않겠다는 약속. 이러한 승인은 받지 않았다.

'공식 문서에서 특정 금지를 찾지 못함', '다른 사이트에서 사용 중', '집행 사례를 찾지 못함'은 허락의 증거가 아니다.

## 6. 위험과 대응

확률을 산정할 근거가 없으므로 위험을 수치화하거나 등급화하지 않는다. 아래 조치는 운영 대응이며 법적 면책을 보장하지 않는다.

| 남는 위험 | 운영 대응 |
|---|---|
| 이미지 사용에 대한 권리자의 이의·삭제 요구 | 파일별 출처·공개 버전·가공 내용을 기록해 대상 이미지를 바로 식별하고 수정·삭제한다. 요구 범위에 따라 서비스 운영도 영향을 받을 수 있다 |
| 유출·미공개 자료의 혼입 | 실제 공개 버전과 근거를 확인하고, 불명확하면 게시하지 않는다. 발견 시 즉시 제거한다 |
| 제3자 사이트 약관 위반 | Fandom에서는 이미지를 받지 않고 자동 API 호출을 중단한다. 텍스트는 공식 덤프 경로로 전환하되 후속 처리 권한은 별도로 검토한다. Enka는 이미지 취득 안내와 별도 조건을 구분하고 필요한 파일만 소량·저속으로 요청한다 |
| 외부 LLM 입력 권한과 처리 조건 불명확 | 위키 작성자의 글과 게임 원문을 구분한다. 새 입력의 권리 근거 및 제공자별 조건을 확인하기 전 해당 자료를 외부 LLM으로 추가 전송하지 않는다. 기존 생성물도 공개 전에 입력 출처와 권리 범위를 검토한다 |
| 덤프 시점과 최신 버전의 차이 | 현재 보유 덤프는 2026-09-30 생성분으로 7.1 초반까지만 반영한다(7.2는 2026-11-04 출시). 도움말상 갱신은 관리자 요청 또는 `Special:Contact`로 7일에 한 번 가능하지만 현재 프로젝트에는 위키 관리자 권한이 없어 갱신 시점을 정할 수 없다. 덤프에 없는 버전의 내용은 `미검수` 등으로 구분한다 |
| 제3자 촬영물·팬아트 등의 권리 침해 | 게임 IP와 촬영자·제작자 권리를 구분하고 사용 조건을 확인한다 |
| 라이선스 오적용 | 게임 이미지·대사 등 제3자 원문을 프로젝트 CC 대상에서 제외하고, Fandom 원문 3.0과 번역·각색분의 적용 범위·변경 사실·출처를 표시한다 |
| 약관·공식 안내의 변경 또는 해석 차이 | 변경이나 이의 제기 시 해당 사용 방식을 재검토하고, 위반이 확인되면 중단·수정한다 |
| 문의 대응 지연 | 권리 문의 창구를 확인하고 수신 후 72시간 이내 답변한다. 미해결 사안은 확인 중인 내용과 후속 조치를 안내한다 |

## 7. 권리 문의

**모든 권리 관련 질문과 수정·삭제 요청은 [contact@aru.wiki](mailto:contact@aru.wiki)로 보내 주세요. 수신 후 72시간 이내에 답변합니다.** URL과 대상 자료, 문의 내용을 알려 주시면 확인에 도움이 됩니다. HoYoverse의 수정·삭제 요청은 즉시 따르며, 다른 권리자의 요청도 확인하여 필요한 조치를 신속히 진행합니다.

72시간은 답변 기한으로, 최종 해결 기한이나 자동 삭제를 뜻하지 않는다. 이는 프로젝트의 운영 약속이며, 이 문서 작성만으로 메일 수신·알림·담당자 대응 체계의 실제 작동이 검증된 것은 아니다.

## 8. 실행 상태와 공개 전 확인

B안 수정 결정은 문서에 반영했다. 아래 구현·운영 확인이 모두 끝났다는 뜻은 아니다.

- 완료: `scripts/fandom/client.mjs`의 자동 API 호출을 차단했다. 기존 캐시는 로컬에서만 읽고, 캐시 누락·손상·`--refresh` 요청은 네트워크 접근 없이 실패한다. 이는 해당 캐시의 새 입력 사용이나 공개 승인을 뜻하지 않는다.
- 완료: 빌드 스크립트의 문서·리다이렉트·분류·리비전 조회를 2026-09-30 공식 덤프로 대체하고, 기존 캐시·생성물과 대조했다([덤프 전환 기록](dump-migration-2026-11-11.md)). `data/generated/`의 Fandom 파생 데이터를 덤프 재빌드로 교체했다(LLM 생성물은 재생성하지 않음). 덤프 이후 버전(7.2)과 덤프 이후 편집은 덤프 갱신 전까지 반영되지 않는다.
- 위키 글과 게임 원문을 구분하고 외부 LLM 입력 근거·제공자 조건을 별도로 결정한다. 기존 LLM 처리 코드의 존재를 사용 승인으로 간주하지 않는다.
- 전 인물 이미지 목록에서 파일별 출처·공개 버전·제3자 조건·게시 용도·가공 이력·검수 결과를 기록하고 게시 가능한 파일을 판단한다.
- 화면에서 출처·라이선스·변경 사실을 확인할 수 있게 하고, 이의 제기 대상 파일과 참조를 식별해 삭제·교체할 수 있도록 구현·검증한다.
- 권리 문의 메일의 수신·알림·담당자 대응을 확인하고 72시간 답변 약속의 실제 작동을 검증한다.
