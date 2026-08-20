# ShopPage 공통 포맷 실증 (라운드 2)

**일자:** 2026-08-21  
**판정:** **YES** — 같은 `renderMyshopShowcase`가 입력 밀도 A/B/C에서 깨지지 않음  
**자동화:** `cd preview/home-ui && npx vite-node ../../scripts/verify-shop-page.mjs` → **36 PASS / 0 FAIL**  
**스크린샷:** `node scripts/shop-page-screenshots.mjs` → `tmp/shop-verify/*.png`

---

## 0. 제출 5종 요약

| # | 항목 | 위치 |
| --- | --- | --- |
| 1 | 수정 파일 목록 | §1 |
| 2 | ShopPage 호출 경로도 | §2 |
| 3 | 필드 매핑표 | §3 |
| 4 | 숨김 규칙표 | §4 |
| 5 | 3케이스 스크린샷 비교 | `tmp/shop-verify/compare-ABC.png` · `case-A|B|C.png` |

---

## 1. 실제 수정 파일 목록

| 파일 | 역할 |
| --- | --- |
| `preview/home-ui/src/study-room-reg/shop-formatters.js` | **신규** 공통 formatter / photo split / sectionGuard / 금지키 |
| `preview/home-ui/src/study-room-reg/myshop-render.js` | 단일 ShopPage 렌더 — formatter만 호출, 인라인 변환 제거 |
| `preview/home-ui/src/myshop/public-shell.js` | 공개 셸 → `toMyshopShowcaseInputs` → **동일** `renderMyshopShowcase` |
| `preview/home-ui/src/myshop/public-model.js` | API item → showcase 입력 (순수) |
| `preview/home-ui/src/myshop/public-resolve.js` | 캐시 resolve |
| `preview/home-ui/src/study-room-reg/screens.js` | 원장 마이샵 → 동일 렌더 |
| `preview/home-ui/src/styles/myshop.css` | `.shop` 단일 본문 스타일 |
| `scripts/verify-shop-page.mjs` | 동일본문·사진1/3/5·수업1/2/3·밀도A/B/C·formatter 단위 |
| `scripts/shop-page-screenshots.mjs` | Playwright 스크린샷 |
| `docs/internal/51-shop-page-redesign.md` | SSOT |
| `docs/internal/52-shop-page-verification.md` | 이전 라운드 |
| `docs/internal/53-shop-page-common-format-proof.md` | **본 문서** |

삭제(이중 렌더 방지): `preview/home-ui/src/myshop/public-body.js`

---

## 2. ShopPage 호출 경로도

```
[원장] 내 등록 → 마이샵 탭
  screens.js::renderHub
    └─ renderMyshopShowcase(registerState, room)
         └─ shop-formatters.* (용량/가격/bool/지역/사진 split …)
              └─ DOM: <article class="shop" data-shop-root> … 고정 섹션 순서

[공개] 카드/확대 CTA → #/myshop/study-room/:id
  public-shell.js::renderPublicMyshop
    ├─ (셸만) 복귀 버튼 · 로딩
    └─ renderShowcaseHtml(item)
         ├─ toMyshopShowcaseInputs(item)   // public-model.js
         └─ renderMyshopShowcase(pair.state, pair.room)  // ★ 동일 함수
              └─ (동일) shop-formatters → 동일 DOM

[데이터]
  GET /api/study-room/public.php
    → StudyRoomPublicReadService (classes 테이블 포함)
    → fetchPublicStudyRoom / resolvePublicStudyRoomItem
```

### 단일 본문 진위

| 검사 | 결과 |
| --- | --- |
| 호출처 | `screens.js` + `public-shell.js` **만** (`rg renderMyshopShowcase`) |
| route별 본문 분기 | `myshop-render.js`에 `isPublic`/`ownerOnly`/`viewerRole` **없음** |
| 조건부 class·카피 by route | **없음** (공개는 셸 header만 다름) |
| 동일 fixture HTML | `owner.html` ≡ `public.html` (바이트 동일) |
| 동일 섹션 ID 순서 | PASS |

---

## 3. 필드 매핑표

| 그룹 | DB / state 키 | 섹션 | 없으면 | formatter |
| --- | --- | --- | --- | --- |
| 기본 | `study_room_name` | Hero | 기본문구「공부방」 | `blank` |
| 기본 | `slogan` | Hero | 숨김 | `blank` |
| 기본 | `intro_short` | Hero | 숨김 (slogan과 같으면 생략) | `blank` |
| 기본 | `lesson_place_type` | Hero칩 · Bento | 타일/칩 숨김 | `formatLessonPlace` |
| 기본 | `primary_school_levels` / `grade_band` | Hero칩 · Bento | 숨김 | `formatAudience` |
| 기본 | `main_subject_note` | Hero칩 · Bento | 숨김 | `blank` |
| 기본 | `saved_regions` / `promo_regions` / `region_label` | Hero · 생활권 | 섹션 숨김 | `collectRegionLabels` + `formatLivingAreaSentence` |
| 상세1 | `capacity_per_time` | Bento | 타일 숨김 · raw enum 비노출 | `formatCapacity` |
| 상세1 | `monthly_fee_manwon` / `price_amount` | Bento | 타일 숨김 | `formatMonthlyFeeBand` |
| 상세1 | `lesson_operation_type` | Bento | 타일 숨김 | `formatLessonOperation` |
| 상세1 | `minutes_per_lesson` · `lessons_per_week` | Bento | 타일 숨김 | `formatMinutesPerLesson` / `formatWeeklyCount` |
| 상세1 | `one_on_one/weekend/correction/card/cash_*` | Bento | false면 타일 숨김 | `formatBoolFlag` |
| 상세1 | `teaching_style_ids` · `teaching_style_note` · `intro_long` | 매력 | 섹션 wrapper 제거 | `formatTeachingStyles` |
| 상세2 | `university_name` · `major_name` · `career_years` · `academy_career_years` · `feature_1..3` | 경력 | 섹션 제거 | `blank` |
| 상세2 | `education_office_*` · `business_registration_*` · `franchise_*` · `other_proof_notes` | 신뢰 | 섹션 제거 | `boolOn` + `blank` |
| 상세2 | `facility_ids` / `facility_names` / `facility_note` | 시설 | 섹션 제거 | `resolveFacilityNames` |
| 상세2 | `youtube/facebook/instagram_url` | 소셜 | 섹션 제거 | `blank` |
| 수업 | `classes[]` 각 요소 | 수업 카드 반복 | 섹션 제거 · **N개면 N카드** | `formatSchoolLevel` · `formatAttendanceDays` · `formatClassFee` · `formatWeeklyCount` |
| 사진 | `images[].image_type=cover` | Hero `<img>` | 시스템 기본 SVG | `collectShopPhotos` + `splitHeroAndGallery` |
| 사진 | `interior` → `facility` → `other` | Gallery | Gallery 섹션 제거 | 동일 split (정렬 보장) |
| 문의 | `inquiry_status` | footer | footer 제거 | `myshopInquiryStatusLine` |
| **금지** | `home_address*` · `address_text` · `gender` · `contact_phone` · `contact_email` | — | **절대 렌더 미참조** | `SHOP_FORBIDDEN_KEYS` |

---

## 4. 숨김 규칙표

| 규칙 | 구현 | 검증 |
| --- | --- | --- |
| 값 없으면 섹션 wrapper 제거 | `section()` → `sectionGuard` · 빈 문자열 미출력 | 케이스 A: gallery/classes/signature/social/career 없음 |
| 제목만 남는 섹션 금지 | inner 없으면 `section` 전체 '' | `케이스A_빈제목없음` |
| 빈 타일 금지 | `tile(label,value)` value 없으면 '' | Bento 타일 수 = 값 있는 항목만 |
| 「정보 준비중」 더미 금지 | 렌더에 해당 문구 없음 | `준비중문구_없음` |
| 사진 1장(cover만) | Gallery 섹션 없음 · Hero만 | `사진1_*` |
| 사진 3/5장 | cover→Hero, rest interior→facility→other | `사진3_*` `사진5_*` |
| 수업 1/2/3 | `data-shop-class-index` N개 | `수업반복_1|2|3` |
| 민감정보 | 금지키·전화·집주소 문자열 미포함 | `민감정보_비노출` |

고정 섹션 순서 (존재하는 것만):  
`hero → bento → signature → gallery → classes → career → trust → facility → area → social → inquiry`

---

## 5. 3개 데이터 케이스 스크린샷

| 케이스 | 밀도 | 산출물 | 관측 |
| --- | --- | --- | --- |
| A | 적음 | `tmp/shop-verify/case-A.png` | Hero+Bento+생활권+문의만 · Gallery/수업/매력 없음 |
| B | 보통 | `tmp/shop-verify/case-B.png` | Gallery + 수업 2카드 + 시설/신뢰 |
| C | 많음 | `tmp/shop-verify/case-C.png` | Gallery thumbs + 수업 3카드 + 경력/소셜 전부 |
| 비교 | — | `tmp/shop-verify/compare-ABC.png` | 동일 템플릿 · 밀도만 다름 |
| 동일경로 | — | `owner.png` / `public.png` | HTML 바이트 동일 |

재생성:

```bash
cd preview/home-ui
npx vite-node ../../scripts/verify-shop-page.mjs
node ../../scripts/shop-page-screenshots.mjs
```

---

## 6. formatter 공통화 목록

| 요구 | 함수 (`shop-formatters.js`) |
| --- | --- |
| 원생수 enum → 사람말 | `formatCapacity` |
| 가격 → 월 n만원대 | `formatMonthlyFeeBand` / `formatClassFee` |
| boolean → 가능/운영 | `formatBoolFlag` |
| 지역 → 생활권 문장 | `formatLivingAreaSentence` |
| 교습/수업형태 라벨 | `formatLessonPlace` / `formatLessonOperation` |
| 사진 Hero/Gallery 우선순위 | `splitHeroAndGallery` |

`myshop-render.js`는 위 helper만 import — 인라인 enum 맵 없음.

---

## 7. 판정

**같은 ShopPage가 모든 공부방 데이터 밀도에서 깨지지 않는가 → YES**
