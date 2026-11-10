# 348 — 학생 메뉴 · 쪽지 전송 피드백 · 계정 집주소

**브랜치:** `work/348-mypage-nav-msg-homeaddr`  
**기준:** `origin/main` + merge `347` (`28489d8d`) — 계정 집주소는 #161 후속  
**일시:** 2026-11-11  
**작업 폴더:** `D:\work\study114\.wt\work-348-mypage-nav-msg-homeaddr`

## 지시 요점

- A·C·D 한 PR. B(후기 모달)는 별 PR.
- 공부방·과외쌤 메뉴 불변. 후기 규칙 로직·홍보 잠금·스키마 금지.

---

## A. 학생 마이페이지 메뉴

`PARENT_NAV_PATHS` 순서:
1. 내 등록 → 2. **쪽지·후기함** → 3. 최근열람 → 4. 찜·비교 → 5. 내 문의 내역 → 6. 계정설정

- `labels.parent: '쪽지'` 제거 → 기본 라벨 「쪽지·후기함」
- `screenTitle` 학생 스레드/목록도 「쪽지·후기함」
- 탭 「쪽지」「후기함」유지. 공부방·과외쌤 `MYPAGE_NAV` 순서·라벨 변경 없음.

---

## C. 쪽지 전송 피드백 (공용)

| 단계 | 동작 |
|------|------|
| 전송 | 버튼 「보내는 중…」+ disabled · `dataset.sending`으로 중복 방지 |
| 성공 | 토스트 「쪽지를 보냈어요」 · 입력/파일 비움 · rerender(말풍선「안읽음」) |
| 실패 | 토스트 「보내지 못했어요. 다시 시도해 주세요」 · 입력 유지 · 버튼 복구 |

적용: `messages/screens.js`(답장) · `messages/overlays.js`(첫 쪽지 compose). 역할 공통.

---

## D. 계정설정 집주소 (#161 후속)

| 층 | 내용 |
|----|------|
| API | `GET/POST /api/auth/profile-address.php` → `ProfileAddressService` |
| UI | 계정설정 카드 「집주소」보기·수정 · 카카오 주소검색 |
| 저장 | `user_profiles.address_zip/line1/line2` |
| 범위 | 모든 역할 공통. 사업장·홍보·핀 불변 |

기본등록 안내(347) 「마이페이지 · 계정설정에서 입력」과 기능 일치.

---

## Git / PR

- 348 전용 브랜치. B는 `work/349-review-modal-ui` 예정.
