# 025 · 학생 마이페이지 H — A~F(+G) 커밋 분리 · 배포 준비

- 작성일: 2026-09-24 (KST)
- 선행: [023](023-post-af-remaining-work-master.md) · G [026](026-student-mypage-memo-settings-acceptance.md) **수락됨** · **이번 개방**
- 상태: **G 수락 전 열지 말 것.** 이 문서는 준비 절차 SSOT.
- 경고: 사용자가 「커밋해」「푸시해」「빌드해」「배포해」를 **명시한 메시지** 없이는 push / `build:dothome` **절대 금지.**

---

## 0. 한 줄 목적

같은 worktree에 **auth·가입 WIP**가 섞여 있다.  
학생 마이페이지 A~F(+G 쪽지설정)만 **커밋 단위로 분리**하고, 배포 전 스모크 체크리스트를 채운다.  
**이 티켓 기본 산출물은 커밋 목록·파일 allowlist·스모크 결과·위험 보고**다.  
push / build는 **별도 사용자 명시 지시가 있을 때만** 이어서 한다.

---

## 1. 왜 지금 한 번에 배포하면 안 되나

| 위험 | 설명 |
|------|------|
| Dirty mix | mypage 파일 + auth-ui / Auth PHP / signup 뷰가 동시에 수정됨 |
| `git add -A` | 가입·인증 WIP가 같이 올라감 → 운영 사고 |
| 학생찾기 | `c49b09a` 「한 줄 요청문」은 **별도 티켓 I**. H에 끼워 넣지 않음(사용자 승인 시만) |

---

## 2. 커밋 파일 allowlist (원칙)

### 2-1. 포함 후보 (실제 `git status`로 확정 후 보고)

학생 마이페이지 계열만:

- `preview/home-ui/src/student-reg/**` (screens, myprofile, css 등 A~G 터치분)
- `preview/home-ui/src/student-mypage-stage5b.css` (F)
- `preview/home-ui/src/main.js` (F import만 — auth 라우트 변경과 **분리 가능한지** diff로 확인)
- `preview/home-ui/src/student-detail.css` (F hint만 — 학생찾기와 겹치면 **라인 단위**로만 stage)
- `src/Registration/StudentHubRepository.php` (C budget · request_summary · G memo_status)
- 관련 API/PHP가 학생 update allowlist만 건드린 경우 그 파일

### 2-2. 절대 제외 (같은 커밋 금지)

- auth / signup / login / register boot / guest intro 전용 파일
- 14장 진행재개·가입 플로우 전용 변경
- 홈 팝업 시안·호스팅 문서
- `build:dothome` 산출물·배포 스크립트 실행 자체 (커밋과 별개)

`main.js` 등 **한 파일에 mypage+auth가 섞인 경우**:  
`git add -p`로 mypage hunk만 stage. 불가능하면 **중단·보고·승인 대기** (전체를 마이페이지 커밋에 넣지 말 것).

---

## 3. 권장 커밋 메시지 (로컬)

사용자가 「커밋해」라고 명시한 뒤에만:

```
feat(student-mypage): A–F hub/profile/forms + Stage5B; G memo_status save

Local accept series. No auth/signup. No dothome build in this commit.
```

G가 아직이면 메시지에서 G 문구 제거.  
chore(`GUARDIAN_*` 개명 · dead publish)는 **별 커밋** 또는 H에 「선택」으로만 — 필수가 아니면 빼도 됨.

---

## 4. 배포 전 스모크 (로컬 또는 스테이징 — push 전)

역할: 학부모 · 학생 id=1.

1. `#/mypage` → 마이프로필 · 카드/리스트
2. 기본정보 · 상세정보 · 쪽지설정(G 후) 저장↔새로고침
3. 내 등록 목록·탭·publish → 마이프로필 (자녀/게이트 없음)
4. 찜·비교·쪽지·계정설정 **탭 열림** (내용 리뉴얼 범위 아님)
5. 홈·게스트 가입 진입이 **깨지지 않음** (auth WIP를 안 올렸는지 확인)
6. 공부방·과외쌤 마이페이지 좌측 메뉴 정상

---

## 5. push / build 게이트

| 단계 | 조건 |
|------|------|
| 로컬 커밋 | 사용자 「커밋해」 |
| remote push | 사용자 「푸시해」 |
| `build:dothome` / 운영 반영 | 사용자 「빌드해」 또는 「배포해」 |

이 티켓 본문에 push/build를 **기본 포함하지 않는다.**  
명시 지시가 오면 allowlist 재확인 → push → build → 운영 스모크 순.

---

## 6. 완료 전 필수 점검 (H 기본 = 준비만)

1. `git status` / `git diff --stat` 분류표: mypage vs auth vs other
2. 제안 stage 파일 목록 (path 전부)
3. 섞인 파일(`main.js` 등) hunk 분리 가능 여부
4. 스모크 체크리스트 결과 (로컬)
5. 「안 한 것」: push/build 여부 · 학생찾기 · auth

---

## 7. Cursor 복사용 (G 수락 후 · 「커밋해」 전 준비만)

```
025 티켓 H. A~F(+G) 커밋 분리·배포 준비만. push/build 금지(명시 지시 전).

【목적】
auth/signup WIP와 학생 마이페이지 변경을 분리할 파일 allowlist·커밋 단위를 확정하고
로컬 스모크를 채운다. git add -A 금지.

【포함】
- git status/diff 분류 (mypage vs auth vs other)
- stage 제안 목록 + 섞인 파일은 -p 가능 여부
- 로컬 스모크 (마이프로필/기본/상세/쪽지설정/내등록/타역할)
- 커밋 메시지 초안 (실행은 「커밋해」 후에만)

【제외 = 거부】
push, build:dothome, 배포, auth/signup을 mypage 커밋에 포함,
학생찾기 c49b09a를 이 커밋에 끼워 넣기, git add -A.

【필수 종료】
분류표 + stage 제안 + 스모크 + 안 한 것.
push/build는 사용자 명시 단어가 있을 때만 이어서.
```
