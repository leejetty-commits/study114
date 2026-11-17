# 08. 쪽지 상태 문구 + 학생 반대 분기 공부방찾기 「지역 없음」 표시

기준: `origin/main` `c4f673c6`(PR #245). 표시 문구·마크업만 바꾼다. 진입·지역 결정 로직은 그대로다.
작성: 우동공과3(검수). 문서만.

## 명령

```
git fetch origin
git switch -c work/08-msg-status-opposite origin/main
# 아래 A·B 수정 (A·B 커밋 분리)
npm run build:dothome
```

## 허용 파일 (이것만)

1. `preview/home-ui/src/screens/study-room.js` (A)
2. `preview/home-ui/src/screens/tutor.js` (A)
3. `scripts/verify-study-room-box-shape.mjs` (A, 158행 기대 문구 1곳만)
4. `preview/search-ui/src/search-map.js` (B)
5. `preview/shared/naver-map.js` (B)
6. 기록 `docs/worklog/2026/11/2026-11-17-msg-status-opposite-branch.md` (+ 캡처 `docs/worklog/2026/11/shots-msg-status-opposite/*.png`)

금지: 위 밖 모든 파일. `preview/home-ui/src/main.js`. CSS 파일 전부(새 규칙·전역 CSS·`!important`·`display:none` 금지). 상태 값을 만드는 함수(`study-room-home-seed.js` `inquiryWord`·`readStudyRoomMemberBox`, `tutor-home-seed.js` `inquiryText`·`readTutorMemberBox`) 수정 금지. `location-display.js`의 상수·`memberPlacePrompt`·`studentPlacePromptFor` 수정 금지. `REGION_PROMPT_MAP_STATUS` 상수 값 수정 금지(`verify-map-center-by-role.mjs` 457행이 지킨다). capture 클릭 가로채기·새 이벤트 리스너·`rerender()` 호출 추가 금지. 포맷 정리·리팩터·주석 손질 금지.

---

## A. 쪽지 상태 문구 (11-17 종현 승인)

규칙:
- 쪽지 받는 중: `쪽지 받는 중`. 안 읽은 쪽지가 1개 이상일 때만 뒤에 ` · 안 읽은 쪽지 N개`.
- 쪽지 끔(paused·not_accepting): `쪽지 받지 않음`. 안 읽은 쪽지가 1개 이상 남아 있으면 ` · 안 읽은 쪽지 N개`를 붙인다(11-17 종현 동의: 끄기 전 쪽지를 놓치지 않게).
- 상태를 아직 모름(등록 정보 없음, 지금 `—`): 안 읽은 쪽지가 있으면 `안 읽은 쪽지 N개`, 없으면 `—`.

나오는 곳은 3곳이다(`rg "미확인" preview` 확인, 다른 화면 없음).

### A-1. `preview/home-ui/src/screens/study-room.js`

`box.inquiry`는 `'받음' | '안받음' | '—'`(seed `inquiryWord`, 그대로).

`statCell` 함수(40~42행) 바로 아래에 추가:

```js
/** 쪽지 상태 한 줄. 안 읽은 쪽지(1개 이상)는 받는 중·끔 모두 붙인다. (11-17 종현) */
function inquiryStatusText(box) {
  const n = Number(box.unread) > 0 ? Number(box.unread) : 0;
  const unreadText = n >= 1 ? `안 읽은 쪽지 ${n}개` : '';
  if (box.inquiry === '안받음') return unreadText ? `쪽지 받지 않음 · ${unreadText}` : '쪽지 받지 않음';
  if (box.inquiry === '받음') return unreadText ? `쪽지 받는 중 · ${unreadText}` : '쪽지 받는 중';
  return unreadText || '—';
}
```

92행 전:
```js
...data-study-room-unread>${esc(`쪽지 ${box.inquiry} · ${box.unread}개 미확인`)}</strong>...
```
후:
```js
...data-study-room-unread>${esc(inquiryStatusText(box))}</strong>...
```

145행(`hookUnreadAfterSnapshot` 안) 전:
```js
    el.textContent = `쪽지 ${box.inquiry} · ${box.unread}개 미확인`;
```
후:
```js
    el.textContent = inquiryStatusText(box);
```

### A-2. `preview/home-ui/src/screens/tutor.js`

`box.inquiry`는 `'쪽지 받음' | '쪽지 안받음' | '—'`(seed `inquiryText`, 그대로).

`statCell` 함수(84~86행) 바로 아래에 추가:

```js
/** 쪽지 상태 한 줄. 안 읽은 쪽지(1개 이상)는 받는 중·끔 모두 붙인다. (11-17 종현) */
function tutorInquiryStatusText(box) {
  const n = Number(box.unread) > 0 ? Number(box.unread) : 0;
  const unreadText = n >= 1 ? `안 읽은 쪽지 ${n}개` : '';
  if (box.inquiry === '쪽지 안받음') return unreadText ? `쪽지 받지 않음 · ${unreadText}` : '쪽지 받지 않음';
  if (box.inquiry === '쪽지 받음') return unreadText ? `쪽지 받는 중 · ${unreadText}` : '쪽지 받는 중';
  return unreadText || '—';
}
```

102행 전:
```js
      statCell('상태', escTutor(`${box.inquiry} · ${box.unread}개 미확인`)),
```
후:
```js
      statCell('상태', escTutor(tutorInquiryStatusText(box))),
```

(`verify-tutor-box-real-values.mjs` 43행 「tutor.js에 `쪽지 받음 ·` 없음」, 196행 `box.inquiry === '쪽지 받음'`은 그대로 통과한다. seed를 안 건드리기 때문이다.)

### A-3. `scripts/verify-study-room-box-shape.mjs` 158행

`box.includes('쪽지 받음 · 0개 미확인')` → `box.includes('쪽지 받는 중') && !box.includes('미확인')`. 이 줄의 다른 조건은 그대로.

커밋: `08 fix(home): 쪽지 상태 문구 「쪽지 받는 중 · 안 읽은 쪽지 N개」`

---

## B. 학생 반대 분기 공부방찾기 「지역 없음」 표시

정본 대조(문서 근거):
- 241(`ds/docs/241-cursor-directive-student-find-both.md`): 반대쪽 찾기는 처음 현재위치를 비워 두고 그 화면에서 지역을 고른다. → 진입 로직 그대로. 이번 작업은 건드리지 않는다.
- 255(`ds/docs/255-find-place-prompt-decision-2026-10-18.md`)·256(`docs/worklog/grok-sync/docs/256-cursor-directive-menu-flicker.md` §4): 반대 분기 안내는 「아래 검색창에서 지역을 선택하여 검색하세요」, 희망지역 등록을 유도하지 않는다. 자기 분기 미등록 안내는 그대로.
- SSOT 13 §2: 공부방찾기 진입은 필터 비움·현재위치·지도·현황만 기본. 충돌 없음.
- 현재위치 줄(`search-find-surface.js` 158·208·425행)은 이미 256대로 반대 분기 문구를 쓴다. 그대로 둔다.

지금 문제(과외 분기 학생 → 공부방찾기, 지역 없음):
- 지도 위 박스: `search-map.js` 151~157행 `heading`이 `memberPlacePrompt('parent')` = 「아래 검색창에서…」를 지역 이름용 큰 제목(`hero-map__dong`)에 넣는다. 아래 `hint` 99행 = 「내 지역 · 표시할 공부방이 없습니다」.
- 지도 칸: `naver-map.js` 367행 `promptStatus` = `REGION_PROMPT_MAP_STATUS` 「희망지역을 등록하면 지도가 그 지역으로 이동합니다.」 → 255·256 위반(반대 분기에서 희망지역 등록 유도).

바꾼 뒤(반대 분기 + 지역 없음일 때만):
- 박스: 큰 제목·「우리동네」 칩·아래 줄 없이 작은 회색 글 「지역을 선택해 주세요」 한 줄(기존 `hero-map__sub` 클래스. CSS 추가 없음).
- 지도 칸: 「아래 검색창에서 지역을 선택하여 검색하세요」.

### B-1. `preview/search-ui/src/search-map.js`

12~17행 import에 `OPPOSITE_PLACE_PROMPT` 추가:
```js
import {
  normalizeLocation,
  logLocationDebug,
  memberPlacePrompt,
  readGuestBaseline,
  OPPOSITE_PLACE_PROMPT,
} from '../../shared/location-display.js';
```

`renderFloatMap` 안, `const heading = …;`(151~157행) 바로 아래에 추가:
```js
  // 학생 반대 분기(과외 분기 → 공부방찾기)에서 지역이 비었을 때만. 241·255·256, 11-17 종현.
  const oppositeEmpty =
    student && !parts.dong && !region && memberPlacePrompt(ctx.viewerRole) === OPPOSITE_PLACE_PROMPT;
  const promptAttr = oppositeEmpty ? ' data-map-prompt="opposite"' : '';
```

`bannerAside`(159~168행) 전:
```js
  const bannerAside = ctx.hideMapBanner === true
    ? ''
    : `
      <aside class="hero-map__banner${wide}" aria-label="지역 요약">
        <h2 class="hero-map__dong">…${esc(heading)}</h2>
        …
      </aside>`;
```
후(첫 갈래 하나만 추가, 기존 템플릿은 한 글자도 바꾸지 않는다):
```js
  const bannerAside = ctx.hideMapBanner === true
    ? ''
    : oppositeEmpty
      ? `
      <aside class="hero-map__banner${wide}" aria-label="지역 요약">
        <p class="hero-map__sub">지역을 선택해 주세요</p>
      </aside>`
      : `
      <aside class="hero-map__banner${wide}" aria-label="지역 요약">
        …기존 그대로…
      </aside>`;
```

170행 `<section …>` 속성 끝에 `${promptAttr}` 추가(`${floorAttr}` 바로 뒤):
```js
…${geocodeAttr}${floorAttr}${promptAttr} data-result-source=…
```

### B-2. `preview/shared/naver-map.js`

10행 아래 import 추가:
```js
import { OPPOSITE_PLACE_PROMPT } from './location-display.js';
```
(`location-display.js` → `site-nav-config.js` → auth-redirect·preview-links·student-branch-store. naver-map을 다시 부르지 않으므로 순환 없음. 빌드로 확인.)

367행 전:
```js
    const promptStatus = memberMap ? STUDY_ROOM_MAP_COPY.unplaced : REGION_PROMPT_MAP_STATUS;
```
후:
```js
    const promptStatus = memberMap ? STUDY_ROOM_MAP_COPY.unplaced : options.promptStatus || REGION_PROMPT_MAP_STATUS;
```

`bindStudyRoomMapSection`의 `mountStudyRoomMap(mount, { … })`(570~591행, `memberMap`은 583행)에서 `memberMap:` 줄 바로 아래 한 줄 추가:
```js
    promptStatus: section?.getAttribute('data-map-prompt') === 'opposite' ? OPPOSITE_PLACE_PROMPT : undefined,
```
`mountStudyRoomMap` JSDoc 옵션에 `promptStatus?: string` 한 줄 추가는 허용.

바뀌지 않는 것: 자기 분기 학생(공부방 분기 → 공부방찾기, 미등록이면 지금처럼 「희망지역을 등록하면…」), 지역을 고른 뒤 반대 분기 박스(동 이름 큰 제목·현황 그대로), 공부방(`memberMap`)·과외쌤·게스트 지도. 과외쌤찾기는 지도가 없어 해당 없음.

커밋: `08 fix(search): 반대 분기 공부방찾기 지역 없음 박스·지도 안내`

---

## 멈춤(다시 그리기 반복) 위험 점검 (검수 결과)

- A: 문자열 만드는 순수 함수만 추가. 상태 쓰기·리스너·`rerender` 없음. `hookUnreadAfterSnapshot`은 `textContent`만 바꾼다(지금과 같음). 과외쌤 `tutorHomeSignature()`(tutor-home-seed 339행)는 `readTutorMemberBox()` 원래 값(`inquiry`·`unread`)으로 비교하므로 문구가 바뀌어도 서명은 같다 → 추가 다시 그리기 없음.
- B: 렌더 문자열 분기와 data 속성 하나. `memberPlacePrompt`는 해시·분기를 읽기만 한다(이미 같은 함수에서 heading 계산에 쓰는 중). 지도 마운트는 속성을 한 번 읽어 안내 문구만 고른다. 새 비동기·새 `rerender` 경로 없음. 지역 없음 갈래는 지금도 `showStatus` 후 `return null`로 끝난다.
- 둘 다 `main.js`·라우팅·부트 순서와 무관.

## 수락 점검

00-INDEX 「공통 수락 점검」 전부를 **일반 창과 시크릿 창 각각**. 계정: 공부방 · 과외쌤 · 학생(과외 분기) · 학생(공부방 분기). 각 계정 GNB 보이는 메뉴 전부 실클릭, 멈춤 계측(`__renderCount` 5초 두 번 같음), 공부방찾기 두 번 진입(홈 → 공부방찾기 → 홈 → 공부방찾기), 공부방상세등록 진입. 로컬 계정 로그인이 안 되면 그 계정은 「미확인」으로 표에 적고 멈추지 말고 보고(운영 확인으로 넘김).

A 추가:
1. 공부방 홈 박스 「상태」: 쪽지 받음 + 안 읽은 쪽지 0 → `쪽지 받는 중`만. 「미확인」 글자 없음.
2. 안 읽은 쪽지 1개 이상(다른 계정으로 쪽지 1통 보내 두기) → `쪽지 받는 중 · 안 읽은 쪽지 N개`. 쪽지함에서 읽은 뒤 홈으로 오면 `쪽지 받는 중`.
3. 마이페이지 쪽지설정에서 끔 → 홈 `쪽지 받지 않음`(안 읽은 쪽지가 있으면 `쪽지 받지 않음 · 안 읽은 쪽지 N개`). 다시 켬 → `쪽지 받는 중`.
4. 과외쌤 홈 박스 같은 3가지.
5. PC·폭 390에서 상태 줄이 옆 칸과 겹치지 않음(#231 2단 정렬 유지).

B 추가:
6. 학생(과외 분기) → 공부방찾기, 지역 안 고름: 지도 위 박스에 작은 회색 「지역을 선택해 주세요」 한 줄만(큰 제목·「내 지역 · 표시할 공부방이 없습니다」 없음). 지도 칸 「아래 검색창에서 지역을 선택하여 검색하세요」. 현재위치 줄 문구는 지금과 같음.
7. 같은 화면에서 지역(행정동) 골라 검색 → 박스가 지금처럼 동 이름 큰 제목·현황, 지도 이동. 다시 초기화하면 6번 모양.
8. 학생(공부방 분기) → 공부방찾기: 지금과 같음(희망지역 있으면 그 동, 없으면 「희망지역을 등록하면…」·「마이페이지에서 희망지역을 등록해 주세요」).
9. 학생(공부방 분기) → 과외쌤찾기, 학생(과외 분기) → 과외쌤찾기: 지금과 같음.
10. 공부방 홈·공부방찾기 지도, 과외쌤 공부방찾기, 비로그인 공부방찾기: 지금과 같음.

PR 본문: 계정별·창별 표(통과/실패/미확인, 캡처 경로), A·B 커밋 해시. 비밀번호·토큰 금지.

## 공통

- 빌드: `npm run build:dothome`. 실패하면 멈추고 보고. 산출물 커밋 금지.
- 「Verify bundle」: 기존 실패 2개(관리자 CSS·과외쌤 카드) 외 새 실패면 멈추고 보고.
- 선택 실행: `cd preview/home-ui && npx vite-node ../../scripts/verify-study-room-box-shape.mjs`, `npx --prefix preview/home-ui vite-node scripts/verify-tutor-box-real-values.mjs`, `scripts/verify-map-center-by-role.mjs`. 결과를 PR에 적는다(이 PR 전부터 실패하던 항목은 구분).
- PR만, 머지 금지. 되돌리기: `git revert -m 1 <merge>`로 새 PR.
