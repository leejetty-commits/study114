# 308c 고객센터 「동네 게시판 골목」

- RESTORE_BASE: `eee28e43c3c2a08aa6e6527876666ca2ec6a4ac5`
- 브랜치: `cursor/308c-support-corkboard-20261026`
- 기준: origin/main = 위 SHA (308b merge). fetch 후 일치.
- dirty: stash 없음. 오너 로컬 파일은 워킹트리에 그대로 두고 커밋하지 않음.

## 창구 타일

`preview/home-ui/src/support/screens.js` `renderSupportQuickCards`의 `quick-grid`에 래퍼 class `support-windows` 1개만 추가했다.

공유 `.quick-tile` 규칙은 `:is(.guide-app, .concern-app, .support-app)`라서, 고객센터만 기울이려면 래퍼가 필요하다. 같은 함수를 `#/support/notice`도 쓰므로 공지 화면의 창구 타일도 같이 기울어진다. FAQ 본문·문의 폼·약관·아코디언은 이 그리드를 쓰지 않는다. 문구·링크·`SUPPORT_HOME_CARDS`·순서는 그대로다.

## 003b 대조

| 항목 | 결과 |
|---|---|
| 종이겹 | 카드 + `::before` 1장. `::after` content `none`. 2겹 |
| tilt | -1° · 1.5° · -2° · 1° · -1.5°. 최대 2° (≤6°). 호버·focus `--tilt: 0deg` |
| 역할/상황색 | 카드 바탕만 soft. CTA 채움 없음 |
| 카드 | radius 12px |
| 블러 | 히어로에 사진(`support-desk`)과 `geo-circle` 2개가 이미 있다. 새 블러 원 0. 기존 원은 수정하지 않음 |
| 도장 | 화면에 집계가 없다. 도장 줄 없음 |
| 모션 | `support-window-float` 4.8s, translateY -6px. transform만 |
| reduced-motion | animation·transition·transform `none` (computed) |
| 하위 | `#/support/faq` `.support-windows` 0, `transform: none`. `#/support/contact` 게스트는 로그인 벽 |

신규 선택자는 `.support-app`으로 시작한다. `cork-*` · `guide-doors` · `.concern-app` · `.guide-app` · `--s-*` · 공유 `:is()` 변경 없음. `zip-visual-v2.css`는 특이도로 `home-support-guide.css`만으로 충분해 수정하지 않음. `.guide-app .guide-doors` 블록은 그대로다.

## 회귀 · 게이트

- `#/community`: `.support-windows` 0. 방 카드 애니메이션은 기존 `cork-float`(308a) 유지.
- `#/guide`: `.support-windows` 0. 문 카드 애니메이션은 기존 `guide-door-float`(308b) 유지.
- `#/support/contact` 게스트 「운영문의」로그인 벽 유지.

## 확인

- `preview/home-ui` `npm run build` 통과. 고객센터·FAQ·문의·커뮤니티·이용안내 로드 `pageerror` 0.
- 샷: `docs/worklog/2026/10/shots-308c/before/` · `docs/worklog/2026/10/shots-308c/after/`

## 복원

```
git restore --source=HEAD -- preview/home-ui/src/styles/home-support-guide.css preview/home-ui/src/support/screens.js
```

브랜치 전체: `git reset --hard eee28e43c3c2a08aa6e6527876666ca2ec6a4ac5` (push 이후 force-push 금지).
