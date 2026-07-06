# 부록 G. 화면 인벤토리 갭 감사 · 작업 체크리스트 (2026-07-07)

**정본:** [30장 §4~16](30-first-route-map-and-screen-inventory.md) · 장별 SSOT  
**목적:** 「화면 실누락」 vs 「row 세분화 부족」 vs 「route ownership 미확정」 분리 · **우선순위 작업 추적**

---

## 0. 검토 결론 (요약)

| 구분 | 판단 | 대표 ID |
|------|------|---------|
| **실누락** (30장에 독립 행·정책 연결 필요) | **P18 계열** — ~~인벤토리 공백~~ **2026-07-07 hash 분리** | P18-01 `#/mypage/paid` · P18-02 `…/usage` |
| **준실누락** (§5에는 있으나 §16 최소표에서 묶임) | 허브·횡단 화면 가시성 부족 | **P15-10** · P15-11 |
| **row 세분화 부족** (구현·라우터 ✅) | group row로만 표기 | P19-03a/b · P20-03~04 · P21-01/03/04/06 · P24-02/03 |
| **route ownership 미확정** | 독립 page vs 섹션 vs slug | P17-04/05/07 · P26-01~07 · P27 |

**코드 교차 확인 (2026-07-07):** P15-10 · P21-04 · P21-06 · P24-02/03은 **프리뷰 구현 존재**. 문제는 주로 **30장 §16 최소 확정본·P18 인벤토리 공백**.

---

## 1. 우선순위 1 — 실누락

### P18 유료서비스 본체

| ID | 이름 | 현재 구현 | 갭 | 조치 |
|----|------|-----------|-----|------|
| P18-01 | 유료 서비스 안내 | `#/mypage/paid` | `paid-screens.js` | **분리 완료** |
| P18-02 | 이용중·반응 요약 (ROI) | `#/mypage/paid/usage` | `paid-backend.js` | API·DDL 027·028 ✅ |
| P18-03 | 결제/충전 | placeholder | 미구현 | 인벤토리만 · 18c |
| P18-04 | Prime 신청 | P21-06·plans에서 링크만 | 후순위 | row 유지 |
| P18-05 | 영수증/결제 이력 | ✕ | 후순위 | row 유지 |

**관계 정리**

```
P15-09 (마이페이지 유료 요약·허브) ──진입──▶ P18-01 안내 copy
                              └──▶ P18-02 ROI·tier·카탈로그 (동일 hash 1차)
P16-04 (유료 게이트 overlay) ──CTA──▶ P15-09 / P18-01
```

### P15-10 제출자료 상태

| 항목 | 상태 |
|------|------|
| §5 상세 표 | ✅ `P15-10` · `#/mypage/submission-docs` |
| §16 최소 표 | △ `P15-08~11` 묶음 — **개별 row 필요** |
| 21·22·24 연동 | ✅ lifecycle-copy · P23-04 브리지 |
| **체크** | [x] §16 개별 row · [x] 부록 G 명시 |

---

## 2. 우선순위 2 — 운영상 필수 개별 화면

| ID | hash (예) | 코드 | §8 | §16 | 비고 |
|----|-----------|------|:--:|:---:|------|
| P21-04 | `…/tutors/{id}/publish` | `tutor-reg/screens.js` | ✅ | **보강** | 4모드 미리보기·공개 |
| P21-06 | `…/tutors/{id}/exposure` | 동일 | ✅ | **보강** | 노출·부oost·Prime |
| P24-02 | (modal) | `studyroom-detail.js` | block | **보강** | 공부방 상세 variant · **필수** |
| P24-03 | (modal) | `tutor-detail.js` | block | **보강** | 과외 상세 variant · **필수** |
| P20-04 | `…/study-rooms/{id}/publish` | `study-room-reg/` | ✅ | **보강** | 공개 직전 자기확인 |

---

## 3. 우선순위 3 — 인벤토리 세분화

### 19장

| ID | hash | router | 체크 |
|----|------|--------|:----:|
| P19-03a | `…/students/{id}/basic` | `student-reg/router.js` | [x] §8 개별 row |
| P19-03b | `…/students/{id}/detail` | 동일 | [x] |
| P19-05 | `…/students/{id}/settings` | 동일 | [x] |

### 20장

| ID | hash | 체크 |
|----|------|:----:|
| P20-03a | `…/study-rooms/{id}/basic` | [x] |
| P20-03b | `…/study-rooms/{id}/detail` | [x] |
| P20-04 | `…/study-rooms/{id}/publish` | [x] |

### 21장

| ID | hash | 체크 |
|----|------|:----:|
| P21-01 | `#/mypage/registrations/tutors` | [x] |
| P21-03a/b | `…/basic` · `…/detail` | [x] |
| P21-04 | `…/publish` | [x] |
| P21-06 | `…/exposure` | [x] |

---

## 4. route ownership (미확정 → 잠금안)

### P17 vs P26

| ID | 현재 route | ownership 잠금안 | type |
|----|------------|------------------|------|
| P17-04 FAQ | `#/support/faq` | **독립 page** · P17 | screen |
| P17-05 공지 | `#/support/notice` | **독립 page** · P17 | screen |
| P17-07 문의 | `#/support/contact` · `…/tickets` | **독립 page** · P17 | screen |
| P17-06 약관 링크 | `#/support` 칩 | **P26으로 이관** · placeholder ✕ | redirect |
| P26-01~07 | `#/policy/{slug}` | **독립 page** · 26장 | screen |

**원칙:** 고객센터(P17) = 이용·안전·문의 · 정책(P26) = 약관·신뢰·신고 정책 slug. **동일 콘텐츠 이중 URL 금지.**

### P27 알림

| 항목 | 잠금안 |
|------|--------|
| P27-01~06 | **독립 알림센터 hash 1차 ✕** |
| 반영 위치 | P15 홈 stat · P20/P21 상태판 카드 · (후순위) 27장 규칙 문서 |
| 30장 매핑 | [부록 B](30-first-route-map-and-screen-inventory.md#부록-b-공통-ux-상태--empty--error-29장) · §12 27a |

---

## 5. 실행 체크리스트 (진행 추적)

### 문서·인벤토리 (이번 작업)

- [x] 부록 G 갭 감사 문서 작성 (본 파일)
- [x] 30장 §5-b P18 인벤토리 행 추가
- [x] 30장 §8 — P19/P20/P21 개별 row 분리
- [x] 30장 §9 — P24-02/03 필수 variant 명시
- [x] 30장 §16 — 최소 확정본 개별 row 확장
- [x] 30장 부록 G 링크 · 변경 이력
- [x] `DOC-CHECKLIST` 30장 동기화 항목

### 구현·후속 (별도 스프린트)

- [x] P18-01 독립 hash `#/mypage/paid` · P18-02 `#/mypage/paid/usage`
- [x] P15-09 허브 분리 (tier + ROI 미리보기 + P18 링크)
- [x] P16-04 CTA → `#/mypage/paid`
- [x] P18-02 ROI API·DDL (18a) — `GET /api/paid/roi.php` · `027_provider_roi.sql`
- [x] P18 횟수권·노출 상태 (18b) — `GET /api/paid/status.php` · `028_provider_tickets.sql` · 쪽지 FIFO 차감
- [x] P24 paid_only 열람권 (18c) — `POST /api/paid/request-access.php` · `030_provider_request_unlocks.sql`
- [x] P18 dev PG 골격 (18d) — `POST /api/paid/checkout.php` · `031_provider_payment_orders.sql`
- [x] P27 매핑 잠금안 (§7)
- [x] §16 ↔ Notion §15 자동 동기화 — `screen-inventory.json` · `npm run sync:inventory`

---

## 7. P27 알림 — 매핑 잠금 (독립 페이지 ✕)

| P27 ID | 1차 반영 위치 | hash | 비고 |
|--------|---------------|------|------|
| P27-01 | P15-01 홈 stat | `#/mypage/home` | 읽지 않은 쪽지 등 |
| P27-02 | P20-02 상태판 | `…/study-rooms/{id}` | inquiry·노출 카드 |
| P27-03 | P21-02 상태판 | `…/tutors/{id}` | 메모권·노출 카드 |
| P27-04 | P16-01 inbox | `#/mypage/messages/inbox` | 미읽음 뱃지 △ |
| P27-05~06 | 후순위 | — | 푸시·이메일 규칙만 문서 |

**원칙:** 27장은 **상태 반영 규칙** — `#/notifications` 독립 센터는 2차 검토.

---

## 6. 빠른 참조 — 추가된 30장 행

→ [30장 §5-b P18](30-first-route-map-and-screen-inventory.md#5-b-인벤토리--18장-유료서비스)  
→ [30장 §16 확장본](30-first-route-map-and-screen-inventory.md#16-화면-인벤토리-본표-최소-확정본--2026-07-07)
