# 090 · Cursor — 메일 확인: **원래 탭만** 기본정보 작성 (상세)

- 작성일: 2026-09-24 (KST)
- 사용자 잠금: 「원래 탭을 이어서 하는 게 가장 무난」(2026-09-24) · 노션 A안 채택 · 커서「새탭만」의견은 **기각**(원인 진단만 채택)
- 선행: [070](070-signup-mail-tab-student-hope-region-findings.md) · [088](088-signup-verify-wait-tab-lock-continue-ticket.md)(본 티켓으로 **대체**) · [089](089-signup-email-verify-multitab-industry-patterns.md)
- 운영 카피 충돌: 073/081 「새 창에서 이어가기 · 이 탭 닫아도 됨」→ **본 티켓 카피가 우선**(073 Part A 문구 폐기)
- 상태: **로컬 수락** → [091](091-signup-verify-090-acceptance.md) · push/`build:dothome` 여전히 금지
- 기준 HEAD: `origin/main` = `f6b5400` 재확인

---

## 0. 한 줄 (쉬운 말)

메일 링크는 **새 탭**에서 열린다(막을 수 없음).  
**작성(기본정보)은 원래 대기 탭 하나만** 한다.  
새 탭은 「확인 완료 · 원래 탭에서 이어가세요」만 보여 주고, **기본정보로 들어가지 않는다.**  
원래 탭을 이미 닫았을 때만 새 탭에 **폴백** 「이 창에서 이어가기」를 둔다.  
서버는 두 번 저장이 와도 **같은 가입에 덮어쓰기**로 흡수한다.

---

## 1. 목표 / 비목표

### 1.1 목표 (해야 함)

1. **단일 writer:** 학생·공부방·과외쌤 가입 verify-email 이후 **역할별 Basic**은 **원래 대기 탭**에서만 연다.
2. **새 탭(메일 링크):** 확인 처리·세션만. 성공 화면. 기본정보 **자동 진입 금지**. 기본 CTA는 「원래 탭으로 돌아가세요 / 이 탭 닫아도 됩니다」.
3. **원래 탭(대기 `send=1` 등):** 확인 완료를 감지하면 **그 탭에서만** `continueAfterVerified` / Basic 이동.
4. **폴백:** 원래 탭이 없으면(닫힘·다른 기기) 새 탭에서만 수동 「이 창에서 이어가기」.
5. **서버 안전망:** Basic register 학생(및 동일 패턴이면 역할 공통) **중복 INSERT 폭주 방지** — 같은 user+role pending에 upsert 또는 이미 있으면 성공 흡수/`already_saved` 유도. **새 테이블·스키마 대수술 금지.**
6. **카피:** 대기/성공/메일본문(손대면)을 「원래 탭 이어가기」톤으로 통일.

### 1.2 비목표 (하면 안 됨 · 범위 밖)

- OTP/인증번호로 매직링크 대체  
- Gmail이 새 탭 여는 동작 차단  
- `window.close()` 강제 의존(시도해도 실패=정상, 에러 UX 금지)  
- 086 아홉 칸 WIP를 「완성」하거나 홈·유료 dirty와 **한 커밋에 섞기**  
- push / `build:dothome` / `git add -A`  
- postVerifyTarget·역할 덮어쓰기 재발(이전 버그 회귀)  
- BroadcastChannel만 믿고 서버 `email_verified` 재조회 생략  

---

## 2. 현재 코드 가설 (검증 후 수정 · 가설로만)

파일: `preview/auth-ui/src/screens/signup-verify-email.js`

- `verifiedFromLink`(`verified=1`)인 **메일 탭**은 `me.email_verified`여도 early return 후 **성공 UI + 이어가기 버튼**.
- **대기 탭**은 `verifiedFromLink`가 없고 `me.email_verified`면 `continueAfterVerified(me)` → Basic **자동 이동**.
- 문제: 두 탭이 같은 세션으로 **둘 다 Basic writer**가 될 수 있음(커서 진단).  
- **본 티켓 방향:** 대기 탭 자동 이어가기는 **유지·명확화**. 메일 탭의 **Basic 진입을 기본 경로에서 제거**. 폴백만 예외.

Cursor는 위 가설을 **코드로 재확인**한 뒤, 틀리면 보고에 실제 분기를 적을 것. 가설을 맹신해 엉뚱한 파일만 고치지 말 것.

---

## 3. 동작 잠금 (역할 공통 · 학생 우선 스모크)

### 3.1 원래 대기 탭 (`#/signup/verify-email?send=1` 등)

| # | 잠금 |
|---|------|
| W1 | 확인 전: 진행 잠금 톤. 「메일 링크는 **새 탭**에서 열립니다. 확인이 끝나면 **이 탭**에서 기본정보로 이어집니다. 그동안 이 화면에서 가입을 이어가지 마세요.」 |
| W2 | 확인 후: `email_verified` 확정 시 **이 탭만** Basic으로 `navigate` (`basicRegisterPathForMe` / 역할 경로). |
| W3 | 감지: (필수) focus / `visibilitychange` / 짧은 폴링으로 `fetchMe`(또는 동등) 재조회. (권장) BroadcastChannel 또는 `localStorage`로 메일 탭이 `verified` publish → 즉시 재조회. **1차 진실 = 서버 verified.** |
| W4 | 073 「이 탭은 닫아도 됩니다 · 새 창에서만 이어가기」문구 **삭제·교체**. |
| W5 | 다시 보내기만 유지(기존 쿨다운). |

### 3.2 메일 링크로 연 새 탭 (`verified=1` 등)

| # | 잠금 |
|---|------|
| N1 | 확인 처리·세션 확립은 기존처럼. |
| N2 | 성공 화면 카피: 「이메일 확인이 완료되었습니다. **원래 탭**으로 돌아가 기본정보 입력을 이어가세요. 이 탭은 닫아도 됩니다.」 |
| N3 | **기본:** 「학생 기본정보 입력」등 Basic으로 가는 **주 버튼 제거** 또는 숨김. 자동 `continueAfterVerified` **금지**. |
| N4 | **폴백만:** 원래 탭이 없음을 사용자에게 알린 뒤, 보조 링크/버튼 「원래 탭을 닫았다면 → 이 창에서 이어가기」. 문구에 「가능하면 원래 탭 사용」명시. |
| N5 | 가능하면 대기 탭에 `verified` 신호 publish (채널명·키 상수 한곳). |
| N6 | 새 탭이 직접 Basic URL로 들어와도: 다른 탭 writer가 활성으로 보이면 read-only interstitial 「이미 다른 창에서 이어가는 중입니다」권장(구현 가능 범위에서). 어렵면 **보고 후 N3+서버로 충분** 판정 가능. |

### 3.3 서버 (필수 · 최소)

| # | 잠금 |
|---|------|
| S1 | `BasicRegisterService`(학생 우선) — 같은 사용자·역할에 대한 **두 번째** basic 저장이 hard fail(중복 INSERT 오류 메시지)로 사용자에게 터지지 않게. |
| S2 | 허용: 기존 row upsert / “이미 있음 → 성공·또는 already_saved + 최신으로 유도”. |
| S3 | **새 테이블·새 PHP 파일·마이그레이션 대수술 금지.** 기존 서비스 안 최소 수정. |
| S4 | `email_verify_required` 등 미확인 저장 차단 정책 **회귀 금지**. |
| S5 | postVerify 목적지/역할 덮어쓰기 회귀 금지. |

### 3.4 OTP · 커서 B안

- OTP 도입 **금지**.  
- 「새 탭만 writer」로 되돌리기 **금지**(사용자·090 잠금).

---

## 4. Allowlist (B) — 이 목록만

보고에 **실제 수정 파일 = 이 목록의 부분집합**. 밖이면 **중단·보고**.

```
preview/auth-ui/src/screens/signup-verify-email.js
preview/auth-ui/src/layout.js                    (신호·경로 헬퍼가 여기만 있을 때 · 최소)
preview/shared/<신규 1파일 가능: verify-tab-sync.js 등>  (신규 시 경로·이름 보고)
src/Auth/EmailVerificationService.php            (메일 본문 한 줄 카피 시에만)
src/Auth/BasicRegisterService.php                (S1–S3 upsert/흡수만)
public/assets/css/auth/mvc.css                   (성공/대기 안내 스타일 최소 · 필요 시)
```

`layout.js` / shared 신규 / EmailVerification / css 중 **안 건드리면 skip·보고**.

---

## 5. 절대 제외 (C) — 손대면 실패

```
preview/auth-ui/src/screens/signup-basic.js          ← 086 아홉 칸 WIP
preview/auth-ui/src/styles/student-basic.css
preview/auth-ui/src/main.js                          ← 086 관련이면 금지; verify 라우트만이면 보고 후 예외 요청
src/Views/auth/partials/basic-student.php
src/Views/auth/signup-basic.php
preview/home-ui/**
preview/shared/location-display.js
src/Paid/ProviderUsageService.php
src/helpers.php
public/assets/teaser-*
.tmp* · _verify/ · docs/ 레포 쪽 대량
git add -A
push · build:dothome · origin/main 강제
OTP·새 인증 채널·새 DB 테이블
```

086 dirty와 **같은 커밋·같은 작업 트리에 섞어 커밋하지 말 것**(로컬 작업이라도 allowlist 외 스테이징 금지).

---

## 6. 카피 가이드 (최종 의도 · 문장 확정은 보고)

| 화면 | 의도 문장(초안 · 자연스럽게 다듬되 의미 고정) |
|------|-----------------------------------------------|
| 대기 | 메일 링크는 새 탭에서 열림 → 확인 후 **이 탭**에서 기본정보 이어짐 → 그동안 여기서 진행 금지 |
| 메일 탭 성공 | 확인 완료 → **원래 탭**에서 이어가기 → 이 탭 닫아도 됨 |
| 메일 탭 폴백 | 원래 탭을 닫았을 때만 → 이 창에서 이어가기 |
| 메일 본문(선택) | 링크 확인 후 **가입하던 창**으로 돌아가 이어가세요 |

073/081 배포 카피와 **충돌 시 090 우선**.

---

## 7. 스모크 (로컬 · push 전)

1. 탭1 가입 → 대기: **새 창에서만 이어가기** 문구 **없음**. 원래 탭 이어가기 톤.  
2. 탭2 메일 링크 확인: 성공 안내만. **자동 Basic 없음.** 주 CTA로 Basic 없음.  
3. 탭1: 확인 후(포커스/폴링/신호) **Basic으로 이동**.  
4. 탭1·탭2 둘 다 Basic 연 뒤 저장 시도해도 **두 번째가 사용자 오류로 폭발하지 않음**(서버).  
5. 탭1 닫고 탭2만: 폴백으로 Basic 가능.  
6. 학생 필수 · 공부방/과외쌤 경로 회귀 보고.  
7. C 파일 미포함 · push 안 함.

---

## 8. 완료 보고 (필수 항목)

1. 가설 §2 검증 결과(실제 분기·줄 요약)  
2. 최종 diff 파일 목록(=B 부분집합)  
3. 대기/성공/폴백 **최종 카피 전문**  
4. 신호 채널명·키(있으면) · 폴링 간격  
5. 서버 흡수 방식(코드 요지 · 새 테이블 없음 확인)  
6. 스모크 1–6 결과  
7. 086·home dirty **미포함** 증거(`git status` 요지)

---

## 9. Cursor 붙여넣기 (상세본)

```
[티켓 090 · 메일확인: 원래 탭만 Basic 작성 · 로컬만 · 상세]

사용자 잠금(2026-09-24): 원래 탭에서 이어가는 게 최선·무난. 노션 A 채택.
커서「새 탭만 writer」는 기각. 단, 커서 진단(두 탭 동시 basic-register)은 채택해 고친다.
base≈f6b5400. push / build:dothome 금지. git add -A 거부.

■ 목표
1) 메일 링크 새 탭 = 확인 성공 전용(세션·verified 처리 OK).
2) 원래 대기 탭 = 유일한 Basic writer. verified 감지 후 그 탭만 continueAfterVerified / basicRegisterPathForMe.
3) 원래 탭 닫힘 폴백만: 새 탭에 「이 창에서 이어가기」보조.
4) 서버: BasicRegisterService 학생(가능하면 공통) 중복 INSERT가 UX 오류로 안 터지게 upsert/already_saved 흡수. 새 테이블·마이그레이션 금지.
5) 카피: 073「새 창에서 이어가기·이 탭 닫아도 됨」폐기 → 「새 탭에서 링크 확인 → 원래 탭에서 Basic」.

■ 금지 (C)
- OTP로 교체
- Gmail 새탭 차단·OS식 탭잠금·close() 강제 의존
- signup-basic.js / student-basic.css / basic-student.php / signup-basic.php (086 WIP)
- home-ui/** · location-display · ProviderUsage · helpers.php · teaser · tmp
- 086·홈 dirty와 한 커밋/스테이징에 섞기
- push · build:dothome
- postVerifyTarget/역할 덮어쓰기 회귀
- BroadcastChannel만 신뢰(서버 email_verified 재조회 필수)

■ Allowlist (B만)
preview/auth-ui/src/screens/signup-verify-email.js
preview/auth-ui/src/layout.js (최소·필요시)
preview/shared/<verify sync 신규 1파일 가능·보고>
src/Auth/EmailVerificationService.php (메일본문 카피 시에만)
src/Auth/BasicRegisterService.php (upsert/흡수만)
public/assets/css/auth/mvc.css (최소·필요시)
밖이면 중단·보고.

■ 동작 잠금
대기탭: 확인 전 잠금 안내. focus/visibilitychange/짧은 폴링(+권장 BC/storage)으로 verified → 이 탭만 Basic.
메일탭: 성공 안내만. 기본 Basic 버튼/자동 continueAfterVerified 제거. 폴백 버튼만.
메일탭이 Basic URL 직행 시 read-only 유도는 권장(어려우면 보고 후 N3+서버로 충분 가능).

■ 가설(재검증)
signup-verify-email.js: verifiedFromLink면 early return 후 성공UI; 대기탭은 email_verified면 continueAfterVerified. 두 writer 충돌. 검증 후 보고.

■ 스모크
탭1 대기 카피OK → 탭2 확인·Basic자동없음 → 탭1 Basic → 이중저장 흡수 → 탭1닫고 탭2 폴백 → 역할 회귀 · C미포함 · push없음.

■ 보고
가설검증 · B파일목록 · 카피전문 · 신호/폴링 · 서버흡수요지 · 스모크 · git status에 086/home 미스테이징.
```

---

## 변경 이력

| 일시 (KST) | 내용 |
|------------|------|
| 2026-09-24 22:30 | 사용자「원래 탭」잠금 · 088 대체 상세 · 073 카피 폐기 · 서버 안전망 |
