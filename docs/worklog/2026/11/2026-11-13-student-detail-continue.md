# 학생 가입완료 「상세정보 이어서 입력하기」 — 2026-11-13

지시: `docs/worklog/grok-sync/docs/student-detail-continue-2026-11-13.md`  
브랜치: `work/student-detail-continue`  
머지하지 않음.

## 한 일

- `preview/auth-ui/src/screens/signup-complete.js` 학생 `go-detail-register`만 수정.
- 목적지: `studentSectionPath(id, 'detail')` → `#/mypage/registrations/students/{id}/detail` (`HOME_UI_BASE` 접두).
- `{id}`: `signupState.basicRegisterResult.kind === 'student'`일 때 `id`. 없거나 새로고침으로 비면 `GET /api/registrations/students.php` 목록 첫 행(`updated_at DESC`). 그래도 없으면 기존처럼 목록.
- 공부방·과외쌤·「홈으로」 분기 변경 없음.

## id 폴백 방식

1. 메모리: `basicRegisterResult.kind === 'student'` && `id > 0`
2. API: `/api/registrations/students.php` → `students[0].id` (가디언 본인 목록, 최신순)
3. 폴백: `#/mypage/registrations/students` 목록

## 셀프검수

| # | 항목 | 결과 | 근거 |
|---|---|---|---|
| 1 | 학생 「상세정보 이어서 입력하기」가 상세 폼으로 이동 | PASS | `shots-student-detail-continue/01-after-click-1280.png` · `01-after-click-390.png` — 「학생 상세정보」 |
| 2 | 완료 화면 새로고침 후에도 상세 폼으로 이동 | PASS | `02-after-refresh-click-1280.png` · `02-after-refresh-click-390.png` — API 폴백 |
| 3 | 마이페이지 「상세정보」 탭 기존 동작 유지 | PASS | `03-mypage-detail-tab-1280.png` · `03-mypage-detail-tab-390.png` |
| 4 | 공부방·과외쌤 이어하기, 「홈으로」 변경 없음 | PASS | 해당 분기 코드 미수정. `verify-signup-home-fix` 버튼 문구 유지 |
| 5 | 관련 verify·CI PASS, 공통 금지 위반 없음 | PASS | 아래 |

방법: 로컬 Docker API + auth-ui:5173 + home-ui:5174. `@test.local` 계정 API 가입·이메일 확인 SQL·기본등록 후, 완료 화면에 `signupState` id 주입(메모리 경로) / reload(API 폴백). 실이메일·실명 미사용.

## 검증

- `node scripts/verify-student-detail-continue.mjs` → 8 PASS
- `cd preview/home-ui && npx vite-node ../../scripts/verify-signup-home-fix-20261009.mjs` → 45 PASS / 0 FAIL
- `node scripts/capture-student-detail-continue.mjs` → 캡처 6장

## 발견 목록

- 가입 플로우 순서가 약관→폼→역할→이메일확인으로 바뀌어, 옛 e2e(`약관→역할`) 기준 UI 가입 캡처는 주소검색(카카오) 때문에 로컬에서 막힘. API+상태주입으로 대체(범위 밖 버그 아님).
- 캡처용 로컬 `config/database.php`는 example 복사. git 미포함.

## 캡처 경로

`docs/worklog/2026/11/shots-student-detail-continue/`

---

```
[최종검수 패키지 — 상세정보 이어서하기]
브랜치 / 커밋: work/student-detail-continue / (push 후 tip)
변경 파일: (git diff --stat main...HEAD)
diff 요약: (파일별 1~2줄)
테스트: (명령 → PASS n / FAIL n)
스크린샷: docs/worklog/2026/11/shots-student-detail-continue/ (1280·390, 신규·새로고침·탭)
셀프검수 체크리스트: (위 표)
미해결·종현 결정 필요: 없음
```
