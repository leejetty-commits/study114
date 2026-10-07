# 083 · 배포(+최소 수정) — 학생 Basic 희망지역 UI만 (073 잔여)

- 작성일: 2026-09-24 (KST)
- 사용자 허가: 「남은 작업 배포하자」(2026-09-24) → push·`build:dothome` **허가** (본 allowlist만)
- 선행: [081](081-073-079-allowlist-deploy-ticket.md)/[082](082-073-079-deploy-081-acceptance.md) — 공유 모듈 `study-room-basic-form.js`는 **이미** `4dae030` 운영. **호출부**만 남음.
- 로컬 수락 축: [077](077-signup-073-mail-guidance-hope-region-acceptance.md) Part B (희망지역)
- 기준 HEAD: `4dae030` — Cursor가 `git log -1`·`origin/main` 재확인
- 상태: **운영 수락** → [084](084-student-hope-region-083-deploy-acceptance.md) · SHA `f6b5400` · dothome Run **330**
- **이번 범위 = 희망지역 UI만.** 학생 Basic **9축 WIP 전부 배포 금지.**

---

## 0. 한 줄

운영 인증 번들에 아직 **은마 폴백**이 남아 있다(082).  
원인은 `signup-basic.js`가 081에서 빠졌기 때문이다.  
**지금 워킹트리의 `signup-basic.js` diff(+245)는 희망지역 + 9축이 섞여 있어 통째 stage 금지.**

할 일: **`origin/main`의 `signup-basic.js` 위에 희망지역 연결만** 얹어 커밋 1개 → push → dothome.  
`git add -A` / 현재 dirty 통째 커밋 **거부.**

---

## 1. 왜 통째 dirty가 안 되는가

현재 dirty `signup-basic.js`에는 동시에 있음:
- ✅ 희망: `renderStudentHopeRegion` / `bindStudentHopeRegion` / `readStudentHopeRegion` · `complexList()` 은마 폴백 제거
- ❌ 9축 WIP: `SCHOOL_LEVEL` · `LESSON_FORMAT` · budgets · `request_summary` · `student-basic` 레이아웃 등

관련 dirty(이번에 **절대 제외**):
```
preview/auth-ui/src/layout.js
preview/auth-ui/src/main.js
preview/auth-ui/src/styles/student-basic.css
public/assets/css/auth/mvc.css
src/Auth/BasicRegisterService.php
src/Views/auth/partials/basic-student.php
src/Views/auth/signup-basic.php
preview/home-ui/src/provider-status.js
preview/home-ui/src/study-room-reg/**
preview/shared/location-display.js
src/Paid/ProviderUsageService.php
src/helpers.php
teaser · .tmp* · _verify · docs(레포)
```

9축을 파일만 올리면 PHP/CSS 없이 깨질 수 있음 → **이번 티켓 범위 밖.**

---

## 2. 구현 게이트 (커밋 전)

1. 워킹트리 WIP를 **버리지 말 것**(stash 또는 복사 백업). 사용자 로컬 9축 작업 보존.
2. `preview/auth-ui/src/screens/signup-basic.js`를 **`origin/main`(4dae030) 버전에서 시작**해 희망지역만 연결:
   - `study-room-basic-form.js`에서 `renderStudentHopeRegion` · `bindStudentHopeRegion` · `readStudentHopeRegion` import (이미 운영 모듈에 존재)
   - 공부방 희망 블록: 기존 `complexList()` / 은마·대치 하드코드 / 「샘플 주소」 UI **제거** → `${renderStudentHopeRegion(...)}` + bind/read (073/077과 동일 정책)
   - 홍보슬롯·카카오·단지명 규칙: 073 Part B (번지·호 미저장 · 아파트·단지명일 때만 단지 깊이)
3. **넣지 말 것:** `student-basic` 클래스 개편 · school_level · lesson_format · fee budgets · request_summary · BasicRegister 새 필드
4. `git add -- preview/auth-ui/src/screens/signup-basic.js` **만** (이 파일 1개).  
   `git diff --cached`에 다른 경로 **0**.
5. 가능하면 diff에서 `SCHOOL_LEVEL` / `LESSON_FORMAT` / `request_summary` / `student-basic__` **문자열 0** 확인 후 커밋.

**중단:** cached에 C 경로 또는 9축 마커가 보이면 커밋하지 말고 보고.

---

## 3. Allowlist (B)

```
preview/auth-ui/src/screens/signup-basic.js
```

공유 폼은 이미 081에 있음 → **재커밋 불필요**(unchanged vs HEAD면 skip).

---

## 4. 커밋 메시지

```
fix(signup): student study-room hope region picker (no 9-axis)

Wire renderStudentHopeRegion on signup-basic only. Completes 073 UI
left after 081. No student-basic 9-axis WIP.
```

push → `origin/main` → Actions dothome (또는 `build:dothome`).

---

## 5. 운영 스모크

| # | 확인 |
|---|------|
| 1 | 학생 가입 Basic · 희망유형=공부방 찾기 → **검색 칸** · 은마/대치 **하드코드 옵션 없음** |
| 2 | 「샘플 주소」 문구 없음 |
| 3 | 카카오(또는 동등)로 동/단지 선택 가능하면 1회 (불가 시 번들 문자열로 은마 폴백 제거 증거) |
| 4 | 희망유형=과외쌤 시·도 회귀 |
| 5 | 인증 번들에 `renderStudentHopeRegion` 호출 흔적 · `SCHOOL_LEVEL_OPTIONS` 등 9축 **신규 없음**(이번 커밋 기준) |
| 6 | CF 525/522면 앱 실패 아님 · 열린 창에서만 |

---

## 6. 완료 보고

1. base · 새 SHA · dothome Run #
2. `git diff --cached --name-only` = **signup-basic.js만**
3. 9축 WIP가 워킹트리에 **다시 남아 있는지**(stash pop 여부) 한 줄
4. 스모크 1~5 · 번들 경로
5. C 미포함 확인

---

## 7. 붙여넣기

```
[티켓 083 · 학생 Basic 희망지역 UI만 배포 · signup-basic.js 1파일]

사용자 「남은 작업 배포」허가. base≈4dae030. git add -A 거부.
081로 study-room-basic-form.js는 이미 운영. 호출부만.

금지: 현재 dirty signup-basic.js 통째 stage(9축 혼입).
필수: WIP 보존(stash/백업) 후 origin/main 기준 signup-basic.js에
renderStudentHopeRegion/bind/read만 연결 · complexList 은마 폴백 제거.
SCHOOL_LEVEL·LESSON_FORMAT·budgets·request_summary·student-basic 개편 넣지 말 것.

B만: preview/auth-ui/src/screens/signup-basic.js
C제외: layout/main/mvc/student-basic.css/BasicRegister/basic-student.php/signup-basic.php
· provider-status · study-room-reg · location-display · ProviderUsage · helpers · teaser · tmp

커밋1 → origin/main → dothome.
메시지: fix(signup): student study-room hope region picker (no 9-axis)

스모크: 공부방희망=검색칸·은마없음 · 과외쌤시도를귀 · 번들9축신규0.
cached= signup-basic.js만. WIP 복원 여부 보고.
```
