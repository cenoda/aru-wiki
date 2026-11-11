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

## 후보가 있는 것 (45개)

### 2. Harbinger / Harbingers (112회)

예문: 얼음의 여왕의 Harbinger들은 신의 심장을 얻으라는 임무를 수행했고, 바르바토스의 신의 심장은 강제, 모락스의 신의 심장은 협상, 바알세불의 신의 심장은 야에 미코와의 거래로 얻었다.

- `Harbinger of Dawn` = 여명신검 ([Harbinger of Dawn](https://genshin-impact.fandom.com/wiki/Harbinger_of_Dawn))
- `"For The Harbingers!"` = 「집행관님을 위해!」 (["For The Harbingers!"](https://genshin-impact.fandom.com/wiki/%22For_The_Harbingers!%22))
- `Eleven Fatui Harbingers` = 우인단 11집행관 ([Eleven Fatui Harbingers](https://genshin-impact.fandom.com/wiki/Eleven_Fatui_Harbingers))
- `Phoenix, Harbinger of Dawn` = 여명을 알리는 불새 ([Phoenix, Harbinger of Dawn](https://genshin-impact.fandom.com/wiki/Phoenix%2C_Harbinger_of_Dawn))
- 넣을 때: `'Harbinger|Harbingers=한국어'`

### 1. Archon / Archons (90회)

예문: 심연 교단은 인간을 강하게 미워하고 Archon들이 다스리는 세상을 뒤엎기를 원한다.

- 들어간 이름에 자주 나온 한국어: **신** 6개, **바위** 4개, **전설** 4개, **마신** 3개
- `Archon War` = 마신 전쟁 ([Archon War](https://genshin-impact.fandom.com/wiki/Archon_War))
- `Archon Quest` = 마신 임무 ([Archon Quest](https://genshin-impact.fandom.com/wiki/Archon_Quest))
- `God / Archon` = 마신 / 신 ([God](https://genshin-impact.fandom.com/wiki/God))
- `The Seven Archons` = 7명의 집정관 ([The Seven](https://genshin-impact.fandom.com/wiki/The_Seven))
- `O Archon, Hear Me!` = 신이시여, 부름에 답해주소서! ([O Archon, Hear Me!](https://genshin-impact.fandom.com/wiki/O_Archon%2C_Hear_Me!))
- `Anemo Archon Statue` = 바람 신의 신상 ([Anemo Archon Statue](https://genshin-impact.fandom.com/wiki/Anemo_Archon_Statue))
- … 외 9개 (`data/generated/ko-name-candidates.json`)
- **넣지 않음**: 문맥마다 다르다. 그냥 강한 존재면 마신, 마신 전쟁에서 이겨 신의 심장을 차지한 일곱이면 집정관([조사 계획](ko-names-plan.md)).

### 6. Fatui Harbingers / Fatui Harbinger (38회)

예문: 아를레키노는 암호명 'The Knave'로 알려진 Fatui Harbingers 열한 명 중 한 명이다.

- `Eleven Fatui Harbingers` = 우인단 11집행관 ([Eleven Fatui Harbingers](https://genshin-impact.fandom.com/wiki/Eleven_Fatui_Harbingers))
- 넣을 때: `'Fatui Harbingers|Fatui Harbinger=한국어'`

### 7. Five Sinners (28회)

예문: 켄리아의 수르트알로기, 라인도티르, 베드르폴니르, 흐로프타튀르, 레리르는 심연의 부름에 이끌려 Five Sinners가 되었다.

- `The Five Sinners of Khaenri'ah` = 켄리아의 「오대 죄인」 ([Five Sinners of Khaenri'ah](https://genshin-impact.fandom.com/wiki/Five_Sinners_of_Khaenri'ah))
- 넣을 때: `'Five Sinners=한국어'`

### 8. Abyssal (23회)

예문: Abyssal의 나타 침공 중 마비카의 공격이 하늘을 깨뜨려 깨진 달 같은 행성을 드러냈고, 마비카는 이를 조사할 가치가 있다고 여행자에게 전했다.

- 들어간 이름에 자주 나온 한국어: **심연** 11개, **재앙** 2개
- `Abyssal Blight` = 심연 이슬 ([Abyssal Blight](https://genshin-impact.fandom.com/wiki/Abyssal_Blight))
- `Abyssal Traces` = 「심연」의 종적 ([Abyssal Traces](https://genshin-impact.fandom.com/wiki/Abyssal_Traces))
- `Abyssal Summons` = 심연의 부름 ([Abyssal Summons](https://genshin-impact.fandom.com/wiki/Abyssal_Summons))
- `"Abyssal Bounty"` = 「심연 생선구이」 (["Abyssal Bounty"](https://genshin-impact.fandom.com/wiki/%22Abyssal_Bounty%22))
- `Abyssal Crusader` = 심연의 별 수집가 ([Abyssal Crusader](https://genshin-impact.fandom.com/wiki/Abyssal_Crusader))
- `Abyssal Riftlines` = 심연 균열선 ([Abyssal Riftlines](https://genshin-impact.fandom.com/wiki/Abyssal_Riftlines))
- … 외 6개 (`data/generated/ko-name-candidates.json`)
- 넣을 때: `'Abyssal=한국어'`

### 10. God of the Woods (15회)

예문: 이전 풀 신은 500년 전 cataclysm 때 죽었으며 God of the Woods일 가능성이 있다

- **옛 판에만**: `God of the Woods` = **초목을 관장하던 신** ([Greater Lord Rukkhadevata 2022-07-29 판](https://genshin-impact.fandom.com/wiki/Greater_Lord_Rukkhadevata?oldid=765335))
- **옛 판에만**: `God of the Woods` = **초목의 신** ([Greater Lord Rukkhadevata 2022-03-15 판](https://genshin-impact.fandom.com/wiki/Greater_Lord_Rukkhadevata?oldid=607386))
- 넣을 때: `'God of the Woods=한국어'`

### 26. The Chasm / Chasm (14회)

예문: Katarina Snezhevna와 Nikolay Snezhevich는 Ninth Company 소속으로 The Chasm에 파견된 인물들이며 벽난로의 집에서 자란 고아이다.

- **같은 영어**: `The Chasm` = **층암거연** ([The Chasm (Area)](https://genshin-impact.fandom.com/wiki/The_Chasm_(Area)))
- 들어간 이름에 자주 나온 한국어: **층암거연** 6개, **조사** 3개, **거연** 2개, **암연** 2개
- `Chasm Conqueror` = 단사는 천암 마을보다 높다 ([Chasm Conqueror](https://genshin-impact.fandom.com/wiki/Chasm_Conqueror))
- `Chasm Adventurer` = 암연의 모험가 ([Chasm Adventurer](https://genshin-impact.fandom.com/wiki/Chasm_Adventurer))
- `Chasm Spelunkers` = 거연, 첫 탐사 ([Chasm Spelunkers](https://genshin-impact.fandom.com/wiki/Chasm_Spelunkers))
- `The Chasm: Crown` = 층암거연·왕관 ([The Chasm: Crown](https://genshin-impact.fandom.com/wiki/The_Chasm%3A_Crown))
- `The Chasm Delvers` = 층암거연 탐색기 ([The Chasm Delvers](https://genshin-impact.fandom.com/wiki/The_Chasm_Delvers))
- `Achievement: Chasm` = 업적·층암 ([Achievement: Chasm](https://genshin-impact.fandom.com/wiki/Achievement%3A_Chasm))
- … 외 11개 (`data/generated/ko-name-candidates.json`)
- 넣을 때: `'The Chasm|Chasm=한국어'`

### 16. God of Wisdom (11회)

예문: God of the Woods의 뒤를 God of Wisdom가 곧바로 이었다.

- `The Trail of the God of Wisdom` = 지혜의 신의 행방 ([The Trail of the God of Wisdom](https://genshin-impact.fandom.com/wiki/The_Trail_of_the_God_of_Wisdom))
- 넣을 때: `'God of Wisdom=한국어'`

### 20. Raiden Makoto (10회)

예문: 이후 벌어진 전쟁에서 God of the Woods와 Raiden Makoto가 사망했고 God of Wisdom과 라이덴 에이(影)가 각각 그 자리를 대신했다.

- **옛 판에만**: `Raiden Makoto` = **라이덴 마코토** ([Makoto 2022-02-20 판](https://genshin-impact.fandom.com/wiki/Makoto?oldid=586470))
- 넣을 때: `'Raiden Makoto=한국어'`

### 23. Kusanali (9회)

예문: 위대한 룩카데바타는 죽기 전에 쿠사나리 데비를 만들었지만 심연과 싸우다 지쳐 Kusanali는 기억이 없는 아이로 태어났다.

- `Lesser Lord Kusanali` = 쿠사나리 데비 ([Nahida/Storyline](https://genshin-impact.fandom.com/wiki/Nahida%2FStoryline))
- 넣을 때: `'Kusanali=한국어'`

### 24. Kuutar (9회)

예문: Kuutar는 약 오백 년 전 예언에 따라 맹세를 잃은 자의 성소에서 태어나 서리달 아이와 살았으나, 기도에 대한 답을 못하게 되자 그곳을 떠났다.

- **같은 영어**: `Kuutar` = **쿠타르** ([Columbina/Storyline](https://genshin-impact.fandom.com/wiki/Columbina%2FStoryline))
- 넣을 때: `'Kuutar=한국어'`

### 25. Peruere (9회)

예문: Peruere의 신비한 불 속성은 쿠자비나에 의해 유전 저주와 유사한 것으로 판단되었다.

- **같은 영어**: `Peruere` = **페르엘** ([Arlecchino/Storyline](https://genshin-impact.fandom.com/wiki/Arlecchino%2FStoryline))
- 넣을 때: `'Peruere=한국어'`

### 27. Crimson Witch of Flame (8회)

예문: 피에로는 도토레와 판탈로네, Crimson Witch of Flame in 무구의 꽃 등을 직접 영입했다.

- **같은 영어**: `Crimson Witch of Flames` = **불타오르는 화염의 마녀** ([Crimson Witch of Flames](https://genshin-impact.fandom.com/wiki/Crimson_Witch_of_Flames))
- `Artifact Strongbox: Crimson Witch of Flames` = 신성한 상자: 불타오르는 화염의 마녀 ([Artifact Strongbox: Crimson Witch of Flames](https://genshin-impact.fandom.com/wiki/Artifact_Strongbox%3A_Crimson_Witch_of_Flames))
- 넣을 때: `'Crimson Witch of Flame=한국어'`

### 29. Lord of the Night (8회)

예문: 카피타노는 마비카를 대신해 자신의 생명력을 Lord of the Night에게 옮기고 희생했다.

- **옛 판에만**: `Lord of the Night` = **밤의 신** ([Yohualtecuhtin, Lord of the Night 2025-01-07 판](https://genshin-impact.fandom.com/wiki/Yohualtecuhtin%2C_Lord_of_the_Night?oldid=1702020))
- 들어간 이름에 자주 나온 한국어: **밤** 2개
- `Achievement: Lord of the Night` = 업적·밤의 주인 ([Achievement: Lord of the Night](https://genshin-impact.fandom.com/wiki/Achievement%3A_Lord_of_the_Night))
- `Yohualtecuhtin, Lord of the Night` = 밤의 신 ([Yohualtecuhtin, Lord of the Night](https://genshin-impact.fandom.com/wiki/Yohualtecuhtin%2C_Lord_of_the_Night))
- 넣을 때: `'Lord of the Night=한국어'`

### 35. Heart of Naberius / The Heart of Naberius (8회)

예문: 라인도티르가 Heart of Naberius를 삼켜 나베리우스와 하나가 된 뒤 알베도는 이 세상의 진실과 의미를 찾는 임무를 받았다.

- **옛 판에만**: `The Heart of Naberius` = **나베리우스의 심장** ([Heart of Naberius 2025-05-07 판](https://genshin-impact.fandom.com/wiki/Heart_of_Naberius?oldid=1747433))
- 넣을 때: `'Heart of Naberius|The Heart of Naberius=한국어'`

### 34. Anemo Archon (7회)

예문: 안드리우스의 힘은 옛 Archon이 준 것으로 알려졌으며, 그 Archon이 누구인지는 알려지지 않았고 이전 Anemo Archon일 가능성도 제시된다.

- `Anemo Archon Statue` = 바람 신의 신상 ([Anemo Archon Statue](https://genshin-impact.fandom.com/wiki/Anemo_Archon_Statue))
- `Beloved of the Anemo Archon` = 바람신의 총아 ([Beloved of the Anemo Archon](https://genshin-impact.fandom.com/wiki/Beloved_of_the_Anemo_Archon))
- 넣을 때: `'Anemo Archon=한국어'`

### 36. The Abyss (7회)

예문: The Abyss는 티바트의 세 영역 중 하나인 Void Realm을 가리키는 말이다.

- **같은 영어**: `Abyss` = **심연** ([Abyss](https://genshin-impact.fandom.com/wiki/Abyss))
- 들어간 이름에 자주 나온 한국어: **심연** 20개, **메이지** 6개, **봉독자** 3개, **사도** 3개
- `Abyss Mage` = 심연 메이지 ([Abyss Mage](https://genshin-impact.fandom.com/wiki/Abyss_Mage))
- `Abyss Order` = 심연 교단 ([Abyss Order](https://genshin-impact.fandom.com/wiki/Abyss_Order))
- `Abyss Herald` = 심연 사도 ([Abyss Herald](https://genshin-impact.fandom.com/wiki/Abyss_Herald))
- `Abyss Lector` = 심연 봉독자 ([Abyss Lector](https://genshin-impact.fandom.com/wiki/Abyss_Lector))
- `Spiral Abyss` = 나선 비경 ([Spiral Abyss](https://genshin-impact.fandom.com/wiki/Spiral_Abyss))
- `Into the Abyss` = 심연 ([Into the Abyss](https://genshin-impact.fandom.com/wiki/Into_the_Abyss))
- … 외 17개 (`data/generated/ko-name-candidates.json`)
- 넣을 때: `'The Abyss=한국어'`

### 37. The Doctor (7회)

예문: Il Dottore는 암호명 The Doctor로도 불리는 우인단 11집행관 중 두 번째 집행관이다

- **같은 영어**: `The Doctor` = **박사** ([Dottore](https://genshin-impact.fandom.com/wiki/Dottore))
- **옛 판에만**: `The Doctor` = **도토레** ([Heretic of the False Moon 2026-01-17 판](https://genshin-impact.fandom.com/wiki/Heretic_of_the_False_Moon?oldid=2017365))
- 들어간 이름에 자주 나온 한국어: **의사** 2개
- `Doctor Spout` = 뿜뿜 고래 박사 ([Doctor Spout](https://genshin-impact.fandom.com/wiki/Doctor_Spout))
- `Traveling Doctor` = 떠돌이 의사 ([Traveling Doctor](https://genshin-impact.fandom.com/wiki/Traveling_Doctor))
- `Mask of the Virtuous Doctor` = 의사의 가면 ([Mask of the Virtuous Doctor](https://genshin-impact.fandom.com/wiki/Mask_of_the_Virtuous_Doctor))
- 넣을 때: `'The Doctor=한국어'`

### 38. Yohualtecuhtin (7회)

예문: 카피타노는 심연을 물리치기 위해 마비카를 지원하다가, 마비카의 죽음 대신 Yohualtecuhtin와 합체해 자신을 희생했다.

- `Yohualtecuhtin, Lord of the Night` = 밤의 신 ([Yohualtecuhtin, Lord of the Night](https://genshin-impact.fandom.com/wiki/Yohualtecuhtin%2C_Lord_of_the_Night))
- 넣을 때: `'Yohualtecuhtin=한국어'`

### 69. Sinner / Sinners (7회)

예문: 정체불명의 Sinner는 Chlothar Alberich가 심연 교단을 결성하도록 영감을 주었다.

- **같은 영어**: `"Sinner"` = **「죄인」** ([Vedrfolnir](https://genshin-impact.fandom.com/wiki/Vedrfolnir))
- `The Five Sinners of Khaenri'ah` = 켄리아의 「오대 죄인」 ([Five Sinners of Khaenri'ah](https://genshin-impact.fandom.com/wiki/Five_Sinners_of_Khaenri'ah))
- `To Turn Each Sin Against the Sinner` = 악행의 대가 ([To Turn Each Sin Against the Sinner](https://genshin-impact.fandom.com/wiki/To_Turn_Each_Sin_Against_the_Sinner))
- 넣을 때: `'Sinner|Sinners=한국어'`

### 40. Haborym (6회)

예문: 불 신의 심장은 여전히 Haborym이 가지고 있다.

- **같은 영어**: `Haborym` = **하보림** ([Mavuika/Storyline](https://genshin-impact.fandom.com/wiki/Mavuika%2FStoryline))
- 넣을 때: `'Haborym=한국어'`

### 41. Khemia (6회)

예문: 알베도는 Khemia 기술에 대한 지식 때문에 자신을 위험하다고 여기며 벤티와 데인슬레이프도 이를 잘 안다.

- `The Art of Khemia` = 흑토술 ([Art of Khemia](https://genshin-impact.fandom.com/wiki/Art_of_Khemia))
- 넣을 때: `'Khemia=한국어'`

### 47. Moon / Moons (6회)

예문: 아리아는 영원의 달이 파괴된 뒤에도 Moon의 거울 속에 살아남았다.

- 들어간 이름에 자주 나온 한국어: **달** 57개, **공월** 12개, **달빛** 12개, **노래** 10개
- `Moon Pie` = 달빛 파이 ([Moon Pie](https://genshin-impact.fandom.com/wiki/Moon_Pie))
- `Blue Moon` = 블루문 ([Blue Moon](https://genshin-impact.fandom.com/wiki/Blue_Moon))
- `True Moon` = 진실의 달 ([True Moon](https://genshin-impact.fandom.com/wiki/True_Moon))
- `Death Moon` = 죽음의 달 ([Death Moon](https://genshin-impact.fandom.com/wiki/Death_Moon))
- `Frost Moon` = 서리의 달 ([Canon](https://genshin-impact.fandom.com/wiki/Canon))
- `Frost Moon` = 서리달 ([Frost Moon](https://genshin-impact.fandom.com/wiki/Frost_Moon))
- … 외 137개 (`data/generated/ko-name-candidates.json`)
- 넣을 때: `'Moon|Moons=한국어'`

### 44. Curve (5회)

예문: 산드로네가 모소·롬브로소의 연구와 창작물인 Curve에 관심을 보인 Fatui Harbingers라는 해석이 강하게 암시된다.

- **같은 영어**: `"Curve"` = **「곡선」** (["Curve"](https://genshin-impact.fandom.com/wiki/%22Curve%22))
- 넣을 때: `'Curve=한국어'`

### 46. Lupus Boreas (5회)

예문: 안드리우스는 Lupus Boreas로도 알려진 몬드의 울프 영지를 지키는 존재이다.

- `Lupus Boreas, Dominator of Wolves` = 북풍의 왕랑, 울프의 영주 ([Andrius](https://genshin-impact.fandom.com/wiki/Andrius))
- 넣을 때: `'Lupus Boreas=한국어'`

### 50. Rosalyne (5회)

예문: 500년 전 몬드 출신의 Rosalyne는 연인 로스탐이 cataclysm에서 사망하자 액체 불과 같은 몸으로 변해 Crimson Witch of Flame이 되었다.

- `Rosalyne-Kruzchka Lohefalter` = 로잘린 크루즈카 로헤팔터 ([Signora](https://genshin-impact.fandom.com/wiki/Signora))
- 넣을 때: `'Rosalyne=한국어'`

### 51. Snezhnayan (5회)

예문: 그들은 우인단에서 가장 강하고 지위가 가장 높으며 Snezhnayan 사회의 부유하고 강력한 구성원들이다.

- 들어간 이름에 자주 나온 한국어: **민가** 2개, **스네즈나야** 2개
- `Snezhnayan Dwelling: "Elegant Carvings"` = 스네즈나야 민가-「우아한 조각」 ([Snezhnayan Dwelling: "Elegant Carvings"](https://genshin-impact.fandom.com/wiki/Snezhnayan_Dwelling%3A_%22Elegant_Carvings%22))
- `Snezhnayan Dwelling: "Warm-Toned Portico"` = 스네즈나야 민가-「따뜻한 색」 ([Snezhnayan Dwelling: "Warm-Toned Portico"](https://genshin-impact.fandom.com/wiki/Snezhnayan_Dwelling%3A_%22Warm-Toned_Portico%22))
- 넣을 때: `'Snezhnayan=한국어'`

### 52. Sumeru Academia (5회)

예문: 도토레는 고향에서 쫓겨난 뒤 Sumeru Academia에 들어갔으나 괴물과 미친 사람으로 취급받았다.

- **옛 판에만**: `Sumeru Academia` = **수메르 아카데미아** ([Sumeru Akademiya 2022-07-13 판](https://genshin-impact.fandom.com/wiki/Sumeru_Akademiya?oldid=745707))
- 넣을 때: `'Sumeru Academia=한국어'`

### 53. The Traveler (5회)

예문: 일곱 신은 The Traveler와 형제의 존재를 알고 그 도래를 기다려 왔다

- **같은 영어**: `Traveler` = **여행자** ([Traveler](https://genshin-impact.fandom.com/wiki/Traveler))
- 들어간 이름에 자주 나온 한국어: **여행자** 6개, **궤적** 5개, **유성** 5개, **바람** 2개
- `Cake for Traveler` = 여행자에게 주는 케이크 ([Cake for Traveler](https://genshin-impact.fandom.com/wiki/Cake_for_Traveler))
- `Traveler on the Road` = 「길 위의 행인」 ([Traveler on the Road](https://genshin-impact.fandom.com/wiki/Traveler_on_the_Road))
- `Amber: Greetings, Traveler` = 엠버·안녕, 여행자 ([Amber: Greetings, Traveler](https://genshin-impact.fandom.com/wiki/Amber%3A_Greetings%2C_Traveler))
- `Footprints of the Traveler` = 유성의 궤적 ([Footprints of the Traveler](https://genshin-impact.fandom.com/wiki/Footprints_of_the_Traveler))
- `Box Lunch from the Traveler` = 여행자의 수제 도시락 ([Box Lunch from the Traveler](https://genshin-impact.fandom.com/wiki/Box_Lunch_from_the_Traveler))
- `Traveler Observation Report` = 여행자 관찰 보고 ([Traveler Observation Report](https://genshin-impact.fandom.com/wiki/Traveler_Observation_Report))
- … 외 12개 (`data/generated/ko-name-candidates.json`)
- 넣을 때: `'The Traveler=한국어'`

### 55. Alberich (4회)

예문: Alberich 출신 클로타르가 심연 교단을 세웠고 여행자의 형제자매도 나중에 합류했다.

- `Alberich Clan` = 알베리히 일족 ([Alberich Clan](https://genshin-impact.fandom.com/wiki/Alberich_Clan))
- 넣을 때: `'Alberich=한국어'`

### 57. Curatorium of Secrets (4회)

예문: 이네파의 말에 따르면 네페르는 Curatorium of Secrets의 책임자다.

- **같은 영어**: `Curatorium of Secrets` = **비밀의 집** ([Curatorium of Secrets (Point of Interest)](https://genshin-impact.fandom.com/wiki/Curatorium_of_Secrets_(Point_of_Interest)))
- 들어간 이름에 자주 나온 한국어: **비밀** 2개, **집** 2개
- `Medicine from the Curatorium of Secrets` = 「비밀의 집」이 제공한 약 ([Medicine from the Curatorium of Secrets](https://genshin-impact.fandom.com/wiki/Medicine_from_the_Curatorium_of_Secrets))
- `A Commission From the Curatorium of Secrets` = 비밀의 집 의뢰 ([A Commission From the Curatorium of Secrets](https://genshin-impact.fandom.com/wiki/A_Commission_From_the_Curatorium_of_Secrets))
- 넣을 때: `'Curatorium of Secrets=한국어'`

### 61. Kami (4회)

예문: 수메르에서 Shouki no Kami라는 인공 신이 되어 싸웠으나 패배한 뒤 혼수 상태가 되어 쿠사나리 데비에게 숨겨졌다.

- 들어간 이름에 자주 나온 한국어: **의** 2개, **정기** 2개
- `Shouki no Kami, the Prodigal` = 「정기(正機)의 신」 ([Everlasting Lord of Arcane Wisdom](https://genshin-impact.fandom.com/wiki/Everlasting_Lord_of_Arcane_Wisdom))
- `The Shrine of Shouki no Kami` = 정기(正機)의 신전 ([The Shrine of Shouki no Kami](https://genshin-impact.fandom.com/wiki/The_Shrine_of_Shouki_no_Kami))
- 넣을 때: `'Kami=한국어'`

### 62. Katherynes (4회)

예문: 산드로네는 Katherynes를 만든 창조자이다.

- **같은 영어**: `Katheryne` = **캐서린** ([Katheryne](https://genshin-impact.fandom.com/wiki/Katheryne))
- `Katheryne in Inazuma` = 이나즈마에 있는 캐서린 ([Katheryne in Inazuma](https://genshin-impact.fandom.com/wiki/Katheryne_in_Inazuma))
- 넣을 때: `'Katherynes=한국어'`

### 65. Oratrice Mecanique (4회)

예문: 포칼로스가 Oratrice Mecanique d'Analyse Cardinale를 통해 자신을 처형한 뒤에는 느비예트가 신의 심장을 얻었다.

- `Oratrice Mecanique d'Analyse Cardinale` = 계시 판결 장치 ([Oratrice Mecanique d'Analyse Cardinale](https://genshin-impact.fandom.com/wiki/Oratrice_Mecanique_d'Analyse_Cardinale))
- 넣을 때: `'Oratrice Mecanique=한국어'`

### 67. Ruler of Life (4회)

예문: 라인도티르는 나베리우스를 섭취하고 결합한 뒤 네 번 겹친 그림자 중 Ruler of Life의 기능을 맡았다.

- **같은 영어**: `Ruler of Life` = **생명의 집정관** ([Naberius](https://genshin-impact.fandom.com/wiki/Naberius))
- **옛 판에만**: `Ruler of Life` = **나베리우스** ([Naberius 2025-10-15 판](https://genshin-impact.fandom.com/wiki/Naberius?oldid=1863403))
- 넣을 때: `'Ruler of Life=한국어'`

### 68. Shouki (4회)

예문: 수메르에서 Shouki no Kami라는 인공 신이 되어 싸웠으나 패배한 뒤 혼수 상태가 되어 쿠사나리 데비에게 숨겨졌다.

- 들어간 이름에 자주 나온 한국어: **의** 2개, **정기** 2개
- `Shouki no Kami, the Prodigal` = 「정기(正機)의 신」 ([Everlasting Lord of Arcane Wisdom](https://genshin-impact.fandom.com/wiki/Everlasting_Lord_of_Arcane_Wisdom))
- `The Shrine of Shouki no Kami` = 정기(正機)의 신전 ([The Shrine of Shouki no Kami](https://genshin-impact.fandom.com/wiki/The_Shrine_of_Shouki_no_Kami))
- 넣을 때: `'Shouki=한국어'`

### 106. Fontainian / Fontainians (4회)

예문: 아를레키노는 Fontainian이라고 주장하지만 실제로는 켄리아 출신이다.

- 들어간 이름에 자주 나온 한국어: **폰타인** 4개, **메시지** 2개
- `A Fontainian Message` = 폰타인으로부터의 메시지 ([A Fontainian Message](https://genshin-impact.fandom.com/wiki/A_Fontainian_Message))
- `A Fontainian Message` = 폰타인식 메시지 ([A Fontainian Message (Achievement)](https://genshin-impact.fandom.com/wiki/A_Fontainian_Message_(Achievement)))
- `Fontainian Foie Gras` = 폰타인 푸아그라 ([Fontainian Foie Gras](https://genshin-impact.fandom.com/wiki/Fontainian_Foie_Gras))
- `Fontainian Onion Soup` = 폰타인 양파 수프 ([Fontainian Onion Soup](https://genshin-impact.fandom.com/wiki/Fontainian_Onion_Soup))
- `Recollections of a Fontainian` = 어느 폰타인 사람의 회상 ([Recollections of a Fontainian](https://genshin-impact.fandom.com/wiki/Recollections_of_a_Fontainian))
- `Fontainian Carpet: "Fair and Square"` = 폰타인 카펫-「네모반듯」 ([Fontainian Carpet: "Fair and Square"](https://genshin-impact.fandom.com/wiki/Fontainian_Carpet%3A_%22Fair_and_Square%22))
- 넣을 때: `'Fontainian|Fontainians=한국어'`

### 76. Cretaceus (3회)

예문: 알베도는 라인도티르의 Primordial Human Project에서 완성된 마지막 결과물이며 Cretaceus로 분류되었다.

- 들어간 이름에 자주 나온 한국어: **백악** 2개
- `Princeps Cretaceus` = 백악의 아이 자리 ([Princeps Cretaceus](https://genshin-impact.fandom.com/wiki/Princeps_Cretaceus))
- `Princeps Cretaceus Chapter` = 백악의 장 ([Princeps Cretaceus Chapter](https://genshin-impact.fandom.com/wiki/Princeps_Cretaceus_Chapter))
- 넣을 때: `'Cretaceus=한국어'`

### 79. Knight of Boreas (3회)

예문: 페보니우스 기사단의 대단장 바르카는 현 Knight of Boreas이지만 안드리우스와의 관계는 불명확하다.

- **같은 영어**: `Knight of Boreas` = **북풍 기사** ([Varka/Profile](https://genshin-impact.fandom.com/wiki/Varka%2FProfile))
- 넣을 때: `'Knight of Boreas=한국어'`

### 81. Nagamasa (3회)

예문: 이름이 없던 스카라무슈는 타타라스나에 머물며 Nagamasa의 무리에게 "wandering eccentric"라 불렸다.

- 들어간 이름에 자주 나온 한국어: **나가마사** 3개, **벤** 2개, **카츠라기** 2개
- `Mikoshi Nagamasa` = 미코시 나가마사 ([Mikoshi Nagamasa](https://genshin-impact.fandom.com/wiki/Mikoshi_Nagamasa))
- `Katsuragikiri Nagamasa` = 카츠라기를 벤 나가마사 ([Katsuragikiri Nagamasa](https://genshin-impact.fandom.com/wiki/Katsuragikiri_Nagamasa))
- `Diagram: Katsuragikiri Nagamasa` = 도감: 카츠라기를 벤 나가마사 ([Diagram: Katsuragikiri Nagamasa](https://genshin-impact.fandom.com/wiki/Diagram%3A_Katsuragikiri_Nagamasa))
- 넣을 때: `'Nagamasa=한국어'`

### 82. Ninth (3회)

예문: 판탈로네는 거상라는 암호명을 가진 우인단 11집행관의 Ninth이다.

- `Li the Ninth` = 이구룡 ([Li the Ninth](https://genshin-impact.fandom.com/wiki/Li_the_Ninth))
- `Chang the Ninth` = 상구야 ([Chang the Ninth](https://genshin-impact.fandom.com/wiki/Chang_the_Ninth))
- 넣을 때: `'Ninth=한국어'`

### 83. Niwa (3회)

예문: Kabukimono는 도토레가 준 상자 속 심장이 Niwa의 짓이라 믿게 되자 분노와 슬픔으로 타타라스나를 떠났다.

- 들어간 이름에 자주 나온 한국어: **니와** 3개
- `Niwa Clan` = 니와 가문 ([Niwa Clan](https://genshin-impact.fandom.com/wiki/Niwa_Clan))
- `Niwa Hisahide` = 니와 히사히데 ([Niwa Hisahide](https://genshin-impact.fandom.com/wiki/Niwa_Hisahide))
- `Niwa Nagamitsu` = 니와 나가미츠 ([Niwa Nagamitsu](https://genshin-impact.fandom.com/wiki/Niwa_Nagamitsu))
- 넣을 때: `'Niwa=한국어'`

### 87. Teyvat Travel Guides (3회)

예문: 앨리스는 클레의 어머니이자 Teyvat Travel Guides를 쓴 유명한 모험가이다.

- **같은 영어**: `Teyvat Travel Guide` = **티바트 유람 가이드** ([Teyvat Travel Guide](https://genshin-impact.fandom.com/wiki/Teyvat_Travel_Guide))
- 넣을 때: `'Teyvat Travel Guides=한국어'`

### 89. The Heavenly Principles (3회)

예문: 쿠쿨칸은 The Heavenly Principles를 티바트 밖에서 왔고 세계수에 기록되지 않은 존재로 불렀고, 쿠사나리 데비는 첫 번째로 온 존재라는 가설을 세웠다.

- **같은 영어**: `Heavenly Principles` = **천리** ([Heavenly Principles](https://genshin-impact.fandom.com/wiki/Heavenly_Principles))
- 넣을 때: `'The Heavenly Principles=한국어'`

### 90. The Tsaritsa (3회)

예문: The Tsaritsa는 일곱 신의 신의 심장을 모두 모으려 하며 현재 세 개는 우인단이 보유한 것으로 알려졌다

- **같은 영어**: `Tsaritsa` = **얼음의 여왕** ([Anastasya](https://genshin-impact.fandom.com/wiki/Anastasya))
- `For the Tsaritsa!` = 경례·여왕 폐하를 위하여 ([For the Tsaritsa!](https://genshin-impact.fandom.com/wiki/For_the_Tsaritsa!))
- 넣을 때: `'The Tsaritsa=한국어'`

## 덤프에 후보가 없는 것 (41개)

게임이나 공식 자료에서 직접 확인해야 한다. 방법은 [조사 계획](ko-names-plan.md)의 「덤프에 후보가 없는 것」에 있다. 「나온 문서」는 문장이 요약된 Fandom 문서다. 어떤 임무·도감에 나오는지 찾을 때 쓴다.

| 번호 | 영어 | 횟수 | 나온 문서 |
|---|---|---|---|
| 4 | Sibling | 44 | [Abyss](https://genshin-impact.fandom.com/wiki/Abyss), [Abyss Order](https://genshin-impact.fandom.com/wiki/Abyss_Order), [Cataclysm](https://genshin-impact.fandom.com/wiki/Cataclysm), [Dainsleif](https://genshin-impact.fandom.com/wiki/Dainsleif) 외 8 |
| 5 | Il Dottore | 35 | [Capitano](https://genshin-impact.fandom.com/wiki/Capitano), [Dottore](https://genshin-impact.fandom.com/wiki/Dottore), [Eleven Fatui Harbingers](https://genshin-impact.fandom.com/wiki/Eleven_Fatui_Harbingers), [Fatui](https://genshin-impact.fandom.com/wiki/Fatui) 외 2 |
| 15 | Khaenri'ahn / Khaenri'ahns | 23 | [Capitano](https://genshin-impact.fandom.com/wiki/Capitano), [Cataclysm](https://genshin-impact.fandom.com/wiki/Cataclysm), [Dainsleif/Storyline](https://genshin-impact.fandom.com/wiki/Dainsleif%2FStoryline), [Descender](https://genshin-impact.fandom.com/wiki/Descender) 외 8 |
| 9 | Eleven Harbingers | 22 | [Dottore](https://genshin-impact.fandom.com/wiki/Dottore), [Eleven Fatui Harbingers](https://genshin-impact.fandom.com/wiki/Eleven_Fatui_Harbingers), [Fatui](https://genshin-impact.fandom.com/wiki/Fatui), [Pantalone](https://genshin-impact.fandom.com/wiki/Pantalone) 외 5 |
| 11 | Dragon King Nibelung | 14 | [Aria](https://genshin-impact.fandom.com/wiki/Aria), [Canon](https://genshin-impact.fandom.com/wiki/Canon), [Light Realm](https://genshin-impact.fandom.com/wiki/Light_Realm), [Sonnet](https://genshin-impact.fandom.com/wiki/Sonnet) 외 1 |
| 12 | Human Realm | 14 | [Abyss](https://genshin-impact.fandom.com/wiki/Abyss), [Heavenly Principles](https://genshin-impact.fandom.com/wiki/Heavenly_Principles), [Light Realm](https://genshin-impact.fandom.com/wiki/Light_Realm) |
| 13 | Electro Gnosis | 13 | [Capitano](https://genshin-impact.fandom.com/wiki/Capitano), [Dottore](https://genshin-impact.fandom.com/wiki/Dottore), [Fatui](https://genshin-impact.fandom.com/wiki/Fatui), [Gnosis](https://genshin-impact.fandom.com/wiki/Gnosis) 외 1 |
| 14 | Third Descender | 13 | [Descender](https://genshin-impact.fandom.com/wiki/Descender), [Gnosis](https://genshin-impact.fandom.com/wiki/Gnosis) |
| 19 | Chlothar Alberich | 10 | [Abyss](https://genshin-impact.fandom.com/wiki/Abyss), [Abyss Order](https://genshin-impact.fandom.com/wiki/Abyss_Order), [Hilichurls](https://genshin-impact.fandom.com/wiki/Hilichurls), [Khaenri'ah](https://genshin-impact.fandom.com/wiki/Khaenri'ah) |
| 22 | First Descender | 9 | [Descender](https://genshin-impact.fandom.com/wiki/Descender), [Heavenly Principles](https://genshin-impact.fandom.com/wiki/Heavenly_Principles) |
| 28 | Geo Gnosis | 8 | [Anastasya](https://genshin-impact.fandom.com/wiki/Anastasya), [Gnosis](https://genshin-impact.fandom.com/wiki/Gnosis), [Tartaglia/Storyline](https://genshin-impact.fandom.com/wiki/Tartaglia%2FStoryline) |
| 30 | Lunar Palace | 8 | [Aria](https://genshin-impact.fandom.com/wiki/Aria), [Columbina/Storyline](https://genshin-impact.fandom.com/wiki/Columbina%2FStoryline), [Three Moons](https://genshin-impact.fandom.com/wiki/Three_Moons) |
| 31 | Primordial Human Project | 8 | [Albedo/Storyline](https://genshin-impact.fandom.com/wiki/Albedo%2FStoryline), [Rhinedottir](https://genshin-impact.fandom.com/wiki/Rhinedottir) |
| 32 | Teyvat Chapter Storyline | 8 | [Abyss Order](https://genshin-impact.fandom.com/wiki/Abyss_Order), [Dainsleif](https://genshin-impact.fandom.com/wiki/Dainsleif), [Nahida/Storyline](https://genshin-impact.fandom.com/wiki/Nahida%2FStoryline) |
| 33 | Void Realm | 8 | [Abyss](https://genshin-impact.fandom.com/wiki/Abyss), [Light Realm](https://genshin-impact.fandom.com/wiki/Light_Realm) |
| 39 | Goddess of the Iridescent Moon | 6 | [Moon Marrow](https://genshin-impact.fandom.com/wiki/Moon_Marrow), [Sonnet](https://genshin-impact.fandom.com/wiki/Sonnet) |
| 42 | Kingdom of Khaenri'ah | 6 | [Heavenly Principles](https://genshin-impact.fandom.com/wiki/Heavenly_Principles), [Khaenri'ah](https://genshin-impact.fandom.com/wiki/Khaenri'ah), [Khaenri'ahn Dynasties](https://genshin-impact.fandom.com/wiki/Khaenri'ahn_Dynasties) |
| 58 | Divine Throne / Divine Thrones | 6 | [The Seven](https://genshin-impact.fandom.com/wiki/The_Seven) |
| 45 | King Irmin | 5 | [Hroptatyr](https://genshin-impact.fandom.com/wiki/Hroptatyr), [Pierro](https://genshin-impact.fandom.com/wiki/Pierro), [Tholindis](https://genshin-impact.fandom.com/wiki/Tholindis) |
| 48 | Moon Goddess | 5 | [Columbina](https://genshin-impact.fandom.com/wiki/Columbina), [Columbina/Storyline](https://genshin-impact.fandom.com/wiki/Columbina%2FStoryline), [Moon Marrow](https://genshin-impact.fandom.com/wiki/Moon_Marrow) |
| 49 | Palestar Edict | 5 | [Columbina](https://genshin-impact.fandom.com/wiki/Columbina), [Sandrone](https://genshin-impact.fandom.com/wiki/Sandrone) |
| 54 | Trilune Goddess | 5 | [Columbina/Storyline](https://genshin-impact.fandom.com/wiki/Columbina%2FStoryline), [Three Moons](https://genshin-impact.fandom.com/wiki/Three_Moons) |
| 56 | Analyse Cardinale | 4 | [Gnosis](https://genshin-impact.fandom.com/wiki/Gnosis) |
| 59 | Fourth Descender | 4 | [Descender](https://genshin-impact.fandom.com/wiki/Descender) |
| 60 | Hydro Dragon Sovereign | 4 | [The Seven](https://genshin-impact.fandom.com/wiki/The_Seven) |
| 63 | Natlanese | 4 | [Fatui](https://genshin-impact.fandom.com/wiki/Fatui), [Ley Line](https://genshin-impact.fandom.com/wiki/Ley_Line), [Mavuika/Profile](https://genshin-impact.fandom.com/wiki/Mavuika%2FProfile) |
| 64 | Ninth Company | 4 | [Arlecchino](https://genshin-impact.fandom.com/wiki/Arlecchino), [Pulcinella](https://genshin-impact.fandom.com/wiki/Pulcinella) |
| 66 | Pedrelino | 4 | [Eleven Fatui Harbingers](https://genshin-impact.fandom.com/wiki/Eleven_Fatui_Harbingers), [Pierro](https://genshin-impact.fandom.com/wiki/Pierro) |
| 70 | Teyvat Chapter Storyline Preview | 4 | [Nahida/Storyline](https://genshin-impact.fandom.com/wiki/Nahida%2FStoryline) |
| 71 | Three Moon Sisters | 4 | [Columbina/Storyline](https://genshin-impact.fandom.com/wiki/Columbina%2FStoryline) |
| 72 | Vahumana Darshan | 4 | [Wanderer/Storyline](https://genshin-impact.fandom.com/wiki/Wanderer%2FStoryline) |
| 73 | Archon Quest Chapter III | 3 | [Dottore](https://genshin-impact.fandom.com/wiki/Dottore), [Nahida/Storyline](https://genshin-impact.fandom.com/wiki/Nahida%2FStoryline) |
| 74 | Authorities | 3 | [Heavenly Principles](https://genshin-impact.fandom.com/wiki/Heavenly_Principles) |
| 75 | Collected Miscellany | 3 | [Dainsleif](https://genshin-impact.fandom.com/wiki/Dainsleif) |
| 77 | Fall of Khaenri'ah | 3 | [Dainsleif](https://genshin-impact.fandom.com/wiki/Dainsleif), [Dainsleif/Profile](https://genshin-impact.fandom.com/wiki/Dainsleif%2FProfile), [Khaenri'ahn Dynasties](https://genshin-impact.fandom.com/wiki/Khaenri'ahn_Dynasties) |
| 78 | Goetic | 3 | [Mavuika](https://genshin-impact.fandom.com/wiki/Mavuika) |
| 80 | Mondstadt Cathedral | 3 | [Signora](https://genshin-impact.fandom.com/wiki/Signora) |
| 84 | Primordial Albedo | 3 | [Albedo/Profile](https://genshin-impact.fandom.com/wiki/Albedo%2FProfile), [Rhinedottir](https://genshin-impact.fandom.com/wiki/Rhinedottir) |
| 85 | Riftwolves | 3 | [Abyss](https://genshin-impact.fandom.com/wiki/Abyss), [Rhinedottir](https://genshin-impact.fandom.com/wiki/Rhinedottir) |
| 88 | The Dendro Archon | 3 | [Nahida/Storyline](https://genshin-impact.fandom.com/wiki/Nahida%2FStoryline) |
| 112 | Khaenri'ans / Khaenri'an | 3 | [Cataclysm](https://genshin-impact.fandom.com/wiki/Cataclysm), [Sonnet](https://genshin-impact.fandom.com/wiki/Sonnet), [Nefer/Storyline](https://genshin-impact.fandom.com/wiki/Nefer%2FStoryline) |
