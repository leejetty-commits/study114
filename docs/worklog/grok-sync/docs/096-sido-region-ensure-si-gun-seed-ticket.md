# 096 · Cursor — 과외 cities 시드에 군을 시와 동급으로 추가 (로컬)

- 작성일: 2026-09-24 (KST)
- 사용자 잠금: 「공부방은 주소검색 · 과외는 미리 넣은 리스트 · **시와 같은 레벨에 군을 같이 넣으면 됨**」(2026-09-24)
- 선행: [092](092-tutor-region-sido-then-si-gun-ticket.md)/[093](093-tutor-region-092-acceptance.md) 화면 L1/L2 · [094](094-signup-086-090-092-allowlist-deploy-ticket.md)/[095](095-signup-094-deploy-acceptance.md) 운영 `4660fd8`
- 기준 HEAD: `4660fd8` ≈ `origin/main` (Cursor 재확인)
- 상태: **로컬 지시** · push/`build:dothome` **금지** (「배포」 전)
- 화면 이름: **과외쌤 가입 · 활동지역** / **학생 가입 · 과외 희망** (공부방 홍보지역 주소검색 **비대상**)

---

## 0. 한 줄

공부방 홍보지역은 주소검색이라 손대지 않는다.  
과외용 cities는 서버에 **미리 적어 둔 시 목록**을 DB 칸으로 만드는 방식이다.  
그 목록에 **군 이름을 시와 같은 배열·같은 처리**로 넣어서, 화면의 「가평군」과 **글자가 같으면** 지역 번호가 붙게 한다.  
「시」글자만 통과시키는 함수는 없다. **목록에 안 적혀 있어서** 빠진 것이다.

---

## 1. 원인 (코드 근거 · 재확인 후 수정)

| 층 | 역할 | 군 |
|----|------|-----|
| `preview/shared/korea-sidos.js` | 화면 2차 목록(이미 092로 시+군) | 있음(가평군 등) |
| `src/Region/SidoRegionEnsure.php` · `PROVINCE_CITIES` | cities API·DB 시드 | **시만** (경기도 28개시, 군 0) |
| 저장 | 화면 라벨 ↔ cities `label` 일치 시 id | 군은 라벨 없어서 id 비움 |

파일 상단 주석도 「도: 도 안의 **시**까지」로 되어 있음 → **시·군**으로 고친다.

매칭은 `findRegionId` / `findBySigunguName` 등 **이름 문자열** 기준. 끝이 「시」인지만 검사하는 코드 **없음**.

---

## 2. 목표

1. `PROVINCE_CITIES` 각 도 배열에, 화면 `korea-sidos.js`의 해당 도 `cities` 중 **`…군` 항목을 동일 문자열로** 추가(시와 **같은 배열**, 같은 `ensure` 루프).
2. `ensure()` 후 `ensureAndListCities()` cities 응답에 가평군 등 **label + 숫자 id** 포함.
3. 과외쌤 활동지역·학생 과외 희망에서 경기→가평군 선택 시 **매핑 없음 알림 없이** region_id 저장 가능(로컬/프리뷰에서 증거).
4. 기존 시(의정부시 등) 매핑 **회귀 없음**.
5. 광역시 종료 규칙 유지: 인천 **강화군·옹진군**을 광역시 2차·metro 시드에 **넣지 않음**(092와 동일). 군은 **도** 하위만.

---

## 3. 군 이름 SSOT

**정본:** 운영에 있는 `preview/shared/korea-sidos.js` → `KOREA_PROVINCES[].cities` 중 라벨이 `군`으로 끝나는 항목.  
PHP에 넣을 문자열은 그 파일과 **한 글자도 다르면 안 됨**(저장 매핑 깨짐).

참고(093 대조 시점 · Cursor가 파일에서 재추출해 확정):

| 도 | 군(참고) |
|----|----------|
| 경기도 | 가평군, 양평군, 연천군 |
| 강원특별자치도 | 홍천·횡성·영월·평창·정선·철원·화천·양구·인제·고성·양양 (11) |
| 충청북도 | 보은·옥천·영동·증평·진천·괴산·음성·단양 (8) |
| 충청남도 | 금산·부여·서천·청양·홍성·예산·태안 (7) |
| 전북특별자치도 | 완주·진안·무주·장수·임실·순창·고창·부안 (8) |
| 전라남도 | korea-sidos 해당 `cities`의 군 전부 |
| 경상북도 | 동일 |
| 경상남도 | 동일 |
| 제주 | 군 0이면 추가 없음 |

보고에 **도별 군 목록 전문**(korea-sidos에서 뽑은 것)을 적을 것.

---

## 4. Allowlist (B)

```
src/Region/SidoRegionEnsure.php
```

주석·`PROVINCE_CITIES` 배열·필요 시 dong/sigungu 코드 부여가 기존 시와 **같은 ensureRow 경로**만.  
화면 JS는 092로 이미 군 있음 → **변경 금지**(라벨 불일치 발견 시에만 중단·보고).

새 테이블·마이그레이션·새 엔드포인트 → **중단·보고**.

---

## 5. 금지 (C)

```
공부방 홍보지역·주소검색 (study-room-basic-form.js 등)
학생/과외 UI 리라이트 (signup-basic · tutor-region-slots · korea-sidos) — 라벨 불일치 예외만 보고
home · provider · teaser · helpers 불필요 변경
광역시 L2에 강화군·옹진군 추가
push · build:dothome · git add -A
```

---

## 6. 구현 주의

1. `ensure` 루프의 `$i`로 만드는 `sigunguCode`가 **기존 시 행과 충돌**하지 않게: 이미 같은 `sigungu_name` 있으면 재사용(기존 find 경로). 신규 군만 insert.
2. `kind` 값이 `'city'`여도 **이름에 군을 넣는 것**이 목표. kind 문자열 바꾸면 호출부 검색 후 회귀 없으면 유지 권장.
3. 주석: 「과외지역 기본 단위 = 시·군(시군)」·「도: 시와 군」으로 수정.
4. 운영 DB에 ensure가 한 번 돌면 행이 생김 — 로컬/프리뷰에서 `listCities`에 가평군 id 출현을 증거로.

---

## 7. 스모크

1. cities(또는 `listCities` 경로) 응답에 `가평군` label + 숫자 id  
2. 경기도 2차 가평군 선택 → 저장 시 「매핑된 지역이 없습니다」 **없음** · preferred/activity region id 숫자  
3. 의정부시 기존 id 유지(회귀)  
4. 서울(광역시) 선택 = 2차 없음 유지  
5. 공부방 홍보지역 주소검색 회귀 없음  
6. push 없음 · B만 · C stage 0  

---

## 8. 붙여넣기

```
[티켓 096 · 과외 cities 시드에 군=시 동급 · 로컬만]

사용자 잠금: 공부방=주소검색 유지. 과외 cities는 미리 넣은 리스트. 시와 같은 레벨·같은 배열에 군을 같이 넣음. 「시」글자 필터 없음 — 목록 누락이 원인.
base≈4660fd8. push/build:dothome 금지. git add -A 거부.

■ 할 일
1) preview/shared/korea-sidos.js 각 도 cities 중 「…군」 문자열을 SSOT로 추출(보고에 도별 전문).
2) src/Region/SidoRegionEnsure.php PROVINCE_CITIES 해당 도 배열에 그 군을 시와 같이 추가. 주석 「시까지」→「시·군」.
3) ensure 후 cities/listCities에 가평군 등 label+id. 기존 시 회귀 없음. 광역시 강화·옹진 군 시드 금지.
4) 화면 JS 변경 금지(라벨 불일치면 중단·보고). 새 테이블/엔드포인트 금지.

■ B만
src/Region/SidoRegionEnsure.php

■ C
공부방 주소검색 · signup-basic/tutor-region-slots/korea-sidos(변경금지) · home/teaser · push

■ 스모크
cities에 가평군 id · 저장 매핑성공 · 의정부시·서울·공부방주소 회귀 · push없음

■ 보고
도별 군 목록 · 추가 전후 cities 샘플 · 가평군 id · B파일 · 스모크
```
