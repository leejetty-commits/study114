# 308a 커뮤니티 허브 「동네 게시판 골목」

- RESTORE_BASE: `191d9d577a6d91d9199720bfa6e6f870f4a6429d`
- 브랜치: `cursor/308a-community-corkboard-20261026`
- 기준: origin/main = 위 SHA (307 merge, t432). fetch 후 `git rev-parse origin/main` 일치.
- dirty: stash 없음. 오너 로컬 파일은 워킹트리에 그대로 두고 커밋하지 않음.
- 003b 파일 `ds/docs/003b-hub-visual-grammar-동네게시판골목-2026-10-26.md` 는 이 저장소에 없음. 적용 기준은 지시문 003b 문법 + `docs/worklog/grok-sync/docs/003-global-design-manual.md` §2. 충돌 시 003.
- 허브 마크업은 `preview/home-ui/src/concern/screens.js` `renderCommunityHub`. concern/ 밖 파일 추가 없음.
- zip-visual-v2.css 는 수정하지 않음. 골목 스타일은 `.concern-app` 범위로 `home-community.css`에만 추가.

## 티커 분기 — 실데이터, 없으면 숨김

게스트는 고민방 제목을 볼 수 있다. 제목이 없으면 티커와 해결후기 도장 띠를 렌더하지 않는다. 숫자·이름·제목을 만들지 않는다.

근거:

- 서버 권한: `src/Board/BoardChannelAcl.php` `accessKind()` — 고민방이고 `canDiscover` 이며 목록·본문 권한이 없으면 `titles`.
- 서버 목록: `src/Board/BoardPostService.php` `list()` 가 `access === 'titles'` 이면 `listConcernTitles()` (본문·작성자 제외, `access: titles`).
- 클라이언트 권한: `preview/home-ui/src/board-channel-acl.js` `getBoardAccess()` — 같은 규칙. 게스트 `canDiscover` 는 고민방 4곳에 열려 있고 `canList` 는 아니다.
- 클라이언트 응답: `preview/home-ui/src/board/board-api.js` `normalizeBoardListResponse()` — 서버 `access === 'titles'` 이면 posts 를 유지한다.
- 허브는 기존 `fetchConcernRailPage()` (`preview/home-ui/src/concern/store.js`) 만 호출한다. ACL·store·router·PHP 는 수정하지 않았다.
- `titles` 가 아닌데 `full` 이면 `status` 가 비었거나 `published` 인 제목만 쓴다. 숨김 글 제목은 넣지 않는다.
- 방 단위 요청이 실패하거나 access 가 `intro`/`blocked` 이거나 제목이 비면 그 방은 건너뛴다. 모은 제목이 0이면 티커·도장 띠 DOM 을 만들지 않는다.

로컬 API `127.0.0.1:8080` 이 꺼져 있어 제품 화면 샷(`hub-guest-*`)에서는 티커가 숨겨진 상태다. 표시 분기는 라우트 목업으로만 확인했고, 그 샷은 `after/hub-ticker-route-mock-1440.png` (실데이터 아님, 제목 문자열은 확인용).

## 003b 대조

| 항목 | 결과 |
|---|---|
| 종이겹 | 카드 + `::before` 1장. `::after` content `none`. 2겹 |
| tilt | director -1.5° · tutor 2° · parent -2.5° · solved -1°. 최대 2.5° (≤6°). 호버 `--tilt: 0deg` |
| 역할색 | 카드 바탕만 soft (`--role-accent-*-soft`, 해결후기 `--color-success-soft`). CTA 채움에 역할색 없음 |
| 카드 / 뱃지 | 카드 radius 12px (`--radius-surface`). 「예시」뱃지·단계 번호 radius 4px (`--radius-badge`) |
| 블러 | 히어로에 사진이 있어 새 블러 원은 없음. 기존 `.blob--a` 1개, `rgba(38, 107, 196, 0.08)` |
| 모션 | float `cork-float` 4.8s, translateY -6px. 티커 `cork-marquee` 18s, transform 만 |
| reduced-motion | `animation/transition/transform: none` 확인 (computed). 샷 `after/hub-guest-reduced-motion-1440.png` |
| 999 pill | 새 텍스트에 없음. 단계 번호 radius 4px |

## 게스트 빈 보드

고민방 4곳(학부모·과외쌤·원장·해결후기)에서 제목 목록이 비면 `renderGuestBoardWall`. 노란 메모(`--color-warning-soft`) + 「예시」4px 뱃지 + 「쪽지 붙이는 법」3단계. 기존 ACL 문장(`roleGateCopy` body)과 로그인 버튼은 유지. ACL 파일은 수정하지 않음. 글이 있으면 기존 제목만 행이고 예시 메모는 없다.

## 확인

- 빌드: `preview/home-ui` `npm run build` 통과 (기존 CSS minify 경고·청크 크기 경고는 이번 변경 밖).
- 콘솔: 허브 로드 `pageerror` 0. API 500 은 `:8080` 꺼짐(기존).
- 로그인 허브: 세션 API 가 없어 촬영하지 않음. 게스트 안내 카드만 역할이 guest 일 때 나온다.
- 글 목록(제목이 있을 때)·작성 폼: 예시 메모 없음. 목록 샷은 API 가 꺼져 라우트 목업 제목 1건으로 기존 `if-post--title-only` 만 확인.

## 스크린샷

- before: `docs/worklog/2026/10/shots-308a/before/`
- after: `docs/worklog/2026/10/shots-308a/after/`

## 복원

```
git restore --source=HEAD -- preview/home-ui/src/styles/home-community.css preview/home-ui/src/concern/screens.js preview/home-ui/src/concern/shell.js preview/home-ui/src/concern/copy.js preview/home-ui/src/styles/zip-visual-v2.css
```

브랜치 전체: `git switch cursor/308a-community-corkboard-20261026` 후 `git reset --hard 191d9d577a6d91d9199720bfa6e6f870f4a6429d` (push 이후 force-push 금지).

## 308b / 308c

이용안내 `#/guide`, 고객센터 `#/support` CSS 는 건드리지 않음. 공용 `zip-visual-v2.css` 규칙도 유지.
