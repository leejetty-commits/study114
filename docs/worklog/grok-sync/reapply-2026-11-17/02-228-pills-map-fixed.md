# 02. #228 다시 넣기 + 멈춤 수정 — 공부방 알약·지도·사업자정보 숨김

대기 가능(오픈 필수 아님). 01(#227) 머지·운영 확인 뒤.

## 목적

PR #228(`23d907c1`)을 되살리고, 공부방찾기 멈춤을 만든 한 블록만 고친다.
들어오는 것: 고른 알약만 진한 테두리, 센텀동 지도 폴백(`naver-map.js geocodeMemberLabel`), `#site-biz-static` 화면 숨김(head style), 공부방 홈 박스 2단, 동별 목록 메모리(`roomListByKey`).

## 원인 (직접 읽고 확인)

`preview/home-ui/src/study-room-home-seed.js` `bootStudyRoomHome()`, #228이 넣은 캐시 적중 블록.

- 공부방찾기(`search-ui/src/screens/search-page.js afterSearchPageMount`)는 **그릴 때마다** `bootStudyRoomHome(rerender, { viewsAfterList: true })`를 부른다.
- 캐시 적중 + `viewsAfterList`면 바뀐 게 없어도 매번 `ensureLifetimeViews().then(() => rerender())`를 새로 만든다. 조회수가 이미 있으면 `ensureLifetimeViews`는 바로 끝난다 → 다음 마이크로태스크에 다시 그림 → 다시 호출 → 끝없이 반복. 메인 스레드가 막혀 F12도 안 열린다.
- 이 블록이 기존 가드 `if (bootPromise && liveKey === key)`보다 **앞**에 있어서 가드가 소용없었다.
- 캐시는 홈에서 한 번 목록을 받았거나(홈→공부방찾기), 세션 스냅샷이 있으면(새로고침·재방문) 채워진다. 그래서 「홈에서 넘어가면」 멈췄다.
- 하나 더: 같은 블록의 홈 경로(`viewsAfterList` 없음)는 조회수를 아예 안 받는다. 스냅샷에 조회수가 없으면 홈 조회수가 빈다. 아래 수정은 기존 가드로 넘겨 이것도 같이 고친다.

박스 모의 실행(가짜 API로 이 파일만 돌림, 같은 화면에서 다시 그리기 횟수, 300에서 끊음):

| 경로 | #228 원본 | 수정본 |
|---|---|---|
| 홈 첫 진입 | 2 | 2 |
| 홈→공부방찾기 | **301 (무한)** | 1 |
| 스냅샷→공부방찾기 | **301 (무한)** | 1 |
| 메모리 비운 뒤 다시 | 2 / **301** | 2 / 1 |

#229·#230까지 쌓은 파일로도 같은 결과(무한 없음).

## 명령 (PowerShell)

```
git fetch origin
git switch -c work/reapply-228-fixed origin/main
git revert --no-edit 7dfe7c66
```
그다음 아래 「수정」 한 블록만 고치고 커밋:
```
git commit -am "공부방찾기 캐시 적중 때 바뀐 경우만 한 번 다시 그린다"
npm run build:dothome
```

## 수정 (이 블록만)

파일 `preview/home-ui/src/study-room-home-seed.js`, `bootStudyRoomHome()` 안 `const cached = roomListByKey.get(key);` 다음 `if (cached && …) { … }` 블록 전체를 아래로 바꾼다. **`return` 없이 아래 기존 가드로 흘려 보낸다.** 그 밖의 줄은 건드리지 않는다.

```js
  if (cached && (cached.status === 'ready' || cached.status === 'no-region')) {
    // 캐시 적중은 목록만 바꾼다. 다시 그리기는 키·상태가 바뀐 때 한 번만 예약한다.
    // 조회수는 아래 기존 가드가 처리한다(그리기마다 새 then·rerender를 만들지 않는다).
    const changed = liveKey !== key || liveStatus !== cached.status;
    if (changed) {
      liveKey = key;
      liveItems = cached.items;
      liveStatus = cached.status;
      listSavedAt = cached.at;
      bootPromise = Promise.resolve();
      if (typeof rerender === 'function') {
        queueMicrotask(() => {
          if (liveKey === key) rerender();
        });
      }
    }
  }
```

참고 diff(박스에서 만든 것):

```diff
@@ -475,24 +475,21 @@ export function bootStudyRoomHome(rerender, opts = {}) {
   const key = `${room?.id || 0}|${filters.region_id || ''}|${filters.complex_id || ''}|${filters.region_label || ''}`;
   const cached = roomListByKey.get(key);
   if (cached && (cached.status === 'ready' || cached.status === 'no-region')) {
+    // 캐시 적중은 목록만 바꾼다. 다시 그리기는 키·상태가 바뀐 때 한 번만 예약한다.
+    // 조회수는 아래 기존 가드가 처리한다(그리기마다 새 then·rerender를 만들지 않는다).
     const changed = liveKey !== key || liveStatus !== cached.status;
-    liveKey = key;
-    liveItems = cached.items;
-    liveStatus = cached.status;
-    listSavedAt = cached.at;
-    bootPromise = Promise.resolve();
-    if (opts.viewsAfterList === true) {
-      bootPromise = ensureLifetimeViews(room?.id).then(() => {
-        if (liveKey === key && typeof rerender === 'function') rerender();
-      });
-      return bootPromise;
-    }
-    if (changed && typeof rerender === 'function') {
-      queueMicrotask(() => {
-        if (liveKey === key) rerender();
-      });
+    if (changed) {
+      liveKey = key;
+      liveItems = cached.items;
+      liveStatus = cached.status;
+      listSavedAt = cached.at;
+      bootPromise = Promise.resolve();
+      if (typeof rerender === 'function') {
+        queueMicrotask(() => {
+          if (liveKey === key) rerender();
+        });
+      }
     }
-    return bootPromise;
   }
   if (bootPromise && liveKey === key) {
     if (opts.viewsAfterList === true) return bootPromise;
```

왜 이게 맞나:
- 바뀌지 않았으면 아무것도 안 한다 → 바로 아래 기존 가드가 받는다. 가드는 찾기(`viewsAfterList`)면 `bootPromise`만 돌려주고(다시 그리기 없음), 홈이면 조회수를 처음 받을 때만 한 번 다시 그린다(`settledBefore`). #228 이전과 같은 동작이다.
- 바뀌었으면(알약 변경·다른 키) 한 번만 다시 그린다. 다음 그리기에선 `changed=false`라 멈춘다.
- `if (changed)`만 감싸는 안보다 낫다: 그 안은 바뀐 경우 찾기에서 `ensureLifetimeViews`를 기다렸다 그리고, 홈 조회수 누락은 그대로 남는다.

## 허용 파일

revert가 바꾸는 것: `preview/{auth,home,search,study-room,tutor}-ui/index.html`, `preview/home-ui/src/study-room-home-seed.js`, `preview/home-ui/src/styles/{home-listings.css,udx-std-apply.css}`, `preview/shared/naver-map.js`, `docs/worklog/2026/11/2026-11-17-study-room-pills-map.md`.
추가 수정: `study-room-home-seed.js`의 위 블록 하나. 기록 1개: `docs/worklog/2026/11/2026-11-17-reapply-228-fixed.md`.

## 금지

- `main.js`, `search-page.js`, `tutor-home-seed.js`는 열어 보기만. 수정 금지.
- 캐시 TTL 추가, 함수 분리·이름 변경 등 「김에」 고치기 금지.
- 수정 블록 밖 `rerender` 호출 추가·삭제 금지.

## 다른 위험 점검 (diff 직접 읽음)

- `index.html` head `<style>#site-biz-static{…clip…}</style>`: 그 id 하나만 숨긴다(스크린리더·소스 보기엔 남음). 전역 숨김 아님. 01의 정적 블록이 이미 있어야 의미가 있다.
- `udx-std-apply.css`: `.home-shell--study_room .my-box__region-pill` 범위 안. 전역 아님.
- `naver-map.js geocodeMemberLabel`: 지오코딩 최대 3번, 반복 없음. 회원 지도(`memberMap`)만.
- capture·preventDefault·hashchange 추가 없음.
- `roomListByKey`는 만료가 없다. 같은 탭에서는 처음 받은 목록을 계속 쓴다(로그아웃·등록 변경 때 비움). 오픈 뒤 필요하면 따로 다룬다. 이번엔 손대지 않는다.

## 수락

1. 00-INDEX 「공통 수락 점검」 전부. 특히 공부방: 홈→공부방찾기→홈→공부방찾기, 그리고 공부방찾기에서 새로고침(F5) 뒤 홈→공부방찾기.
2. `__renderCount` 계측: 공부방찾기 진입 뒤 5초 두 번 읽어 같은 값.
3. 홈 알약: 고른 것만 진한 테두리, 누르면 지도·박스·카드가 그 동으로. 다시 누른 동은 바로 뜬다.
4. 홈 조회수 칸이 숫자(또는 기존 빈칸 문구)로 뜬다.
5. 센텀동 알약에서 지도가 뜬다(테스트 부산공부방).

## 되돌리기

`git revert -m 1 <이 PR merge 커밋>`으로 새 PR.
