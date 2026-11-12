# 한국어 이름 후보 (로컬 덤프)

`node scripts/fandom/ko-candidates.mjs khaenriah`가 만든다(손으로 고치지 않는다). 대상은 [한국어 이름이 필요한 말](ko-names-needed.md)과 같다(3번 이상).
근거는 로컬 Fandom 덤프의 `Other Languages` 표뿐이다. 네트워크를 쓰지 않고, LLM이 고르지 않는다.

- **같은 영어**: 표의 `en`이 그 이름과 같다(`The`, 복수 `s` 무시). 그래도 다른 것을 가리킬 수 있으니 문서를 확인한다.
- **옛 판에만**: 지금 문서에는 없고 예전 판의 표에만 있다. 표가 다른 문서로 합쳐지며 빠졌을 수도, 틀려서 지워졌을 수도 있다. 판마다 값이 다르면 모두 적는다.
- 후보의 한국어가 다른 인물·존재의 이름이면 정체가 드러날 수 있으니 쓰지 않는다(예: Ruler of Life → 나베리우스).
- **들어간 이름**: `en`에 그 이름이 단어로 들어 있다. 그 이름 자체의 번역이 아니다. 같은 영어가 다른 한국어로 나올 수 있다(Archon: 마신 / 집정관).

## 넣는 법

맞는 이름을 고르면 한 줄로 넣는다. 근거 문서는 후보에서 자동으로 붙는다(고른 한국어가 들어 있는 표만).

```bash
node scripts/fandom/ko-accept.mjs 'Harbinger|Harbingers=집행관'
node scripts/fandom/ko-accept.mjs 'Il Dottore=도토레' --play maintainer --note '마신 임무 3장 4막 대사'
node scripts/theme/snapshots.mjs khaenriah --write --only none
```

`|`로 단수·복수 같은 여러 영어 형태를 한 번에 넣는다. 후보에 근거가 없으면 `--play 이름`(게임에서 봄), `--url 주소`(공개 문서·영상), `--maintainer 이름`(일반어를 직접 정함) 중 하나가 있어야 넣어진다.
채팅으로 "3번 집행관 맞음"처럼 알려 줘도 같은 명령으로 넣는다.

## 후보가 있는 것 (70개)

### 2. Abyssal (21회)

예문: 거대한 짐승 엘리나스가 폰타인에 이르자 많은 심연의 바다 생물도 함께 나타났고, 그의 존재는 나라의 땅과 물을 심하게 오염시켰다. Fontaine Armada는 짐승을 상대하려 되돌아와 35일 동안 엘리나스를 쫓았고, 그 과정에서 온갖 Abyssal 생물을 끌어들였다. 막으러 나선 추격이 도리어 심연 쪽 무리를 한곳으로 모은 셈이다. 엘리나스는 원인을 알 수 없는 상처로 피를 흘리다 죽었고, 그 잔해와 심연의 힘에서 아직도 잔해를 떠도는 균열계 원형체가 생겨났다.

- 들어간 이름에 자주 나온 한국어: **심연** 11개, **재앙** 2개
- `Abyssal Blight` = 심연 이슬 ([Abyssal Blight](https://genshin-impact.fandom.com/wiki/Abyssal_Blight))
- `Abyssal Traces` = 「심연」의 종적 ([Abyssal Traces](https://genshin-impact.fandom.com/wiki/Abyssal_Traces))
- `Abyssal Summons` = 심연의 부름 ([Abyssal Summons](https://genshin-impact.fandom.com/wiki/Abyssal_Summons))
- `"Abyssal Bounty"` = 「심연 생선구이」 (["Abyssal Bounty"](https://genshin-impact.fandom.com/wiki/%22Abyssal_Bounty%22))
- `Abyssal Crusader` = 심연의 별 수집가 ([Abyssal Crusader](https://genshin-impact.fandom.com/wiki/Abyssal_Crusader))
- `Abyssal Riftlines` = 심연 균열선 ([Abyssal Riftlines](https://genshin-impact.fandom.com/wiki/Abyssal_Riftlines))
- … 외 6개 (`data/generated/ko-name-candidates.json`)
- 넣을 때: `'Abyssal=한국어'`

### 3. Solnari (19회)

예문: 헬카가 전한 카르야의 말에 따르면, 심연의 영향은 스네즈나야에서 커지고 있었고 도시로 돌아올 때 북쪽 길은 피해야 했다. 그 영향은 노드크라이 전역에 멀리 퍼져 있었으며, 가장 뚜렷한 세력은 대재앙 이래 존재한 **광란의 사냥**, 곧 무언가를 찾는 침식된 존재들이었다. 광란의 사냥은 노드크라이에 기반을 둔 정체 불명의 조직이고, 그 땅은 대재앙 동안 심연의 피해를 가장 먼저 입은 곳 가운데 하나였다. 침식된 인간들은 **"Rächer of Solnari"** 레리르를 섬기며, 그의 지휘 아래 세 달의 파편을 찾는다. 무언가를 찾는다는 기록과 파편을 찾는다는 기록은 같은 탐색을 가리키는 것으로 보인다.

- `Rächer of Solnari` = 달 사냥꾼 ([Rerir](https://genshin-impact.fandom.com/wiki/Rerir))
- 넣을 때: `'Solnari=한국어'`

### 4. House (18회)

예문: 아를레키노는 **「아를레키노」**라는 별칭으로도 알려진 인물로, 우인단 집행관 열한 명 가운데 넷째이자 **벽난로의 집**의 현재 책임자다. House의 구성원들은 아를레키노를 '아버지'라 부르고, 아를레키노는 그들을 '아이들'이라 부른다. 이 호칭은 전임자인 쿠자비나가 '어머니'를 자칭한 방식과 대비되어, House 운영의 변화를 상징하는 장치로 보인다. 아를레키노는 폰타인의 예언 사태에서 House의 인력으로 지원을 제공했고, 그 공로로 느비예트에게 물 신의 심장을 받아 스네즈나야로 가져갔으며, 이후 노드크라이에서 콜롬비나와 산드로네를 돕는 과정에서 도토레 문제에 관여했다.

- 들어간 이름에 자주 나온 한국어: **집** 14개, **민가** 7개, **사막** 6개, **리월풍** 4개
- `Clean House` = 앞마당 청소 ([Clean House](https://genshin-impact.fandom.com/wiki/Clean_House))
- `Aino's House` = 아이노의 집 ([Aino's House](https://genshin-impact.fandom.com/wiki/Aino's_House))
- `Golden House` = 황금옥 ([Golden House](https://genshin-impact.fandom.com/wiki/Golden_House))
- `Hamlet House` = 마을 정원 ([Hamlet House](https://genshin-impact.fandom.com/wiki/Hamlet_House))
- `House of Kun` = 곤 씨 집안 ([Kun Family](https://genshin-impact.fandom.com/wiki/Kun_Family))
- `House of Yun` = 운 씨 가문 ([Yun Family](https://genshin-impact.fandom.com/wiki/Yun_Family))
- … 외 45개 (`data/generated/ko-name-candidates.json`)
- 넣을 때: `'House=한국어'`

### 5. Knights / Knight (16회)

예문: 알베도는 원신의 플레이 가능한 캐릭터이며, 라인도티르가 만든 **합성 인간**이다. 그는 페보니우스 기사단의 수석 연금술사이자 조사팀의 대장이고, 연금술 분야의 뛰어난 업적으로 몬드 사람들과 Knights 구성원 모두에게 존경받는다. 예의 바르고 우아하면서도 겉으로는 내향적으로 보이는 그는, 선대 학자들이 남긴 무한하고 모호한 **지식**을 얻는 일을 마음의 소망으로 삼는다.

- 들어간 이름에 자주 나온 한국어: **기사** 23개, **기사단** 9개, **바람** 4개, **뱀** 3개
- `White Knight` = 순백하던 기사 ([Roland](https://genshin-impact.fandom.com/wiki/Roland))
- `Dandelion Knight` = 민들레 기사 ([Jean/Profile](https://genshin-impact.fandom.com/wiki/Jean%2FProfile))
- `Knight of Boreas` = 북풍 기사 ([Varka/Profile](https://genshin-impact.fandom.com/wiki/Varka%2FProfile))
- `Wandering Knight` = 방랑 기사 ([Wandering Knight](https://genshin-impact.fandom.com/wiki/Wandering_Knight))
- `Wind-Riding Knight` = 바람을 따라 온 기사 ([Wind-Riding Knight](https://genshin-impact.fandom.com/wiki/Wind-Riding_Knight))
- `Bloodstained Knight` = 핏빛 기사 ([Roland](https://genshin-impact.fandom.com/wiki/Roland))
- … 외 33개 (`data/generated/ko-name-candidates.json`)
- 넣을 때: `'Knights|Knight=한국어'`

### 7. Grand Master (13회)

예문: 보레아스는 바르바토스가 세운 바람 사신수의 North Wind가 되었고, 페보니우스 기사단의 북풍의 기사 작위는 레이븐우드가 인정받으며 이어졌다. 작위는 대대로 내려갔지만 보레아스가 직접 인정한 이는 적었고, 대재앙 때 로스탐이 인정을 받았으며 롤랑은 작위 전부터 존경을 얻었다. 로스탐의 죽음과 롤랑의 이탈로 계보는 한때 멈췄고, 현재 바르카가 북풍의 기사이자 Grand Master로 여러 번 보레아스에게 도전해 총애를 얻었다.

- `Substitute Acting Grand Master Noelle` = 노엘의 대리업무 ([Substitute Acting Grand Master Noelle](https://genshin-impact.fandom.com/wiki/Substitute_Acting_Grand_Master_Noelle))
- 넣을 때: `'Grand Master=한국어'`

### 8. Moon (13회)

예문: **장의 불꽃의 전쟁** 동안 니벨룽겐은 불충을 이유로 Moon Sisters를 **Moon의 반영**에 가두었다. 캐넌은 그곳을 티바트의 원래 지배자 용왕 니벨룽겐이 달의 여신들을 가둔 곳이라 말했다. 세 달은 두려운 전쟁 무기로 벼려졌고, 서리달의 티바트를 등진 반구는 달 핵의 에너지로 파괴적인 광선을 쏘는 거대한 대포가 되었다. 가담과 중립을 가르던 다툼이 불충으로 묶이며 달의 무기화까지 이어진 것으로 보인다.

- 들어간 이름에 자주 나온 한국어: **달** 57개, **공월** 12개, **달빛** 12개, **노래** 10개
- `Moon Pie` = 달빛 파이 ([Moon Pie](https://genshin-impact.fandom.com/wiki/Moon_Pie))
- `Blue Moon` = 블루문 ([Blue Moon](https://genshin-impact.fandom.com/wiki/Blue_Moon))
- `True Moon` = 진실의 달 ([True Moon](https://genshin-impact.fandom.com/wiki/True_Moon))
- `Death Moon` = 죽음의 달 ([Death Moon](https://genshin-impact.fandom.com/wiki/Death_Moon))
- `Frost Moon` = 서리의 달 ([Canon](https://genshin-impact.fandom.com/wiki/Canon))
- `Frost Moon` = 서리달 ([Frost Moon](https://genshin-impact.fandom.com/wiki/Frost_Moon))
- … 외 137개 (`data/generated/ko-name-candidates.json`)
- 넣을 때: `'Moon=한국어'`

### 18. Shade / Shades (12회)

예문: 그소요토스가 패배한 뒤, 마비카가 로노바와의 약속을 지키러 오치카나타에 갔을 때 로노바가 그녀의 죽음을 요구했고, 밤의 신은 이를 꺼렸다. 대신 밤의 신은 그 자리를 대신할 다른 이가 온다고 밝혔고, 그 다른 이는 카피타노였다. 카피타노는 대부분이 「오대 죄인」이 심연의 힘을 이용한 일을 알지 못했던 켄리아 사람들이 고통받은 일에 대해 로노바에게 혐오를 드러내고, 마비카 대신 Shade가 원한 죽음이 되었다. 이는 죄 없는 켄리아 사람들이 겪은 고통에 대한 복수이기도 했다. 그가 받은 불멸의 저주 때문에 이 선택은 세계의 규칙을 풀어낼 수 있는 **역설**을 만들었고, 로노바는 자신의 규칙 중 하나를 포기하거나 역설을 일으켜야 했다. 그가 불멸의 저주를 역설로 되돌린 방식은 자신이 당한 처벌의 규칙을 그대로 이용해 로노바를 압박한 셈이다. 로노바는 결국 저주를 유지했고, 카피타노는 밤의 신과 결합해 그녀가 영원히 죽지 않게 했으며, 그의 육체는 근원의 불 성좌에 앉은 채 남았다.

- 들어간 이름에 자주 나온 한국어: **그림자** 13개, **진홍빛** 12개, **그늘** 7개, **아래** 3개
- `Four Shades` = 네 번 겹친 그림자 ([Four Great Rulers](https://genshin-impact.fandom.com/wiki/Four_Great_Rulers))
- `Scarlet Shade` = 진홍빛 그림자 ([Scarlet Shade](https://genshin-impact.fandom.com/wiki/Scarlet_Shade))
- `"Petaled Shade"` = 「잎의 그늘」 (["Petaled Shade"](https://genshin-impact.fandom.com/wiki/%22Petaled_Shade%22))
- `Tea-Break Shade` = 「차 한 잔의 그늘막」 ([Tea-Break Shade](https://genshin-impact.fandom.com/wiki/Tea-Break_Shade))
- `Shades of Tokoyo` = 영원의 정령 ([Shade of Tokoyo](https://genshin-impact.fandom.com/wiki/Shade_of_Tokoyo))
- `"Chimalli's Shade"` = 「치말리의 그늘」 (["Chimalli's Shade" (Achievement)](https://genshin-impact.fandom.com/wiki/%22Chimalli's_Shade%22_(Achievement)))
- … 외 23개 (`data/generated/ko-name-candidates.json`)
- 넣을 때: `'Shade|Shades=한국어'`

### 9. Fontainian (11회)

예문: 10년이 넘는 세월 전, 아를레키노는 리넷이 인신매매된 Lefevere 가문의 수장을 죽인 뒤 리니와 리넷을 받아들였다. 어느 임무에서 리니와 리넷은 Fontainian 귀족으로부터 범죄를 입증할 증거를 확보하는 일을 맡았는데, 같은 귀족을 추적하던 경비대원도 현장에 도착했다. 탈출을 서두르던 중 리니가 의식을 잃었고, 리넷은 체포를 피해 리니를 아를레키노가 기다리던 곳까지 데려갔다. 증거는 망가졌지만 아를레키노는 리넷에게서 바람 신의 눈을 발견했고, 그것을 더 가치 있게 여겼다. 증거가 망가진 뒤에도 리넷의 바람 신의 눈을 더 가치 있게 본 점은, 아를레키노가 임무의 성과보다 아이가 지닌 가능성을 중시했음을 보여준다.

- 들어간 이름에 자주 나온 한국어: **폰타인** 4개, **메시지** 2개
- `A Fontainian Message` = 폰타인으로부터의 메시지 ([A Fontainian Message](https://genshin-impact.fandom.com/wiki/A_Fontainian_Message))
- `A Fontainian Message` = 폰타인식 메시지 ([A Fontainian Message (Achievement)](https://genshin-impact.fandom.com/wiki/A_Fontainian_Message_(Achievement)))
- `Fontainian Foie Gras` = 폰타인 푸아그라 ([Fontainian Foie Gras](https://genshin-impact.fandom.com/wiki/Fontainian_Foie_Gras))
- `Fontainian Onion Soup` = 폰타인 양파 수프 ([Fontainian Onion Soup](https://genshin-impact.fandom.com/wiki/Fontainian_Onion_Soup))
- `Recollections of a Fontainian` = 어느 폰타인 사람의 회상 ([Recollections of a Fontainian](https://genshin-impact.fandom.com/wiki/Recollections_of_a_Fontainian))
- `Fontainian Carpet: "Fair and Square"` = 폰타인 카펫-「네모반듯」 ([Fontainian Carpet: "Fair and Square"](https://genshin-impact.fandom.com/wiki/Fontainian_Carpet%3A_%22Fair_and_Square%22))
- 넣을 때: `'Fontainian=한국어'`

### 13. Watatsumi (9회)

예문: 심해 용 도마뱀은 인간의 존재를 뒤엎고 싶어 그 요청에 따랐으나, 심연의 힘에는 한층 더 취약함을 알게 되었다. 인간을 밀어내려던 일이 도리어 자신들을 그 힘 앞에 내놓은 셈이다. 츠미는 무녀로 가장해 Watatsumi 부대에 가, 허계를 물리치는 일, 다이니치 미코시 아래 갇힌 심해 용 도마뱀을 구하는 일, 어쩌면 탑을 부수는 일까지 돕고자 했다. 앞의 두 목표는 이루었으나 마지막 목표는 해내지 못했다. 페이몬은 의뢰를 받은 이상 이 일의 원인이 심연이니 그냥 지나칠 수 없다고 말했다.

- 들어간 이름에 자주 나온 한국어: **와타츠미** 13개, **와타츠미섬** 3개
- `Watatsumi Army` = 와타츠미군 ([Watatsumi Army](https://genshin-impact.fandom.com/wiki/Watatsumi_Army))
- `Watatsumi Island` = 와타츠미섬 ([Watatsumi Island](https://genshin-impact.fandom.com/wiki/Watatsumi_Island))
- `"Eye of Watatsumi"` = 「와타츠미의 눈」 (["Eye of Watatsumi"](https://genshin-impact.fandom.com/wiki/%22Eye_of_Watatsumi%22))
- `"Fin of Watatsumi"` = 「와타츠미의 지느러미」 (["Fin of Watatsumi"](https://genshin-impact.fandom.com/wiki/%22Fin_of_Watatsumi%22))
- `Crown of Watatsumi` = 와타츠미의 왕관 ([Crown of Watatsumi](https://genshin-impact.fandom.com/wiki/Crown_of_Watatsumi))
- `"Fang of Watatsumi"` = 「와타츠미의 이빨」 (["Fang of Watatsumi"](https://genshin-impact.fandom.com/wiki/%22Fang_of_Watatsumi%22))
- … 외 11개 (`data/generated/ko-name-candidates.json`)
- 넣을 때: `'Watatsumi=한국어'`

### 14. Director (8회)

예문: 피에로는 대재앙 수십 년 전에 태어난 순수 혈통 켄리아인으로 검은 태양 왕조의 왕실 마법사였고, 한때 여행자의 쌍둥이 남매와 함께 살았다. 그는 기술로 셀레스티아에서 무언가를 끌어내리려다 페이몬이 티바트로 내려오게 했고, 페이몬은 대재앙이 닥칠 때까지 그의 궁전에 머물렀다. 엘민에게 심연의 힘 사용을 반대하라고 조언했다가 실패한 피에로는 셀레스티아 개입 때 로노바에게 불멸의 저주를 받았고, "이 세계의 근본 원리"에 원한을 품고 얼음의 여왕의 뜻에 합류해 우인단의 통괄관이 되었다. 대재앙으로 깊이 변한 얼음의 여왕은 벤티를 포함한 다른 집정관들과 관계를 끊고 심연 교단과 싸우며 언젠가 셀레스티아를 뒤엎기 위해 우인단을 세웠다. 경고했던 재앙과 저주를 겪은 피에로가 반신 조직의 Director가 된 것은, 켄리아의 몰락이 개인의 원한을 조직의 방향으로 바꾼 사례로 보인다.

- `Director-in-Chief` = 「총감독」 ([Director-in-Chief](https://genshin-impact.fandom.com/wiki/Director-in-Chief))
- 넣을 때: `'Director=한국어'`

### 15. Dragons (8회)

예문: 별의 바다에서 온 천리는 인류가 깃들 곳을 찾아 헤아릴 수 없는 시간을 우주에서 보냈고, 그 길에서 심연에 부서진 수많은 별을 보았다. 이윽고 목적에 알맞다고 본 행성이 티바트였으며, 당시 그곳은 Dragons의 문명이 사는 곳이었다. 강림보다 앞선 시대의 법은, 니벨룽겐이 맡긴 세 달의 여신의 손에 있었다.

- 들어간 이름에 자주 나온 한국어: **용** 12개, **비밀근원** 4개, **드래곤** 3개, **마룡** 2개
- `Cryo Dragon` = 얼음 용 ([Cryo Dragon](https://genshin-impact.fandom.com/wiki/Cryo_Dragon))
- `Fell Dragon` = 「악룡」 ([Fell Dragon](https://genshin-impact.fandom.com/wiki/Fell_Dragon))
- `Dragon Storm` = 용의 재앙 ([Dragon Storm](https://genshin-impact.fandom.com/wiki/Dragon_Storm))
- `Hydro Dragon` = 물의 용 ([Hydro Dragon](https://genshin-impact.fandom.com/wiki/Hydro_Dragon))
- `Dragon-Queller` = 복룡목 ([Dragon-Queller](https://genshin-impact.fandom.com/wiki/Dragon-Queller))
- `Dragon on the Move` = 「마룡 출격」 ([Dragon on the Move](https://genshin-impact.fandom.com/wiki/Dragon_on_the_Move))
- … 외 30개 (`data/generated/ko-name-candidates.json`)
- 넣을 때: `'Dragons=한국어'`

### 16. League (8회)

예문: 방랑자가 코어를 산드로네에게 넘긴 뒤 알베도와 두린, 여행자는 공식 계산이 끝날 때까지 그의 몸을 지켰다. 알베도와 두린은 계획대로 나샤 마을을 도토레의 부하들로부터 지켰고, 콜롬비나는 돌아왔으며 뒤이은 전투에서 도토레가 쓰러졌다. 도토레가 콜롬비나를 공격한 뒤 사라지자 방랑자는 또 속았다고 분해했고, 휘페르보레아에서 도토레가 '변수'로 환영의 인식을 왜곡해 **가짜 달**을 만들었음을 밝혀냈다. 방랑자는 경험으로 도토레의 수를 예측하겠다고 했고, 알베도는 Hat Guy를 전적으로 신뢰한다고 했다. 알베도는 두린, 바르카와 첫 League 회의에 참석했고, 두린이 바르카의 즉석 기사 서임 발언이 농담인지 묻자 스스로 알아보라고 했다. 그들은 바르카의 일을 마무리하기 위해 노드크라이에 더 머물기로 했다.

- 들어간 이름에 자주 나온 한국어: **리** 2개
- `N-Thousand Leagues Under the Sea` = 해저 몇만 리? ([N-Thousand Leagues Under the Sea](https://genshin-impact.fandom.com/wiki/N-Thousand_Leagues_Under_the_Sea))
- `Twenty Thousand Leagues Under the Sea` = 2만 리 표류 ([Twenty Thousand Leagues Under the Sea](https://genshin-impact.fandom.com/wiki/Twenty_Thousand_Leagues_Under_the_Sea))
- 넣을 때: `'League=한국어'`

### 20. Deceased (7회)

예문: 우인단 11집행관 명단에는 아를레키노가 4번, 「아를레키노」, 페르엘, Active로 기록되어 있다. 같은 명단에서 쿠자비나는 등수 미상의 「아를레키노」로, Deceased로 적혀 있다. 아를레키노가 「아를레키노」 칭호의 현재 보유자라는 점과 맞물려, 이 명단은 그 칭호가 쿠자비나에게서 아를레키노에게 이어진 것임을 보여주는 대목이라고 볼 수 있다. 이처럼 아를레키노는 House의 수장이면서 집행관 서열 Fourth로, House와 우인단 양쪽에서 「아를레키노」라는 이름 아래 놓인 인물인 셈이다.

- `City of the Deceased` = 망자의 도시 ([City of the Deceased](https://genshin-impact.fandom.com/wiki/City_of_the_Deceased))
- 넣을 때: `'Deceased=한국어'`

### 22. Eternity (7회)

예문: 마코토의 죽음 뒤 라이덴 에이(影)는 새 번개의 신이 되었다. 가까운 동료들을 많이 잃고 마코토의 죽음과 '그것'을 목격한 두려움 속에서 **Eternity**에 집착해 현재의 이나즈마를 영원히 보존하려 했다. 켄리아의 운명을 보며 셀레스티아에 환멸을 느낀 그녀는 셀레스티아와 관계를 끊고 신의 심장을 야에 미코에게 맡겼다. 침식에 취약할까 두려워 자신을 닮은 자동인형을 만들 실험을 했고, 그 쇼군이 이나즈마를 대신 다스리는 동안 일심정토에서 명상하며 침식을 늦추려 했다. 쇼군을 만드는 과정에서 지금 스카라무슈라 불리는 인형도 만들었다.

- 들어간 이름에 자주 나온 한국어: **영원** 7개, **번개** 3개, **군도** 2개, **번째** 2개
- `Thunder and Eternity` = 번개와 영원 ([Thunder and Eternity](https://genshin-impact.fandom.com/wiki/Thunder_and_Eternity))
- `Realm of Tranquil Eternity` = 고요한 무망의 국가 ([Realm of Tranquil Eternity](https://genshin-impact.fandom.com/wiki/Realm_of_Tranquil_Eternity))
- `Memories: Guardian of Eternity` = 추억: 영원의 수호자 ([End of the Oneiric Euthymia](https://genshin-impact.fandom.com/wiki/End_of_the_Oneiric_Euthymia))
- `Radiant Metamorphosis: Eternity` = 형상·영원 ([Radiant Metamorphosis: Eternity](https://genshin-impact.fandom.com/wiki/Radiant_Metamorphosis%3A_Eternity))
- `"It's Only an Eternity of Servitude!"` = 「그건 단지 끝나지 않는 노역일 뿐이야!」 (["It's Only an Eternity of Servitude!"](https://genshin-impact.fandom.com/wiki/%22It's_Only_an_Eternity_of_Servitude!%22))
- `Immaculate Eternity and Threefold Transience` = 영원과 세 순간을 조종하는 정도의 능력 ([Immaculate Eternity and Threefold Transience](https://genshin-impact.fandom.com/wiki/Immaculate_Eternity_and_Threefold_Transience))
- … 외 4개 (`data/generated/ko-name-candidates.json`)
- 넣을 때: `'Eternity=한국어'`

### 25. Shogunate (7회)

예문: 여행자가 아를레키노에 대해 처음 듣는 곳은 이나즈마다. 그곳에서 레핀·슈나이제비치는 **쿠자비나의 지령**을 밀어붙이기 위해 와타츠미섬과 Shogunate 사이의 전쟁을 다시 일으키려 하면서도, 부하들에게는 그것이 아를레키노의 이익을 위한 일이라고 말한다. 그러나 작전이 시작되기 전에 Efim은 스네즈나야로 소환되고, 부하들은 그가 아를레키노의 분노를 샀기 때문이라고 추측한다. 계획은 여행자, 종말번대의 모모요, 우인단의 배신자 류다치카·슈나이제브나의 협력으로 해체된다. 아를레키노의 이름은 쿠자비나의 지령을 따르던 Efim의 계획, 그가 아를레키노의 분노를 샀다는 부하들의 추측, 계획의 해체가 겹치며 처음 알려진 셈이다.

- 들어간 이름에 자주 나온 한국어: **막부** 3개, **아시가루** 2개
- `Inazuma Shogunate` = 이나즈마 막부 ([Inazuma Shogunate](https://genshin-impact.fandom.com/wiki/Inazuma_Shogunate))
- `Shogunate Infantry` = 막부 아시가루 ([Shogunate Infantry](https://genshin-impact.fandom.com/wiki/Shogunate_Infantry))
- `Shogunate Infantry Captain` = 막부 아시가루 두목 ([Shogunate Infantry Captain](https://genshin-impact.fandom.com/wiki/Shogunate_Infantry_Captain))
- 넣을 때: `'Shogunate=한국어'`

### 27. Acting Grand Master (6회)

예문: 바르카는 원신의 플레이 가능한 캐릭터이자 **페보니우스 기사단의 Grand Master**이며 현재 **북풍의 기사**인 인물로, 고향 몬드로 돌아온 상태다. 여행자의 여정이 시작되기 반 년 전, 그는 페보니우스 기사단 인력의 80퍼센트를 이끌고 북쪽 원정에 나섰고, 진을 Acting Grand Master로 남겼다. 그가 북쪽에서 **심연의 움직임**을 견제하려 했던 점과, 돌아오지 못할 경우를 대비해 진에게 후임 구도를 맡긴 점은 이 원정이 몬드의 안전을 건 장기 대응이었음을 보여 준다.

- `Substitute Acting Grand Master Noelle` = 노엘의 대리업무 ([Substitute Acting Grand Master Noelle](https://genshin-impact.fandom.com/wiki/Substitute_Acting_Grand_Master_Noelle))
- 넣을 때: `'Acting Grand Master=한국어'`

### 28. Heart (6회)

예문: 에게리아는 나베리우스가 물의 용을 대신할 "원시 모태 바다의 Heart"로 만들었고, 레무스가 죽은 뒤 폰타인으로 데려와 물의 신이 되었다. 후계 포칼로스는 드문 예외로, 물의 정령으로서 타고난 물 능력을 Fontainian 인간이 되면서 포기했고, 신성을 분리한 육신에는 물 능력이 없어 그 점이 푸리나가 진짜 물의 신이 아니라는 법정의 증거가 되었다. 불의 신은 다른 집정관과 달리 필멸자라, 오르기 전의 능력은 사정이 분명하지 않다. 마비카는 불의 신이 되기 전 불 신의 눈을 가지고 있었고, 오늘날 신의 눈을 착용하지 않는 것을 보면 오른 뒤에는 더 이상 필요하지 않았다고 가정되며, 이 가정은 여행자가 신의 심장을 처음 들을 때 바르바토스가 설명해 준 내용으로 뒷받침된다. 신성을 뗀 몸에 물이 없었다는 점과, 오른 뒤 신의 눈이 필요 없어졌다는 가정을 겹치면, 원소 능력이 육신에 고정되어 있기만 한 것은 아닌 것으로 보인다.

- 들어간 이름에 자주 나온 한국어: **마음** 25개, **심장** 18개, **손길** 11개, **치유** 11개
- `Heart Sign` = 하트 ([Heart Sign](https://genshin-impact.fandom.com/wiki/Heart_Sign))
- `Ashen Heart` = 재가 된 심장 ([Ashen Heart](https://genshin-impact.fandom.com/wiki/Ashen_Heart))
- `Brave Heart` = 용사의 마음 ([Brave Heart](https://genshin-impact.fandom.com/wiki/Brave_Heart))
- `Super Heart!` = 슈퍼 하트 ([Super Heart!](https://genshin-impact.fandom.com/wiki/Super_Heart!))
- `Blazing Heart` = 이글거리는 마음 ([Blazing Heart](https://genshin-impact.fandom.com/wiki/Blazing_Heart))
- `Blazing Heart` = Blazing Heart ([Blazing Heart (Album)](https://genshin-impact.fandom.com/wiki/Blazing_Heart_(Album)))
- … 외 106개 (`data/generated/ko-name-candidates.json`)
- 넣을 때: `'Heart=한국어'`

### 31. Mother (6회)

예문: 벽난로의 집의 화롯불과 아이들의 순수한 미소는 사정을 모르는 이에게 평범하고 행복한 가족의 장면으로 보인다. 그러나 시계가 울리면 웃음은 사라지고 얼굴이 굳으며, 아를레키노가 차분히 이름을 부르자 아이들은 망설임 없이 한목소리로 아버지라고 답한다. 그녀는 이들을 모두 아이들로 여기며 쿠자비나보다 덜 엄격하게 운영하고, 아이들의 안녕이 위협받거나 조종당하면 분노한다. 아버지라는 호칭은 쿠자비나의 Mother와 대비되어 가짜 애정과 학대를 거부하는 뜻으로 암시된다. 쿠자비나와 달리 다른 범죄 조직을 표적으로 삼아 프레미네의 가족을 괴롭히던 대금업자들을 처단했고, 의지를 보인 배신자에게는 죽이는 대신 House에서의 정체를 지우는 고통스러운 기억 말소로 '처형'할 수 있었다. 따뜻한 식탁과 즉각적인 명령 체계가 겹쳐, 가족 같은 분위기가 임무 중심의 질서와 맞물려 있음을 보여준다.

- 들어간 이름에 자주 나온 한국어: **어머니** 2개
- `Muse's Mother` = 뮤즈의 어머니 ([Muse's Mother](https://genshin-impact.fandom.com/wiki/Muse's_Mother))
- `Mother of the Jinn` = 지니의 어머니 ([Mother of the Jinn](https://genshin-impact.fandom.com/wiki/Mother_of_the_Jinn))
- `Mother Flamegranate Tree` = 화염류탄 어미나무 ([Mother Flamegranate Tree](https://genshin-impact.fandom.com/wiki/Mother_Flamegranate_Tree))
- 넣을 때: `'Mother=한국어'`

### 33. Order (6회)

예문: 「뒤집힌 불결한 신상」 앞에서 여행자와 심연 사도가 충돌하자 쌍둥이 남매는 심연 포털로 나타나 사도를 구하고, 잠시의 재회에서 자신과 심연을 막지 말라 했다. 쌍둥이 남매는 데인슬레이프 출신의 진실과 함께, Order의 괴물이 저주로 변한 켄리아 사람이었음을 밝히고, 천리와의 전쟁이 끝난 뒤에야 함께 티바트를 떠나겠다고 했다. 여행자에게 여행을 이어 가며 일곱 신과 셀레스티아가 주재하는 세계의 참모습을 보기를 바란 뒤, 사도와 함께 포털로 떠났다. 데인슬레이프는 시점을 특정할 수 없는 어느 때 운명을 자기 손에 쥐려 했고, 심연이 티바트에 미치는 영향에, 특히 심연 교단이 뒤에 있을 때 끊임없이 맞선다. 함께 떠나자는 약속을 그 전쟁의 끝으로 미룬 것을 보면, 쌍둥이 남매는 재회보다 천리와의 싸움을 앞에 둔 셈이다.

- **같은 영어**: `Orders` = **명령서** ([Orders](https://genshin-impact.fandom.com/wiki/Orders))
- 들어간 이름에 자주 나온 한국어: **질서** 5개, **의** 3개, **주문** 3개, **명령** 2개
- `Abyss Order` = 심연 교단 ([Abyss Order](https://genshin-impact.fandom.com/wiki/Abyss_Order))
- `Fruity Order` = 질서 과일단 ([Fruity Order](https://genshin-impact.fandom.com/wiki/Fruity_Order))
- `Norma's Order` = 노르마가 주문한 음식 ([Norma's Order](https://genshin-impact.fandom.com/wiki/Norma's_Order))
- `Urgent Orders` = 긴급 주문 ([Urgent Orders](https://genshin-impact.fandom.com/wiki/Urgent_Orders))
- `Guide to Order` = 「질서」의 인도 ([Guide to Order](https://genshin-impact.fandom.com/wiki/Guide_to_Order))
- `Doctor's Orders` = 의사의 처방 ([Doctor's Orders](https://genshin-impact.fandom.com/wiki/Doctor's_Orders))
- … 외 17개 (`data/generated/ko-name-candidates.json`)
- 넣을 때: `'Order=한국어'`

### 34. Prodigal (6회)

예문: 수메르에서 우인단의 일은 상당수가 집행관 도토레의 계획이었다. 잔디크이자 박사이며 우인단 11집행관의 제2위였던 그는, 쿠사나리 데비를 위대한 룩카데바타의 후계로 인정하지 않는 수메르 아카데미아의 현자들과 손잡고 그를 새로운 지혜의 신으로 바꾸려 했다. 인공 신을 만들 수 있다는 점에 흥미를 둔 그는, 스카라무슈가 이미 가진 번개 신의 심장으로 실험을 열어 스카라무슈를 **「정기(正機)의 신」**, the Prodigal로 만들었으나 곧 패했고, 쿠사나리 데비가 수메르의 신으로 돌아왔다. 그 뒤 자신의 다른 분신을 모두 지우는 거래와 정보를 맞바꾸는 거래로, 번개 신의 심장과 풀 신의 심장을 얼음의 여왕을 위해 쿠사나리 데비에게서 회수했다. 바꾸려던 그 신과의 거래로 두 신의 심장을 거둔 셈이다.

- `Prodigal Son's Return` = 돌아온 탕자 ([Prodigal Son's Return](https://genshin-impact.fandom.com/wiki/Prodigal_Son's_Return))
- `Shouki no Kami, the Prodigal` = 「정기(正機)의 신」 ([Everlasting Lord of Arcane Wisdom](https://genshin-impact.fandom.com/wiki/Everlasting_Lord_of_Arcane_Wisdom))
- 넣을 때: `'Prodigal=한국어'`

### 36. Blizzard (5회)

예문: 페이몬은 나히다에게 "Reasoning Knows Not Time of Day, but Suspense Always Follows a Blizzard"라는 책을 들어본 적 있는지 물었다. 나히다는 모두가 그 책을 찾는다는 말을 듣고 흥미로워 새 사본을 구해 직접 읽었다고 했다. 나중에 여행자와 페이몬이 표시가 있는 판본을 묻자 그녀는 표시가 없는 한 권만 필요해 가지고 있지 않다고 답했다. 시뮬랑카에서 돌아온 방랑자를 만났을 때 그의 표정만으로 새 친구를 사귀었음을 알아차렸다는 일화도 있다. 모두가 책을 찾는 와중에도 수정 없는 한 권만 필요로 했다는 점은 그녀의 관심이 유행보다 읽는 일 자체에 놓여 있음을 보여주는 것으로 보인다.

- 들어간 이름에 자주 나온 한국어: **길잃** 2개, **눈보라** 2개, **속에서** 2개, **얼음바람** 2개
- `Blizzard Strayer` = 얼음바람 속에서 길잃은 용사 ([Blizzard Strayer](https://genshin-impact.fandom.com/wiki/Blizzard_Strayer))
- `Blizzard Blade Seki no To` = 삼중 서리 관문 ([Blizzard Blade Seki no To](https://genshin-impact.fandom.com/wiki/Blizzard_Blade_Seki_no_To))
- `Blizzard-Roaring Overture` = 눈보라 속 개막 ([Blizzard-Roaring Overture](https://genshin-impact.fandom.com/wiki/Blizzard-Roaring_Overture))
- `Blizzard, Branch, Blossom` = 얼음 가지와 눈꽃 ([Blizzard, Branch, Blossom](https://genshin-impact.fandom.com/wiki/Blizzard%2C_Branch%2C_Blossom))
- `Artifact Strongbox: Blizzard Strayer` = 신성한 상자: 얼음바람 속에서 길잃은 용사 ([Artifact Strongbox: Blizzard Strayer](https://genshin-impact.fandom.com/wiki/Artifact_Strongbox%3A_Blizzard_Strayer))
- `Her Palace Collapses Into the Blizzard` = 눈보라 속으로 추락하는 궁전 ([Her Palace Collapses Into the Blizzard](https://genshin-impact.fandom.com/wiki/Her_Palace_Collapses_Into_the_Blizzard))
- 넣을 때: `'Blizzard=한국어'`

### 37. Circle (5회)

예문: 달의 겉모습은 드래곤 활동으로 크게 바뀌었다. 달의 앞면 가운데 큰 부분을 감싸는 달의 바다인 달 바다는 드래곤 연구자 루살림이 수행한 실패한 Lunar Veil 계획의 결과이며, 우주에서 노란 분화구로 보이는 우기엔의 Circle은 드래곤 생명과학자 우기엔이 만든 생물원이다. 여기에 아이테르와 루미네의 Spaceship이 노드크라이에서 서리달 표면으로 옮겨졌다. 달 표면에는 실패한 실험의 흔적과 인공 구조가 함께 남은 모습이라고 볼 수 있다.

- 들어간 이름에 자주 나온 한국어: **권역** 4개, **우기엔** 4개
- `Full Circle` = 원만의 상 ([Fruit of Fulfillment](https://genshin-impact.fandom.com/wiki/Fruit_of_Fulfillment))
- `Vicious Circle` = 제3 영구기관 ([Vicious Circle](https://genshin-impact.fandom.com/wiki/Vicious_Circle))
- `Ungien's Circle` = 우기엔 권역 ([Ungien's Circle](https://genshin-impact.fandom.com/wiki/Ungien's_Circle))
- `Nuur Stone Circle` = 「누르 돌 유적」 ([Nuur Stone Circle](https://genshin-impact.fandom.com/wiki/Nuur_Stone_Circle))
- `Ungien's Circle: Power Engine` = 우기엔 권역·동력 엔진 ([Ungien's Circle: Power Engine](https://genshin-impact.fandom.com/wiki/Ungien's_Circle%3A_Power_Engine))
- `"Ungien's Circle, Ahead Four!"` = 우기엔 권역 최대 출력! (["Ungien's Circle, Ahead Four!"](https://genshin-impact.fandom.com/wiki/%22Ungien's_Circle%2C_Ahead_Four!%22))
- … 외 1개 (`data/generated/ko-name-candidates.json`)
- 넣을 때: `'Circle=한국어'`

### 38. Commander (5회)

예문: 카피타노는 개인명 스라인으로 불리는 **First of the Eleven Fatui Harbingers**이며, 켄리아에서 고위 기사이자 Commander로 복무했다. 켄리아의 몰락 뒤 로노바의 불멸의 저주를 받았고, 이후 스네즈나야에서 우인단에 합류해 강력한 힘과 청렴함으로 명망을 얻었다. 우인단 내에서는 **신에 필적하는 전투력**과 지휘 능력, 도덕적 성실성으로 높이 평가받으며 가장 강한 존재로 꼽힌다. 이 명성은 켄리아의 기사 경력과 우인단에서의 지휘 경험이 겹친 결과로 보인다.

- `Commanders and Wargames` = 장군감과 모의전 ([Commanders and Wargames](https://genshin-impact.fandom.com/wiki/Commanders_and_Wargames))
- 넣을 때: `'Commander=한국어'`

### 39. Death (5회)

예문: 니벨룽겐은 고대 용의 기술로 **세 달**를 만들어 티바트 바깥의 공간으로 띄웠다. 달들은 광계의 힘과 World of Teyvat, 이 세계의 근본 법칙인 Life, Death, Time, Space에 대해 니벨룽겐과 동등한 권능을 받았다. 그 법칙들은 지금 4대 집정관이 다스리며, 강림자만이 도전할 수 있다. 뒤에 Dragon Sovereigns와 용왕 니벨룽겐의 자리는 세 달의 여신이 이었다. 권능이 용왕과 동등한 채로 통치의 자리까지 이어진 것을 보면, 세 달은 용의 권능과 세계를 함께 맡도록 세워진 셈이다.

- 들어간 이름에 자주 나온 한국어: **죽음** 7개, **달** 2개, **춤** 2개
- `Death Moon` = 죽음의 달 ([Death Moon](https://genshin-impact.fandom.com/wiki/Death_Moon))
- `Death Proof` = 금강불괴 ([Death Proof](https://genshin-impact.fandom.com/wiki/Death_Proof))
- `Plume of Death` = 죽음의 깃털 ([Plume of Death](https://genshin-impact.fandom.com/wiki/Plume_of_Death))
- `Ruler of Death` = 죽음의 집정관 ([Ronova](https://genshin-impact.fandom.com/wiki/Ronova))
- `Boared to Death` = 10살 때 멧돼지를 잡을뻔했지 ([Boared to Death](https://genshin-impact.fandom.com/wiki/Boared_to_Death))
- `Fight for Death` = 「죽음」을 위한 전투 ([Fight for Death](https://genshin-impact.fandom.com/wiki/Fight_for_Death))
- … 외 9개 (`data/generated/ko-name-candidates.json`)
- 넣을 때: `'Death=한국어'`

### 40. Driyosh (5회)

예문: 4번 "「아를레키노」" 아를레키노는 페르엘라는 개인명으로 활동 중이며 벽난로의 집의 현재 수장이다. 벽난로의 집의 구성원들은 아를레키노를 "아버지"라 부르고, 그녀는 그들을 아이들이라 부른다. 같은 "「아를레키노」" 칭호의 쿠자비나는 사망 상태로 남아 있다. 5번 "수탉" 풀치넬라는 개인명 미르코·라도비도비치·벨레셰크로 활동 중이다. 6번 "산병" 스카라무슈는 쿠니쿠즈시라는 개인명과 사임·말소 상태를 지니며, 이전 정체를 세계수에서 지운 뒤 방랑하다 기억을 되찾아 현재 인론파의 Driyosh로 있다.

- `Paimon's "Driyosh" Way of Solving Problems` = 페이몬의 「드리요쉬」식 문제 해결법 ([Paimon's "Driyosh" Way of Solving Problems](https://genshin-impact.fandom.com/wiki/Paimon's_%22Driyosh%22_Way_of_Solving_Problems))
- 넣을 때: `'Driyosh=한국어'`

### 42. Feofan (5회)

예문: 도토레는 Acute Toxicity Test에서 다섯 명 중 한 명만 살아남게 했고, 그 생존자 스무 살 페오판·세르게예비치·벡셀이 훗날 판탈로네가 되었다. Feofan은 갱단에 누명을 쓰고 도토레에게 팔려 왔으며, 기록 공백과 훗날의 대화는 그가 말로 위기를 벗어나 부상 치료를 받았음을 암시한다. 판탈로네는 풀치넬라와 함께 도토레의 실험에 자금을 대고 실험적인 불사약을 받았으며, 도토레가 죽은 뒤에도 세그먼트들이 수백 년간 진료를 이어 갔다. 판탈로네의 흡연은 도토레를 불편하게 했다. 두 사람은 실험 대상과 연구자로 시작해 자금과 불사약으로 얽힌 협력자가 되었다고 볼 수 있다.

- `Feofan Sergeyevich Veksel` = 페오판·세르게예비치·벡셀 ([Pantalone](https://genshin-impact.fandom.com/wiki/Pantalone))
- 넣을 때: `'Feofan=한국어'`

### 43. Hat Guy (5회)

예문: 방랑자가 코어를 산드로네에게 넘긴 뒤 알베도와 두린, 여행자는 공식 계산이 끝날 때까지 그의 몸을 지켰다. 알베도와 두린은 계획대로 나샤 마을을 도토레의 부하들로부터 지켰고, 콜롬비나는 돌아왔으며 뒤이은 전투에서 도토레가 쓰러졌다. 도토레가 콜롬비나를 공격한 뒤 사라지자 방랑자는 또 속았다고 분해했고, 휘페르보레아에서 도토레가 '변수'로 환영의 인식을 왜곡해 **가짜 달**을 만들었음을 밝혀냈다. 방랑자는 경험으로 도토레의 수를 예측하겠다고 했고, 알베도는 Hat Guy를 전적으로 신뢰한다고 했다. 알베도는 두린, 바르카와 첫 League 회의에 참석했고, 두린이 바르카의 즉석 기사 서임 발언이 농담인지 묻자 스스로 알아보라고 했다. 그들은 바르카의 일을 마무리하기 위해 노드크라이에 더 머물기로 했다.

- **옛 판에만**: `Hat Guy` = **모자** ([Wanderer 2024-07-28 판](https://genshin-impact.fandom.com/wiki/Wanderer?oldid=1578347))
- `Tea Party Re-Invitation: Hat Guy` = 티타임 재초대·모자 ([Tea Party Re-Invitation: Hat Guy](https://genshin-impact.fandom.com/wiki/Tea_Party_Re-Invitation%3A_Hat_Guy))
- 넣을 때: `'Hat Guy=한국어'`

### 44. Hyposelenia (5회)

예문: 캐넌은 서리달이 황폐해진 뒤에도 살아남았으나 **Moon의 허영**에 갇혀 전쟁 동안의 일을 알지 못했다. 콜롬비나하이포셀레니아자리의 미래의 한 측면이 찾아오자 손위 자매들은 그 시대와 달들의 운명을 말하도록 그녀를 설득했고, 감옥 밖에서 살아남을 이는 캐넌뿐임을 알았다. 소넷은 콜롬비나를 캐넌과 아리아에게 데려가 캐넌을 서리달의 여신으로 소개하며, Hyposelenia의 힘이 캐넌의 힘과 닮지 않았느냐고 물었다.

- `Columbina Hyposelenia` = 콜롬비나·하이포셀레니아 ([Columbina/Storyline](https://genshin-impact.fandom.com/wiki/Columbina%2FStoryline))
- `Columbina Hyposelenia` = 콜롬비나하이포셀레니아자리 ([Columbina Hyposelenia](https://genshin-impact.fandom.com/wiki/Columbina_Hyposelenia))
- 넣을 때: `'Hyposelenia=한국어'`

### 45. Ninnin (5회)

예문: 달바라기 기간에 콜롬비나는 서리달에서 Ninnin과 마주쳤고, 이후 여행자와 Ninnin의 달바라기 계획 조사에 힘을 보탰다. 조사 중 원초의 통치자가 결국 천리에게 패배했기에 이곳이 더 이상 위협이 아니라는 사실과, 찾는 단말기가 Capture Station 안에 없고 우주로 튕겨 나갔을 수 있다는 단서가 나왔다. 달바라기 계획의 진짜 성격을 알아낸 뒤 콜롬비나는 자신의 힘으로 Ninnin이 임무를 완수하도록 도왔다. 장치를 활성화한 뒤 그녀는 여행자의 황금잔자리에서 여행자를 기다렸고, 여행자가 태어난 곳으로 돌아가기로 한다면 동행해 돕겠다는 약속을 맺었다.

- **같은 영어**: `Ninnin` = **닌키** ([Nin-Kiggia](https://genshin-impact.fandom.com/wiki/Nin-Kiggia))
- **옛 판에만**: `Ninnin` = **숯댕이** ([Eggie 2026-07-05 판](https://genshin-impact.fandom.com/wiki/Eggie?oldid=2124570))
- **옛 판에만**: `Ninnin` = **닌키는** ([Eggie 2026-07-02 판](https://genshin-impact.fandom.com/wiki/Eggie?oldid=2121503))
- 넣을 때: `'Ninnin=한국어'`

### 47. Scions (5회)

예문: 콜롬비나는 도토레의 젊어 보이는 외모를 지적해 당황하게 했고, 한때 쿠바키와 광계 프로젝트를 돕다가 그에게 해로운 의도가 있다고 느낀 뒤로는 피했다. 타르탈리아는 높은 서열에도 힘을 좀처럼 드러내지 않는 그녀를 경계했고, 방랑자는 그녀를 무감정하고 주변에 무관심한 존재로 보았으며 두 사람은 여행자에게 조심하라고 경고했다. 서리달 아이는 오래전 그녀를 Frost Moon Goddess의 환생으로 여겼지만, 콜롬비나는 그들이 감당할 수 없는 것을 요구했다고 느껴 우인단으로 떠났고, 나중에는 Scions가 변했다는 말을 듣고 감사를 표했다. 그러나 도토레 사건 뒤에는 다시 서리달 아이와 살기로 했다. 과거의 요구와 현재의 변화된 태도가 대비되며, 콜롬비나의 서리달 아이에 대한 감정이 일방적인 원망에 머물지 않았음을 보여준다.

- 들어간 이름에 자주 나온 한국어: **서리밤** 8개, **후예** 8개, **나무살이** 5개, **극북** 4개
- `Frostmoon Scions` = 서리달 아이 ([Frostmoon Scions](https://genshin-impact.fandom.com/wiki/Frostmoon_Scions))
- `Frostnight Scion` = 서리밤 후예 ([Frostnight Scion](https://genshin-impact.fandom.com/wiki/Frostnight_Scion))
- `Scions of the Canopy` = 나무살이 ([Scions of the Canopy](https://genshin-impact.fandom.com/wiki/Scions_of_the_Canopy))
- `"Scions of the Canopy"` = 「나무살이」 (["Scions of the Canopy"](https://genshin-impact.fandom.com/wiki/%22Scions_of_the_Canopy%22))
- `Crown of the Final Scion` = 막내의 왕관 ([Angelos' Heptades](https://genshin-impact.fandom.com/wiki/Angelos'_Heptades))
- `Scion of the Blazing Sun` = 뜨거운 태양의 후손 ([Scion of the Blazing Sun](https://genshin-impact.fandom.com/wiki/Scion_of_the_Blazing_Sun))
- … 외 14개 (`data/generated/ko-name-candidates.json`)
- 넣을 때: `'Scions=한국어'`

### 49. Time (5회)

예문: 니벨룽겐은 고대 용의 기술로 **세 달**를 만들어 티바트 바깥의 공간으로 띄웠다. 달들은 광계의 힘과 World of Teyvat, 이 세계의 근본 법칙인 Life, Death, Time, Space에 대해 니벨룽겐과 동등한 권능을 받았다. 그 법칙들은 지금 4대 집정관이 다스리며, 강림자만이 도전할 수 있다. 뒤에 Dragon Sovereigns와 용왕 니벨룽겐의 자리는 세 달의 여신이 이었다. 권능이 용왕과 동등한 채로 통치의 자리까지 이어진 것을 보면, 세 달은 용의 권능과 세계를 함께 맡도록 세워진 셈이다.

- 들어간 이름에 자주 나온 한국어: **시간** 41개, **과거** 6개, **시공** 5개, **찾아서** 5개
- `Tea Time` = 차 한 잔의 여유 ([Tea Time (Furina)](https://genshin-impact.fandom.com/wiki/Tea_Time_(Furina)))
- `Down Time` = 휴식 시간 ([Down Time](https://genshin-impact.fandom.com/wiki/Down_Time))
- `Time Off!` = 휴가 시간! ([Time Off!](https://genshin-impact.fandom.com/wiki/Time_Off!))
- `Answer Time` = 연구 마감 시간 ([Answer Time](https://genshin-impact.fandom.com/wiki/Answer_Time))
- `Bloom Times` = 영광의 꽃의 시간 ([Bloom Times](https://genshin-impact.fandom.com/wiki/Bloom_Times))
- `Coffee Time` = 「커피 타임」 ([Coffee Time](https://genshin-impact.fandom.com/wiki/Coffee_Time))
- … 외 102개 (`data/generated/ko-name-candidates.json`)
- 넣을 때: `'Time=한국어'`

### 54. Ancient Moon (4회)

예문: 도토레는 수메르 이후 영혼을 둘로 나누어 한쪽은 죽음을 통해 지맥으로 보내고 다른 쪽은 데이터로 올려 세계수에서 다시 하나가 되게 하는 실험을 구상했고, 시행착오 끝에 디지털화 기술을 완성했다. 나타에서 거짓 하늘이 목격되었다는 사실을 알게 된 뒤에는 노드크라이를 거쳐 나타로 잠입할 소규모 부하들을 보내 Ancient Moon 세그먼트들을 더 이해하려 했다. 달의 힘 실험설계국의 개관식에는 대부분의 집행관과 함께 참석한 것으로 보이며, 다른 이들이 스네즈나야로 돌아간 뒤에도 산드로네와 그곳에 남았다. 콜롬비나가 우인단을 떠나자 얼음의 여왕은 창백한 별의 칙령을 내려 콜롬비나를 반드시 되찾으라고 했고, 도토레는 그 명령을 수행하면서 세 달의 힘을 얻으려는 자기 목적도 함께 좇았다.

- `Ancient Moon Pearl` = 고대 달 에너지 구슬 ([Ancient Moon Pearl](https://genshin-impact.fandom.com/wiki/Ancient_Moon_Pearl))
- 넣을 때: `'Ancient Moon=한국어'`

### 55. Bureau (4회)

예문: 레리르가 패배한 뒤 아를레키노는 Bureau에서 산드로네와 차를 마시며 도토레의 행보를 물었다. 산드로네는 그가 인간과 교류하는 능력이 부족하다고 했지만, 최근에는 이례적으로 조용하다고도 인정했다. 아를레키노는 그가 어떤 실험 속에서 사라졌다면 세계에 큰 선물이겠지만 그럴 가능성은 낮다고 보았고, 그가 무언가 꾸미고 있을 것이라며 경계를 늦추지 말라고 조언했다. 그녀는 도토레를 불러들여 달라고 얼음의 여왕에게 요청하기도 했다.

- `Kuuvahki Experimental Design Bureau` = 달의 힘 실험설계국 ([Kuuvahki Experimental Design Bureau](https://genshin-impact.fandom.com/wiki/Kuuvahki_Experimental_Design_Bureau))
- `Snezhnaya Royal Railway Transport Bureau` = 스네즈나야 철도 운송국 ([Snezhnaya Royal Railway Transport Bureau](https://genshin-impact.fandom.com/wiki/Snezhnaya_Royal_Railway_Transport_Bureau))
- 넣을 때: `'Bureau=한국어'`

### 56. Efim (4회)

예문: 여행자가 아를레키노에 대해 처음 듣는 곳은 이나즈마다. 그곳에서 레핀·슈나이제비치는 **쿠자비나의 지령**을 밀어붙이기 위해 와타츠미섬과 Shogunate 사이의 전쟁을 다시 일으키려 하면서도, 부하들에게는 그것이 아를레키노의 이익을 위한 일이라고 말한다. 그러나 작전이 시작되기 전에 Efim은 스네즈나야로 소환되고, 부하들은 그가 아를레키노의 분노를 샀기 때문이라고 추측한다. 계획은 여행자, 종말번대의 모모요, 우인단의 배신자 류다치카·슈나이제브나의 협력으로 해체된다. 아를레키노의 이름은 쿠자비나의 지령을 따르던 Efim의 계획, 그가 아를레키노의 분노를 샀다는 부하들의 추측, 계획의 해체가 겹치며 처음 알려진 셈이다.

- `Efim Snezhevich` = 레핀·슈나이제비치 ([Efim Snezhevich](https://genshin-impact.fandom.com/wiki/Efim_Snezhevich))
- 넣을 때: `'Efim=한국어'`

### 57. Eleven Fatui (4회)

예문: 아나스타샤·표도로브나·스네즈나야는 수백 년에 걸쳐 피에로와 함께 티바트 각지의 강력한 인물들을 Eleven Fatui 집행관으로 모집했다. 그들의 도움으로 스네즈나야는 대륙에서 가장 군사·기술적으로 발전한 국가가 되었고, 그 힘으로 다른 나라들에 개입한다. **피에로와의 공동 모집**은 집행관 체제가 천리 타도 목표를 뒷받침하는 기반으로 보인다.

- `Eleven Fatui Harbingers` = 우인단 11집행관 ([Eleven Fatui Harbingers](https://genshin-impact.fandom.com/wiki/Eleven_Fatui_Harbingers))
- 넣을 때: `'Eleven Fatui=한국어'`

### 59. Fatuus (4회)

예문: 우인단은 스네즈나야에서 온 외교 사절이며, 본부는 그루포프에 있다. 같은 이름 아래 우인단 11집행관과 얼음의 여왕 본인이 이끄는 군사 분견대도 있다. 외교 사절과 군사 분견대가 한 이름 아래 겹친 셈이다. 구성원 한 명은 Fatuus라 부른다.

- `The Foolish Fatuus` = 속이는 자의 말로 ([The Foolish Fatuus](https://genshin-impact.fandom.com/wiki/The_Foolish_Fatuus))
- 넣을 때: `'Fatuus=한국어'`

### 60. Flamestrider (4회)

예문: 여행자가 나타에 오기 여러 해 전, 마비카는 성화에서 깨어나 계획을 전면으로 실행할 태세를 갖췄다. **불이 돌아온 밤의 순례**을 두 번째로 이긴 뒤 다시 불의 신이 되었고, 시틀라리와 실로닌을 비롯한 새 세대와도 알게 되었다. 시틀라리와 실로닌은 청사진을 가져와 그녀의 심연 대응에 용들의 설계도 일부를 쓰려 했으며, 둘이 힘을 합쳐 쓸 만한 **Flamestrider**를 만들었고, 그녀는 그것을 쓰는 일에 큰 자부심을 두었다. 심연을 향한 그 설계의 용도와 사용에 둔 자부심을 겹치면, Flamestrider는 계획에 딸린 전력으로 준비된 것으로 보인다.

- 들어간 이름에 자주 나온 한국어: **바이크** 3개
- `Flamestrider: Blazing Trail` = 바이크·도하 ([Flamestrider: Blazing Trail](https://genshin-impact.fandom.com/wiki/Flamestrider%3A_Blazing_Trail))
- `Flamestrider: Full Throttle` = 바이크·질주 ([Flamestrider: Full Throttle](https://genshin-impact.fandom.com/wiki/Flamestrider%3A_Full_Throttle))
- `Flamestrider: Soaring Ascent` = 바이크·도약 ([Flamestrider: Soaring Ascent](https://genshin-impact.fandom.com/wiki/Flamestrider%3A_Soaring_Ascent))
- 넣을 때: `'Flamestrider=한국어'`

### 61. Fourth (4회)

예문: 아를레키노는 원신의 플레이 가능 캐릭터이며, **「아를레키노」**라는 코드네임으로도 알려져 있다. 그녀의 개인명은 페르엘이고, **우인단 11집행관**의 Fourth이자 벽난로의 집의 현재 수장이다. 벽난로의 집의 구성원들은 그녀를 아버지라 부르며, 그녀는 구성원들을 자신의 아이들이라 칭한다. 그녀가 「아를레키노」 칭호의 현재 보유자이면서 Fourth 집행관이자 House의 수장이라는 점은, 그 칭호가 우인단 서열과 House 지도자 위치를 함께 표시하는 이름이라고 볼 수 있게 한다. 구성원들을 아이들이라 부르고 그들이 그녀를 아버지라 부르는 호칭 구조는 House 내부의 관계를 가족의 언어로 정리하는 방식이라고 볼 수 있다.

- `Wen the Fourth` = 문사야 ([Wen the Fourth](https://genshin-impact.fandom.com/wiki/Wen_the_Fourth))
- 넣을 때: `'Fourth=한국어'`

### 62. Frost Fall (4회)

예문: 카리베르트의 의식은 데인슬레이프가 「경작기」의 눈을 이미 넘긴 것으로 믿게 했고, 데인슬레이프와 여행자는 폐허에서 그것을 확인하러 갔다. 여행자의 쌍둥이 남매와 심연 사도: Frost Fall이 매복해 지맥을 건드렸고, 데인슬레이프는 여행자를 떠나보낸 뒤 싸움에서 부상을 입었다.

- `Abyss Herald: Frost Fall` = 심연 사도·서리 내림 ([Abyss Herald: Frost Fall](https://genshin-impact.fandom.com/wiki/Abyss_Herald%3A_Frost_Fall))
- 넣을 때: `'Frost Fall=한국어'`

### 63. Life (4회)

예문: 니벨룽겐은 고대 용의 기술로 **세 달**를 만들어 티바트 바깥의 공간으로 띄웠다. 달들은 광계의 힘과 World of Teyvat, 이 세계의 근본 법칙인 Life, Death, Time, Space에 대해 니벨룽겐과 동등한 권능을 받았다. 그 법칙들은 지금 4대 집정관이 다스리며, 강림자만이 도전할 수 있다. 뒤에 Dragon Sovereigns와 용왕 니벨룽겐의 자리는 세 달의 여신이 이었다. 권능이 용왕과 동등한 채로 통치의 자리까지 이어진 것을 보면, 세 달은 용의 권능과 세계를 함께 맡도록 세워진 셈이다.

- 들어간 이름에 자주 나온 한국어: **삶** 18개, **생명** 18개, **메로피드** 13개, **흐르** 4개
- `Life Stream` = 생명의 나선 ([Life Stream](https://genshin-impact.fandom.com/wiki/Life_Stream))
- `Second Life` = 영발 상점 ([Second Life](https://genshin-impact.fandom.com/wiki/Second_Life))
- `Art and Life` = 예술과 삶 ([Art and Life](https://genshin-impact.fandom.com/wiki/Art_and_Life))
- `Bond of Life` = 「생명의 계약」 ([Bond of Life](https://genshin-impact.fandom.com/wiki/Bond_of_Life))
- `Song of Life` = 중생의 노래 ([Song of Life](https://genshin-impact.fandom.com/wiki/Song_of_Life))
- `Flame of Life` = 생명의 불빛 ([Flame of Life](https://genshin-impact.fandom.com/wiki/Flame_of_Life))
- … 외 62개 (`data/generated/ko-name-candidates.json`)
- 넣을 때: `'Life=한국어'`

### 66. Marionette Guillotin (4회)

예문: 7번 "산드로네" 산드로네는 Marionette Guillotin이라는 개인명으로 활동 중이며 모험가 길드의 수장이다. 그녀는 Fontainian 인형이자 연구자로 캐서린의 창조자이며, 최신 개인 창조물 파지오를 동반한다. 8번 "숙녀" 시뇨라는 로잘린 크루즈카 로헤팔터라는 개인명으로 사망 상태이고, 전투와 외교 모두에서 큰 힘을 지닌 8번째 집행관으로 기록된다. 9번 "거상" 판탈로네는 페오판·세르게예비치·벡셀이라는 개인명으로 활동 중이며 북국 은행의 책임자로서 스네즈나야의 재정을 맡는다. 10번째 자리는 암호명, 개인명, 상태가 모두 미상이고, 11번 "귀공자" 타르탈리아는 아약스라는 개인명으로 활동 중이다. 7번의 길드, 8번의 전투·외교, 9번의 금융이라는 서로 다른 면모는 집행관들이 각자의 영역에서 조직의 얼굴을 이루고 있음을 보여 주는 셈이다.

- **같은 영어**: `Marionette Guillotin` = **작은 마리안·기요틴** ([Sandrone/Storyline](https://genshin-impact.fandom.com/wiki/Sandrone%2FStoryline))
- **옛 판에만**: `Marionette Guillotin` = **마리안·기요틴** ([Sandrone/Storyline 2026-07-01 판](https://genshin-impact.fandom.com/wiki/Sandrone%2FStoryline?oldid=2118477))
- 넣을 때: `'Marionette Guillotin=한국어'`

### 67. Miko (4회)

예문: 큰 재앙 이후 앨리스는 수메르에서 폰타인을 떠난 물의 정령 이디이아를 만나, 모두에게서 떠나고 싶다는 소원을 들어 주어 사막으로 보내고 유리빛 신기루 비경을 맡겼다. 이나즈마에서는 야에 미코를 "꼬마"라고 부르고 Miko를 울린 일을 쉽게 했다고 적었으며, 아사세 히비키와 「네코」를 별명으로 부른 것은 500년 전 재앙 이후 이나즈마 여행을 나타낸다. 앨리스는 도리의 첫 공급자가 되었고, 도리는 앨리스를 높이 평가하며 모라를 돌려보낼 때 놀랄 만큼 후하며, 앨리스도 도리의 단편 모음을 낭독하고 "저명한 Sangemah Bay 군주에게 물품을 공급하는 자"라는 칭호를 붙였다.

- 들어간 이름에 자주 나온 한국어: **야에** 4개, **미코** 3개
- `Yae Miko` = 야에 미코 ([Yae Miko](https://genshin-impact.fandom.com/wiki/Yae_Miko))
- `Clues For Yae Miko` = 야에 미코에게 줄 단서 ([Clues For Yae Miko](https://genshin-impact.fandom.com/wiki/Clues_For_Yae_Miko))
- `Invitation From Miko` = 미코가 보낸 초대장 ([Invitation From Miko](https://genshin-impact.fandom.com/wiki/Invitation_From_Miko))
- `Yae Miko: Good Fortune` = 야에 미코·행운 ([Yae Miko: Good Fortune](https://genshin-impact.fandom.com/wiki/Yae_Miko%3A_Good_Fortune))
- `Yae Miko: Kitsune Dreaming` = 야에 미코·여우의 꿈 ([Yae Miko: Kitsune Dreaming](https://genshin-impact.fandom.com/wiki/Yae_Miko%3A_Kitsune_Dreaming))
- 넣을 때: `'Miko=한국어'`

### 68. Mother' (4회)

예문: 보레아스는 본래 스네즈나야의 늑대 무리를 이끄는 **평범한 늑대**였다. 어느 날 보레아스와 무리는 암스바르트니르 호수로 가서 코이타르를 만났다. 코이타르는 여러 날을 함께 보내며 보레아스를 아끼게 된 뒤 그에게 이름을 주었다. 코이타르가 보레아스와 계속 접촉한 일은 알 수 없는 원인으로 그에게 말할 수 있는 능력과 지혜를 주었고, 의도치 않게 그를 마신으로 만드는 힘까지 주는 축복이 되었다. 그 축복 때문에 보레아스는 코이타르를 'Mother'라고 불렀다. 이후 보레아스는 자신의 무리와 함께 남쪽으로 향하기로 결정하고 코이타르와 작별했다.

- `A Mother's Last Wish` = 엄마의 염원 ([A Mother's Last Wish](https://genshin-impact.fandom.com/wiki/A_Mother's_Last_Wish))
- 넣을 때: `'Mother'=한국어'`

### 70. New Moon (4회)

예문: 달빛의 **한 줄기**만으로도 달의 소녀이자 New Moon의 여신 쿠타르인 콜롬비나의 건강과 힘을 크게 되돌렸다. 이 권능으로 과거의 일을 볼 수 있고, 달의 여신이 다루면 효과가 커진다. 현재 자연히 생겨난 것으로 알려진 달의 정수는 아리아의 유해에서 온 것과 심연에 오염된 무지개의 달의 여신 소넷의 유해에서 온 것 둘이고, 서리달에는 살아있는 여신 콜롬비나가 주재하므로 골수가 없다. 조수를 일으키던 쿠우바키가 죽은 뒤 이런 달빛으로 남았다고 볼 수 있다.

- 들어간 이름에 자주 나온 한국어: **달** 3개, **새로운** 3개
- `Law of the New Moon` = 새로운 달의 법칙 ([Law of the New Moon](https://genshin-impact.fandom.com/wiki/Law_of_the_New_Moon))
- `Idol of the New Moon` = 새로운 달의 조각상 ([Idol of the New Moon](https://genshin-impact.fandom.com/wiki/Idol_of_the_New_Moon))
- `Statue of the New Moon` = 신월 신상 ([Statue of the New Moon](https://genshin-impact.fandom.com/wiki/Statue_of_the_New_Moon))
- `When the New Moon Returns` = 새로운 달의 재림 ([When the New Moon Returns](https://genshin-impact.fandom.com/wiki/When_the_New_Moon_Returns))
- `Blessing of the Welkin Moon - New Moon` = 공월 축복·초승달 ([Blessing of the Welkin Moon - New Moon](https://genshin-impact.fandom.com/wiki/Blessing_of_the_Welkin_Moon_-_New_Moon))
- 넣을 때: `'New Moon=한국어'`

### 71. Pilgrimage (4회)

예문: 유머 감각에 대해서는 어떤 기록도 다룬 적이 없다며, 예상보다 그를 더 모른다고 말하는 편이 낫다고 했다. 로노바가 그에게 준 생명력을 가져가 달라는 청은 거절했다. **죽은 자는 죽은 자로** 남아 충돌을 피해야 한다고 보았기 때문이다. 방문을 맺으며 Flamestrider에 그를 태워 나라 곳곳을 돌았고, 다른 이들과 승리의 연회에서 합류했다. 전통에 따르면 마지막 Pilgrimage를 마친 가장 뛰어난 전사들을 위해 축하 의식을 연다고도 말했다.

- 들어간 이름에 자주 나온 한국어: **순례** 7개
- `A New Pilgrimage` = 새로운 순례 ([A New Pilgrimage](https://genshin-impact.fandom.com/wiki/A_New_Pilgrimage))
- `Pilgrimage of Flame` = 「불길의 순례」 ([Pilgrimage of Flame](https://genshin-impact.fandom.com/wiki/Pilgrimage_of_Flame))
- `Her Pilgrimage of Bleak` = 황녀의 환상 이야기 ([Her Pilgrimage of Bleak](https://genshin-impact.fandom.com/wiki/Her_Pilgrimage_of_Bleak))
- `Aisa Utamakura Pilgrimage` = 시가 깃든 아이사 순례 ([Aisa Utamakura Pilgrimage](https://genshin-impact.fandom.com/wiki/Aisa_Utamakura_Pilgrimage))
- `Pilgrimage to the Sacred Gorge` = 순례 협곡 ([Pilgrimage to the Sacred Gorge](https://genshin-impact.fandom.com/wiki/Pilgrimage_to_the_Sacred_Gorge))
- `Pilgrimage by the Hammer's Blow` = 「단조의 순례」 ([Pilgrimage by the Hammer's Blow](https://genshin-impact.fandom.com/wiki/Pilgrimage_by_the_Hammer's_Blow))
- … 외 2개 (`data/generated/ko-name-candidates.json`)
- 넣을 때: `'Pilgrimage=한국어'`

### 72. Pylons (4회)

예문: 올로룬이 계속 살고 싶다는 새 뜻을 품은 뒤 또 한 명의 영웅으로 발견되자, 심연은 그가 아직 찾지 못한 두 영웅 중 하나임을 알아차리고 공격 빈도를 높였다. 곧 나라 전체에 전면 침공이 벌어졌고, 영웅이 아직 발견되지 않은 꽃깃회에서 특히 거세졌다. 침공은 처음에는 발판을 잡기 어려워 보였으나, 그소요토스라고도 불리는 **Heart of the Abyss**가 나타나 Abyssal Tumors와 Pylons로 더 위험한 괴물을 떨어뜨리면서 나라 곳곳의 방어를 서서히 압도하기 시작했다.

- `Pylon of the Sojourning Sun Temple` = 순환하는 태양의 파일론 ([Pylon of the Sojourning Sun Temple](https://genshin-impact.fandom.com/wiki/Pylon_of_the_Sojourning_Sun_Temple))
- 넣을 때: `'Pylons=한국어'`

### 75. Sinner' (4회)

예문: 대재앙 후 어느 시점, 여행자의 쌍둥이 남매와 클로타르는 미지의 「성소」에서 사슬에 감긴 채 떠 있는 결정 형태의 베드르폴니르를 발견했다. 그 결정은 주변의 지성 있는 생명체가 자신을 숭배하도록 만드는 힘을 지녔고, 클로타르와 일부 츄츄족은 그 영향을 받았지만 쌍둥이 남매의 경험을 되살리는 중인 여행자와 어쩌면 쌍둥이 남매는 예외였다. 베드르폴니르는 그들을 '친애하는 피조물'라고 부르며 자신은 신이 아니라 'Sinner'인데 왜 절하는지 물었고, 그들의 운명을 잘 안다며 '초월자'가 되라고 권했다. 그는 클로타르에게 심연의 힘을 불어넣어 악화된 상태를 완화했고, 이후 클로타르는 카리베르트의 지성과 말을 되찾았다. 나중에 같은 장소로 돌아왔을 때 사슬에 묶인 물체와 츄츄족 숭배자들, 베드르폴니르의 목소리는 사라져 있었지만, 클로타르는 그 힘이 여전히 자신의 정신과 몸에 흐른다고 느껴 모든 것이 환영도 꿈도 아니었다고 확신했다.

- `Sinner's Descent` = 죄인 강림 ([Sinner's Descent](https://genshin-impact.fandom.com/wiki/Sinner's_Descent))
- 넣을 때: `'Sinner'=한국어'`

### 76. Sovereign (4회)

예문: 천리는 “후에 온 자”와 함께 사렐라이넨의 시신으로 일곱 신의 심장을 만들어 “새로운 질서”의 일부로 삼았고, 신의 심장은 티바트에 대한 천리의 지배를 상징했다. 산드로네는 이것이 집정관 체제를 공고히 하려는 수단이었다고 말했다. 신의 심장을 얻으려는 신들은 서로 싸웠고, 일곱 승자가 각각 원소 신의 심장 하나를 가지게 되었다. 신의 심장을 가진 자에게는 셀레스티아의 일곱 신좌 중 하나를 차지할 권리와 함께 집정관의 지위, 해당 원소에 대한 Sovereign의 권능이 주어졌다. 약해진 천리가 신의 심장을 “새로운 질서”의 상징으로 삼고 집정관 체제를 공고히 하려 한 점에서, 신의 심장은 힘의 도구를 넘어 통치 질서를 다시 세우는 장치였던 셈이다.

- `Seven Sovereigns` = 일곱 왕 ([Seven Sovereigns](https://genshin-impact.fandom.com/wiki/Seven_Sovereigns))
- `Thirteen Sovereign Lords` = 13명의 지고한 영주 ([Thirteen Sovereign Lords](https://genshin-impact.fandom.com/wiki/Thirteen_Sovereign_Lords))
- 넣을 때: `'Sovereign=한국어'`

### 77. Space (4회)

예문: 니벨룽겐은 고대 용의 기술로 **세 달**를 만들어 티바트 바깥의 공간으로 띄웠다. 달들은 광계의 힘과 World of Teyvat, 이 세계의 근본 법칙인 Life, Death, Time, Space에 대해 니벨룽겐과 동등한 권능을 받았다. 그 법칙들은 지금 4대 집정관이 다스리며, 강림자만이 도전할 수 있다. 뒤에 Dragon Sovereigns와 용왕 니벨룽겐의 자리는 세 달의 여신이 이었다. 권능이 용왕과 동등한 채로 통치의 자리까지 이어진 것을 보면, 세 달은 용의 권능과 세계를 함께 맡도록 세워진 셈이다.

- 들어간 이름에 자주 나온 한국어: **외경** 20개, **반석** 14개, **공간** 6개, **시공** 4개
- `Ruler of Space` = 공간의 집정관 ([Asmoday](https://genshin-impact.fandom.com/wiki/Asmoday))
- `Temple of Space` = 공간의 신전 ([Temple of Space](https://genshin-impact.fandom.com/wiki/Temple_of_Space))
- `Frost-Worn Space` = 얼음 서리에 침식된 곳 ([Frost-Worn Space](https://genshin-impact.fandom.com/wiki/Frost-Worn_Space))
- `Space Force Cadet` = 우주 사관생도 ([Space Force Cadet](https://genshin-impact.fandom.com/wiki/Space_Force_Cadet))
- `Sub-Space Creation` = 외경 ([Sub-Space Creation](https://genshin-impact.fandom.com/wiki/Sub-Space_Creation))
- `Sub-Space Waypoint` = 외경 워프 포인트 ([Sub-Space Waypoint](https://genshin-impact.fandom.com/wiki/Sub-Space_Waypoint))
- … 외 32개 (`data/generated/ko-name-candidates.json`)
- 넣을 때: `'Space=한국어'`

### 81. Active (3회)

예문: 우인단 11집행관 명단에는 아를레키노가 4번, 「아를레키노」, 페르엘, Active로 기록되어 있다. 같은 명단에서 쿠자비나는 등수 미상의 「아를레키노」로, Deceased로 적혀 있다. 아를레키노가 「아를레키노」 칭호의 현재 보유자라는 점과 맞물려, 이 명단은 그 칭호가 쿠자비나에게서 아를레키노에게 이어진 것임을 보여주는 대목이라고 볼 수 있다. 이처럼 아를레키노는 House의 수장이면서 집행관 서열 Fourth로, House와 우인단 양쪽에서 「아를레키노」라는 이름 아래 놓인 인물인 셈이다.

- `Active Camouflage` = 열광학 미채 ([Active Camouflage](https://genshin-impact.fandom.com/wiki/Active_Camouflage))
- `"Active Odor Imitating Bait"` = 「능동형 냄새 모방 미끼」 (["Active Odor Imitating Bait"](https://genshin-impact.fandom.com/wiki/%22Active_Odor_Imitating_Bait%22))
- 넣을 때: `'Active=한국어'`

### 84. Bed (3회)

예문: 리월에서 대재앙으로 큰 피해를 입은 **층암거연**에서는 몬스터들이 쏟아져 나왔고, 이에 모락스는 천암군을 보내 방어와 광부 대피를 맡겼다. 업보로 미쳐 리월 방어의 의무를 버렸던 부사는 피비린내에 이끌려 돌아와 천암군과 함께 싸웠다. 부사와 퇴마사 백양, 그리고 선봉을 자처한 일부 천암군은 몬스터들을 심연의 힘을 무효화하는 의문의 지하 궁전으로 유인한 뒤 「태위 나침반」으로 층암거연의 Bed에 봉인하고 그곳에서 죽었다. 사상자 기록은 부사가 층암거연의 Bed를 봉인한 뒤 죽었다고 전하고, 백양의 이름도 함께 남긴다. 리월은 이 싸움에서 이겼지만 많은 목숨을 잃었다.

- 들어간 이름에 자주 나온 한국어: **침대** 9개, **화단** 5개, **고요한** 3개, **나무** 3개
- `Cloudy Haze Bed` = 안개 노을의 꿈 침대 ([Cloudy Haze Bed](https://genshin-impact.fandom.com/wiki/Cloudy_Haze_Bed))
- `Simple Care Bed` = 의료용 간이 간호 침대 ([Simple Care Bed](https://genshin-impact.fandom.com/wiki/Simple_Care_Bed))
- `The Chasm's Bed` = 거연 심층 ([The Chasm's Bed](https://genshin-impact.fandom.com/wiki/The_Chasm's_Bed))
- `Breeze-Blessed Bed` = 바람의 가호를 받는 침대 ([Breeze-Blessed Bed](https://genshin-impact.fandom.com/wiki/Breeze-Blessed_Bed))
- `Procrustes' Iron Bed` = 프로크루스테스의 침실 ([Procrustes' Iron Bed](https://genshin-impact.fandom.com/wiki/Procrustes'_Iron_Bed))
- `Brightwood "Concord" Bed` = 빛나는 나무 「안정」 침대 ([Brightwood "Concord" Bed](https://genshin-impact.fandom.com/wiki/Brightwood_%22Concord%22_Bed))
- … 외 12개 (`data/generated/ko-name-candidates.json`)
- 넣을 때: `'Bed=한국어'`

### 85. Chiyo (3회)

예문: 심연과 연이 있어도 심연 교단과 반드시 연결되었다고는 할 수 없는 존재들이 있다. **켄리아의 「오대 죄인」**는 심연의 모든 것을 아우르는 힘을 빼앗아 나누어 가졌다. 라인도티르, "황금"는 수계 늑대 무리와 두린처럼 심연에 붙은 생명을 만들어 냈고, 수르트알로기, "극악 기사"은 스커크에게 그 힘을 다루는 법을 가르쳤으며, 베드르폴니르, "예언가"는 클로타르가 조직을 세우도록 이끌었다. Chiyo를 타락시킨 "죄의 짐승"도 이 갈래에 이름을 올린다. 힘을 나누고, 생명을 만들고, 법을 전하고, 조직의 출발을 이끈 일이 심연에는 닿아도 심연 교단과 반드시 한 줄로 이어지지는 않는 것으로 보인다.

- `Mikoshi Chiyo` = 미코시 치요 ([Mikoshi Chiyo](https://genshin-impact.fandom.com/wiki/Mikoshi_Chiyo))
- 넣을 때: `'Chiyo=한국어'`

### 86. Curatorium (3회)

예문: 네페르는 데인슬레이프의 의뢰로 레리르가 왜 죄인이 되었는지 밝히려 했고, 레리르의 심장을 이용해 라우마, 야호다와 함께 Curatorium의 봉인된 방에서 의식을 열어 **레리르의 기억 탐사**를 시작했다. 기억 탐사 중 솔린디스와 올로그의 기억이 나오자 네페르는 레리르가 그 자리에 없었는데도 어떻게 그 사건을 알았는지 의아해했다. 레리르는 네페르가 자신의 과거를 들여다본 데 격노해 네페르를 네페르 자신의 과거 환상에 가두었고, 네페르는 도리에게서 빌린 앨리스의 아뮬렛으로 레리르가 네페르를 죽이려는 것을 막았으며, 데인슬레이프가 자신의 힘으로 일행을 현실로 데려갔다. 현실로 돌아온 뒤 요란하게 흔들리는 체스 상자에 레리르를 봉인했고, 이 봉인이 버틸 수 있는 기간을 이틀 정도로 예상했다.

- 들어간 이름에 자주 나온 한국어: **비밀** 3개, **집** 3개
- `Curatorium of Secrets` = 비밀의 집 ([Curatorium of Secrets (Point of Interest)](https://genshin-impact.fandom.com/wiki/Curatorium_of_Secrets_(Point_of_Interest)))
- `Medicine from the Curatorium of Secrets` = 「비밀의 집」이 제공한 약 ([Medicine from the Curatorium of Secrets](https://genshin-impact.fandom.com/wiki/Medicine_from_the_Curatorium_of_Secrets))
- `A Commission From the Curatorium of Secrets` = 비밀의 집 의뢰 ([A Commission From the Curatorium of Secrets](https://genshin-impact.fandom.com/wiki/A_Commission_From_the_Curatorium_of_Secrets))
- 넣을 때: `'Curatorium=한국어'`

### 91. Deshret (3회)

예문: 시간이 지나며, 일부는 아카데미아의 잘못된 정보 운동 때문에, 수메르 사람들은 위대한 룩카데바타와 적왕 사이의 진짜 역사를 잊었다. 어떤 이들은 둘의 전투가 수메르의 사막을 만들었다고 믿고, Deshret의 광신적 추종자들은 그녀가 그를 배신하고 집정관의 자리를 차지한 배신자로 본다. 이렇게 뒤틀린 진실 덕에 현자들은 숲의 백성과 도금 여단을 서로 맞세워 정보를 단단히 틀어쥐고, 막후에서 양쪽을 움직이기 쉬워졌다. 라흐만은 위대한 룩카데바타의 백성을 아카데미아의 말처럼 보며 그들의 말을 들을 이유가 없다고 하고, 적왕의 죽음과 문명의 거의 전면적인 파멸이 모두 그녀의 짓이라고 말한다. 사이노는 전임 풀의 신과 적왕이 적이었던 적이 없다고 말한다. 사막을 만든 전투라는 믿음, 라흐만의 책임 추궁, 적이 아니었다는 확인이 한 과거 위에 같이 있으므로, 왜곡된 적대와 그 반대의 관계가 나란히 남아 있는 셈이다.

- 들어간 이름에 자주 나온 한국어: **적왕** 4개, **무덤** 2개
- `King Deshret` = 적왕 ([King Deshret](https://genshin-impact.fandom.com/wiki/King_Deshret))
- `Eye of Deshret` = Eye of Deshret ([Eye of Deshret](https://genshin-impact.fandom.com/wiki/Eye_of_Deshret))
- `The Mausoleum of King Deshret` = 적왕의 무덤 ([The Mausoleum of King Deshret](https://genshin-impact.fandom.com/wiki/The_Mausoleum_of_King_Deshret))
- `King Deshret and the Three Magi` = 적토의 왕과 세 순례자 ([King Deshret and the Three Magi](https://genshin-impact.fandom.com/wiki/King_Deshret_and_the_Three_Magi))
- `Gurabad's Ruin &ndash; Temple of Deshret` = 구라바드 폐허·적왕 신전 ([Gurabad's Ruin - Temple of Deshret](https://genshin-impact.fandom.com/wiki/Gurabad's_Ruin_-_Temple_of_Deshret))
- `Activation Device: The Mausoleum of King Deshret` = 활성화 부품·「적왕의 무덤」 ([Activation Device: The Mausoleum of King Deshret](https://genshin-impact.fandom.com/wiki/Activation_Device%3A_The_Mausoleum_of_King_Deshret))
- 넣을 때: `'Deshret=한국어'`

### 93. Durin (3회)

예문: 몬드 밖에서 'Durin의 Story'를 묻는 이들에게 과거의 현지인 대부분은, 악한 용 두린이 몬스터의 물결 속에서 내려와 드발린과 하늘을 가로질러 싸우고 몬드에 이루 말할 수 없는 재앙을 불러온 뒤 눈산에 떨어진 **비극**을 들려주었다. 이 이야기에서 두린은 몬드에 재앙을 가져온 존재로 기억되고, 그의 종말은 눈산에 떨어진 일로 남아 있다. 이렇게 회자되는 비극은 드래곤 스파인의 두린이 지닌 두려운 평판과 맞닿아 있다고 볼 수 있다.

- **같은 영어**: `Durin` = **두린** ([Durin (NPC)](https://genshin-impact.fandom.com/wiki/Durin_(NPC)))
- 들어간 이름에 자주 나온 한국어: **두린** 6개, **이야기** 2개
- `Mini Durin` = 꼬마 두린 ([Durin](https://genshin-impact.fandom.com/wiki/Durin))
- `Tale of "Durin"` = 「두린」 이야기 ([Tale of "Durin"](https://genshin-impact.fandom.com/wiki/Tale_of_%22Durin%22))
- `Durin: Book Haul` = 두린·책 구매 ([Durin: Book Haul](https://genshin-impact.fandom.com/wiki/Durin%3A_Book_Haul))
- `Durin: Radiant Heart` = 두린·빛나는 심장 ([Durin: Radiant Heart](https://genshin-impact.fandom.com/wiki/Durin%3A_Radiant_Heart))
- `Durin: Time to Learn` = 두린·공부 시간 ([Durin: Time to Learn](https://genshin-impact.fandom.com/wiki/Durin%3A_Time_to_Learn))
- `Durin: Toward the Distant Horizon` = 두린·저편의 이야기 ([Durin: Toward the Distant Horizon](https://genshin-impact.fandom.com/wiki/Durin%3A_Toward_the_Distant_Horizon))
- 넣을 때: `'Durin=한국어'`

### 95. Eternal (3회)

예문: 도토레가 서리달과 동일한 고유 신호를 지닌 미끼로 콜롬비나의 귀환을 가로챘을 때, 그녀는 달의 문을 열어 스스로 Moon의 허영으로 들어가 세 달의 권능을 그에게 넘기지 않으려 했다. 그 결과 도토레는 두 달의 정수만으로는 힘을 제어하지 못해 거짓된 달의 연구소로 물러났다. 도토레는 두 달의 정수와 콜롬비나의 힘을 대신할 Artificial Moon Marrow를 합쳐 False Moon God이 되었지만, 서리달의 귀환과 함께 콜롬비나가 티바트의 유일한 **세 달의 여신**로 완전히 다시 태어나자 여행자와 여러 세력의 도움으로 그를 물리쳤다. 여행자와 콜롬비나의 결정적 공격으로 Eternal과 무지개의 달 달의 정수가 도토레가 만든 장치에서 떨어져 나왔다. 도토레는 Artificial Moon Marrow로 버티려 했으나, 콜롬비나의 달빛 줄기에 그것이 산산조각나고 그도 태워졌다. 달의 문을 여는 데 온 힘이 들었다는 점과 그 문을 통해 스스로 권능을 포기하는 듯한 선택을 했다는 점을 함께 보면, 그 행동은 전투력의 과시가 아니라 권능의 소유를 지키기 위한 결단이었던 셈이다.

- 들어간 이름에 자주 나온 한국어: **영원한** 12개, **영원** 7개, **꿈** 4개, **오아시스** 4개
- `Eternal Moon` = 영원의 달 ([Aria](https://genshin-impact.fandom.com/wiki/Aria))
- `Eternal Tides` = 아득한 조석 ([Eternal Tides](https://genshin-impact.fandom.com/wiki/Eternal_Tides))
- `Eternal Youth` = 주야의 영원한 청춘 ([Eternal Youth](https://genshin-impact.fandom.com/wiki/Eternal_Youth))
- `Faith Eternal` = 영원의 신앙 ([Faith Eternal](https://genshin-impact.fandom.com/wiki/Faith_Eternal))
- `Eternal Thunder` = 번개 같은 심오함 ([Eternal Thunder](https://genshin-impact.fandom.com/wiki/Eternal_Thunder))
- `Eternal Anamnesis` = Eternal Anamnesis ([Eternal Anamnesis](https://genshin-impact.fandom.com/wiki/Eternal_Anamnesis))
- … 외 22개 (`data/generated/ko-name-candidates.json`)
- 넣을 때: `'Eternal=한국어'`

### 98. Foul Legacy (3회)

예문: 클로린드가 힘을 아끼는 듯해 실망한 그는 연속 실종 사건으로 재판을 받았고, 혐의를 터무니없다 여기면서도 항소하기 위해 법정에 나갔다. 그는 기소된 사람이 명예를 되찾기 위해 결투에 참여할 수 있다는 이야기를 들었다며 사실인지 물었다. 나비아와 여행자가 진범의 증거를 가져왔지만 계시 판결 장치는 그를 유죄로 판단했다. 혐의에 혐오를 느껴 끌려가기를 거부한 그는 가드메크와 싸우고 Foul Legacy 형태를 쓰려 했으나 느비예트에게 제압되어 의식을 잃었고, 메로피드 요새로 끌려갔다.

- 들어간 이름에 자주 나온 한국어: **마왕** 6개, **무장** 5개
- `Childe: Foul Legacy` = 타르탈리아·마왕 무장 ([Childe: Foul Legacy](https://genshin-impact.fandom.com/wiki/Childe%3A_Foul_Legacy))
- `Shard of a Foul Legacy` = 마왕의 칼날·조각 ([Shard of a Foul Legacy](https://genshin-impact.fandom.com/wiki/Shard_of_a_Foul_Legacy))
- `Foul Legacy: Raging Tide` = 마왕 무장·광란 ([Foul Legacy: Raging Tide](https://genshin-impact.fandom.com/wiki/Foul_Legacy%3A_Raging_Tide))
- `Foul Legacy: Understream` = 마왕 무장·암류 ([Foul Legacy: Understream](https://genshin-impact.fandom.com/wiki/Foul_Legacy%3A_Understream))
- `Foul Legacy: Tide Withholder` = 마왕 무장·파도 억제 ([Foul Legacy: Tide Withholder](https://genshin-impact.fandom.com/wiki/Foul_Legacy%3A_Tide_Withholder))
- `Foul Legacy - The Devouring Deep` = 극악법 「경탄서멸」 ([Foul Legacy Transformation](https://genshin-impact.fandom.com/wiki/Foul_Legacy_Transformation))
- … 외 1개 (`data/generated/ko-name-candidates.json`)
- 넣을 때: `'Foul Legacy=한국어'`

### 99. Hearth (3회)

예문: **한겨울 계획**는 우인단의 향후 방향을 정한다고 여겨지는 사업으로, 판탈로네는 풀치넬라와 함께 이를 추진하며 **벽난로의 집**에 막대한 자금을 대고 그들을 '핵심 구성원'으로 삼았다. 벽난로의 집이 가장 큰 희생을 치를 가능성이 크다는 점 때문에, 아를레키노와 구성원들은 이 책략이 그들을 약화시키고 통제를 늘리려는 것인지 의심했다. 아를레키노가 물 신의 심장을 가지고 돌아온 뒤에도 이 사업은 벽난로의 집을 '핵심'으로 삼았고, 아를레키노와 리니는 조직이 갑자기 주목받은 것까지 합쳐 그 의도가 영향력을 묶어 두는 데 있다고 보았다. 한겨울 계획에서 벽난로의 집이 가장 큰 희생을 치를 수 있는 구도는, 아를레키노와 Hearth 구성원들이 자금 지원과 '핵심 구성원' 지위 부여를 자신들을 약화하고 더 많은 통제권을 얻으려는 책략으로 의심하는 것으로 보인다.

- 들어간 이름에 자주 나온 한국어: **벽난로** 4개, **집** 2개
- `House of the Hearth` = 벽난로의 집 ([House of the Hearth](https://genshin-impact.fandom.com/wiki/House_of_the_Hearth))
- `"Snow on the Hearth"` = 「홍로일점설」 (["Snow on the Hearth"](https://genshin-impact.fandom.com/wiki/%22Snow_on_the_Hearth%22))
- `Northern Stone Hearth` = 북대륙 돌 벽난로 ([Northern Stone Hearth](https://genshin-impact.fandom.com/wiki/Northern_Stone_Hearth))
- `Whispers by the Hearth` = 벽난로의 속삭임 ([Whispers by the Hearth](https://genshin-impact.fandom.com/wiki/Whispers_by_the_Hearth))
- `Nights of Hearth and Happiness` = 난로와 웃음의 밤 ([Nights of Hearth and Happiness](https://genshin-impact.fandom.com/wiki/Nights_of_Hearth_and_Happiness))
- `When the Hearth-Flame Goes Out` = 난롯불이 꺼지는 순간 ([When the Hearth-Flame Goes Out](https://genshin-impact.fandom.com/wiki/When_the_Hearth-Flame_Goes_Out))
- … 외 2개 (`data/generated/ko-name-candidates.json`)
- 넣을 때: `'Hearth=한국어'`

### 100. Himmel (3회)

예문: 풍마룡 분쟁 중 요원들은 Holy Lyre der Himmel을 훔쳤으나 곧 되찾혔고, 고트 호텔의 사절단은 봉쇄된 듯하다. 유라의 이야기 임무에서는 일부 대원이 슈베르트 로렌스와 결탁해 몬드 침공을 꾀하고, 로렌스 가문을 다시 도시의 지배자로 세우게 돕겠다고 약속한 일이 드러났으나, 페보니우스 기사단이 그 음모를 곧 막았다. 재집권을 돕겠다는 약속이 기사단의 손에 바로 끊긴 셈이다.

- 들어간 이름에 자주 나온 한국어: **천공** 5개, **하프** 5개, **복구된** 2개
- `Holy Lyre der Himmel` = 천공의 하프 ([Holy Lyre der Himmel](https://genshin-impact.fandom.com/wiki/Holy_Lyre_der_Himmel))
- `Damaged Holy Lyre der Himmel` = 망가진 천공의 하프 ([Damaged Holy Lyre der Himmel](https://genshin-impact.fandom.com/wiki/Damaged_Holy_Lyre_der_Himmel))
- `Retrieve the Holy Lyre der Himmel` = 천공의 하프 탈환 ([Retrieve the Holy Lyre der Himmel](https://genshin-impact.fandom.com/wiki/Retrieve_the_Holy_Lyre_der_Himmel))
- `State of the Holy Lyre der Himmel` = 보물의 상태 ([State of the Holy Lyre der Himmel](https://genshin-impact.fandom.com/wiki/State_of_the_Holy_Lyre_der_Himmel))
- `Partially Repaired Holy Lyre der Himmel` = 조금 복구된 천공의 하프 ([Partially Repaired Holy Lyre der Himmel](https://genshin-impact.fandom.com/wiki/Partially_Repaired_Holy_Lyre_der_Himmel))
- `Completely Repaired Holy Lyre der Himmel` = 완벽하게 복구된 천공의 하프 ([Completely Repaired Holy Lyre der Himmel](https://genshin-impact.fandom.com/wiki/Completely_Repaired_Holy_Lyre_der_Himmel))
- 넣을 때: `'Himmel=한국어'`

### 102. King (3회)

예문: House에서 페르엘은 쿠자비나의 친딸 크레이비와 친구가 되어, 다른 고아들이 당연하게 여긴 쿠자비나의 학대를 함께 알아보았다. 두 사람은 스네즈나야의 오로라를 보자는 약속을 했지만, 크레이비가 열여섯 살이 되자 쿠자비나는 모두에게 죽을 때까지 싸우라고 명했다. 크레이비는 살육을 막으려 했고 아를레키노는 친구가 친어머니를 죽이지 않겠다는 뜻을 존중해 그 계획을 따랐으며, 결국 크레이비는 아를레키노의 손에 죽음을 택했고 그 그림자가 아를레키노 안에 흡수되었다. 아를레키노는 리넷이 인신매매된 Lefevere 가문의 우두머리를 죽인 뒤 리니와 리넷을 거두었고, 증거가 망가진 임무에서 리넷이 형을 구해오자 그녀의 바람 신의 눈을 더 가치 있게 여겼다. 리넷이 더 위험한 임무를 맡자 리니는 곁에 남으려고 사안을 청했으나 아를레키노는 자기만족적 걱정이라며 화를 냈고, 뒤에 가족을 지키려는 결의로 불 신의 눈을 얻은 그를 자신의 뒤를 이을 King으로 정했다. 크레이비의 죽음과 리니의 성장은 아를레키노가 가족에게서 상실과 후계라는 서로 다른 무게를 함께 안고 있음을 보여준다.

- 들어간 이름에 자주 나온 한국어: **왕** 10개, **적왕** 6개, **킹** 3개, **검은** 2개
- `God King` = 신왕 ([Remus](https://genshin-impact.fandom.com/wiki/Remus))
- `Dough King` = 반죽 대왕 ([Dough King](https://genshin-impact.fandom.com/wiki/Dough_King))
- `King Deshret` = 적왕 ([King Deshret](https://genshin-impact.fandom.com/wiki/King_Deshret))
- `Vinster King` = 검은 왕 ([Irmin](https://genshin-impact.fandom.com/wiki/Irmin))
- `"Kaboom King"` = 「펑펑 대마왕」 (["Kaboom King"](https://genshin-impact.fandom.com/wiki/%22Kaboom_King%22))
- `Ascended King` = 승격한 킹 ([The Game Before the Gate](https://genshin-impact.fandom.com/wiki/The_Game_Before_the_Gate))
- … 외 35개 (`data/generated/ko-name-candidates.json`)
- 넣을 때: `'King=한국어'`

### 106. Ndenge (3회)

예문: 1,600년 전의 Ndenge는 이름 없는 여성 불의 신으로 적혀 있다. 벤티와 아는 사이였고 무라타라의 시조였다. 이름과 이름 없음이 한 칸에 겹친 것은 이 기록이 서로 어긋난 채 포개진 셈이다.

- **옛 판에만**: `Ndenge` = **은뎅게** ([Ndenge 2025-10-16 판](https://genshin-impact.fandom.com/wiki/Ndenge?oldid=1864405))
- 넣을 때: `'Ndenge=한국어'`

### 108. North Wind (3회)

예문: 보레아스는 마신 이름 안드리우스로도 불리는 몬드의 **바람 사신수** 중 하나인 **북풍의 늑대**이며, 스네즈나야와 노드크라이에서 비롯해 코이타르의 알지 못한 축복으로 신이 된 존재다. 마신 전쟁 시기에는 남쪽으로 가 데카라비안과 싸웠으나 스스로 바람의 신이 되기에 부족하다 여겨 노드크라이로 돌아갔다. 천 년 뒤에는 영혼을 나누어 방랑 기사와 몬드로 향했고, 천 년 만에 나아진 땅을 본 뒤 육신을 죽여 힘을 **지맥**에 흘려보내고 영으로 남았다. 그 영은 바르바토스의 요청으로 바람 사신수의 North Wind가 되어 울프 영지를 지키며, 얼음과 바람으로 된 임시 형체로 도전자와 싸우고 늑대 무리와 고아를 거두는 존재로 남았다.

- `Oath to the North Wind` = 북풍의 맹세 ([Oath to the North Wind](https://genshin-impact.fandom.com/wiki/Oath_to_the_North_Wind))
- 넣을 때: `'North Wind=한국어'`

### 109. Ode (3회)

예문: 심연을 붙들어 두려고 불이 돌아온 밤의 순례와 밤 순찰자 전쟁을 치렀고, 거기서 **성화**의 연료인 각축의 불꽃이 나왔다. 성화가 꺼지지 않는 한 심연의 대부분은 나라 밖에 머물렀다. 불의 신은 Pilgrimage of Sacred Flames를 주기적으로 열어 토너먼트로 밤 순찰자 전쟁에 나갈 이를 가렸고, 대영혼에게 고대 이름을 받은 승자만이 심연을 치는 습격에 나설 수 있었다. 고대 이름 bearer가 밤의 신의 나라로 들어가 싸우는 동안 심연은 전술에 적응해 때때로 이겼고, 대표에게 내린 Ode to Resurrection으로는 팀의 한 명이라도 이기고 나오면 쓰러진 이름 보유자를 되살릴 수 있었다.

- **같은 영어**: `Ode` = **축원** ([Ode](https://genshin-impact.fandom.com/wiki/Ode))
- 들어간 이름에 자주 나온 한국어: **시** 8개, **찬송가** 4개, **노래** 3개, **바람** 3개
- `Breezy Ode` = 푸른 바람의 시 ([Breezy Ode](https://genshin-impact.fandom.com/wiki/Breezy_Ode))
- `Magmic Ode` = 불꽃과 바위의 노래 ([Magmic Ode](https://genshin-impact.fandom.com/wiki/Magmic_Ode))
- `Windblume Ode` = 바람 꽃의 노래 ([Windblume Ode](https://genshin-impact.fandom.com/wiki/Windblume_Ode))
- `Lanternlit Ode` = 봄 마차 기행 ([Battle Pass/Lanternlit Ode](https://genshin-impact.fandom.com/wiki/Battle_Pass%2FLanternlit_Ode))
- `Ode to Tumaini` = 「투마이니」의 시 ([Ode to Tumaini](https://genshin-impact.fandom.com/wiki/Ode_to_Tumaini))
- `Ode Beyond Time` = 아득한 찬송의 노래 ([The Daybreak Chronicles](https://genshin-impact.fandom.com/wiki/The_Daybreak_Chronicles))
- … 외 16개 (`data/generated/ko-name-candidates.json`)
- 넣을 때: `'Ode=한국어'`

### 111. Remnants (3회)

예문: 심연 패배 후 마비카는 여행자에게 잔해가 비밀근원 기술의 유물인 **Ancient Moon의 Remnants**이며 도토레가 그들과 관련된 프로젝트에 관여한다는 추가 정보를 전했다. 나타 침공 당시 우인단은 Natlanese와 함께 싸워 큰 사상자를 냈고, 전투가 끝난 뒤 마비카는 카피타노에게 귀중한 도움에 감사를 표했다. 침공 뒤 거짓된 하늘을 알게 된 도토레는 Ancient Moon Remnants를 조사하기 위해 노드크라이에서 나타로 소규모 우인단을 보냈다. [사실] 영원의 달이 부서졌을 때 일부 잔해는 별먼지처럼 티바트에 떨어졌고, 나머지는 천리가 세 달의 운명을 감추기 위해 거짓된 하늘 너머에 숨겨 두었으며, 마비카가 타오를 운명의 무지개에서 로노바의 힘으로 하늘을 가른 일이 있었고, 현대의 우인단은 영원의 달의 파편을 노드크라이로 끌어내렸다. 우인단은 그중 하나를 둘러싼 거대한 달의 힘 실험설계국을 세워 얼음의 여왕을 위한 불명의 무기를 만들었다.

- 들어간 이름에 자주 나온 한국어: **향로** 4개, **고대** 2개, **불멸** 2개, **유물** 2개
- `Dream-Mirror Remnant` = 영혼꿈의 잔상 ([Dream-Mirror Remnant](https://genshin-impact.fandom.com/wiki/Dream-Mirror_Remnant))
- `Remnant Incense Guide` = 향로 ([Remnant Incense Guide](https://genshin-impact.fandom.com/wiki/Remnant_Incense_Guide))
- `Remnants of Tetenanco` = 고대 유물 발굴지 ([Remnants of Tetenanco](https://genshin-impact.fandom.com/wiki/Remnants_of_Tetenanco))
- `Ancient Moon's Remnant` = 고대 달의 흔적 ([Ancient Moon's Remnant](https://genshin-impact.fandom.com/wiki/Ancient_Moon's_Remnant))
- `Immortal Remnants: Anemo` = 불멸의 유해·바람 ([Immortal Remnants: Anemo](https://genshin-impact.fandom.com/wiki/Immortal_Remnants%3A_Anemo))
- `Remnant of the Dreadwing` = 악몽의 날개뼈 ([Remnant of the Dreadwing](https://genshin-impact.fandom.com/wiki/Remnant_of_the_Dreadwing))
- … 외 7개 (`data/generated/ko-name-candidates.json`)
- 넣을 때: `'Remnants=한국어'`

### 113. Resurrection (3회)

예문: 심연을 붙들어 두려고 불이 돌아온 밤의 순례와 밤 순찰자 전쟁을 치렀고, 거기서 **성화**의 연료인 각축의 불꽃이 나왔다. 성화가 꺼지지 않는 한 심연의 대부분은 나라 밖에 머물렀다. 불의 신은 Pilgrimage of Sacred Flames를 주기적으로 열어 토너먼트로 밤 순찰자 전쟁에 나갈 이를 가렸고, 대영혼에게 고대 이름을 받은 승자만이 심연을 치는 습격에 나설 수 있었다. 고대 이름 bearer가 밤의 신의 나라로 들어가 싸우는 동안 심연은 전술에 적응해 때때로 이겼고, 대표에게 내린 Ode to Resurrection으로는 팀의 한 명이라도 이기고 나오면 쓰러진 이름 보유자를 되살릴 수 있었다.

- 들어간 이름에 자주 나온 한국어: **밤** 2개, **차가운** 2개, **환혼** 2개, **환혼시** 2개
- `Icy Resurrection` = 차가운 환혼의 밤 ([Qiqi/Profile](https://genshin-impact.fandom.com/wiki/Qiqi%2FProfile))
- `Ode of Resurrection` = 환혼시 ([Ode of Resurrection](https://genshin-impact.fandom.com/wiki/Ode_of_Resurrection))
- `Door of Resurrection` = 재생의 문 ([Door of Resurrection](https://genshin-impact.fandom.com/wiki/Door_of_Resurrection))
- `Rite of Resurrection` = 기사회해 ([Rite of Resurrection](https://genshin-impact.fandom.com/wiki/Rite_of_Resurrection))
- `Echo: Icy Resurrection` = 궤적·차가운 환혼의 밤 ([Echo: Icy Resurrection](https://genshin-impact.fandom.com/wiki/Echo%3A_Icy_Resurrection))
- `Incandescent Ode of Resurrection` = 뜨거운 환혼시 ([Incandescent Ode of Resurrection](https://genshin-impact.fandom.com/wiki/Incandescent_Ode_of_Resurrection))
- 넣을 때: `'Resurrection=한국어'`

### 114. Royal Energy Commission (3회)

예문: 피에로는 한겨울 계획이 **겨우살이 계획**의 앞단계에 지나지 않았고, 우인단이 셀레스티아를 해칠 무기를 만들려 했다고 밝혔다. 로노바는 얼음의 여왕의 반항을 의심하고 민중에게 죽음의 저주를 내려, 천리를 해칠 구상이나 프로젝트를 가진 이를 "죽였다". Royal Energy Commission의 미탸는 시험 직전 저주의 발동 효과를 깨닫고, Shade를 상대하기 전까지 프로젝트를 무기한 중단하자고 피에로에게 제안해 동의를 얻었다. 미탸는 우인단 상부가 자신을 Energy Commission에서 군수궁으로 옮겼다고 말한다. 한 병사는 우인단 국장의 권한이 모든 이를 능가하고 의문할 수 없어, 아무것도 할 수 없었다고 했다. 시험 직전 알려진 저주와 피에로의 동의, 국장에게 이의를 달 수 없다는 말을 겹치면, 하늘을 겨눈 무기는 저주와 지휘권 앞에서 멈춘 것으로 볼 수 있다.

- `Royal Energy Commission of Snezhnaya` = 스네즈나야 에너지 협회 ([Royal Energy Commission of Snezhnaya](https://genshin-impact.fandom.com/wiki/Royal_Energy_Commission_of_Snezhnaya))
- 넣을 때: `'Royal Energy Commission=한국어'`

### 119. Universitas (3회)

예문: 엘민 왕이 Universitas의 자원 대부분을 심연 연구로 돌리자 솔린디스의 팀은 교체되었고, 그녀만 달의 정수 연구자로 남았다. 그녀는 달의 정수가 시간이 거꾸로 흐르는 다른 차원, 뒤에 “달의 반영”으로 밝혀지는 곳으로 통하는 공간 관문이 될 수 있음을 발견했으나, 자금 삭감과 기술적 한계로 당시에는 탐험하지 못했다. 그녀는 달의 정수 연구자로서 관문 너머의 세계를 간절히 보고 싶다고 말했다.

- `Universitas Magistrorum` = 심비원 ([Universitas Magistrorum](https://genshin-impact.fandom.com/wiki/Universitas_Magistrorum))
- 넣을 때: `'Universitas=한국어'`

### 120. War (3회)

예문: 나타의 불의 신은 전쟁의 신으로, 마비카, 곧 하보림이자 키온고지가 War를 이상으로 1,600년 전에 올랐으나 사망했다. 폰타인에서는 포칼로스가 「정의」를 이상으로 500년 전에 올라 사망했다. 스네즈나야의 현임 얼음의 신은 얼음의 여왕으로, 아나스타샤·표도로브나·스네즈나야라는 이름으로도 불리며 그 나라를 다스리고, 이상은 Unknown인 채 500년 전에 올라 살아 있다. 살아 있는 자리와 이미 사망으로 적힌 자리가 이렇게 나란한 것은, 일곱 나라의 틀과 지금 그 위에 선 신들이 같은 세대로 겹치지 않는다는 뜻으로 볼 수 있다.

- 들어간 이름에 자주 나온 한국어: **전쟁** 12개, **장난감** 3개, **전투** 3개, **노련한** 2개
- `Archon War` = 마신 전쟁 ([Archon War](https://genshin-impact.fandom.com/wiki/Archon_War))
- `Fire and War` = 불과 전쟁 ([Fire and War](https://genshin-impact.fandom.com/wiki/Fire_and_War))
- `Flames of War` = 투쟁의 불꽃 ([Flames of War](https://genshin-impact.fandom.com/wiki/Flames_of_War))
- `Smokeless War` = 총칼 없는 전쟁 ([Smokeless War](https://genshin-impact.fandom.com/wiki/Smokeless_War))
- `The Art of War` = 「예술은 바로…」 ([The Art of War](https://genshin-impact.fandom.com/wiki/The_Art_of_War))
- `The War Within` = 심마 ([The War Within](https://genshin-impact.fandom.com/wiki/The_War_Within))
- … 외 20개 (`data/generated/ko-name-candidates.json`)
- 넣을 때: `'War=한국어'`

### 122. Yoshinori (3회)

예문: 카에데하라 요시노리와 당시 Yashiro의 수장은 장인들을 추적하다 스카라무슈 앞에 이르렀고, 그는 죄를 자백한 뒤 일행 전부를 손쉽게 처리했다. Yoshinori를 알아본 듯한 그는 "니와"를 아느냐고 물었고, 안다는 답을 듣자 "그녀"에게 이름 쿠니쿠즈시를 전하라고 한 뒤 떠났다. 둘은 스카라무슈의 보복을 두려워해 그 일을 다시는 말하지 않았고, Yoshinori는 잇신의 기술을 더 이상 잇지 않기로 했다. 니와를 확인한 뒤에 이름을 남긴 것은, 그 호칭이 니와와 연결된 이에게 닿도록 둔 말로 보인다.

- `Kaedehara Yoshinori` = 카에데하라 요시노리 ([Kaedehara Yoshinori](https://genshin-impact.fandom.com/wiki/Kaedehara_Yoshinori))
- 넣을 때: `'Yoshinori=한국어'`

### 175. Herald / Heralds (3회)

예문: 여행자가 심연 교단을 조사하러 울프 영지에 갔을 때, 보레아스는 심연 사도에게 붙들린 채 다시 잠시 모습을 보였다. Herald는 드발린에게 했던 것처럼 보레아스를 타락시키려 했다. 짧은 싸움 끝에 심연 사도는 패했고, 늑대의 영은 풀려났다. 데인슬레이프는 보레아스의 육체가 오래전에 죽었으며 울프 영지에 있는 것은 그의 영이라고 말한다. 육체를 잃은 영이 드발린에게 했던 타락과 같은 표적이 된 셈이다.

- 들어간 이름에 자주 나온 한국어: **사도** 4개, **심연** 3개, **귀차** 2개, **한병** 2개
- `Abyss Herald` = 심연 사도 ([Abyss Herald](https://genshin-impact.fandom.com/wiki/Abyss_Herald))
- `Herald of Frost` = 한병의 귀차 ([Herald of Frost](https://genshin-impact.fandom.com/wiki/Herald_of_Frost))
- `Passerine Herald` = 소식을 전하는 선학 ([Xianyun/Profile](https://genshin-impact.fandom.com/wiki/Xianyun%2FProfile))
- `Abyss Herald: Frost Fall` = 심연 사도·서리 내림 ([Abyss Herald: Frost Fall](https://genshin-impact.fandom.com/wiki/Abyss_Herald%3A_Frost_Fall))
- `A Herald Without Adherents` = 신자 없는 사도 ([A Herald Without Adherents](https://genshin-impact.fandom.com/wiki/A_Herald_Without_Adherents))
- `Lazuli, Herald of the Order` = 푸른 규벽·천지의 이치 ([Lazuli, Herald of the Order](https://genshin-impact.fandom.com/wiki/Lazuli%2C_Herald_of_the_Order))
- … 외 2개 (`data/generated/ko-name-candidates.json`)
- 넣을 때: `'Herald|Heralds=한국어'`

## 덤프에 후보가 없는 것 (52개)

게임이나 공식 자료에서 직접 확인해야 한다. 방법은 [조사 계획](ko-names-plan.md)의 「덤프에 후보가 없는 것」에 있다. 「나온 문서」는 문장이 요약된 Fandom 문서다. 어떤 임무·도감에 나오는지 찾을 때 쓴다.

| 번호 | 영어 | 횟수 | 나온 문서 |
|---|---|---|---|
| 1 | Moon Sisters | 31 | [Three Moons](https://genshin-impact.fandom.com/wiki/Three_Moons), [Canon](https://genshin-impact.fandom.com/wiki/Canon) |
| 6 | Artificial Moon Marrow | 13 | [Moon Marrow](https://genshin-impact.fandom.com/wiki/Moon_Marrow) |
| 17 | Moonchanter / Moonchanters | 10 | [Lauma](https://genshin-impact.fandom.com/wiki/Lauma) |
| 10 | False Moon God | 9 |  |
| 11 | Moon Goddesses | 9 | [Heavenly Principles](https://genshin-impact.fandom.com/wiki/Heavenly_Principles) |
| 12 | Omega Build | 9 | [Dottore](https://genshin-impact.fandom.com/wiki/Dottore) |
| 29 | Hyperborean / Hyperboreans | 8 |  |
| 19 | Case of the Eccentric | 7 | [Wanderer/Storyline](https://genshin-impact.fandom.com/wiki/Wanderer%2FStoryline) |
| 21 | Dragon Sovereigns | 7 | [Light Realm](https://genshin-impact.fandom.com/wiki/Light_Realm) |
| 23 | Heart of the Abyss | 7 | [Abyss](https://genshin-impact.fandom.com/wiki/Abyss) |
| 24 | NPC | 7 |  |
| 26 | Trilunar Authority | 7 | [Columbina/Storyline](https://genshin-impact.fandom.com/wiki/Columbina%2FStoryline) |
| 30 | Hypo- | 6 | [Sonnet](https://genshin-impact.fandom.com/wiki/Sonnet) |
| 32 | Natlanese | 6 |  |
| 35 | Tripartite Conference | 6 | [Varka](https://genshin-impact.fandom.com/wiki/Varka), [Alice](https://genshin-impact.fandom.com/wiki/Alice) |
| 50 | Withering Zones / Withering Zone | 6 |  |
| 41 | Eternal and Iridescent Moon Marrows | 5 |  |
| 46 | Reasoning Knows Not Time of Day | 5 |  |
| 48 | Suspense Always Follows | 5 |  |
| 51 | Wolf Spirits | 5 |  |
| 65 | Lunar Envoys / Lunar Envoy | 5 |  |
| 52 | Abyssal Tumors | 4 | [Abyss](https://genshin-impact.fandom.com/wiki/Abyss) |
| 53 | Acute Toxicity Test | 4 |  |
| 58 | Fatui Internal Affairs | 4 |  |
| 64 | Login Menu | 4 |  |
| 69 | Nara Varuna | 4 | [Traveler's Sibling](https://genshin-impact.fandom.com/wiki/Traveler's_Sibling) |
| 73 | Pyro Sovereign | 4 | [Abyss](https://genshin-impact.fandom.com/wiki/Abyss) |
| 78 | The Mountain Sparrow | 4 |  |
| 79 | The Three Eternal Companion-Gods | 4 | [Greater Lord Rukkhadevata](https://genshin-impact.fandom.com/wiki/Greater_Lord_Rukkhadevata) |
| 80 | Towers of the Three Realms | 4 | [Abyss](https://genshin-impact.fandom.com/wiki/Abyss) |
| 82 | Alive | 3 |  |
| 83 | Ancient Moon Remnants | 3 | [Fatui](https://genshin-impact.fandom.com/wiki/Fatui) |
| 87 | Dalegrad | 3 |  |
| 88 | Deadly Selves | 3 |  |
| 89 | Debt Collection | 3 |  |
| 90 | Descender' | 3 |  |
| 92 | DNA | 3 |  |
| 94 | Eighth | 3 |  |
| 96 | Evil Eye | 3 |  |
| 97 | Fire Seed | 3 |  |
| 101 | Holy Lyre de | 3 |  |
| 103 | Known Members | 3 |  |
| 104 | Lord of the Tower | 3 | [Boreas](https://genshin-impact.fandom.com/wiki/Boreas) |
| 105 | Moon Chess | 3 |  |
| 107 | Neohumans | 3 |  |
| 110 | Pilgrimage of Sacred Flames | 3 |  |
| 112 | Resigned | 3 | [Eleven Fatui Harbingers](https://genshin-impact.fandom.com/wiki/Eleven_Fatui_Harbingers) |
| 115 | Statues of The Seven | 3 |  |
| 116 | Sumerean | 3 | [Wanderer/Storyline](https://genshin-impact.fandom.com/wiki/Wanderer%2FStoryline) |
| 117 | Tetratanic Sweet Flower | 3 |  |
| 118 | Trilunar Syzygy | 3 |  |
| 121 | World of Teyvat | 3 |  |
