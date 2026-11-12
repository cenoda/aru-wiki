# 한국어 이름 후보 (로컬 덤프)

`node scripts/fandom/ko-candidates.mjs all`가 만든다(손으로 고치지 않는다). 대상은 [한국어 이름이 필요한 말](ko-names-needed.md)과 같다(3번 이상).
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
node scripts/theme/snapshots.mjs all --write --only none
```

`|`로 단수·복수 같은 여러 영어 형태를 한 번에 넣는다. 후보에 근거가 없으면 `--play 이름`(게임에서 봄), `--url 주소`(공개 문서·영상), `--maintainer 이름`(일반어를 직접 정함) 중 하나가 있어야 넣어진다.
채팅으로 "3번 집행관 맞음"처럼 알려 줘도 같은 명령으로 넣는다.

## 후보가 있는 것 (108개)

### 1. Cloud Retainer (38회)

예문: 선인이 언제부터 공식적인 집단으로 자리 잡았는지는 분명하지 않다. 다만 이들은 마신 전쟁 당시 귀종과 모락스를 위해 싸우며 귀리집을 지킨 것으로 전해진다. Cloud Retainer는 귀리집이 몰락하기 전부터 그들과 친분이 있었다. 집단이 언제 성립했는지는 흐릿하지만, 적어도 귀리집의 전장에서 선인이 모락스 측에 서 있었다는 점은 기록으로 남아 있는 셈이다.

- **같은 영어**: `Cloud Retainer` = **류운차풍진군** ([Xianyun/Storyline](https://genshin-impact.fandom.com/wiki/Xianyun%2FStoryline))
- `They Call Her Cloud Retainer` = 류운 선인! ([They Call Her Cloud Retainer](https://genshin-impact.fandom.com/wiki/They_Call_Her_Cloud_Retainer))
- 넣을 때: `'Cloud Retainer=한국어'`

### 2. Dragon (38회)

예문: **Dragon**은 티바트의 육지와 바다에 사는 거대하고 강력한 생명체이며, 유년 형태인 용 도마뱀을 포함해 광계에 속한 옛 세계의 지배종이었다. **천리**는 일곱 왕을 포함한 용 군주들을 꺾고 인간을 위한 새 세계를 세웠고, 그 뒤 용은 인계의 신과 인간과 갈등하면서도 때로는 공존하는 존재로 남았다. 용 도마뱀은 Dragon의 유년 형태로, 용은 고대 Dragon의 후손으로 설명된다. 이처럼 Dragon은 옛 세계의 지배종이면서 인간 세계의 성립 이후에도 여러 갈래로 남은 존재라는 점에서, 티바트의 자연사와 인간 세계의 성립을 함께 읽게 하는 축으로 보인다.

- 들어간 이름에 자주 나온 한국어: **용** 12개, **비밀근원** 4개, **드래곤** 3개, **마룡** 2개
- `Cryo Dragon` = 얼음 용 ([Cryo Dragon](https://genshin-impact.fandom.com/wiki/Cryo_Dragon))
- `Fell Dragon` = 「악룡」 ([Fell Dragon](https://genshin-impact.fandom.com/wiki/Fell_Dragon))
- `Dragon Storm` = 용의 재앙 ([Dragon Storm](https://genshin-impact.fandom.com/wiki/Dragon_Storm))
- `Hydro Dragon` = 물의 용 ([Hydro Dragon](https://genshin-impact.fandom.com/wiki/Hydro_Dragon))
- `Dragon-Queller` = 복룡목 ([Dragon-Queller](https://genshin-impact.fandom.com/wiki/Dragon-Queller))
- `Dragon on the Move` = 「마룡 출격」 ([Dragon on the Move](https://genshin-impact.fandom.com/wiki/Dragon_on_the_Move))
- … 외 30개 (`data/generated/ko-name-candidates.json`)
- 넣을 때: `'Dragon=한국어'`

### 15. Outriders / Outrider (23회)

예문: 엠버는 원신의 플레이 가능한 불 캐릭터이며, 페보니우스 기사단의 마지막 남은 Outrider로서 몬드 시민을 돕는 일이라면 간단한 일이든 어려운 일이든 항상 준비되어 있다. Outriders는 엠버의 할아버지가 세우고 이끈 부대였으나 그의 갑작스러운 실종 뒤 사실상 사라졌고, 엠버만이 그 명맥을 지킨다. 마지막 Outrider라는 위치는 그녀가 시민을 돕는 일에 늘 나서는 인물이면서 동시에 사실상 사라진 부대의 흔적을 혼자 지니고 있음을 보여 준다. 여행자가 몬드에 도착했을 때 만나는 Outrider로서 이야기의 출발점에 서는 인물이기도 하다.

- 들어간 이름에 자주 나온 한국어: **기사** 5개, **정찰** 5개
- `100% Outrider` = 100% 정찰 기사 ([100% Outrider](https://genshin-impact.fandom.com/wiki/100%25_Outrider))
- `Outrider Style` = 정찰 기사의 풍격 ([Outrider Style](https://genshin-impact.fandom.com/wiki/Outrider_Style))
- `5-Star Outrider` = 「만점 정찰 기사」 ([5-Star Outrider](https://genshin-impact.fandom.com/wiki/5-Star_Outrider))
- `Amber: 100% Outrider` = 엠버·100% 정찰 기사 ([Amber: 100% Outrider](https://genshin-impact.fandom.com/wiki/Amber%3A_100%25_Outrider))
- `Another Day as an Outrider!` = 또 하루를 시작하는 정찰 기사 ([Another Day as an Outrider!](https://genshin-impact.fandom.com/wiki/Another_Day_as_an_Outrider!))
- 넣을 때: `'Outriders|Outrider=한국어'`

### 3. Scions (21회)

예문: 서리달 아이, 또는 Moonchildren은 노드크라이에 뿌리내린 토착 부족으로, 서리달을 따르는 이들이다. 이들은 휘페르보레아의 황금 왕국 후손이며, 캐넌이 죽은 뒤 히시섬에서 고대 의식을 이어 온 집단이다. 이들은 쿠타르를 현재의 서리달 여신으로 모시며, Sacred Heir가 태어나 월신이 돌아오리라는 예언을 전승했고, 쿠타르는 Scions가 자신보다 기도 응답을 바란다는 것을 깨닫고 우인단에 합류했다가, 우인단이 자신의 힘만 원한다는 것을 깨닫고 히시섬의 달빛 정원으로 돌아와 머무른다. 이 부족의 역사는 혈통 순수성에 대한 집착, 신을 향한 기대와 그 신의 이탈, 우인단와의 긴장이 맞물린 사례로 읽힌다.

- 들어간 이름에 자주 나온 한국어: **서리밤** 8개, **후예** 8개, **나무살이** 5개, **극북** 4개
- `Frostmoon Scions` = 서리달 아이 ([Frostmoon Scions](https://genshin-impact.fandom.com/wiki/Frostmoon_Scions))
- `Frostnight Scion` = 서리밤 후예 ([Frostnight Scion](https://genshin-impact.fandom.com/wiki/Frostnight_Scion))
- `Scions of the Canopy` = 나무살이 ([Scions of the Canopy](https://genshin-impact.fandom.com/wiki/Scions_of_the_Canopy))
- `"Scions of the Canopy"` = 「나무살이」 (["Scions of the Canopy"](https://genshin-impact.fandom.com/wiki/%22Scions_of_the_Canopy%22))
- `Crown of the Final Scion` = 막내의 왕관 ([Angelos' Heptades](https://genshin-impact.fandom.com/wiki/Angelos'_Heptades))
- `Scion of the Blazing Sun` = 뜨거운 태양의 후손 ([Scion of the Blazing Sun](https://genshin-impact.fandom.com/wiki/Scion_of_the_Blazing_Sun))
- … 외 14개 (`data/generated/ko-name-candidates.json`)
- 넣을 때: `'Scions=한국어'`

### 6. Kazuha (17회)

예문: 남십자의 거래는 리월의 국경을 넘어 **이나즈마**에서도 이루어졌다. 중재의 이름이 이나즈마인 것처럼, 선단에는 이나즈마와 얽힌 흔적이 남아 있다. 요이미야는 때때로 선단에 리월로 불꽃을 보내는 일을 의뢰하고, 북두와 선원들은 산고노미야 코코미에게 고용되어 와타츠미군의 용병으로 일한 적도 있다. Kazuha는 Captain Beidou에게 구조되어 선단에 받아들여진 인연이 있다. 교류가 선원의 이름과 의뢰 양쪽에 드러난다는 점에서, 남십자의 활동 반경은 리월 항구 안에 머물지 않는다고 볼 수 있다.

- 들어간 이름에 자주 나온 한국어: **카즈하** 6개, **카에데하라** 5개
- `Kazuha Slash` = 카즈하의 일도 ([Kazuha Slash](https://genshin-impact.fandom.com/wiki/Kazuha_Slash))
- `Kaedehara Kazuha` = 카에데하라 카즈하 ([Kaedehara Kazuha](https://genshin-impact.fandom.com/wiki/Kaedehara_Kazuha))
- `Kaedehara Kazuha: Of Blades and Wine` = 카에데하라 카즈하·검과 술 ([Kaedehara Kazuha: Of Blades and Wine](https://genshin-impact.fandom.com/wiki/Kaedehara_Kazuha%3A_Of_Blades_and_Wine))
- `Kaedehara Kazuha: Autumn Maple-Viewing` = 카에데하라 카즈하·가을의 단풍 사냥 ([Kaedehara Kazuha: Autumn Maple-Viewing](https://genshin-impact.fandom.com/wiki/Kaedehara_Kazuha%3A_Autumn_Maple-Viewing))
- `Kaedehara Kazuha: Gazing at Sky and Earth` = 카에데하라 카즈하·먼 곳을 바라보며 ([Kaedehara Kazuha: Gazing at Sky and Earth](https://genshin-impact.fandom.com/wiki/Kaedehara_Kazuha%3A_Gazing_at_Sky_and_Earth))
- `Kaedehara Kazuha: Reflections on the Road` = 카에데하라 카즈하·여정의 깨달음 ([Kaedehara Kazuha: Reflections on the Road](https://genshin-impact.fandom.com/wiki/Kaedehara_Kazuha%3A_Reflections_on_the_Road))
- 넣을 때: `'Kazuha=한국어'`

### 7. Archon / Archons (17회)

예문: 적왕은 셀레스티아가 건넨 "선물"을 거절하고 자신의 야망을 좇았으며, 그 선물은 신의 심장이자 나아가 Archon의 지위를 뜻하는 것으로 여겨진다. 그는 나부·말리카타에게 셀레스티아에 맞설 뜻을 나누었고 그녀는 금단의 지식으로 향하는 길을 알려주기로 했지만, 룩카데바타는 두 사람의 야망을 받들지 않고 사막을 떠나 자신의 문명을 세웠다. 나부·말리카타는 적왕을 금지된 지식으로 이끌려는 의식에서 스스로를 희생했고, 그 의식은 두 사람이 함께 세운 왕국을 황폐하게 하는 모래폭풍을 불러일으켰다. 적왕은 그녀의 죽음의 진짜 사정을 알지 못한 채 애도했고, 사막에 묻힌 하늘의 못을 찾아 지니의 도움으로 영원의 오아시스를 세웠다. 그가 남긴 추모의 공간은 정작 그가 모르는 진실 위에 세워진 셈이다.

- 들어간 이름에 자주 나온 한국어: **신** 6개, **바위** 4개, **전설** 4개, **마신** 3개
- `Archon War` = 마신 전쟁 ([Archon War](https://genshin-impact.fandom.com/wiki/Archon_War))
- `Archon Quest` = 마신 임무 ([Archon Quest](https://genshin-impact.fandom.com/wiki/Archon_Quest))
- `God / Archon` = 마신 / 신 ([God](https://genshin-impact.fandom.com/wiki/God))
- `The Seven Archons` = 7명의 집정관 ([The Seven](https://genshin-impact.fandom.com/wiki/The_Seven))
- `O Archon, Hear Me!` = 신이시여, 부름에 답해주소서! ([O Archon, Hear Me!](https://genshin-impact.fandom.com/wiki/O_Archon%2C_Hear_Me!))
- `Anemo Archon Statue` = 바람 신의 신상 ([Anemo Archon Statue](https://genshin-impact.fandom.com/wiki/Anemo_Archon_Statue))
- … 외 9개 (`data/generated/ko-name-candidates.json`)
- **넣지 않음**: 문맥마다 다르다. 그냥 강한 존재면 마신, 마신 전쟁에서 이겨 신의 심장을 차지한 일곱이면 집정관([조사 계획](ko-names-plan.md)).

### 8. Statue (16회)

예문: **일곱신상**은 티바트 곳곳에 세워진 석상으로, 각 지역의 집정관을 본떠 만든 구조물이다. 지도 개방과 순간이동, 부활과 치유, 여행자의 원소 공명처럼 모험의 기본 동선을 떠받치는 **생활·탐사 거점** 역할을 한다. 동시에 신성한 문화유산으로 여겨지고, 집정관이 바뀐 뒤 석상이 어떻게 변하는지는 알려지지 않았으며, 잃어버린 Statue가 나중에 「뒤집힌 불결한 신상」으로 발견되기도 하는 **신앙과 역사의 표지**로 보인다.

- 들어간 이름에 자주 나온 한국어: **조각상** 11개, **석상** 5개, **신상** 5개, **검을** 2개
- `Weird Statue` = 이상한 조각상 ([Field Tiller](https://genshin-impact.fandom.com/wiki/Field_Tiller))
- `Defiled Statue` = 「뒤집힌 불결한 신상」 ([Defiled Statue](https://genshin-impact.fandom.com/wiki/Defiled_Statue))
- `Lava Dragon Statue` = 용암룡 형상 ([Lava Dragon Statue](https://genshin-impact.fandom.com/wiki/Lava_Dragon_Statue))
- `Anemo Archon Statue` = 바람 신의 신상 ([Anemo Archon Statue](https://genshin-impact.fandom.com/wiki/Anemo_Archon_Statue))
- `Beacon Front Statue` = 불멸의 봉화 조각상 ([Beacon Front Statue](https://genshin-impact.fandom.com/wiki/Beacon_Front_Statue))
- `Statue of The Seven` = 일곱신상 ([Statue of The Seven](https://genshin-impact.fandom.com/wiki/Statue_of_The_Seven))
- … 외 23개 (`data/generated/ko-name-candidates.json`)
- 넣을 때: `'Statue=한국어'`

### 9. Adepti (15회)

예문: 마신 전쟁이 열리기 전, 모락스는 귀종과 가까운 사이였고, 두 신의 이름을 딴 귀리 평원에 사람과 Adepti가 함께 사는 정착지를 두었다. 마르코시우스와 평 할머니과도 사이가 좋았다. 전쟁이 시작되자 모락스와 마르코시우스, 귀종은 **서로의 곁을 지키며** 다른 신들과 맞섰다. 3,700년 전, 귀종은 귀리 평원과 적화주를 황폐하게 만든 전투에서 숨졌고, 모락스는 남은 사람들을 천형산 남쪽으로 데려가 지금의 리월항을 세웠다. 두 신의 이름이 함께 남은 땅에서 세 신이 나란히 싸웠고, 그중 하나가 죽은 뒤 사람들이 새 터전으로 옮겨 갔다는 점은, 이 지역의 전쟁이 신들의 승패만이 아니라 사람들의 삶터까지 바꿔 놓았음을 보여준다.

- 들어간 이름에 자주 나온 한국어: **선인** 3개, **미식가** 2개, **찾는** 2개
- `Adepti Sigil` = 선가 부적 ([Adepti Sigil](https://genshin-impact.fandom.com/wiki/Adepti_Sigil))
- `Adepti Seeker's Stove` = 선인 찾는 미식가 ([Adepti Seeker's Stove](https://genshin-impact.fandom.com/wiki/Adepti_Seeker's_Stove))
- `Yakshas: The Guardian Adepti` = 호법선중야차록 ([Yakshas: The Guardian Adepti](https://genshin-impact.fandom.com/wiki/Yakshas%3A_The_Guardian_Adepti))
- `Diagram: Adepti Seeker's Stove` = 설계도: 선인 찾는 미식가 ([Diagram: Adepti Seeker's Stove](https://genshin-impact.fandom.com/wiki/Diagram%3A_Adepti_Seeker's_Stove))
- `The Great Banquet of the Adepti` = 속세 속 선인 잔치 ([The Great Banquet of the Adepti](https://genshin-impact.fandom.com/wiki/The_Great_Banquet_of_the_Adepti))
- 넣을 때: `'Adepti=한국어'`

### 10. Company (15회)

예문: 기사단 내부에는 Company가 있으며, 각 Company는 특정 분야에 특화된 기사들로 이루어진다. 1st Company는 총무를 맡아 몬드의 경제 산출, 규제 집행, 도시 관리 같은 일반 사무를 기획하고 조직한다. 이 Company는 전투 부상으로 전선에서 온전히 싸울 수 없게 된 기사를 우선적으로 받아들이며, Captain은 알려져 있지 않고 하인츠가 Field Officer로 있다. 부상으로 전선을 떠난 이들이 도시의 살림을 맡는 구조인 셈이다.

- 들어간 이름에 자주 나온 한국어: **번째** 2개, **삼인행…** 2개, **스승** 2개, **찾기** 2개
- `Part: Company` = 부품·꽃 장식 ([Part: Company](https://genshin-impact.fandom.com/wiki/Part%3A_Company))
- `Minghua Company` = 명화 상점 ([Minghua Company](https://genshin-impact.fandom.com/wiki/Minghua_Company))
- `In Expert Company? (I)` = 삼인행… 스승 찾기·첫 번째 ([In Expert Company? (I)](https://genshin-impact.fandom.com/wiki/In_Expert_Company%3F_(I)))
- `In Expert Company? (II)` = 삼인행… 스승 찾기·두 번째 ([In Expert Company? (II)](https://genshin-impact.fandom.com/wiki/In_Expert_Company%3F_(II)))
- `A Company Vanishing Into the Deep` = 층암거연에서 사라진 중대 ([A Company Vanishing Into the Deep](https://genshin-impact.fandom.com/wiki/A_Company_Vanishing_Into_the_Deep))
- 넣을 때: `'Company=한국어'`

### 11. Jinn (15회)

예문: 천사 대부분이 형체와 의식을 잃었지만, 몇몇 천사는 현대 티바트에 뚜렷한 흔적을 남겼다. 나부·말리카타의 **Jinn과 크바레나**는 각각 적색 모래바다의 역사와 수메르를 대재앙에서 지키는 일에 기여했고, 시빌은 목숨을 내주어 레무스를 위한 교향곡 **포보스**를 만들어 레무리아의 사람들이 천리의 굴레를 벗어나게 했다. 코이타르의 지도 아래 장인들이 만든 요정도 스네즈나야에서 활동하는 것으로 보인다. Jinn은 적색 모래바다에서, 크바레나는 수메르에서, 포보스는 레무리아에서, 요정은 스네즈나야에서 각각 창조자의 흔적을 이어 가는 존재로 보인다.

- 들어간 이름에 자주 나온 한국어: **지니** 2개
- `Jinn Shrine` = 지니 감실 ([Jinn Shrine](https://genshin-impact.fandom.com/wiki/Jinn_Shrine))
- `Mother of the Jinn` = 지니의 어머니 ([Mother of the Jinn](https://genshin-impact.fandom.com/wiki/Mother_of_the_Jinn))
- 넣을 때: `'Jinn=한국어'`

### 13. General Mahamatra (14회)

예문: 사이노는 수메르 아카데미아의 **General Mahamatra**로서 풍기관을 이끌며, 학자들에게 공포의 대상이 되는 번개 원소 신의 눈 사용자이자 플레이 가능한 캐릭터이다. 그는 냉정하고 무미건조한 청년으로, 아카데미아의 규율을 철저히 집행하고 도주자조차 사막 끝까지 추적해 처벌하는 냉혹한 면모로 수메르 전역에 이름을 떨치고 있다. 하지만 그가 단순히 가혹한 집행자인 것이 아니라, 지식 탐구자들이 그릇된 길로 빠지지 않도록 지키는 **수호자**이자 영원한 법을 지키려는 인물로 보인다.

- `The General Mahamatra on Duty` = 「대풍기관의 공무 시간」 ([The General Mahamatra on Duty](https://genshin-impact.fandom.com/wiki/The_General_Mahamatra_on_Duty))
- 넣을 때: `'General Mahamatra=한국어'`

### 14. Cyrus (13회)

예문: 몬드 지부를 이끄는 Cyrus는 길드에 사람이 크게 모자란 상황에서 천사의 몫 게시판을 모집 광고로 채우고, 위험한 모험담과 용기를 젊은이들에게 들려주는 방식으로 사람을 끌어들인다. 나타 지부를 이끄는 만사는 연기 주인 출신의 주술사이며, 그 지부는 극한 스포츠를 즐기기로 이름난 나무살이 부족원들이 대부분을 차지한다. 한쪽은 모험담으로 사람을 구하고, 다른 쪽은 이미 모험을 놀이처럼 즐기는 이들로 채워져 있는 셈이다.

- **같은 영어**: `Cyrus` = **사이러스** ([Cyrus (Mondstadt)](https://genshin-impact.fandom.com/wiki/Cyrus_(Mondstadt)))
- **같은 영어**: `"Cyrus"` = **「사이러스」** (["Cyrus"](https://genshin-impact.fandom.com/wiki/%22Cyrus%22))
- **같은 영어**: `Cyrus` = **키루스** ([Cyrus (Sumeru)](https://genshin-impact.fandom.com/wiki/Cyrus_(Sumeru)))
- `Letter to Cyrus` = 사이러스에게 보내는 편지 ([Letter to Cyrus](https://genshin-impact.fandom.com/wiki/Letter_to_Cyrus))
- 넣을 때: `'Cyrus=한국어'`

### 17. Dandelion Knight (11회)

예문: Jean Gunnhildr는 원신의 플레이 가능한 바람 캐릭터이며, 군힐드 가문 출신으로 페보니우스 기사단의 **대리 단장**을 맡는다. 그녀는 몬드의 자유에 규칙이 필요함을 알고 크고 작은 일까지 맡아 처리하며, 열다섯 살에 **Dandelion Knight** 칭호를 받았다. 검술로 이름이 높지만 스스로는 어둠을 베는 검보다 자유와 노래를 지키는 **방패**를 원한다고 여긴다.

- **같은 영어**: `Dandelion Knight` = **민들레 기사** ([Jean/Profile](https://genshin-impact.fandom.com/wiki/Jean%2FProfile))
- `Echo: Dandelion Knight` = 궤적·민들레 기사 ([Echo: Dandelion Knight](https://genshin-impact.fandom.com/wiki/Echo%3A_Dandelion_Knight))
- 넣을 때: `'Dandelion Knight=한국어'`

### 18. Ministry (11회)

예문: Ministry는 위험 인물과 범죄자에 대한 감시 명단을 여러 겹으로 운영한다. 북두와 여행자는 그중 **Special Attention List**에 이름을 올리고 있다. 지명 수배된 범죄자에게는 현상금이 걸린다. 첩보의 시야는 리월 밖까지 미쳐, 본의 아닌 제헌에서 감우는 리월과 몬드의 거물 보물 사냥단들이 공동 작전을 꾸미고 있다는 정보를 Ministry에서 받는다고 말한다. 명단으로 국내를 훑는 동시에 국경 밖의 움직임까지 정보로 잡아내는 셈이니, Ministry의 감시는 항구 도시 안쪽에만 머무는 것이 아니다.

- 들어간 이름에 자주 나온 한국어: **총무부** 3개
- `Ministry Missions` = 「총무부」의 일 ([Ministry Missions](https://genshin-impact.fandom.com/wiki/Ministry_Missions))
- `Ministry of Civil Affairs` = 총무부 ([Ministry of Civil Affairs](https://genshin-impact.fandom.com/wiki/Ministry_of_Civil_Affairs))
- `Ministry of Civil Affairs' Affidavit` = 총무부 서류 ([Ministry of Civil Affairs' Affidavit](https://genshin-impact.fandom.com/wiki/Ministry_of_Civil_Affairs'_Affidavit))
- 넣을 때: `'Ministry=한국어'`

### 20. Gunnhildr (10회)

예문: 바람의 가닥이던 바르바토스는 자유를 꿈꾸는 젊은 음유시인과 친구가 되었다. 그는 데카라비안의 도시를 떠나 얼어붙은 황무지에서 살던 군힐드 가문을 구했고, 그들이 보인 믿음이 그에게 힘을 주었다. 결국 바르바토스는 이름 없는 음유시인, 데카라비안에게 환멸을 느낀 연인 아모스, 붉은 머리의 전사, 그리고 Gunnhildr와 함께 폭풍의 신에게 맞설 군대를 일으켰다. 그들은 마침내 승리해 신을 쓰러뜨리고 백성을 폭풍의 우리에서 해방했다. 그러나 아모스와 음유시인은 그 희생자에 들었고, 이는 바르바토스에게 깊은 후회로 남았다.

- 들어간 이름에 자주 나온 한국어: **군힐드** 3개
- `Gunnhildr Clan` = 군힐드 가문 ([Gunnhildr Clan](https://genshin-impact.fandom.com/wiki/Gunnhildr_Clan))
- `Frederica Gunnhildr` = 프레데리카·군힐드 ([Frederica Gunnhildr](https://genshin-impact.fandom.com/wiki/Frederica_Gunnhildr))
- `Biography of Gunnhildr` = 군힐드 전기 ([Biography of Gunnhildr](https://genshin-impact.fandom.com/wiki/Biography_of_Gunnhildr))
- 넣을 때: `'Gunnhildr=한국어'`

### 21. Kokomi (10회)

예문: 일행은 간다르바 성곽에서 시작하기로 했으나 클레가 이름을 Grand Arbor Hill로 잘못 발음했고, 그래도 목적지에는 문제없이 도착했다. 그곳에서 만난 엠버, 유라, 콜레이는 타이나리가 바쁘다며 한동안 돌아오지 못할 것이라고 전했고, 그녀가 타이나리를 대신해 편지를 살펴보니 친구가 사막 어딘가에 있다는 것을 알 수 있었다. 일행은 하드라마베스 사막으로 이동해 영역 입구를 찾아냈고, 몹시 낡은 영역에서 그 주인인 이디이아와 Kokomi를 만났다. 낯선 땅에서 길을 찾는 일조차 클레의 엉뚱한 발음과 동행한 누군가가 타이나리를 대신해 편지를 살펴보는 식으로 풀려갔다는 점이, 이번 여행의 우여곡절된 성격을 잘 보여 준다.

- 들어간 이름에 자주 나온 한국어: **산고노미야** 4개, **코코미** 4개
- `Sangonomiya Kokomi` = 산고노미야 코코미 ([Sangonomiya Kokomi](https://genshin-impact.fandom.com/wiki/Sangonomiya_Kokomi))
- `Sangonomiya Kokomi: Reunion` = 산고노미야 코코미·재회 ([Sangonomiya Kokomi: Reunion](https://genshin-impact.fandom.com/wiki/Sangonomiya_Kokomi%3A_Reunion))
- `Sangonomiya Kokomi: The Deep` = 산고노미야 코코미·해연 ([Sangonomiya Kokomi: The Deep](https://genshin-impact.fandom.com/wiki/Sangonomiya_Kokomi%3A_The_Deep))
- `Sangonomiya Kokomi: Solitary Dreams` = 산고노미야 코코미·고독한 꿈 ([Sangonomiya Kokomi: Solitary Dreams](https://genshin-impact.fandom.com/wiki/Sangonomiya_Kokomi%3A_Solitary_Dreams))
- 넣을 때: `'Kokomi=한국어'`

### 22. Master (10회)

예문: 시틀라리는 70세가 넘은 뒤에 얼음 신의 눈을 얻었으며, **고대 이름 Ukumbuko**를 가지게 된 시점과 신의 눈을 얻은 시점이 일치했다. 또한 그녀는 자연사한 작은 동물의 뼈로 Itzpapa와 Citlalin이라는 인형 동료를 만들었다. 고대 이름 기록에서 시틀라리는 Memory 아래 위칠린, 마간의 Master와 함께 이름을 올리고 있으며, 이는 기록 속에서 두 사람이 엮여 있음을 보여주는 것으로 보인다.

- **같은 영어**: `Master` = **사범님 / 마스터** ([Narzissenkreuz](https://genshin-impact.fandom.com/wiki/Narzissenkreuz))
- 들어간 이름에 자주 나온 한국어: **주인** 7개, **연기** 5개, **마스터** 3개, **만능** 2개
- `Master Lu` = 노 어르신 ([Master Lu](https://genshin-impact.fandom.com/wiki/Master_Lu))
- `Master Hui` = 휘소 ([Master Hui](https://genshin-impact.fandom.com/wiki/Master_Hui))
- `Master Key` = 만능 열쇠 ([Master Key](https://genshin-impact.fandom.com/wiki/Master_Key))
- `Master Zhang` = 장 씨 ([Master Zhang](https://genshin-impact.fandom.com/wiki/Master_Zhang))
- `Master Sniper` = 백보천양 ([Master Sniper](https://genshin-impact.fandom.com/wiki/Master_Sniper))
- `Stealth Master` = 잠행 마스터 ([Stealth Master](https://genshin-impact.fandom.com/wiki/Stealth_Master))
- … 외 27개 (`data/generated/ko-name-candidates.json`)
- 넣을 때: `'Master=한국어'`

### 24. Captain / Captains (10회)

예문: 클립스의 훈련을 받은 다이루크는 결국 페보니우스 기사단에 입단했고, 입단 시험을 통과한 뒤 빠르게 이름을 알렸다. 그 과정에서 불 신의 눈을 얻었으며, 열네 살에 Cavalry Captain이 되어 그 직함을 가진 가장 어린 사람이 되었다. 나중에 케이아는 페보니우스 기사단의 최연소 Captain을 언급하며, 그 이전 기록 보유자가 전직 Cavalry Captain이었던 다이루크라고 말한다. 케이아가 그를 여전히 '이전 기록 보유자'로 꺼내 든다는 점은, 다이루크가 떠난 뒤에도 **그의 기록이 비교의 기준**으로 남아 있음을 보여주는 셈이다.

- **같은 영어**: `The Captain` = **대장** ([Capitano](https://genshin-impact.fandom.com/wiki/Capitano))
- `Captain Wu` = 오 선장 ([Captain Wu](https://genshin-impact.fandom.com/wiki/Captain_Wu))
- `Captain Ferment O'Juice` = 「발효 과일즙 캡틴」 ([Captain Ferment O'Juice](https://genshin-impact.fandom.com/wiki/Captain_Ferment_O'Juice))
- `The Infamous Merc Captain` = 바다를 종횡무진하는 용병계의 거물 ([The Infamous Merc Captain](https://genshin-impact.fandom.com/wiki/The_Infamous_Merc_Captain))
- `Shogunate Infantry Captain` = 막부 아시가루 두목 ([Shogunate Infantry Captain](https://genshin-impact.fandom.com/wiki/Shogunate_Infantry_Captain))
- `Captain Zoya Snezhevna's Report` = 조야·슈나이제브나 대위의 작전 보고서 ([Captain Zoya Snezhevna's Reports](https://genshin-impact.fandom.com/wiki/Captain_Zoya_Snezhevna's_Reports))
- 넣을 때: `'Captain|Captains=한국어'`

### 25. Elysium (9회)

예문: 휘페르보레아가 무너진 뒤 Mekhaneikos 기구는 대부분 잃혔다. SAMPO는 구조만 남고 제어 장치가 파괴되어 Scions의 기술로는 다시 만들 수 없었으나, 테르피케라우나스의 화살은 재현해냈다. SAMPO는 마모를 막으려 봉인되었고, 세대가 지나며 끝없는 재화와 식량을 낳아 Elysium을 이끈다는 **「삼포 맷돌」**이라는 종교적 상징이 되었다. 자기들이 다루지 못하는 기계가 풍요의 약속으로 감싸여 신앙의 자리에 남은 셈이다.

- 들어간 이름에 자주 나온 한국어: **낙원** 8개, **노드크라이** 3개, **달과** 3개, **의** 3개
- `Guide to Elysium` = 「낙원」의 인도 ([Guide to Elysium](https://genshin-impact.fandom.com/wiki/Guide_to_Elysium))
- `Elysium and the Moon` = 달과 낙원 ([Elysium and the Moon](https://genshin-impact.fandom.com/wiki/Elysium_and_the_Moon))
- `Teachings of Elysium` = 「낙원」의 가르침 ([Teachings of Elysium](https://genshin-impact.fandom.com/wiki/Teachings_of_Elysium))
- `Philosophies of Elysium` = 「낙원」의 철학 ([Philosophies of Elysium](https://genshin-impact.fandom.com/wiki/Philosophies_of_Elysium))
- `"Post-Apocalyptic Elysium"` = 「종말 후의 낙원」 (["Post-Apocalyptic Elysium"](https://genshin-impact.fandom.com/wiki/%22Post-Apocalyptic_Elysium%22))
- `Nod-Krai: Gateway to the Borderland Elysium` = 노드크라이·변방 낙원의 문 ([Nod-Krai: Gateway to the Borderland Elysium (Event)](https://genshin-impact.fandom.com/wiki/Nod-Krai%3A_Gateway_to_the_Borderland_Elysium_(Event)))
- … 외 2개 (`data/generated/ko-name-candidates.json`)
- 넣을 때: `'Elysium=한국어'`

### 26. Fontaine Research Institute of Kinetic Energy Engineering (9회)

예문: 알랭·기요틴은 약 400~500년 전 재앙 시대의 폰타인 역사 인물로, 수선화 십자원 출신이자 자연철학 학원 연구원, 그림자 사냥꾼, 그리고 **Fontaine Research Institute of Kinetic Energy Engineering의 설립 이사장**으로 기록된다. 어린 나이에 자연철학 학원에 들어갈 만큼 천재로 불렸으나, 동시에 연구 이외에는 무관심해 보일 정도로 엄격하고 진지한 인물로 묘사된다. 그는 훗날 여동생 마리안 기요틴의 모습을 본뜬 인형 산드로네를 만들고, 마지막 작품인 풀로니아를 산드로네의 조수로 남겨두었으며, 아르케의 힘 체계를 고안해 태엽 장치가 지금도 폰타인 공장에서 생산되는 데 기반을 남긴 인물로 보인다.

- `Fontaine Research Institute of Kinetic Energy Engineering Region` = 폰타인 운동 에너지 공학 연구원 구역 ([Fontaine Research Institute of Kinetic Energy Engineering Region](https://genshin-impact.fandom.com/wiki/Fontaine_Research_Institute_of_Kinetic_Energy_Engineering_Region))
- 넣을 때: `'Fontaine Research Institute of Kinetic Energy Engineering=한국어'`

### 33. Spark Knight (8회)

예문: 1.4 버전의 Windblume 축제 무렵, 진은 여행자가 올해의 **Windblume Star**로 선택되었다는 소식을 케이아를 통해 전했다. 바바라는 여행자가 리라를 대리 단장 진과 그 음유시인과 함께 돌려주지 않았느냐고 되묻는다. 노엘은 Spark Knight에게 자기 경험을 전해 달라고 했고, 그 직후 Master Jean이 둘을 근신시켰다는 이야기가 따라붙는다. 엘린은 진의 꼼꼼한 성격을 알기에 자기 이름이 보이면 답례 선물을 보낼까 봐 걱정한다.

- `An Invitation From the Spark Knight` = 불꽃 기사의 선물 ([An Invitation From the Spark Knight](https://genshin-impact.fandom.com/wiki/An_Invitation_From_the_Spark_Knight))
- 넣을 때: `'Spark Knight=한국어'`

### 34. Adeptal Energy (7회)

예문: 침옥 협곡에 처음 들어설 때 부금이 플레이어에게 Adeptal Energy를 사용할 수 있는 능력을 준다. Adeptal Energy로 조작하거나 사용할 수 있는 물체 위에는 뛰어오르는 잉어 모양 아이콘이 붙는다. 그 아이콘은 플레이어가 물체를 바라보고 범위 안에 있으면 노란색으로 바뀐다. 해당 버튼을 누르면 플레이어가 그 물체와 상호작용한다.

- `High Adeptal Energy Readings Ahead` = 고선력 반응 감지 ([High Adeptal Energy Readings Ahead](https://genshin-impact.fandom.com/wiki/High_Adeptal_Energy_Readings_Ahead))
- 넣을 때: `'Adeptal Energy=한국어'`

### 37. Fontainian (7회)

예문: 칼로레는 바다 거품 마을 밖으로 나간 몇 안 되는 멜뤼진이었지만, 5년 뒤 느비예트의 개혁을 반대하는 강경파에게 살인 누명을 쓰고 유인당한 끝에 결백을 증명하려 스스로를 희생했다. 이어진 보트린의 재판에서 그가 분노를 가장해 느비예트의 공정함을 드러내자, 사람들은 Iudex와 멜뤼진을 함께 신뢰하기 시작했다. 느비예트는 모든 멜뤼진을 그것/그것의가 아닌 **그녀/그녀의**로 부르도록 하는 법을 통과시켰고, 이들을 괴물로 대하는 이에게는 무거운 처벌이 내려지게 했다. 게임 시점에는 사실상 모든 Fontainian이 멜뤼진을 위험에서 지켜 주려 한다.

- 들어간 이름에 자주 나온 한국어: **폰타인** 4개, **메시지** 2개
- `A Fontainian Message` = 폰타인으로부터의 메시지 ([A Fontainian Message](https://genshin-impact.fandom.com/wiki/A_Fontainian_Message))
- `A Fontainian Message` = 폰타인식 메시지 ([A Fontainian Message (Achievement)](https://genshin-impact.fandom.com/wiki/A_Fontainian_Message_(Achievement)))
- `Fontainian Foie Gras` = 폰타인 푸아그라 ([Fontainian Foie Gras](https://genshin-impact.fandom.com/wiki/Fontainian_Foie_Gras))
- `Fontainian Onion Soup` = 폰타인 양파 수프 ([Fontainian Onion Soup](https://genshin-impact.fandom.com/wiki/Fontainian_Onion_Soup))
- `Recollections of a Fontainian` = 어느 폰타인 사람의 회상 ([Recollections of a Fontainian](https://genshin-impact.fandom.com/wiki/Recollections_of_a_Fontainian))
- `Fontainian Carpet: "Fair and Square"` = 폰타인 카펫-「네모반듯」 ([Fontainian Carpet: "Fair and Square"](https://genshin-impact.fandom.com/wiki/Fontainian_Carpet%3A_%22Fair_and_Square%22))
- 넣을 때: `'Fontainian=한국어'`

### 38. Guild (7회)

예문: 박람회는 보관 중이던 Guizhong Ballistae 시제품이 도난당하면서 문제를 맞았다. 야호다는 Guild에 책임을 돌리거나 선장의 분노를 사는 쪽 가운데 하나를 택해야 하는 처지에 놓였고, 도난을 조사하겠다고 약속했다. 아슈바티가 Guild 소속으로 창고 출입 권한이 있어 경비의 의심을 받지 않고 안에 들어갈 수 있다는 점이 거론되기도 했다. 이후 여행자와 귀빈들이 진상을 밝혀내면서 행사는 더 이상의 문제 없이 끝났다.

- 들어간 이름에 자주 나온 한국어: **길드** 4개, **모험가** 3개, **상회** 2개
- `Voynich Guild` = 보이니치 상회 ([Voynich Guild](https://genshin-impact.fandom.com/wiki/Voynich_Guild))
- `Adventurers' Guild` = 모험가 길드 ([Adventurers' Guild](https://genshin-impact.fandom.com/wiki/Adventurers'_Guild))
- `Mondstadt Wine Guild` = 몬드 주류업 길드 ([Mondstadt Wine Guild](https://genshin-impact.fandom.com/wiki/Mondstadt_Wine_Guild))
- `Feiyun Commerce Guild` = 비운 상회 ([Feiyun Commerce Guild](https://genshin-impact.fandom.com/wiki/Feiyun_Commerce_Guild))
- `Busy Adventurers' Guild` = 분주한 모험가 길드 ([Busy Adventurers' Guild](https://genshin-impact.fandom.com/wiki/Busy_Adventurers'_Guild))
- `Welcome to the Adventurers' Guild` = 모험가 길드에 온 걸 환영해 ([Welcome to the Adventurers' Guild](https://genshin-impact.fandom.com/wiki/Welcome_to_the_Adventurers'_Guild))
- 넣을 때: `'Guild=한국어'`

### 40. Lionfang Knight (7회)

예문: 몬드의 치안과 질서를 지키는 페보니우스 기사단에서 진은 **대리 단장** 자리를 맡고 있고, Dandelion/Lionfang Knight라는 칭호도 함께 지닌다. 페보니우스 기사단은 몬드의 수호자이자 도시의 검과 방패이며, 야생 몬스터로부터 도시와 주변 길을 지키는 일 못지않게 주민들 사이의 질서를 유지하는 일을 가장 중요한 책무로 삼는다. 그 기사단을 대신해 도시 곳곳의 소요를 처리하고 자유의 도시를 유지하기 위해 쉬지 않고 움직이는 사람이 진이다. 검과 방패라는 표현과 질서 유지라는 책무를 겹쳐 놓으면, 진이 서 있는 자리는 도시를 지키는 일과 도시를 다스리는 일이 한 사람에게 함께 얹힌 자리인 셈이다.

- `Calibration Beacon: "Lionfang Knight"` = 측량 표식-「라이언 기사」 ([Calibration Beacon: "Lionfang Knight"](https://genshin-impact.fandom.com/wiki/Calibration_Beacon%3A_%22Lionfang_Knight%22))
- 넣을 때: `'Lionfang Knight=한국어'`

### 41. Nicole Reeyn (7회)

예문: 천사는 천리가 창조한 존재로, 통일 문명 시대 셀레스티아의 신성한 사자로 활동하며 모든 생명을 동등히 사랑하라는 명령을 받았다. '완전무결한 정의의 중재자'로서 인간에게 언어와 자연의 철학을 가르치고 미래의 오라클을 전달했으며, 이들 가운데 최초는 코이타르, 마지막은 Nicole Reeyn이다.

- **같은 영어**: `Nicole Reeyn` = **니콜·라인** ([Nicole/Storyline](https://genshin-impact.fandom.com/wiki/Nicole%2FStoryline))
- 넣을 때: `'Nicole Reeyn=한국어'`

### 45. White Horse Adeptus (7회)

예문: White Horse Adeptus는 수많은 책과 민담에 그 자취가 남아 있는 존재다. 전설에 따르면 이 선인은 달빛 아래 하늘을 날며 리월항을 악령과 괴물로부터 지켰다고 한다. 한운은 그를 마신 전쟁 때 암왕제군을 도운 수수께끼의 흰 망아지로 기억한다. 한편 연비는 White Horse Adeptus가 Zhanzhu the Moon-Devourer처럼 꾸며낸 전설일지도 모른다고 했다고 요요가 전한다. 수호자로 회자되는 존재와 만들어낸 이야기로 의심받는 존재가 같은 이름 아래 놓여 있으니, 그 실체가 얼마나 가려져 있었는지를 보여주는 셈이다.

- **같은 영어**: `White Horse Adeptus` = **백마 선인** ([Zibai/Storyline](https://genshin-impact.fandom.com/wiki/Zibai%2FStoryline))
- `The White Horse Adeptus Meets the White Horse Adeptus in Liyue Harbor` = 「리월항에서 백마 선인을 보는 백마 선인」 ([The White Horse Adeptus Meets the White Horse Adeptus in Liyue Harbor](https://genshin-impact.fandom.com/wiki/The_White_Horse_Adeptus_Meets_the_White_Horse_Adeptus_in_Liyue_Harbor))
- 넣을 때: `'White Horse Adeptus=한국어'`

### 46. Windblume (7회)

예문: 윈드블룸의 초대가 끝날 무렵, 벤티와 여행자, 페이몬은 데카라비안의 탑을 찾아간다. 그곳에서 세 사람은 머리 위로 날아가는 드발린을 목격하는데, 그는 **자신만의 방식으로** Windblume를 축하하고 있었다. 도시의 축제 한복판이 아니라 데카라비안의 탑 위를 도는 것으로 축제에 참여한 셈이다.

- 들어간 이름에 자주 나온 한국어: **윈드블룸** 10개, **축제** 5개, **꽃** 4개, **바람** 4개
- `Windblume Ode` = 바람 꽃의 노래 ([Windblume Ode](https://genshin-impact.fandom.com/wiki/Windblume_Ode))
- `Windblume Gift` = 윈드블룸의 선물 ([Windblume Gift](https://genshin-impact.fandom.com/wiki/Windblume_Gift))
- `Windblume Wish` = 바람 꽃의 염원 ([Windblume Ode](https://genshin-impact.fandom.com/wiki/Windblume_Ode))
- `Windblume Kamera` = 「사진기·윈드블룸」 ([Windblume Kamera](https://genshin-impact.fandom.com/wiki/Windblume_Kamera))
- `Collei's Windblume` = 콜레이가 선물한 「바람의 꽃」 ([Collei's Windblume](https://genshin-impact.fandom.com/wiki/Collei's_Windblume))
- `Windblume Festival` = 윈드블룸 축제 ([Windblume Festival](https://genshin-impact.fandom.com/wiki/Windblume_Festival))
- … 외 9개 (`data/generated/ko-name-candidates.json`)
- 넣을 때: `'Windblume=한국어'`

### 59. Tepetlisaur / Tepetlisaurs (7회)

예문: 메아리 아이, 또는 나나치카얀은 나타의 여섯 부족 가운데 하나로, 굳센 바위 협곡의 협곡 안쪽에 자리한 정착지에서 살아가는 부족이다. 현재 족장은 파칼이며, 그는 스스로 메아리 아이의 족장임을 밝힌다. 이들은 광부이자 채굴꾼, 보석 감정에 능한 이들로, 19개의 채굴 팀을 꾸리고 Tepetlisaur 동료와 함께 최상급 광석을 캐낸다. 보석을 피부의 두 번째 층처럼 여기고 도구와 장신구를 보석으로 장식하는 습관은, 채굴과 감정이 이 부족의 삶에서 차지하는 몫을 보여주는 셈이다.

- 들어간 이름에 자주 나온 한국어: **산룡** 4개
- `Tepetlisaur Whelp` = 어린 산룡 ([Tepetlisaur Whelp](https://genshin-impact.fandom.com/wiki/Tepetlisaur_Whelp))
- `Tepetlisaur Traces` = 「산룡의 흔적」 ([Tepetlisaur Traces](https://genshin-impact.fandom.com/wiki/Tepetlisaur_Traces))
- `Valiant Tepetlisaur` = 용맹한 산룡 ([Valiant Tepetlisaur](https://genshin-impact.fandom.com/wiki/Valiant_Tepetlisaur))
- `Little Tepetlisaur &mdash; Treasure Hunter at Large` = 꼬마 산룡! 보물 발견! ([Little Tepetlisaur — Treasure Hunter at Large](https://genshin-impact.fandom.com/wiki/Little_Tepetlisaur_%E2%80%94_Treasure_Hunter_at_Large))
- 넣을 때: `'Tepetlisaur|Tepetlisaurs=한국어'`

### 48. Boss (6회)

예문: 축제가 끝나갈 무렵 야호다는 콜롬비나에게 선물을 건네고 작별을 고했지만, 도토레가 콜롬비나를 습격했다는 소식을 여행자에게 듣고 화를 냈다. 네페르는 여행자, 플린스, 라우마와 함께 도토레의 은신처로 떠나면서 야호다를 남겨 두고, 자기가 없는 동안 그녀가 정보 수집을 맡을 수 있다고 말했다. 야호다는 Boss에게 다들 무사히 돌아오라며 배웅했다. 도토레가 패배한 뒤 그녀는 기함에 찾아가 **새로 결성된 League**의 첫 회의를 알렸고, 그런 동맹이 노드크라이에서 유지될 수 있을지 의문을 던졌다.

- **같은 영어**: `"Boss"` = **「사장님」** (["Boss"](https://genshin-impact.fandom.com/wiki/%22Boss%22))
- **같은 영어**: `Boss` = **총두목** ([Boss (The Red and the Black)](https://genshin-impact.fandom.com/wiki/Boss_(The_Red_and_the_Black)))
- `Treasure Hoarders: Boss` = 보물 사냥단·「누님」 ([Treasure Hoarders: Boss](https://genshin-impact.fandom.com/wiki/Treasure_Hoarders%3A_Boss))
- 넣을 때: `'Boss=한국어'`

### 49. Himmel (6회)

예문: 어느 날 드발린은 Holy Lyre der Himmel의 연주에 이끌려 바르바토스 곁에 내려앉았다. 인간들은 당황했지만, 일곱 신의 바람의 신이자 몬드의 신인 바르바토스는 침착하게 **용의 아름다움을 노래했다**. 신이 드발린이 이해받기를 바란다는 것을 알아차린 드발린은 그의 곁에 머물기로 하고 친구가 되었으며, 인간의 말과 집정관의 노래 기법을 배웠다. 몬드의 신이 된 뒤 바르바토스 앞에 나타난 갓 태어난 바람의 용이 그의 음악에 반해 찾아온 것이 이 만남의 시작이었다는 이야기도 전해진다. 놀란 인간들 앞에서 신이 용을 두려움의 대상이 아니라 아름다움의 대상으로 노래했다는 점에서, 이 만남은 처음부터 이해를 향한 시도였다고 볼 수 있다.

- 들어간 이름에 자주 나온 한국어: **천공** 5개, **하프** 5개, **복구된** 2개
- `Holy Lyre der Himmel` = 천공의 하프 ([Holy Lyre der Himmel](https://genshin-impact.fandom.com/wiki/Holy_Lyre_der_Himmel))
- `Damaged Holy Lyre der Himmel` = 망가진 천공의 하프 ([Damaged Holy Lyre der Himmel](https://genshin-impact.fandom.com/wiki/Damaged_Holy_Lyre_der_Himmel))
- `Retrieve the Holy Lyre der Himmel` = 천공의 하프 탈환 ([Retrieve the Holy Lyre der Himmel](https://genshin-impact.fandom.com/wiki/Retrieve_the_Holy_Lyre_der_Himmel))
- `State of the Holy Lyre der Himmel` = 보물의 상태 ([State of the Holy Lyre der Himmel](https://genshin-impact.fandom.com/wiki/State_of_the_Holy_Lyre_der_Himmel))
- `Partially Repaired Holy Lyre der Himmel` = 조금 복구된 천공의 하프 ([Partially Repaired Holy Lyre der Himmel](https://genshin-impact.fandom.com/wiki/Partially_Repaired_Holy_Lyre_der_Himmel))
- `Completely Repaired Holy Lyre der Himmel` = 완벽하게 복구된 천공의 하프 ([Completely Repaired Holy Lyre der Himmel](https://genshin-impact.fandom.com/wiki/Completely_Repaired_Holy_Lyre_der_Himmel))
- 넣을 때: `'Himmel=한국어'`

### 51. Ivanovna (6회)

예문: I. Ivanovna가 결혼을 앞두고 떠나기로 하자, 앨리스, 아스트로맨서·바르벨로스·트리스메기스토스, 아냐·「마리」·안데르스도테르, 니콜, 라인도티르는 **"예언"으로 위장한 편지**를 보내 마지막 만남을 청했다. 또한 아냐·「마리」·안데르스도테르가 두린을 실체화하려 할 때도 아스트로맨서·바르벨로스·트리스메기스토스의 점성술은 라인도티르의 연금술, 앨리스의 마법과 함께 쓰였다. 동료의 이별과 마지막 소원을 뒷받침하는 아스트로맨서·바르벨로스·트리스메기스토스의 점성술은, 마녀회 안에서 단순한 예언을 넘어 관계를 이어주는 매개체로 보인다.

- `Ioanna Ivanovna N.` = 요안나·이바노브나·N ([I. Ivanovna N.](https://genshin-impact.fandom.com/wiki/I._Ivanovna_N.))
- 넣을 때: `'Ivanovna=한국어'`

### 52. Kamaji (6회)

예문: 수장 자리는 쿠죠 가문이 지킨다. 쿠죠 타카유키는 텐료 봉행이었으나 지금은 가택연금 상태이고, 쿠죠 카마지가 가주 대행으로서 이나즈마성의 행정 실무를 담당한다. Kamaji는 쇼군의 새 정책에 의문을 품으면서도 터놓고 이야기할 상대가 없어 속으로만 삼킨 채 업무를 이어 간다. 군사 부문에서는 쿠죠 사라가 텐료 봉행(天領奉行) 병력의 지휘관으로서 과감하고 결단력 있으며 전투에 능한 인물로 서 있다.

- `Kujou Kamaji` = 쿠죠 카마지 ([Kujou Kamaji](https://genshin-impact.fandom.com/wiki/Kujou_Kamaji))
- 넣을 때: `'Kamaji=한국어'`

### 54. Luna (6회)

예문: Luna I의 의뢰 현장에서 여행자 일행은 캐서린과 다시 만나고, 페이몬은 캐서린이 훨씬 이야기하기 좋은 상대라며 다시 떠나지 말아 달라고 부탁한다. 페이몬은 정말 반가워서 그러는 거라며 캐서린이 최고라고 덧붙인다. 캐서린은 무엇을 도와드리면 되겠느냐고 묻고, 할 수 있는 일은 무엇이든 돕겠다고 답한다. 그러면서도 칭찬에 감사하다고 말한 뒤, 농담을 하려던 것이라면 알아듣지 못했다고 덧붙인다. **페이몬이 거듭 반가움을 쏟아내는 것과, 그 칭찬을 농담으로도 받아들이지 못하는 캐서린의 응대가 나란히 놓이며 두 사람의 온도차가 드러난다.**

- 들어간 이름에 자주 나온 한국어: **달** 3개
- `Luna Sigil` = 달의 인장 ([Luna Sigil](https://genshin-impact.fandom.com/wiki/Luna_Sigil))
- `La Luna Rossa` = 붉게 물든 달 ([La Luna Rossa](https://genshin-impact.fandom.com/wiki/La_Luna_Rossa))
- `Somnias a Luna` = 달과 함께 잠든 밤 ([Somnias a Luna](https://genshin-impact.fandom.com/wiki/Somnias_a_Luna))
- `Luna Treasure Compass` = 달의 보물찾기 나침반 ([Luna Treasure Compass](https://genshin-impact.fandom.com/wiki/Luna_Treasure_Compass))
- 넣을 때: `'Luna=한국어'`

### 57. Sangonomiya (6회)

예문: 칸나즈카는 "신이 머물지 않는 언덕"이라는 뜻의 땅으로, 막부와 Sangonomiya가 서로 자기 영토라 주장하는 **분쟁 지역**이다. 라이덴 쇼군을 믿는 Narukami 사람들과 Watatsumi Omikami를 믿는 Sangonomiya 사람들 사이의 갈등은 안수령이 시행된 뒤 더 깊어졌고, Sangonomiya의 반란을 진압하려는 텐료 봉행(天領奉行)은 쿠죠 병영에 쇼군의 군대를 주둔시켰다. 쇼군의 군대는 병력이 더 많고 훈련이 잘 되어 있으며 장비도 좋아 승리가 확실해 보였다. 신이 머물지 않는다는 이름의 땅에서 어느 신을 섬기느냐로 갈린다는 대비가 드러난다고 볼 수 있다.

- 들어간 이름에 자주 나온 한국어: **산고노미야** 8개, **코코미** 5개, **산호궁** 3개
- `Sangonomiya Clan` = 산고노미야 가문 ([Sangonomiya Clan](https://genshin-impact.fandom.com/wiki/Sangonomiya_Clan))
- `Sangonomiya Kokomi` = 산고노미야 코코미 ([Sangonomiya Kokomi](https://genshin-impact.fandom.com/wiki/Sangonomiya_Kokomi))
- `Sangonomiya Shrine` = 산호궁 ([Sangonomiya Shrine](https://genshin-impact.fandom.com/wiki/Sangonomiya_Shrine))
- `Sangonomiya Chronicles` = 산호궁기 ([Sangonomiya Chronicles](https://genshin-impact.fandom.com/wiki/Sangonomiya_Chronicles))
- `Sangonomiya Supplications` = 산고노미야의 기도 ([Sangonomiya Supplications](https://genshin-impact.fandom.com/wiki/Sangonomiya_Supplications))
- `Inazuma: Sangonomiya Crest` = 이나즈마·산고노미야의 문장 ([Inazuma: Sangonomiya Crest](https://genshin-impact.fandom.com/wiki/Inazuma%3A_Sangonomiya_Crest))
- … 외 6개 (`data/generated/ko-name-candidates.json`)
- 넣을 때: `'Sangonomiya=한국어'`

### 58. Tail (6회)

예문: 대전의 거점은 **The Cat의 Tail**이다. 「일곱 성인의 소환」에 도전하라!의 첫 단계를 완료하면 The Cat의 Tail이 지도에 표시되고, 워프 포인트의 주요 지점 목록에도 이름을 올린다. 란 누님과의 대화에서는 일곱 성인의 소환 대전 인터페이스가 바로 열린다. 지도 설정의 플레이어 검색을 켜면 오픈 월드 매칭이 지도에 나타나며, 지도 알림 항목에도 일곱 성인의 소환이 들어 있다. 퀘스트 첫 단계와 지도 표시가 맞물리고 대화에서 곧장 대전 화면이 열리는 것을 보면, 이 모드는 지도와 NPC 대화 양쪽에 접점을 두고 있다고 볼 수 있다.

- 들어간 이름에 자주 나온 한국어: **꼬리** 10개, **캣테일** 3개, **꽁지** 2개, **꽁지깃** 2개
- `Cat's Tail` = 캣테일 술집 ([The Cat's Tail](https://genshin-impact.fandom.com/wiki/The_Cat's_Tail))
- `Tail Sweep` = 꼬리 부채질 ([Tail Sweep](https://genshin-impact.fandom.com/wiki/Tail_Sweep))
- `Lizard Tail` = 도마뱀 꼬리 ([Lizard Tail](https://genshin-impact.fandom.com/wiki/Lizard_Tail))
- `Whirling Tail` = 꼬리 속공 ([Whirling Tail](https://genshin-impact.fandom.com/wiki/Whirling_Tail))
- `Tail of Boreas` = 북풍의 꼬리 ([Tail of Boreas](https://genshin-impact.fandom.com/wiki/Tail_of_Boreas))
- `Faded Emerald Tail` = 빛바랜 푸른 꽁지 ([Faded Emerald Tail](https://genshin-impact.fandom.com/wiki/Faded_Emerald_Tail))
- … 외 14개 (`data/generated/ko-name-candidates.json`)
- 넣을 때: `'Tail=한국어'`

### 61. The Cat (6회)

예문: 대전의 거점은 **The Cat의 Tail**이다. 「일곱 성인의 소환」에 도전하라!의 첫 단계를 완료하면 The Cat의 Tail이 지도에 표시되고, 워프 포인트의 주요 지점 목록에도 이름을 올린다. 란 누님과의 대화에서는 일곱 성인의 소환 대전 인터페이스가 바로 열린다. 지도 설정의 플레이어 검색을 켜면 오픈 월드 매칭이 지도에 나타나며, 지도 알림 항목에도 일곱 성인의 소환이 들어 있다. 퀘스트 첫 단계와 지도 표시가 맞물리고 대화에서 곧장 대전 화면이 열리는 것을 보면, 이 모드는 지도와 NPC 대화 양쪽에 접점을 두고 있다고 볼 수 있다.

- 들어간 이름에 자주 나온 한국어: **고양이** 41개, **네코** 10개, **해적** 7개, **신사** 3개
- `Cat Toy` = 고양이 장난감 ([Cat Toy](https://genshin-impact.fandom.com/wiki/Cat_Toy))
- `Cat Food` = 고양이 밥 ([Cat Food (To Catch a Kitten)](https://genshin-impact.fandom.com/wiki/Cat_Food_(To_Catch_a_Kitten)))
- `Cat Food` = 고양이 사료 ([Cat Food (To Gaze Upon the Dreaming Pale Crown)](https://genshin-impact.fandom.com/wiki/Cat_Food_(To_Gaze_Upon_the_Dreaming_Pale_Crown)))
- `Black Cat` = 흑묘 ([Black Cat](https://genshin-impact.fandom.com/wiki/Black_Cat))
- `Scary Cat` = 고양이 해적 ([Scary Cat](https://genshin-impact.fandom.com/wiki/Scary_Cat))
- `Ujola Cat` = 우욜라 고양이 ([Ujola Cat](https://genshin-impact.fandom.com/wiki/Ujola_Cat))
- … 외 44개 (`data/generated/ko-name-candidates.json`)
- 넣을 때: `'The Cat=한국어'`

### 62. Wolf (6회)

예문: 기사단은 전통적으로 단 한 명의 대단장이 이끈다. 대단장이 자리를 비우거나 직무를 수행할 수 없으면 Master가 예비로서 대리 단장으로 그 직무를 대행한다. 현재 대단장은 바르카이고, 진은 대리 단장이자 Master다. **Lion**과 **Wolf** 칭호는 뛰어난 지도력을 지닌 이에게만 주어지며, 그런 인물은 언젠가 대단장이 될 것으로 기대된다.

- 들어간 이름에 자주 나온 한국어: **늑대** 14개, **북풍** 3개
- `Wolf Boy` = 늑대소년 ([Razor/Profile](https://genshin-impact.fandom.com/wiki/Razor%2FProfile))
- `Iron Wolf` = 「늑대와 강철」 ([Iron Wolf](https://genshin-impact.fandom.com/wiki/Iron_Wolf))
- `Wolf Pact` = 늑대족의 맹약 ([Wolf Pact](https://genshin-impact.fandom.com/wiki/Wolf_Pact))
- `Wolf-Fang` = 늑대 송곳니 ([Wolf-Fang](https://genshin-impact.fandom.com/wiki/Wolf-Fang))
- `Northwind Wolf` = 북풍의 푸른 늑대 ([Wolf-Fang](https://genshin-impact.fandom.com/wiki/Wolf-Fang))
- `Pale-Furred Wolf` = 푸른털 늑대 ([Pale-Furred Wolf](https://genshin-impact.fandom.com/wiki/Pale-Furred_Wolf))
- … 외 10개 (`data/generated/ko-name-candidates.json`)
- 넣을 때: `'Wolf=한국어'`

### 63. Adjuvant (5회)

예문: 일부 물체는 푸른 봉인에 감싸여 있어, Adjuvant의 **에너지 1**을 지불해야 상호작용할 수 있다. 보물상자, 명석등, 유적의 촛불, Time Trial Challenge가 그 대상이다.

- 들어간 이름에 자주 나온 한국어: **유명석** 2개, **촉매** 2개
- `stone Adjuvant` = 유명석 촉매 ([Lumenstone Adjuvant](https://genshin-impact.fandom.com/wiki/Lumenstone_Adjuvant))
- `Enhance the Lumenstone Adjuvant` = 유명석 촉매 강화 ([Enhance the Lumenstone Adjuvant](https://genshin-impact.fandom.com/wiki/Enhance_the_Lumenstone_Adjuvant))
- 넣을 때: `'Adjuvant=한국어'`

### 64. Ancient Palace (5회)

예문: 드래곤 스파인은 몬드 남동부에 속한 지역으로, 몬드 남쪽에 솟은 눈 덮인 높은 산이다. 고대 유적과 만년설 지대가 뒤덮인 거대한 산이며, 그 안에는 두린의 유해가 남아 있다. 두린이 추락하기 전, 이 산은 Vindagnyr라는 이름으로 불렸다. 만년의 얼음 아래에는 고대 도시 Entombed City - Ancient Palace가 조용히 잠들어 있다.

- `Entombed City &ndash; Ancient Palace` = 눈에 묻힌 도시·고궁 ([Entombed City - Ancient Palace](https://genshin-impact.fandom.com/wiki/Entombed_City_-_Ancient_Palace))
- 넣을 때: `'Ancient Palace=한국어'`

### 66. Carter (5회)

예문: 알랭·기요틴은 400~500년 전 수선화 십자원에서 자란 인물이다. 대재앙 때 부소장이 전장으로 떠나 기관이 해산된 뒤, 바질·엘튼의 부탁으로 엠마누엘·기요틴에게 양자로 들어가 마리안과 함께 살았다. 그는 어린 나이에 자연철학 학원의 연구원이 되어 조수 카터·슈르비우스보다도 훨씬 젊은 나이에 그 자리에 올랐고, 훗날 Fontaine Research Institute of Kinetic Energy Engineering의 창립 이사가 되었다. 겉으로는 **차갑고 완고한 연구자**로만 보였으나, 마리안, Carter, 르네·드·페트리코, Jakob Ingold와 깊은 정을 나누었고, 르네와 야코브·잉골드는 수선화 십자원 시절부터 함께 자란 친구였다.

- `Carter Scherbius` = 카터·슈르비우스 ([Carter Scherbius](https://genshin-impact.fandom.com/wiki/Carter_Scherbius))
- 넣을 때: `'Carter=한국어'`

### 67. Church (5회)

예문: 노예 소녀 바네사의 외침에 바르바토스가 다시 깨어나 자신의 술책으로 그녀의 반란을 도왔고, 귀족정은 무너졌다. 바네사는 귀족이 다시 권력을 잡지 못하도록 페보니우스 기사단을 세웠고, Dandelion Knight로 불리며 Church의 힘을 다시 세웠다. 이 무렵 바람 사신수가 세워져 안드리우스의 영혼은 북풍의 늑대, 드발린은 Dragon of the East, 셀레스티아로 올라간 바네사는 서풍의 매, Dandelion Knight의 칭호를 지닌 자는 Lion of the South가 되었다. 노예였던 소녀가 도시의 질서를 다시 세우는 자리에 선 셈이다.

- 들어간 이름에 자주 나온 한국어: **성당** 2개
- `Church of Favonius` = 페보니우스 성당 ([Church of Favonius](https://genshin-impact.fandom.com/wiki/Church_of_Favonius))
- `Spear of the Church` = 성당 창술 ([Spear of the Church](https://genshin-impact.fandom.com/wiki/Spear_of_the_Church))
- 넣을 때: `'Church=한국어'`

### 70. Entombed City (5회)

예문: 드래곤 스파인은 몬드 남동부에 속한 지역으로, 몬드 남쪽에 솟은 눈 덮인 높은 산이다. 고대 유적과 만년설 지대가 뒤덮인 거대한 산이며, 그 안에는 두린의 유해가 남아 있다. 두린이 추락하기 전, 이 산은 Vindagnyr라는 이름으로 불렸다. 만년의 얼음 아래에는 고대 도시 Entombed City - Ancient Palace가 조용히 잠들어 있다.

- 들어간 이름에 자주 나온 한국어: **눈에** 3개, **도시** 3개, **묻힌** 3개
- `Memory of the Entombed City` = 눈에 묻힌 도시의 기억 ([Memory of the Entombed City](https://genshin-impact.fandom.com/wiki/Memory_of_the_Entombed_City))
- `Entombed City &ndash; Outskirts` = 눈에 묻힌 도시·근교 ([Entombed City - Outskirts](https://genshin-impact.fandom.com/wiki/Entombed_City_-_Outskirts))
- `Entombed City &ndash; Ancient Palace` = 눈에 묻힌 도시·고궁 ([Entombed City - Ancient Palace](https://genshin-impact.fandom.com/wiki/Entombed_City_-_Ancient_Palace))
- 넣을 때: `'Entombed City=한국어'`

### 75. Lion (5회)

예문: 기사단은 전통적으로 단 한 명의 대단장이 이끈다. 대단장이 자리를 비우거나 직무를 수행할 수 없으면 Master가 예비로서 대리 단장으로 그 직무를 대행한다. 현재 대단장은 바르카이고, 진은 대리 단장이자 Master다. **Lion**과 **Wolf** 칭호는 뛰어난 지도력을 지닌 이에게만 주어지며, 그런 인물은 언젠가 대단장이 될 것으로 기대된다.

- 들어간 이름에 자주 나온 한국어: **사자** 4개, **돌사자** 2개, **키메라** 2개
- `Winged Lion Down` = 「블랙 키메라 다운」 ([Winged Lion Down](https://genshin-impact.fandom.com/wiki/Winged_Lion_Down))
- `Temple of the Lion` = 남풍 사자의 사당 ([Temple of the Lion](https://genshin-impact.fandom.com/wiki/Temple_of_the_Lion))
- `Chimeric Winged Lion` = 날개 사자 키메라 ([Chimeric Winged Lion](https://genshin-impact.fandom.com/wiki/Chimeric_Winged_Lion))
- `Stone Lion Statue: The Knowing` = 돌사자-「백해」 ([Stone Lion Statue: The Knowing](https://genshin-impact.fandom.com/wiki/Stone_Lion_Statue%3A_The_Knowing))
- `Stone Lion Statue: The Warding` = 돌사자-「천록」 ([Stone Lion Statue: The Warding](https://genshin-impact.fandom.com/wiki/Stone_Lion_Statue%3A_The_Warding))
- `Deep Within the Temple of the Lion` = 사자의 사당으로 ([Deep Within the Temple of the Lion](https://genshin-impact.fandom.com/wiki/Deep_Within_the_Temple_of_the_Lion))
- … 외 2개 (`data/generated/ko-name-candidates.json`)
- 넣을 때: `'Lion=한국어'`

### 76. Qingce (5회)

예문: 바다 신 오셀은 모락스의 거대한 돌창에 봉인되어 지금의 고운각이 되었다. 봉인된 뒤에도 그 돌기둥들은 신성을 띠었지만, 동시에 원한과 저주를 품게 되었다. 지금의 Mt. Qingce 지역을 장악했던 교룡은 '높은 곳'에서 모락스와 맞붙었다가 죽임을 당했고, 죽은 뒤에도 그 힘은 땅으로 스며들어 계속 영향을 미쳤다. 모락스는 그 잔재를 억누르기 위해 교룡의 각 부분을 하나씩 물리쳐 봉인했다. 오로바시 님 역시 모락스에게 패한 뒤 어둠의 외해로 물러났다. 봉인에 쓰인 돌기둥이 신성을 얻는 동시에 저주를 품게 되고, 죽은 교룡의 힘이 땅을 통해 계속 새어 나온다는 점에서, 리월에서의 전쟁은 이긴 뒤에도 끝나지 않는 종류의 싸움이었던 셈이다.

- 들어간 이름에 자주 나온 한국어: **경책** 11개, **가정식** 3개, **산장** 2개
- `Qingce Village` = 경책 산장 ([Qingce Village](https://genshin-impact.fandom.com/wiki/Qingce_Village))
- `Qingce Stir Fry` = 경책 가정식 ([Qingce Stir Fry](https://genshin-impact.fandom.com/wiki/Qingce_Stir_Fry))
- `"The Qingce Kid"` = 「소경책」 (["The Qingce Kid"](https://genshin-impact.fandom.com/wiki/%22The_Qingce_Kid%22))
- `Guests in Qingce` = 경책의 손님 ([Guests in Qingce](https://genshin-impact.fandom.com/wiki/Guests_in_Qingce))
- `The Siege of Qingce` = 포위된 경책 ([The Siege of Qingce](https://genshin-impact.fandom.com/wiki/The_Siege_of_Qingce))
- `Qingce Household Dish` = 정겨운 경책 가정식 ([Qingce Household Dish](https://genshin-impact.fandom.com/wiki/Qingce_Household_Dish))
- … 외 8개 (`data/generated/ko-name-candidates.json`)
- 넣을 때: `'Qingce=한국어'`

### 77. Relics (5회)

예문: Blazing Beasts에서 가장 이름난 구성원은 데히야다. 그녀는 쿠사일라와 마지막으로 다툰 뒤 어린 나이에 이 무리에 들어왔고, 쿠사일라가 몰래 무리를 움직여 데히야를 구해 적왕의 Relics의 방해 없이 Dakan Al-Ahmar를 떠나게 했다.

- 들어간 이름에 자주 나온 한국어: **유물** 8개, **모형** 3개, **번째** 3개, **연구** 2개
- `Solar Relic` = 태양의 유물 ([Solar Relic](https://genshin-impact.fandom.com/wiki/Solar_Relic))
- `Stolen Relic` = 도난당한 유물 ([Stolen Relic](https://genshin-impact.fandom.com/wiki/Stolen_Relic))
- `The Lost Relic` = 「분실된」 유물 ([The Lost Relic](https://genshin-impact.fandom.com/wiki/The_Lost_Relic))
- `Relic from Guyun` = 고운한림의 해골 ([Relic from Guyun](https://genshin-impact.fandom.com/wiki/Relic_from_Guyun))
- `Relics of Seirai` = 세이라이의 옛 보물 ([Relics of Seirai](https://genshin-impact.fandom.com/wiki/Relics_of_Seirai))
- `Relics of the Fallen Grace` = 몰락한 성소 ([Relics of the Fallen Grace](https://genshin-impact.fandom.com/wiki/Relics_of_the_Fallen_Grace))
- … 외 7개 (`data/generated/ko-name-candidates.json`)
- 넣을 때: `'Relics=한국어'`

### 81. Spiritways (5회)

예문: 연기 주인의 명룡은 특수한 형태의 원소 시야로 보이지 않는 물체를 드러내고, Spiritseeker State에서 플로지스톤을 원격으로 흡수하거나 Ancient Inscribed Rings와 영력 그라피티, Nightspirit Sigils, Phlogiston Engravings의 효과를 발동한다. 공중에서 높이 뛰어올라 천천히 활강하는 것도 이 사우리안의 몫이다. 샘물 무리의 어룡은 물이나 액체 열소 속에서도 해를 입지 않고 헤엄치고, Jet-Set Eddies에서 높이 도약하며, Spiritways를 타고 Unveiling Scripts를 모은다. 꽃깃회의 깃룡은 열소를 소모해 더 높이 날고, Recon Targets를 공격해 열소를 회복하며, 기체 열소에 해를 입지 않고 Phlogiston Wind Tunnels를 탄다.

- **같은 영어**: `Spiritway` = **흐르는 영혼길** ([Spiritway](https://genshin-impact.fandom.com/wiki/Spiritway))
- 넣을 때: `'Spiritways=한국어'`

### 83. Village Keepers (5회)

예문: 실종된 Village Keepers를 쫓는 과정에서 그는 목격자에게 처음부터 다시 말해 보라고 요구했고, 사라진 학자들을 보았는지 물었다. 체포한 이들에 대해서는 조직 깊숙한 곳이 아니라 바닥에서 물건을 다루는 중개상들일 뿐이라고 평했다. 자신의 위치를 허락 없이 흘린 나빌에 대해서는 지금은 따질 때가 아니라고 넘어갔다. 아카데미아가 Village Keepers를 납치하는 데 동원한 주다르는 사이노 앞에서 몸이 찢길까 두려워하며 움츠러들었고, 결국 데히야와 알하이탐, 사이노 등에게 처벌받도록 넘겨졌다.

- `The Missing Village Keepers` = 실종된 마을 지킴이 ([The Missing Village Keepers](https://genshin-impact.fandom.com/wiki/The_Missing_Village_Keepers))
- 넣을 때: `'Village Keepers=한국어'`

### 85. Waypoint (5회)

예문: 일곱신상은 탐사와 이동, 부활과 치유, 원소 전환, 보상까지 성격이 다른 여러 기능을 한 몸에 묶어 둔 시설이다. 발견해 한 번 공명하면 지도에서 해당 권역이 밝혀지고, 권역 하나에 석상 하나가 대응한다. 잠겨 있던 워프 포인트도 이때 대부분 함께 드러나며, 석상에 닿기 전에는 그 권역에서 이미 해금한 Waypoint만 지도에 보인다. 같은 권역의 원정 옵션이 열리는 것도 이 공명에서다. 석상 자체가 워프 포인트 노릇을 하니, 지도가 열리는 순간 이동 거점이 하나 늘어나는 셈이다.

- 들어간 이름에 자주 나온 한국어: **워프** 6개, **포인트** 6개, **포켓** 2개
- `Portable Waypoint` = 포켓 워프 포인트 ([Portable Waypoint](https://genshin-impact.fandom.com/wiki/Portable_Waypoint))
- `Teleport Waypoint` = 워프 포인트 ([Teleport Waypoint](https://genshin-impact.fandom.com/wiki/Teleport_Waypoint))
- `Sub-Space Waypoint` = 외경 워프 포인트 ([Sub-Space Waypoint](https://genshin-impact.fandom.com/wiki/Sub-Space_Waypoint))
- `Waverider Waypoint` = 파도 배 워프 포인트 ([Waverider Waypoint](https://genshin-impact.fandom.com/wiki/Waverider_Waypoint))
- `Corrupted Waypoints` = 오염된 워프 포인트 ([Corrupted Waypoint](https://genshin-impact.fandom.com/wiki/Corrupted_Waypoint))
- `Instructions: Portable Waypoint` = 설명서: 포켓 워프 포인트 ([Instructions: Portable Waypoint](https://genshin-impact.fandom.com/wiki/Instructions%3A_Portable_Waypoint))
- 넣을 때: `'Waypoint=한국어'`

### 86. Yue (5회)

예문: 향릉은 원신의 플레이 가능한 불 캐릭터로, 만민당에서 아버지 묘 사부와 함께 가게를 꾸리는 주방장이다. 그녀는 특정 요리 유파에 자신을 가두는 것을 싫어하며, 모라보다 손님의 미소를 더 값지게 여기는 요리사다. 리월의 Li·Yue 두 유파가 겉치레와 값비싼 재료 경쟁으로 흐르던 판에서, 그녀의 "좋은 음식은 좋은 음식일 뿐!"이라는 신조는 그런 속물근성에 맞서는 것이었다.

- 들어간 이름에 자주 나온 한국어: **악천** 2개
- `Yue Chuan` = 악천 ([Yue Chuan](https://genshin-impact.fandom.com/wiki/Yue_Chuan))
- `Little Yue` = 소월 ([Little Yue](https://genshin-impact.fandom.com/wiki/Little_Yue))
- `Yue Chuan's Drifting Bottle` = 악천의 해류병 ([Yue Chuan's Drifting Bottle](https://genshin-impact.fandom.com/wiki/Yue_Chuan's_Drifting_Bottle))
- 넣을 때: `'Yue=한국어'`

### 226. Water Imp / Water Imps (5회)

예문: 베스나는 별의 쐐기를 지닌 바람 요정이며, 보댜니차는 신의 눈을 지닌 Water Imp로 코롤레프스키 극단의 Prima Donna를 맡고 있다. 풀치넬라는 설국 요정의 혈통 덕분에 원소 물을 다룰 수 있다. 아크빌리나는 요정 귀족이 나라를 다스리던 시대로 돌아가기를 바라는 무리를 배신자로 여긴다. 그 밖의 요정들은 각자 일을 하며 살아가거나 범죄 조직에 몸담기도 한다. 얼음의 여왕의 통치를 받아들이는 이들과 요정 귀족의 시대를 그리워하는 이들이 한 종족 안에서 갈린다는 점이 아크빌리나의 이런 평가에서 드러난다.

- 들어간 이름에 자주 나온 한국어: **님프** 3개, **물** 3개, **왕국** 2개
- `Water Imp Prince` = 「물 님프 왕자」 ([Water Imp Prince](https://genshin-impact.fandom.com/wiki/Water_Imp_Prince))
- `Assaulting the Water Imp Kingdom` = 돌입! 물 님프 왕국 ([Assaulting the Water Imp Kingdom](https://genshin-impact.fandom.com/wiki/Assaulting_the_Water_Imp_Kingdom))
- `Assaulting the Water Imp Kingdom Once More` = 재돌입! 물 님프 왕국 ([Assaulting the Water Imp Kingdom Once More](https://genshin-impact.fandom.com/wiki/Assaulting_the_Water_Imp_Kingdom_Once_More))
- 넣을 때: `'Water Imp|Water Imps=한국어'`

### 87. Barbeloth Trismegistus (4회)

예문: Barbeloth Trismegistus는 마녀회의 마녀이자 코드명 'B'를 가진 점성술사이며, 모나의 스승이자 앨리스의 친구이자 라이벌이다. 그녀는 국가는 물론 티바트와 세상 전체의 운명까지 읽어내는 예언자로, 시뮬랑카를 창조한 세 마녀 중 하나이자 그곳의 예언의 여신이다. 이처럼 티바트의 운명까지 읽는 능력과 시뮬랑카를 창조한 위치, 두린의 운명에 개입한 기록, 모나에게 보낸 편지들까지 함께 보면, 그녀는 단순한 점성술사가 아니라 세계의 운명에 깊이 관여하는 마녀로 보인다.

- **옛 판에만**: `Barbeloth Trismegistus` = **바르벨로스** ([Barbeloth 2024-01-05 판](https://genshin-impact.fandom.com/wiki/Barbeloth?oldid=1459603))
- `Astromancer Barbeloth Trismegistus` = 아스트로맨서·바르벨로스·트리스메기스토스 ([Barbeloth](https://genshin-impact.fandom.com/wiki/Barbeloth))
- 넣을 때: `'Barbeloth Trismegistus=한국어'`

### 88. Bomb-Tastic Adventure (4회)

예문: 클레는 폭발 소리에도 놀라지 않으며, 폭발하는 것이라면 무엇이든 좋아하는 활발한 아이다. 그녀의 놀이는 대개 폭발과 함께하며, 특히 호수에 폭탄을 던져 물고기를 잡는 물고기 폭파를 즐긴다. 케이아는 폭탄을 도시에서 쓰지 말고, 사람을 다치게 하거나 몬드를 폭격하지 말라는 규칙을 적어 주었고, 클레는 도시 밖에서 폭탄을 쓰려 하지만 진에게 잡혀 독방에 가는 일이 잦다. 클레는 도시 안에 있을 때는 물고기 폭파 대신 도도코의 Bomb-Tastic Adventure를 즐기겠다고 약속하기도 한다. 폭탄에 대해 혼자 연구하던 중 클레는 **불 신의 눈**을 얻었다. 이렇게 폭발을 놀이처럼 여기는 클레의 재능은 페보니우스 기사단의 규칙보다 먼저 자라난 것으로 보인다.

- `Dodoco's Bomb-Tastic Adventure` = 도도코 쾅쾅 모험기 ([Dodoco's Bomb-Tastic Adventure](https://genshin-impact.fandom.com/wiki/Dodoco's_Bomb-Tastic_Adventure))
- 넣을 때: `'Bomb-Tastic Adventure=한국어'`

### 97. Institute (4회)

예문: 알랭은 대재앙 중 부원장이 죽고 수선화 십자원이 해산될 때까지 그곳에서 자랐다. 이후 바질·엘튼의 요청으로 마리안과 함께 엠마누엘·기요틴에게 맡겨졌다. Institute의 해산은 두 남매에게 새 보호자를 만나게 한 계기가 된 셈이다.

- 들어간 이름에 자주 나온 한국어: **과학원** 6개, **폰타인** 5개, **연구원** 3개, **숙소** 2개
- `False Moon Institute` = 거짓된 달의 연구소 ([False Moon Institute](https://genshin-impact.fandom.com/wiki/False_Moon_Institute))
- `Institute Dormitories` = 과학원 숙소 ([Institute Dormitories](https://genshin-impact.fandom.com/wiki/Institute_Dormitories))
- `Narzissenkreuz Institute` = 수선화 십자원 ([Narzissenkreuz Institute](https://genshin-impact.fandom.com/wiki/Narzissenkreuz_Institute))
- `Fontaine Research Institute` = 폰타인 과학원 ([Fontaine Research Institute](https://genshin-impact.fandom.com/wiki/Fontaine_Research_Institute))
- `Institute of Natural Philosophy` = 자연철학 학원 ([Institute of Natural Philosophy](https://genshin-impact.fandom.com/wiki/Institute_of_Natural_Philosophy))
- `New Fontaine Research Institute` = 신 폰타인 과학원 ([New Fontaine Research Institute](https://genshin-impact.fandom.com/wiki/New_Fontaine_Research_Institute))
- … 외 8개 (`data/generated/ko-name-candidates.json`)
- 넣을 때: `'Institute=한국어'`

### 98. Legend of Sword (4회)

예문: 그는 직접 책을 쓰기도 했는데, 그렇게 나온 것이 A Legend of Sword다. 출간 전 그는 '기이한 설정과 진부한 줄거리' 탓에 리월에서 인기를 얻지 못할 것이라는 말을 들었지만, 그래도 밀어붙이기로 했다. 인쇄업자의 말대로 책은 팔리지 않았고, 그는 이를 개인적인 일로 받아들여 만문집사에 몇 권을 몰래 들여놓았다. 반응이 적자 낙담했지만 그대로 두었는데, 한 이나즈마 상인이 책을 고향으로 가져가면서 이나즈마와 폰타인에서 큰 성공을 거두었고 그의 이름으로 로열티가 쌓였다. 리월에서 외면받던 책이 이나즈마와 폰타인에서 대성공을 거둔 것은 그의 예상과 정반대로 흘러간 셈이다.

- `A Legend of Sword` = 침추습검록 ([A Legend of Sword](https://genshin-impact.fandom.com/wiki/A_Legend_of_Sword))
- 넣을 때: `'Legend of Sword=한국어'`

### 103. Moon Wheels (4회)

예문: 원신의 세계를 관통하는 일곱 원소는 단순한 전투 속성을 넘어, **티바트의 게임플레이와 세계관을 동시에 지탱하는 핵심 개념**이다. 전투에서는 Elemental Reactions를 일으키고 여덟 피해 유형 중 일곱을 담당하는 **전투의 중심 축**이며, 세계관에서는 각 원소가 집정관과 그를 따르는 국가, 그리고 일부 현대 국가가 자리 잡은 옛 용왕의 영역과 얽혀 있다. 따라서 원소는 천리가 광계의 원초적 흐름을 열소를 바탕으로 일곱으로 나누어 만든 힘에서부터 신의 눈, 신의 심장, Moon Wheels에 이르기까지 **다양한 권능의 매개체**로 작용하므로, 티바트의 신과 인간과 용들이 모두 그 위에 서 있는 셈이다.

- **같은 영어**: `Moon Wheel` = **달의 륜** ([Moon Wheel](https://genshin-impact.fandom.com/wiki/Moon_Wheel))
- 넣을 때: `'Moon Wheels=한국어'`

### 104. Mosso (4회)

예문: 폰타인 과학원 연대기에서 여행자는 연구소를 도왔고, 그 공로로 **명예 선임 연구원** 칭호를 받았다. 페이몬은 명예 선임 연구원의 조수가 되었다. 페이몬은 Mosso가 연구소의 일류 과학자인지 묻기도 했다. 연구소가 여행자와 페이몬에게 직함을 준 것은 폐허의 아르케 광석 문제를 막아낸 데 대한 보답인 셈이다.

- `Mosso Lombroso` = 모소·롬브로소 ([Mosso Lombroso](https://genshin-impact.fandom.com/wiki/Mosso_Lombroso))
- 넣을 때: `'Mosso=한국어'`

### 105. Nadia (4회)

예문: 지부장은 재량으로 시간제 모험가 증서를 발급해, 소지자가 의뢰를 완수하고 보수를 받는 길드 구성원으로 활동하도록 인정할 수 있다. 정식 모험가가 아닌 동행자도 구성원으로 인정되는데, 페이몬은 여행자의 Handbook에 안내자로, 유르빌은 Nadia의 전략가로 이름을 올렸다. 실제로 싸우는 사람과 기록에 오르는 사람이 갈릴 수 있음을 보여 주는 대목이다.

- **같은 영어**: `Nadia` = **나디아** ([Nadia (Liyue)](https://genshin-impact.fandom.com/wiki/Nadia_(Liyue)))
- 넣을 때: `'Nadia=한국어'`

### 106. Narukami (4회)

예문: 그 후 여러 해 동안 이나즈마 막부와 와타츠미섬은 서로의 경계를 존중하며 평화롭게 공존했다. 그러나 기근이 이어지자 와타츠미 사람들은 오로바시 님에게 비옥한 야시오리섬을 침공하라고 재촉했다. 그는 Narukami의 힘을 두려워해 처음에는 거절했지만, 사람들의 고통에 마음을 바꾸고 전쟁을 자신의 형벌을 이행하는 수단으로 여겼다. 지상 귀환을 수월하게 하려고 받아들인 Narukami의 문화가, 훗날 그가 침공하게 되는 상대의 문화였다는 점은 아이러니로 보인다. 아쿠오와 쌍둥이 장군 모운, 아야메를 앞세운 와타츠미 군은 야시오리섬을 침공해 고대 도시 Mumei를 점령하고 아쿠오를 그곳의 봉신 통치자로 앉혔다.

- 들어간 이름에 자주 나온 한국어: **나루카미** 11개, **나루카미섬** 3개, **다이샤** 3개, **쇼군상** 2개
- `Narukami Island` = 나루카미섬 ([Narukami Island](https://genshin-impact.fandom.com/wiki/Narukami_Island))
- `The Narukami Trail` = 나루카미의 흔적 ([The Narukami Trail](https://genshin-impact.fandom.com/wiki/The_Narukami_Trail))
- `Grand Narukami Shrine` = 나루카미 다이샤 ([Grand Narukami Shrine (Subarea)](https://genshin-impact.fandom.com/wiki/Grand_Narukami_Shrine_(Subarea)))
- `Narukami Island: Tenshukaku` = 나루카미섬·천수각 ([Narukami Island: Tenshukaku](https://genshin-impact.fandom.com/wiki/Narukami_Island%3A_Tenshukaku))
- `The Great Narukami Offering` = 나루카미 기원제 ([The Great Narukami Offering](https://genshin-impact.fandom.com/wiki/The_Great_Narukami_Offering))
- `Gyoei Narukami Kariyama Rite` = 교에 나루카미 카리야마 의식 ([Gyoei Narukami Kariyama Rite](https://genshin-impact.fandom.com/wiki/Gyoei_Narukami_Kariyama_Rite))
- … 외 8개 (`data/generated/ko-name-candidates.json`)
- 넣을 때: `'Narukami=한국어'`

### 111. Priestess (4회)

예문: 휘페르보레아가 무너진 뒤로 혈통의 순수함을 지키는 일은 Scions의 오랜 고민이었다. 그 답으로 세워진 것이 Sacred Heir Project로, 예언된 Sacred Heir가 언젠가 태어나 휘페르보레아를 되살릴 수 있도록 혈통을 이어 가려는 장기 계획이었다. 본디 휘페르보레아 시대의 Seed of Life Project가 기반이었으나, 그 계획은 Tekhneikos 공정으로 인간과 설국 요정을 유전적으로 개조하는 방식이었기에 휘페르보레아의 몰락과 함께 불가능해졌다. 그래서 Scions는 우생과 가계의 엄격한 통제로 비슷한 결과를 노렸다. 계획은 근친 약화를 피하려고 일곱 세대부터 서서히 폐기될 예정이었지만, 대를 이은 Priestess들이 Sacred Heir를 낳는 일을 더 중시하면서 혈통의 순수함은 더 무거운 자리를 차지하게 되었다. 고대의 유전 개조가 사라진 자리에 혼인의 통제가 들어선 셈이다.

- 들어간 이름에 자주 나온 한국어: **궁사** 2개, **대리** 2개
- `Lunar Arcanum II: The High Priestess` = 달 계시 카드·2·여사제 ([Lunar Arcanum II: The High Priestess](https://genshin-impact.fandom.com/wiki/Lunar_Arcanum_II%3A_The_High_Priestess))
- `"Seal of the Provisional Head Priestess"` = 「대리 궁사의 발자국」 (["Seal of the Provisional Head Priestess"](https://genshin-impact.fandom.com/wiki/%22Seal_of_the_Provisional_Head_Priestess%22))
- `"Provisional Head Priestess of the Asase Shrine"` = 아사세 신사의 대리 궁사 (["Provisional Head Priestess of the Asase Shrine"](https://genshin-impact.fandom.com/wiki/%22Provisional_Head_Priestess_of_the_Asase_Shrine%22))
- `Priestess of Floral Candles and Skyborne Feathers` = 「화촉과 바람깃의 제사장」 ([Ix Ajkotz'i'j Iq'ismal Waxak](https://genshin-impact.fandom.com/wiki/Ix_Ajkotz'i'j_Iq'ismal_Waxak))
- 넣을 때: `'Priestess=한국어'`

### 116. Scribe (4회)

예문: 왕국의 기록은 Ancient Carvings, 설장의 성은과 인동의 열매의 설명, 공주의 함·Priest의 Box·Scribe의 Box, 그리고 설장의 성은이 발견되는 Mural Room의 프레스코에 나뉘어 담겨 있다. 세 상자는 모두 드래곤 스파인의 Luxurious Chest에서 나온다. 지역에서 부서진 유적 가디언에게서 나온 Record of Serial No.의 해독문도 관련이 있을 수 있으나, 유적 가디언의 기원지인 켄리아의 몰락과 관계된 것일 수도 있다. 기록의 주체가 왕국인지 켄리아인지 확정되지 않았다는 점에서, 산의 유물이 전하는 과거는 아직 한 줄로 정리되지 않은 셈이다.

- `Priest, Princess, and Scribe` = 사제, 공주와 기록자 ([Priest, Princess, and Scribe](https://genshin-impact.fandom.com/wiki/Priest%2C_Princess%2C_and_Scribe))
- 넣을 때: `'Scribe=한국어'`

### 117. Seer-Witch (4회)

예문: Barbeloth Trismegistus는 마녀회의 일원이며, 동료들 사이에서는 “B”라는 코드네임과 “Seer-Witch”라는 별칭을 지녔다. 그녀는 **마녀회의 멤버 “B” — Barbeloth Trismegistus**라고 스스로를 소개한다. 모나는 그녀의 제자로, 바르카에게 '아스트로맨서·바르벨로스·트리스메기스토스의 제자'로 언급되었다. 모나에 따르면 그녀는 국가와 티바트, 나아가 세상의 운세까지 읽어내는 점성술사이며, 이러한 실력을 지닌 그녀가 모나의 스승이라는 점은 그녀가 단순한 이론가가 아니라 실제로 운세를 읽어내는 점성술사임을 보여주는 대목이라고 볼 수 있다.

- **같은 영어**: `Seer-Witch` = **예언의 마녀** ([Barbeloth](https://genshin-impact.fandom.com/wiki/Barbeloth))
- 넣을 때: `'Seer-Witch=한국어'`

### 119. Spirited (4회)

예문: 고체 열소는 거대한 결정이나 매끈한 주황색 블록으로 나타나 평범한 방법으로는 오를 수 없고, 산룡이나 메아리 아이 캐릭터의 능력으로 올라야 한다. 큰 고체 열소 광맥은 구조적 약점을 동시에 공격하면 부술 수 있다. 액체 열소는 HP를 빠르게 깎아내는 위험 요소로, 어룡이나 마비카, 원소전투 스킬을 쓴 샘물 무리 캐릭터, Spirited 상태의 뿔룡은 안전하게 건널 수 있다. 근처의 고체화 구슬을 Coagulated Pedestal에 꽂거나 빙의한 숲룡이 들고 있으면 액체가 굳어 그 위에 안전하게 설 수 있다. 기체 열소는 윈드 필드처럼 작동하지만 그 안에서는 열소가 회복되는 대신 HP가 줄어들며, 깃룡과 마비카, 꽃깃회 캐릭터는 피해 없이 탈 수 있다. 같은 열소가 형태에 따라 통행을 가로막는 장애물이 되기도 하고 이동을 돕는 통로가 되기도 한다는 점이, 이 지역 지형의 성격을 잘 보여준다고 할 수 있다.

- `Spirited State` = 분발 상태 ([Tatankasaurus (Equipment Card)](https://genshin-impact.fandom.com/wiki/Tatankasaurus_(Equipment_Card)))
- `Spirited Valor` = 용맹의 바람 ([Spirited Valor](https://genshin-impact.fandom.com/wiki/Spirited_Valor))
- `Spirited Eruption` = 분출된 빛 ([Spirited Eruption](https://genshin-impact.fandom.com/wiki/Spirited_Eruption))
- `Mastery Talisman: Spirited Counterattack` = 노련한 부적술·고양된 반격 ([Mastery Talisman: Spirited Counterattack](https://genshin-impact.fandom.com/wiki/Mastery_Talisman%3A_Spirited_Counterattack))
- 넣을 때: `'Spirited=한국어'`

### 120. TCG (4회)

예문: 어느 Windblume 축제 기간, 사이노는 몬드의 용이라는 소식을 듣고 드발린의 보금자리로 직접 찾아가 그 모습을 사진에 담았다. 드발린은 티바트에서 가장 거대한 존재 가운데 하나로, 몸 전체가 푸른색을 띠고 눈과 날개 비늘 등에서 빛을 내며, 여섯 개의 거대한 날개를 지닌 용이다. 사이노는 그 모습이 웅장하다고 여겼으며, 알베도에게 **일곱 성인의 소환 카드 '청금색 소용돌이'의 뒷면**을 드발린을 본떠 만들어 달라고 부탁했다. 사이노가 사진으로 담고 TCG 카드의 뒷면까지 드발린을 본떠 만든 것은, 그가 이 용을 기념할 만한 장엄한 대상으로 여겼다고 해석할 수 있다.

- 들어간 이름에 자주 나온 한국어: **성인** 2개, **소환** 2개, **일곱** 2개
- `Genius Invokation TCG` = 일곱 성인의 소환 ([Genius Invokation TCG](https://genshin-impact.fandom.com/wiki/Genius_Invokation_TCG))
- `Come Try Genius Invokation TCG!` = 「일곱 성인의 소환」에 도전하라! ([Come Try Genius Invokation TCG!](https://genshin-impact.fandom.com/wiki/Come_Try_Genius_Invokation_TCG!))
- 넣을 때: `'TCG=한국어'`

### 121. The Sojourner (4회)

예문: **The Sojourner**는 하프 연주자이자, 나중에 방랑자의 Troupe에 속하게 된 인물이다. 그는 폰타인성의 여성들에게 깊은 사랑을 받았고, 작별 인사 없이 떠날 때 궁정의 여인들은 **작별의 눈물**을 흘렸다. 한 연주자를 향한 애정과 이별의 슬픔이 공존했던 궁정의 모습으로 보인다.

- **같은 영어**: `Sojourner` = **행자** ([Sojourner](https://genshin-impact.fandom.com/wiki/Sojourner))
- 들어간 이름에 자주 나온 한국어: **밤바다** 5개, **손님** 5개
- `Lone Sojourner` = 고독한 머무름 ([Lone Sojourner](https://genshin-impact.fandom.com/wiki/Lone_Sojourner))
- `Dusksea Sojourner` = 밤바다 손님 ([Dusksea Sojourner](https://genshin-impact.fandom.com/wiki/Dusksea_Sojourner))
- `Goblet of the Sojourner` = 이국의 술잔 ([Goblet of the Sojourner](https://genshin-impact.fandom.com/wiki/Goblet_of_the_Sojourner))
- `Resolution of Sojourner` = 행자의 마음 ([Resolution of Sojourner](https://genshin-impact.fandom.com/wiki/Resolution_of_Sojourner))
- `Dusksea Sojourner Shorts` = 밤바다 손님 쇼츠 ([Dusksea Sojourner Shorts (Manekina)](https://genshin-impact.fandom.com/wiki/Dusksea_Sojourner_Shorts_(Manekina)))
- `Sundial of the Sojourner` = 빛을 좇는 돌 ([Sundial of the Sojourner](https://genshin-impact.fandom.com/wiki/Sundial_of_the_Sojourner))
- … 외 3개 (`data/generated/ko-name-candidates.json`)
- 넣을 때: `'The Sojourner=한국어'`

### 125. Vindagnyr (4회)

예문: 몬드 남동쪽에 우뚝 솟은 **드래곤 스파인**은 원래 **Vindagnyr**이라 불렸고, 고대 유적과 눈 덮인 능선, 그리고 독룡 두린의 유해를 품은 거대한 산이다. 눈이 쌓이기만 하고 녹지 않는 기이한 특성과 극심한 추위 때문에 드래곤 스파인은 몬드에서도 가장 위험한 장소 중 하나로 꼽히며, 두린의 심장은 드래곤이 잠든 협곡에서 지금도 뛰고 있는 것처럼 보인다. 이 산은 두린이 추락하기 전에는 왕국 살·빈다그니르가 있던 땅이었다가 하늘에서 떨어진 한천의 못에 의해 얼어붙은 폐허가 되었으므로, 드래곤 스파인은 **두 개의 재앙이 겹쳐 있는 다층적인 무덤**으로 볼 수 있다.

- 들어간 이름에 자주 나온 한국어: **빈다그니르** 2개
- `Sal Vindagnyr` = 살·빈다그니르 ([Sal Vindagnyr](https://genshin-impact.fandom.com/wiki/Sal_Vindagnyr))
- `Peak of Vindagnyr` = 빈다그니르의 정상 ([Peak of Vindagnyr](https://genshin-impact.fandom.com/wiki/Peak_of_Vindagnyr))
- 넣을 때: `'Vindagnyr=한국어'`

### 127. Wingless (4회)

예문: 꽃깃회, 혹은 틀라로칸,은 나타의 여섯 부족 중 하나로 깃가지 절벽 위에 자리하며, 현족장은 무토타이다. 부족 구성원은 깃룡과 깊은 유대를 맺고, **Qucusaur Riders**에 들기 위해 무술과 용의 신뢰를 요구하는 까다로운 입단 시험을 치르며, 통과하지 못해 동반을 떠나보내야 하는 사람들은 **Wingless**로 불린다. 수천 년 전 버려진 고아 리옹고가 제8위 용의 군주의 보호 아래 자신의 길을 걸은 뒤 진정한 길을 깨달았고, 갈 곳 없는 다른 고아들과 함께 부족을 세운 뒤 다른 부족의 규율에 얽매이기 싫어한 전사들과 축출당한 용족들이 차례로 합류했다는 점에서, 이 부족은 점차 많은 이들을 받아들이는 피난처가 되어 간 것으로 보인다.

- `The Wingless One of Tlalocan` = 틀라로칸의 날개 잃은 자 ([The Wingless One of Tlalocan](https://genshin-impact.fandom.com/wiki/The_Wingless_One_of_Tlalocan))
- 넣을 때: `'Wingless=한국어'`

### 209. Tatankasaur / Tatankasaurs (4회)

예문: 비옥한 터전의 전사들은 미늘창새를 찾아 머리로 '누가 더 딱딱한가'를 겨루며, 몸을 강철처럼 단련하려 한다. **뿔룡와의 씨름**은 오랜 전통이며, 뿔룡에게 이기는 것은 큰 영예로 여겨진다. 과수원 기계 역시 Tatankasaur나 비옥한 터전 인물이 앞을 내리치는 방식으로 재료를 준비한다.

- `Tatankasaur Whelp` = 어린 뿔룡 ([Tatankasaur Whelp](https://genshin-impact.fandom.com/wiki/Tatankasaur_Whelp))
- 넣을 때: `'Tatankasaur|Tatankasaurs=한국어'`

### 313. Guardian / Guardians (4회)

예문: 그는 이야기의 사건들보다 수천 년 전에 죽었다. **도금 여단**은 그의 신민의 후손이며, 그중 일부는 지금도 그를 숭배하고 그가 되살아나기를 바란다. 아루 마을은 그의 문명의 불씨를 간직한 곳으로, 마을 사람들과 캔디스 같은 Guardian들은 비유적으로 그의 후손이라 불린다. 사막에는 태고의 구조체 같은 그의 고대 기술도 남아 있으니, 문명이 무너진 뒤에도 그는 유적과 사람들의 형태로 사막 사회를 규정하고 있는 셈이다.

- 들어간 이름에 자주 나온 한국어: **수호** 5개, **수호자** 5개, **기둥** 4개, **바위** 4개
- `Core Guardian` = 코어 수호자 ([Core Guardian](https://genshin-impact.fandom.com/wiki/Core_Guardian))
- `Guardian Vent!` = 벼락불 강림! ([Guardian Vent!](https://genshin-impact.fandom.com/wiki/Guardian_Vent!))
- `Treasure Guardians` = 「보물 경비병」 ([Treasure Guardians](https://genshin-impact.fandom.com/wiki/Treasure_Guardians))
- `Rebellious Guardian` = 반역의 수호자 ([The Bell](https://genshin-impact.fandom.com/wiki/The_Bell))
- `Guardian of Apep's Oasis` = 아펩의 오아시스 파수꾼 ([Guardian of Apep's Oasis](https://genshin-impact.fandom.com/wiki/Guardian_of_Apep's_Oasis))
- `Guardians of the Countryside` = 고향을 수호하는 자 ([Guardians of the Countryside](https://genshin-impact.fandom.com/wiki/Guardians_of_the_Countryside))
- … 외 12개 (`data/generated/ko-name-candidates.json`)
- 넣을 때: `'Guardian|Guardians=한국어'`

### 339. Koholasaur / Koholasaurs (4회)

예문: 이파는 괴롭힘에서 용을 구해낸 일을 두고 열소 관련 질병 연구에 역사적인 기여를 했다고 평한다. 같은 인물은 전쟁에서 놀라운 용기를 보인 어린 용이 그만큼의 열소를 쓰기에는 너무 어리다고 짚는다. 리나하는 아직 찾지 못한 Koholasaur 두 마리가 열소 분출구에 숨어 있을 것이라고 본다. 음포소는 분화 때 화산이 막대한 양의 열소를 내뿜어 주변 지역에 떨어뜨린다고 설명한다. 「아완유」는 열소가 풍부한 환경에서 고체화 구슬이 발밑에 고체 발판을 만들어 준다고 전한다. 질병 연구와 용의 건강, 분출과 분출구에 대한 관찰이 모두 열소를 매개로 이어진다는 점에서, 이들의 관심사는 서로 다른 분야처럼 보이면서도 같은 대상에 닿아 있다.

- `Koholasaur Whelp` = 어린 어룡 ([Koholasaur Whelp](https://genshin-impact.fandom.com/wiki/Koholasaur_Whelp))
- `Where the Koholasaurs Gather` = 어룡들의 모임 ([Where the Koholasaurs Gather](https://genshin-impact.fandom.com/wiki/Where_the_Koholasaurs_Gather))
- 넣을 때: `'Koholasaur|Koholasaurs=한국어'`

### 393. Qucusaur / Qucusaurs (4회)

예문: 꽃깃회는 과거에 나타 전역을 순찰하고 방어하는 임무를 맡았고, 많은 Qucusaur 기수들이 지금도 그 일에 자부심을 느낀다. 오늘날 기수들은 자기 영역을 우선하지만 오치카나타의 폐허도 순찰하며, 심연이 고대 도시를 덮친 뒤로는 여행자들이 그곳에 들어가지 못하도록 봉쇄를 세웠다. 순찰을 피해 도시를 조사하러 들어간 이들은 그 안의 괴물에게 목숨을 잃었다. 봉쇄는 여행자들의 안전을 염려한 조치로 보이며, 순찰을 뚫고 들어간 이들의 최후는 그 위험이 헛된 걱정이 아니었음을 보여준다.

- 들어간 이름에 자주 나온 한국어: **깃룡** 2개
- `Weakened Qucusaur` = 허약한 깃룡 ([Weakened Qucusaur](https://genshin-impact.fandom.com/wiki/Weakened_Qucusaur))
- `Goldflame Qucusaur Tyrant` = 황금불꽃의 깃룡 폭군 ([Holawaqa Ngoubou](https://genshin-impact.fandom.com/wiki/Holawaqa_Ngoubou))
- 넣을 때: `'Qucusaur|Qucusaurs=한국어'`

### 130. Abyssal (3회)

예문: **기억의 거품**은 앨리스와 니콜이 함께 만들어낸 새로운 마법으로, 한 사람의 기억으로 빚은 작은 세계를 품고 있다. 니콜은 거품 속 이야기에 건너뛰는 대목이 있다며, 사정을 복잡하게 만들 수 있는 부분을 미리 지워 두었다고 말한다. 바람 드래곤의 폐허에서 모두가 힘을 합쳐 그를 쓰러뜨리고 Abyssal의 영향에서 정화해 내는 이야기도 해피 엔딩으로 맺어진다. 복잡한 대목을 덜어내고 해피 엔딩으로 맺는 방식은 그녀가 이야기를 매끄러운 쪽으로 다듬어 들려주고 있음을 보여준다.

- 들어간 이름에 자주 나온 한국어: **심연** 11개, **재앙** 2개
- `Abyssal Blight` = 심연 이슬 ([Abyssal Blight](https://genshin-impact.fandom.com/wiki/Abyssal_Blight))
- `Abyssal Traces` = 「심연」의 종적 ([Abyssal Traces](https://genshin-impact.fandom.com/wiki/Abyssal_Traces))
- `Abyssal Summons` = 심연의 부름 ([Abyssal Summons](https://genshin-impact.fandom.com/wiki/Abyssal_Summons))
- `"Abyssal Bounty"` = 「심연 생선구이」 (["Abyssal Bounty"](https://genshin-impact.fandom.com/wiki/%22Abyssal_Bounty%22))
- `Abyssal Crusader` = 심연의 별 수집가 ([Abyssal Crusader](https://genshin-impact.fandom.com/wiki/Abyssal_Crusader))
- `Abyssal Riftlines` = 심연 균열선 ([Abyssal Riftlines](https://genshin-impact.fandom.com/wiki/Abyssal_Riftlines))
- … 외 6개 (`data/generated/ko-name-candidates.json`)
- 넣을 때: `'Abyssal=한국어'`

### 132. Allogravity-Condensed Water Bodies (3회)

예문: 폰타인의 첫 일곱신상을 해금하면 다이빙 능력을 얻어 수면 아래를 탐험할 수 있고, 페트리코 주변 바다만 예외다. 물속에서는 스태미나가 소모되지 않고 익사하지도 않지만, 빠르게 헤엄치면 Aquatic Stamina가 줄어든다. 일반 공격과 원소 스킬, 원소 폭발은 쓸 수 없고 약한 "물줄기" 공격만 남는데, 이 공격을 이색 생물에 쓰면 그들의 능력을 얻는다. 폭발 현장에 떠 있는 물의 정육면체 Allogravity-Condensed Water Bodies 안에서도 잠수할 수 있지만, 아르케 광석 반응로 성분에 오염된 큐브에서는 Turbulent Energy Flow가 쌓여 익사한다.

- **옛 판에만**: `Allogravity-Condensed Water Bodies` = **중력이상 물** ([Allogravity-Condensed Water Body 2023-09-30 판](https://genshin-impact.fandom.com/wiki/Allogravity-Condensed_Water_Body?oldid=1357128))
- 넣을 때: `'Allogravity-Condensed Water Bodies=한국어'`

### 134. Anya (3회)

예문: 운명의 해답에서 아냐·「마리」·안데르스도테르의 두린이 원래 존재의 운명을 거부한 뒤, 아스트로맨서·바르벨로스·트리스메기스토스는 그와 앨리스가 있는 회의에 참석했다. 그녀는 두린을 찻잔 앞에 세워 살폈고, 그의 운명이 더는 별들 가운데 존재하지 않는다는 것을 발견했다. 아스트로맨서·바르벨로스·트리스메기스토스는 Anya가 거의 누구도 해내지 못한 일을 해냈다고 했지만, 설명을 묻는 두린에게 그저 매우 운이 좋은 사람이라고만 했고, 여행자가 같은 질문을 했을 때는 더 응답하지 않은 채 회의를 떠났다. 찻잔은 조용해지고, 마법사의 생각은 이미 다른 곳으로 흘러간 듯하다. 운명이 별들 가운데서 사라졌다는 관측과 '매우 운이 좋은 사람'이라는 말이 함께 놓이면서, 아스트로맨서·바르벨로스·트리스메기스토스가 끝까지 설명하지 않은 여지가 남는 셈이다.

- `Anya "Marie" Andersdotter` = 아냐·「마리」·안데르스도테르 ([Andersdotter](https://genshin-impact.fandom.com/wiki/Andersdotter))
- 넣을 때: `'Anya=한국어'`

### 138. Athos (3회)

예문: 본부는 그 주변에 자리한 인물들의 위치를 가늠하는 기준점이 되기도 한다. 애마톨은 기사단 본부 남동쪽, 고트 옆에서 찾을 수 있다. 엘린은 언제나 본부 뒤편에 있다. 베일은 낮에는 Anemo God Statue Plaza를 거닐다가, 밤이 되면 본부 앞에서 Athos에게 **정보를 전달**한다. 뒤편에 상시 머무는 엘린과 밤에 본부 앞을 오가는 베일의 동선을 겹쳐 보면, 본부 주변 공간이 사람들의 일과와 연락에 쓰이는 자리임을 알 수 있다.

- **같은 영어**: `Athos` = **아토스** ([Athos (Mondstadt)](https://genshin-impact.fandom.com/wiki/Athos_(Mondstadt)))
- 넣을 때: `'Athos=한국어'`

### 139. Ayato (3회)

예문: 삼봉행(三奉行)은 천수각에 모여 정무를 의논했고, 야시로 봉행이 안수령 폐지를 제안할 때마다 텐료 봉행(天領奉行)과 간조 봉행(勘定奉行)이 곧바로 막아섰다. 제안이 라이덴 쇼군에게 직접 닿지 못하고 다른 두 의뢰의 손을 거쳐야 하는 구조였던 셈이다. 우인단이 협력을 제안했을 때 Ayato가 그 계획에 손잡자는 제안을 거절하면서, 야시로 봉행은 두 Decree에 우인단이 얽힌 일에서 **비껴간 유일한 의뢰**가 되었다.

- 들어간 이름에 자주 나온 한국어: **아야토** 3개, **카미사토** 3개
- `Kamisato Ayato` = 카미사토 아야토 ([Kamisato Ayato](https://genshin-impact.fandom.com/wiki/Kamisato_Ayato))
- `Kamisato Ayato: Ripple` = 카미사토 아야토·잔물결 ([Kamisato Ayato: Ripple](https://genshin-impact.fandom.com/wiki/Kamisato_Ayato%3A_Ripple))
- `Kamisato Ayato: Business` = 카미사토 아야토·업무 ([Kamisato Ayato: Business](https://genshin-impact.fandom.com/wiki/Kamisato_Ayato%3A_Business))
- 넣을 때: `'Ayato=한국어'`

### 140. Beastly Rifts (3회)

예문: 수메르에서는 수계 늑대 무리가 대재앙 당시 Sumeru Desert를 뒤덮은 재앙의 잔재로, **오래전 전투에 남은 메아리**라는 표현으로 묘사된다. 수메르 전역에 소규모 무리가 흩어져 있고, 폰타인에서도 Beastly Rifts를 통해 엘리나스에 나타난 무리가 여행자가 제거하기 전까지 남아 있었다. 에리니에스의 뿌리에는 거대한 둥지가 자리 잡고 있었으며, 뿌리를 좀먹는 죄악의 종양과 함께 그 존재가 나무를 병들게 해 밝은 파란색이 어두운 노란색으로 변했다. 여행자와 심해 용 도마뱀·원종이 이 둥지와 종양을 없앴다. 수메르에서는 과거 재앙의 잔재로 묘사되던 수계 늑대 무리가 폰타인에서는 살아 움직이는 둥지와 Beastly Rifts를 형성하며 해를 입혔으므로, 이들이 단순한 과거 유물이 아닌 지속적인 위협으로 작용했다고 볼 수 있다.

- **같은 영어**: `Beastly Rift` = **수계(獸界) 균열** ([Beastly Rift](https://genshin-impact.fandom.com/wiki/Beastly_Rift))
- 넣을 때: `'Beastly Rifts=한국어'`

### 141. Challenge (3회)

예문: 나타의 여러 고유 메커니즘 가운데 하나로 용에 빙의가 있다. 영혼 촛불이나 다 자란 사우리안 적에게 다가가면 잠시 사우리안에 영을 깃들게 해 그 특수 능력으로 여러 탐사 장치를 다룰 수 있고, 같은 능력은 해당 부족 출신 플레이 가능 캐릭터의 원소전투 스킬로도 쓸 수 있다. 곳곳의 트레이너는 Warrior의 Challenge를 열어 이 능력의 숙련도를 시험한다. 나타 고유의 적들 중 상당수는 용을 포함해 플레이어를 알아차려도 곧바로 적대하지 않으며, 용에 깃들어 있으면 플레이어가 공격하거나 근처의 용이 아닌 적을 자극하지 않는 한 다른 용을 적대하게 만들지 않고 다가갈 수 있다.

- 들어간 이름에 자주 나온 한국어: **도전** 6개, **돌파** 5개, **레벨** 5개, **플레이어** 5개
- `Date's Challenge` = 다테의 도전장 ([Date's Challenge](https://genshin-impact.fandom.com/wiki/Date's_Challenge))
- `Curious Challenge` = 즐거운 도전 ([Curious Challenge](https://genshin-impact.fandom.com/wiki/Curious_Challenge))
- `Gliding Challenge` = 비행 도전 ([Gliding Challenge](https://genshin-impact.fandom.com/wiki/Gliding_Challenge))
- `Ascension Challenge` = 플레이어 레벨 돌파 ([Ascension Challenge](https://genshin-impact.fandom.com/wiki/Ascension_Challenge))
- `Warrior's Challenge` = 용사의 도전 ([Warrior's Challenge](https://genshin-impact.fandom.com/wiki/Warrior's_Challenge))
- `Ascension Challenge I` = 플레이어 레벨 돌파·1 ([Ascension Challenge I](https://genshin-impact.fandom.com/wiki/Ascension_Challenge_I))
- … 외 9개 (`data/generated/ko-name-candidates.json`)
- 넣을 때: `'Challenge=한국어'`

### 143. Decay (3회)

예문: **죽음의 땅**은 죽음의 땅이라는 위험 지역을 만드는 기후 현상으로, 그 안에서는 Decay가 쌓인다. 부식이 10단위 쌓이면 모든 캐릭터가 쓰러지고, 지역을 영구히 없애려면 **Dendrograna**로 Withering Branches를 모두 부순 뒤 적을 물리치고 Tumor of the Withering과 상호작용해야 한다. Fetid Boughs는 맞을 때마다 Decay를 1단위 더한다. 반대로 Flames of Life를 먹거나 Seelies of Life, Candles of Life, 지역 안의 워프 포인트 곁에 있으면 쌓인 부식이 계속 줄어든다. 부수는 일과 버티는 일이 같은 자리에서 함께 요구된다는 점에서, 죽음의 땅은 적을 잡는 것만으로 끝나지 않는 땅인 셈이다.

- 들어간 이름에 자주 나온 한국어: **끝없** 2개
- `Blood Bond: Dark Decay` = 핏빛 계약의 침식 ([Blood Bond: Dark Decay](https://genshin-impact.fandom.com/wiki/Blood_Bond%3A_Dark_Decay))
- `Chasm of Endless Decay` = 끝없는 골짜기 ([Chasm of Endless Decay](https://genshin-impact.fandom.com/wiki/Chasm_of_Endless_Decay))
- `Scourge of Endless Decay` = 「끝없는 죄악」 ([Scourge of Endless Decay](https://genshin-impact.fandom.com/wiki/Scourge_of_Endless_Decay))
- `"Can the Loveliest of Spirits Keep Decay at Bay?"` = 「가장 고운 정령이여 노화를 멈춰주소서」 (["Can the Loveliest of Spirits Keep Decay at Bay?"](https://genshin-impact.fandom.com/wiki/%22Can_the_Loveliest_of_Spirits_Keep_Decay_at_Bay%3F%22))
- 넣을 때: `'Decay=한국어'`

### 148. Dragon of Water (3회)

예문: 연구 끝에 오로바시 님과 연구자들은 용 도마뱀이 서로 다른 영역에서 왔기에 그의 힘을 거부한다는 결론에 이르렀지만, 결국 용 도마뱀에 오로바시 님의 산호를 접목하는 데에는 성공했다. 이 산호 조각은 와타츠미섬이 Elemental Realm에 흡수되는 것을 막는 와타츠미 어령 제사에 반드시 필요하다. 한편 오로바시 님은 일월 과거사를 통해 셀레스티아가 감추려 한 세계의 역사와 Dragon of Water가 인간의 모습으로 다시 태어난다는 예언을 알게 되었고, 책에 금지를 내린 뒤 Dragonheirs 실험을 직접 지휘해 그 귀환을 막으려 했다. 자신이 억누르고 연구하던 종족에 관한 예언을 그렇게 막으려 했다는 대목은 **아이러니**로 읽힌다. 이 의식은 성토가 사라진 뒤 Dragon이 인간의 말도 조직적 저항도 할 수 없는 작은 몸으로 퇴행했음을 보여주는 사례로도 인용된다.

- **옛 판에만**: `Dragon of Water` = **물의 용** ([Hydro Dragon 2025-07-30 판](https://genshin-impact.fandom.com/wiki/Hydro_Dragon?oldid=1788898))
- 넣을 때: `'Dragon of Water=한국어'`

### 149. Dragonspine Adventurer Camp (3회)

예문: 길드의 **표준 여성 유니폼**은 앞이 잘린 흰색 반소매 원피스, 프릴 장식과 삼각형 뒷자락이 달린 초록색 케이프 칼라, 트임과 뒷면의 빨간 리본이 있는 초록색 패널 스커트의 세 겹으로 이루어진다. 여기에 짧은 빨간 네커치프와 갈색 양말, 끈으로 묶는 높은 가죽 부츠를 갖추고, 여덟 갈래 별 모양의 길드 로고가 칼라의 오른쪽과 뒷자락에 찍혀 있다. 에츠코는 여기에 왼쪽에 빨간 십자가 있는 초록색 Dixie 모자를 더해 쓴다. 란 누님, 에츠코, Dragonspine Adventurer Camp의 옥희가 모두 이 유니폼을 입고 있는 것으로 보아, 길드가 정한 표준 복장이 여러 지부에 걸쳐 쓰이는 셈이다.

- **옛 판에만**: `Dragonspine Adventurer Camp` = **모험가 야영지** ([Dragonspine Adventurer Camp 2022-06-30 판](https://genshin-impact.fandom.com/wiki/Dragonspine_Adventurer_Camp?oldid=730832))
- 넣을 때: `'Dragonspine Adventurer Camp=한국어'`

### 150. Edwin (3회)

예문: 폰타인 과학원 연대기에서 여행자는 연구소를 돕는다. Edwin과 함께 일했던 연구원 내커는 더 작은 폭발을 일으켰고, 레이먼드는 그가 아르케 광석 코어를 팔아 한몫 챙기려는 것으로 여겼다. 내커의 손질로 시제품 생성기가 다시 작동했으나, 여행자가 이를 정지시키고 아르케 광석 흔적을 안정시키는 억제 장치로 교체해 **당분간 폭발을 막았다**. 그 공로로 여행자는 명예 선임 연구원 칭호를, 페이몬은 명예 선임 연구원 보좌 칭호를 받았다.

- `Edwin Eastinghouse` = 에드윈 이스팅하우스 ([Edwin Eastinghouse](https://genshin-impact.fandom.com/wiki/Edwin_Eastinghouse))
- 넣을 때: `'Edwin=한국어'`

### 155. Flighty Simulacra (3회)

예문: Adeptal Energy로 위치를 바꿀 수 있는 물체도 있다. 석조 조각은 수천 년의 역사 기믹의 일부로, Carefree Simulacra와 금옥 폭포 비녀도 위치를 바꿔 퍼즐을 푸는 데 쓰인다. 금옥 폭포 비녀는 과거의 의식과 진심 어린 마음에서 등장한다. Flighty Simulacra는 가까이 있는 플레이어가 높이 뛰어오르게 하며, 그 방식은 Spoutrocks와 비슷하다. Adeptal Energy는 물체의 위치를 바꾸는 데 그치지 않고 플레이어의 이동 높이까지 바꾸는 셈이다.

- **옛 판에만**: `Flighty Simulacra` = **하늘하늘 선상** ([Flighty Simulacrum 2024-01-25 판](https://genshin-impact.fandom.com/wiki/Flighty_Simulacrum?oldid=1476307))
- 넣을 때: `'Flighty Simulacra=한국어'`

### 156. Frostmoon (3회)

예문: 대신 라우마처럼 휘페르보레아 혈통이 강한 이들의 은빛 피가 증상을 상쇄하고, Lakkaberries 가루가 일시적인 완화를 준다. kuuvahki 과민증이 있던 츠치보르는 뼈이끼 황야에서 한동안 신비롭게 사라졌다가 관리 가능한 수준이 되어 돌아왔지만, 어떻게 그렇게 됐는지는 아무도 모른다. Frostmoon의 수습 여사제 베르나츠카는 과도한 kuuvahki를 막는 슈트를 만들었으나, 그 슈트는 축복을 행할 때 자신의 kuuvahki 사용을 무력화한다. 증상을 막는 대응책이 정작 힘을 쓰는 일을 가로막는다는 점에서, 감수성 대응은 kuuvahki를 다루는 일과 맞물려 있다고 볼 수 있다.

- 들어간 이름에 자주 나온 한국어: **서리달** 6개, **마을** 2개
- `Frostmoon Scions` = 서리달 아이 ([Frostmoon Scions](https://genshin-impact.fandom.com/wiki/Frostmoon_Scions))
- `Frostmoon Enclave` = 서리달 마을 ([Frostmoon Enclave](https://genshin-impact.fandom.com/wiki/Frostmoon_Enclave))
- `Frostmoon Prayers` = 서리달의 기도 ([Frostmoon Prayers](https://genshin-impact.fandom.com/wiki/Frostmoon_Prayers))
- `Shadow of the Frostmoon` = 「달빛 서리 그림자」 ([Shadow of the Frostmoon](https://genshin-impact.fandom.com/wiki/Shadow_of_the_Frostmoon))
- `Chamber of the Frostmoon Chant` = 「서리달」을 읊는 곳 ([Chamber of the Frostmoon Chant](https://genshin-impact.fandom.com/wiki/Chamber_of_the_Frostmoon_Chant))
- `The Other Side of the Frostmoon` = 서리달의 저편 ([The Other Side of the Frostmoon](https://genshin-impact.fandom.com/wiki/The_Other_Side_of_the_Frostmoon))
- … 외 1개 (`data/generated/ko-name-candidates.json`)
- 넣을 때: `'Frostmoon=한국어'`

### 159. Guuji (3회)

예문: 나루카미 다이샤의 궁사이자 야에 출판사의 주인, **여우 혈통의 야에 미코**는 이나즈마의 신사와 출판 사업을 동시에 거머쥔 핵심 인물이다. Guuji로서 신비롭고 직설적인 태도를 보이다가, 출판사 주인으로서 책과 이야기를 즐기면서도 수익에 집착하는 등 그녀는 상반된 여러 모습을 동시에 드러낸다. 그녀는 오랜 세월을 견뎌낸 라이덴 에이(影)의 소수의 친구 중 하나이며, 라이덴 에이(影)와는 서로 이름을 부를 정도로 가깝다. 궁사, 출판사 주인, 장난꾸러기 여우 등 그녀가 번갈아 보이는 수많은 태도는 **거울 조각처럼 각기 다른 모습을 비추며 진정한 본성을 감추는 듯하다**.

- 들어간 이름에 자주 나온 한국어: **신선** 3개, **여우** 3개, **나** 2개
- `Pretty Please, Kitsune Guuji?` = 부탁해요, 나의 여우 신선 궁사님 ([Pretty Please, Kitsune Guuji?](https://genshin-impact.fandom.com/wiki/Pretty_Please%2C_Kitsune_Guuji%3F))
- `"Kitsune Guuji" Exclusive Painted Flag Banner` = 「여우 신선 궁사」 한정 깃발 (["Kitsune Guuji" Exclusive Painted Flag Banner](https://genshin-impact.fandom.com/wiki/%22Kitsune_Guuji%22_Exclusive_Painted_Flag_Banner))
- `"Pretty Please, Kitsune Guuji?" Limited Deluxe Edition` = 《부탁해요, 나의 여우 신선 궁사님》 한정판 양장본 (["Pretty Please, Kitsune Guuji?" Limited Deluxe Edition](https://genshin-impact.fandom.com/wiki/%22Pretty_Please%2C_Kitsune_Guuji%3F%22_Limited_Deluxe_Edition))
- 넣을 때: `'Guuji=한국어'`

### 160. Handbook (3회)

예문: 모험가에게는 모험 핸드북이 지급되어 완료한 의뢰를 기록하고, 수수료 보상을 지급하는 체계의 일부로 쓰인다. 길드가 다루는 기록에는 의뢰 이력, 수입 명세, 의뢰 평가, 의뢰 통계, 평균 긍정 평가가 들어간다. 평균 긍정 평가 항목이 있다는 것은 의뢰인이 모험가의 일 처리를 두고 길드에 평가를 남길 수 있다는 뜻으로 보인다. Handbook이 다 차면 새것을 받을 수 있고, Handbook마다 고유 일련번호가 있어 지급할 때 함께 기록된다.

- 들어간 이름에 자주 나온 한국어: **핸드북** 4개, **모험** 3개
- `Adventurer Handbook` = 모험 핸드북 ([Adventurer Handbook](https://genshin-impact.fandom.com/wiki/Adventurer_Handbook))
- `Jack's Adventurer Handbook` = 잭의 모험 핸드북 ([Jack's Adventurer Handbook](https://genshin-impact.fandom.com/wiki/Jack's_Adventurer_Handbook))
- `Handy Handbook of Hilichurlian` = 츄츄어 핸드북 ([Handy Handbook of Hilichurlian](https://genshin-impact.fandom.com/wiki/Handy_Handbook_of_Hilichurlian))
- `Traveler's Exclusive Interview Handbook` = 여행자 특집 인터뷰 수첩 ([Traveler's Exclusive Interview Handbook](https://genshin-impact.fandom.com/wiki/Traveler's_Exclusive_Interview_Handbook))
- `"The Ultra Invincible" Adventure Handbook` = 「천하무적」 모험 핸드북 (["The Ultra Invincible" Adventure Handbook](https://genshin-impact.fandom.com/wiki/%22The_Ultra_Invincible%22_Adventure_Handbook))
- `Knights of Favonius Handbook - 5th Edition` = 기사단 매뉴얼·제5판 ([Knights of Favonius Handbook - 5th Edition](https://genshin-impact.fandom.com/wiki/Knights_of_Favonius_Handbook_-_5th_Edition))
- 넣을 때: `'Handbook=한국어'`

### 161. Hark the Crackjaw (3회)

예문: 현상금 게시판에는 현상금 대상에 대한 상세한 정보가 적혀 있고, 히딤바, 해란귀 차림의 사내, 밀수 조직, Hark the Crackjaw까지 네 갈래의 의뢰가 걸려 있다.

- **같은 영어**: `Hark the Crackjaw` = **「찢어진 턱」 할크** ([Hark](https://genshin-impact.fandom.com/wiki/Hark))
- 넣을 때: `'Hark the Crackjaw=한국어'`

### 162. Hiiragi (3회)

예문: 카미사토 아야토는 텐료 봉행(天領奉行)을 넘겨받은 뒤로 행동을 망설여 온 이유가 Hiiragi 영애의 감정을 신경 쓰기 때문이라고 짚었다. Hiiragi 영애가 실제로 끌려가게 된다면 텐료 봉행(天領奉行)은 어떻게 할지, 나아가 야시로 봉행은 어떻게 할지 되묻는 목소리도 있었다. Lady Hiiragi가 정말로 끌려가게 된다면 텐료 봉행(天領奉行)과 야시로 봉행은 각각 어떻게 할지 걱정하는 목소리가 나오는 것으로 보인다.

- 들어간 이름에 자주 나온 한국어: **히이라기** 5개
- `Hiiragi Clan` = 히이라기 가문 ([Hiiragi Clan](https://genshin-impact.fandom.com/wiki/Hiiragi_Clan))
- `Hiiragi Chisato` = 히이라기 치사토 ([Hiiragi Chisato](https://genshin-impact.fandom.com/wiki/Hiiragi_Chisato))
- `Hiiragi Hiroshi` = 히이라기 히로시 ([Hiiragi Hiroshi](https://genshin-impact.fandom.com/wiki/Hiiragi_Hiroshi))
- `Hiiragi Sanjuuro` = 히이라기 산쥬로 ([Hiiragi Sanjuuro](https://genshin-impact.fandom.com/wiki/Hiiragi_Sanjuuro))
- `Hiiragi Shinsuke` = 히이라기 신스케 ([Hiiragi Shinsuke](https://genshin-impact.fandom.com/wiki/Hiiragi_Shinsuke))
- 넣을 때: `'Hiiragi=한국어'`

### 163. Holy Lyre (3회)

예문: 우인단이 훔친 Holy Lyre를 둘러싼 오해로 페보니우스 기사단이 벤티와 여행자를 쫓아오자, 다이루크는 천사의 몫에서 이들을 숨기고 추격자를 돌렸다. 벤티가 노래로 상황을 설명한 뒤 그는 정보 연줄로 조사하여 진에게 알렸다.

- 들어간 이름에 자주 나온 한국어: **천공** 5개, **하프** 5개, **복구된** 2개
- `Holy Lyre der Himmel` = 천공의 하프 ([Holy Lyre der Himmel](https://genshin-impact.fandom.com/wiki/Holy_Lyre_der_Himmel))
- `Damaged Holy Lyre der Himmel` = 망가진 천공의 하프 ([Damaged Holy Lyre der Himmel](https://genshin-impact.fandom.com/wiki/Damaged_Holy_Lyre_der_Himmel))
- `Retrieve the Holy Lyre der Himmel` = 천공의 하프 탈환 ([Retrieve the Holy Lyre der Himmel](https://genshin-impact.fandom.com/wiki/Retrieve_the_Holy_Lyre_der_Himmel))
- `State of the Holy Lyre der Himmel` = 보물의 상태 ([State of the Holy Lyre der Himmel](https://genshin-impact.fandom.com/wiki/State_of_the_Holy_Lyre_der_Himmel))
- `Partially Repaired Holy Lyre der Himmel` = 조금 복구된 천공의 하프 ([Partially Repaired Holy Lyre der Himmel](https://genshin-impact.fandom.com/wiki/Partially_Repaired_Holy_Lyre_der_Himmel))
- `Completely Repaired Holy Lyre der Himmel` = 완벽하게 복구된 천공의 하프 ([Completely Repaired Holy Lyre der Himmel](https://genshin-impact.fandom.com/wiki/Completely_Repaired_Holy_Lyre_der_Himmel))
- 넣을 때: `'Holy Lyre=한국어'`

### 166. Investigation (3회)

예문: 4th Company는 유라가 이끄는 Reconnaissance로, 몬드의 야외로 나가 정찰하며 다가오는 적이나 이상한 현상을 살핀다. 미카가 이 Company에 속하며, 유라가 직접 돈만 항구와 몬드성을 잇는 교역로를 여러 차례 순찰한 일은 그곳이 이들의 임무 범위임을 보여준다. 10th Company는 알베도가 이끄는 Investigation으로, 기사단의 활동을 돕는 발명품을 제공하고 이상한 현상을 조사하며 정교한 연금술로 원격 정찰을 하기도 한다. 야외를 직접 도는 부대와 연금술로 멀리서 살피는 부대가 각기 다른 방식으로 기사단의 눈을 맡는 셈이다.

- 들어간 이름에 자주 나온 한국어: **조사** 12개, **일지** 5개, **고찰** 4개, **특별** 4개
- `Further Investigation` = 흔적을 따라 전진 ([Further Investigation](https://genshin-impact.fandom.com/wiki/Further_Investigation))
- `Ruins Investigation Log` = 유적 고찰 일지 ([Ruins Investigation Log](https://genshin-impact.fandom.com/wiki/Ruins_Investigation_Log))
- `A Thorough Investigation` = 철저한 조사 ([A Thorough Investigation](https://genshin-impact.fandom.com/wiki/A_Thorough_Investigation))
- `Diversified Investigation` = 다양성 조사 ([Diversified Investigation](https://genshin-impact.fandom.com/wiki/Diversified_Investigation))
- `Rene's Investigation Notes` = 르네의 조사 노트 ([Rene's Investigation Notes](https://genshin-impact.fandom.com/wiki/Rene's_Investigation_Notes))
- `Initial Investigation Clues` = 초기 조사를 마친 단서 ([Initial Investigation Clues](https://genshin-impact.fandom.com/wiki/Initial_Investigation_Clues))
- … 외 16개 (`data/generated/ko-name-candidates.json`)
- 넣을 때: `'Investigation=한국어'`

### 170. Kuuvahki Relay Mechanisms (3회)

예문: 더 직접적인 쓰임은 **원격 조작**이다. kuuvahki를 두르면 특정 물체를 밀고 당기며 나르고 던질 수 있다. ID Cards를 원격으로 조작해 Barrier Generators를 끄는가 하면, 달 이슬이나 kuuvahki가 깃든 바위, Kuuvahki Relay Mechanisms도 같은 방식으로 옮긴다. 다만 Kuuvahki Relay Mechanisms를 들고 있으면 번개를 끌어당길 수 있다. Portable Bearings와 Assembly Modules, Unipolar Crystonite는 옮기거나 부수는 쪽에 속한다. 운반과 파괴가 같은 조작의 두 갈래로 나란히 제시된다는 점이 눈에 띈다.

- **같은 영어**: `Kuuvahki Relay Mechanism` = **달의 힘 중계 장치** ([Kuuvahki Relay Mechanism](https://genshin-impact.fandom.com/wiki/Kuuvahki_Relay_Mechanism))
- 넣을 때: `'Kuuvahki Relay Mechanisms=한국어'`

### 174. Meropis (3회)

예문: 적왕에게 패한 레무스는 죽을 곳을 찾아 High Sea에 이르러 Meropis의 폐허와 세계수 나무를 지키던 천사 시빌을 만났다. 시빌은 그가 이곳에서 위대한 문명을 세울 운명이라 예언했고, 그 예언을 받아들인 그 아래에서 세계수 나무는 황금 배로 변해 물 위의 제국 레무리아의 토대가 되었다. 레무리아는 황금기를 누렸고, 그는 조화롭고 계몽된 문명을 만들고자 외교와 정복으로 수많은 부족을 깃발 아래 모으되 따르지 않는 부족은 정복했다. 에리니에스섬과 카시오도의 부족도 그렇게 복속되었는데, 카시오도는 하르모스트 보에티우스를 만나 레무리아에 들어가 섬겼고, 죽은 자들의 뼈 사이에 숨어 있던 에리니에스섬은 북쪽 변경 부족 Aremorica의 족장에게 받아들여져 그 지역에 남은 자유로운 물을 레무스의 영향으로부터 지키는 일을 맡았다. 죽을 곳을 찾아온 패배자가 물 위에 제국을 세웠다는 대목은 아이러니로 보인다.

- **옛 판에만**: `Meropis` = **메로피스** ([Meropis 2026-08-24 판](https://genshin-impact.fandom.com/wiki/Meropis?oldid=2163302))
- 넣을 때: `'Meropis=한국어'`

### 179. Office (3회)

예문: 들어간 뒤에는 워프 포인트로 편하게 오갈 수 있다. 리피 구역의 Reception Area 웨이포인트는 메로피드 요새 진행 중 자동으로 해제된다. 또한 메로피드 요새 2단계를 완료하면 지도 아이콘이 하나 더 생기는데, 이것이 워프 포인트 역할을 하여 The Duke의 Office 맞은편 관리 구역으로 바로 이동할 수 있게 해준다.

- 들어간 이름에 자주 나온 한국어: **사무실** 2개
- `Executive Office` = 행정원 ([Executive Office](https://genshin-impact.fandom.com/wiki/Executive_Office))
- `Materials Office` = 자료원 ([Materials Office](https://genshin-impact.fandom.com/wiki/Materials_Office))
- `The Duke's Office` = 「공작」 집무실 ([The Duke's Office](https://genshin-impact.fandom.com/wiki/The_Duke's_Office))
- `Office on the Avenue` = 큰 길가의 사무실 ([Office on the Avenue](https://genshin-impact.fandom.com/wiki/Office_on_the_Avenue))
- `Communications Office` = 화기청 ([Communications Office](https://genshin-impact.fandom.com/wiki/Communications_Office))
- `Favonius Office Table` = 기사단 사무용 책상 ([Favonius Office Table](https://genshin-impact.fandom.com/wiki/Favonius_Office_Table))
- … 외 3개 (`data/generated/ko-name-candidates.json`)
- 넣을 때: `'Office=한국어'`

### 180. Ordo (3회)

예문: 폰타인성이 수선화 십자 결사회를 위협으로 공식 선포하자, 자연철학 학원의 원장 드와이트·라스커는 알랭의 양아버지 Emanuel에게 Ordo 조사를 맡겼다. 알랭은 상대가 괴수를 되살리려 한다고 전하며 Chief Justice에게 보고해야 한다고 말했으나, Emanuel은 결국 Ordo의 수장 나르치센크로이츠에 의해 소멸되고 만다. 나르치센크로이츠는 희생자들의 기억에서 알랭이 시계태엽 메카가 명령을 실행하도록 단순한 논리 트리를 도입했다는 것을 알아냈고, '적절한 장기가 있으면 의식을 이식할 수 있다'고 생각했다. 시모어가 '사고, 보안, 감시 응용'을 위해 '**가상 신경망**'을 쓴다는 점도 그의 관심을 끌었으나, 야코브·잉골드는 Guillotin 남매와 맞서고 싶지 않다며 감정적으로 반응했다.

- 들어간 이름에 자주 나온 한국어: **결사회** 2개, **수선화** 2개, **십자** 2개
- `Narzissenkreuz Ordo` = 수선화 십자 결사회 ([Narzissenkreuz Ordo](https://genshin-impact.fandom.com/wiki/Narzissenkreuz_Ordo))
- `The Narzissenkreuz Ordo` = 수선화 십자 결사회 ([The Narzissenkreuz Ordo](https://genshin-impact.fandom.com/wiki/The_Narzissenkreuz_Ordo))
- 넣을 때: `'Ordo=한국어'`

### 183. Pneumousia (3회)

예문: 멜뤼진은 엘리나스의 '딸들'로, 400년이 넘는 전에 그림자 수사청과 수선화 십자 결사회가 다투던 중 엘리나스의 시체 안에서 일어난 Pneumousia 폭발로 태어났다. 이들은 여러 정황에서 새로운 형태의 물 용 도마뱀, 즉 **용의 후계자**로 여겨지며, 바다 민달팽이를 닮은 어린 소녀의 모습을 하고 있다. 다만 시조가 지닌 심연의 성질 때문에 빛의 영역보다 공허의 영역에 더 가깝다고 본다. 시그윈은 'Wondrous Dragonheir'로, 마메흐와 프샤비는 각자의 이름으로 기록되어 있다.

- 들어간 이름에 자주 나온 한국어: **프뉴무시아** 6개
- `Pneumousia Block` = 프뉴무시아 에너지 덩어리 ([Pneumousia Block](https://genshin-impact.fandom.com/wiki/Pneumousia_Block))
- `Pneumousia Relay` = 프뉴무시아 중계기 ([Pneumousia Relay](https://genshin-impact.fandom.com/wiki/Pneumousia_Relay))
- `Pneumousia Storage Box` = 프뉴무시아 보관함 ([Pneumousia Storage Box](https://genshin-impact.fandom.com/wiki/Pneumousia_Storage_Box))
- `Enhanced Pneumousia Amplifier` = 프뉴무시아 증폭기 ([Enhanced Pneumousia Amplifier](https://genshin-impact.fandom.com/wiki/Enhanced_Pneumousia_Amplifier))
- `Pneumousia Barrage Countermeasure` = 프뉴무시아 탄막 대응법 ([Where Waves Meet the Reef/Pneumousia Barrage Countermeasure](https://genshin-impact.fandom.com/wiki/Where_Waves_Meet_the_Reef%2FPneumousia_Barrage_Countermeasure))
- `Ley Line Disorder: Pneumousia Suffusion` = 지맥 이상·충만한 프뉴무시아 ([Ley Line Disorder: Pneumousia Suffusion](https://genshin-impact.fandom.com/wiki/Ley_Line_Disorder%3A_Pneumousia_Suffusion))
- 넣을 때: `'Pneumousia=한국어'`

### 184. Primal Flame (3회)

예문: Dragon은 광계의 존재로, 천리가 도래하기 전 옛 세계의 지배종이었다. 옛 세계는 일곱 왕라 불린 용 군주들이 다스렸고, 천리는 이들을 꺾은 뒤 인류를 위한 새 세계를 세웠다. 용 도마뱀과 원소 용은 원소에서 태어나며, 나타의 용들은 모든 용의 영혼이 빛에서 비롯되었고 그 가장 높은 발현이 Primal Flame, 곧 플로지스톤이라고 믿었다. 원소적 존재인 만큼 수명이 필멸자와 신보다 훨씬 길고 나이를 먹을수록 강해져, 야타용왕·드발린·두린처럼 마신에 맞먹는 힘을 지닌 이들도 있다. 반면 마룡 우르사처럼 강력한 신의 눈이나 사안 사용자에게 쓰러질 수 있는 Dragon도 있었다. 원소 Dragon에 대해서는 기록이 많지 않지만, 드발린과 일곱 왕은 분명히 원소 Dragon으로 불린다.

- 들어간 이름에 자주 나온 한국어: **근원** 3개, **불** 3개
- `Altar of Primal Flame` = 근원의 불 제단 ([Altar of Primal Flame](https://genshin-impact.fandom.com/wiki/Altar_of_Primal_Flame))
- `Primal Flame Resonance` = 근원의 불 공명 ([Primal Flame Resonance](https://genshin-impact.fandom.com/wiki/Primal_Flame_Resonance))
- `The Flowing Primal Flame` = 타오르는 근원의 불 ([The Flowing Primal Flame (Part 1)](https://genshin-impact.fandom.com/wiki/The_Flowing_Primal_Flame_(Part_1)))
- 넣을 때: `'Primal Flame=한국어'`

### 186. Primordial Water (3회)

예문: 레무리아가 번영하는 동안 레무스는 시빌의 예언에 마음이 무거워져 예고된 멸망을 피할 방법을 찾았다. 그녀의 제안에 따라 그는 원시 모태 바다 깊은 곳으로 들어가 에게리아를 찾았고, 에게리아의 감옥을 지키는 용 스킬라와 서른 낮과 서른 밤을 싸운 끝에 길을 얻었다. 그러나 만남은 위로가 되지 못했으니, 에게리아는 원시 모태 바다의 힘으로 새로운 인간 종족을 창조한 자신의 **원죄** 때문에 폰타인의 운명은 이미 정해졌다고 밝혔다. 그래도 그녀는 그에게 Primordial Water 한 잔을 건넸고, 스킬라는 그의 이상에 흥미를 느껴 원시 모태 바다를 떠나 그의 뜻에 합류했다.

- **같은 영어**: `Primordial Waters` = **원천 기행** ([Battle Pass/Primordial Waters](https://genshin-impact.fandom.com/wiki/Battle_Pass%2FPrimordial_Waters))
- `Travel Notes: Primordial Waters` = 기행·원천 ([Travel Notes: Primordial Waters](https://genshin-impact.fandom.com/wiki/Travel_Notes%3A_Primordial_Waters))
- 넣을 때: `'Primordial Water=한국어'`

### 191. Reconnaissance (3회)

예문: 4th Company는 유라가 이끄는 Reconnaissance로, 몬드의 야외로 나가 정찰하며 다가오는 적이나 이상한 현상을 살핀다. 미카가 이 Company에 속하며, 유라가 직접 돈만 항구와 몬드성을 잇는 교역로를 여러 차례 순찰한 일은 그곳이 이들의 임무 범위임을 보여준다. 10th Company는 알베도가 이끄는 Investigation으로, 기사단의 활동을 돕는 발명품을 제공하고 이상한 현상을 조사하며 정교한 연금술로 원격 정찰을 하기도 한다. 야외를 직접 도는 부대와 연금술로 멀리서 살피는 부대가 각기 다른 방식으로 기사단의 눈을 맡는 셈이다.

- `Reconnaissance Experience` = 유격 노하우 ([Reconnaissance Experience](https://genshin-impact.fandom.com/wiki/Reconnaissance_Experience))
- 넣을 때: `'Reconnaissance=한국어'`

### 195. Rules (3회)

예문: 대전 상대로는 캐릭터와 NPC를 초대할 수 있어, PvE 대전이 기본 틀을 이룬다. 친구와의 PvP도 가능하지만 그쪽에는 **보상이 없다**. 세부 규칙은 일곱 성인의 소환/Rules에서 따로 설명한다. PvE 초대 대전에는 보상이 붙고 친구와의 대전에는 보상이 없다는 점에서, 이 모드의 중심축은 NPC·캐릭터와의 대전에 놓여 있다고 볼 수 있다.

- 들어간 이름에 자주 나온 한국어: **규칙** 5개, **법칙** 2개
- `Golden Rule` = 소중한 법률 ([Golden Rule](https://genshin-impact.fandom.com/wiki/Golden_Rule))
- `Rule by Thunder` = 비뢰 어궁 ([Thundering Pulse](https://genshin-impact.fandom.com/wiki/Thundering_Pulse))
- `Unwritten Rules` = 어둠 속의 규칙 ([Unwritten Rules](https://genshin-impact.fandom.com/wiki/Unwritten_Rules))
- `The Rule of Three` = 3이라는 법칙 ([The Rule of Three](https://genshin-impact.fandom.com/wiki/The_Rule_of_Three))
- `Rules Set at Naught` = 규칙 파괴자 ([Mitya/Profile](https://genshin-impact.fandom.com/wiki/Mitya%2FProfile))
- `Wingalet Rules of Conduct` = 「윙갈레트의 규칙」 ([Wingalet Rules of Conduct](https://genshin-impact.fandom.com/wiki/Wingalet_Rules_of_Conduct))
- … 외 6개 (`data/generated/ko-name-candidates.json`)
- 넣을 때: `'Rules=한국어'`

### 197. Scarlet King (3회)

예문: Ayn Al-Ahmar는 오르모스 항구에서 활동하는 도금 여단 무리로, Scarlet King을 독실히 믿고 위대한 룩카데바타를 그에 비해 낮게 본다. 이름은 Scarlet King의 진짜 이름이라고 여겨지는 아흐마르에서 따왔다. **신앙이 곧 이름이 된 셈**이다.

- **옛 판에만**: `Scarlet King` = **적왕** ([King Deshret 2022-09-06 판](https://genshin-impact.fandom.com/wiki/King_Deshret?oldid=824141))
- 넣을 때: `'Scarlet King=한국어'`

### 198. Seeker (3회)

예문: 클레는 원신의 플레이 가능한 캐릭터이자 페보니우스 기사단 소속의 Spark Knight이다. 그녀는 마녀회의 마법사 앨리스와 “Seeker” 클라이너의 딸로, 부모가 티바트 곳곳을 다니는 동안 페보니우스 기사단에 맡겨져 자랐다. 폭발물을 만드는 재능과 폭발을 두려워하지 않는 성격은 어머니 앨리스를 닮았고, 그 때문에 돌보는 페보니우스 기사단을 곤란하게 만든다. 어린 나이에도 공식 기사로서 **Spark Knight**라는 칭호를 받았고, 도시 밖에서 폭탄을 쓰다 진에게 들켜 **독방**에 갇히는 일이 잦다.

- 들어간 이름에 자주 나온 한국어: **보물** 3개, **기계** 2개, **비밀근원** 2개, **찾는** 2개
- `Treasure Seeker` = 보물 탐험 ([Treasure Seeker](https://genshin-impact.fandom.com/wiki/Treasure_Seeker))
- `Moonlight Seeker` = 달빛을 찾아서 ([Moonlight Merriment/Moonlight Seeker](https://genshin-impact.fandom.com/wiki/Moonlight_Merriment%2FMoonlight_Seeker))
- `Swiftstep Seeker` = 날쌘 용사·밧줄꾼 ([Swiftstep Seeker](https://genshin-impact.fandom.com/wiki/Swiftstep_Seeker))
- `Seeker No Finding` = 찾을수록 얻기 힘든 법 ([Seeker No Finding](https://genshin-impact.fandom.com/wiki/Seeker_No_Finding))
- `Seeker of Shinies` = 반짝반짝 발견술 ([Seeker of Shinies](https://genshin-impact.fandom.com/wiki/Seeker_of_Shinies))
- `Saurian Treasure Seeker` = 용용 보물찾기 ([Tournament of Glory in Bloom/Saurian Treasure Seeker](https://genshin-impact.fandom.com/wiki/Tournament_of_Glory_in_Bloom%2FSaurian_Treasure_Seeker))
- … 외 9개 (`data/generated/ko-name-candidates.json`)
- 넣을 때: `'Seeker=한국어'`

### 200. Siman (3회)

예문: Siman의 오랜 친구인 Giyath Khayyam 역시 생론파의 다스투르다. 그는 스스로를 생론파 다스투르라 밝히며 편하게 하이얌이라 부르라고 말한다. 어린 시절을 함께 보낸 두 사람이 나란히 생론파에 몸담게 된 셈이다.

- `Siman Farrokhzad` = 시만·파로크자드 ([Siman Farrokhzad](https://genshin-impact.fandom.com/wiki/Siman_Farrokhzad))
- 넣을 때: `'Siman=한국어'`

### 201. Sovereign Lords (3회)

예문: 그러나 그 자리를 얻은 것은 오치칸이 아니라 스발란케였다. 스발란케가 슈코아틀을 죽이고 새로운 불의 신이 되자 인간은 용에 맞서 봉기했고, **툴란 공방전**에서 Sovereign Lords 다수가 죽어 끝까지 남은 이는 플로지스톤 팔찌에 갇힌 하나뿐이었다. 오치칸은 한때 감금되어 있었으나 스발란케의 깊은 자비를 받고 옛 부족에 받아들여진 뒤 그에게 충성을 맹세했다. 인간과의 전쟁에서 그는 용의 언어 지식으로 빛새김 각문을 해독해 인간 전사들에게 넘겼고, 용에게 배운 기술로 용을 치는 데 큰 만족을 느꼈으며 그 증오는 동료들조차 걱정할 정도였다.

- `Thirteen Sovereign Lords` = 13명의 지고한 영주 ([Thirteen Sovereign Lords](https://genshin-impact.fandom.com/wiki/Thirteen_Sovereign_Lords))
- 넣을 때: `'Sovereign Lords=한국어'`

### 203. Spoutrocks (3회)

예문: Adeptal Energy로 위치를 바꿀 수 있는 물체도 있다. 석조 조각은 수천 년의 역사 기믹의 일부로, Carefree Simulacra와 금옥 폭포 비녀도 위치를 바꿔 퍼즐을 푸는 데 쓰인다. 금옥 폭포 비녀는 과거의 의식과 진심 어린 마음에서 등장한다. Flighty Simulacra는 가까이 있는 플레이어가 높이 뛰어오르게 하며, 그 방식은 Spoutrocks와 비슷하다. Adeptal Energy는 물체의 위치를 바꾸는 데 그치지 않고 플레이어의 이동 높이까지 바꾸는 셈이다.

- **같은 영어**: `Spoutrock` = **분출 바위** ([Spoutrock](https://genshin-impact.fandom.com/wiki/Spoutrock))
- 넣을 때: `'Spoutrocks=한국어'`

### 213. Tower (3회)

예문: 바르바토스는 버려진 산 드래곤 스파인을 두린의 매장지로 정했다. 그 지역이 지닌 힘으로 두린의 몸에서 나오는 독성 물질을 붙잡아 두어 몬드를 오염에서 지키려는 뜻이었다. 바르바토스의 음악으로 힘을 얻은 드발린은 드래곤 스파인 상공에서 두린과 싸워 우세를 잡고 상대의 목덜미에 치명적인 한 입을 남겼다. 그러나 그 순간 두린의 피도 함께 삼키게 되어, 부상과 독혈은 드발린에게 큰 고통을 안겼다. 드발린은 데카라비안의 Tower 안에서 깊은 잠에 들어 회복하려 했지만, 삼킨 피가 고통을 더 심하게 만들 뿐이라는 것은 알지 못했다. **승리의 대가**로 드발린이 얻은 것은 상처와 독혈이었던 셈이다.

- 들어간 이름에 자주 나온 한국어: **탑** 12개, **고탑** 3개, **궁극자** 3개, **타워** 2개
- `Signalless Tower` = 「신호 없는 탑」 ([Signalless Tower](https://genshin-impact.fandom.com/wiki/Signalless_Tower))
- `Tower of Gestalt` = 게슈탈트의 탑 ([Tower of Ipsissimus](https://genshin-impact.fandom.com/wiki/Tower_of_Ipsissimus))
- `Lofty Clock Tower` = 우뚝 솟은 종탑 ([Lofty Clock Tower](https://genshin-impact.fandom.com/wiki/Lofty_Clock_Tower))
- `Beacon Front Tower` = 불멸의 봉화 타워 ([Beacon Front Tower](https://genshin-impact.fandom.com/wiki/Beacon_Front_Tower))
- `Tower of Inversion` = 거꾸로 된 탑 ([Tower of Inversion](https://genshin-impact.fandom.com/wiki/Tower_of_Inversion))
- `Towers of Betrayal` = 「배신의 탑」 ([Towers of Betrayal](https://genshin-impact.fandom.com/wiki/Towers_of_Betrayal))
- … 외 19개 (`data/generated/ko-name-candidates.json`)
- 넣을 때: `'Tower=한국어'`

### 220. Vaselisa Strivozha (3회)

예문: 스네즈나야가 될 땅에서는 여러 요정 씨족이 작은 공국들을 다스리고 있었다. 훗날 얼음의 신이 될 모노마흐·스네즈니는 그 땅을 떠돌며 "용맹함이 비할 데 없는 젊은 영웅의 모습"이라 불리는 존재가 되었다. 그는 필리포프와 Vaselisa Strivozha 같은 요정 왕자들을 무찌르거나 벗삼았다.

- **옛 판에만**: `Vaselisa Strivozha` = **바실리사·스트리보자** ([Vaselisa von Strivozha 2026-09-28 판](https://genshin-impact.fandom.com/wiki/Vaselisa_von_Strivozha?oldid=2186588))
- 넣을 때: `'Vaselisa Strivozha=한국어'`

### 225. Warrior (3회)

예문: 나타의 여러 고유 메커니즘 가운데 하나로 용에 빙의가 있다. 영혼 촛불이나 다 자란 사우리안 적에게 다가가면 잠시 사우리안에 영을 깃들게 해 그 특수 능력으로 여러 탐사 장치를 다룰 수 있고, 같은 능력은 해당 부족 출신 플레이 가능 캐릭터의 원소전투 스킬로도 쓸 수 있다. 곳곳의 트레이너는 Warrior의 Challenge를 열어 이 능력의 숙련도를 시험한다. 나타 고유의 적들 중 상당수는 용을 포함해 플레이어를 알아차려도 곧바로 적대하지 않으며, 용에 깃들어 있으면 플레이어가 공격하거나 근처의 용이 아닌 적을 자극하지 않는 한 다른 용을 적대하게 만들지 않고 다가갈 수 있다.

- 들어간 이름에 자주 나온 한국어: **무사** 19개, **용사** 10개, **전사** 7개, **그윽한** 6개
- `Fated Warrior` = 운명의 원정 ([Fated Warrior](https://genshin-impact.fandom.com/wiki/Fated_Warrior))
- `Canine Warrior` = 견족의 전사 ([Gorou/Profile](https://genshin-impact.fandom.com/wiki/Gorou%2FProfile))
- `Lonely Warrior` = 고독한 원정 ([Lonely Warrior](https://genshin-impact.fandom.com/wiki/Lonely_Warrior))
- `Warrior of Flame` = 화염의 적무 ([Warrior of Flame](https://genshin-impact.fandom.com/wiki/Warrior_of_Flame))
- `Labyrinth Warriors` = 미로의 전사 ([Labyrinth Warriors](https://genshin-impact.fandom.com/wiki/Labyrinth_Warriors))
- `Triumphant Warrior` = 승리의 원정 ([Triumphant Warrior](https://genshin-impact.fandom.com/wiki/Triumphant_Warrior))
- … 외 46개 (`data/generated/ko-name-candidates.json`)
- 넣을 때: `'Warrior=한국어'`

### 229. Zizhi (3회)

예문: 여행자가 노드크라이의 사건에서 서리달을 티바트로 다시 가져온 것을 종려가 알게 되면서, 그는 오래된 인연인 자백이 되살아날 수 있음을 깨달았다. 해등절을 맞아 리월에 들른 여행자는 종려가 전시회에서 찾은 유품을 만지며 신비한 공간의 이상한 여인을 만났고, 종려는 서리달 이전의 원래 "달"이 소원에 반응해 개기현상을 일으키며 여행자의 도움으로 자백의 영혼을 다시 합치면 부활할 수 있다고 설명했다. 여행자는 Zizhi를 추적해 노향향, 가명, 리수첩산진군을 잇달아 빙의하며 떠도는 그녀를 뒤쫓았고, 선인들과 함께 그녀의 시험을 통과한 뒤 낭간의 후손이 리월 전역에 퍼졌다는 사실로 그녀의 분노와 후회를 달랬다. 그러자 Zizhi는 흙의 혼을 내어주고 사라졌으며, 여행자는 종려가 맡긴 자교를 리월항에 둘러보게 한 끝에 자백의 부활을 이끌었고, 종려는 자백이 감각을 되찾는 데 시간이 걸릴 수 있다고 전했다. 이처럼 **노드크라이에서의 서리달 회수**가 자백의 부활이라는 새로운 인연을 가능하게 한 것은, 여행자의 과거 행적이 현재의 사건을 불러오는 연결고리가 됨을 보여주는 셈이다.

- **같은 영어**: `Zizhi` = **자궐** ([Zibai/Storyline](https://genshin-impact.fandom.com/wiki/Zibai%2FStoryline))
- 넣을 때: `'Zizhi=한국어'`

## 덤프에 후보가 없는 것 (124개)

게임이나 공식 자료에서 직접 확인해야 한다. 방법은 [조사 계획](ko-names-plan.md)의 「덤프에 후보가 없는 것」에 있다. 「나온 문서」는 문장이 요약된 Fandom 문서다. 어떤 임무·도감에 나오는지 찾을 때 쓴다.

| 번호 | 영어 | 횟수 | 나온 문서 |
|---|---|---|---|
| 4 | NPC | 18 |  |
| 5 | Iudex | 17 |  |
| 12 | Tianquan | 15 |  |
| 16 | Black Fire Incident | 11 |  |
| 19 | Ayn Al-Ahmar | 10 |  |
| 27 | Inazuma Bakufu | 9 |  |
| 28 | Luna III | 9 |  |
| 29 | Yuheng | 9 |  |
| 30 | Captain Beidou | 8 |  |
| 31 | Flamelord | 8 |  |
| 32 | Sacred Heir | 8 |  |
| 35 | Dragon of the East | 7 |  |
| 36 | Error | 7 |  |
| 39 | Kanjobugyo | 7 |  |
| 42 | Pyro Dragon Xiuhcoatl | 7 |  |
| 43 | Rebooting | 7 |  |
| 44 | Special Patrol | 7 |  |
| 47 | Yuehai Pavilion | 7 |  |
| 50 | Holy Lyre de | 6 |  |
| 53 | Kitezhgrad | 6 |  |
| 55 | Master Jean | 6 |  |
| 56 | Nephilheim | 6 |  |
| 60 | Teyvat Food Notes | 6 |  |
| 92 | Crux Fleet / The Crux Fleet | 6 |  |
| 65 | Augury Bird | 5 |  |
| 68 | Clementine Line | 5 |  |
| 69 | Conqueror of Demons | 5 |  |
| 71 | For Mondstadt | 5 |  |
| 72 | Great Fire of Fall Equinox | 5 |  |
| 73 | Inspector | 5 |  |
| 74 | Lantern Fae | 5 |  |
| 78 | Restorative Power | 5 |  |
| 79 | Scorchwind Conflux | 5 |  |
| 80 | Six Darshans | 5 |  |
| 82 | Tianquan Ningguang | 5 |  |
| 84 | Vision Hunt Ceremony | 5 |  |
| 108 | Phlogiston Engraving / Phlogiston Engravings | 5 |  |
| 109 | Phlogiston Wind Tunnel / Phlogiston Wind Tunnels | 5 |  |
| 175 | Mighty and Illuminated Adepti / The Mighty and Illuminated Adepti | 5 |  |
| 89 | Cavalry | 4 |  |
| 90 | Cavalry Captain | 4 |  |
| 91 | Co-Op Mode | 4 |  |
| 93 | Dakan Al-Ahmar | 4 |  |
| 94 | Dream Trawler | 4 |  |
| 95 | Giyath Khayyam | 4 |  |
| 96 | Herbad | 4 |  |
| 99 | Lion of the South | 4 |  |
| 100 | Luminous Seelie | 4 |  |
| 101 | Luna IV | 4 |  |
| 102 | Masterless Vision | 4 |  |
| 107 | Orghana | 4 |  |
| 110 | Player Level | 4 |  |
| 112 | Primordial Seawater | 4 |  |
| 113 | Raimondo Havenport | 4 |  |
| 114 | Ranged | 4 |  |
| 115 | Sacred Heir Project | 4 |  |
| 118 | Six Great Schools | 4 |  |
| 122 | Twenty-Nine Deys | 4 |  |
| 123 | Uzza | 4 |  |
| 124 | Valivija | 4 |  |
| 126 | Watatsumi Omikami | 4 |  |
| 128 | Zhangjiajie | 4 |  |
| 129 | Zhenyu | 4 |  |
| 190 | Recon Target / Recon Targets | 4 |  |
| 131 | Agha Farrokh | 3 |  |
| 133 | Ancient Dragon | 3 |  |
| 135 | Aozang | 3 |  |
| 136 | Archpriestess | 3 |  |
| 137 | Aremorica | 3 |  |
| 142 | Daughters of the Flower Goddess | 3 |  |
| 144 | Delphi Pytho | 3 |  |
| 145 | Dendrograna | 3 |  |
| 146 | Der Fr | 3 |  |
| 147 | Dragon Lord | 3 |  |
| 151 | Erinnyes of Aremorica | 3 |  |
| 152 | Evolved Children of Humanity | 3 |  |
| 153 | Exquisite Mini Broth Pot | 3 |  |
| 154 | Filii Adamici Evoluti | 3 |  |
| 157 | Gonpachi | 3 |  |
| 158 | Grand Duke Alvis | 3 |  |
| 164 | Hundred-Eyed God | 3 |  |
| 165 | Iktomisaurs | 3 |  |
| 167 | Irfan | 3 |  |
| 168 | Jnana Energy | 3 |  |
| 169 | Kitezh | 3 |  |
| 171 | Lion of Light | 3 |  |
| 172 | Lord-Artificer | 3 |  |
| 173 | Lumentorch | 3 |  |
| 176 | Millelith Brigade | 3 |  |
| 177 | New Iron and Salt Gang | 3 |  |
| 178 | Nuo Dance of Evil Conquering | 3 |  |
| 181 | Owl Statue | 3 |  |
| 182 | Phlogiston Meter | 3 |  |
| 185 | Prime of Adepti | 3 |  |
| 187 | PvE | 3 |  |
| 188 | PvP | 3 |  |
| 189 | Recon Ring | 3 |  |
| 192 | Red-Haired Warrior | 3 |  |
| 193 | Reed Miller VIII | 3 |  |
| 194 | Romanization | 3 |  |
| 196 | Ryuji-kun | 3 |  |
| 199 | Shougun | 3 |  |
| 202 | Special Attention List | 3 |  |
| 204 | Stone Tablet Amidst Gray Ash | 3 |  |
| 205 | Stove God | 3 |  |
| 206 | Strange Vase | 3 |  |
| 207 | Sumeru Desert | 3 |  |
| 208 | Tales of Humanity | 3 |  |
| 210 | Tavern Challenges | 3 |  |
| 211 | Thousand-Armed | 3 |  |
| 212 | Time Trial Challenge | 3 |  |
| 214 | Trainee Dastur | 3 |  |
| 215 | Tri-Factor Excision | 3 |  |
| 216 | Twelve Heroes | 3 |  |
| 217 | Ukumbuko | 3 |  |
| 218 | Uwezo | 3 |  |
| 219 | Valentine | 3 |  |
| 221 | Vaselisa Vodyanovna | 3 |  |
| 222 | Vinster King Irmin | 3 |  |
| 223 | Vodyanoy | 3 |  |
| 224 | Vuka | 3 |  |
| 227 | Wolf Pup | 3 |  |
| 228 | Zhanzhu the Moon-Devourer | 3 |  |
| 394 | Qucusaur Riders / Qucusaur Rider | 3 |  |
