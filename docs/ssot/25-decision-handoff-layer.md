# 25장 — 판단 Handoff (찜·비교·최근열람·재방문)

**상태: UX·실행 1차 잠금** (Notion · Cursor · **2026-07-06 수렴**)  
**작성:** 2026-07-06  
**역할:** 검색·메인 → **찜·비교·최근열람** → [24장](24-detail-decision-layer.md) 상세 판단 → 쪽지/메모 → [15장](15-mypage-structure.md) **재방문** — **모달 밖** handoff·바구니·copy  
**연동:** [11장](11-main-exposure-and-compare.md) · [13장](13-search-page-fields.md) · [15장](15-mypage-structure.md) · [16장](16-messages-structure-proposal.md) · [19~21장](19-student-registration-management.md) · [24장](24-detail-decision-layer.md) · [30장](30-first-route-map-and-screen-inventory.md) · [22장](22-platform-lifecycle-principles.md)  
**프리뷰:** `preview/home-ui/` · [DOC-CHECKLIST](../../preview/home-ui/DOC-CHECKLIST.md) P25  
**코드 정본:** [§14](#14-코드-정본-1차) · `handoff-copy.js`

> **24 ↔ 25 분리 (잠금):**  
> **24장** = 상세 모달 **안** — Fit · Trust · Contact · Sticky CTA  
> **25장** = 상세 **밖** — basket · toast · deep link · empty/max · lifecycle 뱃지 · Provider **학생 검토함** 정책

---

## 0. 핵심 문장 (잠금)

> P25에서 찜·비교·최근열람은 부가기능이 아니라, 사용자의 판단이 **검색 → 상세 → 쪽지/메모 → 마이페이지** 사이에서 끊기지 않도록 이어주는 **Decision Handoff Layer**다.

**Handoff Queue (4-state):**

```
discover → basket → decide → act
 (검색)   (찜/비교/최근)  (24상세)  (쪽지·메모·재방문)
```

- **P25-06** = `decide → act` 또는 `decide → basket` 전환만 정의.
- 이벤트 로깅(부록 A)도 4단계 prefix 권장.

---

## 1. 이 장의 역할과 범위

### 1-1. 25장이 **하는 것**

| ○ | 내용 |
|---|------|
| Global Compare Bar · Compare Modal · compare state | P25-00 · P25-03 · P25-04 |
| 검색 결과행 액션 handoff | P25-05 · 13§7 |
| 상세 닫을 때 / 담을 때 toast · return hint | P25-06 · 24§13 연동 |
| P15-06 찜 · P15-07 최근열람 **handoff 규칙** (화면 정의는 15장) | P25-01 · P25-02 |
| Empty / Max / 비교 불가 copy | P25-08 · 30장 부록 B |
| Provider **학생 검토함** 정책 | P25-S10 · §8 |
| `handoff-copy.js` · Source Route Sticky | §14 |

### 1-2. 25장이 **하지 않는 것**

| ✕ | 원본 SSOT |
|---|-----------|
| 상세 내부 블록·Contact Panel | [24장](24-detail-decision-layer.md) |
| 비교 **필드 enum** · 검색 필터 | [11·13장](13-search-page-fields.md) |
| 쪽지함 본문 UI | [16장](16-messages-structure-proposal.md) |
| 찜·최근열람 **화면 레이아웃** 전체 | [15장](15-mypage-structure.md) |
| 유료 SKU · 메모 entitlement | [18장](18-paid-services-rough.md) (2차 CTA 분기) |
| 학생 **비교표** | **1차 ✕** · §7 |

### 1-3. block vs screen

**P25-00 · P25-03 · P25-04 · P25-06 · P25-08** = `type: block` — **별도 hash 라우트 ✕**  
**P25-01 · P25-02** = P15-06 · P15-07 **화면** — 25장은 handoff·copy만.

---

## 2. 용어 (잠금)

| lane | 대상 | 목록·CTA | 비고 |
|------|------|----------|------|
| **학부모 Consumer** | 공부방 · 과외 | **찜** · 비교 · 최근열람 | 15§5 |
| **공급자 Provider** | 학생 의뢰 | **학생 검토함** · CTA **「검토함에 담기」** | **「찜」✕** |
| Provider 항목 라벨 (과외) | 학생 | **관심학생** | 카드 맥락 |
| Provider 항목 라벨 (공부방) | 학생 | **상담후보** | 카드 맥락 |

**RED LINE:** 학생을 **비교·순위·공개 후보**로 다루지 않는다 · 학부모/학생 **저장 알림 ✕**.

---

## 3. P25 block ID 정본 (30장 §10 동기화)

| ID | 이름 | 코드 (home-ui) | SSOT |
|----|------|----------------|------|
| P25-00 | Global Compare Bar | `user-actions-ui.js` `renderCompareBar` | §4 |
| P25-03 | 비교 후보함 state | `user-actions-state.js` | §5 |
| P25-04 | Compare Modal | `compare-modal.js` | §5 · 11장 |
| P25-05 | 검색 결과행 액션 | `exposure-render.js` + bind | 13§7 |
| P25-06 | 상세 handoff | `detail-shell.js` · toast | §6 |
| P25-08 | Empty / Max copy | `handoff-copy.js` | §9 |
| P25-S01~S02 | Student Contact-only lane | `detail-shell.js` (미렌더) | §7 |
| P25-S10 | 학생 검토함 | `student-review-store.js` · `#/mypage/student-review` | §8 |

> Notion P25-07(Compare Modal) → **P25-04에 통합**. P25-01/02 = P15-06/07.

---

## 4. Consumer lane — 학부모 탐색

### 4-1. 기본 흐름

```
검색/메인 → 찜 또는 비교 담기 → 24 상세 → 쪽지 → P15 찜/최근 재방문
```

### 4-2. 검색 결과행 (P25-05 · 13§7)

| 탭 | 액션 |
|----|------|
| 공부방 · 과외 | 찜 / 비교 / 상세 |
| 학생 | **메모 보내기** only · 찜·비교 **미렌더** |

### 4-3. 비교 정책 (1차)

| 항목 | 정책 |
|------|------|
| 최소 | 2개 |
| **1차 최대** | **3개** (`COMPARE_MAX` · 11·13·코드) |
| 혼합 | 공부방끼리 · 과외쌤끼리만 · **혼합 ✕** |
| 필드 상한 | **11장 compare 행 ∩ 13장 노출 필드** (인증·후기·전화 등 2차) |
| 추천·점수·AI 우열 | **✕** |

### 4-4. Source Route Sticky (1차)

`source_route` / `last_route` — UI 노출 ✕ · handoff·toast·2차 deep link용.

| 출처 | 1차 동작 |
|------|----------|
| `search` | compare toast 「비교에 추가됨 · N/3」 |
| `detail` | 동일 + **「비교 N/3 열기」** CTA |
| `wishlist` | **「찜 목록으로」** CTA |
| `mypage` | **「비교 N/3 열기」** · 검토함 **「검토함 열기」** |

---

## 5. Compare · 찜 state (P25-03 · P25-04)

- **저장:** 프리뷰 `sessionStorage` `[임시]` · 로그인 영속 △
- **찜:** `wishlist.{study_room|tutor}[]` · 학생 **✕**
- **비교:** `compare.{study_room|tutor}[]` · max 3

### 5-1. 비교 불가 코드 (P25-08)

| code | UX |
|------|-----|
| `compare_max` | Max copy + compare bar로 유도 |
| `compare_ineligible` | 11장 필수 미충족 |
| `compare_mixed_kind` | 공부방↔과외 혼합 ✕ |
| `compare_student` | 학생 비교 ✕ (버튼 미렌더 우선) |

---

## 6. P25-06 상세 handoff (24 연동)

| 구분 | 1차 MVP | 2차 |
|------|---------|-----|
| 비교 담기 | Toast 「비교에 추가됨 · N/3」 | **「비교 N/3 열기」** CTA (source route별) |
| 찜 · 쪽지 · 메모 | state 반영 | Toast · **deep link** (찜 ✅) |
| 상세 진입 | **최근열람 기록** `view_detail` | resume token 한 줄 |

**호출:** [24장 §13](24-detail-decision-layer.md#13-compare-aware--decision-handoff) — 24는 **호출만** · 규칙 본문은 **25장**.

---

## 7. Student Contact-only lane (P25-Sxx)

학생은 **비교 1차 ✕** (정책 잠금 · Notion §17).

| ID | 내용 | 1차 |
|----|------|:---:|
| P25-S01 | 메모 CTA | ✅ 24·16 |
| P25-S02 | 블라인드 쪽지 | ✅ |
| 찜 · 비교 UI | **DOM 미렌더** | ✅ |
| P25-S10 | 학생 검토함 | **1.5a ✅** · store · 마이페이지 UI | §8 |

---

## 8. Provider lane — 학생 검토함 (P25-S10)

**흐름:** `보관(검토함) → 판단 → 메모 / 블라인드 쪽지 / 보류` — **저장→비교→선택 ✕**

| 역할 | 필요성 | 항목 라벨 |
|------|--------|-----------|
| **과외쌤** | **高** — 메모 전 검토 · 21§7 · 16§1-3 | 관심학생 |
| **공부방** | **高** — 정원·학년·시간·상담 상태 검토 후 연락 · 20§4-3 | 상담후보 |

**공통 UI:** 마이페이지 **「학생 검토함」** · CTA **「검토함에 담기」** / **「검토함에서 빼기」**

| vs | 관계 |
|----|------|
| P15-07 최근열람 | 자동·시간순 · 1차 **코드 연동** |
| 학생 검토함 | 의도적·메모 가능 · **1.5a UI** |
| P15-06 찜 | **별개** — 학부모용 공부방/과외 |

**1차 문서:** 정책·RED LINE·ID 잠금. **1.5a:** store · `#/mypage/student-review` · 상세 CTA. **2차 ✅:** DDL/API · P21-05 · **P20-02/05** 검토함 브리지 · lifecycle 뱃지.

---

## 9. P25-08 Empty / Max (30장 부록 B)

| 상황 | copy 방향 | 액션 |
|------|-----------|------|
| 찜 없음 | 아직 찜한 후보가 없습니다 | 검색 |
| 최근열람 없음 | 최근에 본 후보가 없습니다 | 검색 |
| 비교 1개 | 비교하려면 후보를 하나 더 담아주세요 | 검색 |
| compare_max | 비교는 최대 3개까지… | 후보 관리 |
| compare_mixed_kind | 공부방과 과외쌤은… | 비우기 |
| compare_student | 학생 정보 보호를 위해… | 메모/쪽지 |
| 후보 소멸 (hidden 등) | 현재 공개가 중지된 대상입니다 | 20·21 lifecycle |

정본: `empty-state-copy.js` (29장) · handoff toast/ribbon은 `handoff-copy.js`.

---

## 10. Lifecycle-aware basket (2차)

찜·최근 카드 한 줄 뱃지:

| 대상 | 소스 |
|------|------|
| 공부방 | `inquiry_status` · 20§4-3 |
| 과외 | `profile_status` hidden 등 · 21장 |

copy: `handoff-copy.js` 또는 `lifecycle-copy.js` 확장.

---

## 11. 1차 MVP (25a)

### 포함 — home-ui

- [x] P25-00 Compare Bar · P25-04 Modal · P25-03 state
- [x] P25-05 검색행 찜/비교/상세 (공부방·과외)
- [x] P25-06 compare toast · detail 찜/비교
- [x] P15-06 찜 · 찜→비교
- [x] P25-08 + **`handoff-copy.js`**
- [x] P15-07 **상세 진입 시** `recordRecentView` (`last_route`)
- [x] P25-Sxx 학생 찜·비교 **미렌더**
- [x] P25-S10 학생 검토함 · `#/mypage/student-review` · 관심학생/상담후보

### 포함 — 2차

- [x] Source Route return CTA (toast 확장)
- [x] Lifecycle 뱃지 (§10 ✅)
- [x] resume token (§6 2차 ✅)
- [x] 판단 스티커 · 문의 전 체크리스트 (2차 ✅)
- [x] 부록 B DDL · HandoffService · **HTTP API 배선 ✅**

### 제외 · 후순위

- compare max 4 · Notion §14 풀 필드 · AI 차이 요약 · 푸시 알림

---

## 12. 구현 우선순위

**1차 (본 문서):** §11 표 · `handoff-copy.js` · recent 연동 · compare error copy.

**1.5a (완료):** P25-S10 store · 마이페이지 · 상세 CTA · 과외 홈 학생찾기 행.

**2차 (완료 · 2026-07-07):** **store → API 스왑 ✅** · **P21-05 · P20-02/05 검토함 브리지 ✅** · lifecycle 뱃지 ✅ · resume token ✅ · 판단 스티커 ✅ · 부록 B DDL/API ✅

---

## 13. 합의 이력 (2026-07-06)

| # | 주제 | 결론 |
|---|------|------|
| 1 | 24 vs 25 | 모달 안 / 밖 분리 |
| 2 | P25 ID | 30장·코드 정본 · P25-07→04 |
| 3 | compare max | **3 고정** |
| 4 | 학생 비교 | **1차 ✕** · 미렌더 |
| 5 | 학생 검토함 | 정책 잠금 · **구현 1.5~2차** · 과외+공부방 |
| 6 | 용어 | 학부모=찜 · 공급자=검토함 |
| 7 | Handoff Queue · Source Route · handoff-copy | 채택 |

---

## 14. 코드 정본 (1차)

| 항목 | 경로 | SSOT |
|------|------|------|
| **copy · empty/max · ribbon** | `preview/home-ui/src/handoff-copy.js` | §9 |
| **P25-S10 학생 검토함** | `student-review-store.js` · `student-review-ui.js` | §8 |
| **Lifecycle basket 뱃지** | `handoff-lifecycle.js` | §10 |
| **P21-05 ↔ 검토함 딥링크** | `handoff-link.js` | §8 · 21§7 |
| **resume token** | `handoff-resume.js` | §6 |
| **판단 스티커 · 문의 전 체크리스트** | `handoff-sticker.js` | §6 · 24§부록 A |
| **DDL · API** | `013_handoff_basket.sql` · `HandoffService.php` · `public/api/handoff/` | 부록 B |
| **compare notify** | `preview/home-ui/src/handoff-utils.js` | §5 · §6 |
| **compare state** | `user-actions-state.js` | §5 |
| **Compare Bar · wishlist modal** | `user-actions-ui.js` | P25-00 |
| **Compare Modal** | `compare-modal.js` | P25-04 |
| **상세 handoff** | `detail-decision/detail-shell.js` | P25-06 |
| **ribbon · toast (legacy export)** | `detail-decision/detail-utils.js` | → handoff |
| **최근열람** | `mypage/recent-store.js` | P15-07 · §6 |
| **검색행** | `exposure-render.js` | P25-05 |
| **P15-06/07 UI** | `mypage/screens.js` | 15장 |

검증: [DOC-CHECKLIST §25](../../preview/home-ui/DOC-CHECKLIST.md) · [30장 §10](30-first-route-map-and-screen-inventory.md#10-인벤토리--25장-횡단-컴포넌트).

---

## 부록 A. 이벤트명 (2차 · DDL)

`discover_*` · `basket_*` · `decide_*` · `act_*` — Notion §20 참조. 1차 프리뷰 **미송신**.

---

## 부록 B. DDL · API (2차 ✅ 초안)

> **마이그레이션:** `sql/schema/013_handoff_basket.sql`  
> **서버:** `src/Handoff/HandoffRepository.php` · `HandoffService.php`  
> **프리뷰 브리지:** `preview/home-ui/src/handoff-api-map.js`

### B-1. 테이블

| SSOT 명 | 테이블 | 프리뷰 store | 상한 |
|---------|--------|--------------|------|
| `favorite` | `user_favorites` | `user-actions-state` wishlist | — |
| `compare_session` | `user_compare_items` | `user-actions-state` compare | **3/kind** |
| `recent_view` | `user_recent_views` | `recent-store.js` | **30** |
| `student_review` | `provider_student_reviews` | `student-review-store.js` | **50** |

**공통:** `user_id` → `users.id` CASCADE · 학생 찜·비교 **DDL ✕** (25§5).

### B-2. 컬럼 요약

| 테이블 | 핵심 컬럼 |
|--------|-----------|
| `user_favorites` | `target_type` study_room\|tutor · `target_id` |
| `user_compare_items` | `sort_order` 0~2 |
| `user_recent_views` | `title_snapshot` · `last_route` · `last_action` · `viewed_at` |
| `provider_student_reviews` | `provider_user_id` · `student_id` · `provider_role` |

### B-3. API (배선 ✅)

| Method | Path | PHP | HandoffService |
|--------|------|-----|----------------|
| GET | `/api/handoff/favorites` | `favorites.php` | `listFavorites` |
| POST | `/api/handoff/favorites` | `favorites.php` | `toggleFavorite` |
| DELETE | `/api/handoff/favorites?target_type&target_id` | `favorites.php` | `removeFavorite` |
| GET | `/api/handoff/compare?target_type=` | `compare.php` | `listCompare` |
| POST | `/api/handoff/compare` | `compare.php` | `toggleCompare` |
| DELETE | `/api/handoff/compare?target_type=` | `compare.php` | `clearCompare` |
| DELETE | `/api/handoff/compare?target_type&target_id` | `compare.php` | `removeCompare` |
| GET | `/api/handoff/recent` | `recent.php` | `listRecent` |
| POST | `/api/handoff/recent` | `recent.php` | `recordRecentView` · `patchRecentHandoff` |
| GET | `/api/handoff/student-reviews` | `student-reviews.php` | `listStudentReviews` |
| POST | `/api/handoff/student-reviews` | `student-reviews.php` | `toggleStudentReview` |
| DELETE | `/api/handoff/student-reviews?student_id=` | `student-reviews.php` | `removeStudentReview` |

**공통:** `HandoffApi.php` · 세션 쿠키 · JSON `{ ok, ... }` · **401** 비로그인.  
**클라이언트:** `handoff-api.js` · `handoff-backend.js` · `auth-session.js` — **store 스왑 ✅**

**1차 프리뷰:** 비로그인 = sessionStorage · Dev 로그인 = API 영속 (`:8080` proxy)

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-07-06 | **P25-S10 1.5a** — student-review store · `#/mypage/student-review` · 상세·노출 CTA |
| 2026-07-07 | **P25-S10 2차** — P20-02/05 검토함 브리지 · `from=exposure` · 29장 copy 통합 |
| 2026-07-06 | **Source Route return CTA** — toast 확장 · `handoff-utils.js` · `showP24Toast` CTA |
| 2026-07-06 | **Lifecycle 뱃지** — `handoff-lifecycle.js` · 찜·최근·검토함 §10 |
| 2026-07-06 | **P21-05 ↔ 검토함** — `handoff-link.js` · 양방향 딥링크 · `?from=` 배너 |
| 2026-07-06 | **resume token** — `handoff-resume.js` · 최근열람 · 상세 Entry Ribbon |
| 2026-07-06 | **판단 스티커** — `handoff-sticker.js` · basket 행 · 문의 전 체크리스트 |
| 2026-07-06 | **부록 B DDL** — `013_handoff_basket.sql` · `HandoffService` · `handoff-api-map.js` |
| 2026-07-06 | **HTTP API 배선** — `public/api/handoff/*.php` · `handoff-api.js` |
| 2026-07-06 | **store → API 스왑** — `auth-session.js` · `handoff-backend.js` · Dev 로그인 툴바 |

---

*충돌 시 [22장](22-platform-lifecycle-principles.md) · compare 필드는 [11·13장](13-search-page-fields.md) 우선.*
