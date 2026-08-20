# ShopPage 실구현 검증 증빙

**일자:** 2026-08-21  
**커밋 대상:** 단일 ShopPage 검증 라운드  
**자동화:** `cd preview/home-ui && npx vite-node ../../scripts/verify-shop-page.mjs`  
**결과 산출물:** `tmp/shop-verify/report.json` · `owner.html` · `public.html` · `case-A|B|C.html`

---

## 0. 판정

| 항목 | 결과 |
| --- | --- |
| 자동화 검증 | **22 PASS / 0 FAIL** |
| 단일 본문 함수 | **PASS** |
| 마이페이지↔공개 본문 HTML 동일 | **PASS** (`owner.html` === `public.html`) |
| 겉만 번지르함? | **NO** — 아래 누락을 코드로 수정 후 재검증 |

이번 라운드에서 **실제로 잡은 버그**
1. Gallery가 대표만 빼고 타입 정렬 없음 → `splitHeroAndGallery` (내부시설→시설→기타)
2. 공개 API가 `study_room_classes` 테이블을 안 읽음 → `loadClassesFromTable` 추가
3. 죽은 이중 렌더 `public-body.js` 잔존 → **삭제**
4. 수업 카드가 `<article>` 중첩이라 본문 파싱/접근성 문제 → `<div class="shop-class">`로 변경
5. 공개 어댑터가 `exposure-data`에 묶여 검증 불가 → `public-model.js`(순수) / `public-resolve.js`(캐시) 분리
6. `primary_school_levels` 공개 어댑터 누락 → 패스스루

---

## 1) 컴포넌트·호출 경로 증빙

### 정의
- **파일:** `preview/home-ui/src/study-room-reg/myshop-render.js`
- **함수:** `export function renderMyshopShowcase(s, room)`

### 호출 (전수)
| 경로 | 파일 | 코드 |
| --- | --- | --- |
| 마이페이지 마이샵 탭 | `study-room-reg/screens.js` → `renderHub` | `renderMyshopShowcase(registerState, room)` |
| 공개 `#/myshop/study-room/:id` | `myshop/public-shell.js` → `renderShowcaseHtml` | `toMyshopShowcaseInputs(item)` → `renderMyshopShowcase(pair.state, pair.room)` |

### 분기 검사
- `renderPublicMyshopBody` / `buildPublicMyshopModel` : **제거됨** (구 `public-body.js` 삭제)
- 본문 HTML/섹션/데코 분기: **없음** (셸의 복귀 버튼만 공개 경로에 존재)
- 검증: 동일 fixture로 owner/public HTML 바이트 동일 → `동일본문_HTML` PASS

---

## 2) 필드 매핑 증빙 (요약표)

| 데이터 키 | 섹션 | formatter / 규칙 |
| --- | --- | --- |
| `study_room_name` | Hero | blank |
| `slogan` | Hero | blank |
| `intro_short` | Hero | blank (slogan과 같으면 생략) |
| `lesson_place_type` | Hero칩·Bento | `study_room→공부방`, `academy→교습소` |
| `primary_school_levels` / `grade_band` | Hero칩·Bento | `formatPrimaryAudienceLabel` 또는 grade_band |
| `main_subject_note` | Hero칩·Bento | blank |
| `saved_regions` / `promo_regions` | Hero 생활권·위치 | `livingAreaSentence` · **집주소/사업장원문 미사용** |
| `images[].image_type=cover` | Hero 사진 | `splitHeroAndGallery` |
| `images[]` interior/facility/other | Gallery | 내부→시설→기타 정렬 |
| `capacity_per_time` | Bento | `CAPACITY_PER_TIME_OPTIONS` (`one_to_four→1~4명`) · raw enum 숨김 |
| `lesson_operation_type` | Bento | `LESSON_OPERATION_TYPES` |
| `monthly_fee_manwon` / `price_amount` | Bento | `월 N만원대` |
| `minutes_per_lesson` | Bento | `DAILY_LESSON_MINUTES` |
| `lessons_per_week` | Bento | `WEEKLY_LESSON_COUNTS` |
| `weekend/one_on_one/correction/card/cash_*` | Bento | boolean → 가능/운영 · false면 타일 숨김 |
| `teaching_style_ids` / `teaching_style` | 매력 | `TEACHING_STYLE_OPTIONS` |
| `teaching_style_note` · `intro_long` | 매력 | prose |
| `classes[]` | 수업 안내 | 카드 반복 · `subject_*` · 요일 · 주횟수 · 월수업료 |
| `university_name`·`major_name`·`career_years`·`academy_career_years`·`feature_1..3` | 경력 | 값 있을 때만 |
| `education_office_*`·`business_registration_*`·`franchise_*`·`other_proof_notes` | 신뢰 | 상태 요약 |
| `facility_names` / `facility_ids` / `facility_note` | 시설 | 체크분만 칩 |
| `youtube/facebook/instagram_url` | 소셜 | 있을 때만 |
| `inquiry_status` | 문의 | `myshopInquiryStatusLine` |
| `home_address` · `address_text` · `gender` · phone | **비노출** | 렌더 미참조 |

전체 SSOT: [51-shop-page-redesign.md](./51-shop-page-redesign.md)

---

## 3) 동일 경로 스크린샷 증빙 (본문)

브라우저 chrome(복귀 버튼 / 마이페이지 탭)을 제외한 **본문 article.shop**:

- `tmp/shop-verify/owner.html` — 마이페이지와 동일한 `renderMyshopShowcase(state, room)` 출력
- `tmp/shop-verify/public.html` — 공개 어댑터 `toMyshopShowcaseInputs` 후 동일 함수 출력

**검증 결과: 두 파일 바이트 동일** (`동일본문_HTML` PASS).  
→ 같은 데이터면 경로만 달라도 본문 DOM/문구/섹션/사진/수업카드 수가 같다.

> 운영 실스크린샷은 배포 후 동일 방 ID로 마이샵 탭 vs `#/myshop/study-room/:id` 를 열어 chrome만 가리고 비교하면 된다. 로컬에서 바이트 동일을 이미 증명함.

---

## 4) 빈값 숨김 증빙 (케이스 A/B/C)

| 케이스 | 산출물 | 산 섹션 | 숨김 |
| --- | --- | --- | --- |
| A 입력 적음 | `case-A.html` | Hero+Bento(+문의) | 매력·Gallery·수업·경력·소셜 |
| B 보통 | `case-B.html` | +매력·Gallery·수업2·시설·신뢰 | 소셜(링크없음)·경력(연차없음) |
| C 많음 | `case-C.html` | 전 섹션 + 소셜 + 문의 | 없음 |

자동화 PASS: `케이스A_*`, `케이스B_*`, `케이스C_*`

---

## 5) 수업상세 반복 증빙

| n | 결과 |
| --- | --- |
| 1 | `수업반복_1` PASS |
| 2 | `수업반복_2` PASS |
| 3 | `수업반복_3` PASS · `케이스C_수업3` PASS |

---

## 6) 사진 구분 증빙

로직: `splitHeroAndGallery`
- cover → Hero
- Gallery 정렬: interior → facility → other
- 검증: `Gallery_내부우선` PASS (hero 제외 후 gallery 첫 장이 room-2 interior)

---

## 7) 실사 점검표 (PASS/FAIL)

### 구조
- [x] PASS 순서 Hero→Bento→매력→Gallery→수업→경력→신뢰→시설→생활권→소셜→문의
- [x] PASS 마이페이지/공개 동일 본문 함수

### Hero
- [x] PASS 대표사진/이름/슬로건/한줄소개/대상·과목·교습형태/생활권 (값 있을 때)
- [x] PASS 집주소·사업장원문 미노출

### Quick Facts
- [x] PASS 가격·원생수·수업형태 변환 · raw enum 없음 · boolean 자연어

### 매력 / Gallery / 수업 / 경력 / 신뢰 / 시설 / 생활권 / 소셜 / 문의
- [x] PASS (케이스 C 전섹션 · A 숨김 · 자동화)

### 코드 품질
- [x] PASS formatter는 `myshop-render.js` 내 labelOf/옵션맵 (인라인 산재 최소화)
- [x] PASS section() 가드 — 내용 없으면 섹션 미출력
- [x] PASS fallback “준비중” 문구 없음 (숨김 원칙)
- [~] PARTIAL 수업/시설 key는 배열 index 순 (DB sort_order 유지) — 클라이언트 key prop은 정적 HTML이라 N/A

---

## 8) 의심 포인트 결과

| # | 의심 | 결과 |
| --- | --- | --- |
| 1 | route별 본문 분기 | **없음** · 죽은 public-body 삭제 |
| 2 | 필드 미연결 | **수정** · classes 테이블·사진정렬·levels |
| 3 | 빈 섹션 잔해 | **PASS** 케이스 A |
| 4 | 주소/전화 누수 | **PASS** 민감정보_비노출 |
| 5 | 수업 카드 | **PASS** 1/2/3 반복 |
| 6 | Hero | **PASS** |

---

## 9) 최종 한 줄

**YES — 같은 공부방 데이터면 마이페이지 샵과 공개 샵의 본문(`article.shop`)은 완전히 동일하게 렌더링된다.**  
증빙: `scripts/verify-shop-page.mjs` 22/22 · `tmp/shop-verify/owner.html` ≡ `public.html`.
