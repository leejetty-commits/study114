# 043 · 가입 QA(030~040) allowlist 커밋·푸시·닷홈 배포

- 작성일: 2026-09-24 (KST)
- 선행 판정: [042](042-deploy-judgment-signup-qa.md) · 수락 030~041
- 기준 HEAD: `20b7be8` (= origin/main · mypage A~F+G 이미 배포)
- 상태: **운영 수락** → [045](045-signup-qa-allowlist-deploy-acceptance.md) · SHA `6bf408a` · Actions #325
- 범위 한 줄: **로컬 수락된 가입 QA만** stage → 커밋 → push → `build:dothome`. 학생 기본 PHP/CSS·auth shell WIP·tmp **금지**.

---

## 0. 한 줄 목적

워킹트리 dirty를 **통째로 올리지 말고**, 042 A군(+ B군 030 hunk만)만 커밋·푸시·닷홈 반영한다.  
`git add -A` / `git commit -a` **거부.**

---

## 1. 게이트 (이 티켓 = 실행 허용)

이 지시문을 받은 Cursor는 **아래를 순서대로 실행**한다 (사용자가 우동공과2에 「배포 지시문 달라」+「노션 정리」까지 요청한 상태 · 본 티켓이 커밋·푸시·빌드 실행 허가).

1. allowlist만 stage  
2. 로컬 커밋 1개 (가입 QA만)  
3. `origin/main` push  
4. `npm run build:dothome` (또는 기존 CI Deploy to dothome 트리거 방식 **기존과 동일**)  
5. Actions 성공 · 운영 스모크 증거

중단 조건: B군 hunk 분리가 불가능하거나 C군이 stage에 섞이면 **즉시 중단·보고** (무리한 전체 stage 금지).

---

## 2. Allowlist

### A. 반드시 포함 (파일 단위 stage)

```
preview/shared/korea-sidos.js
preview/auth-ui/src/screens/signup-complete.js
preview/study-room-ui/src/main.js
preview/study-room-ui/src/screens/step-lesson.js
preview/study-room-ui/src/screens/step-facility.js
preview/shared/study-room-basic-form.js
```

### B. 조건부 — `signup-basic.js` (hunk 분리 필수)

파일: `preview/auth-ui/src/screens/signup-basic.js`

| 넣기 | 빼기 |
|------|------|
| `regionIdFromActivityLabel` / `activityLabelFromRegionId` / `getCityUnits` import·호출 (030) | `SCHOOL_LEVEL_OPTIONS` · `LESSON_FORMAT_OPTIONS` · `STUDENT_COUNT_OPTIONS` |
| 시·군 라벨→region_id 매핑 교체 | `request_summary` · 학생 기본 9필드 UI/검증 |
| | student-basic / guardian / 자녀 관련 추가 |

방법: `git add -p preview/auth-ui/src/screens/signup-basic.js`  
030 hunk만 `y`, 학생 WIP는 `n`.  
**분리가 불가능하면 이 파일은 커밋에서 빼고** `korea-sidos.js`만으로 과외 시·군이 동작하는지 스모크. 동작 안 하면 **중단·보고** (학생 WIP를 억지로 넣지 말 것).

### C. 절대 제외

```
src/Auth/BasicRegisterService.php
src/Views/auth/partials/basic-student.php
src/Views/auth/signup-basic.php
src/helpers.php
public/assets/css/auth/mvc.css
preview/auth-ui/src/styles/student-basic.css
preview/auth-ui/src/layout.js
preview/auth-ui/src/main.js
preview/home-ui/src/study-room-reg/screens.js
.tmp-*
.tmp-rc-deploy/
.tmp-student-*/
preview/home-ui/_verify/
preview/study-room-ui/_verify/
public/assets/teaser-*
```

mypage A~F+G는 이미 `20b7be8`에 있음 — 재커밋하지 말 것.

---

## 3. 커밋 메시지

```
fix(signup): tutor city map, complete UX, detail copy, studyroom promo1

Local accept 030–040. Allowlist only; no student-basic PHP/CSS WIP.
```

브랜치: 현재 `feat/student-mypage-a-g`면 **main에 직접 푸시하는 기존 방식**을 따르거나, 사용자/레포 관례가 있으면 그대로. 새 장기 브랜치 분기 불필요.  
`git status`로 stage에 A(+B허용)만 있는지 **커밋 직전 재확인**.

---

## 4. Push · 빌드

1. `git push origin HEAD:main` (또는 기존 study114 dothome 배포와 **동일 명령**)  
2. `npm run build:dothome` **또는** Actions **Deploy to dothome**가 push로 자동이면 그 런 대기  
3. Actions 성공 런 번호 · commit SHA 보고  
4. 운영 `https://study114.net` assets 해시가 새 빌드인지 확인

---

## 5. 필수 스모크 (보고에 증거)

### 라우팅

| # | 확인 |
|---|------|
| 1 | 과외쌤 `#/signup/basic?role=tutor`(또는 기존 과외 기본등록) · 시·군 의정부 → alert 없음 |
| 2 | 가입 완료 화면 · 회원ID/role_type 디버그 칸 **없음** |
| 3 | 상세 이어가기 · 같은 탭 · `window.open` 0 (약관 `_blank`는 기존 유지) |
| 4 | 공부방 상세 `#/register/lesson` · `#/register/facility` 같은 탭 · 카피 「지금 다 안 채워도…」 |
| 5 | 공부방 기본 `#/signup/basic?role=study_room` · 개설→홍보1 자동 · 수동 수정 후 덮지 않음 |

### API (샘플 1건 이상)

| 역할 | 확인 |
|------|------|
| tutor | basic-register payload에 시 단위 `region_id`(예: 의정부 **29**) |
| study_room | `address_text` ≠ 필요 시 `saved_regions[0].region_id` 가능(040) · 200 |

### 회귀

- 학부모 mypage 깨짐 없음 (이번 diff에 mypage 없어야 함)
- C군 파일이 커밋/푸시에 **0**

---

## 6. 완료 보고 형식

1. stage 파일 최종 목록 (`git diff --cached --name-only`)  
2. commit SHA · message  
3. push 범위 · Actions 런 # · 결과  
4. 운영 assets 파일명(또는 해시)  
5. 스모크 표 (라우팅·API)  
6. **안 올린 것**: C군 · signup-basic 학생 hunk · tmp  

---

## 7. Cursor 붙여넣기용 전문

```
[티켓 043 · 가입 QA 030~040 allowlist만 커밋·푸시·닷홈 배포]

판정(042): dirty 통째 배포 금지. HEAD=20b7be8(mypage 이미 배포).
이 티켓 = 수락 가입분만 stage→commit→push→build:dothome 실행 허가.
git add -A 금지. 학생 기본 PHP/CSS·auth shell WIP·tmp 금지.

【반드시 stage】
preview/shared/korea-sidos.js
preview/auth-ui/src/screens/signup-complete.js
preview/study-room-ui/src/main.js
preview/study-room-ui/src/screens/step-lesson.js
preview/study-room-ui/src/screens/step-facility.js
preview/shared/study-room-basic-form.js

【조건부】 signup-basic.js → git add -p
넣기: regionIdFromActivityLabel / activityLabelFromRegionId (030)
빼기: SCHOOL_LEVEL·request_summary·학생 9필드 등
분리 불가 → 이 파일 제외 후 스모크; 실패 시 중단·보고(학생 WIP 넣지 말 것)

【절대 제외】
BasicRegisterService.php, basic-student.php, signup-basic.php, helpers.php,
mvc.css, student-basic.css, layout.js, auth main.js, study-room-reg/screens.js,
.tmp*, _verify/, teaser-*

커밋 메시지:
fix(signup): tutor city map, complete UX, detail copy, studyroom promo1

Local accept 030–040. Allowlist only; no student-basic PHP/CSS WIP.

순서: cached name-only 재확인 → commit → push origin(main 관례) → build:dothome 또는 Deploy Actions → 성공 증거

스모크 필수:
- 과외 의정부시 region_id=29 · alert 없음
- 완료화면 디버그 칸 없음 · 상세 같은 탭
- 상세 카피 「지금 다 안 채워도…」
- 공부방 개설→홍보1 자동·수동플래그
- 커밋에 C군 0 · mypage 파일 0

보고: cached 목록, SHA, Actions #, 운영 assets, 스모크, 안 올린 것.
```
