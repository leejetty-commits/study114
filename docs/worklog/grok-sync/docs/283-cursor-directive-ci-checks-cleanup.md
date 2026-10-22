# 283 지시서 — 오래 빨간 GitHub 검사 6개 정리

- 기준: origin/main **0ff42764** (275 병합 0b7c7bde + myshop.css:178 수정). 줄 번호는 2026-10-22에 이 코드로 다시 확인함. 검사 기록: main 0ff42764 Verify bundle run 39748221690(job 119721928342), 275 전 9d41304a run 39494694982 — 같은 실패. 브랜치: cursor/283-ci-cleanup-20261022
- 순서: 275 → **283** → 278 → 240 → 279 → 276 → 277-1 → 277-2 → 281 → 282 → 280

## 0. 앞 지시서 결과 확인 (먼저)
- `git log --oneline -3 origin/main`에 `0ff42764`(275 이름 카드 수정)와 `0b7c7bde`(Merge 275)가 있는지 확인. 없으면 멈추고 보고.
- 275가 바꾼 scripts/verify-shop-page.mjs는 이 지시서에서 고치지 않는다. 루트 `npm ci` 뒤 `npm run verify:shop-page`가 통과(275 보고 69/69)하는지만 확인. 실패하면 고치지 말고 멈추고 보고.
- 아래 표의 워크플로 줄·검사 줄이 그대로인지 확인(275는 이 파일들을 건드리지 않음). 다르면 멈추고 보고.
- 화면 코드는 고치지 않는다. 검사가 진짜 버그를 찾은 것이면 멈추고 보고(아래 5).

## 0-1. 종현에게 물을 것
- 없음(검사 설정·낡은 검사 문장만). 진짜 버그로 판정되면 그때 따로 묻는다.

## 1. 공통 원인 (6개 모두)
- 로그: `sh: 1: vite-node: not found` (exit 127). vite-node는 루트 package.json devDependency(3.2.4, package-lock.json에 있음)인데, 아래 워크플로가 **루트 `npm ci`를 안 한다.**
| 워크플로 | 줄 | 지금 |
|---|---|---|
| .github/workflows/tutor-inquiries-gate.yml | 68 | 루트 설치 없이 vite-node 실행 |
| .github/workflows/tutor-mypage-frame-ia.yml | 46 | 〃 |
| .github/workflows/study-room-registration-check-frame.yml | 44 | 〃 |
| .github/workflows/tutor-register-same-tab.yml | 46 | 〃 |
| .github/workflows/tutor-lesson-step-gate.yml | 42-47 | preview/tutor-ui 안에서만 npm ci |
| .github/workflows/verify-bundle.yml | 54-56 | preview/home-ui 안에서만 npm ci |
- 고침: 각 파일 vite-node 쓰는 단계 앞에 `- name: Install root deps` / `run: npm ci` (작업 폴더 루트) 한 단계. setup-node에 `cache: npm`이 있으면 그대로, 없으면 넣지 않음(바꾸는 줄 최소).

## 2. 설치 뒤에도 남는 진짜 실패 (로컬에서 확인한 것)
| # | 검사 | 원인 | 고침 |
|---|---|---|---|
| A | scripts/verify-study-room-registration-check-frame.mjs:142 | `detail1: '수업 · 가격'`을 기대, 과외쌤 문구 preview/home-ui/src/tutor-reg/registration-check-copy.js:44는 `'수업 · 과목 · 가격'`(272에서 바뀜) → 낡은 검사 | 기대값을 지금 문구로 |
| B | scripts/verify-hide-inquiry-bundle.mjs (verify-bundle.yml:68) | home-ui study-room-reg/embedded-panels.js의 '@study-room-ui/state.js' 별칭을 검사 빌드가 못 찾음 | 검사 스크립트의 alias 설정에 @study-room-ui 추가(preview/home-ui/vite.config.js:14 값을 그대로 본뜸). 화면 코드 import는 그대로 |
| C | scripts/verify-student-hope-hidden-required.mjs (가짜 화면 만들기 :466, mount :477, 실패 호출 :517) — verify-bundle.yml:104 | TypeError `form.dataset.studentBasicTried` — 검사의 가짜 DOM에 dataset이 없거나 진짜 버그 | 먼저 브라우저(로컬 5174)에서 같은 화면 수동 확인: 정상이면 검사 stub에 dataset 넣기, 화면도 에러면 **멈춤** |
| D | npm run verify:tutor-basic-required (verify-bundle.yml:76, vite-node) | FAIL 6개(renderBasic 등), e6f8f08a에서도 같음 | FAIL 문장마다 「기대 문구 vs 지금 화면」 비교. 272·273에서 의도적으로 바뀐 것만 기대값 고침. 이유를 모르는 FAIL은 **멈춤** |
| E | npm run verify:tutor-search-fields (verify-bundle.yml:72) | 정적 FAIL 1개 | D와 같은 방식. 276이 먼저 들어가면 결과가 바뀔 수 있음 → 276 뒤면 다시 돌려 봄 |
- inquiries, frame-ia, same-tab, lesson-step 검사는 로컬에서 vite-node가 있으면 통과 → 1번 고침만으로 초록 예상.

## 3. 허용 파일
- 위 6개 워크플로 파일, 위 표 A~E 검사 스크립트(scripts/ 또는 preview/*/scripts/ 실제 위치), 검사용 stub/alias 설정 파일. 그 밖(화면 코드·서버 코드)은 안 됨.

## 4. 하지 않는 것
- 검사 끄기·continue-on-error·skip, scripts/verify-shop-page.mjs(275 파일), 기대값을 무조건 지금 결과로 덮기, 워크플로 트리거·권한·secrets 바꾸기, 화면/서버 코드 고치기, push(이 지시서 작성 시점 규칙: 종현 승인 전 push 금지).

## 5. 멈출 때
- **범위 밖이 필요하면 멈추고 보고.**
- C·D·E에서 화면이 실제로 틀린 것으로 보일 때 → 그 검사만 그대로 두고 「진짜 버그 후보」로 파일:줄·재현 방법 보고.
- 루트 npm ci가 CI에서 너무 오래(5분 넘게) 걸리면 → 그대로 두고 시간 보고.

## 6. 확인
- 로컬: 루트 `npm ci` 후 6개 워크플로가 부르는 npm 스크립트를 하나씩 실행 → 통과 목록. (CI 실행은 push 승인 뒤.)
- 1280·390 화면 확인: C를 수동 확인할 때만(학생 기본정보 화면, 로컬 새 학생 계정).

## 7. 커밋 나누기
1. 283 ci: vite-node 쓰는 6개 워크플로에 루트 npm ci
2. 283 test: 낡은 기대값(A, D·E 중 의도된 변경)
3. 283 test: 검사 빌드 alias·stub(B, C)

## 8. 보고
- 워크플로 6개 표에 「고친 줄 / 로컬 결과」, A~E 판정(낡은 검사 / 진짜 버그 후보), 커밋 줄. 쉬운 말로.
