# 공식 한국어 이름 조사 계획

대상은 [한국어 이름이 필요한 말](ko-names-needed.md)이다. 조사와 확정은 사용자가 한다. LLM의 음역이나 추론으로 채우지 않고, 확인된 이름만 바꾼다.

## 진행 순서

1. **빈도순으로 조사한다.** 상위 20개가 현재 표기 노출의 절반 이상이다.
2. **로컬 Fandom 덤프를 먼저 찾는다.** 다른 문서라도 `Other Languages`의 영어 `en`이 정확히 같고 한국어 `ko`가 있으면 후보로 쓴다. 넘겨주기 대상의 이름이나 문맥상 같은 존재라는 추론은 쓰지 않는다.
3. **남은 것은 출처별로 묶는다.** 우인단, 마신·강림자, 켄리아·오대 죄인, 달, 공식 영상·출판물 순서가 효율적이다. 한국어 인게임 표기나 공식 영상·공지에서 이름 자체를 확인한다.
4. **표기 변형을 함께 처리한다.** 단수·복수와 `The` 유무를 확인하고, 긴 이름을 먼저 등록한다. `Shouki no Kami` 같은 구절은 전체를 찾고 조각만 따로 번역하지 않는다.
5. **일반어는 고유명사와 나눈다.** `Abyssal`, `Snezhnayan`, `Natlanese`, `Moon`, `Ninth`처럼 문맥에 따라 달라지는 말은 억지로 한국어 이름 사전에 넣지 않는다.

나무위키는 사람이 읽고 위치를 찾는 단서로만 쓴다. HoYoWiki 자동 수집, 클라이언트 텍스트맵, 데이터마이닝 자료는 쓰지 않는다. 근거가 없으면 영어로 남긴다.

## 기록과 반영

확정한 이름은 `data/manual/ko-names.json`에 넣는다. 공개 문서·영상은 URL과 위치를, 직접 플레이는 `{ "site": "play", "by": "이름" }`과 임무·화면을 `note`에 남긴다.

```bash
node scripts/theme/snapshots.mjs khaenriah --write --only none
```

LLM 호출 없이 다시 치환된다. `text_raw`·검증 상태·출처가 그대로인지, 한영 혼합과 조사가 어색하지 않은지, `latin_left`가 줄었는지 확인한다.

## 로컬 덤프에서 찾은 첫 후보

영어 `en`이 정확히 일치하는 행이며, 적용 전에 문맥을 확인한다.

- `Kuutar` → 쿠타르 (`Columbina/Storyline`)
- `Peruere` → 페르엘 (`Arlecchino/Storyline`)
- `The Chasm` → 층암거연 (`The Chasm (Area)`)
- `The Doctor` → 박사 (`Dottore`)
- `Haborym` → 하보림 (`Mavuika/Storyline`)
- `Curatorium of Secrets` → 비밀의 집 (`Curatorium of Secrets (Point of Interest)`)
- `Ruler of Life` → 생명의 집정관 (`Naberius`)
- `Knight of Boreas` → 북풍 기사 (`Varka/Profile`)
