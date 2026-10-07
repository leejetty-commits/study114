# 012 · 학생 마이페이지 리뉴얼 B — 보완지시문

- 작성일: 2026-09-23 (KST)
- 선행: [011](011-student-mypage-renewal-ticket-b-myprofile.md)
- 대상: Cursor B 보고 (미커밋) — Basic 카드 + profile-read 목록
- 상태: **보완 반영·수락** → [013](013-student-mypage-renewal-ticket-b-acceptance.md)

---

## 0. 한 줄 결론

마이프로필 **골격**(홈 Basic 재사용 · CTA/상세 제거 · 리스트 · A 라우팅 유지 · 폼/저장 미손)은 맞다.  
다만 **본인 확인용 카드에 한 줄 요청문이 비고**, 목록 **수정 링크가 기본/상세 책임과 어긋난다.**  
이 두 가지만 고치고 다시 보고하라. C는 열지 않는다.

---

## 1. 통과한 것 (건드리지 말 것)

| 항목 | 상태 |
|------|------|
| `renderStudentBasicSelfCard` → `renderBasicStudentRow(..., { selfView: true })` | 홈 마크업 재사용 |
| selfView 시 `data-action` / 상세·찜·쪽지·게이트 제거 | 011 §3-2 |
| `student-reg/profile-read.js` 신규 · 과외쌤 p21-profile 패턴 | 포함 범위 |
| hub = 카드 + profile-read, 부족/체크리스트/공개/danger 미복구 | 예 |
| 기본·상세 폼·쪽지설정 저장·스키마·push/build 없음 | 예 |
| A 리다이렉트·좌측 5메뉴 유지 (보고) | 예 |
| `GET …/students.php` 200, id 1 (보고) | 예 |
| auth/signup 미커밋 미포함 | 예 |

변경 허용 파일 (이 보완만):

- `preview/home-ui/src/exposure-render.js` — selfView 요청문 표시만
- `preview/home-ui/src/student-reg/profile-read.js` — 섹션·editSection 재배치만
- (필요 최소) `preview/home-ui/src/student-reg/format.js` — 이미 넣은 exposure 매핑 유지/보정

`screens.js`는 hub 조립이 이미 맞으면 **추가 수정 금지**.

---

## 2. 반드시 고칠 것

### 2-1. 마이프로필 Basic 카드에 **한 줄 요청문**이 보여야 한다

**현상:** `selfView`가 `viewerRole: 'parent'`를 강제하고, `studentProtectedPreview`는 provider가 아니면 `—`를 반환한다.  
그래서 카드 meta의 「한 줄 요청문」(및 특이요청)이 **값이 있어도 비어 보인다.**

**잠금:**

- 마이프로필 카드의 목적은 **홈에 나가는 Basic과 같은 정보 확인**이다.
- `selfView === true`일 때 `request_summary`는 **공급자 홈 카드와 동일한 규칙**으로 보여라  
  (기존 provider 미리보기: trim 후 있으면 표시, 18자 말줄임 유지해도 됨).
- 빈 값이면 지금처럼 빈 meta / `—` 처리.
- 게스트 티저·로그인 게이트·상세 클릭·공급자 CTA는 **계속 금지**.
- 특이요청(`special_request_note`)은 카드 필수가 아니다. selfView에서 숨기거나 provider와 동일하게 두되, **한 줄 요청문만은 반드시 보이게**.

구현 힌트 (강제 아님): `studentProtectedPreview`에 self 분기, 또는 `renderStudentBasicSelfCard`에서 request 행만 owner/provider 미리보기 사용.  
홈 목록(비 selfView) 동작 **회귀 금지**.

### 2-2. 목록 `editSection` = 노션 기본/상세 책임

정본: **한 줄 요청문·예산·표시명·희망유형·지역·과목·학년(학교급)·수업형태·인원** → **기본정보**.  
**특이요청·추가지역·장소·횟수·시간·스타일·성별·출생연도** → **상세정보**.

**현재 문제 (`buildStudentProfileReadSections`):**

| 문제 행 | 지금 edit | 바꿔야 할 edit |
|---------|-----------|----------------|
| 예산 | `lesson` → detail | **basic** |
| 한 줄 요청문 | `request` → detail | **basic** |
| (권장) 수업형태·원생수 성격의 「원생수/lesson target」 | detail 섹션에 있으면 | Notion상 기본 → **basic** |

**잠금 재배치 (권장 구조):**

1. 섹션 **기본정보** — `editSection: 'basic'`  
   표시명, 희망 유형, 희망지역, 과목, 학년, (수업형태/인원), 예산, **한 줄 요청문**
2. 섹션 **상세정보** — `editSection: 'detail'`  
   희망지역 추가, 희망 수업장소, 주 횟수, 1회 시간, 희망 강의스타일, 희망 과외쌤 성별, 학생 성별, 출생연도, **특이요청사항**
3. 섹션 헤더 「수정」과 상단 「기본정보 수정 / 상세정보 수정」버튼은 위 책임과 **일치**

「대표 *」라벨 쓰지 말 것. 부족 n개·공개 CTA 되돌리지 말 것.

---

## 3. 보고에 빠졌지만 한 줄만 추가할 것

공부방·과외쌤 계정으로 마이페이지 허브/마이프로필 **스모크 1회** (깨짐 없음).  
011 §5-1.5. 코드 손대지 말고 확인만.

---

## 4. 완료 점검 (보완 후)

1. id=1 마이프로필 카드 meta에 **한 줄 요청문**이 API 값과 맞게 보인다 (비어 있던 경우 재현 후 채움).
2. 홈 `#/search/student` Basic 카드(공급자 세션)와 **마크업·크기가 같고**, 검색 쪽 CTA/클릭은 이전과 동일.
3. 목록에서 「한 줄 요청문」「예산」행의 수정 → `#/…/students/1/basic`.
4. 「특이요청」행의 수정 → `#/…/students/1/detail`.
5. 기본/상세 폼 필드 세트·저장 API 변화 없음.
6. push / `build:dothome` 없음. auth WIP와 커밋 섞지 말 것.

---

## 5. Cursor 복사용

```
011 B 보완만 (012). C 금지.

1) exposure-render: selfView Basic 카드에서 request_summary가 provider 홈 카드와 같이 보이게.
   상세·게이트·찜·쪽지·검색 상세 클릭은 계속 막을 것. 비-selfView 홈 목록 회귀 금지.

2) student-reg/profile-read.js: editSection을 노션 책임에 맞출 것.
   - basic: 표시명·희망유형·지역·과목·학년·수업형태/인원·예산·한 줄 요청문
   - detail: 추가지역·장소·횟수·시간·스타일·성별·출생연도·특이요청
   예산·한 줄 요청문이 detail 수정으로 가면 거부.

3) 공부방·과외쌤 마이페이지 스모크 한 줄 보고.
폼·저장·쪽지설정 저장·스키마·push/빌드·auth WIP 금지.
끝나면 라우팅+API+위 1·2 증거만 보고.
```
