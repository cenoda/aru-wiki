# 한국어 이름이 필요한 말

`scripts/theme/snapshots.mjs`가 만든다(손으로 고치지 않는다). 켄리아 스냅샷에서 검증을 통과한 문장에 영어로 남은 이름이다.
3번 이상 나온 것만 적었다. 전체 283개, 여기 95개.

Fandom 표(`{{Other Languages}}`)에 이 이름 자체의 한국어가 없어서 남았다. 넘겨주기 대상 문서의 한국어는 정체가 드러날 수 있어 쓰지 않는다(예: Gold → 라인도티르).
찾은 이름은 `data/manual/ko-names.json`에 출처와 함께 넣는다. 그다음 `node scripts/theme/snapshots.mjs khaenriah --write --only none`을 실행하면 LLM 호출 없이 바뀐다.
게임 안 표기를 직접 본 것이면 출처는 `{ "site": "play", "by": "이름" }`.

| 영어 | 나온 횟수 | 나온 별 | 예문 |
|---|---|---|---|
| Archon | 80 | 심연 교단, 아나스타샤·표도로브나·스네즈나야, 보레아스, 셀레스티아 외 9 | 심연 교단은 인간을 강하게 미워하고 Archon들이 다스리는 세상을 뒤엎기를 원한다. |
| Harbinger | 62 | 아나스타샤·표도로브나·스네즈나야, 아를레키노, 카피타노, 콜롬비나 외 11 | 얼음의 여왕의 Harbinger들은 신의 심장을 얻으라는 임무를 수행했고, 바르바토스의 신의 심장은 강제, 모락스의 신의 심장은 협상, 바알세불의 신의 심장은 야에 미코와의 거래로 얻었다. |
| Harbingers | 50 | 카피타노, 콜롬비나, 우인단 11집행관, 우인단 외 6 | 카피타노는 스카라무슈를 제외한 다른 Harbingers와 함께 장례식에 참석해 Il Dottore에게 스카라무슈와 Electro Gnosis의 상황을 물었다. |
| Sibling | 44 | 심연, 심연 교단, 대재앙, 데인슬레이프 외 6 | 여행자의 Sibling은 알려지지 않은 이유로 심연 교단의 우두머리가 되었다. |
| Dendro Archon | 35 | 풀 신, 위대한 룩카데바타, 세계수, 나히다 | Dendro Archon은 풀의 땅인 수메르를 다스리는 Archon이다 |
| Il Dottore | 35 | 카피타노, 도토레, 우인단 11집행관, 우인단 외 2 | 카피타노는 스카라무슈를 제외한 다른 Harbingers와 함께 장례식에 참석해 Il Dottore에게 스카라무슈와 Electro Gnosis의 상황을 물었다. |
| Fatui Harbingers | 29 | 아를레키노, 카피타노, 콜롬비나, 우인단 외 5 | 아를레키노는 암호명 'The Knave'로 알려진 Fatui Harbingers 열한 명 중 한 명이다. |
| Five Sinners | 28 | 심연, 데인슬레이프, 켄리아의 「오대 죄인」, 흐로프타튀르 외 5 | 켄리아의 수르트알로기, 라인도티르, 베드르폴니르, 흐로프타튀르, 레리르는 심연의 부름에 이끌려 Five Sinners가 되었다. |
| Pyro Archon | 24 | 마비카, 불 신 | 마비카는 고대 이름을 지닌 나타의 현직 Pyro Archon이자 전쟁의 신이다. |
| Abyssal | 23 | 거짓된 하늘, 플린스, 천리, 켄리아 외 7 | Abyssal의 나타 침공 중 마비카의 공격이 하늘을 깨뜨려 깨진 달 같은 행성을 드러냈고, 마비카는 이를 조사할 가치가 있다고 여행자에게 전했다. |
| Eleven Harbingers | 22 | 도토레, 우인단 11집행관, 우인단, 판탈로네 외 4 | Il Dottore는 우인단의 Eleven Harbingers 중 한 명인 외교관이다. |
| God of the Woods | 15 | 풀 신, 위대한 룩카데바타, 나히다, 일곱 신 | 이전 Dendro Archon은 500년 전 cataclysm 때 죽었으며 God of the Woods일 가능성이 있다 |
| Dragon King Nibelung | 14 | 아리아, 캐넌, 광계, 소넷 외 1 | 영원의 달은 Dragon King Nibelung이 우주를 여행하는 동안 대신 세계를 다스리라고 만든 세 달 중 하나이다. |
| Human Realm | 14 | 심연, 천리, 광계 | 심연의 어둠은 광계의 힘과 정반대이며 Human Realm의 존재를 타락시킬 수 있다. |
| Electro Gnosis | 13 | 카피타노, 도토레, 우인단, 신의 심장 외 1 | 카피타노는 스카라무슈를 제외한 다른 Harbingers와 함께 장례식에 참석해 Il Dottore에게 스카라무슈와 Electro Gnosis의 상황을 물었다. |
| Third Descender | 13 | 강림자, 신의 심장 | Third Descender의 유해로 신의 심장이 만들어졌고 강림자에게 원소 힘이 본래 있다고 추측된다. |
| Khaenri'ahn | 12 | 카피타노, 대재앙, 데인슬레이프, 강림자 외 5 | 그는 불사의 저주를 받아 Khaenri'ahn들과 함께 살아남았고 이후 우인단에 합류해 첫 번째 Harbinger인 대장이 되었다. |
| God of Wisdom | 11 | 위대한 룩카데바타, 나히다, 일곱 신 | God of the Woods의 뒤를 God of Wisdom가 곧바로 이었다. |
| Khaenri'ahns | 11 | 아나스타샤·표도로브나·스네즈나야, 거짓된 하늘, 천리, 켄리아 | Anastasya Feodorovna의 후손들은 결국 Khaenri'ahns가 되었다. |
| Archons | 10 | 심연 교단, 아나스타샤·표도로브나·스네즈나야, 셀레스티아, 세계수 | 심연 교단은 켄리아 출신 사람들이 Archons를 파괴하는 방식으로 복수하고자 만든 조직이다. |
| Chlothar Alberich | 10 | 심연, 심연 교단, 츄츄족, 켄리아 | Chlothar Alberich는 심연 자체의 의지로 보이는 존재에게 심연의 힘을 받아 심연 교단을 만들었다. |
| Hydro Archon | 10 | 아를레키노, 일곱 신 | 아를레키노는 푸리나와 느비예트를 조사하다가 두 사람이 Hydro Archon이 아니라고 의심했고 물 신의 심장이 숨겨졌다고 결론지었다. |
| Raiden Makoto | 10 | 일곱 신 | 이후 벌어진 전쟁에서 God of the Woods와 Raiden Makoto가 사망했고 God of Wisdom과 라이덴 에이(影)가 각각 그 자리를 대신했다. |
| Fatui Harbinger | 9 | 아를레키노, 카피타노, 콜롬비나, 산드로네 외 1 | 아를레키노는 Fatui Harbinger 중 네 번째이며 벽난로의 집의 현 책임자이다. |
| First Descender | 9 | 강림자, 천리 | 쿠사나리 데비는 천리가 First Descender라고 추측했다. |
| Kusanali | 9 | 풀 신, 강림자, 나히다 | 위대한 룩카데바타는 죽기 전에 쿠사나리 데비를 만들었지만 심연과 싸우다 지쳐 Kusanali는 기억이 없는 아이로 태어났다. |
| Kuutar | 9 | 콜롬비나, 달의 정수 | Kuutar는 약 오백 년 전 예언에 따라 맹세를 잃은 자의 성소에서 태어나 서리달 아이와 살았으나, 기도에 대한 답을 못하게 되자 그곳을 떠났다. |
| Peruere | 9 | 아를레키노, 쿠자비나, 피에로 | Peruere의 신비한 불 속성은 쿠자비나에 의해 유전 저주와 유사한 것으로 판단되었다. |
| The Chasm | 9 | 아를레키노, 츄츄족, 풀치넬라, 세 달 외 1 | Katarina Snezhevna와 Nikolay Snezhevich는 Ninth Company 소속으로 The Chasm에 파견된 인물들이며 벽난로의 집에서 자란 고아이다. |
| Crimson Witch of Flame | 8 | 피에로, 시뇨라 | 피에로는 도토레와 판탈로네, Crimson Witch of Flame in 무구의 꽃 등을 직접 영입했다. |
| Geo Gnosis | 8 | 아나스타샤·표도로브나·스네즈나야, 신의 심장, 타르탈리아 | 시뇨라는 그녀를 대신해 바람과 Geo Gnosis를 수집했는데, 전자는 바르바토스에게서 강제로 빼앗았다. |
| Lord of the Night | 8 | 카피타노, 지맥, 밤의 신의 나라 | 카피타노는 마비카를 대신해 자신의 생명력을 Lord of the Night에게 옮기고 희생했다. |
| Lunar Palace | 8 | 아리아, 콜롬비나, 세 달 | 아리아와 자매들은 Lunar Palace에 머물며 한 달에 세 번씩 한 명씩 밤하늘의 주권을 번갈아 맡았다. |
| Primordial Human Project | 8 | 알베도, 라인도티르 | 알베도는 라인도티르의 Primordial Human Project에서 완성된 마지막 결과물이며 Cretaceus로 분류되었다. |
| Teyvat Chapter Storyline | 8 | 심연 교단, 데인슬레이프, 나히다 | 심연 교단은 Teyvat Chapter Storyline의 주요 적대 세력 중 하나이다. |
| Void Realm | 8 | 심연, 광계 | The Abyss는 티바트의 세 영역 중 하나인 Void Realm을 가리키는 말이다. |
| Anemo Archon | 7 | 보레아스, 시뇨라, 일곱 신 | 안드리우스의 힘은 옛 Archon이 준 것으로 알려졌으며, 그 Archon이 누구인지는 알려지지 않았고 이전 Anemo Archon일 가능성도 제시된다. |
| Heart of Naberius | 7 | 알베도, 라인도티르 | 라인도티르가 Heart of Naberius를 삼켜 나베리우스와 하나가 된 뒤 알베도는 이 세상의 진실과 의미를 찾는 임무를 받았다. |
| The Abyss | 7 | 심연, 타르탈리아 | The Abyss는 티바트의 세 영역 중 하나인 Void Realm을 가리키는 말이다. |
| The Doctor | 7 | 도토레, 판탈로네 | Il Dottore는 암호명 The Doctor로도 불리는 우인단 11집행관 중 두 번째 집행관이다 |
| Yohualtecuhtin | 7 | 카피타노, 지맥, 밤의 신의 나라 | 카피타노는 심연을 물리치기 위해 마비카를 지원하다가, 마비카의 죽음 대신 Yohualtecuhtin와 합체해 자신을 희생했다. |
| Goddess of the Iridescent Moon | 6 | 달의 정수, 소넷 | 현재 알려진 달의 정수는 아리아의 잔해와 Goddess of the Iridescent Moon의 심연에 오염된 잔해에서 생긴 두 개이며, 살아 있는 콜롬비나가 있는 서리달에는 없다. |
| Haborym | 6 | 신의 심장, 마비카, 불 신 | 불 신의 심장은 여전히 Haborym이 가지고 있다. |
| Khemia | 6 | 알베도, 두린, 라인도티르 | 알베도는 Khemia 기술에 대한 지식 때문에 자신을 위험하다고 여기며 벤티와 데인슬레이프도 이를 잘 안다. |
| Kingdom of Khaenri'ah | 6 | 천리, 켄리아, 붉은 달의 왕조 | 500년 전 대재앙에서는 Kingdom of Khaenri'ah에서 솟아난 Abyssal power를 막기 위해 개입했고 이후 잠들어 있다. |
| Chasm | 5 | 우인단, 츄츄족 | 귀공자가 Overlord of the Vortex를 소환한 뒤 리월에 남은 우인단은 의심받았고, Chasm에 있던 자들은 버려져 적대자로 낙인찍혔다. |
| Curve | 5 | 산드로네 | 산드로네가 모소·롬브로소의 연구와 창작물인 Curve에 관심을 보인 Fatui Harbingers라는 해석이 강하게 암시된다. |
| Hitotachi | 5 | 시뇨라 | 시뇨라는 라이덴 쇼군의 왕좌 앞 결투에서 여행자에게 패배한 뒤 무상의 일태도로 처형되었다. |
| King Irmin | 5 | 흐로프타튀르, 피에로, 솔린디스 | 흐로프타튀르는 King Irmin에게 아첨해 Four Pillars 중 가장 총애를 받는 인물이자 베드르폴니르와 함께 왕의 신뢰하는 하인이 되었다. |
| Lupus Boreas | 5 | 보레아스 | 안드리우스는 Lupus Boreas로도 알려진 몬드의 울프 영지를 지키는 존재이다. |
| Moon | 5 | 아리아, 캐넌, 콜롬비나, 소넷 | 아리아는 영원의 달이 파괴된 뒤에도 Moon의 거울 속에 살아남았다. |
| Moon Goddess | 5 | 콜롬비나, 달의 정수 | 콜롬비나는 서리달 아이가 숭배한 Moon Goddess이자 우인단의 전 Third이다. |
| Musou | 5 | 시뇨라 | 시뇨라는 라이덴 쇼군의 왕좌 앞 결투에서 여행자에게 패배한 뒤 무상의 일태도로 처형되었다. |
| Palestar Edict | 5 | 콜롬비나, 산드로네 | 우인단은 비용을 불문하고 콜롬비나를 찾기 위해 Palestar Edict의 최고 명령을 내렸다. |
| Rosalyne | 5 | 시뇨라 | 500년 전 몬드 출신의 Rosalyne는 연인 로스탐이 cataclysm에서 사망하자 액체 불과 같은 몸으로 변해 Crimson Witch of Flame이 되었다. |
| Snezhnayan | 5 | 우인단 11집행관 | 그들은 우인단에서 가장 강하고 지위가 가장 높으며 Snezhnayan 사회의 부유하고 강력한 구성원들이다. |
| Sumeru Academia | 5 | 도토레, 피에로, 시뇨라 | 도토레는 고향에서 쫓겨난 뒤 Sumeru Academia에 들어갔으나 괴물과 미친 사람으로 취급받았다. |
| The Traveler | 5 | 일곱 신, 쌍둥이 남매 | 일곱 신은 The Traveler와 형제의 존재를 알고 그 도래를 기다려 왔다 |
| Trilune Goddess | 5 | 콜롬비나, 세 달 | 도토레에게 잡힌 뒤 Moon Gate를 통해 Lunar Palace로 이동해 Three Moon Sisters의 권한을 이어받아 Trilune Goddess가 되었다. |
| Alberich | 4 | 심연 교단 | Alberich 출신 클로타르가 심연 교단을 세웠고 여행자의 형제자매도 나중에 합류했다. |
| Analyse Cardinale | 4 | 신의 심장 | 포칼로스가 Oratrice Mecanique d'Analyse Cardinale를 통해 자신을 처형한 뒤에는 느비예트가 신의 심장을 얻었다. |
| Curatorium of Secrets | 4 | 네페르 | 이네파의 말에 따르면 네페르는 Curatorium of Secrets의 책임자다. |
| Divine Throne | 4 | 일곱 신 | Hydro Archon의 Divine Throne이 파괴되어 Hydro Dragon Sovereign에게 권한이 돌아갔고, 현재 Divine Thrones는 여섯 개만 남았다. |
| Fourth Descender | 4 | 강림자 | 여행자는 Fourth Descender로 알려진 인물이다. |
| Hydro Dragon Sovereign | 4 | 일곱 신 | Hydro Archon의 Divine Throne이 파괴되어 Hydro Dragon Sovereign에게 권한이 돌아갔고, 현재 Divine Thrones는 여섯 개만 남았다. |
| Kami | 4 | 방랑자 | 수메르에서 Shouki no Kami라는 인공 신이 되어 싸웠으나 패배한 뒤 혼수 상태가 되어 쿠사나리 데비에게 숨겨졌다. |
| Katherynes | 4 | 산드로네 | 산드로네는 Katherynes를 만든 창조자이다. |
| Natlanese | 4 | 우인단, 지맥, 마비카 | 나타에서 심연이 대규모 침공을 시작하자 우인단은 Natlanese와 함께 싸웠으며 큰 피해를 입었다. |
| Ninth Company | 4 | 아를레키노, 풀치넬라 | Katarina Snezhevna와 Nikolay Snezhevich는 Ninth Company 소속으로 The Chasm에 파견된 인물들이며 벽난로의 집에서 자란 고아이다. |
| Oratrice Mecanique | 4 | 신의 심장 | 포칼로스가 Oratrice Mecanique d'Analyse Cardinale를 통해 자신을 처형한 뒤에는 느비예트가 신의 심장을 얻었다. |
| Pedrelino | 4 | 우인단 11집행관, 피에로 | 번호는 힘의 순위가 아니라 선임 순서를 뜻하며 Pedrelino가 가장 먼저, 타르탈리아가 가장 최근에 합류했다. |
| Ruler of Life | 4 | 라인도티르 | 라인도티르는 나베리우스를 섭취하고 결합한 뒤 네 번 겹친 그림자 중 Ruler of Life의 기능을 맡았다. |
| Shouki | 4 | 방랑자 | 수메르에서 Shouki no Kami라는 인공 신이 되어 싸웠으나 패배한 뒤 혼수 상태가 되어 쿠사나리 데비에게 숨겨졌다. |
| Sinner | 4 | 심연, 심연 교단, 네페르 | 정체불명의 Sinner는 Chlothar Alberich가 심연 교단을 결성하도록 영감을 주었다. |
| Teyvat Chapter Storyline Preview | 4 | 나히다 | 데인슬레이프는 Teyvat Chapter Storyline Preview에서 지혜의 신이 스스로 생각하는 만큼 현명하지 않다고 시사했다. |
| Three Moon Sisters | 4 | 콜롬비나 | 도토레에게 잡힌 뒤 Moon Gate를 통해 Lunar Palace로 이동해 Three Moon Sisters의 권한을 이어받아 Trilune Goddess가 되었다. |
| Vahumana Darshan | 4 | 방랑자 | 그는 현재 수메르 아카데미아의 Vahumana Darshan에서 정치학을 전공하며 학생으로 있고 나히다를 은밀히 돕는다. |
| Archon Quest Chapter III | 3 | 도토레, 나히다 | 도토레는 Archon Quest Chapter III, Act III에서 수메르 아카데미아의 현자들과 협력하고 있었다고 드러났다. |
| Authorities | 3 | 천리 | 천리는 일곱 왕과 싸워 승리하고 그들의 원소 Authorities를 빼앗았다 |
| Collected Miscellany | 3 | 데인슬레이프 | 데인슬레이프는 켄리아를 다룬 Teyvat Chapter Storyline의 주요 인물이자 Collected Miscellany 영상의 내레이터이다. |
| Cretaceus | 3 | 알베도, 라인도티르 | 알베도는 라인도티르의 Primordial Human Project에서 완성된 마지막 결과물이며 Cretaceus로 분류되었다. |
| Fall of Khaenri'ah | 3 | 데인슬레이프, 붉은 달의 왕조 | 그는 기억이 거의 사라졌다고 말하지만 Fall of Khaenri'ah의 사건은 생생하게 떠올리는 것으로 보인다. |
| Goetic | 3 | 마비카 | 마비카는 Goetic 이름 Haborym을 가진 전쟁의 신이자 나타의 현재 불의 집정관이다. |
| Knight of Boreas | 3 | 보레아스, 바르카 | 페보니우스 기사단의 대단장 바르카는 현 Knight of Boreas이지만 안드리우스와의 관계는 불명확하다. |
| Mondstadt Cathedral | 3 | 시뇨라 | 시뇨라는 Mondstadt Cathedral 밖에서 우인단 요원과 함께 여행자와 벤티를 제압하고 벤티를 찌른 뒤 신의 심장을 빼앗았다 |
| Nagamasa | 3 | 방랑자 | 이름이 없던 스카라무슈는 타타라스나에 머물며 Nagamasa의 무리에게 "wandering eccentric"라 불렸다. |
| Ninth | 3 | 판탈로네 | 판탈로네는 거상라는 암호명을 가진 우인단 11집행관의 Ninth이다. |
| Niwa | 3 | 방랑자 | Kabukimono는 도토레가 준 상자 속 심장이 Niwa의 짓이라 믿게 되자 분노와 슬픔으로 타타라스나를 떠났다. |
| Primordial Albedo | 3 | 알베도, 라인도티르 | Primordial Albedo와 「악마의 꽃」 같은 모조품은 알베도의 목 표식을 갖고 있지 않다. |
| Riftwolves | 3 | 심연, 라인도티르 | 라인도티르는 황금으로 불리며 Riftwolves와 두린을 포함해 심연과 관련된 생명들을 만들었다. |
| Sinners | 3 | 레리르, 수르트알로기, 베드르폴니르 | 솔린디스가 다른 세계로 떠난 뒤 레리르는 다른 Sinners와 함께 심연의 힘을 받아들여 그녀를 찾으려 하였다. |
| Teyvat Travel Guides | 3 | 앨리스 | 앨리스는 클레의 어머니이자 Teyvat Travel Guides를 쓴 유명한 모험가이다. |
| The Dendro Archon | 3 | 나히다 | The Dendro Archon는 수메르를 다스리는 지혜의 신이다. |
| The Heavenly Principles | 3 | 천리 | 쿠쿨칸은 The Heavenly Principles를 티바트 밖에서 왔고 세계수에 기록되지 않은 존재로 불렀고, 쿠사나리 데비는 첫 번째로 온 존재라는 가설을 세웠다. |
| The Tsaritsa | 3 | 신의 심장 | The Tsaritsa는 일곱 신의 신의 심장을 모두 모으려 하며 현재 세 개는 우인단이 보유한 것으로 알려졌다 |
