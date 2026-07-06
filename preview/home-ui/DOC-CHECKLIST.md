# 메인 UI — SSOT 9장 검증

**SSOT:** [docs/ssot/09-main-screen-roles.md](../../docs/ssot/09-main-screen-roles.md) · 통합 지도 [30장](../../docs/ssot/30-first-route-map-and-screen-inventory.md) · 갭 감사 [30장 부록 G](../../docs/ssot/30-appendix-g-screen-gap-audit.md)

## 프리뷰

http://localhost:5174 · `cd preview/home-ui && npm run dev`

## 4화면 체크리스트

| # | 화면 | 라우트 | SSOT | 상태 |
|---|------|--------|------|------|
| 1 | 비로그인 메인 | `#/guest` | §3·§4 | ✅ 리디자인 (대치동) |
| 2 | 학부모 메인 | `#/parent` | §5-1 | ✅ 2탭 · `provider-home` · search-find-surface |
| 3 | 공부방 메인 | `#/study-room` | §5-2 | ✅ 2탭 · 내 노출 + 학생찾기 |
| 4 | 과외쌤 메인 | `#/tutor` | §5-3 | ✅ 2탭 · 내 노출(3지역) + 학생찾기 |

## 15장 마이페이지 (**1차 잠금** · home-ui 15a)

| # | 화면 | 라우트 | SSOT | 상태 |
|---|------|--------|------|------|
| 1 | 마이페이지 홈 | `#/mypage/home` | P15-01 | ✅ §4-3-1 강조 |
| 2 | 내 등록 | `#/mypage/registrations` | P15-02 | ✅ |
| 3 | 찜 | `#/mypage/wishlist` | P15-06 | ✅ |
| 4 | 최근열람 | `#/mypage/recent` | P15-07 | ✅ |
| 5 | 쪽지 요약 | `#/mypage/messages` | P15-08 | ✅ |
| 6 | 유료 요약 | `#/mypage/plans` | P15-09 | ✅ | P18 허브 |
| 6b | 유료 안내 | `#/mypage/paid` | P18-01 | ✅ | 카탈로그 · 잔여 횟수·Pick D-day 배지 (18b) |
| 6c | 반응·운영 요약 | `#/mypage/paid/usage` | P18-02 | ✅ | ROI 3종 · `provider-status.js` 단일 캐시 (18b 통합) |
| 6d | 만료·소진 안내 | cron · P18-01 배너 | P15-09 | ✅ | D-7/3/1 · D-30/7 · 1회/0회 · 메일·문자·온사이트 |
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
| 6 | 유료 게이트 | 오버레이 → `#/mypage/paid` | P16-04 | ✅ | 잔여·만료·0회 분기 · compose 1회 차감 안내 |
| 7 | messages-copy.js | §3 배지 · §4 빈 상태 · §7 게이트 | §3·§4·§7 | ✅ |

체계: `src/messages/messages-copy.js` — 배지·게이트·빈 상태 copy · `permissions.js` = 권한만.

레거시 `#/messages/*` → `#/mypage/messages/*` 자동 리다이렉트.

진입: 마이페이지 좌측 「쪽지」·P15-08 「쪽지함 열기」·유틸 「쪽지함」·학생 상세 「메모」.

데모: 공급자 + 마이페이지 쪽지에서 **무료/유료** 토글 · P16-04 → P15-09.

**API (2026-07-06):** Dev 로그인 시 `thread-store` → `/api/messages/threads.php` · DDL `014`·`015` · entitlement · 신고/차단/보관 · `exposure-bridge.js` 실 ID · 비로그인 = sessionStorage 데모.

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

**API (2026-07-06):** Dev 로그인 시 `student-reg/store.js` → `/api/registrations/students.php` · DDL `016` · `auth-session.js` activate · 비로그인 = sessionStorage.

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

**API (2026-07-06):** Dev 로그인 시 `study-room-reg/store.js` → `/api/registrations/study-rooms.php` · `inquiry_status` PATCH · DDL `016`.

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

**API (2026-07-06):** Dev 로그인 시 `tutor-reg/store.js` → `/api/registrations/tutors.php` · DDL `016` (`tutors.published_at`).

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
| 9 | 학생 검토함 | `student-review-store.js` · `#/mypage/student-review` | P25-S10 | ✅ 2차 |
| 10 | Lifecycle 뱃지 | `handoff-lifecycle.js` · 찜·최근·검토함 | §10 | ✅ |
| 11 | P21-05 ↔ 검토함 | `handoff-link.js` · P21-05 · P20-05 · `#/mypage/student-review` | §8 · 21§7 · 20§7 | ✅ |
| 12 | resume token | `handoff-resume.js` · 최근열람 · 상세 ribbon | §6 | ✅ |
| 13 | 판단 스티커 | `handoff-sticker.js` · 찜·비교·검토함 · 문의 전 | §6 · 24 | ✅ |
| 14 | DDL · API | `013_handoff_basket.sql` · `HandoffService.php` · `handoff-api.js` | 부록 B | ✅ |

체험: `#/mypage/recent` resume token · DDL `sql/schema/013_handoff_basket.sql`.

**2차:** **store → API 스왑 ✅** (`auth-session.js` · `handoff-backend.js`) · **부록 B ✅** · **HTTP 배선 ✅**

## 18장 유료 (P15-09 · P18)

| # | 화면 | 라우트 | SSOT | 상태 |
|---|------|--------|------|------|
| 1 | 허브·ROI 미리보기 | `#/mypage/plans` | 18§19 · P15-09 | ✅ |
| 2 | 카탈로그 | `#/mypage/paid` | 18§19 · 18b | ✅ | 횟수권·기간형 · 잔여 배지 |
| 3 | 반응·운영 | `#/mypage/paid/usage` | 18§6 · status API | ✅ | `028` · FIFO 차감 |
| 4 | P16-04 CTA | 게이트 → paid | 18§9-12 | ✅ | FIFO 차감 · 6개월 만료 · entitlements 동기화 |
| 5 | 요청문 열람 | P24 unlock | 18§19 · 13§8 | ✅ | 열람권 FIFO · 학생당 1회 |
| 6 | dev PG 구매 | P18-01 카탈로그 | 18d | ✅ | `checkout.php` · dev mock |

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
| 11 | notice-store · ticket-store | CMS · 티켓 | 17c | ✅ API · sessionStorage fallback |

체계: `support-copy.js` · `support-backend.js` · `notice-store.js` · `ticket-store.js` · `admin-screens.js`.

진입: GNB·유틸 「고객센터」·「이용안내」·푸터 · 툴바 「고객센터」.

CTA: **guest** → 로그인 유도 + 운영 문의 · **로그인** → 쪽지함 + 운영 문의 (17장 §4-1).

**API (2026-07-06):** `/api/support/notices.php` · `/api/support/tickets.php` · DDL `017` · 부팅 시 `support-backend.js` hydrate · 실패 시 sessionStorage fallback.

## 26장 정책·약관 정적 페이지 (P26-xx)

| # | 화면 | 라우트 | SSOT | 상태 |
|---|------|--------|------|------|
| 1 | 이용약관 | `#/policy/terms` | P26-01 | ✅ |
| 2 | 개인정보처리방침 | `#/policy/privacy` | P26-02 | ✅ |
| 3 | 플랫폼 역할 고지 | `#/policy/platform` | P26-03 | ✅ |
| 4 | 제출자료/신뢰정보 고지 | `#/policy/trust` | P26-04 | ✅ |
| 5 | 안전과외 원칙 | `#/policy/safety` | P26-05 | ✅ |
| 6 | 학생정보 보호 고지 | `#/policy/student-privacy` | P26-06 | ✅ |
| 7 | 신고/제재/분쟁 안내 | `#/policy/reporting` | P26-07 | ✅ |
| 8 | footer · 고객센터 · 회원가입 약관 보기 | `layout.js` · `support-copy.js` · `signup-terms.js` | 26§19 | ✅ |

체계: `policy-copy.js` · `policy-router.js` · `policy-shell.js` · `policy-screens.js`.

## 23장 게시판 엔진 · 자료실 (P23-xx) `[엔진 정책 초안 · 다운로드 프리뷰 ✅]`

**정본:** [Notion 23장](https://app.notion.com/p/90e9b270fac8458792cf3abafbf16450) · [docs/internal/23-board-community-integration-draft.md](../../docs/internal/23-board-community-integration-draft.md)

| # | 항목 | SSOT | 상태 |
|---|------|------|------|
| 0 | 상위 개념 = 게시판 엔진 (`library` = 하위 다운로드형) | 23§0·§9 | ✅ 초안 |
| 1 | boardKey별 권한 모델 (read/download/write/upload) | 23§6 · `board-engine-copy.js` | ✅ copy |
| 2 | BOARD_REGISTRY (notice~showcase) | `board-engine-copy.js` | ✅ copy |
| 3 | GNU 콘텐츠 비공유 · SSO만 | 23§10·§11 | ✅ 초안 |
| 4 | 자료실 홈 | `#/library` · P23-01 · `library` | ✅ 프리뷰 |
| 5 | 양식·체크리스트 | `#/library/templates` · P23-02 | ✅ 프리뷰 |
| 6 | 가이드 PDF | `#/library/guides` · P23-03 | ✅ 프리뷰 |
| 7 | 제출함 허브 | `#/mypage/submission-board` · P23-04 | ✅ 프리뷰 |
| 8 | 제출 작성/수정 | `#/mypage/submission-board/new` · `…/edit` · P23-04a | ✅ 프리뷰 |
| 9 | 제출 상세 | `#/mypage/submission-board/:id` · P23-04b | ✅ 프리뷰 |
| 10 | 게시판 엔진 API/DDL | `021` · `025_board_post_attachments` · `/api/board/*` | ✅ 1차 (submission 첨부 업로드·토큰 다운로드) |
| 11 | 큐레이션형 `showcase` | — | 2차 후보 |

체계: `board-engine-copy.js` · `board/board-api.js` · `board/board-backend.js` · `submission-board/*` · `library/*`. GNB 미노출 · 유틸·툴바·마이페이지 진입. API 실패 시 sessionStorage·정적 시드 fallback.

## 28장 관리자 운영 · RED LINE (A28) `[정책 2차 잠금 ✅ · 콘솔 △ 프리뷰]`

**정본:** [docs/ssot/28-admin-console-red-line.md](../../docs/ssot/28-admin-console-red-line.md) · `src/admin-red-line-copy.js`

| # | 항목 | SSOT | 상태 |
|---|------|------|------|
| 0 | 대원칙 (심사·인증기관 없음 · 연결 플랫폼) | 28§0 | ✅ 잠금 |
| 1 | 운영자 허용 조치 7종 | 28§1 | ✅ 잠금 |
| 2 | 운영자 금지 조치 (심사·보증·진위 최종 확인자) | 28§2 | ✅ 잠금 |
| 3 | 제출자료 내부 확인 (심사✕ · 참고자료 · 발급기관 재확인) | 28§3 · A28-06 | ✅ 잠금 |
| 3b | A28-07 노출·권한 보정 (액션·로그 표) | 28§3-b · `A28_07_*` | ✅ **잠금** |
| 4 | 제출자료 사용자-facing 표현·안내 문구 | 28§4 · `SUBMISSION_DOC_USER_NOTICE` | ✅ 잠금 |
| 5 | 문의 vs 신고 큐 분리 (사기/위험 포함) | 28§5 | ✅ 잠금 |
| 6 | P17-admin / A28 역할·이관 (완전 이관 확정 단계 아님) | 28§6 | ✅ 잠금 |
| 7 | A28 내부 전용 (라우트/인증은 기술 후속) | 28§7 | ✅ 잠금 |
| 8 | 금지어·대체어 (운영자 확인·공식 인증 추가) | 28§8 | ✅ 잠금 |
| 9 | 운영 로그 최소 필드 | 28§9 · A28-08 | ✅ 잠금 |
| 10 | 사용자 알림 정책·문구 예시 | 28§10 | ✅ 잠금 |
| 11 | 혼용 금지 4쌍 | 28§11 | ✅ 잠금 |
| 12 | P17-admin 프리뷰 | `#/support/admin/*` | ✅ 17c |
| 13 | A28-04 신고 처리 콘솔 | `#/admin/reports` · `024_admin_reports.sql` | △ 프리뷰 (큐 API ✅) |
| 14 | A28-05 공지·가이드 | `#/admin/notices` | △ 프리뷰 |
| 15 | A28-06~08 제출자료·노출·로그 | `#/admin/*` · `022_admin_ops.sql` | △ 프리뷰 (A28-06·07 API ✅) |
| 16 | A28 본체 shell · RED LINE 배너 | `#/admin` · `admin/` | △ 프리뷰 |
| 17 | 운영자 인증/권한 (1차) | `026_admin_dev_seed` · `AdminApi.requireAdmin` · `#/admin/reports|submission-docs|exposure|logs` 가드 | ✅ 1차 |
| 18 | A28-07 노출·권한 보정 API | `AdminExposureService` · `/api/admin/exposure.php` | ✅ 1차 |
| 19 | A28-07 QA 조합표 | [30장 부록 F](../../docs/ssot/30-first-route-map-and-screen-inventory.md#부록-f-a28-07-qa-조합표-2026-07-07-잠금) | ✅ 잠금 |
| 20 | submission 첨부 E2E | `e2e/submission-attachment-flow.spec.js` · `npm run e2e` | ✅ (API+UI) |
| 21 | A28-07 PATCH·경계·가드 E2E | `e2e/a28-07-exposure-patch.spec.js` · `npm run e2e:a28-07` · 부록 F Q1~Q20 · **submitted publish 422** | ✅ (API) |
| 22 | A28-07 운영 스모크 | `e2e/a28-07-ops-smoke.spec.js` · `npm run e2e:ops-smoke` · [릴리즈 메모](../../docs/release/2026-07-07-a28-07-ops.md) | ✅ |
| 25 | 30장 §16 ↔ Notion §15 | `screen-inventory.json` · `sync:inventory` | ✅ 2026-07-07 |
| 24 | P18 라우트 분리 | `#/mypage/paid` · `#/mypage/paid/usage` · `paid-router.js` | ✅ 1차 |

**원칙:** 운영 조치 가능 · 심사·보증·인증처럼 보이게 하지 않음 · 인증기관 아님.

## 29장 공통 UX 상태 (Empty·Error·권한) `[정책 1차 잠금 ✅ · 화면 점진 적용]`

**정본:** [docs/ssot/29-empty-error-permission-ux.md](../../docs/ssot/29-empty-error-permission-ux.md) · `src/empty-state-copy.js`

| # | 항목 | SSOT | 상태 |
|---|------|------|------|
| 1 | 29장 역할 (copy 기준 · 30장이 route) | 29§1 | ✅ 잠금 |
| 2 | 상태 카드 5요소 + 작성 순서 | 29§2 | ✅ 잠금 |
| 3 | 권한 부족 5종 분리 | 29§3 · `PERMISSION_DENIED_COPY` | ✅ 잠금 |
| 4 | Error 4종 + 입력값 유지 원칙 | 29§4 · `ERROR_COPY` | ✅ 잠금 |
| 5 | Empty / 0건 / Max 구분 | 29§5 | ✅ 잠금 |
| 6 | 학생 보호 = 보호 안내 UX | 29§6 · `STUDENT_PROTECTION_COPY` | ✅ 잠금 |
| 7 | CTA 안내형 원칙 | 29§7 | ✅ 잠금 |
| 8 | 공통 금지어 (22·28 연동) | 29§8 · `FORBIDDEN_STATE_TERM_MAP` | ✅ 잠금 |
| 9 | P-ID 연결 (P15-06/07 · P16-01 · P24 · P25) | 29§9 | ✅ 잠금 |
| 10 | `renderStateCard` 공통 UI | `empty-state-copy.js` · `home.css` `.state-card` | ✅ |
| 11 | P15-06 찜 빈 상태 | `mypage/screens.js` · `user-actions-ui.js` | ✅ 1차 |
| 12 | P15-07 최근열람 빈 상태 | `mypage/screens.js` | ✅ 1차 |
| 13 | P16-01 쪽지 0건 | `messages/screens.js` | ✅ 1차 |
| 14 | P24 권한·보호 상태 | `detail-utils.js` · `student-request-card.js` | ✅ 1차 |
| 15 | P25 비교 Empty / Max | `compare-modal.js` · `handoff-utils.js` | ✅ 1차 |
| 16 | P19-01 자녀 목록 Empty | `student-reg/screens.js` · `EMPTY_COPY.students` | ✅ 1차 |
| 17 | P25-S10 검토함 Empty | `mypage/screens.js` · `EMPTY_COPY.studentReview` | ✅ 1차 |
| 18 | copy 통합 (29→30) | `empty-state-copy.js` 정본 · 레거시 정리 | ✅ |

**원칙:** 혼내거나 압박하지 않고 · 현재 상태 설명 → 다음 행동.

## 구조 (§6·§7·§8)

- [x] 상단 3박스 — Prime · **실제 3칸 고정 슬롯**
- [x] 중단 5박스 — Pick · **5칸 고정형 시작**
- [x] 하단 전체 리스트 — Local List · **최근 등록순**
- [x] 반응형 웹 (§9)
- [x] 더미데이터
- [x] 오렌지/블루 브랜드 톤

## 역할별 홈 · 검색 통합 흐름 (2026-07-07)

**모듈:** `src/provider-home.js` · `src/find-state.js` · `@search-ui/search-find-surface.js` (home-ui · search-ui 공용)

### 홈 2탭 (목적형) vs 검색 GNB (탐색형)

| 역할 | 홈 탭 | 홈 목적 | GNB 검색 탭 | 검색 목적 |
|------|--------|---------|-------------|-----------|
| 학부모·비회원 | 우리동네 공부방 · 우리동네 과외쌤 | 지역 피드 + 조건 검색 | `room` · `tutor` | 공부방·과외 탐색 |
| 공부방 | 우리동네 공부방 · 우리동네 학생 | 탭1 **내 노출** · 탭2 학생찾기 | `room` · `student` | 내 노출(검색) · 학생찾기 |
| 과외쌤 | 우리동네 과외쌤 · 우리동네 학생 | 탭1 **내 노출(3지역)** · 탭2 학생찾기 | `tutor` · `student` | **경쟁 과외쌤** · 학생찾기 |

- [x] 학부모 홈 — `parentFind` · 탭 전환 시 `resetParentFind()` · Compare Bar
- [x] 공부방 홈 — `studyRoomFind` · 탭1 `homeSelf` 자기 노출 · 「경쟁 공부방 찾기 (검색)」 링크
- [x] 과외쌤 홈 — `tutorFind` · 탭1 `homeSelf` · 활동 지역 3탭 · 검색 폼 숨김 · 「경쟁 과외쌤 찾기 (검색)」 링크
- [x] 공급자 홈 탭1 — 비교·찜 비활성 (`showCompare`/`showWish` off · Compare Bar 미렌더)
- [x] GNB `find_room` / `find_tutor` / `student_parent` → `preview-links.js` · `?role=` + search-ui 해시 탭
- [x] 툴바·region-bar 「검색」→ `defaultSearchTabForRole(role)` (역할별 기본 탭)

### 지도 · 지역 · 검색 UI 문법 (13장 §8-2-2)

- [x] 공부방: **지도 → 검색박스 → 결과** (학부모 공부방탭 · 공부방 홈 · search-ui `room`)
- [x] 과외쌤: 지도 없음 · **3지역 탭 → 지역 피드 → 컴팩트 검색 → 결과** (search-ui 경쟁 탭)
- [x] 과외 홈 탭1: 3지역 탭 + 내 노출만 · **「지역 변경」버튼 없음** (등록 변경은 마이페이지)
- [x] 학생: 블라인드 리스트 · 찜·쪽지 · 비교 없음
- [x] 검색 전 — `getRegionFeed()` Prime/Pick/Basic · 검색 후 결과만 교체 (`activeResultItems` SSOT)
- [x] `sourceRoute: 'parent'|'study_room'|'tutor'` — handoff resume 라벨

### 1차 완료 전 최종 점검 (2026-07-07)

- [x] **data-result-source** — `region` \| `search` 실값 노출 (`data-result-items="activeResultItems"` 병기)
- [x] **0건 상태** — 탭·모드별 copy (`getSearchZeroResultCopy` · `renderSearchZeroState` · 29장 톤) · reset 후 region 피드 유지
- [x] **지도 핀 ↔ 카드** — `data-provider-id` 계약 · `bindSearchMapPinLinks` (핀→카드 강조 · 카드 hover→핀) · API 후속 연결 여지

## 역할별 콘텐츠 (§4·§5)

- [x] 비회원 = **대치동 고정 데모** + 지역 히어로·지도 + 공부방/과외 Prime·Pick + 학생 리스트 (§4)
- [x] 비회원 = 로그인 유도 (상세·찜·비교·문의) · [GUEST-REDESIGN.md](./GUEST-REDESIGN.md)
- [x] 학부모 = **우리동네 공부방 / 우리동네 과외쌤** 2탭 (디폴트 공부방) · `search-find-surface` (§5-1)
- [x] 학부모 과외탭 = 희망 지역 **3탭** + 지역별 Prime/Pick/Basic
- [x] 공부방 = **내 공부방 박스** + 우리동네 공부방(내 노출 미리보기) / 우리동네 학생 (§5-2)
- [x] 과외쌤 = **내 과외쌤 박스** + 우리동네 과외쌤(활동 3지역·내 노출) / 우리동네 학생 (§5-3)

## 지도·지역 (§2)

- [x] 지도 — **공부방만** (비회원 · `#/parent` 공부방탭 · `#/study-room` 우리동네 공부방)
- [x] 지도 — 과외쌤·학부모 과외탭 · 과외쌤 홈 **미제공**
- [x] **단지 우선 / 동 우선** — 툴바 전환 (학부모·공급자)
- [x] 공급자 홈 — 「지역 변경」 숨김 (과외 3지역 탭 · 공부방 MOCK 지역 라벨만)

## GNB · 메뉴 (6장 · 9장 §13)

- [x] **유틸 + GNB 2층** · 6장 §3·§4
- [x] 퀵매칭·앱·자료실 **미노출**
- [x] GNB: 공부방찾기·과외쌤찾기·학생/학부모·등록·고객센터 (안전과외는 이용안내/고객센터 하위)
- [x] 역할별 ○ / △ / ✕ — [nav-config.js](./src/nav-config.js)
- [x] **역할별 GNB 라벨** — 공부방→「학생찾기」·공부방→「공부방찾기」·과외→「과외쌤찾기」
- [x] 학부모·비회원 — `student_parent` **hide** · 공부방·과외 찾기만
- [x] 공부방 — `find_tutor` hide · `find_room`+`student_parent` show
- [x] 과외쌤 — `find_room` hide · `find_tutor`+`student_parent` show
- [x] GNB → search-ui 외부 링크 (`searchUiUrl(tab, role)`) · 홈 2탭과 **목적 분리**
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
| **9장 부록 인증정책** | 비번 규칙 · **§E** 메일 링크 4단계 재설정 · **행동 전 이메일 인증** (`email_verify_required` · `email-verify-overlay.js`) |
| auth ↔ home 흐름 | 로그인→home · 비번찾기→재설정→로그인 — [§E-11 Dev/QA만](../../docs/ssot/09-appendix-login-and-auth-policy.md) (`mail.log`는 사용자 플로우 아님) |
| 실데이터·API | 미구현 |
| 인트로 화면 | §10-1 참고용 · 메인 기준 아님 |
