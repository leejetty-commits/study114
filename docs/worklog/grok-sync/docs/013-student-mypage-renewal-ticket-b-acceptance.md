# 013 · 학생 마이페이지 리뉴얼 B — 수락 검토

- 작성일: 2026-09-23 (KST)
- 선행: [011](011-student-mypage-renewal-ticket-b-myprofile.md) · [012](012-student-mypage-renewal-ticket-b-fixup.md)
- 대상: Cursor B + 012 보완 (미커밋)
- 상태: **로컬 수락** (push / `build:dothome` 대기)

---

## 0. 한 줄 결론

011/012 기준으로 **마이프로필 확인형(실측 Basic + 리스트 + 수정 링크 책임)** 은 로컬에서 닫혔다.  
추가 보완지시문은 없다. 다음 티켓은 **C(기본정보)** 만 연다.

---

## 1. 파일 범위

| 파일 | 역할 |
|------|------|
| `preview/home-ui/src/exposure-render.js` | `selfView` · `renderStudentBasicSelfCard` · self만 request provider 미리보기 |
| `preview/home-ui/src/student-reg/profile-read.js` | 신규 · 기본/상세 섹션·editSection |
| `preview/home-ui/src/student-reg/screens.js` | hub = 카드 + profile-read |
| `preview/home-ui/src/student-reg/format.js` | exposure 매핑에 요청 필드 |

A 6파일(mypage IA)과 함께 워킹트리에 있으나, **auth/signup·PHP WIP와 커밋 분리** 유지.

---

## 2. 012 보완 체크

| 잠금 | 결과 |
|------|------|
| selfView 카드에 `request_summary` 표시 (provider 규칙) | 예 (보고: 「주 2회 저녁, 내신 대비 희망」) |
| selfView CTA/상세/data-action 없음 | 예 |
| 비-selfView 홈 카드는 요청문 숨김·상세 유지 (학부모 홈) | 예 (보고: 8장) |
| 예산·한 줄 요청문 수정 → basic | 예 |
| 장소·특이요청 수정 → detail | 예 |
| 섹션: basic / detail 이분 | 예 (`buildStudentProfileReadSections`) |
| 폼·저장·스키마·push/build 없음 | 예 |
| 공부방·과외쌤 스모크 | 예 (보고) |

---

## 3. 잔여 메모 (B 미완료 아님)

1. `renderBasicStudentRow`의 **table** 레이아웃 분기는 selfView여도 `data-action`이 남을 수 있음. 마이프로필은 hcard 경로만 쓰므로 B 통과. 나중에 selfView를 table에 쓰면 같은 가드 필요.
2. 자녀 카피·publish 죽은 코드 → E.
3. 쪽지설정 저장(PHP `memo_status`) → 별도.
4. 커밋·push는 사용자 지시 시에만. A+B 파일만 스테이징 권장.

---

## 4. 다음

- **C** 상세지시: [014](014-student-mypage-renewal-ticket-c-basic.md)
