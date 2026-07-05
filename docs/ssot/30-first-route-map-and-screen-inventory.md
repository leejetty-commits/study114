# 30장 — 1차 라우트맵·화면 ID 인벤토리

**상태: 초안 (인벤토리 1차 harvest · 2026-07-06)**  
**역할:** 장별 SSOT·프리뷰·코드 간 **단일 지도** — P/A ID · hash · 파일 · 구현상태 · 의존 장  
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
| **프리뷰 URL** | 대표 링크 |

---

## 4. 인벤토리 — home-ui · 9장 메인

| ID | type | 이름 | hash | 코드 | SSOT | UI | API | 1차 | 프리뷰 |
|----|------|------|------|------|------|:--:|:---:|:---:|--------|
| P09-01 | screen | 비회원 메인 | `#/guest` | `screens/guest.js` | 9§3·4 | ✅ | — | ○ | http://127.0.0.1:5174/#/guest |
| P09-02 | screen | 학부모 메인 | `#/parent` | `screens/parent.js` | 9§5-1 | ✅ | — | ○ | …/#/parent |
| P09-03 | screen | 공부방 메인 | `#/study-room` | `screens/study-room.js` | 9§5-2 | ✅ | — | ○ | …/#/study-room |
| P09-04 | screen | 과외쌤 메인 | `#/tutor` | `screens/tutor.js` | 9§5-3 | ✅ | — | ○ | …/#/tutor |

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

### 19장 학생

| ID | hash 패턴 | 코드 | SSOT | UI | API | 1차 |
|----|-----------|------|------|:--:|:---:|:---:|
| P19-01 | `#/mypage/registrations/students` | `student-reg/` | 19 | ✅ | △ | ○ |
| P19-02 | `…/students/{id}` | hub | 19§4 | ✅ | △ | ○ |
| P19-03a/b | `…/{id}/basic` · `/detail` | 브리지 | 19§5 | ✅ | △ | ○ |
| P19-04 | `…/{id}/publish` | publish | 19§6 | ✅ | △ | ○ |
| P19-05 | `…/{id}/settings` | settings | 19§7 | ✅ | △ | ○ |
| P19-06 | (P19-05 흡수) | — | 19 | ✅ | — | ○ |

**P19 → P24-04:** 공개설정 변경 → 학습 요청 카드 반영 규칙 — [24§9](24-detail-decision-layer.md#9-p24-04-학습-요청-카드)

### 20장 공부방

| ID | hash 패턴 | 코드 | SSOT | UI | API·DDL | 1차 |
|----|-----------|------|------|:--:|:-------:|:---:|
| P20-01 | `#/mypage/registrations/study-rooms` | `study-room-reg/` | 20 | ✅ | △ | ○ |
| P20-02 | `…/study-rooms/{id}` | 상태판 | 20§6 | ✅ | △ | ○ |
| P20-03a/b | `…/{id}/basic` · `/detail` | 브리지→5175 | 20§5 | ✅ | △ | ○ |
| P20-04 | `…/{id}/publish` | publish | 20§5 | ✅ | △ | ○ |
| P20-05 | `…/{id}/exposure` | exposure · inquiry_status | 20§7 | ✅ | **△ DDL** | ○ |
| P20-06 | (P20-05 흡수) | — | 20 | ✅ | — | ○ |

### 21장 과외

| ID | hash 패턴 | 코드 | SSOT | UI | API | 1차 |
|----|-----------|------|------|:--:|:---:|:---:|
| P21-01 | `#/mypage/registrations/tutors` | `tutor-reg/` | 21 | ✅ | △ | ○ |
| P21-02 | `…/tutors/{id}` | 상태판 | 21§6 | ✅ | △ | ○ |
| P21-03a/b | `…/{id}/basic` · `/detail` | 브리지→5177 | 21§5 | ✅ | △ | ○ |
| P21-04 | `…/{id}/publish` | 4모드 미리보기 | 21§5 | ✅ | △ | ○ |
| P21-05 | `…/{id}/access` | 학생 접근·쪽지 | 21§7 | ✅ | △ | ○ |
| P21-06 | `…/{id}/exposure` | 노출·부oost | 21§8 | ✅ | △ | ○ |
| P21-07 | (P21-06 흡수) | — | 21 | ✅ | — | ○ |

**라우터:** `student-reg/router.js` · `study-room-reg/router.js` · `tutor-reg/router.js`  
**copy:** `student-reg/student-reg-copy.js` · `study-room-reg/study-room-reg-copy.js` · `tutor-reg/tutor-reg-copy.js`  
**문서 상태:** 19·20·21 = **UX·실행 1차 잠금**

---

## 9. 인벤토리 — 24장 상세 판단 (Modal First)

| ID | type | 이름 | 코드 | SSOT | UI | 1차 |
|----|------|------|------|------|:--:|:---:|
| P24-01 | screen | Detail Shell (모달) | `detail-decision/detail-shell.js` | 24§5 · 부록 A | ✅ | ○ |
| P24-02 | block | 공부방 상세 variant | `studyroom-detail.js` | 24§7 | ✅ | ○ |
| P24-03 | block | 과외 상세 variant | `tutor-detail.js` | 24§8 | ✅ | ○ |
| P24-04 | block | 학습 요청 카드 | `student-request-card.js` | 24§9 | ✅ | ○ |
| P24-B05 | block | Contact Panel | `detail-utils.js` `buildContactPanel` | 24§5-5 · 21§7 | ✅ | ○ |
| P24-B06 | block | Trust Strip | `detail-utils.js` · `lifecycle-copy.js` | 24§11 · 22§7 | ✅ | ○ |
| P24-B07 | block | Sticky CTA | `detail-shell.js` | 24§5-6 | ✅ | ○ |
| P24-08 | block | Compare-aware | toast · sticky N/3 · compare-modal | 24§13 | ✅ | ✅ |

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
| P25-S10 | screen | 학생 검토함 | `#/mypage/student-review` · `student-review-store.js` | 25§8 | ✅ | ✅ | ○ |

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
| P13-01 | `/` · `?role=` | 13 | ✅ | ○ |
| P24-smoke | 카드→Shell · compare 2차 | 24§20-1 · search-handoff | ✅ | ○ |

### study-room-ui (5175) · tutor-ui (5177)

| 패키지 | hash 패턴 | SSOT | UI | 브리지 |
|--------|-----------|------|:--:|--------|
| study-room-ui | `#/register/*` | 5 | ✅ | P20-03 → 5175 |
| tutor-ui | `#/register/*` | 8 | ✅ | P21-03 → 5177 |

---

## 12. 26장 (예정) · 27a · 28

### 26장 예정 행

| ID | 이름 | 현재 | 1차 |
|----|------|------|:---:|
| P26-01~07 | 약관·고지 정적 페이지 | P17-06 placeholder | 후순위 |
| — | `policy-copy.js` | 미창 | 후순위 |

### 27a (30장 § 또는 27장 메모)

| 항목 | UI | 1차 |
|------|:--:|:---:|
| 쪽지 미읽음 뱃지 | △ | ○ |
| P15 역할별 stat | ✅ | ○ |
| P20/P21 상태→홈 반영 | △ | ○ |

### 28장 · A28 (후순위 본문 · RED LINE 선행)

→ [부록 D](#부록-d-a28-red-line-22장-충돌-방지)

---

## 13. 유지·갱신 규칙

1. **새 hash 추가** → 해당 장 router + **본 장 §4~11 행** + 패키지 DOC-CHECKLIST  
2. **프리뷰 ✅ / 문서 초안** → 잠금 등급을 §1 표에 맞게 승격  
3. **블록 ID** 추가 시 `type=block` · hash ✕ 명시  
4. **18장** 확정 전 — P15-09 · P16-04 paid copy는 placeholder 유지  

**검증 진입:** [home-ui/DOC-CHECKLIST.md](../../preview/home-ui/DOC-CHECKLIST.md)

---

## 부록 A. P17-admin → A28 승격 경로 (예정)

| 현재 (17c 프리뷰) | 향후 (28장) | 비고 |
|-------------------|-------------|------|
| `#/support/admin/notices` | A28-05 공지·가이드 | 23장 board 연동 후 |
| `#/support/admin/tickets` | A28-04 문의·티켓 | 이메일·SLA 후속 |
| `#/support/admin` hub | A28-01 대시보드 | 인증 필수 |
| — | A28-03 등록 조회 | 신고·숨김·노출 보정 |

**원칙:** P17-admin **삭제 ✕** — A28 추가 시 migration 표만 갱신.

---

## 부록 B. 공통 UX 상태 · Empty / Error (29장 흡수)

| 상황 | copy 방향 | SSOT |
|------|-----------|------|
| 검색 0건 | 조건에 맞는 결과가 없습니다 | 13장 |
| 비로그인 제한 | 로그인 후 자세한 정보를 볼 수 있습니다 | 13§10 |
| 학생 권한 제한 | 학생 정보는 보호를 위해 제한적으로만 공개됩니다 | 13§8 |
| 찜/비교 빈함 | `handoff-copy.js` | [25§9](25-decision-handoff-layer.md#9-p25-08-empty--max-30장-부록-b) |
| 쪽지 빈함 | `messages-copy.js` | 16§4 |
| 마이페이지 빈함 | `mypage-copy.js` | 15§11 |

**후속:** `empty-state-copy.js` 횡단 SSOT 검토.

---

## 부록 C. boardKey · route 매핑 (23장 연동)

| boardKey | 사용자 UX | 엔진 SSOT | 프리뷰 |
|----------|-----------|-----------|--------|
| `notice` | P17-05 · P17-admin | [23장 internal](../internal/23-board-community-integration-draft.md) | notice-store |
| `faq` | P17-04 | 23 · 17 | 정적 |
| `safe-guide` | P17-02/03 | 17 · 23 | support-copy |
| `policy-log` | P26 (예정) | 23 · 26 | 후순위 |

---

## 부록 D. A28 RED LINE (22장 충돌 방지)

**내부 운영(A28)에서 확인하더라도 사용자-facing UI·copy에 아래 표현 금지:**

- 승인 · 반려 · 검증 완료 · 인증쌤 · 플랫폼 심사 통과 · pending 심사 · 검수 대기

**허용 방향:** 저장중 · 공개중 · 숨김 · 제출자료 공개함 · 자기확인 · 당사자 합의 — [22장](22-platform-lifecycle-principles.md)

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

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-07-06 | **30장 초안** — §0 ID 3층 · §1 잠금 등급 · home-ui harvest · 부록 A~D · 24/17 선행 보정 |
| 2026-07-06 | **부록 E** — P25-S10 → [25§8](25-decision-handoff-layer.md#8-provider-lane--학생-검토함-p25-s10) |
| 2026-07-06 | **§10** — [25장](25-decision-handoff-layer.md) UX 1차 잠금 · handoff-copy |
| 2026-07-06 | **§10 API** — P25 handoff DDL ✅ · HTTP `/api/handoff/*.php` ✅ |

---

*다음: 26장 policy-copy · P25-S10 1.5차 · 본 장 §4~11 행 수시 갱신.*
