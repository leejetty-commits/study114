# 284 지시서 — 학생 상세정보에서 「출생연도」 빼기 (화면·정본 문서)

- 기준: origin/main **171dd476** (2026-10-22 23:2x KST에 확인). 줄 번호는 이 코드 기준.
- 브랜치: **cursor/284-student-birth-year-remove-20261022** (시작할 때의 origin/main에서 새로 만든다). **이 브랜치에만 push. main 병합 금지. force push 금지.**
- 순서: 275 → 283 → 283-1 → 278 → 240 → 279 → 276 → **284** → 277-1 → 277-2 → 281 → 282 → 280
  - 종현 규칙(한 번에 하나): **276이 main에 합쳐진 뒤에** 시작한다.

## 0. 앞 지시서 결과 확인 (먼저)
- 아래가 **main에 들어 있는지** 확인: `git merge-base --is-ancestor <커밋> origin/main`
  - 278 `f068ecb8`, 240 `620cad0e`, 그리고 279·276의 merge 커밋(`git log --oneline origin/main | rg "279|276"`). 하나라도 없으면 멈추고 보고.
- origin/main 맨 위 커밋의 「Verify bundle」이 초록인지 확인. 아니면 시작하지 말고 보고.
- 아래 1장 표의 줄·문장이 그대로인지 확인. 줄 번호만 밀렸으면 같은 문장을 찾아 고치고 보고에 적는다. 문장이 다르면 멈추고 보고.

## 쉬운 말 요약 (종현 확인용)
- 학생 상세정보의 「출생연도」 칸을 없앤다. 쓰는 곳이 없고, 학생 대부분이 미성년자라 개인정보를 덜 받기 위해서다(2026-10-22 종현 확정).
- 마이프로필의 「출생연도」 줄도 없앤다.
- DB 칸(`students.birth_year`)과 이미 들어간 값은 **그대로 둔다.** 저장 API와 탈퇴 처리도 건드리지 않는다.
- Notion 정본(14장 §13-3, 「학생 마이페이지 구조 및 프로필 입력 기준」 §3-2)은 Grok이 이미 고쳤다.

## 1. 고칠 곳 (허용 파일은 이 표뿐)
| # | 파일:줄 | 지금 | 할 일 |
|---|---|---|---|
| 1 | preview/home-ui/src/student-reg/screens.js:451-459 | `renderDetailField('출생연도', '태어난 해 네 자리를 적습니다.', renderTextInput('birth_year', …))` 블록 | 블록 통째로 삭제(앞뒤 `${…}` 짝 맞춤). 다른 칸·순서·클래스는 그대로 |
| 2 | preview/home-ui/src/student-reg/profile-read.js:79 | `{ label: '출생연도', value: s.birth_year ? String(s.birth_year) : '' },` | 이 줄만 삭제 |
| 3 | src/Auth/BasicRegisterService.php:1346-1356 | `requireBirthYear()` (위 docblock 포함). 부르는 곳 없음 | 함수와 바로 위 docblock 삭제. 먼저 `rg -n "requireBirthYear" src public scripts`로 부르는 곳이 0인지 확인, 있으면 멈추고 보고 |
| 4 | docs/ssot/19-student-registration-management.md:146 | `\| \`birth_year\` \| 출생연도 · 기본·관리 화면 \|` | 행 삭제 |
| 5 | docs/ssot/19-student-registration-management.md:174 | `\| 출생연도 \| \`birth_year\` \|` (5-1 기본등록 표) | 행 삭제 |

- `screens.js:149` `if (patch.birth_year) …`는 칸이 없으면 실행되지 않으므로 **그대로 둔다**.
- 19장 문서 `:21` 「민감정보: … `birth_year`는 관리 화면·DB 축」은 DB 칸이 남으므로 **그대로 둔다**.

## 2. 하지 않는 것
- DB·SQL·마이그레이션(`students.birth_year` 칸과 값 그대로).
- 저장 API·저장소 코드: `src/Registration/StudentHubRepository.php`(:129 허용 목록, :396-411 검사, :570), `preview/shared/student-auth-bridge.js:59`, `preview/home-ui/src/student-reg/store.js:29`.
- 탈퇴 코드 `src/Auth/AccountWithdrawService.php:300`.
- 검사·캡처 스크립트와 e2e의 테스트 데이터(`birth_year: 2012` 등). 데이터만 넣는 것이라 그대로 둔다.
- 다른 상세 칸, 문구, 모양·색, `preview/auth-ui/DOC-CHECKLIST.md`.
- 검사 끄기·skip·continue-on-error, 워크플로 파일.
- **범위 밖이 필요하면 멈추고 보고.** (예: 검사가 「출생연도」 글자를 봐서 깨질 때)

## 3. 확인 (로컬, 새 테스트 학생 계정만. 운영 쓰기 금지)
1. 학생 상세정보 화면(1280·390): 「출생연도」 칸이 없고 나머지 8칸(희망지역 추가값·희망 수업장소·주 회수·1회 수업시간·희망 강의스타일·희망 과외쌤 성별·학생 성별·특이요청사항)이 그대로.
2. 8칸을 바꿔 저장 → 새로고침 → 값이 그대로 다시 불러와짐.
3. 마이프로필 상세정보 칸: 「출생연도」 줄 없음, 나머지 줄이 저장한 값 그대로.
4. 이미 `birth_year` 값이 있는 학생으로 상세 저장해도 오류 없고, DB 값이 지워지지 않음(`SELECT birth_year FROM students WHERE id=…` 전후 같음).
5. `rg -n "출생연도" preview/home-ui/src` 결과 0건.
6. `php -l src/Auth/BasicRegisterService.php` 통과.

## 4. 멈출 때
- 0장의 앞 지시서가 main에 없을 때, 표의 문장이 코드에 없을 때, `requireBirthYear`를 부르는 곳이 있을 때, 검사가 깨질 때.

## 4-1. 합격 기준
- 브랜치 push 후 이 push로 도는 GitHub Actions(「Verify bundle」·「Board ACL gate」 포함)가 **전부 초록**. 하나라도 빨가면 고치지 말고 보고.

## 5. 커밋 나누기
1. 284 fix(student): 상세정보·마이프로필에서 출생연도 칸 빼기 (#1~#2)
2. 284 chore: 안 쓰는 requireBirthYear 지우기, 19장 문서에서 출생연도 빼기 (#3~#5)

## 5-1. push
- 파일 이름으로 add(`git add -A` 금지) → `git push origin cursor/284-student-birth-year-remove-20261022`(force 아님) → **멈춤. main 병합 금지.**

## 6. 보고
- 커밋 2줄, 파일:줄 전/후, 3장 1~6 결과, 1280·390 스크린샷(상세정보·마이프로필), Actions run 번호와 결과, 멈춤 조건에 걸린 것(없으면 「없었다」). 쉬운 말로.
