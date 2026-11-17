# 14 마이페이지 과외쌤 상세정보1·2 화면 + 저장 성공 토스트

지시: `origin/docs/reapply-2026-11-17` 의 `docs/worklog/grok-sync/reapply-2026-11-17/14-tutor-mypage-detail-design.md`  
기준: `origin/main` `410588ab` (PR #250, 과제 13 머지. 지시서의 `3046a9b3` 또는 그 뒤 main)  
브랜치: `work/tutor-mypage-detail-design`  
작업 트리: `D:\work\study114\.wt\work-14-tutor-mypage-detail`  
더러운 체크아웃 `D:\work\study114` 는 건드리지 않았다.

`main.js`, `preview/tutor-ui/**`, `preview/shared/*.css` 는 바꾸지 않았다. 실패 알림은 확인 창·빨간 글자 그대로다.

## 0단계

`git rev-parse --short HEAD` = `410588ab`.

| 확인 | 고치기 전 |
|---|---|
| `embedded-panels.js` `detailFormsHtml()` | 버튼 두 줄 모두 `btn--secondary`. 120~127행 |
| `embedded-panels.js` `bindEmbeddedTutorDetail()` | 성공 `await s114Alert('저장되었습니다.')` 뒤 등록점검 이동 또는 `rerender()`. 247~252행 |
| `screens.js` 저장 | `basicSaveFlash = '저장되었습니다.'` 713행. 다른 폼은 `s114Alert`. 실패는 `showTutorBasicFeedback` |
| `detail-utils.js` `showP24Toast` | `#p24-toast`, `role="status"`, `aria-live="polite"`, 2.2초 |
| `mypage-ops-register.css` | 996~1070행, 1033행(취소 아닌 secondary를 진하게), 1142행. 기존 줄은 그대로 두고 맨 끝에만 추가 |
| `data-trc-field` | 지시서의 반 칸 이름과 같다. 산정방식만 `form-label--required` |

허용 4개 파일 밖을 고칠 필요가 없어서 그 파일만 고쳤다.

## 고친 것

- 기본정보 저장 성공: 폼 안 초록 글자를 넣지 않고, `rerender()` 다음 `showP24Toast('저장되었습니다.')`. 등록점검으로 돌아가는 경로는 토스트 없음.
- 상세정보1·2 저장 성공: 확인 창 대신 다시 그린 뒤 같은 토스트. 검사 실패·저장 실패는 `s114Alert` 그대로.
- 저장 버튼만 `btn--primary`. 등록점검·마이프로필은 `tde-link`.
- 상세 화면 CSS는 `.mp-room-embed.register-flow[data-embed-tutor-id]` 로만 시작한다.

## 검증

tutor 다섯 검사:

- `verify:tutor-lesson-optional-step` 통과
- `verify:tutor-register-same-tab` 통과
- `verify:tutor-registration-check-frame` 통과
- `verify:tutor-detail-fields-ssot` 통과
- `verify:tutor-basic-required` 실패 8건. 지시서가 이미 실패로 적은 항목(PHP `mb_strlen`, tutor-ui `renderBasic`, 사진 업로드, 서버 변조 3건). 이번 수정 문구는 없다.

`scripts/verify-input-fill-rule.mjs` 는 259 passed, 16 failed. 실패는 tutor-ui·공부방·가입 화면의 타임아웃, H7이 `[data-p21-form="detail"]` 를 찾는 기존 불일치, 변이 검사가 HEAD와 같아 H6을 깨지 못하는 경우다. 이번 CSS는 그 선택자 밖에만 있다. H6 과외 마이 기본정보는 통과.

`npm run build:dothome` 종료 코드 0. 반 칸 선택자 수정 뒤 한 번 더 돌려도 0.

## 수락

로컬 시험 계정 비밀번호는 대조하지 않았고 바꾸지 않았다. 과제 13에서 같은 계정이 `이메일 또는 비밀번호를 확인해 주세요` (`validation`)로 거절된 상태다. 그래서 공부방·과외쌤·학생 일반·시크릿 메뉴 클릭, 실제 저장 토스트, 같은 값 저장은 미확인이다.

모양만 정적 페이지(`tmp/tde-fixture.html`, 커밋하지 않음)로 봤다.

| 너비 | 결과 |
|---|---|
| 1440 | 폼 `grid` 두 칸. 지도 대상·수업인원, 산정방식·주 회수, 대학·전공, 특징 1·2가 나란함. 연령대·가격 설명·강의장소·홍보 채널은 한 줄. 산정방식 `*` 색 `rgb(220, 38, 38)`. 고른 라디오 테두리 `rgb(38, 107, 196)`. 주 회수 칸 테두리 없음, 굵기 600. 버튼 줄 `position: sticky`, `z-index: 20` |
| 390 | 칸 너비가 모두 325로 한 줄. 연령대는 `flex`. 강의장소 격자는 2칸. 취소·저장 너비 183·167 |

캡처: `14-detail-1440b.png`, `14-detail-390.png` (브라우저 임시 폴더). 로그인 화면 캡처는 없다.
