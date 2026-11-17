# 14b. 주 회수 「기본정보 탭에서 수정」을 링크로 + tutor-ui 과외쌤상세등록에도 14와 같은 디자인

작성: 우동공과3(검수). 코드 변경 없음. 문서만. PR만 연다. 머지 금지.
11-18 종현 결정 5(주 회수 링크)·7(tutor-ui 상세등록에도 같은 디자인).

**시작 조건: 14(`14-tutor-mypage-detail-design.md`) PR이 머지되고, 운영에서 마이페이지 상세정보1·2 확인이 끝난 뒤.** 그 전에는 시작하지 않는다.
기준: 14 머지 뒤의 `origin/main`(커밋을 0단계에서 적는다).

## 왜 따로 하나

- `preview/tutor-ui/src/screens/step-lesson.js`·`step-contact.js`는 마이페이지 상세정보1·2와 tutor-ui 과외쌤상세등록 화면이 **같이 쓰는 HTML**이다.
- verify 스크립트 다섯 개가 이 파일 글자를 검사한다: `verify-tutor-basic-required`, `verify-tutor-lesson-optional-step`, `verify-tutor-register-same-tab`, `verify-tutor-detail-fields-ssot`, `verify-tutor-registration-check-frame`.
- 그래서 14와 섞지 않고, 14가 안정된 뒤 따로 한다.

## 0단계 (필수) — 먼저 진단하고 보고. 고치기 전에.

1. `git fetch origin && git switch -c work/tutor-reg-design-link origin/main`. `git log --oneline -5`에 14 PR의 merge 커밋이 있는지 본다. **없으면 멈추고 보고.**
2. 직접 열어 확인:
   - `step-lesson.js` `feeCountBox(s, embed)`(29~51행 근처): 주 회수 칸 `<p class="form-input form-input--readonly" aria-readonly="true">`와 `<p class="form-hint">${hint}</p>`, `hint = embed ? '기본정보 탭에서 수정' : '마이페이지에서 수정'`.
   - `step-lesson.js` `renderLessonFormHtml(opts)`가 `feeCountBox(s, embed)`를 부르는 곳(약 139행).
   - `embedded-panels.js` `detailFormsHtml()`의 `renderLessonFormHtml({ includeStepNav: false, includeFooterActions: false, embed: true })`.
   - `tutor-reg/screens.js` 약 678행 `root.querySelectorAll('[data-p21-nav]')` — 마이페이지 안 링크를 같은 창 해시 이동으로 받는 곳(14의 등록점검·마이프로필 링크도 이걸로 간다).
   - `tutor-ui/src/layout.js` `renderRegisterShell()`의 `<div class="register-card register-card--wide panel register-flow">`. `tutor-ui/src/main.js`가 `./styles/register.css`를 싣는다(6행).
   - 14가 `mypage-ops-register.css` 맨 끝에 넣은 `.mp-room-embed.register-flow[data-embed-tutor-id] …` 덩어리.
3. 위 다섯 verify를 **고치기 전에** 한 번 돌려 결과를 적는다(기준선).
4. 고칠 줄 목록과 CSS 선택자 목록을 **먼저 보고**한다.
5. 문서와 다르거나, 애매하거나, **허용 파일 밖을 고쳐야 할 것 같으면 멈추고 보고한다. 고치지 않는다.**

## 바꿀 것

### A. 주 회수 안내를 링크로 (`step-lesson.js` + `embedded-panels.js`)

1. `embedded-panels.js` `detailFormsHtml()`: 상세정보1 호출에 인자 하나만 더한다.
   ```js
   renderLessonFormHtml({ includeStepNav: false, includeFooterActions: false, embed: true, basicHref: tutorSectionPath(tutor.id, 'basic') })
   ```
   (`tutorSectionPath`는 이 파일이 이미 import 한다.)
2. `step-lesson.js`:
   - `renderLessonFormHtml`에서 `feeCountBox(s, embed)` → `feeCountBox(s, embed, opts.basicHref)`.
   - `feeCountBox(s, embed, basicHref = '')`의 주 회수 도움말만 바꾼다.
     - 마이페이지(embed)이고 `basicHref`가 있으면: `<p class="form-hint"><a href="#${basicHref}" data-p21-nav="${basicHref}">기본정보 탭에서 수정</a></p>`
     - 마이페이지인데 `basicHref`가 없으면: 지금 글자 그대로.
     - tutor-ui 화면(embed 아님): `<p class="form-hint"><a href="${mypageRegistrationsUrl()}">마이페이지에서 수정</a></p>` (`mypageRegistrationsUrl`은 이 파일이 이미 import 한다. 아래쪽 「표시명·과외지역…는 마이페이지에서 수정」 링크와 같은 주소.)
   - `target`·`window.open` 쓰지 않는다(`verify-tutor-register-same-tab`). 같은 창.
   - `name="lessons_per_week"`를 넣지 않는다(`verify-tutor-lesson-optional-step` 149행). `data-trc-field="lessons_per_week"`는 그대로.
   - 월 총 횟수 분기(`monthly_session_count` select), 주력과목 안내(114행), 다른 줄은 그대로.
3. 마이페이지 링크는 `data-p21-nav`로 가서, 지금 입력값을 메모리에 남기고(`syncEmbeddedTutorForms`) 기본정보 탭으로 간다. 새 이벤트 코드는 넣지 않는다.

### B. tutor-ui 상세등록 화면에 14와 같은 디자인 (`tutor-ui/src/styles/register.css`만)

- `register.css` **맨 끝에 한 덩어리**. tutor-ui만 싣는 파일이라 마이페이지·공부방에 안 번진다.
- 선택자는 `.register-card.register-flow form[data-form="lesson"]`, `.register-card.register-flow form[data-form="contact"]`로 시작한다.
- 내용은 14의 B-1~B-7과 같은 값으로 옮긴다: 카드·구역 제목, 1024px 이상 2칸(반 칸 `data-trc-field` 목록 같음), 간격, 라디오·체크박스 알약(`:has(input:checked)`), `.register-check-grid`, 읽기 전용 주 회수(글자처럼), 추가 과목 버튼, 필수 `*` 빨강·픽프라임 `*` 남색.
- **하지 않는 것:** tutor-ui 아래 단계 버튼(`renderNavButtons`의 이전·다음·다음에 하기·저장)과 단계 표시, 안내 상자(`renderGuideNotice`). 모양 그대로.
- 기존 tutor-ui 규칙(`.tutor-lesson-step .form-radio…` 167~175행)은 지우지 않는다. 덮어쓰기만 한다.
- 새 색 코드 금지(이미 있는 `#dc2626`, `#0b2545`와 토큰만). `[data-fill]`·`--fill-*` 금지(`verify-input-fill-rule`).
- 마이페이지 14 덩어리(`mypage-ops-register.css`)는 손대지 않는다. 같은 규칙이 두 곳에 있는 것은 일부러다(공용 CSS·main.js를 안 건드리려고).

## 허용 파일 (이것만)

1. `preview/tutor-ui/src/screens/step-lesson.js` — A-2만(`feeCountBox` 도움말 + 인자 전달 1곳)
2. `preview/home-ui/src/tutor-reg/embedded-panels.js` — A-1의 인자 1개만
3. `preview/tutor-ui/src/styles/register.css` — 맨 끝 새 덩어리만
4. 기록 1개: `docs/worklog/2026/11/2026-11-18-tutor-reg-design-link.md`

## 금지

- **모든 `main.js`**.
- `preview/tutor-ui/src/screens/step-contact.js`(이번엔 마크업 변경 불필요), `step-detail.js`, `step-basic*`, `form-collect.js`, `save-flow.js`, `register-api.js`, `layout.js`, `state.js`.
- `preview/shared/*.css`, `home-ui/src/styles/*.css`(14 덩어리 포함), `tokens.css`.
- `tutor-reg/screens.js`, `profile-photos.js`, `study-room-reg/**`, `study-room-ui/**`, `auth-ui/**`.
- 칸 이름(`name`), `data-trc-field`, `data-action`, 검사·저장 흐름, `saveAndNavigate(registerState, 'lesson', '/register/contact')` 글자.
- PHP·SQL.

## 위험

| 위험 | 막는 법 |
|---|---|
| verify 실패 | 0단계 기준선과 끝난 뒤 결과가 같아야 한다. 다르면 PR 열지 말고 보고. |
| tutor-ui 화면에서 링크를 누르면 입력값이 사라짐 | 지금 아래쪽 「마이페이지에서 수정」 링크와 같은 동작이다. 수락 5에서 확인하고 기록만 한다. |
| 공부방 상세등록이 바뀜 | 선택자가 `form[data-form="lesson"|"contact"]`이고 파일이 tutor-ui 전용이다. 공부방 전후 캡처로 확인. |
| 마이페이지 화면이 14와 달라짐 | 마이페이지 CSS 무변경. 링크 글자만 바뀐다. 14 캡처와 비교. |

## 수락

1. 00-INDEX 「공통 수락 점검」 전부. 공부방·과외쌤·학생 계정으로 로그인해서 보이는 메뉴를 전부 누른다. **일반 창과 시크릿 창 둘 다.**
2. 마이페이지 상세정보1(산정방식 「주 단위」): 주 회수 아래 「기본정보 탭에서 수정」이 링크. 누르면 같은 창에서 기본정보 탭. 상세정보1로 돌아오면 저장 전에 입력한 값이 남아 있다.
3. 산정방식 「월 총 횟수」로 바꾸면 지금처럼 select가 나온다(링크 없음).
4. tutor-ui 과외쌤상세등록 「수업·가격」: 화면이 14 마이페이지와 같은 카드·2칸·알약 모양(1440px), 1칸(390px). 「학력·연락」도 같다. 아래 이전·다음·저장 버튼은 전과 같다.
5. tutor-ui 「마이페이지에서 수정」 링크 → 같은 창에서 마이페이지 내 등록.
6. 같은 값 저장·같은 검사 문구: tutor-ui 두 단계에서 전후 같은 값 저장, 같은 확인 창 문구(홍보 채널 잘못된 주소 등).
7. 전후 캡처 390px·1440px: tutor-ui 두 단계, 마이페이지 상세정보1·2, 공부방 상세등록(변화 없어야 함). 기록 문서에 경로.
8. 빌드 `npm run build:dothome`. Verify bundle은 지금 실패 중인 항목 말고 새 실패가 없어야 한다. 위 다섯 verify와 `verify-input-fill-rule`이 0단계 기준선과 같다.
9. **마지막 확인:** `git diff --stat origin/main...HEAD`에 허용 파일 4개만 나와야 한다. 다른 파일이 보이면 PR을 열지 말고 멈추고 보고. 결과를 PR 본문에 붙인다.
10. PR 본문에 0단계 보고(기준선 포함), 계정별 표(통과/실패, 캡처 경로). 비밀번호는 적지 않는다.

## Cursor 한 줄 명령

`14 PR 머지·운영 확인 뒤 최신 origin/main에서 docs/worklog/grok-sync/reapply-2026-11-17/14b-tutor-reg-design-link.md 그대로 실행. 먼저 0단계 진단(14 머지 확인, 함수·줄·허용 파일 확인, verify 기준선)을 보고하고, 애매하거나 허용 파일 4개 밖을 고쳐야 하면 고치지 말고 멈춰서 보고. 모든 main.js·step-contact.js·shared CSS·home-ui CSS 수정 금지. 수락 1~8을 공부방·과외쌤·학생 일반·시크릿 창 실클릭으로 확인하고, verify 결과가 기준선과 같고 git diff --stat에 허용 파일만 있는지 확인한 뒤 PR만, 머지 금지.`

## 되돌리기

`git revert -m 1 <이 PR merge 커밋>`으로 새 PR.
