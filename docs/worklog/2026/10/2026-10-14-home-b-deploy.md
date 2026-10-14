# 작업 B 배포 기록 (218-4 · 218-7)

작성: Cursor 메인 에이전트, 2026-10-14. 검수 `docs/worklog/2026/10/2026-10-14-home-b-review.md` PASS. 브랜치 끝 `ed4d6a1f` 확인 후 병합.

루트와 기존 `main` 체크아웃에는 다른 파일이 있어, 최신 `origin/main`(`fce1acb1`)을 받은 깨끗한 폴더에서 `git merge --no-ff` 한 뒤 `git push origin HEAD:main` 했다. force-push·rebase·reset 없음. 충돌 없음.

## merge

- 해시: `da26876a7077ebaf39193dbe2f16b2c4a5d19ebc` (`da26876a`)
- `git diff HEAD^1 HEAD --stat` 은 허용 2개만:
  - `preview/home-ui/src/right-rail.js`
  - `preview/home-ui/src/styles/home-right-rail.css`

## Actions (같은 커밋)

| 검사 | 결과 | URL |
|---|---|---|
| Deploy to dothome | success | https://github.com/leejetty-commits/study114/actions/runs/38580744883 |
| Verify bundle | success | https://github.com/leejetty-commits/study114/actions/runs/38580744533 |

Deploy 안의 ShopPage·Board ACL·쪽지설정 검사와 FTP 배포도 success.

## 운영 확인 (로그아웃, https://study114.net/#/guest)

강력 새로고침에 해당하는 새 브라우저(쿠키 없음). 로그인·회원가입만 보이고 로그아웃은 없음. 공부방·과외쌤·학생 계정은 없어서 열지 못했다. 운영 베스트는 0건이다.

| 항목 | 1280 | 390 |
|---|---|---|
| a. 베스트 띠 | `rgb(190, 18, 60)`, 제목 흰색 | 같음 |
| b. 고민방 띠 | `rgb(109, 40, 217)` 3칸. 순서 `best│room×3│field│action│info×3` | 같음 |
| c. 글이 있을 때 줄 클릭 | 운영에 글이 없어 확인 못 함 | 같음 |
| d. 0건 띠·빈 문구 | 둘 다 버튼. 빈 팝업 제목 「학생/학부모 고민방 · 이달의 베스트」, 문구 「이달의 베스트, 아직 글이 미도착중...」, 머리 `rgb(190, 18, 60)`. Enter·Space로 열림. Esc 뒤 초점 띠. 초점 링 `solid 2px rgb(28, 25, 23)` | 띠 클릭으로 같은 빈 팝업 |
| e. 비회원 팝업 범위 | 0건 빈 팝업은 검수 때와 같은 제목·빈 문구·게시판 보기. 글 본문용 「로그인하면 전체 내용을 볼 수 있어요」는 글이 없어 확인 못 함. 팝업을 그리는 파일은 이번 diff에 없음 | 같음 |
| f. 배포 CSS | `assets/index-GI5KhHNn.css`에 `.live-rail-best__open` 있음. 베스트 색은 묶여서 `.live-rail-slot--best,.live-rail-slot--field{--rail-tone:var(--rail-tone-hot)}`. 화면 계산값은 a와 같음 | 같은 CSS |
| g. 콘솔 | 새 오류 0 | 0 |

판정: 로그아웃·0건 기준 **PASS**.

## 그림

`docs/worklog/2026/10/img/`

- `2026-10-14-home-b-deploy-rail-1280.png`
- `2026-10-14-home-b-deploy-empty-1280.png`
- `2026-10-14-home-b-deploy-empty-390.png`
- `2026-10-14-home-b-deploy-focus-1280.png`
