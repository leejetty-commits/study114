# 028 · 학생 마이페이지 A~F+G 배포 후 운영 점검

- 작성일: 2026-09-24 (KST)
- 갱신: 2026-09-24 — Cursor 배포 보고 반영
- 선행: [027](027-student-mypage-af-commit-prep-acceptance.md)
- 상태: **닷홈 배포 성공 · 학부모 로그인 스모크 잔여**
- 범위: mypage 묶음만. auth·학생찾기 비포함 확인됨.

---

## 1. 배포 메타 (확정)

| 항목 | 값 |
|------|-----|
| commit | `20b7be8bc7e53ae7bac6074decdf3c48abe99de0` |
| message | `feat(student-mypage): A–F hub/profile/forms + Stage5B; G memo_status (open\|paused)` |
| parent | `16b5b8f` (이미 학생찾기 포함) |
| push | `16b5b8f..20b7be8` → `origin/main` |
| diff | 18 files · **마이페이지만** |
| 로컬 빌드 | `npm run build:dothome` 성공 · `index-Cmyp1U87.js` · `index-Dss9eNVR.css` |
| CI | Actions **Deploy to dothome #324** · `20b7be8` 성공 |
| 운영 assets | `https://study114.net` → `assets/index-DYAUdb2O.js` · `assets/index-Dss9eNVR.css` (JS 해시는 CI 환경차로 로컬과 다름 · 정상) |

### 커밋에 안 넣은 것 (올바름)

`preview/auth-ui/**` · auth `student-basic.css` · `mvc.css` · `BasicRegisterService.php` · `Views/auth/**` · `helpers.php` · `study-room-reg/screens.js` · `.tmp-*` · `*/_verify/` · `teaser-*.js` · GUARDIAN 개명 · dead publish

---

## 2. 운영 스모크 — Cursor가 한 것

| 항목 | 결과 |
|------|------|
| 비회원 `#/guest` | 열림 · 제목 「대치동」 · 회원가입 `https://study114.net/auth/#/signup/terms` |
| 비회원 `#/mypage` | 로그인 안내로 정지 · 깨짐 없음 |
| 운영 JS | `open`/`paused` 라디오 · `memo_status` 저장 분기 · 상세 안내 문장 **포함** |
| 운영 CSS | Stage5B (`.home-app--role-parent`, `--s5-`, `.p21-inq`) **포함** |

---

## 3. 사용자 잔여 점검 (학부모 로그인 필요) — 이것만

| # | 확인 | 통과 기준 |
|---|------|-----------|
| 1 | 마이프로필 → 기본 → 상세 → 쪽지설정 | 탭 열림 · `open`↔`paused` 저장 후 새로고침 일치 |
| 2 | 내 등록 목록 · tab/draft · publish | `#/mypage/registrations/students/{id}` 마이프로필로 이어짐 |
| 3 | 레거시 | 「자녀」「대표학생」「공개 전/필수/부족」 게이트·스테퍼 **없음** |
| 4 | 회귀 | 과외쌤·공부방 `#/mypage` 좌측 정상 |

**범위 아님:** 쪽지함·찜/비교 **내용** · 계정 전화 · 학생찾기 필터 · auth WIP

오염 신호: 가입/auth가 갑자기 깨지면 → 이번 배포와 무관한 WIP 또는 캐시 이슈부터 의심 (커밋에는 auth 없음).

---

## 4. 시리즈 인덱스

| 구간 | 문서 |
|------|------|
| 마스터 A~F | [008](008-student-mypage-renewal-master-plan.md) |
| A~F 티켓·수락 | 009–022 |
| 잔여 | [023](023-post-af-remaining-work-master.md) |
| G | [024](024-student-mypage-memo-settings-save.md) · [026](026-student-mypage-memo-settings-acceptance.md) |
| H | [025](025-student-mypage-af-commit-deploy-prep.md) · [027](027-student-mypage-af-commit-prep-acceptance.md) |
| 배포 | **본 문서 028** |
