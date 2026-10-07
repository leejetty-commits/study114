# 161 · 회원 카드 숨김 폐기 · 마이페이지 구잔재 제거 · 일일결산 항목 제외

- 날짜: 2026-09-25
- 상태: **정책 잠금 · Cursor 코딩 대기** (push / `build:dothome` 금지)
- 저장소: **오직** `leejetty-commits/study114`
- 선행: [127](127-status-vocabulary-audit.md) · 마이페이지 실측(2026-09-25) · 일일결산 초안 대화
- 관련: 관리자 노출은 [156](156-admin-p1-member-exposure-delete-plan.md) · P4 「홈에 뭐가 보이나」(159) — **유지**

## 1. 사용자 잠금 (2026-09-25)

1. **회원이 스스로 카드를 숨기는 기능은 제품에서 폐기**한다. (공부방·과외쌤·학생 마이페이지/내 등록)
2. **일일결산**에서 「오늘 노출 변경」(회원·자발적 숨김/다시 보이기 건수) **항목을 뺀다.**
3. 코드에 남은 **마이페이지 숨김 구잔재는 제거**한다.
4. **관리자가** 홈·찾기에서 카드를 빼 두거나 다시 보이게 하는 기능은 **유지**한다. (P1·P4 운영)
5. DB 값 `hidden` · 검색에서 `hidden` 제외 · 탈퇴 시 목록에서 빠짐(153)은 **유지**. 이번 티켓은 **회원 화면·API 호출 잔재만** 정리.
6. 배포는 사용자가 「배포」할 때만. 코딩은 Cursor 켤 때.

## 2. 일일결산 (수정 후 Must)

| # | 항목 | 비고 |
|---|------|------|
| 1 | 오늘 결제 | 유지 |
| 2 | 남은 응대 | 문의·신고 등 |
| 3 | 오늘 등록 | 베이직카드 · **등록일** |
| ~~4~~ | ~~오늘 노출 변경~~ | **삭제** (본 잠금) |
| 4 | 오늘 탈퇴·삭제 | 번호 재정렬 |
| 5 | 지금 홈 팝업 | 유지 |

Nice(가입만 한 계정 · 쪽지·후기 이상)는 그대로.  
운영자 「홈에 뭐가 보이나」 카드(관리자 노출)는 **결산 줄이 아니라** 관리 콘솔 할 일로 둔다.

## 3. 제거 대상 (회원 쪽만)

### 3.1 공부방 (`preview/home-ui/src/study-room-reg/`)

| 대상 | 조치 |
|------|------|
| `router.js` — `listTab`의 `hidden` · `#.../tab/hidden` · 제목 `P20-06` 「숨김·삭제」 | 파서·타입·제목에서 **제거**. 해당 URL은 허브(또는 목록 진입)로 **리다이렉트** |
| `study-room-reg-copy.js` — `P20_LIST_TABS`의 `{ key: 'hidden', label: '숨김' }` | 제거 |
| `screens.js` — `data-p20-hide` 핸들러 · 숨김 전용 목록 탭 UI | 마크업·핸들러 제거 |
| `format.js` — 호출 없는 숨김 사유/노출 CTA 보조함수(127 후보) | 호출 그래프 확인 후 **미사용이면 삭제** |
| store의 `hideStudyRoom`(또는 동명) 회원 hide API 래퍼 | **회원 UI에서만** 쓰이면 제거. 관리자 경로는 건드리지 말 것 |

### 3.2 과외쌤 (`preview/home-ui/src/tutor-reg/`)

| 대상 | 조치 |
|------|------|
| `router.js` — `tab/hidden` · `P21-07` 「숨김·삭제」 제목 | 제거 · 구 URL 리다이렉트 |
| `tutor-reg-copy.js` — `P21_LIST_TABS` 전체(목록 렌더러 없음) 또는 최소 `hidden` 항목 | 죽은 탭 정의 제거 |
| `screens.js` — `renderExposure` 안의 **「숨김」 버튼**(`data-p21-hide`) · hide 바인딩 | **제거**. P21-06이 유료 「노출 상품」만 남기면 유지하되 danger-zone 「공개 중단·삭제」의 **숨김**만 삭제. 삭제(soft) 버튼은 **정책 확인 전 유지**(별도 폐기 아님) |
| `registration-check-render.js` / `registration-check-copy.js` — 「지금은 숨김입니다」·다시 공개 CTA | **제거 또는** 관리자 숨김 상태일 때 「운영자가 목록에서 빼 둔 상태」 **안내만**(회원이 다시 켜는 버튼 **금지**) |
| `store.js` — `hideTutor` | 회원 UI 전용이면 제거 |

**딥링크** `#/mypage/registrations/tutors/{id}/exposure` 에 숨김이 있던 것이 핵심 잔재 → 숨김 CTA 제거 필수.

### 3.3 학생 (`preview/home-ui/src/student-reg/`)

| 대상 | 조치 |
|------|------|
| `router.js` — `tab/hidden` · `P19-06` 「숨김·삭제」 | 제거 · 구 URL → 마이프로필 |
| `screens.js` — `data-p19-hide` 핸들러 | 제거 |
| `store.js` — 목록 필터·`hide` 보조 | 미사용이면 제거 |

### 3.4 공통 카피 (범위 제한)

| 대상 | 조치 |
|------|------|
| `preview/home-ui/src/lifecycle-copy.js` — `hidden: '숨김'` | **회원 내 등록 배지/탭에서 안 쓰이게** 정리. 관리자·내부 라벨이 같은 파일을 쓰면 **관리자 쪽은 유지**하거나 admin 전용 카피로 분리. **손님 화면에 「숨김」 재등장 금지** |
| 이용안내·고객센터 | 이미 「노출」로 정리됨(142). **이번 티켓에서 재작업 금지** |

## 4. 금지 (절대)

- `src/Admin/AdminExposure*` · 관리자 노출 hide/publish **삭제·약화 금지**
- `SearchService` 등 `profile_status <> 'hidden'` / 학생 `exposure_status` 필터 **제거 금지**
- DB ENUM에서 `hidden` 값 **드롭 금지** (데이터·관리자·탈퇴 연쇄)
- 탈퇴 시 등록이 홈·찾기에서 빠지는 정책(153) **후퇴 금지**
- push / `build:dothome` / 다른 저장소
- 「공개중」→「노출」 전면 치환은 **후순위**(127 잔재). 이번은 **hide CTA·탭·핸들러**만

## 5. Cursor allowlist (초안)

우선:

- `preview/home-ui/src/study-room-reg/router.js`
- `preview/home-ui/src/study-room-reg/study-room-reg-copy.js`
- `preview/home-ui/src/study-room-reg/screens.js`
- `preview/home-ui/src/study-room-reg/format.js` (미사용 확인 후)
- `preview/home-ui/src/tutor-reg/router.js`
- `preview/home-ui/src/tutor-reg/tutor-reg-copy.js`
- `preview/home-ui/src/tutor-reg/screens.js`
- `preview/home-ui/src/tutor-reg/registration-check-render.js`
- `preview/home-ui/src/tutor-reg/registration-check-copy.js`
- `preview/home-ui/src/tutor-reg/store.js` (hideTutor만)
- `preview/home-ui/src/student-reg/router.js`
- `preview/home-ui/src/student-reg/screens.js`
- `preview/home-ui/src/student-reg/store.js` (hide 관련만)
- 필요 시 `preview/home-ui/src/lifecycle-copy.js` (회원 노출 라벨만, admin 깨지지 않게)

PHP 회원 Hub hide 엔드포인트가 **오직** 위 UI에서만 호출되면 같은 티켓에서 죽은 라우트만 제거. AdminExposure는 allowlist **밖**.

## 6. 수락

1. 공부방·과외쌤·학생 **내 등록 상단탭**에 「숨김」 없음(기존과 동일) + **딥링크로도 숨김 버튼 없음**.
2. `#/.../tab/hidden` · 과외 `#/.../exposure`의 「숨김」 버튼 · `data-p19-hide`/`data-p20-hide`/`data-p21-hide` **회원 경로 0**.
3. 관리자 노출 hide/publish **스모크 통과**(기존과 동일하게 동작).
4. 게스트 홈·찾기에서 `hidden` 등록 **여전히 안 보임**.
5. 배포 없음. 로컬/프리뷰만.

## 7. 플래너용 한 줄

회원은 카드를 숨기지 않는다. 결산에도 안 적는다. 코드 잔재만 지우고, 운영자 노출·DB `hidden`·탈퇴 연쇄는 그대로 둔다.


## 추가 잠금 (2026-09-25 · 사용자 확인)

**관리자 카드 숨김·다시 보이기 = 필요 기능 · 잠금.**
신고·민원, 운영 점검, 분쟁·확인 중에 홈·찾기에서만 잠시 빼 두는 용도. 회원 자발적 숨김과는 별개이며 **폐기하지 않는다.**
