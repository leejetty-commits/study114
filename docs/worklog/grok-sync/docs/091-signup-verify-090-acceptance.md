# 091 · 수락 — 090 메일확인 원래 탭 writer (로컬)

- 작성일: 2026-09-24 (KST)
- 티켓: [090](090-signup-verify-original-tab-writer-ticket.md)
- 상태: **로컬 기능 수락** · push/`build:dothome` **금지**
- 보완지시문: **없음** (잔여 유보만)

---

## 0. 판정

**수락.** 090 목표(단일 writer · 메일탭 확인만 · 폴백 · 서버 기존행 반환 · 카피 · push 없음) 충족.

| 항목 | 결과 |
|------|------|
| 가설(verified=1 vs 대기탭 continue) 재확인 | 통과 |
| 대기탭 = 유일 Basic writer (폴링 2.5s · focus · visibility · ping 깨우기) | 통과(보고) |
| 1차 진실 = 서버 `email_verified` | 통과 |
| 메일탭 성공만 · 자동 Basic 없음 · 직행 차단 · 폴백 | 통과(보고) |
| 카피 073「새창만」폐기 · 원래탭 톤 | 통과(보고 문장) |
| 서버 FOR UPDATE + 기존 id 반환 · 새테이블 없음 | 통과(diff) |
| Allowlist 안 · C 미스테이징 · push 없음 | 통과 |
| 실제 이중 INSERT mysqli | **유보**(환경) — 코드 경로로 충분, 배포 전 가능하면 실INSERT |
| role_type만으로 continue | 통과(회귀 없음 보고) |

---

## 1. 파일 (090 범위)

| 파일 | 비고 |
|------|------|
| `preview/auth-ui/src/screens/signup-verify-email.js` | 핵심 |
| `preview/shared/email-verify-tab.js` | 신규 · 채널 `study114-email-verify` |
| `preview/auth-ui/src/layout.js` | 직행 차단 등 · **086 dirty 혼재** |
| `src/Auth/EmailVerificationService.php` | 메일본문 카피 |
| `src/Auth/BasicRegisterService.php` | 기존행 반환 · **086(grade_level 등) dirty 혼재** |

배포 시: 090만 올릴 때는 **이 다섯(+번들 산출물)** 만 allowlist. `signup-basic.js`·home·helpers·teaser **제외**. `layout.js`/`BasicRegisterService.php`는 086과 파일이 겹치므로 **선택 스테이징 또는 086과 한 배치**로만.

---

## 2. 잔여 (수락 차단 아님)

1. mysqli 막혀 이중 INSERT 실측 유보 → 배포 전 스모크 권장.  
2. 서버는 「이미 있으면 id 반환」이지 payload 전체 upsert는 아님 — 090 S2 허용 범위.  
3. 미배포.

---

## 변경 이력

| 일시 (KST) | 내용 |
|------------|------|
| 2026-09-24 22:40 | Cursor 090 보고 대조 · 로컬 수락 |
