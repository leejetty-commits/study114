# 14c 주력과목 안내 링크 + 제출함 안내 문장 삭제

지시: 2026-11-18 채팅. 문서 브랜치에 14c 지시서는 없다.  
기준: `origin/main` `44e20309` (PR #255).  
브랜치: `work/tutor-subject-edit-link`  
작업 트리: `D:\work\study114\.wt\work-14c-subject-hint`

## 0단계

| 확인 | 결과 |
|---|---|
| `step-lesson.js` 118행 | `주력과목(기본등록)` 줄. embed면 「기본정보 탭에서 수정」, 아니면 「마이페이지에서 수정」. 둘 다 글자 |
| `feeCountBox` | 29행. embed이고 `basicHref`가 있으면 `data-p21-nav` 링크. 없으면 글자. tutor-ui는 `mypageRegistrationsUrl()` 링크 |
| 마이페이지 호출 | `embedded-panels.js` 116행이 이미 `basicHref: tutorSectionPath(tutor.id, 'basic')`를 넘김. 이 파일은 수정하지 않음 |
| `step-contact.js` 96행 | `form-hint` 「파일은 마이페이지 제출함에서 올립니다. …」. 바로 위는 체크박스 「증빙서류 제출 가능」 |
| `step-detail.js` 165행 | 같은 `form-hint`. 체크박스와 「제출함 열기」는 그 옆에 있음 |
| verify 문자열 | 이 두 문장을 검사하는 스크립트는 없음 |

허용 파일 안에서 끝난다. `step-detail.js` 101행의 주력과목 줄에는 수정 안내가 원래 없다. 그대로 두었다.

## 고친 곳

- `step-lesson.js`: 주력과목 안내만 `feeCountBox`와 같은 분기. embed이고 `opts.basicHref`가 있으면 `#` + `data-p21-nav`. embed인데 없으면 글자. tutor-ui는 `mypageRegistrationsUrl()` 링크.
- `step-contact.js`, `step-detail.js`: 제출함 `form-hint` 한 줄만 삭제. 체크박스 `name="proof_document_available"`와 「제출함 열기」는 그대로.

## 검증

- 렌더: tutor-ui 주력과목은 `http://127.0.0.1:5174/#/mypage/registrations` 링크. 마이페이지는 `#/mypage/registrations/tutors/9/basic` + `data-p21-nav="/mypage/registrations/tutors/9/basic"`. `basicHref` 없으면 「기본정보 탭에서 수정」 글자. 주 회수 칸은 그대로.
- 학력·연락·상세: 제출함 안내 문장 없음. 체크박스는 값이 있으면 checked. 「제출함 열기」 있음.
- `verify-tutor-lesson-optional-step` 통과
- `verify-tutor-register-same-tab` 통과
- `verify-tutor-detail-fields-ssot` 통과
- `verify-tutor-registration-check-frame` 통과
- `verify-tutor-basic-required` 실패 8건. 기준선과 같다. PHP `mb_strlen` 없음, tutor-ui `renderBasic`의 `document.getElementById`, 그 렌더의 지역 「선택」, 사진 업로드 서버 비교, 학교급 미리 선택 변조, PHP 변조 3건(슬로건·주 회수·과외지역 1)
- `verify-tutor-search-fields` 66 통과, 2 실패. 확대카드 손님 문구가 기준 커밋과 다름, 베이직 가로카드 사진 경로. 기존 실패
- `verify-student-hope-hidden-required` 실패. `import.meta.env` 없음. 기존 실패
- Hide inquiry bundle 29 통과, 1 실패. `(m) 추가 CSS는 .admin-shell`. 기존 실패
- `npm run build:dothome` 종료 코드 0
- 공부방·과외쌤·학생 일반·시크릿 메뉴 실클릭은 미확인. 로컬에서 그 계정으로 로그인되지 않아 비밀번호는 바꾸지 않았다.

## 계정

| 계정 | 일반 | 시크릿 |
|---|---|---|
| 공부방 | 미확인 | 미확인 |
| 과외쌤 | 미확인 | 미확인 |
| 학생 | 미확인 | 미확인 |
