# 인수인계 — 2026-10-15 오후 (B2·작업 C 배포 이후)

새 채팅은 **이 문서를 먼저 읽고** 이어간다. 작성: Cursor 메인 에이전트, 2026-10-15 15:32.

`2026-10-15-handoff.md`(새벽, `40264c14`)의 사용자 규칙·작업 환경·남은 일(정본 「공개」→「노출」, 픽·프라임 보고서, 새 메일, 눈확인, 노션)은 그대로다. 겹치면 이 문서가 우선한다.

- **노션 반영일: 2026-10-12.** 2026-10-15부터 노션 반영이 밀려 있다. 새벽 인수인계와 같다. 새 채팅은 사용자가 고르기 전에 노션부터 하지 말고, 고르면 그때 한다.

## 1. 이 세션에서 main에 넣은 것

기준은 origin/main `118b6558`.

| 무엇 | 커밋 | 상태 |
|---|---|---|
| B2 이달의 베스트 0건 팝업 제목·빈 문구 (`a49f256`, 검수 226 PASS) | merge `58036395` (부모 `40264c14` + `a49f256`) | **배포 성공.** Actions `38631673615`. Verify bundle `38631673353`도 성공. 운영 `index-DB5H44HV.js`에 `data-concern-best-all` 확인. 0건 팝업을 화면에서 눌러 보지는 않음 |
| 작업 C 1단계 홈 현장·HOT 읽기 팝업 + 「원장」 2곳 + 찾기·등록 팝업 게시판 이동 | `8f2bce1f` | 브랜치 `cursor/home-c-hot-popup-20261015`에 있음. main 병합에 포함 |
| 작업 C 2단계 HOT 팝업 10개(방별 3·해결 1) + 학생 HOT 해결 후기 서버 제외 | `93034ef8` | 위와 같음 |
| 231 §1 R16 줄 번호 오타 (`info-rail.js` 263→264) | `219706f7` | 문서만. 내용은 원래 264행이 맞음 |
| 233 작업 C 검수 PASS + 231 §6-5 기대값을 2줄로 수정 | `de929a59` | 문서만. main에 이미 있음 |
| 작업 C를 main에 병합 | `118b6558` (부모 `de929a59` + `93034ef8`) | **종현 승인 후 배포 성공.** Actions `38641820289`. `php -l` `ConcernService.php`·`concern-hot.php` 둘 다 `No syntax errors` (`D:\php8.2\php.exe`. PATH에는 `php` 없음) |

병합 메시지는 `Merge cursor/home-c-hot-popup-20261015 — 홈 현장·HOT 읽기 팝업 + HOT 팝업 10개 (승인 93034ef8, 검수 233 PASS)` 이다. 그 뒤에 요청된 문구 `merge: 작업 C HOT 팝업 (231 개정 3, 검수 233 PASS)` 로 `--no-ff` 를 다시 하면 `Already up to date` 였다. 두 번째 병합 커밋은 없다. force-push 하지 말 것.

1단계 확인 ⑤ `data-rail-popup-continue` 는 0건이 아니다. `231-C.diff` 가 남기는 2줄이다 (`rail-concern-popup.js` 의 `continueInPage` 버튼, `verify-rail-info-banners.mjs` 의 없음 확인). `de929a59` 가 기대값을 그 2줄로 고쳤다. 지우지 말 것.

## 2. 다시 하지 말 것

- B2, 작업 C 코드, 081 SQL, 찾기 레일 6개. 081은 운영에서 다시 실행하지 않는다.
- 작업 C 허용 파일 밖(CSS, `rail-popup.js`, SQL)을 이어서 고치지 않는다.
- 로컬 `main` 브랜치는 `D:\work\study114-tutor-inquiries` 에 체크아웃되어 있고 `f5083531` 이라 origin/main 보다 많이 뒤처져 있다. 그 폴더에서 `git pull`·`git switch main` 하지 말 것.
- `.wt/home-c-hot` 의 브랜치 `cursor/home-c-hot-popup-20261015` 는 만들 때 upstream 이 `origin/main` 으로 붙었다. 그 폴더에서 `git pull` 하면 기능 브랜치가 main 으로 fast-forward 된다. 원격 기능 브랜치 팁은 `93034ef8` 이다.

## 3. 새 채팅이 지킬 것

- 루트 `d:\work\study114` 는 옛 브랜치 `feat/student-mypage-a-g` 이고 커밋 안 된 파일이 있다. 작업은 `.wt` 작업 폴더에서만. 커밋 안 된 파일이 있는 폴더는 건드리지 않는다.
- `main` 에 바로 커밋하지 말고, 문서·병합은 작업 폴더에서 `git push origin HEAD:main`. `git add -A`, force-push, rebase 금지.
- 사용자가 고르기 전에 남은 일(노션, 픽·프라임, 정본 공개→노출, 메일, 232)을 시작하지 않는다.
- 232(방 이름 「학생·학부모 고민방」)는 지시서가 main 에 있다. `docs/design/home-banner-rail-2026-10-14/232-cursor-directive-room-name.md`, diff `232-room-name.diff`. 231 은 main 에 들어갔다. 순서는 풀렸으나, 사용자가 시키기 전에 시작하지 않는다.
