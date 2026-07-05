# 메인 UI — SSOT 9장 검증

**SSOT:** [docs/ssot/09-main-screen-roles.md](../../docs/ssot/09-main-screen-roles.md) · 통합 지도 [30장](../../docs/ssot/30-first-route-map-and-screen-inventory.md)

## 프리뷰

http://localhost:5174 · `cd preview/home-ui && npm run dev`

## 4화면 체크리스트

| # | 화면 | 라우트 | SSOT | 상태 |
|---|------|--------|------|------|
| 1 | 비로그인 메인 | `#/guest` | §3·§4 | ✅ 리디자인 (대치동) |
| 2 | 학부모 메인 | `#/parent` | §5-1 | ✅ |
| 3 | 공부방 메인 | `#/study-room` | §5-2 | ✅ |
| 4 | 과외쌤 메인 | `#/tutor` | §5-3 | ✅ |

## 15장 마이페이지 (**1차 잠금** · home-ui 15a)

| # | 화면 | 라우트 | SSOT | 상태 |
|---|------|--------|------|------|
| 1 | 마이페이지 홈 | `#/mypage/home` | P15-01 | ✅ §4-3-1 강조 |
| 2 | 내 등록 | `#/mypage/registrations` | P15-02 | ✅ |
| 3 | 찜 | `#/mypage/wishlist` | P15-06 | ✅ |
| 4 | 최근열람 | `#/mypage/recent` | P15-07 | ✅ |
| 5 | 쪽지 요약 | `#/mypage/messages` | P15-08 | ✅ |
| 6 | 유료 요약 | `#/mypage/plans` | P15-09 | ✅ guardian §7 |
| 7 | 제출자료 상태 | `#/mypage/submission-docs` | P15-10 | ✅ (과외 1차) |
| 8 | 계정/설정 | `#/mypage/account` | P15-11 | ✅ |
| 9 | mypage-copy.js | §4-3-1 · §7 · §11 | §4·§7·§11 | ✅ |

체계: `src/mypage/mypage-copy.js` — 홈 강조·빈 상태·P15-10 라벨 · `preview-data.js` = CTA·숫자.

구 `#/mypage/verification` → `#/mypage/submission-docs` 자동 리다이렉트.

진입: 툴바 「마이페이지」·유틸 메뉴 · `#/parent` 등 역할 화면에서 이동.  
`/mypage/...` 경로 URL은 부팅 시 `#/mypage/...`로 자동 변환.

## 16장 쪽지함 (home-ui 16a · **1차 잠금**)

| # | 화면 | 라우트 | SSOT | 상태 |
|---|------|--------|------|------|
| 1 | 쪽지 요약 | `#/mypage/messages` | P15-08 | ✅ |
| 2 | 쪽지함 리스트 | `#/mypage/messages/inbox` | P16-01 | ✅ |
| 3 | 보낸/진행중 탭 | `#/mypage/messages/sent` · `.../active` | P16-01 탭 | ✅ |
| 4 | 대화방 | `#/mypage/messages/thread/{id}` | P16-02 | ✅ |
| 5 | 첫 메모 | 오버레이 (P24·학생 상세 등) | P16-03 | ✅ |
| 6 | 유료 게이트 | 오버레이 → `#/mypage/plans` | P16-04 | ✅ |
| 7 | messages-copy.js | §3 배지 · §4 빈 상태 · §7 게이트 | §3·§4·§7 | ✅ |

체계: `src/messages/messages-copy.js` — 배지·게이트·빈 상태 copy · `permissions.js` = 권한만.

레거시 `#/messages/*` → `#/mypage/messages/*` 자동 리다이렉트.

진입: 마이페이지 좌측 「쪽지」·P15-08 「쪽지함 열기」·유틸 「쪽지함」·학생 상세 「메모」.

데모: 공급자 + 마이페이지 쪽지에서 **무료/유료** 토글 · P16-04 → P15-09.

## 19장 학생 의뢰 관리 (P19-xx) `[UX·실행 1차 잠금 · home-ui 19a ✅]`

**copy 정본:** `src/student-reg/student-reg-copy.js` — 탭 · visibility · 허브 · 금지 문구

| # | 화면 | 라우트 | SSOT | 상태 |
|---|------|--------|------|------|
| 1 | 자녀 목록·탭 | `#/mypage/registrations/students` | P19-01 | ✅ |
| 2 | 자녀 허브 | `.../students/{id}` | P19-02 | ✅ |
| 3 | 기본등록 | `.../basic` | P19-03a | ✅ |
| 4 | 상세등록 | `.../detail` | P19-03b | ✅ |
| 5 | 미리보기·공개 | `.../publish` | P19-04 | ✅ |
| 6 | 공개설정 | `.../settings` | P19-05 | ✅ |
| 7 | auth-ui 연동 | `5173/#/signup/basic?return_import=1` | 19§8-2 | ✅ |

체험: `#/mypage/registrations/students/2` (draft) → 상세 → 공개.

## 20장 공부방 운영 (P20-xx) `[UX·실행 1차 잠금 · home-ui 20a ✅]`

**copy 정본:** `src/study-room-reg/study-room-reg-copy.js` — 탭 · inquiry · Pick/Prime · 금지 문구

| # | 화면 | 라우트 | SSOT | 상태 |
|---|------|--------|------|------|
| 1 | 공부방 목록·탭 | `#/mypage/registrations/study-rooms` | P20-01 | ✅ |
| 2 | 상태판 | `.../study-rooms/{id}` | P20-02 | ✅ |
| 3 | 기본등록 브리지 | `.../basic` | P20-03a | ✅ |
| 4 | 상세등록 브리지 | `.../detail` | P20-03b | ✅ |
| 5 | 미리보기·공개 | `.../publish` | P20-04 | ✅ |
| 6 | 노출·상담·숨김 | `.../exposure` | P20-05 | ✅ |

**2차 보강 (2026-07-06):** P20-02 `getHubCtas` · 상담 수용 독립 블록 · P20-04 Basic/Compare 탭 · P20-05 §7-1 블록 순서 · Pick/Prime **신청 가능** · 목록 `inquiry_status` · P16-01 보조 링크.

체험: `#/mypage/registrations/study-rooms/2` (draft) → 상세 브리지 → 공개. study-room-ui 딥링크는 부록 C.

## 22장 lifecycle 원칙 (횡단)

| # | 항목 | SSOT | 상태 |
|---|------|------|------|
| 1 | lifecycle-copy.js | §7 용어 · §3 pending | ✅ |
| 2 | profile_status 라벨 | 저장중/공개중/숨김 · pending→draft | ✅ |
| 3 | 제출자료 UI (P15-10) | 심사·반려 UI ✕ · 22 footnote | ✅ |
| 4 | P20/P21 공개 confirm | 자기확인 · 심사 ✕ | ✅ |
| 5 | 노출 카드 | 증빙→제출자료 · 공개함 | ✅ |
| 6 | tutor-ui · study-room-ui | pending(검수) select ✕ | ✅ |
| 7 | P24 detail-decision | Compare-aware sticky · P24-08 | ✅ |

체계: `src/lifecycle-copy.js` — 등록·공개·마이페이지 · P24 copy 단일 출처.

## 21장 과외쌤 운영 (P21-xx) `[UX·실행 1차 잠금 · home-ui 21a ✅]`

**copy 정본:** `src/tutor-reg/tutor-reg-copy.js` — 탭 · 게이지 · Pick/Prime · 금지 문구

| # | 화면 | 라우트 | SSOT | 상태 |
|---|------|--------|------|------|
| 1 | 과외 목록·탭 | `#/mypage/registrations/tutors` | P21-01 | ✅ |
| 2 | 상태판 | `.../tutors/{id}` | P21-02 | ✅ |
| 3 | 기본등록 브리지 | `.../basic` | P21-03a | ✅ |
| 4 | 상세등록 브리지 | `.../detail` | P21-03b | ✅ |
| 5 | 4모드 미리보기·공개 | `.../publish` | P21-04 | ✅ |
| 6 | 학생 접근·쪽지 | `.../access` | P21-05 | ✅ |
| 7 | 노출·부oost·숨김 | `.../exposure` | P21-06 | ✅ |

**2차 보강 (2026-07-06):** P21-02 §6-1/6-2 블록 순서 · P21-05 unlock N단계 · 학생찾기 CTA · 유료 토글 · Pick/Prime **신청 가능**.

체험: `#/tutor` → 마이페이지 → `#/mypage/registrations/tutors/2` (draft) → `#/mypage/registrations/tutors/1/access` (published). tutor-ui 딥링크는 21장 부록 C.

## 24장 상세 판단 레이어 (P24-xx) `[home-ui 1차 ✅ · §20 잠금]`

**정본:** `src/detail-decision/` · legacy `student-detail-modal.js` — 등록 폼만 유지 · 상세는 detail-decision

| # | 화면 | 파일 | SSOT | home-ui | search-ui |
|---|------|------|------|---------|-----------|
| 1 | 공통 Shell | `detail-shell.js` · `detail-utils.js` | P24-01 | ✅ | export |
| 2 | 공부방 상세 | `studyroom-detail.js` | P24-02 | ✅ | optional smoke |
| 3 | 과외쌤 상세 | `tutor-detail.js` | P24-03 | ✅ | optional smoke |
| 4 | 학습 요청 카드 | `student-request-card.js` | P24-04 | ✅ | — |
| 5 | Compare + toast | `user-actions-ui.js` 연동 | §13 | ✅ | ✅ 2차 |

1차: **home-ui** 완료 판정 · **client state only** (24장 부록 C) · 학부모 paid CTA = **쪽지(free 동형)**.  
순서: P24-01 → P24-04 → P24-03 → P24-02 → Compare「비교에 추가됨」toast.

## 25장 판단 Handoff (P25-xx) `[UX·실행 1차 잠금 · home-ui 25a ✅]`

**copy 정본:** `src/handoff-copy.js` · `src/handoff-utils.js` — ribbon · bar · toast · compare error · empty

| # | block/기능 | 파일 | SSOT | 상태 |
|---|------------|------|------|------|
| 1 | Compare Bar | `user-actions-ui.js` | P25-00 | ✅ |
| 2 | Compare Modal | `compare-modal.js` | P25-04 | ✅ |
| 3 | 찜·비교 state | `user-actions-state.js` | P25-03 | ✅ API · sessionStorage |
| 4 | 검색행 handoff | `exposure-render.js` | P25-05 | ✅ |
| 5 | 상세 handoff | `detail-shell.js` | P25-06 | ✅ toast · 찜/비교 |
| 6 | 최근열람 기록 | `recent-store.js` | P15-07 · §6 | ✅ `view_detail` · `lastRoute` |
| 7 | compare notify | `handoff-utils.js` | §5-1 · §4-4 | ✅ max · return CTA |
| 8 | 학생 찜·비교 | — | P25-Sxx | ✅ 미렌더 |
| 9 | 학생 검토함 | `student-review-store.js` · `#/mypage/student-review` | P25-S10 | ✅ 1.5a |
| 10 | Lifecycle 뱃지 | `handoff-lifecycle.js` · 찜·최근·검토함 | §10 | ✅ |
| 11 | P21-05 ↔ 검토함 | `handoff-link.js` · P21-05 · `#/mypage/student-review` | §8 · 21§7 | ✅ |
| 12 | resume token | `handoff-resume.js` · 최근열람 · 상세 ribbon | §6 | ✅ |
| 13 | 판단 스티커 | `handoff-sticker.js` · 찜·비교·검토함 · 문의 전 | §6 · 24 | ✅ |
| 14 | DDL · API | `013_handoff_basket.sql` · `HandoffService.php` · `handoff-api.js` | 부록 B | ✅ |

체험: `#/mypage/recent` resume token · DDL `sql/schema/013_handoff_basket.sql`.

**2차:** **store → API 스왑 ✅** (`auth-session.js` · `handoff-backend.js`) · **부록 B ✅** · **HTTP 배선 ✅**

## 18장 유료 (P15-09)

| # | 화면 | 라우트 | SSOT | 상태 |
|---|------|--------|------|------|
| 1 | 카탈로그 placeholder | `#/mypage/plans` | 18b | ✅ |
| 2 | P16-04 CTA | 게이트 → plans | 18§3 | ✅ |

## 17장 고객센터 (**1차 잠금** · 17a~c)

| # | 화면 | 라우트 | SSOT | 상태 |
|---|------|--------|------|------|
| 1 | 고객센터 홈 | `#/support` | P17-01 | ✅ |
| 2 | 이용안내 섹션 | `#/support/guide` | P17-01 #guide | ✅ |
| 3 | FAQ | `#/support/faq` · `#faq` | P17-04 | ✅ |
| 4 | 공지 | `#/support/notice` | P17-05 | ✅ 17c CMS |
| 5 | 운영 문의 | `#/support/contact` | P17-07 | ✅ 17c 티켓 |
| 6 | 내 문의 내역 | `#/support/contact/tickets` | P17-07 | ✅ |
| 7 | 안전과외 목록 | `#/support/safe` | P17-02 | ✅ |
| 8 | 가이드 상세 | `#/support/safe/{slug}` | P17-03 · G1~G7 | ✅ 17b G5~G7 |
| 9 | 운영 콘솔 | `#/support/admin/*` | 17c | ✅ |
| 10 | support-copy.js | §3~§7 | §3~§7 | ✅ |
| 11 | notice-store · ticket-store | CMS · 티켓 | 17c | ✅ |

체계: `support-copy.js` · `notice-store.js` · `ticket-store.js` · `admin-screens.js`.

진입: GNB·유틸 「고객센터」·「이용안내」·푸터 · 툴바 「고객센터」.

CTA: **guest** → 로그인 유도 + 운영 문의 · **로그인** → 쪽지함 + 운영 문의 (17장 §4-1).

## 구조 (§6·§7·§8)

- [x] 상단 3박스 — Prime · **실제 3칸 고정 슬롯**
- [x] 중단 5박스 — Pick · **5칸 고정형 시작**
- [x] 하단 전체 리스트 — Local List · **최근 등록순**
- [x] 반응형 웹 (§9)
- [x] 더미데이터
- [x] 오렌지/블루 브랜드 톤

## 역할별 콘텐츠 (§4·§5)

- [x] 비회원 = **대치동 고정 데모** + 지역 히어로·지도 + 공부방/과외 Prime·Pick + 학생 리스트 (§4)
- [x] 비회원 = 로그인 유도 (상세·찜·비교·문의) · [GUEST-REDESIGN.md](./GUEST-REDESIGN.md)
- [x] 학부모 = **공부방/과외쌤 탭** (디폴트 공부방) (§5-1)
- [x] 학부모 = 자녀 학습 요약
- [x] 공부방 = **박스 + 리스트** (학생 리스트 비핵심) (§5-2)
- [x] 과외쌤 = **박스 + 리스트 + 학생 리스트** (§5-3)

## 지도·지역 (§2)

- [x] 지도 — **공부방만** (비회원·학부모 공부방탭·공부방 메인)
- [x] 지도 — 과외쌤·학부모 과외탭 **미제공**
- [x] **단지 우선 / 동 우선** — 툴바 전환

## GNB · 메뉴 (6장 · 9장 §13)

- [x] **유틸 + GNB 2층** · 6장 §3·§4
- [x] 퀵매칭·앱·자료실 **미노출**
- [x] GNB: 공부방찾기·과외쌤찾기·학생/학부모·등록·고객센터 (안전과외는 이용안내/고객센터 하위)
- [x] 역할별 ○ / △ / ✕ — [nav-config.js](./src/nav-config.js)
- [x] 11장 Prime/Pick/Basic 노출 필드 — [exposure-schema.js](./src/exposure-schema.js) · [EXPOSURE-REPORT.md](./EXPOSURE-REPORT.md)
- [x] 비교검색 비로그인 차단 · 로그인 후 팝업 표 (`#/parent`)
- [x] 비교검색 로그인 게이트 · 표 모달 · **⇄ 사용자 선택 최대 3건**
- [x] **찜** sessionStorage · 마이페이지(유틸) 목록 · 찜→비교 담기
- [x] 찜·비교 API · 서버 저장 (Dev 로그인 + handoff API)

## 광고 (§11)

- [x] 데스크톱 우측 슬롯 · 프로모션 허브 성격
- [x] 모바일 인라인 (우측 슬롯 제거)

## [임시] / 미구현

| 항목 | 상태 |
|------|------|
| Prime/Pick/Local **상품 노출명** | `[임시]` |
| GNB·버튼 실제 라우팅 | ✅ search-ui·등록 UI · **고객센터 #/support (17a)** |
| 역할 전환 UI | `[임시]` placeholder |
| 지도 API | `[임시]` CSS placeholder |
| 광고 실제 슬롯·구매 연동 | `[임시]` dashed box |
| auth-ui 로그인 연동 | Dev 로그인 툴바 · `/api/auth/me.php` · `:8080` proxy |
| 실데이터·API | 미구현 |
| 인트로 화면 | §10-1 참고용 · 메인 기준 아님 |
