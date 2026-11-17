# 14b 주 회수 링크 + tutor-ui 상세등록 디자인

지시: `origin/docs/reapply-2026-11-17` 의 `docs/worklog/grok-sync/reapply-2026-11-17/14b-tutor-reg-design-link.md`  
기준: `origin/main` `d4899eb4`. 14 머지 `5a87ab72` (PR #251)가 그 앞에 있다.  
브랜치: `work/tutor-reg-design-link`  
작업 트리: `D:\work\study114\.wt\work-14b-tutor-reg`

## 0단계

| 확인 | 결과 |
|---|---|
| 14 merge | `git log`에 `5a87ab72` 있음 |
| `feeCountBox` | `step-lesson.js` 29행. 주 회수는 읽기 전용, 도움말은 embed면 「기본정보 탭에서 수정」, 아니면 「마이페이지에서 수정」 |
| 호출 | `renderLessonFormHtml` 139행 `feeCountBox(s, embed)` |
| 마이페이지 | `embedded-panels.js` `detailFormsHtml()` 116행, `embed: true`. `tutorSectionPath`는 이미 import |
| 같은 창 이동 | `tutor-reg/screens.js` 679행 `[data-p21-nav]`가 `syncEmbeddedTutorForms` 뒤 해시를 바꿈. 이 파일은 수정하지 않음 |
| tutor-ui 껍데기 | `layout.js` 96행 `register-card register-card--wide panel register-flow`. `main.js` 6행이 `./styles/register.css`를 싣음 |
| 14 CSS | `mypage-ops-register.css` 1156행부터. 이 파일은 수정하지 않음 |

고친 곳:

- `step-lesson.js` `feeCountBox`: 도움말만. 마이페이지이고 `basicHref`가 있으면 `data-p21-nav` 링크. 없으면 기존 글자. tutor-ui는 `mypageRegistrationsUrl()` 링크.
- `step-lesson.js` 호출 1곳: `feeCountBox(s, embed, opts.basicHref)`.
- `embedded-panels.js` 상세정보1 호출에 `basicHref: tutorSectionPath(tutor.id, 'basic')` 한 인자.
- `tutor-ui/src/styles/register.css` 맨 끝. 선택자는 `.register-card.register-flow form[data-form="lesson"]`, `form[data-form="contact"]`. 14의 카드·2칸·간격·알약·주 회수·추가 과목·`*` 색만. 단계 버튼·안내 상자·`.tde-actionbar`는 넣지 않음.

프로필 사진은 tutor-ui 학력·연락 폼에 없다. 마이페이지 임베드만 가진다. 그래서 사진 카드 규칙은 이 CSS에 넣지 않았다.

### 고치기 전 기준선

- `verify-tutor-lesson-optional-step` 통과
- `verify-tutor-register-same-tab` 통과
- `verify-tutor-detail-fields-ssot` 통과
- `verify-tutor-registration-check-frame` 통과
- `verify-tutor-basic-required` 실패 8건: PHP `mb_strlen` 없음, tutor-ui `renderBasic`의 `document.getElementById`, 그 렌더의 지역 「선택」, 사진 업로드 서버 비교, 학교급 미리 선택 변조, PHP 변조 3건(슬로건·주 회수·과외지역 1)
- `verify-input-fill-rule` 262 통과, 14 실패. 실패는 (b) 적용 파일 목록, T2 회색·select 시간 초과, S2 회색, A3 지역 연쇄, H1 select 시간 초과, H7 폼 렌더·p19-select·select 시간 초과, H9 회색, 변이 3건(screens.js·study-room-basic-form.js·study-room register.css), 복구 뒤 재실행

## 검증

- 렌더: tutor-ui 주 회수는 「마이페이지에서 수정」 링크. 마이페이지는 `#/mypage/registrations/tutors/9/basic` + `data-p21-nav`. `basicHref` 없으면 글자 그대로. 월 총 횟수는 select만. `name="lessons_per_week"` 없음. 이전·다음·저장 글자 그대로.
- 화면 계산(비로그인 페이지에 폼만 넣어 확인, 1440·390): 1440은 2칸·테두리 1px, 390은 1칸. 다음 버튼 글자는 「다음: 학력·연락」, 「등록 완료」.
- 고친 뒤 다섯 verify는 기준선과 같다. `verify-tutor-basic-required` 실패 8건의 이름도 같다. `verify-input-fill-rule`은 262 통과, 14 실패로 기준선과 같다.
- `npm run build:dothome` 종료 코드 0.
- 공부방·과외쌤·학생 일반·시크릿 메뉴 실클릭은 미확인. 로컬에서 그 계정으로 로그인되지 않아 비밀번호는 바꾸지 않았다. 공부방 화면은 tutor-ui `register.css`를 싣지 않는다(`home-ui`는 공부방 `register.css`를 싣는다).

## 계정

| 계정 | 일반 | 시크릿 |
|---|---|---|
| 공부방 | 미확인 | 미확인 |
| 과외쌤 | 미확인 | 미확인 |
| 학생 | 미확인 | 미확인 |
