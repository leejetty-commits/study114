# 308b 이용안내 「동네 게시판 골목」

- RESTORE_BASE: `f176b089eae73ba67d0c065be89886aac0ae0437`
- 브랜치: `cursor/308b-guide-corkboard-20261026`
- 기준: origin/main = 위 SHA (308a merge). fetch 후 일치.
- dirty: stash 없음. 오너 로컬 파일은 워킹트리에 그대로 두고 커밋하지 않음.

## 문 카드

`preview/home-ui/src/guide/screens.js` `renderGuideHome`의 `situation-grid` 3장(찾는 중 / 등록 / 비교·찜·쪽지).

같은 화면의 「읽어 볼 글」도 `situation-card`를 쓴다. 그 목록까지 기울이지 않으려고 문 카드 그리드에 래퍼 class `guide-doors` 1개만 추가했다. 문구·링크·순서는 그대로다. `guide/copy.js`는 수정하지 않음.

## 003b 대조

| 항목 | 결과 |
|---|---|
| 종이겹 | 카드 + `::before` 1장. `::after` content `none`. 2겹 |
| tilt | -1.5° · 2° · -2.5°. 최대 2.5° (≤6°). 호버·focus `--tilt: 0deg` |
| 역할/상황색 | 카드 바탕만 soft. CTA 채움 없음 |
| 카드 | radius 12px |
| 블러 | 히어로에 사진(`guide-student`)이 있고 blob은 없음. 새 블러 원 0 |
| 모션 | `guide-door-float` 4.8s, translateY -6px. transform만 |
| reduced-motion | animation·transition·transform `none` (computed) |
| 본문 | `#/guide/start` 단계 `transform: none`. `guide-doors` 0 |
| 안내 글 카드 | animation `none` (문 카드 밖) |

신규 선택자는 `.guide-app`으로 시작한다. `cork-*` · `.concern-app` · `--s-*` · 공유 `:is()` 변경 없음. `zip-visual-v2.css`는 특이도로 `home-support-guide.css`만으로 충분해 수정하지 않음.

## 회귀 · 게이트

- `#/community`: `.guide-doors` 0. 방 카드 애니메이션은 기존 `cork-float`(308a) 유지.
- `#/support`: `.support-app` 유지, `.guide-doors` 0.
- `#/guide/compare` 게스트 「찜한 공부방·과외쌤 보기」→ 「로그인하고 찜 목록 보기」게이트 유지.

## 확인

- `preview/home-ui` `npm run build` 통과. 허브·가이드 로드 `pageerror` 0.
- 샷: `docs/worklog/2026/10/shots-308b/before/` · `docs/worklog/2026/10/shots-308b/after/`

## 복원

```
git restore --source=HEAD -- preview/home-ui/src/styles/home-support-guide.css preview/home-ui/src/guide/screens.js
```

브랜치 전체: `git reset --hard f176b089eae73ba67d0c065be89886aac0ae0437` (push 이후 force-push 금지).

## 308c

고객센터는 `.support-app`이다. `guide-doors`와 이 파일의 `.guide-app` 규칙을 고객센터에 재사용하지 말 것. `zip-visual-v2.css`의 공유 `:is()` 블록은 그대로다.
