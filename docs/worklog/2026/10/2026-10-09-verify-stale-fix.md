# 2026-10-09 verify-stale-fix — 낡은 검사 8개 고치기 + push마다 자동 검사

- 브랜치: `cursor/verify-stale-fix-20261009` (base `39cd2ca` = 공개 잔재 제거 작업 브랜치 끝)
- 위험도: 낮음 (검사 스크립트·CI 워크플로만. 기능 코드 변경 없음)
- 상태: 검수 대기 (승인 전 main 병합 금지)

## 1. 지시 원문

> 낡은 검사 7개: 지금 기능에 맞게 고칠지 (권장: 고치고, push마다 자동으로 도는 검사도 추가)
> ==> 고쳐.

> 진행해

## 2. 복명복창 (사용자 확인: 「진행해」)

- 낡은 검사 8개의 기대값만 지금 기능에 맞게 고칩니다. 기능 코드는 건드리지 않습니다.
- push할 때마다 이 검사들이 자동으로 도는 GitHub Actions 워크플로 1개를 추가합니다.
- 공개 제거 작업기록에서 틀린 항목을 바로잡습니다. (→ `39cd2ca`에서 완료)
- 작업기록 작성, 커밋, push까지 하고 main 병합은 승인 후에 합니다.

## 3. 검사별 원인과 수정

| 검사 | 실패 원인 (근거) | 수정 |
|---|---|---|
| `verify-paid-renewal.mjs` | 과외쌤 순환 미리보기 블록(`renderTutor*Circulation`)이 견본카드 제거 `1fbe4ae`로 없어짐. 안내 문구만 남음: `preview/home-ui/src/plans/screens.js:1012,1019,1020` | 블록 존재 조건 삭제. 안내 문구·프라임 한정·매진 검사는 유지 |
| `verify-cur-006-email-sent-ui.mjs` | 환영 카피 해요체 `8844df1`. 문구가 `preview/shared/auth-welcome-copy.js`로 이동: `waitLead` 27행, `failTitle` 32행 | 「다시 보냈어요」「보내지 못했어요」로 기대값 변경. 화면은 공유 문구 키를 쓰는지, 공유 파일에 문장이 있는지 확인 |
| `verify-cur-006-post-verify-role.mjs` | 「회원 유형」→「희망 유형」 `4cb19b8`: `preview/auth-ui/src/screens/signup-basic.js:79,186` | 「희망 유형」 있음 + 「회원 유형」 없음으로 변경 |
| `verify-study-room-basic-register-api.mjs` | ① 공부방 중복 막기가 사용자 행 잠금 뒤 기존 공부방 조회로 바뀜: `src/Auth/BasicRegisterService.php:452`, 문구 `src/StudyRoom/StudyRoomRegisterService.php:368` ② 완료 문구가 공유 파일로 이동: `auth-welcome-copy.js:59,61` ③ 마이페이지 개요는 홍보지역 3칸 유지: `preview/study-room-ui/src/screens/step-basic.js:56` | 세 군데 기대값을 현재 구조로 변경 |
| `verify-tutor-registration-check-frame.mjs` | 회원 공개 버튼 제거(공개 잔재 제거 `0cdfa5a`) | 「공개 영역이 없어야 함」으로 반대로 바꿈 |
| `verify-student-hope-hidden-required.mjs` | 검사가 화면 모듈을 불러올 때 새로 쓰이는 공유 모듈 4개(`fee-cheonwon`, `lesson-duration-options`, `lesson-weekly-options`, `tutor-basic-fields`)가 검사 목록에 없어 불러오기 실패 | 실제 모듈을 목록에 추가 |
| `verify-cur-006-email-verify-inventory.mjs` | `public/api/search/search.php`가 분류표에 없음. 검색은 공개 API이고, 비로그인은 게스트 지역 고정, 로그인은 기본등록 대표지역 기준 요청(정본 grok-sync 193·106) | 「의도된 공개」 목록에 추가 (open_intentional=8, review=0) |
| `verify-basic-exposure-gate.mjs` | ① 과외쌤 필수 8개 `a5b0e6b` 이후 노출 판정이 지역 단위·대상 학년·수업료 등을 조회하는데 가짜 DB가 응답하지 않음 ② 과외쌤 검색 목록 SQL에 성별 하위조회(`user_profiles`)가 붙음 `d29fa20` (`src/Search/SearchService.php:917`). 가짜 DB가 `user_profiles`가 들어간 SQL을 모두 빈 결과로 돌려 목록이 비었음 | 가짜 DB에 지역·과외쌤·대상 학년 응답 추가, 완료 픽스처에 필수 8개 채움. 「슬로건 빠지면 노출 안 됨」「8개 다 차면 published」 검사 2개 추가. 목록 SQL은 `user_profiles` 빈 응답에서 제외 |

## 4. 자동 검사 워크플로

- 새 파일: `.github/workflows/verify-bundle.yml`
- 언제 도나: `main`·`cursor/**` 브랜치 push, 모든 PR
- 환경: Ubuntu, PHP 8.2(mbstring 켬), Node 20, `preview/home-ui` `npm ci`
- 도는 검사 12개 + 비밀값 검사:
  - 위 8개
  - 과외쌤 필수 8개 관련 `verify:tutor-basic-required`, `verify:tutor-search-fields`
  - 공개 잔재 제거 `verify:remove-publish`
  - 숨김·문의 묶음 `verify-hide-inquiry-bundle`
  - `scripts/check-no-committed-secrets.sh`
- 한 검사가 실패해도 나머지는 계속 돌고, 실패한 검사 이름이 Actions에 그대로 보입니다.
- 넣지 않은 것과 이유:
  - `verify:cur-006-email-verify-flow`: Docker 실DB 필요 (기존 `cur-006-resend.yml`과 같은 판단)
  - `paid-pr-a`/`paid-pr-b`: Windows에서 WSL bash에 의존하는 실행 방식

## 5. 로컬 실행 결과 (이 PC)

- 12개 중 11개 통과.
- `verify:tutor-basic-required`만 실패. 원인: 이 PC의 PHP(`D:\php8.2`)는 mbstring이 꺼져 있어 `mb_strlen` 없음 (`src/Tutor/TutorBasicFields.php:77`에서 Fatal). 코드 문제 아님.
  - 대안 A (권장): CI(mbstring 켬) 결과로 판단. PC 설정은 그대로 둔다.
  - 대안 B: 이 PC의 `php.ini`에서 `extension=mbstring`을 켠다 (사용자 승인 필요).
- CI 결과: push 뒤 Actions 실행 결과로 아래 8절에 기록.

## 6. 함께 찾은 것 (고치지 않음, 보고만)

- `preview/shared/auth-welcome-copy.js`의 가입 완료 문구 `complete.providerLead`(「아직은 검색에 안 보여요. 상세등록을 채우면 이웃에게 열려요.」)와 `detailNote`가 정책(기본등록 완료 = 카드 노출)과 어긋남. 가입 완료 문구 정리 과제에서 처리 권장.

## 7. 배포 전 사용자 할 일

- 없음 (SQL·환경변수·Secrets·`.htaccess` 변경 없음).

## 8. 검수·승인

- CI 1차 (`70c23f6`, run 37852553457): 13단계 중 2개 실패 — `Tutor search fields`(`git show 3f03aaa` 없음), `Tutor basic required`(`origin/main` 없음). 원인은 checkout 기본값(최근 커밋 1개만 받음)으로 비교 기준 커밋이 없던 것. 코드 문제 아님. → checkout `fetch-depth: 0`으로 수정.
- CI 2차 (`29a63a9`, run 37852674630): **성공** — 13단계 모두 통과 (이 PC에서 mbstring 때문에 실패하던 `Tutor basic required`도 CI에서는 통과). 같은 push의 Board ACL gate도 성공.
- 승인: 대기
