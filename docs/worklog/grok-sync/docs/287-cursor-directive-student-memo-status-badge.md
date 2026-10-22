# 287 지시서 — 학생 쪽지설정에 현재 상태 배지 넣기

- 결정: 종현 승인 2026-10-23 (문구는 과외쌤 화면 말투와 같게)
- 기준(base): origin/main `f6a1b76e`(Merge 284) 또는 그보다 새것 (`git fetch` 후 확인)
- 새 브랜치: `cursor/287-student-memo-status-badge-20261023`
- 순서: **285 → 286 다음**

## 목표

학생 마이페이지 「쪽지설정」(P19-05)에 **지금 저장된 쪽지 수신 상태**를 배지로 보여 준다. 공부방·과외쌤 쪽지설정에는 「현재상태」 배지가 있는데 학생 화면에만 없다.

---

## 0. 앞 지시서 결과 확인 (시작 전에 꼭)

아래가 모두 **main에 들어 있는지** 확인한다. 하나라도 아니면 멈추고 보고.

```bash
git fetch origin
for c in 0b7c7bde de553125 43b85a6c f068ecb8 620cad0e b7164bf6 93b5fba3 f6a1b76e; do
  git merge-base --is-ancestor $c origin/main && echo "OK $c" || echo "MISSING $c"
done
git log origin/main --oneline --grep="Merge 285"
git log origin/main --oneline --grep="Merge 286"
```

| 커밋 | 내용 |
|---|---|
| 0b7c7bde | Merge 275 |
| de553125 | Merge 283 |
| 43b85a6c | Merge 283-1 |
| f068ecb8 | Merge 278 |
| 620cad0e | Merge 240 |
| b7164bf6 | Merge 279 |
| 93b5fba3 | Merge 276 |
| f6a1b76e | Merge 284 |
| (Merge 285) | 285 보안 — main에 들어 있어야 시작 |
| (Merge 286) | 286 관리자 댓글 삭제 — main에 들어 있어야 시작 |

- 285나 286 merge가 안 보이면 시작하지 말고 보고.
- main 최신 커밋의 **Verify bundle**이 초록인지 확인. 빨강이면 시작하지 말고 보고.
- 아래 줄 번호는 main `f6a1b76e` 기준이다. `git log f6a1b76e..origin/main --oneline -- preview/home-ui/src/student-reg/screens.js preview/home-ui/src/student-memo-status.js` 로 그 뒤 바뀐 게 있으면 함수 이름 기준으로 다시 찾고, 바뀐 줄 번호를 보고에 적는다.

---

## 1. 지금 상태 (main f6a1b76e 기준)

- `preview/home-ui/src/student-reg/screens.js:191` → `renderSettings(student)` 호출
- `:468-497` `renderSettings`
  - `:469` `const status = student.memo_status === 'paused' ? 'paused' : 'open';`
  - `:474` 제목 「쪽지 수신」
  - `:478-489` 동그라미 선택 「받음」(`open`) / 「안 받음」(`paused`)
  - `:493` 「저장」 버튼
  - **설명 글도, 현재 상태 배지도 없다.**
- 저장: `:660-667` `memo_status`만 보냄 → `updateStudent`(`student-reg/store.js:137`) → `:721` 「저장되었습니다.」 → `:722` `rerender()`
- `preview/home-ui/src/student-memo-status.js` (20줄): `isStudentMemoReceiving`, `studentMemoContactLabel`(카드용 「쪽지 받는 중」/「지금은 쪽지 안 받음」)이 있음
- 비교 — 과외쌤: `preview/home-ui/src/tutor-reg/inquiries-render.js:34-66`, 배지 `:58` 근처 `<span class="p21-inq-badge p21-inq-badge--${on|off}">`, 문구 `tutor-reg/inquiries-copy.js:13-14`
- 배지 모양 CSS: `preview/home-ui/src/styles/home-member-flows.css:2391-2410` `.p21-inq-badge`, `--on`(초록), `--off`(회색) — 범위 제한 없는 전체 규칙이라 학생 화면에서도 그대로 쓸 수 있다.
  - (`inquiry-settings-catalog.css:51-70`의 규칙은 `[data-p20-inquiries]`/`[data-p21-inquiries]` 안에서만 적용된다. 학생 화면에 이 속성을 **붙이지 않는다** — 공급자 화면용 다른 규칙이 같이 걸릴 수 있음.)

---

## 2. 할 일 (이것만)

### 2-1. 문구 — `preview/home-ui/src/student-memo-status.js`

아래를 **추가**한다(기존 함수·문구는 그대로).

```js
/** 학생 쪽지설정(P19-05) 화면 문구 — 과외쌤 쪽지설정 말투와 같게 (287) */
export const STUDENT_MEMO_SETTINGS_COPY = {
  lead: '선생님·공부방이 나에게 쪽지를 보낼 수 있는지 정해요.',
  badgeReceiving: '지금은 쪽지 받는 중',
  badgeClosed: '지금은 쪽지 안 받음',
};

/** @param {string|null|undefined} status 저장된 memo_status */
export function studentMemoSettingsBadge(status) {
  const on = isStudentMemoReceiving(status ?? 'open');
  return {
    on,
    label: on ? STUDENT_MEMO_SETTINGS_COPY.badgeReceiving : STUDENT_MEMO_SETTINGS_COPY.badgeClosed,
  };
}
```

- 문구는 위 3개를 **글자 그대로** 쓴다(띄어쓰기 「안 받음」 포함).
- 이름은 바꿔도 되지만, 문구는 이 파일에만 둔다. `screens.js`에 문구 글자를 직접 쓰지 않는다.

### 2-2. 화면 — `preview/home-ui/src/student-reg/screens.js` `renderSettings` (:468-497)

- 맨 위 import에 `STUDENT_MEMO_SETTINGS_COPY`, `studentMemoSettingsBadge`를 `../student-memo-status.js`에서 가져온다(import 줄 하나 추가만).
- `renderSettings` 안:
  1. `:469` 바로 아래에서 `const badge = studentMemoSettingsBadge(student.memo_status);`
  2. 섹션 머리(`:472-475` `<header class="p19-form-section__head">`) 안, 제목 「쪽지 수신」 **아래**에:
     - 설명 한 줄: `<p class="p19-form-section__lead">${STUDENT_MEMO_SETTINGS_COPY.lead}</p>` (이미 다른 학생 섹션에서 쓰는 설명 클래스가 있으면 그것을 쓴다 — 같은 파일 안에서 찾기. 없으면 새 클래스 이름만 붙이고 CSS는 만들지 않는다)
     - 배지 한 줄: `<p class="p19-memo-status" data-p19-memo-status="${badge.on ? 'open' : 'paused'}"><span class="p21-inq-badge p21-inq-badge--${badge.on ? 'on' : 'off'}">${badge.label}</span></p>`
  3. 동그라미 선택·저장 버튼·폼 속성은 **그대로**.
- **배지는 저장된 값만 보여 준다.** 동그라미를 눌러도 저장 전에는 배지가 바뀌지 않는다(공부방·과외쌤과 같음). 저장 성공 → `:722` `rerender()`로 다시 그려질 때 새 저장값으로 바뀐다.
  - rerender가 저장 뒤의 새 `memo_status`를 쓰는지 꼭 확인한다(`updateStudent` 뒤 학생 기록이 새로 고쳐지는지). 안 바뀌면 → `screens.js` 안 저장 처리(`:660-723`)에서 settings일 때만 최소로 맞춘다. 그래도 안 되면 **멈추고 보고**(store.js·API는 고치지 않음).
- 문자열은 이미 정해진 상수라 HTML 이스케이프가 필요 없지만, 파일 안에 `esc` 같은 함수를 쓰는 관례가 있으면 따른다.

### 바꿔도 되는 파일 (이것만)

| 파일 | 바꾸는 곳 |
|---|---|
| `preview/home-ui/src/student-memo-status.js` | 2-1 추가 |
| `preview/home-ui/src/student-reg/screens.js` | import 한 줄, `renderSettings`(:468-497), 필요하면 저장 처리 settings 부분(:660-723)만 |
| `scripts/verify-*.mjs` 새 점검 1개 | 선택 — 아래 4-2 |

**그 밖의 파일은 고치지 않는다. 범위 밖이 필요하면 멈추고 보고.**

---

## 3. 하지 않는 것

- API(`/api/registrations/students.php`), `store.js`, 서버(`StudentHubRepository.php` 등), DB(`memo_status` 값·기본값) 고치기
- CSS 파일 고치기(배지 모양은 기존 `.p21-inq-badge--on/off`를 빌려 씀). 모양이 안 맞으면 멈추고 보고
- 공부방·과외쌤 쪽지설정 화면, 문구, `studentMemoContactLabel`(카드 문구) 바꾸기
- 「받음」/「안 받음」 선택지 이름, 「쪽지 수신」 제목, 「저장되었습니다.」 알림 바꾸기
- 공급자 화면처럼 「현재상태」/「현재상태 수정」 흰 카드 2개 구조로 바꾸기
- **`docs/ssot/19-student-registration-management.md`의 옛 이름 「공개설정」(`:71`, `:88`, `:212`, `:279`) 고치기** — 이번 범위 밖. 보고에 "남아 있음"이라고만 적는다
- 점검(CI) 끄기·skip·약하게 하기

---

## 4. 점검

### 4-1. 로컬 (/tmp/s114) — 새 테스트 계정만

- 기존 데이터는 바꾸거나 지우지 않는다. **새로 만든 학생 테스트 계정**으로만 확인한다.
1. 새 학생 계정으로 `#/mypage/registrations/students/{id}/settings` 열기
2. 저장값 받음(`open`) → 설명 한 줄 + 초록 배지 「지금은 쪽지 받는 중」
3. 「안 받음」을 누름 → **저장 전에는 배지 그대로**
4. 저장 → 「저장되었습니다.」 → 회색 배지 「지금은 쪽지 안 받음」. 새로고침해도 같음. DB `students.memo_status = 'paused'`
5. 다시 「받음」 저장 → 초록 배지로 돌아옴
6. 마이프로필·기본정보·상세정보 탭, 공부방·과외쌤 쪽지설정 화면이 그대로(눈으로 확인)
7. **캡처 4장**(받음·안 받음 × 1280·390), 화면 전체:
   - `student-memo-badge-open-1280.png`, `student-memo-badge-open-390.png`
   - `student-memo-badge-paused-1280.png`, `student-memo-badge-paused-390.png`
   - 390에서 배지와 글이 넘치거나 겹치지 않는지 확인
   - 저장소에 캡처를 커밋하지 않는다. 보고에 경로만 적는다

### 4-2. 점검 스크립트 (선택)

- 새 점검을 만든다면: `renderSettings`에 `open`/`paused`를 넣어 배지 글자와 `p21-inq-badge--on/off`가 맞는지만 본다. `package.json`에 스크립트를 넣고 CI에 붙이는 일은 **하지 않는다**(파일 범위 밖). 만들었으면 로컬에서 돌린 결과를 보고.

### 4-3. CI (브랜치 push 뒤)

- **Verify bundle** 전부 초록, 그 밖에 이 push로 돈 점검 모두 초록
- 빨강이 있으면 이 지시서 때문인지 먼저 보고, 아니면 손대지 말고 보고

## 5. 합격 기준

- 2번 표의 파일·줄만 바뀜(`git diff --stat`)
- 4번 점검 모두 통과, CI 모두 초록, 캡처 4장

## 6. push

- 커밋할 때 **`git add -A` 금지.** 바꾼 파일을 이름으로 하나씩 `git add`
- 브랜치 `cursor/287-student-memo-status-badge-20261023` 에만 push
- **merge 금지, force-push 금지**
- 보고: 바꾼 파일과 줄, 저장 뒤 배지가 바뀌는지 결과, 캡처 4장 경로, CI 결과, ssot/19 「공개설정」 옛 이름이 남아 있다는 기록

**범위 밖이 필요하면 멈추고 보고.**
