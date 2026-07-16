# 30장 — 1차 라우트맵·화면 ID 인벤토리

**상태: 인벤토리 2차 동기화 (2026-07-07)** — [부록 G 갭 감사](30-appendix-g-screen-gap-audit.md) · P18·§16 row 확장  
**역할:** 장별 SSOT·프리뷰·코드 간 **단일 지도** — P/A ID · hash · 파일 · 구현상태 · **진입 규칙** · 의존 장  
**연동:** 전 장 · 특히 [15](15-mypage-structure.md) · [16](16-messages-structure-proposal.md) · [17](17-customer-center-and-safe-guide.md) · [19~21](19-student-registration-management.md) · [24](24-detail-decision-layer.md) · [22](22-platform-lifecycle-principles.md)  
**갱신:** 코드·`DOC-CHECKLIST` 변경 시 본 장 **§4 표** 우선 갱신

> **본문 원칙:** 정책·필드 정의는 각 장 SSOT. 30장은 **어디에 무엇이 있고 얼마나 구현됐는지**만 잠근다.

---

## 0. 화면 ID 3층 규칙 (잠금)

| 층 | 접두 | `type` | hash/URL | 예 |
|----|------|--------|----------|-----|
| **사용자 화면** | **P** | `screen` | ○ (hash 또는 SPA path) | P15-01, P21-02 |
| **Shell 컴포넌트 블록** | **P…-Bxx** | `block` | **✕** (부모 모달/화면 안) | P24-B05 Contact Panel |
| **내부 운영** | **A** | `admin` | ○ (내부 전용) | A28-04 · **현재 P17-admin 프리뷰** |

**오해 금지:** P24-B05~B07 · P25-00 · P25-07은 **별도 라우트 화면이 아니다.**

**Compare handoff 2차:** P24-08 · P25-06 — [25장 (예정)](#25장-예정-행) · [24§13](24-detail-decision-layer.md#13-compare-aware--decision-handoff).

---

## 1. 잠금 등급 (문서·코드 공통)

| 등급 | 의미 | 장 예 |
|------|------|-------|
| **정책 잠금** | 원칙·금지어·범위 | 22 |
| **UX·실행 1차 잠금** | 사용자 흐름·화면 확정 | 15 · 16 · 17 · 24 |
| **초안 + 프리뷰 ✅** | 코드 앞섬 → 문서 승격 대기 | 19 · 20 · 21 |
| **인벤토리 동기화** | 구현 ↔ 부록 맞추기 | 24 · **30** |
| **후순위 / 2차** | 지금 구현 ✕ | 18 · 27 full · 28 full · Compare handoff 2차 |

---

## 2. 프리뷰 패키지 · 포트

| 패키지 | 포트 | hash/라우트 | SSOT 장 |
|--------|------|-------------|---------|
| [auth-ui](../../preview/auth-ui/) | **5173** | `#/login` · `#/signup/*` | 2 · 14 |
| [home-ui](../../preview/home-ui/) | **5174** | `#/guest` · `#/mypage/*` · `#/support/*` | 9 · 15~17 · 19~21 · 24 |
| [study-room-ui](../../preview/study-room-ui/) | **5175** | `#/register/*` | 5 · 20 브리지 |
| [search-ui](../../preview/search-ui/) | **5176** | 단일 페이지 · `?role=` | 13 |
| [tutor-ui](../../preview/tutor-ui/) | **5177** | `#/register/*` | 8 · 21 브리지 |

**검증:** 각 패키지 [DOC-CHECKLIST.md](../../preview/home-ui/DOC-CHECKLIST.md) — 30장은 **통합 인덱스**.

---

## 3. 인벤토리 표 — 컬럼 정의 (템플릿)

| 컬럼 | 설명 |
|------|------|
| **ID** | P / P-B / A |
| **type** | screen · block · overlay · admin |
| **이름** | 사용자-facing 명칭 |
| **hash / 라우트** | `#/…` 또는 패턴 `{id}` |
| **코드 정본** | 파일 · 디렉터리 |
| **SSOT** | 장 · § |
| **UI** | ✅ / △ / ✕ |
| **API·DDL** | ✅ / △ / ✕ / — |
| **1차** | ○ / △ / 후순위 |
| **진입** | 공개 · 로그인 · 역할 · 유료 · 학생 보호 · 기본 진입 |
| **프리뷰 URL** | 대표 링크 |

---

## 4. 인벤토리 — home-ui · 9장 메인

| ID | type | 이름 | hash | 코드 | SSOT | UI | API | 1차 | 프리뷰 |
|----|------|------|------|------|------|:--:|:---:|:---:|--------|
| P09-01 | screen | 비회원 메인 | `#/guest` | `screens/guest.js` | 9§3·4 | ✅ | — | ○ | http://127.0.0.1:5174/#/guest |
| P09-02 | screen | 학부모 메인 | `#/parent` | `screens/parent.js` · `provider-home.js` | 9§5-1 | ✅ | — | ○ | …/#/parent |
| P09-03 | screen | 공부방 메인 | `#/study-room` | `screens/study-room.js` · `provider-home.js` | 9§5-2 | ✅ | — | ○ | …/#/study-room |
| P09-04 | screen | 과외쌤 메인 | `#/tutor` | `screens/tutor.js` · `provider-home.js` | 9§5-3 | ✅ | — | ○ | …/#/tutor |

**프리뷰 구현 (2026-07-07) — 홈·검색 통합**

| 역할 | 홈 2탭 (목적형) | GNB → search-ui (탐색형) |
|------|-----------------|---------------------------|
| 학부모 | 우리동네 공부방 · 우리동네 과외쌤 | `room` · `tutor` |
| 공부방 | 우리동네 공부방(내 노출) · 우리동네 학생 | `room`(내 노출) · `student` |
| 과외쌤 | 우리동네 과외쌤(내 노출·3지역) · 우리동네 학생 | `tutor`(경쟁) · `student` |

공용: `preview/home-ui/src/provider-home.js` · `preview/search-ui/src/search-find-surface.js` · `homeSelf` 자기노출 분기.  
검증: [home-ui/DOC-CHECKLIST.md](../../preview/home-ui/DOC-CHECKLIST.md) · [search-ui/DOC-CHECKLIST.md](../../preview/search-ui/DOC-CHECKLIST.md)

---

## 5. 인벤토리 — home-ui · 15장 마이페이지

| ID | type | 이름 | hash | 코드 | SSOT | UI | API | 1차 | 프리뷰 |
|----|------|------|------|------|------|:--:|:---:|:---:|--------|
| P15-01 | screen | 마이페이지 홈 | `#/mypage/home` | `mypage/screens.js` | 15§4 | ✅ | △ | ○ | …/#/mypage/home |
| P15-02 | screen | 내 등록 허브 | `#/mypage/registrations` | `mypage/screens.js` | 15§5 | ✅ | △ | ○ | …/#/mypage/registrations |
| P15-06 | screen | 찜 | `#/mypage/wishlist` | `mypage/screens.js` | 15§5 · **25 예정** | ✅ | △ | ○ | …/#/mypage/wishlist |
| P15-07 | screen | 최근열람 | `#/mypage/recent` | `mypage/recent-store.js` | 15§6 · **25 예정** | ✅ | △ | ○ | …/#/mypage/recent |
| P15-08 | screen | 쪽지 요약 | `#/mypage/messages` | `mypage/screens.js` | 15→16 | ✅ | △ | ○ | …/#/mypage/messages |
| P15-09 | screen | 유료 요약 | `#/mypage/plans` | `mypage/screens.js` | 15§7 · 18 | ✅ | ✕ | △ | …/#/mypage/plans |
| P15-10 | screen | 제출자료 상태 | `#/mypage/submission-docs` | `mypage/screens.js` | 15§2-1 · 22 | ✅ | △ | ○ | …/#/mypage/submission-docs |
| P15-11 | screen | 계정/설정 | `#/mypage/account` | `mypage/screens.js` | 15§11 | ✅ | △ | ○ | …/#/mypage/account |
| — | copy | 마이페이지 copy | — | `mypage/mypage-copy.js` | 15§4·7·11 | ✅ | — | ○ | — |

**라우터 정본:** `mypage/router.js` · `MYPAGE_PATH_TO_SCREEN`

---

## 5-b. 인벤토리 — 18장 유료서비스 (P18)

> **갭 감사:** [부록 G](30-appendix-g-screen-gap-audit.md) · 18장은 정책 중심이나 **P18-xx 인벤토리 행이 비어 있던 상태** — 1차는 P15-09에 흡수 · ID는 분리 표기

| ID | type | 이름 | hash / 진입 | 코드 | SSOT | UI | API | 1차 | 비고 |
|----|------|------|-------------|------|------|:--:|:---:|:---:|------|
| P18-01 | screen | 유료 서비스 안내 | `#/mypage/paid` | `mypage/paid-screens.js` · `plans-catalog.js` | 18§9 | △ | ✕ | 후순위 | P15-09 허브 · P16-04 CTA |
| P18-02 | screen | 이용중·반응 요약 (ROI) | `#/mypage/paid/usage` | `paid-screens.js` · `paid-backend.js` | 18§6 · 18a | △ | ✕ | △ | ROI API·DDL (027) |
| P18-03 | screen | 결제/충전 | (미정) | — | 18§12 · 18c | ✕ | ✕ | 후순위 | PG 후순위 |
| P18-04 | screen | Prime 신청 | P21-06 · plans CTA | 링크만 | 18§11 | △ | ✕ | 후순위 | 희소 배정 |
| P18-05 | screen | 영수증/결제 이력 | (미정) | — | 18c | ✕ | ✕ | 후순위 | — |
| — | overlay | P16-04 유료 게이트 | (오버레이) | `messages/overlays.js` | 16§7 · 18 | ✅ | ✕ | △ | CTA → **P18-01** `#/mypage/paid` |

**진입:** P15-09 허브 · P16-04 · 17 FAQ · P21-06 Prime 링크

---

## 6. 인벤토리 — 16장 쪽지함

| ID | type | 이름 | hash | 코드 | SSOT | UI | API | 1차 | 프리뷰 |
|----|------|------|------|------|------|:--:|:---:|:---:|--------|
| P16-01 | screen | 쪽지함 리스트 | `#/mypage/messages/inbox` · `/sent` · `/active` | `messages/screens.js` | 16§4 | ✅ | △ | ○ | …/inbox |
| P16-02 | screen | 대화방 | `#/mypage/messages/thread/{id}` | `messages/screens.js` | 16§5 | ✅ | △ | ○ | …/thread/1 |
| P16-03 | overlay | 첫 메모 | (오버레이) | `messages/compose-flow.js` | 16§6 | ✅ | △ | ○ | P24 등 진입 |
| P16-04 | overlay | 유료 게이트 | (오버레이) | `messages/overlays.js` | 16§7 · 18 | ✅ | ✕ | △ | → plans |
| — | store | thread 재사용 | — | `messages/thread-store.js` | 16§6-3 | ✅ | △ | ○ | sessionStorage |

**라우터:** `messages/router.js` · 레거시 `#/messages/*` → redirect

---

## 7. 인벤토리 — 17장 고객센터

| ID | type | 이름 | hash | 코드 | SSOT | UI | API | 1차 | 프리뷰 |
|----|------|------|------|------|------|:--:|:---:|:---:|--------|
| P17-01 | screen | 고객센터 홈 | `#/support` | `support/screens.js` | 17§4 | ✅ | — | ○ | …/#/support |
| P17-01 | screen | 이용안내 | `#/support/guide` | `support/screens.js` | 17§4-2 | ✅ | — | ○ | …/guide |
| P17-04 | screen | FAQ | `#/support/faq` | `support/screens.js` | 17§7-1 | ✅ | — | ○ | …/faq |
| P17-05 | screen | 공지 | `#/support/notice` | `notice-store.js` | 17§7-2 · 17c | ✅ | △ | ○ | …/notice |
| P17-07 | screen | 운영문의 | `#/support/contact` | `ticket-store.js` | 17§7-3 · 17c | ✅ | △ | ○ | …/contact |
| P17-07 | screen | 내 문의 내역 | `#/support/contact/tickets` | `ticket-store.js` | 17c | ✅ | △ | ○ | …/tickets |
| P17-02 | screen | 안전과외 목록 | `#/support/safe` | `support/screens.js` | 17§5 | ✅ | — | ○ | …/safe |
| P17-03 | screen | 가이드 상세 | `#/support/safe/{slug}` | `support-copy.js` | 17§6 · 17b | ✅ | — | ○ | …/safe/prepay |
| P17-06 | screen | 약관/정책 링크 | `#/support` (칩) | placeholder | 17§2-2 | △ | — | △ | **→ [26장 예정](#26장-예정-행)** |
| P17-admin | admin | 운영 콘솔 | `#/support/admin/*` | `admin-screens.js` | 17c | ✅ | △ | △ | …/admin |
| — | copy | support copy | — | `support/support-copy.js` | 17§3~7 | ✅ | — | ○ | — |

**라우터:** `support/router.js`

---

## 8. 인벤토리 — 19 · 20 · 21장 등록·운영 (home-ui)

> **개별 row:** group 표기(`P19-03a/b`) 대신 **화면 ID당 1행** — [부록 G](30-appendix-g-screen-gap-audit.md)

### 19장 학생

| ID | type | 이름 | hash | 코드 | SSOT | UI | API | 1차 |
|----|------|------|------|------|------|:--:|:---:|:---:|
| P19-01 | screen | 자녀(학생) 목록 | `#/mypage/registrations/students` | `student-reg/` | 19§3 | ✅ | △ | ○ |
| P19-02 | screen | 자녀 관리 허브 | `…/students/{id}` | `student-reg/screens.js` | 19§4 | ✅ | △ | ○ |
| P19-03a | screen | 기본등록 | `…/{id}/basic` | 브리지 | 19§5 | ✅ | △ | ○ |
| P19-03b | screen | 상세등록 | `…/{id}/detail` | 브리지 | 19§5 | ✅ | △ | ○ |
| P19-04 | screen | 미리보기·공개 | `…/{id}/publish` | publish | 19§6 | ✅ | △ | ○ |
| P19-05 | screen | 공개설정 | `…/{id}/settings` | settings | 19§7 | ✅ | △ | ○ |
| P19-06 | — | (P19-05 흡수) | — | — | 19 | ✅ | — | ○ |

**P19 → P24-04:** 공개설정 변경 → 학습 요청 카드 반영 규칙 — [24§9](24-detail-decision-layer.md#9-p24-04-학습-요청-카드)

### 20장 공부방

| ID | type | 이름 | hash | 코드 | SSOT | UI | API·DDL | 1차 |
|----|------|------|------|------|------|:--:|:-------:|:---:|
| P20-01 | screen | 공부방 목록 | `#/mypage/registrations/study-rooms` | `study-room-reg/` | 20§3 | ✅ | △ | ○ |
| P20-02 | screen | 공부방 운영 허브 | `…/study-rooms/{id}` | 상태판 | 20§6 | ✅ | △ | ○ |
| P20-03a | screen | 기본정보 | `…/{id}/basic` | 브리지→5175 | 20§5 | ✅ | △ | ○ |
| P20-03b | screen | 상세정보 보강 | `…/{id}/detail` | 브리지→5175 | 20§5 | ✅ | △ | ○ |
| P20-04 | screen | **미리보기·공개** | `…/{id}/publish` | publish | 20§5 | ✅ | △ | ○ |
| P20-05 | screen | 노출·상담 | `…/{id}/exposure` | exposure | 20§7 | ✅ | **△ DDL** | ○ |
| P20-06 | — | (P20-05 흡수) | — | — | 20 | ✅ | — | ○ |

### 21장 과외

| ID | type | 이름 | hash | 코드 | SSOT | UI | API | 1차 |
|----|------|------|------|------|------|:--:|:---:|:---:|
| P21-01 | screen | 과외 프로필 목록 | `#/mypage/registrations/tutors` | `tutor-reg/` | 21§3 | ✅ | △ | ○ |
| P21-02 | screen | 과외쌤 운영 허브 | `…/tutors/{id}` | 상태판 | 21§6 | ✅ | △ | ○ |
| P21-03a | screen | 기본정보 | `…/{id}/basic` | 브리지→5177 | 21§5 | ✅ | △ | ○ |
| P21-03b | screen | 상세정보 | `…/{id}/detail` | 브리지→5177 | 21§5 | ✅ | △ | ○ |
| P21-04 | screen | **미리보기·공개** | `…/{id}/publish` | 4모드 미리보기 | 21§5 | ✅ | △ | ○ |
| P21-05 | screen | 학생 접근·쪽지 | `…/{id}/access` | access | 21§7 | ✅ | △ | ○ |
| P21-06 | screen | **노출·부oost·Prime** | `…/{id}/exposure` | exposure | 21§8 | ✅ | △ | ○ |
| P21-07 | — | (P21-06 흡수) | — | — | 21 | ✅ | — | ○ |

**라우터:** `student-reg/router.js` · `study-room-reg/router.js` · `tutor-reg/router.js`  
**copy:** `student-reg/student-reg-copy.js` · `study-room-reg/study-room-reg-copy.js` · `tutor-reg/tutor-reg-copy.js`  
**문서 상태:** 19·20·21 = **UX·실행 1차 잠금**

---

## 9. 인벤토리 — 24장 상세 판단 (Modal First)

> **P24-02 · P24-03:** `type=block`이지만 **타입별 상세 variant로 필수** — hash 없음 · 검색·홈 카드 진입

| ID | type | 이름 | 코드 | SSOT | UI | 1차 | 비고 |
|----|------|------|------|------|:--:|:---:|------|
| P24-01 | screen | Detail Shell (모달) | `detail-decision/detail-shell.js` | 24§5 · 부록 A | ✅ | ○ | 공통 chrome |
| **P24-02** | block | **공부방 상세 variant** | `studyroom-detail.js` | 24§7 | ✅ | ○ | **필수** · room 카드 진입 |
| **P24-03** | block | **과외 상세 variant** | `tutor-detail.js` | 24§8 | ✅ | ○ | **필수** · tutor 카드 진입 |
| P24-04 | block | 학습 요청 카드 | `student-request-card.js` | 24§9 | ✅ | ○ | P19 공개설정 연동 |
| P24-B05 | block | Contact Panel | `detail-utils.js` `buildContactPanel` | 24§5-5 · 21§7 | ✅ | ○ | |
| P24-B06 | block | Trust Strip | `detail-utils.js` · `lifecycle-copy.js` | 24§11 · 22§7 | ✅ | ○ | |
| P24-B07 | block | Sticky CTA | `detail-shell.js` | 24§5-6 | ✅ | ○ | |
| P24-08 | block | Compare-aware | toast · sticky N/3 · compare-modal | 24§13 | ✅ | ✅ | |

**규약:** hash 상세 URL **1차 ✕** — client state only · [24 부록 C](24-detail-decision-layer.md#부록-c-url--client-state-규약-1차-잠금--2026-07-06)

**legacy:** `student-detail-modal.js` — 정본 ✕ · 이관 완료

---

## 10. 인벤토리 — 25장 Handoff · 횡단 컴포넌트

**문서:** [25장](25-decision-handoff-layer.md) · **copy:** `handoff-copy.js` · `handoff-utils.js`

| ID | type | 이름 | 현재 코드 | SSOT | UI | 1차 |
|----|------|------|-----------|------|:--:|:---:|
| P25-00 | block | Global Compare Bar | `user-actions-ui.js` | 25§4 · 13§8 | ✅ | ○ |
| P25-01 | screen | 찜 (handoff) | `#/mypage/wishlist` · P15-06 | 25§4 · 15§5 | ✅ | ✅ | ○ |
| P25-02 | screen | 최근열람 (handoff) | `#/mypage/recent` · P15-07 | 25§6 · 15§6 | ✅ | ✅ | ○ |
| P25-03 | state | 비교 후보함 | `user-actions-state.js` | 25§5 | ✅ | ✅ | ○ |
| P25-04 | overlay | Compare Modal | `compare-modal.js` | 25§5 · 11 | ✅ | — | ○ |
| P25-05 | block | 검색 결과행 액션 | `exposure-render.js` | 25§4 · 13§7 | ✅ | — | ○ |
| P25-06 | handoff | 상세→비교/찜/toast | `detail-shell.js` | 25§6 · 24§13 | ✅ | ✅ | ○ |
| P25-08 | copy | Empty/Max | `handoff-copy.js` | 25§9 · 부록 B | ✅ | — | ○ |
| P25-S10 | screen | 학생 검토함 | `#/mypage/student-review` · `student-review-store.js` | 25§8 | ✅ | ✅ | **2차 ✅** |

**Compare max:** `COMPARE_MAX = 3` (11·13·25§4-3).

---

## 11. 인벤토리 — auth-ui · search-ui · 등록 UI

### auth-ui (5173)

| ID | hash | SSOT | UI | 1차 |
|----|------|------|:--:|:---:|
| P02-01 | `#/login` | 2§3.1 | ✅ | ○ |
| P14-01~06 | `#/signup/*` · `#/find-*` | 14 | ✅/⚠️ | ○ |

### search-ui (5176)

| ID | hash | SSOT | UI | 1차 |
|----|------|------|:--:|:---:|
| P13-01 | `/` · `?role=` · `#/search/{tab}` | 13 | ✅ | ○ |
| P13-02 | 역할별 2탭 · `search-role-access.js` | 13·9§13 | ✅ | ○ |
| P13-03 | 지역 피드 · 3지역 탭 · `homeSelf` | 13§8-2 | ✅ | ○ |
| P24-smoke | 카드→Shell · compare 2차 | 24§20-1 · search-handoff | ✅ | ○ |

### study-room-ui (5175) · tutor-ui (5177)

| 패키지 | hash 패턴 | SSOT | UI | 브리지 |
|--------|-----------|------|:--:|--------|
| study-room-ui | `#/register/*` | 5 | ✅ | P20-03 → 5175 |
| tutor-ui | `#/register/*` | 8 | ✅ | P21-03 → 5177 |

---

## 12. 26장 (예정) · 27a · 28

### 26장 정책·약관 (UX 1차 잠금 ✅)

| ID | hash | 코드 | SSOT | UI | 1차 | 진입 |
|----|------|------|------|:--:|:---:|:---:|
| P26-01 | `#/policy/terms` | `policy-screens.js` | 26§3 | ✅ | ○ | 공개 |
| P26-02 | `#/policy/privacy` | `policy-screens.js` | 26§4 | ✅ | ○ | 공개 |
| P26-03 | `#/policy/platform` | `policy-screens.js` | 26§5 | ✅ | ○ | 공개 |
| P26-04 | `#/policy/trust` | `policy-screens.js` | 26§6 | ✅ | ○ | 공개 |
| P26-05 | `#/policy/safety` | `policy-screens.js` | 26§7 | ✅ | ○ | 공개 |
| P26-06 | `#/policy/student-privacy` | `policy-screens.js` | 26§8 | ✅ | ○ | 공개 |
| P26-07 | `#/policy/reporting` | `policy-screens.js` | 26§9 | ✅ | ○ | 공개 |
| — | `policy-copy.js` · `policy-router.js` | copy·라우터 | 26§19 | ✅ | ○ | — |
| P17-06 | footer · `#/support` 칩 → `#/policy/*` | `support-copy.js` · `layout.js` | 17§2-2 · 26§19 | ✅ | ○ | 공개 |

### 27a (30장 § 또는 27장 메모)

| 항목 | UI | 1차 |
|------|:--:|:---:|
| 쪽지 미읽음 뱃지 | △ | ○ |
| P15 역할별 stat | ✅ | ○ |
| P20/P21 상태→홈 반영 | △ | ○ |

### 28장 · A28 (정책 잠금 · 콘솔 1차)

| 항목 | 문서/UI | 1차 |
|------|---------|:---:|
| RED LINE · 허용/금지 조치 | [28장](28-admin-console-red-line.md) · `admin-red-line-copy.js` | ✅ |
| P17-admin 프리뷰 | `#/support/admin/*` | ✅ |
| A28-04 신고 큐 | `#/admin/reports` · `/api/admin/reports.php` | △ API ✅ |
| A28-06 제출 큐 | `#/admin/submission-docs` · `submission-queue.php` | △ API ✅ |
| **A28-07 노출 보정** | `#/admin/exposure` · `/api/admin/exposure.php` | **△ API ✅** |
| A28-08 운영 로그 | `#/admin/logs` · `operation-logs.php` | △ API ✅ |
| A28-05 공지 | `#/admin/notices` | △ 스텁 |
| 운영자 인증 | `AdminApi.requireAdmin` · `#/admin/*` 가드 | ✅ 1차 |

→ [부록 D](#부록-d-a28-red-line-22장-충돌-방지) · [부록 F A28-07 QA](#부록-f-a28-07-qa-조합표-2026-07-07-잠금)

### 29장 (정책 잠금 · copy 통합 ✅)

| 항목 | 문서/UI | 1차 |
|------|---------|:---:|
| Empty·Error·권한 copy 기준 | [29장](29-empty-error-permission-ux.md) · `empty-state-copy.js` | ✅ |
| 화면별 copy 이전 | mypage/messages/handoff → `empty-state-copy.js` | ✅ |

→ [부록 B](#부록-b-공통-ux-상태--empty--error-29장)

---

## 14. 동기화 메타 (운영)

| 항목 | 현재 기준 | 운영 규칙 |
|------|-----------|-----------|
| 마지막 동기화 | **2026-07-17** | 부록 C `policy-log`=`#/policy/changelog` · [23 경계 진단](../internal/23-board-menu-boundary-audit.md) · Notion §22 |
| 기준 소스 | 문서 우선 → 프리뷰 교차 확인 → 코드 용어 대조 | 코드가 앞서면 「초안 + 프리뷰 ✅」 |
| dead route | `#/mypage/verification` → `#/mypage/submission-docs` 리다이렉트만 | 진입 불가 route는 별도 표기 |
| 리네임 후보 | `studyrooms` → `study-rooms` ✅ · P25-07 → P25-04 흡수 · P17-06 → P26 ✅ | route/ID 어긋남 시 본 장에 먼저 표기 |

**다음 동기화 체크:** `npm run sync:inventory` · Notion §15 (자동 패치: `docs/ssot/generated/notion-section-15.md`)

---

## 16. 화면 인벤토리 본표 (최소 확정본 · 2026-07-07)

> **§4~11** 상세 행과 병행. **정본:** [`screen-inventory.json`](screen-inventory.json) → `npm run sync:inventory` · Notion [§15](https://app.notion.com/p/f7f93339f165443c85fcee5577ef4d15) 자동 패치

<!-- screen-inventory:start -->
| ID | 이름 | 유형 | route | UI | 문서 | 진입 | 1차 | 비고 |
|----|------|------|-------|:--:|:--:|------|:---:|------|
| P09-01 | 비회원 메인 | page | `#/guest` | ✅ | UX 1차 | 공개 | ○ | 대치동 데모 |
| P09-02 | 학부모 메인 | page | `#/parent` | ✅ | UX 1차 | 공개 | ○ | 2탭 · provider-home |
| P09-03 | 공부방 메인 | page | `#/study-room` | ✅ | UX 1차 | study_room | ○ | 내 노출 + 학생찾기 |
| P09-04 | 과외쌤 메인 | page | `#/tutor` | ✅ | UX 1차 | tutor | ○ | 3지역 내 노출 |
| P15-01 | 마이페이지 홈 | page | `#/mypage/home` | ✅ | UX 1차 | 로그인 | ○ | 역할별 stat |
| P15-06 | 찜 | page | `#/mypage/wishlist` | ✅ | UX 1차 | 로그인 | ○ | 25 handoff |
| P15-07 | 최근열람 | page | `#/mypage/recent` | ✅ | UX 1차 | 로그인 | ○ | resume token |
| P15-08 | 쪽지 요약 | page | `#/mypage/messages` | ✅ | UX 1차 | 로그인 | ○ | → P16 |
| P15-09 | 유료 요약 | page | `#/mypage/plans` | ✅ | UX 1차 | 공급자 | ○ | P18 허브 · tier·ROI 미리보기 |
| P18-01 | 유료 서비스 안내 | page | `#/mypage/paid` | ✅ | 18§19 | 공급자 | ○ | 카탈로그 · 횟수권 배지 · dev PG (18d) |
| P18-02 | ROI·반응 요약 | page | `#/mypage/paid/usage` | ✅ | 18§6 | 공급자 | ○ | status API · 쪽지권·열람권 (18b~c) |
| **P15-10** | 제출자료 상태 | page | `#/mypage/submission-docs` | ✅ | UX 1차 | 공급자 | ○ | 21·22·24 허브 |
| P15-11 | 계정/설정 | page | `#/mypage/account` | ✅ | UX 1차 | 로그인 | ○ | §5 |
| P16-01~04 | 쪽지함 | page/overlay | `#/mypage/messages/*` | ✅ | UX 1차 | 로그인 | ○ | API 014·015 · 쪽지권 게이트 |
| P17-01~03 | 고객센터 홈·안전 | page | `#/support · …/guide · …/safe` | ✅ | UX 1차 | 공개 | ○ | §7 |
| P17-04 | FAQ | page | `#/support/faq` | ✅ | UX 1차 | 공개 | ○ | 독립 page |
| P17-05 | 공지 | page | `#/support/notice` | ✅ | UX 1차 | 공개 | ○ | 독립 page |
| P17-07 | 운영문의·내역 | page | `#/support/contact · …/tickets` | ✅ | UX 1차 | 공개 | ○ | 독립 page |
| P19-01 | 학생 목록 | page | `#/mypage/registrations/students` | ✅ | UX 1차 | guardian | ○ | §8 |
| P19-02 | 학생 허브 | page | …/students/{id} | ✅ | UX 1차 | guardian | ○ |  |
| P19-03a/b | 기본·상세등록 | page | …/{id}/basic · …/detail | ✅ | UX 1차 | guardian | ○ |  |
| P19-04 | 학생 미리보기·공개 | page | …/{id}/publish | ✅ | UX 1차 | guardian | ○ |  |
| P19-05 | 학생 공개설정 | page | …/{id}/settings | ✅ | UX 1차 | guardian | ○ |  |
| P20-01 | 공부방 목록 | page | `#/mypage/registrations/study-rooms` | ✅ | UX 1차 | owner | ○ | 5175 브리지 |
| P20-02 | 공부방 허브 | page | …/study-rooms/{id} | ✅ | UX 1차 | owner | ○ |  |
| P20-03a/b | 기본·상세정보 | page | …/{id}/basic · …/detail | ✅ | UX 1차 | owner | ○ | 5175 |
| **P20-04** | 미리보기·공개 | page | …/{id}/publish | ✅ | UX 1차 | owner | ○ | 공개 직전 확인 |
| P20-05 | 노출·상담 | page | …/{id}/exposure | ✅ | UX 1차 | owner | ○ | inquiry_status |
| P21-01 | 과외 목록 | page | `#/mypage/registrations/tutors` | ✅ | UX 1차 | tutor | ○ | 5177 브리지 |
| P21-02 | 과외 허브 | page | …/tutors/{id} | ✅ | UX 1차 | tutor | ○ |  |
| P21-03a/b | 기본·상세정보 | page | …/{id}/basic · …/detail | ✅ | UX 1차 | tutor | ○ | 5177 |
| **P21-04** | 미리보기·공개 | page | …/{id}/publish | ✅ | UX 1차 | tutor | ○ | 4모드 |
| P21-05 | 학생 접근·쪽지 | page | …/{id}/access | ✅ | UX 1차 | tutor | ○ |  |
| **P21-06** | 노출·부oost | page | …/{id}/exposure | ✅ | UX 1차 | tutor | ○ | Prime |
| P24-01 | 상세 Shell | modal | client state | ✅ | UX 1차 | viewer별 | ○ | hash URL ✕ |
| **P24-02** | 공부방 상세 | block | (P24-01 내) | ✅ | UX 1차 | viewer별 | ○ | 필수 variant |
| **P24-03** | 과외 상세 | block | (P24-01 내) | ✅ | UX 1차 | viewer별 | ○ | 필수 variant |
| P24-04 | 학습 요청 카드 | block | (P24-01 내) | ✅ | UX 1차 | viewer별 | ○ | paid_only 열람권 unlock (18c) |
| P25-00/04 | Compare Bar/Modal | block/modal | global | ✅ | handoff 2차 | 로그인 | ○ | API 013 |
| P25-S10 | 학생 검토함 | page | `#/mypage/student-review` | ✅ | 2차 ✅ | tutor/owner | ○ | P20·P21 브리지 |
| P26-01~07 | 정책·약관 | page | `#/policy/{slug}` | ✅ | UX 1차 | 공개 | ○ | P17-06→P26 |
| P23-01~03 | 자료실 | page | `#/library/*` | ✅ | 23장 | 공개 | ○ | boardKey |
| P23-04 | 제출함 허브 | page | `#/mypage/submission-board` | ✅ | 23장 | 공급자 | ○ | P15-10 브리지 |
| P23-04a/b | 제출 작성·상세 | page | …/new · …/:id | ✅ | 23장 | upload | ○ |  |
| P17-admin | 운영 프리뷰 | admin | `#/support/admin/*` | ✅ | 17c | 내부 | △ |  |
| A28-01 | 운영 홈 | admin | `#/admin` | △ | 28§12 | 내부 | — | RED LINE |
| A28-04 | 신고 처리 | admin | `#/admin/reports` | △ | 28§5 | 내부 | ✅ | 큐 API |
| A28-06 | 제출자료 확인 | admin | `#/admin/submission-docs` | △ | 28§3 | 내부 | ✅ | submitted 큐 |
| **A28-07** | 노출·권한 보정 | admin | `#/admin/exposure` | △ | 28§3-b | 내부 | ✅ | 부록 F QA |
| A28-08 | 운영 로그 | admin | `#/admin/logs` | △ | 28§9 | 내부 | ✅ |  |
<!-- screen-inventory:end -->

---

## 15. 진입 규칙 요약 (핵심 화면)

| ID | 진입 | 비고 |
|----|------|------|
| P09-01~04 | 공개(비회원·역할별 데모) | 역할 전환은 툴바 `[임시]` |
| P15-01~07 | 로그인 | guardian·공급자 역할별 메뉴 필터 |
| P15-08 | 쪽지 요약 | 로그인 · → P16-01 |
| P15-09 | 유료 요약 | 공급자 · **P18 허브** · §5-b |
| **P15-10** | **제출자료 상태** | 공급자 · 21·22·24 · P23-04 |
| P15-11 | 계정/설정 | 로그인 |
| P18-01~02 | 유료 안내·ROI | 공급자 | `#/mypage/paid` · `…/usage` |
| P16-01~04 | 로그인 | P16-04 유료 게이트 → P15-09 |
| P17-01~07 | 공개 | P17-07 문의는 guest=로그인 유도 |
| P19-xx | guardian | auth-ui `return_import` 브리지 |
| P20-xx | study_room owner | study-room-ui 5175 브리지 |
| P21-xx | tutor | tutor-ui 5177 브리지 |
| P21-04 | tutor | 미리보기·공개 |
| P21-06 | tutor | 노출·부oost |
| P24-02/03 | viewer별 | modal variant · hash ✕ |
| P25-00/04 | 로그인 · 공부방/과외만 | 학생 비교 ✕ |
| P25-S10 | tutor · study_room | **2차 ✅** · parent ✕ |
| P26-01~07 | 공개 | footer·고객센터·회원가입 링크 |
| P23-01~03 | 공개/로그인 | GNB 제외 · 유틸·푸터 링크 |
| P23-04 | 공급자 · demand | P15-10 브리지 · `submission` boardKey |
| P17-admin | 운영 프리뷰 | 심사 UX ✕ · 공지·티켓만 |
| A28-01~08 | 내부 전용 | RED LINE · `#/admin/*` · A28-07 API ✅ |

## 13. 유지·갱신 규칙

1. **새 hash 추가** → 해당 장 router + **본 장 §4~11 행** + 패키지 DOC-CHECKLIST  
2. **프리뷰 ✅ / 문서 초안** → 잠금 등급을 §1 표에 맞게 승격  
3. **블록 ID** 추가 시 `type=block` · hash ✕ 명시  
4. **18장** 확정 전 — P15-09 · P16-04 paid copy는 placeholder 유지  

**검증 진입:** [home-ui/DOC-CHECKLIST.md](../../preview/home-ui/DOC-CHECKLIST.md)

---

## 부록 A. P17-admin → A28 승격 경로 (2026-07-06 잠금)

| 단계 | 현재 (17c 프리뷰) | 향후 (28장) | 비고 |
|------|-------------------|-------------|------|
| **현재** | `#/support/admin` · notices · tickets | P17-admin | 공지·문의 **프리뷰만** |
| **1** | — | **A28-04** 신고 처리 | 문의 티켓과 **큐 분리** |
| **2** | `#/support/admin/notices` | **A28-05** 공지·가이드 | 23장 board 연동 후 |
| **3** | `#/support/admin/tickets` | 문의 전용 큐 유지 또는 A28 하위 | 답변/안내 중심 |
| **4** | — | A28-02/03/06/07/08 | 회원·프로필·제출자료·로그 |

**이관 기준 (기능별)**

| 기능 | 현재 | 향후 | 이관 기준 | 사용자-facing |
|------|------|------|-----------|---------------|
| 공지·가이드 미리보기 | P17-admin | A28-05 | 발행·숨김·예약 필요 시 | 공지 결과만 |
| 운영 문의 triage | P17-admin | A28-04 | 운영/회원 문의 분리 시 | 접수 여부만 |
| 신고 처리 | — | A28-04 | 신고·제재 로그 필요 시 | 접수/제한 안내만 |
| 제출자료 내부 확인 | — | A28-06 | 도용·허위 대응 시 | 검증 완료 역노출 ✕ |
| 권한·노출 수동 보정 | — | **A28-07** `#/admin/exposure` | 운영 보정 필요 시 | 승인/반려 언어 ✕ · **API 1차 ✅** |

**원칙:** P17-admin **삭제 ✕** — A28 추가 시 migration 표만 갱신. **정본:** [28장 §5](28-admin-console-red-line.md#5-p17-admin--a28-이관-순서)

---

## 부록 B. 공통 UX 상태 · Empty / Error (29장) — P-ID 적용 지도

**정본:** [29장 — 공통 Empty·Error·권한 부족 UX](29-empty-error-permission-ux.md) (2026-07-06 정책 잠금) · 코드 `empty-state-copy.js` · `STATE_SCREEN_BINDINGS`

| P-ID | Empty | Error | 권한 부족 | 0건 | Max | 비고 |
|------|-------|-------|-----------|-----|-----|------|
| P15-06 | 찜 없음 | 목록 로드 실패 | 로그인 | — | — | 찜→비교 CTA |
| P15-07 | 최근열람 없음 | 로드 실패 | 로그인 | — | — | `view_detail` 연동 ✅ |
| P16-01 | 쪽지 0건 | 로드 실패 | 로그인 | — | — | 탭별 빈 상태 |
| P19-01 | 자녀 없음 / 탭 0건 | 목록 로드 실패 | guardian | — | — | `renderStateCard` ✅ |
| P20-02 | — | 상태판 로드 실패 | owner | — | — | lifecycle ≠ Empty |
| P21-05 | — | 접근권 로드 실패 | 역할·유료·보호 | — | 메모권 소진 | Unlock 원칙 |
| P24-03 | — | 상세 로드 실패 | 로그인·유료 | — | — | CTA 위 해제 조건 |
| P24-04 | — | 요청 로드 실패 | 보호·paid_only | — | — | blur + unlock |
| P25-04 | 비교 후보 없음 | 로드 실패 | 로그인 | — | 최대 3개 | mixed_kind 분리 |
| P25-S10 | 검토함 비어 있음 | 로드 실패 | tutor/owner | — | — | 학생 비교 ✕ |
| P13-zero | — | — | — | 검색/지역 0건 | — | `getSearchZeroResultCopy` |

**레거시 copy (29장 이전 예정 · 후순위):** `handoff-copy.js` · `messages-copy.js` · `mypage-copy.js`

**원칙:** Empty ≠ 0건 ≠ Max · 권한 5종 분리 · Error 4종 · [22장](22-platform-lifecycle-principles.md) 금지어 준수

---

## 부록 C. boardKey · route 매핑 (23장 · 게시판 엔진)

> 23장 상위 개념 = **게시판 엔진**. `library` 계열 = 다운로드형 하위 채널 · 사용자-facing 명칭 후보 「자료실」.

| boardKey | 사용자 UX | route | 소유 장 | 보드 성격 | 비고 |
|----------|-----------|-------|---------|-----------|------|
| `notice` | P17-05 · P17-admin | `#/support/notice` | 17 · 23 | 운영형 | notice-store · DDL `017` |
| `faq` | P17-04 | `#/support/faq` | 17 · 23 | 운영형 | 정적 FAQ |
| `safe-guide` | P17-02/03 | `#/support/safe/{slug}` | 17 · 23 | 운영형 | support-copy G1~G7 |
| `policy-log` | P26 변경 이력 | `#/policy/changelog` (후순위) | 26 · 23 | 운영형 | 정적 `#/policy/{terms…}` 와 **분리** · `#/policy/*` 와일드카드 금지 |
| `library` | 자료실 (다운로드) | `#/library` | 23 | 다운로드형 | ✅ 프리뷰 · 로그인 read/download |
| `library-template` | 양식/체크리스트 | `#/library/templates` | 23 | 다운로드형 | 자료실 하위 |
| `library-guide-pdf` | 가이드 PDF | `#/library/guides` | 23 | 다운로드형 | 공개 read · 로그인 download |
| `submission` | 제출·업로드 | `#/mypage/submission-board` | 23 | 권한형 업로드 | **△ 프리뷰** · P23-04 · P15-10 연동 |
| `showcase` | 사례 공유 | 2차 후보 | 23 | 큐레이션형 | 공급자 write · 운영 검토 |

---

## 부록 D. A28 RED LINE (22·28장)

**정본:** [28장 — 관리자 최소 운영 콘솔 · RED LINE](28-admin-console-red-line.md) (2026-07-06 **2차** 정책 잠금) · `admin-red-line-copy.js`

**대원칙:** 운영자 심사/승인/반려 없음 · 인증기관 아님 · 연결 플랫폼

**사용자-facing 금지:** 승인 · 반려 · 검증 완료 · 인증됨 · 인증쌤 · 플랫폼 심사 통과 · 운영자 확인 완료 · 공식 인증 · 신뢰도 점수

**제출자료:** 등록·공개 사실만 · `SUBMISSION_DOC_USER_NOTICE` · 발급기관 재확인 안내

**대체:** 공개중 · 제출자료 공개 · 저장중 — [22장](22-platform-lifecycle-principles.md)

**A28-07:** [28장 §3-b](28-admin-console-red-line.md#3-b-노출권한-수동-보정-a28-07--정책액션로그-잠금-2026-07-07) · QA [부록 F](#부록-f-a28-07-qa-조합표-2026-07-07-잠금)

---

## 부록 E. Provider 학생 검토함 (P25-S10)

> **정본:** [25장 §8](25-decision-handoff-layer.md#8-provider-lane--학생-검토함-p25-s10) · **구현:** 1.5~2차 · 1차는 정책·RED LINE만.

| 항목 | 수렴 (2026-07-06) |
|------|-------------------|
| 목록명 | **학생 검토함** |
| CTA | **검토함에 담기** / **검토함에서 빼기** |
| 과외 항목 | **관심학생** |
| 공부방 항목 | **상담후보** |
| 흐름 | 보관 → 메모/쪽지/보류 (**비교 ✕**) |
| vs P15-06 찜 | **별개** (학부모·공부방/과외) |
| vs P15-07 | 최근=자동 · 검토함=의도적 (1.5~2차) |

---

## 부록 F. A28-07 QA 조합표 (2026-07-07 잠금)

**정본:** [28장 §3-b](28-admin-console-red-line.md#3-b-노출권한-수동-보정-a28-07--정책액션로그-잠금-2026-07-07) · `A28_07_ACTION_LOG_MAP` · `e2e/submission-attachment-flow.spec.js` (A28-06·인증)  
**전제:** Docker MySQL+API · home-ui `:5174` · `ops@dev.local` / `password`

### F-1. 접근·인증

| # | 세션 | 요청 | 기대 HTTP | 기대 본문/화면 |
|---|------|------|-----------|----------------|
| Q1 | 없음 | `GET /api/admin/exposure.php` | **401** | `unauthorized` |
| Q2 | tutor | `GET /api/admin/exposure.php` | **403** | `forbidden` |
| Q3 | admin | `GET /api/admin/exposure.php` | **200** | `ok:true` · `items[]` |
| Q4 | 없음 | `#/admin/exposure` | — | **운영자 전용** 게이트 |
| Q5 | admin | `#/admin/exposure` | — | 목록·필터·조치 버튼 표시 |

### F-2. 공부방 (`study_room`)

| # | 초기 `profile_status` | `action` | 추가 필드 | 기대 상태 | `action_kind` | `user_notified` |
|---|----------------------|----------|-----------|-----------|---------------|:---------------:|
| Q6 | `published` | `hide` | `internal_memo` | `hidden` | `hide_profile` | true |
| Q7 | `hidden` | `publish` | — | `published` | `exposure_correction` | false |
| Q8 | `published` | `inquiry_status` | `inquiry_status=paused` | `inquiry_status=paused` | `exposure_correction` | false |
| Q9 | `published` | `inquiry_status` | 값 누락/불법 | **422** | — | — |

### F-3. 과외쌤 (`tutor`)

| # | 초기 | `action` | 기대 `profile_status` | `action_kind` | `user_notified` |
|---|------|----------|----------------------|---------------|:---------------:|
| Q10 | `published` | `hide` | `hidden` | `hide_profile` | true |
| Q11 | `hidden` | `publish` | `published` | `exposure_correction` | false |
| Q12 | `published` | `inquiry_status` | **422** (미지원) | — | — |

### F-4. 제출 (`submission`)

| # | 초기 `status` | `action` | 기대 `status` | `action_kind` | `target_id` 로그 | `user_notified` |
|---|---------------|----------|---------------|---------------|------------------|:---------------:|
| Q13 | `published` | `hide` | `hidden` | `submission_hide` | `submission:{post_key}` | true |
| Q14 | `hidden` | `publish` | `published` | `submission_expose` | `submission:{post_key}` | false |
| Q15 | `submitted` | `publish` | **422** (A28-06 큐 사용) | — | — | — |

### F-5. A28-06 경계 · 목록 필터

| # | 시나리오 | 경로 | 기대 |
|---|----------|------|------|
| Q16 | `submitted` 제출 | A28-06 `expose` | 큐에서 제거 · `submission_expose` 로그 |
| Q17 | 동일 post | A28-07 `hide` | `submission_hide` 로그 · A28-07 목록에 표시 |
| Q18 | `GET ?target_type=study_room&status=published` | API | 공부방만 · `published`만 |
| Q19 | `GET ?status=hidden` | API | 유형별 hidden 필터 동작 |

### F-6. 로그·RED LINE (공통)

| # | 검증 | 기대 |
|---|------|------|
| Q20 | PATCH 후 `#/admin/logs` | 새 행 · `operator=ops@dev.local` |
| Q21 | UI·API 응답 문구 | **승인·반려·검증 완료·인증** 미포함 |
| Q22 | `internal_memo` 전달 | `detail_memo` 기록 · submission은 `internal_memo` 컬럼 갱신 |
| Q23 | `operator_id` 클라이언트 위조 | 무시 · 세션 email 사용 |

### F-7. 자동화 현황

| 범위 | 스크립트 | 비고 |
|------|----------|------|
| A28-06 제출→첨부→큐→로그 | `npm run e2e` | `e2e/submission-attachment-flow.spec.js` |
| A28-07 노출 PATCH | Q1~Q20 | `npm run e2e:a28-07` · `e2e/a28-07-exposure-patch.spec.js` |

---

## 부록 G. 화면 인벤토리 갭 감사 · 작업 체크리스트

**별도 문서:** [30-appendix-g-screen-gap-audit.md](30-appendix-g-screen-gap-audit.md)

| 구분 | 내용 |
|------|------|
| 실누락 | P18 계열 · §5-b 신설 |
| 준실누락 | P15-10 §16 개별 row |
| 세분화 | P19~P21 · P24-02/03 §8·§16 |
| ownership | P17 page vs P26 slug · P27→상태 카드 |

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-07-06 | **30장 초안** — §0 ID 3층 · §1 잠금 등급 · home-ui harvest · 부록 A~D · 24/17 선행 보정 |
| 2026-07-06 | **부록 E** — P25-S10 → [25§8](25-decision-handoff-layer.md#8-provider-lane--학생-검토함-p25-s10) |
| 2026-07-06 | **§10** — [25장](25-decision-handoff-layer.md) UX 1차 잠금 · handoff-copy |
| 2026-07-06 | **§10 API** — P25 handoff DDL ✅ · HTTP `/api/handoff/*.php` ✅ |
| 2026-07-07 | **§12 26장** — P26-01~07 ✅ · P17-06→policy 이관 · `policy-router.js` |
| 2026-07-07 | **§14~15** — 동기화 메타 · 진입 규칙 요약표 |
| 2026-07-07 | **23장 게시판 엔진 개념 확장** · `board-engine-copy.js` · 권한 모델 |
| 2026-07-17 | **부록 C** `policy-log` route `#/policy/changelog` 로 고정 (정적 `#/policy/{terms…}` 와 분리) · 메뉴 경계 진단 `docs/internal/23-board-menu-boundary-audit.md` |
| 2026-07-17 | **A28-05 운영 최소판** — 채널 관리(`board-channel-store.js`) · 우측 슬롯 관리(`right-rail-store.js`) · slot seed 6종 |
| 2026-07-17 | **3탄** — notice/faq/safe-guide `board_posts` 통합 · `board_channel_definitions`/`right_rail_slot_definitions` · detail/search rail 연결 |
| 2026-07-07 | **P19-01** — `EMPTY_COPY.students` · `renderStateCard` 1차 적용 |
| 2026-07-07 | **29장 copy 통합** — empty-state-copy 정본 · 레거시 re-export 정리 |
| 2026-07-07 | **§16 본표** — Notion §15 수동 정리본 |
| 2026-07-07 | **P25-S10 2차** — P20-02/05 검토함 브리지 · `from=exposure` handoff |
| 2026-07-07 | **부록 F** — A28-07 QA 조합표 · §11 A28-07 행 분리 · 28§3-b 연동 |
| 2026-07-07 | **부록 G** — 화면 갭 감사 · §5-b P18 · §8·§16 row 확장 · route ownership 잠금안 |
| 2026-07-07 | **P18 hash** — `#/mypage/paid` · `#/mypage/paid/usage` · P15-09 허브 분리 |

---

*다음: P18 독립 hash 분리 검토 · §16 ↔ Notion 동기화 · A28 콘솔 본체.*
