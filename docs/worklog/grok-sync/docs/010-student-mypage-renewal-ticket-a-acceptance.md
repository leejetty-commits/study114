# 010 · 학생 마이페이지 리뉴얼 A — 수락 검토

- 작성일: 2026-09-23 (KST)
- 선행: [008](008-student-mypage-renewal-master-plan.md) · [009](009-student-mypage-renewal-ticket-a-ia-shell.md)
- 대상: Cursor 보고 — 메뉴·탭·진입 로컬 작업 (미커밋)
- 상태: **로컬 수락** (push / `build:dothome` 대기)

---

## 0. 한 줄 결론

009 잠금 기준으로 **학생 IA·셸·탭·리다이렉트는 로컬에서 닫혔다.**  
보완지시문(재작업)은 없다. 다음 티켓은 **B(마이프로필 카드·리스트)** 만 연다.

---

## 1. 데이터 전제 (재개 조건)

| 항목 | 결과 |
|------|------|
| 계정 | `guardian_user_id=6` (guardian1@dev.local) |
| id=2 | `deleted_at=2026-09-23 13:39:43` (로컬 soft-delete) |
| 활성 학생 | `deleted_at IS NULL` 기준 **1명 = id 1 (published)** |
| 임의 id 선택 | 없음 (사용자 확정 후 재개) |

---

## 2. 코드 범위 (우동공과2 diff 대조)

보고된 6파일만 A 범위로 수락한다.

- `preview/home-ui/src/mypage/router.js`
- `preview/home-ui/src/mypage/shell.js`
- `preview/home-ui/src/mypage/screens.js`
- `preview/home-ui/src/mypage/index.js`
- `preview/home-ui/src/student-reg/router.js`
- `preview/home-ui/src/student-reg/screens.js`

`mypage-copy.js` 미수정 — 009상 허용.

### 워킹트리 주의 (A와 무관)

같은 브랜치 `fix/student-detail-info`에 **가입/auth·PHP·CSS 등 다른 미커밋 변경**이 섞여 있다.  
A를 커밋할 때는 **위 6파일만** 스테이징할 것. auth·signup·`BasicRegisterService` 등과 한 커밋으로 묶지 말 것.  
`study-room-reg/screens.js` trailing newline만 있는 변경은 A에 넣지 말 것.

---

## 3. 009 잠금 대조

| 잠금 | 결과 |
|------|------|
| 1차 메뉴 5항 · 순서 | 예 (`PARENT_NAV_PATHS`) |
| 라벨 찜·비교 / 쪽지 | 예 (`labels.parent`) |
| 내 문의·구매이력·찜한학생·홈 메뉴 제외 | 예 (roles/리다이렉트) |
| 기본 진입 = 마이프로필 `…/students/1` | 예 |
| 탭 4: 마이프로필/기본정보/상세정보/쪽지설정 | 예 (`STUDENT_REG_TOP_TABS`) |
| publish·목록·tab/* → 마이프로필 | 예 |
| settings → 쪽지설정 셸(조회만, 저장 없음) | 예 (라디오 disabled + PHP 보고) |
| 마이프로필 본문 플레이스홀더 | 예 (`B에서 카드·리스트 연결`) |
| 기본·상세 폼 내용 유지 | 예 (보고·허브만 교체) |
| 공부방·과외쌤 getDefault·좌측 8개 유지 | 예 (스모크 보고) |
| 새 저장 API·스키마 없음 | 예 |
| push / build 없음 | 예 |

### 라우팅·API 점검 (보고 수락)

- `#/mypage` → `#/mypage/registrations/students/1`, 제목 마이프로필
- 기본정보 새로고침 유지, 희망지역 API값(부산) 확인
- 홈·publish·목록·tab/draft·구매이력·찜한학생·제출서류 → 마이프로필
- 찜·비교·최근열람·쪽지·계정설정 각각 열림
- `GET /api/registrations/students.php` 200, 학생 1명, id 1, `memo_status=open`

---

## 4. 잔여 메모 (A 미완료 아님 · E/후속)

1. `renderNotFound` 등 **「자녀」 카피** 잔존 → 티켓 E.
2. `renderPublish` 등 publish UI 함수가 파일에 남을 수 있음. 라우트는 막혔으므로 A 통과. 죽은 코드 정리는 E 또는 B와 무관한 후속.
3. 쪽지설정 **저장**은 학생 수정 API allowlist에 `memo_status` 없음 → PHP 수정 필요. **A에서 저장 미연결은 올바름.** C/D/E와 별도 작은 티켓으로 열 수 있음.
4. 브랜치 이름 `fix/student-detail-info`는 학생찾기·상세 작업 잔재. A 전용 커밋/PR 시 이름·메시지에 「학생 마이페이지 A」를 명시할 것.
5. 로컬 커밋은 사용자 지시 시에만. push / `build:dothome` 금지 유지.

---

## 5. 다음

- **B** 상세지시: [011](011-student-mypage-renewal-ticket-b-myprofile.md)
- A 보완지시문: **없음**
