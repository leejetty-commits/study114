# 092 · Cursor — 과외 희망/활동지역: **1차 도·광역시 → (도만) 2차 시·군**

- 작성일: 2026-09-24 (KST)
- 사용자 잠금(필수):
  1. **1차 선택 = 도 + 광역시만** (시·군이 1차에 나오면 안 됨)
  2. **광역시를 고르면 선택 종료** (2차 없음)
  3. **도를 고르면 2차 = 시와 군 둘 다** (시만 있고 군 전원 누락 = **큰 오류**)
- 선행: [030](030-signup-tutor-region-city-mapping-ticket.md)/[032](032-signup-tutor-region-city-mapping-acceptance.md)는 **라벨→region_id 매핑**만 고침. **군 목록·1차 UX는 미해결.**
- 재현 축: 학생 가입 Basic · 희망유형 **과외쌤 찾기** (사용자). 동일 공유 모듈을 쓰는 **과외쌤 가입/마이페이지 활동지역**도 같은 규칙.
- 상태: **로컬 작업만** · push / `build:dothome` **금지**
- 기준 HEAD: `origin/main` ≈ `f6b5400` 재확인 · 워킹트리 086/090 dirty와 **커밋·스테이징 분리**

---

## 0. 한 줄

과외(시·군) 축 UI가 **「광역시·시 납작 목록」**처럼 보이거나, 도 선택 후 **시만** 나오는 상태를 깨고,  
**1차: 도|광역시 → (광역시면 끝) / (도면 2차: 시|군)** 으로 맞춘다.  
정적 목록·API cities·옵션 렌더러에 **군이 0건**인 것이 핵심 결함이다.

---

## 1. 도메인 잠금 (역할·축 섞지 말 것)

| 화면/역할 | 지역 축 | 본 티켓 |
|-----------|---------|---------|
| 학생 Basic · 희망유형 **과외쌤 찾기** | 과외 = **시·군** (도→시|군 / 광역시 단독) | **필수** |
| 과외쌤 가입 Basic · 활동지역 슬롯 | 동일 | **필수**(공유 모듈이면 한 번에) |
| 과외쌤 마이페이지 / `tutor-reg` / `tutor-ui` step-basic | 동일 공유면 | **필수·회귀** |
| 학생 · 희망유형 **공부방 찾기** | 행정동·아파트단지 주소검색 | **금지**(073/083 유지) |
| 공부방 가입·개설 주소/홍보지역 | 동·단지 | **금지** (`study-room-reg`의 `KOREA_SIDOS` 단독 셀렉트는 과외 2단과 다름 — **이번 알고리즘 대상 아님**. 손대지 말 것) |

노션/14장: 과외 = 시·군 단위. **군을 시와 동급 선택지로 포함.**

---

## 2. 정본 알고리즘 (이것만 구현)

```
[1차 드롭다운]
  옵션 = 전국 광역시·특별시·세종  +  도(특별자치도 포함)
  옵션에 「수원시」「의정부시」「가평군」 등 시·군 라벨이 보이면 실패.

[1차 = 광역시/특별시/세종]
  → 2차 숨김·비활성
  → 확정 단위 = 그 광역시(metro) 자체
  → region_id = 해당 metro 단위 id (기존 metro kind 해석 유지)

[1차 = 도]
  → 2차 표시 (필수)
  → 2차 옵션 = 그 도 소속 **시 + 군 전부** (예: 경기도 → …시 + 가평군·양평군·연천군·가평 등 **모든 군**)
  → placeholder: 「시·군 선택」(「시 선택」단독 문구 금지)
  → 확정 단위 = 선택한 시 또는 군
  → region_id = 그 시·군 city(또는 gun) 단위 id
```

저장 키는 기존 과외 축 유지(`preferred_tutor_region_id` / `tutor_regions.region_id` / `activity_city` 라벨 등).  
**의미만** 「1차 납작 시 목록」이 아니라 「도|광역시 → (필요 시) 시|군」이어야 한다.

---

## 3. 코드로 이미 확인된 결함 (가설 아님 · 재검증 후 수정)

조사일 2026-09-24, `ljh_work` `D:\work\study114`:

### 3.1 정적 목록에 군 = 0

`preview/shared/korea-sidos.js` · `KOREA_PROVINCES[].cities`:

- 파일 전체 `'…군'` 문자열 매칭 **0건**
- `'…시'` 다수(예: 경기도 `cities` **28개 시만** — 수원·성남·의정부…여주). **가평군·양평군·연천군 없음**
- `counties` / `guns` 키 **없음**

→ 도 선택 후 2차가 `prov.cities`만 쓰면 **군이 원천적으로 불가능**.

### 3.2 2차 렌더러가 「시」만 가정

`renderProvinceCityOptions(provinceCode, selectedCity, units)`:

- placeholder: **`시 선택`**
- 목록: `prov.cities` (± API `kind==='city'` 필터)
- 군 분기 없음

### 3.3 학생 「과외쌤 찾기」UI가 1단 납작 목록

`preview/auth-ui/src/screens/signup-basic.js`:

- `data-student-tutor-block` → **단일** `<select name="activity_city">`
- 옵션: `listSidoOptions()` → API 있으면 `buildSidoCityOptions(cities)` = `buildCityUnitOptions` 결과 **전체(metro+city) 납작 맵**
- API 없으면 `KOREA_SIDOS`(도+광역시)만 — 그래도 **2차 시·군 UI 자체가 없음**

사용자 증상 「1차에 광역시와 시만」과 정합: `buildSidoCityOptions`가 **시 단위를 1차처럼** 뿌림.

### 3.4 과외쌤 슬롯은 2단이지만 L2=시만

`preview/shared/tutor-region-slots.js` + `renderRegionParentOptions` / `renderProvinceCityOptions`:

- 1차: 광역시/도 (의도는 맞음)
- 2차: 위 3.1–3.2로 **군 누락**
- `scope_type: 'city'` 하드코드 구간 있음 → 군 저장 시 의미 충돌 없는지 확인·필요 시 `city`가 「시군구」의미인지 문서화. **새 enum 대수술 금지**, 기존 컬럼에 군 region_id가 들어가면 유지.

### 3.5 030/032와의 관계

030은 「의정부시 매핑 alert」해소. **군 목록 추가는 범위 밖이었다.**  
이번 티켓이 **목록·단계 UX** 정본. 매핑 함수(`regionIdFromSelection` 등)는 **군 라벨에도** id가 잡히게 확장.

### 3.6 공부방

`study-room-reg/screens.js`의 `KOREA_SIDOS` 셀렉트는 **과외 2단 알고리즘이 아님**.  
사용자: 「공부방 등록도 같은 알고리즘이면 고쳐라」→ **같은 2단·시군 목록을 쓰는 코드 경로가 있으면** 그 경로만.  
현재 `korea-sidos` import는 L1 라벨용으로 보이면 **092에서 수정 금지·보고에 “공부방 비해당” 명시.**

---

## 4. 해야 할 일 (포함)

1. **정본 UI**  
   - 학생 과외 희망지역: **1차(도|광역시) + (도일 때만) 2차(시|군)**  
   - 과외쌤 활동지역 슬롯: 동일 규칙 · 군 포함  
   - 공유 쓰는 tutor-reg / tutor-ui: 동일 회귀

2. **목록 데이터**  
   - 각 도별 **시+군 완전 목록**(최소: 사용자가 깨진다고 한 **경기도 군** — 가평·양평·연천 등 **도내 전 군**).  
   - 출처 우선순위: (A) API `cities`(또는 시군 마스터)에 군 row가 있으면 **그걸 SSOT**로 UI 채움 · (B) API에 군이 없으면 정적 `KOREA_PROVINCES`를 `cities`+`guns`(또는 `sigungu` 통합 배열)로 보강 **후** API id 매핑.  
   - API에 군이 아예 없으면: **중단하지 말고** 정적 보강 + 기존 `regionIdFrom*`이 실패하는 군은 **보고 목록**. 새 테이블·마이그레이션은 **중단·보고**.

3. **카피**  
   - 2차 placeholder/라벨: 「시·군 선택」  
   - 1차: 「광역시/도 선택」류

4. **매핑**  
   - 광역시 1차만으로 `region_id` 확정  
   - 도+시, 도+군 모두 숫자 `region_id`  
   - 030에서 고친 의정부시 등 **시 매핑 회귀 금지**

5. **검증 증거**  
   - 네트워크/콘솔 또는 payload에 `region_id` + 선택 라벨  
   - 경기도 → **가평군**(또는 목록의 실존 군) 선택 가능 · 저장 시도 시 「매핑 없음」alert 없음(또는 id 확보)

---

## 5. 하지 말 것 (C · 한 줄이라도 거부)

```
학생 공부방 희망지역 주소검색 / signup 희망지역 073·083 경로
preview/home-ui/src/study-room-reg/**          (과외 2단과 무관하면)
home provider-status · vacant · map
086 아홉 칸「완성」범위 확대 (학생 과외 지역 UI만 최소 수정은 허용)
090 메일 verify / email-verify-tab
OTP·새 인증
새 DB 테이블·새 PHP 엔드포인트·마이그레이션 대수술
git add -A · push · build:dothome
행정동·아파트단지를 과외 2차에 섞기
1차에 시·군을 다시 넣기
광역시 선택 후 억지 2차(구·동) 추가
```

`signup-basic.js`는 086 dirty와 동일 파일 → **과외 희망지역 블록·공유 import만** 최소 diff. 아홉 칸 전체 리라이트 금지.

---

## 6. Allowlist (B)

보고 실제 수정 = 이 목록 부분집합. 밖이면 **중단·보고**.

```
preview/shared/korea-sidos.js                 (목록·렌더러·매핑 · 핵심)
preview/shared/tutor-region-slots.js          (1·2차 UI · placeholder)
preview/auth-ui/src/screens/signup-basic.js   (학생 과외 희망: 단일 select → 2단)
preview/home-ui/src/tutor-reg/screens.js      (공유 회귀 시)
preview/home-ui/src/tutor-reg/city-units.js   (필요 시)
preview/tutor-ui/src/screens/step-basic.js    (필요 시)
(+ 번들/빌드 산출물은 로컬 preview 관례만 · 운영 push 금지)
```

PHP는 **region_id 저장이 군에서만 깨질 때** 최소. 새 파일 PHP 금지. 손대면 경로·이유 보고.

---

## 7. 스모크 (로컬 · push 전)

1. 학생 가입 Basic · 희망유형 **과외쌤 찾기**  
   - 1차 옵션에 **수원시·가평군 없음**. **경기도·서울 등 도|광역시만**.  
2. 1차 **서울특별시**(광역시) → 2차 없음 · 진행/저장에 region 확정.  
3. 1차 **경기도** → 2차에 **시와 군** · **가평군(또는 동등 군) 존재**.  
4. 경기도+의정부시 → region_id 매핑 (030 회귀).  
5. 경기도+가평군 → region_id 확보 · 「매핑 없음」alert 없음.  
6. 희망유형 **공부방 찾기** → 주소검색 UI **회귀 없음**.  
7. 과외쌤 가입 활동지역 슬롯 동일 1·2차.  
8. C 미포함 · push 없음 · `git status`에 090/home 대량 미스테이징 유지 가능하나 **이번 diff만** 보고.

---

## 8. 완료 보고 (필수)

1. §3 결함 재확인 여부 + API cities에 군 row 존재 여부(샘플 JSON/건수)  
2. 도별 시+군 목록 출처(API vs 정적 보강) · 경기도 군 목록 전문  
3. 학생 UI: 변경 전(단일 select) → 후(1·2차) 요약  
4. 최종 B 파일 목록 · diff 통계  
5. 스모크 1–7 증거(가능하면 스크린샷은 사용자가 Cursor에 첨부)  
6. 공부방 경로 **비해당/미수정** 명시  
7. push 안 함 · 086 아홉칸과 스테이징 분리

---

## 9. Cursor 붙여넣기 (상세 · 이 블록만으로 작업)

```
[티켓 092 · 과외 지역: 1차 도|광역시 → (도만) 2차 시·군 · 로컬만 · 상세]

사용자 잠금(2026-09-24):
- 1차 = 도 + 광역시만. 1차에 시·군 금지.
- 광역시 선택 = 그걸로 종료(2차 없음).
- 도 선택 후 2차 = 시와 군 둘 다. 지금 시만·군 전원 누락 = 큰 오류.
- 공부방 찾기(동·단지) 축과 섞지 말 것. 공부방 등록이 이 2단 알고리즘을 쓰면 그 경로만(현재 study-room-reg KOREA_SIDOS 단독이면 비해당·미수정 보고).

base≈f6b5400. push/build:dothome 금지. git add -A 거부.
030/032는 의정부시 매핑만 고침 — 군 목록·1차 UX는 미해결. 이번이 정본.

■ 이미 확인된 결함(재검증 후 수정)
1) preview/shared/korea-sidos.js KOREA_PROVINCES.cities: '…군' 0건. 경기도 28개 시만(가평군·양평군 등 없음).
2) renderProvinceCityOptions: placeholder「시 선택」, prov.cities만.
3) signup-basic.js 학생 과외 희망: 단일 select#activity_city + listSidoOptions→buildSidoCityOptions = metro+city 납작 목록 → 사용자「1차에 광역시와 시」증상.
4) tutor-region-slots: 2단이지만 L2가 cities만.

■ 목표 UI
학생 과외 희망 + 과외쌤 활동지역(+tutor-reg/tutor-ui 공유 시): 
1차 도|광역시 → 광역시면 region 확정 / 도면 2차 시·군 필수.
2차 문구「시·군 선택」. 군 라벨도 region_id 매핑(030 시 매핑 회귀 금지).

■ 데이터
API cities에 군 있으면 SSOT로 채움. 없으면 정적 시+군 보강 후 매핑. 새 테이블/마이그레이션/새 엔드포인트면 중단·보고.
최소 스모크 군: 경기도 가평군(또는 API 실존 군 전 목록).

■ Allowlist(B만)
preview/shared/korea-sidos.js
preview/shared/tutor-region-slots.js
preview/auth-ui/src/screens/signup-basic.js  (과외 희망 블록 최소 — 086 전체 리라이트 금지)
preview/home-ui/src/tutor-reg/screens.js | city-units.js (필요시)
preview/tutor-ui/src/screens/step-basic.js (필요시)
밖이면 중단·보고.

■ 금지(C)
공부방 희망 주소검색·073/083, study-room-reg(비해당시), home vacant/map, 090 verify, helpers/ProviderUsage/teaser/tmp,
새 DB, push/build, 1차에 시·군 재유입, 광역시 후 구·동 2차, 행정동을 과외 2차에 섞기.

■ 스모크
1) 1차에 시·군 라벨 없음 2) 서울→2차없음 3) 경기→시+군·가평군 4) 경기+의정부시 매핑 5) 경기+가평군 매핑
6) 공부방 희망 회귀없음 7) 과외쌤 슬롯 동일 8) push없음 · B만 보고

■ 보고
API 군 유무 · 경기도 군 목록 전문 · UI 전/후 · B파일 · 스모크 · 공부방 비해당 여부 · 086/090 미스테이징 분리
```

---

## 변경 이력

| 일시 (KST) | 내용 |
|------------|------|
| 2026-09-24 22:45 | 사용자 1차=도·광역시·광역시종료·2차시군 잠금 · 코드결함(군0·납작목록) 박음 |
