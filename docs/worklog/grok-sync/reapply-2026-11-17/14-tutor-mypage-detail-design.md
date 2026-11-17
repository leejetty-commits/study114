# 14. 마이페이지 과외쌤 상세정보1·2 화면 다듬기 + 저장 알림을 토스트로

기준: `origin/main` `3046a9b3`. 작성: 우동공과3(검수). 코드 변경 없음. 문서만.
PR만 연다. 머지 금지. 11-18 종현 결정(상세 저장도 토스트, 필수 `*` 빨강·픽프라임 `*` 남색) 반영.
주 회수 링크와 tutor-ui 상세등록 화면은 **이 문서가 아니라 14b**에서 한다(14 머지·확인 뒤).

## 0단계 (필수) — 먼저 진단하고 보고. 고치기 전에.

1. `git fetch origin && git switch -c work/tutor-mypage-detail-design origin/main` 뒤 `git rev-parse --short HEAD`가 `3046a9b3`(또는 13 머지 뒤면 그 main)인지 적는다.
2. 아래 「지금 구조」의 함수·줄을 직접 열어 그대로인지 확인한다. 특히:
   - `tutor-reg/embedded-panels.js` `detailFormsHtml()`의 버튼 두 줄, `bindEmbeddedTutorDetail()`의 `await s114Alert('저장되었습니다.')`
   - `tutor-reg/screens.js` 저장 처리(약 705~733행) `basicSaveFlash = '저장되었습니다.'`, `showTutorBasicFeedback`
   - `detail-decision/detail-utils.js` `showP24Toast`
   - `mypage-ops-register.css` 996~1070행, 1142행
3. 고칠 줄 목록(파일:함수:줄)과 새 CSS 선택자 목록을 **먼저 보고**한다.
4. 문서와 다르거나, 애매하거나, **허용 파일 밖(특히 tutor-ui·shared CSS)을 고쳐야 할 것 같으면 멈추고 보고한다. 고치지 않는다.**

## 목적 (11-18 종현)

- 마이페이지 > 내 등록 > 과외쌤 **상세정보1**(수업·과목·가격)과 **상세정보2**(학력·경력·특징)의 디자인 질이 낮다.
- **모양만** 바꾼다. 칸 이름(name), 검사, 저장 API, 데이터 흐름은 그대로다.
- 기본정보 탭에서 저장하면 「저장되었습니다」가 폼 안 글자로만 떠서 저장된 느낌이 없다. 토스트로 바꾼다.
- 상세정보1·2 저장 성공도 확인 창 대신 같은 토스트로 바꾼다. 실패 알림은 그대로.

## 지금 구조 (직접 읽음)

- 두 탭을 그리는 곳: `preview/home-ui/src/tutor-reg/embedded-panels.js` `detailFormsHtml(tutor, section)`.
  - 상세정보1 = `renderLessonFormHtml({ includeStepNav: false, includeFooterActions: false, embed: true })` (`preview/tutor-ui/src/screens/step-lesson.js`)
  - 상세정보2 = `renderContactFormHtml({ … embed: true })` (`preview/tutor-ui/src/screens/step-contact.js`) + 프로필 사진 `renderTutorProfilePhotoEditor(tutor)` (`tutor-reg/profile-photos.js`)
  - 감싸는 칸: `<div class="mp-room-embed register-flow" data-embed-section="detail|detail2" data-embed-tutor-id="…">`
  - 그 밑에 `.register-embed-actions` 두 줄: (취소·저장) 그리고 (등록점검·마이프로필). 둘 다 `btn--secondary`인데, `mypage-ops-register.css` 1033행이 「취소 아닌 secondary」를 진한 버튼으로 칠한다. 그래서 저장·등록점검·마이프로필이 똑같이 진한 버튼 세 개로 보인다.
- **step-lesson.js·step-contact.js는 tutor-ui 과외쌤상세등록 화면과 같은 HTML이다.** 여기를 고치면 그 화면도 바뀌고, 여러 verify 스크립트(`verify-tutor-basic-required`, `verify-tutor-lesson-optional-step`, `verify-tutor-register-same-tab`, `verify-tutor-detail-fields-ssot`, `verify-tutor-registration-check-frame`)가 이 두 파일 글자를 검사한다. → **이번엔 두 파일을 고치지 않는다.** 모양은 마이페이지 범위 CSS로만 바꾼다.
- 지금 CSS
  - 공용: `preview/shared/register-flow.css`(`.register-grid-2`, `.register-check-grid`, 과외쌤 라디오 637~677행, `.tutor-lesson-step .form-input--readonly`), `preview/shared/register-form-primitives.css`(`.register-flow .form-radio`, `.form-check`, `*` 표시).
  - 마이페이지: `preview/home-ui/src/styles/mypage-ops-register.css` 996~1070행 `.mp-room-embed.register-flow …`, 1142행 `.register-embed-actions`.
  - 라디오 선택 강조 `.register-flow .form-radio:has(.form-radio__input:checked)`는 **과외쌤 폼에선 안 먹는다.** 과외쌤 라디오 `<input>`에 `form-radio__input` 클래스가 없다. 체크박스(강의장소·강의스타일·증빙서류)는 맨 체크박스다.
  - `.mp-room-embed.register-flow`는 지금 과외쌤 상세 탭만 쓴다(공부방 쪽은 `.mp-room-embed is-loading`만). 그래도 새 규칙은 `[data-embed-tutor-id]`까지 붙여 과외쌤으로 묶는다.
- 저장 알림
  - 기본정보: `tutor-reg/screens.js` 저장 처리(705~733행). 성공하면 `basicSaveFlash = '저장되었습니다.'` → 다시 그릴 때 529행 `<p class="p21-save-feedback" data-p21-save-feedback role="status">`에 초록 글자. 실패하면 `showTutorBasicFeedback(form, 'error', …)`로 같은 칸에 빨간 글자.
  - 상세정보1·2: `embedded-panels.js` 저장 처리. 성공하면 `await s114Alert('저장되었습니다.')` — **글자가 아니라 확인 창**이다. 실패도 `s114Alert`.
  - 이미 있는 토스트: `preview/home-ui/src/detail-decision/detail-utils.js` `showP24Toast(message, opts)`. `#p24-toast`, `role="status"`, `aria-live="polite"`, 2.2초 뒤 사라짐. CSS는 `home-member-flows-account.css` 63~76행(화면 아래 가운데). 쪽지 보내기(`messages/overlays.js`)·찜·비교에서 쓰고 있다. `home-ui/src/main.js` `dismissRouteOverlays()`가 해시가 바뀔 때 이 토스트를 끈다.

## 바꿀 것

### A. 기본정보 저장 알림 → 토스트 (`tutor-reg/screens.js`)

1. `import { showP24Toast } from '../detail-decision/detail-utils.js';` 추가.
2. 성공 경로에서 `basicSaveFlash = '저장되었습니다.';` 줄을 뺀다. `rerender();` 다음 줄에 `if (kind === 'basic') showP24Toast('저장되었습니다.');`.
   - `?return=registration-check`로 등록점검에 돌아가는 경로는 지금도 글자를 지우고 이동한다. 그대로 둔다(토스트 없음).
3. 실패 경로 `showTutorBasicFeedback(form, 'error', …)`는 **그대로.** 빨간 글자 칸(`data-p21-save-feedback`)도 그대로 둔다.
4. `basicSaveFlash`·`takeBasicSaveFlash()`는 지우지 않는다(다른 줄 손대지 않기). 값만 더는 안 채워진다.
5. `tutor-reg/screens.js`의 `if (kind !== 'basic') await s114Alert('저장되었습니다.');`(다른 p21 폼)는 그대로.

### A2. 상세정보1·2 저장 알림 → 토스트 (`embedded-panels.js` `bindEmbeddedTutorDetail()`)

1. `import { showP24Toast } from '../detail-decision/detail-utils.js';` 추가. `s114Alert` import는 실패 알림에 계속 쓰므로 남긴다.
2. 성공 끝부분을 이렇게 바꾼다(순서 주의: 토스트는 다시 그린 **뒤**, 해시 이동 경로에서는 띄우지 않는다).
   ```diff
   -      await s114Alert('저장되었습니다.');
          if (isReturnToRegistrationCheck()) {
            window.location.hash = tutorSectionPath(tutorId, 'publish');
            return;
          }
          rerender();
   +      showP24Toast('저장되었습니다.');
   ```
3. 검사 실패(`s114Alert(lessonErr)`, `s114Alert(urlErr)`)와 저장 실패(`s114Alert(err.message …)`)는 **그대로.**
4. `withSaving`, `saveAndNavigate` 순서(lesson / career → contact), `hydrateRegistrationsCache` 호출은 그대로.

### B. 상세정보1·2 화면 (CSS + `embedded-panels.js` 감싸는 마크업만)

새 CSS는 `mypage-ops-register.css` **맨 끝에 한 덩어리**로 붙인다. 모든 선택자는 `.mp-room-embed.register-flow[data-embed-tutor-id]`로 시작한다. 값은 기존 토큰만 쓴다(`--space-*`, `--radius-surface`, `--radius-control`, `--gray-*`, `--brand-blue`, `--brand-blue-light`, `--text-*`, `--btn-tone-*`). 새 색 코드는 넣지 않는다. `[data-fill]` 선택자와 `--fill-*` 변수는 쓰지 않는다(`verify-input-fill-rule`).

1. **카드로 묶기**
   - `form[data-form]`을 흰 카드로: 1px `--gray-200` 테두리, `--radius-surface`, 안쪽 여백 `--space-6`(모바일 `--space-4`), 최대 폭 64rem.
   - `.register-section-title`을 카드 머리로: 아래 1px 선, 아래 여백 `--space-4`. 두 번째 제목(상세정보2의 홍보 채널)은 위에 선과 여백 `--space-6`을 줘서 구역을 나눈다.
   - 상세정보2 프로필 사진(`> [data-trc-field="profile_image"]`)은 별도 카드(같은 카드 모양).
   - 맨 위 안내 글(상세정보1 주력과목 `.form-hint`, 상세정보2 `* 표시는…`)은 카드 안 작은 회색 글로.
2. **넓은 화면 2칸, 좁은 화면 1칸**
   - 1024px 이상: `form[data-form]`을 `display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: var(--space-5) var(--space-6)`. 안의 `.register-grid-2`는 `display: contents`.
   - 기본은 한 줄 전체(`grid-column: 1 / -1`). 반 칸으로 둘 것만 `data-trc-field`로 고른다.
     - 상세정보1 반 칸: `student_target`, `student_count_group`, `fee_basis`, `lessons_per_week`, `monthly_session_count`. 나머지(과외쌤 연령대, 추가 과목, 가격 설명, 강의장소)는 전체.
     - 상세정보2 반 칸: `university`, `major_name`, `main_material_note`, `feature_1`, `feature_2`, `feature_3`, `contact_time_note`. 나머지(학적상태, 경력구간, 증빙서류, 강의스타일, 상세 소개, 홍보 채널)는 전체.
   - 1023px 이하: 한 칸. `.register-form-narrow`의 40rem 제한은 이 범위에서 푼다(카드 최대 폭을 따른다).
3. **간격 맞추기**
   - 이 범위의 `.form-group` 바깥 여백은 0, 줄 사이는 grid `gap`이 맡는다. 라벨과 칸 사이 `--space-2`, 칸과 도움말 사이 `--space-1`.
   - `.form-label`은 `--text-sm`, 굵기 600, `--gray-700`. 도움말 `.form-hint`는 `--text-xs`, `--gray-500`.
4. **라디오·체크박스를 같은 알약 모양으로**
   - 라디오 선택 강조: `.form-radio:has(input:checked)` → `--brand-blue` 테두리 + `--brand-blue-light` 바탕(클래스 없이 `input`으로 잡는다).
   - 체크박스(강의장소·강의스타일·증빙서류) `.form-check`: 라디오와 같은 테두리·높이(최소 44px)·둥글기·안쪽 여백. 선택되면 같은 강조. 체크박스 자체는 보이게 두고 `accent-color: var(--brand-blue)`.
   - `.register-check-grid`: `repeat(auto-fill, minmax(8.5rem, 1fr))`, gap `--space-2`. 430px 이하 2칸. 강의장소가 들쭉날쭉 퍼지는 것과 강의스타일 4칸 어긋남을 같이 고친다.
   - 과외쌤 연령대가 두 줄로 꺾이는 것: 전체 폭 + 1024px 이상 `repeat(4, max-content)` 유지, 그 아래는 줄바꿈 허용.
5. **읽기 전용 칸(주 회수)**
   - `.form-input--readonly`를 입력칸처럼 보이지 않게: 테두리·바탕 없음, 안쪽 여백 0, 굵기 600, 높이 자동. 옆/아래 「기본정보 탭에서 수정」 도움말은 그대로 회색 글.
   - 링크로 바꾸는 것은 14b에서 한다(`step-lesson.js`를 고쳐야 해서).
6. **추가 과목**
   - `[data-trc-field="subjects"] > .form-hint:first-child`(「추가 과목 (선택)」)를 라벨 모양으로.
   - `[data-action="add-subject"]`를 전체 폭 점선 테두리 버튼(높이 44px)으로. `data-action`·글자는 그대로.
7. **`*` 표시**
   - 표시를 더하거나 빼지 않는다(`verify-tutor-basic-required`).
   - 이 범위에서 필수(`.form-label--required`, 지금 산정방식 하나)는 `*`를 빨강(`.register-required-mark`와 같은 `#dc2626` — 이미 있는 값)으로, 픽·프라임(`.form-label--tier`)은 남색(`#0b2545`, 지금 값) 그대로. (종현 결정 11-18)
8. **아래 버튼 정리** — `embedded-panels.js` `detailFormsHtml()`만
   - 첫 줄을 `<div class="register-embed-actions tde-actionbar">`로: 취소 `btn btn--secondary` (그대로), 저장은 `btn btn--primary`로 클래스만 바꾼다. `data-action="cancel-detail"`·`"save-detail"`은 그대로.
   - 둘째 줄을 `<nav class="tde-links" aria-label="등록 바로가기">`로 바꾸고, 안의 두 `<a>`는 클래스를 `tde-link`로. `href`·`data-p21-nav`는 그대로. 보기: 「등록점검 · 마이프로필」 작은 글자 링크.
   - `.tde-actionbar`: `position: sticky; bottom: 0;` 흰 바탕, 위 1px 선, 위아래 `--space-3`, 오른쪽 정렬(모바일은 두 버튼 반반 전체 폭), z-index는 토스트(1100)보다 낮게. 버튼 높이 `--btn-tone-h`.
   - 기존 `mypage-ops-register.css` 1033행(취소 아닌 secondary를 진하게)은 지우지 않는다. 저장이 `btn--primary`가 되면 그 규칙에 안 걸린다. 링크는 `btn`이 아니라서 안 걸린다.

## 허용 파일 (이것만)

1. `preview/home-ui/src/tutor-reg/embedded-panels.js` — `detailFormsHtml()` 안의 버튼 두 줄 마크업(B-8) + import 1줄과 성공 알림(A2)만
2. `preview/home-ui/src/styles/mypage-ops-register.css` — 맨 끝에 범위 묶은 새 덩어리만. 기존 줄 수정 금지
3. `preview/home-ui/src/tutor-reg/screens.js` — import 1줄, 성공 경로 2곳(A-1, A-2)만
4. 기록 1개: `docs/worklog/2026/11/2026-11-18-tutor-mypage-detail-design.md` (전후 캡처 경로 포함)

## 금지

- **모든 `main.js`.** 토스트 끄기(`dismissRouteOverlays`)도 손대지 않는다.
- `preview/tutor-ui/**` 전부(특히 `screens/step-lesson.js`, `screens/step-contact.js`, `form-collect.js`, `save-flow.js`, `register-api.js`, `styles/register.css`). tutor-ui 과외쌤상세등록 화면은 그대로다.
- `preview/shared/*.css`(`register-flow.css`, `register-form-primitives.css`, `input-fill.css`), `home-ui/src/styles/tokens.css`, `home-member-flows*.css`.
- `detail-decision/detail-utils.js`(가져다 쓰기만), `confirm-dialog.js`, `profile-photos.js`, `tutor-profile-photos.css`.
- `study-room-reg/**`와 공부방 상세 화면 CSS.
- 칸 이름(`name`), `data-trc-field`, `data-action`, `data-p21-nav`, 검사 문구, 저장 순서(`saveAndNavigate` lesson / career / contact), 등록점검 이동 경로.
- PHP·SQL.

## 위험

| 위험 | 막는 법 |
|---|---|
| tutor-ui 상세등록 화면도 바뀜 | 선택자를 `.mp-room-embed.register-flow[data-embed-tutor-id]`로 시작. tutor-ui 파일 무변경. |
| 공부방 상세등록이 바뀜 | 공부방은 이 속성을 안 쓴다. 공부방 상세 화면 전후 캡처로 확인. |
| sticky 버튼줄이 다른 고정 요소와 겹침 | 모바일 390px에서 맨 아래까지 스크롤해 프로필 사진·홍보 채널이 가려지지 않는지 본다. 겹치면 sticky를 빼고 일반 줄로 둔다(보고). |
| 토스트가 바로 꺼짐 | 저장 뒤 해시가 안 바뀌는 경로에서만, `rerender()` 뒤에 띄운다. 등록점검으로 돌아가는 경로는 알림 없음(기본정보는 지금과 같고, 상세는 확인 창이 없어진다 — 이동 자체가 저장 완료 신호). |
| 확인 창이 없어져 저장을 못 느낌 | 토스트 2.2초, 화면 아래 가운데. 수락 6·8에서 눈으로 확인. |
| `:has()` 미지원 브라우저 | 강조만 안 보이고 선택은 된다. 동작 영향 없음. |
| verify 실패 | 위 5개 tutor verify와 `verify-input-fill-rule`을 돌려 전과 같은 결과인지 적는다. |

## 수락

1. 00-INDEX 「공통 수락 점검」 전부. 공부방·과외쌤·학생 계정으로 로그인해서 보이는 메뉴를 전부 누른다. **일반 창과 시크릿 창 둘 다.**
2. 과외쌤: 마이페이지 > 내 등록 > 기본정보 / 상세정보1 / 상세정보2 탭을 메뉴로 눌러 오간다. 멈춤 없음, `__renderCount` 5초 두 번 같은 값.
3. 전후 캡처: 390px과 1440px, 상세정보1·2 각각(맨 위·맨 아래), 기본정보 저장 직후. 기록 문서에 경로를 적는다.
4. **같은 값 저장:** 전(main)과 후(PR)에서 같은 값을 넣고 저장 → 다시 열어 모든 칸이 같다. 등록점검 보드의 상세 항목 채움 표시도 같다.
5. **같은 검사 문구:** 상세정보2 홍보 채널에 잘못된 주소 → 전과 같은 확인 창 문구. 상세정보1 검사(`validateLessonState`)에 걸리는 값 → 같은 문구. 기본정보에서 필수 칸을 비우고 저장 → 전과 같은 빨간 글자(인라인 그대로).
6. 기본정보 저장 성공 → 화면 아래 가운데 토스트 「저장되었습니다.」가 약 2초 뒤 사라진다. 폼 안 초록 글자는 안 나온다. 스크린리더용 `role="status"`/`aria-live="polite"` 확인(F12 Elements).
7. 등록점검에서 「기본정보 수정」으로 들어가 저장 → 지금처럼 등록점검으로 돌아간다.
8. 상세정보1·2 저장 성공 → 확인 창 없이 토스트 「저장되었습니다.」(약 2초). 검사·저장 실패는 전과 같은 확인 창. 취소 → 저장된 값으로 되돌림. 등록점검·마이프로필 링크가 같은 곳으로 간다. 등록점검에서 들어와 저장 → 등록점검으로 돌아간다.
9. 체크박스 선택·해제가 알약 강조와 같이 바뀐다. 강의스타일 5번째 선택은 지금처럼 막힌다.
10. tutor-ui 과외쌤상세등록(수업·가격, 학력·연락) 화면 전후 캡처가 같다. 공부방 마이페이지 상세 화면 전후 캡처가 같다.
11. 빌드 `npm run build:dothome`. Verify bundle은 지금 실패 중인 4건(Hide inquiry bundle, Tutor search fields, Tutor basic required, Student hope hidden required) 말고 새 실패가 없어야 한다.
12. **마지막 확인:** `git diff --stat origin/main...HEAD`에 위 허용 파일 4개만 나와야 한다. tutor-ui·shared 파일이 하나라도 보이면 PR을 열지 말고 멈추고 보고. 결과를 PR 본문에 붙인다.
13. PR 본문에 0단계 보고, 계정별 표(통과/실패, 캡처 경로). 비밀번호는 적지 않는다.

## 다음

- 14b(`14b-tutor-reg-design-link.md`): 주 회수 링크 + tutor-ui 상세등록 화면에 같은 디자인. **이 14가 머지되고 운영 확인이 끝난 뒤에만** 시작한다.

## Cursor 한 줄 명령

`최신 origin/main에서 docs/worklog/grok-sync/reapply-2026-11-17/14-tutor-mypage-detail-design.md 그대로 실행. 먼저 0단계 진단(함수·줄·CSS 선택자·허용 파일 확인)을 보고하고, 애매하거나 허용 파일 4개 밖을 고쳐야 하면 고치지 말고 멈춰서 보고. 모든 main.js·tutor-ui·shared CSS 수정 금지. 칸 이름·검사·저장 흐름 무변경, 성공 알림만 토스트. 수락 1~11을 공부방·과외쌤·학생 일반·시크릿 창 실클릭으로 확인하고, git diff --stat에 허용 파일만 있는지 확인한 뒤 PR만, 머지 금지.`

## 되돌리기

`git revert -m 1 <이 PR merge 커밋>`으로 새 PR.
