# 작업 A(218-1·2·3) 검수 기록 — 우동공과2 (2026-10-14 22:5x KST)

- 지시서: `docs/design/home-banner-rail-2026-10-14/220-cursor-directive-A.md`
- 판정: **PASS** (재작업 없음)
- 상황: 검수 중에 종현 지시로 이미 병합·배포됨 → 배포 후 확인으로 진행. 배포 지시서는 쓰지 않음.

## 1. 커밋
- 브랜치 `cursor/home-a-banner-gap-20261014` 끝 = `a7ce638749e3…` (지시대로 맞음).
- merge-base(origin/main) = `b67f4ba9`. merge-base부터 끝까지 커밋은 `a7ce638` **1개**.
- main 기록 커밋 `4dfa3a7f`(parent `b67f4ba9`). 병합 커밋 `4e55fc7`(parents `4dfa3a7` + `a7ce638`).
- `a66ddc5`(220 지시서)는 main에 포함돼 있음. `00ae04e..b67f4ba` 사이에 허용 파일 2개를 건드린 main 커밋은 없음 → 브랜치가 되돌린 main 변경 없음.

## 2. 바뀐 내용 (b67f4ba..a7ce638)
- 바뀐 파일은 허용한 2개뿐이고, 행 단위로 220 diff와 같음. 다른 변경은 없음.
  - `preview/home-ui/src/promo/shell.js:9` import 추가, `:18` `${renderHomeMarketingBanner(role)}`
  - `preview/home-ui/src/styles/home-marketing-banner.css:121` space-5→space-2, `:339` space-5→space-2, `:342-344` `.home-news-row:has(+ .provider-home-tabs)` 추가, `:347` 0→space-2
- 병합 결과 트리 `c724d530` = 병합 전 `git merge-tree`로 계산한 트리와 같음. 충돌 없음, fast-forward 아닌 병합 커밋.

## 3. 우동공과2 재측정 (로컬 vite, `/api/auth/me.php` 흉내, 브랜치 vs origin/main 4dfa3a7)
- 48개 경우(4모드 × 3폭 × 홈과 홍보 3화면)에서 어긋난 곳 0.
- 모든 화면에서 trioCount 1, 카드 3. 홈 gap1 = 8, 공부방·과외쌤·학생 gap2 = 8, 비회원은 탭 없음.
- 우측 레일 class 문자열이 48개 경우 모두 main과 같음.
- 변경 전 대조값: 공부방 홈 0/20, 과외쌤 홈 20/20. 홍보 화면에는 3칸이 없었음(trioCount 0).

## 4. main 기록 커밋 4dfa3a7 확인
- 들어간 것은 `docs/worklog` 아래 13개 파일뿐: 리포트 1개, work-queue 1줄, 이미지 11장. 앱 코드 없음. 비밀값 검색 결과 0.
- 리포트 내용과 내 측정이 일치함(표·trio·레일·높이 불변).
- 리포트에 스스로 밝힌 차이: Node Playwright를 사용, 대기 방식이 다름, 스크린샷은 main 쪽에 커밋. 지시서상 허용 범위로 판단함.

## 5. 운영 확인
- `study114.dothome.co.kr`은 `https://study114.net/`로 301 이동함 → 운영 주소는 study114.net.
- 운영 CSS `/assets/index-Gr73XI8Q.css`에 새 규칙 3개가 들어 있음: `.home-promo-trio{…margin:0 0 var(--space-2, .5rem)}`, `.home-mkt-wrap{…margin-bottom:var(--space-2, .5rem)}`, `.home-news-row:has(+.provider-home-tabs){margin-bottom:var(--space-2, .5rem)}`.
- 운영 비회원 측정(1280/1023/390): 홈 gap1 = 8, trio 1·카드 3. 홍보 3화면 모두 trio 1·카드 3. 레일 블록 수: 홈 9, 홍보 4(변경 전과 같은 구성).

## 6. 확인하지 못한 것
- 운영에서 로그인 상태(공부방·과외쌤·학생)의 gap2. 로컬에서는 확인함.
- 운영 배포 번호와 배포된 커밋 해시(Actions 기록은 보지 못함).
