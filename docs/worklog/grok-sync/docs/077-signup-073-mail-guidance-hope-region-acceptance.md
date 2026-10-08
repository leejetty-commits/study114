# 077 · 수락 — 073 학생가입(메일 새탭 안내 + 공부방 희망지역)

- 작성일: 2026-09-24 (KST)
- 티켓: [073](073-signup-student-mail-guidance-hope-region-unified-ticket.md) (구 071+072)
- 소견: [070](070-signup-mail-tab-student-hope-region-findings.md)
- 상태: **기능 수락(로컬)** · push/`build:dothome` **금지** · 커밋 시 스테이징 게이트 필수
- 배포 티켓: [081](081-073-079-allowlist-deploy-ticket.md) (공부방희망+메일 · **signup-basic.js 제외**)
- 운영: 메일=081/`4dae030` 반영 · 희망지역 **화면**은 signup-basic 미배포로 잔여 → [082](082-073-079-deploy-081-acceptance.md)

---

## 0. 판정

| 축 | 결과 |
|----|------|
| Part A 메일 새탭 안내 | **수락** |
| Part B 공부방 희망지역 주소피커 | **수락** (티켓 AC) |
| 로컬·069 미포함(청구 5파일) | **수락** |
| 워킹트리 전체 / 커밋 준비 | **경고** — `git add -A` 거부 · 아래 §3 |

카카오 우편번호 **끝까지 실클릭 스모크는 미완**(Cursor 보고) → 잔여 리스크. 코드 경로는 홍보슬롯 재사용으로 티켓 취지에 맞음. **자동 실패는 아님.**

---

## 1. 청구 파일 (Cursor)

| Part | 파일 |
|------|------|
| A | `preview/auth-ui/src/screens/signup-verify-email.js` |
| A | `preview/auth-ui/src/styles/base.css` |
| A | `src/Auth/EmailVerificationService.php` |
| B | `preview/auth-ui/src/screens/signup-basic.js` |
| B | `preview/shared/study-room-basic-form.js` |

diffstat 대략 +269 / −128 (5파일). push 안 함 · 069 홈 allowlist 경로 미포함 확인.

---

## 2. 대조 요약

### Part A
- `verify-email?send=1`: 「확인 메일을 보냈습니다」 아래 액센트 안내 블록.
- 최종 카피:  
  `메일 안의 링크를 누르면 새 창(또는 새 탭)이 열립니다. 가입은 그 새 창에서 이어서 진행하세요. 이 화면(탭)은 닫아도 됩니다. 메일이 보이지 않으면 스팸함·프로모션함도 확인해 주세요.`
- 다시 보내기·10분 쿨다운 유지.
- 메일 본문: `링크를 누르면 새 창(또는 새 탭)이 열리고, 가입은 그 창에서 이어집니다.`
- 확인 완료: `이 창에서 기본정보를 이어서 입력하세요.`
- BroadcastChannel / 탭 자동동기화 **없음**.

### Part B
- 홍보지역과 동일: `renderPromoSlot(..., { hope: true })` + 카카오 우편번호 / 지역 매칭.
- `complexList()` 은마·대치 하드코드 · 「샘플 주소」 **제거**.
- 빈 슬롯 = 검색 칸 + 안내만.
- 단지: 이름에 아파트·단지 있을 때만 · 도로명 번지·호 미저장.
- 과외쌤 `activity_city`(시·도) 회귀 OK.

---

## 3. 스테이징·스코프 게이트 (배포 전 필수)

1. **청구 5파일만** stage. `preview/home-ui/**`, ProviderUsage, helpers, teaser, `_verify`, `.tmp-*` **제외**.
2. `signup-basic.js` 에 **073 희망지역 외** 학생 Basic **9축**(SCHOOL_LEVEL / LESSON_FORMAT / budgets / `request_summary` / `student-basic` 등) WIP가 **같은 파일 diff에 섞여 있음**. 관련 dirty(청구 5 밖):  
   `BasicRegisterService.php`, `basic-student.php`, `signup-basic.php`, `student-basic.css`, `layout.js`, `main.js` 등.  
   → 커밋 시 **희망지역 hunk만**(`git add -p`) 할지, 9축을 **별 티켓**으로 받을지 **사용자 결정 필요**.
3. 선택 정리: `applyWaitCopyAfterSuccessfulResend` 가 제거된 `[data-verify-hint-inbox]` 를 건드림(무해 no-op).

---

## 4. 잔여 스모크 (로컬 · 사용자/다음)

1. 카카오 검색 → 대치 **외** 동 선택 → 라벨 ~동.
2. 단지명에 아파트·단지 있는/없는 케이스 → 저장 깊이.
3. 과외쌤 전환 시·도 목록 회귀(이미 Cursor 확인).

---

## 5. 다음

- **073 기능: 로컬 수락.** 배포 말 나오기 전 push/빌드 금지.
- 075(프라임/픽 목록0) · 닷홈/CF 522 인프라와 **축 분리**.
- 9축 WIP 처리 방침이 정해지면 README/별 티켓으로 잠금.

## 6. 9축 WIP 방침 (2026-09-24)

사용자 위젯 미응답 → **지금은 결정 안 함**. 배포·커밋 직전에 다시 잠근다. 그전까지 073 커밋 후보면 **희망지역 hunk(+청구 5파일)** 만 가정.

## 변경 이력

| 일시 (KST) | 내용 |
|------------|------|
| 2026-09-24 16:18 | Cursor 073 보고 코드 대조 · 기능 수락 + 스테이징/9축 경고 |
| 2026-09-24 16:19 | 9축 방침 위젯 미응답 → 커밋 직전으로 유보 |
