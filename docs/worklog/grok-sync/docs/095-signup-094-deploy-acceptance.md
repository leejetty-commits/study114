# 095 · 수락 — 094 배포 (086+090+092)

- 작성일: 2026-09-24 (KST)
- 배포 티켓: [094](094-signup-086-090-092-allowlist-deploy-ticket.md)
- 로컬 수락 선행: [087](087-signup-student-basic-086-acceptance.md) · [091](091-signup-verify-090-acceptance.md) · [093](093-tutor-region-092-acceptance.md)
- 상태: **운영 배포 수락**

---

## 0. 판정

| 축 | 결과 |
|----|------|
| allowlist 14파일 · C 미포함 | **수락** (`git show 4660fd8` 대조) |
| base `f6b5400` → `4660fd8` · push origin/main | **수락** |
| Deploy to dothome Run **331** | **수락** |
| ShopPage #164 · Board ACL #266 | **수락** |
| Tutor register same-tab #32 실패 | **비관련** (직전 `f6b5400` #31도 실패 · 이번 14파일 탓 아님) |
| 로컬 build:dothome 없음 · Actions 빌드 | **수락** (081/083 관례) |
| C dirty 워킹트리 잔존 · 커밋 밖 | **수락** |
| 운영 브라우저 재오픈 | **유보** (Cursor 커밋 기준 스모크 · 배포 후 페이지 미재오픈) |

**한 줄:** 086 학생 기본 아홉 칸 · 090 메일 원래 탭 · 092 과외 도→시·군이 `4660fd8` / dothome #331로 운영 반영. Tutor same-tab 실패는 기존 게이트 이슈.

---

## 1. 증거

| 항목 | 값 |
|------|-----|
| base | `f6b5400` |
| 커밋 | `4660fd8` `fix(signup): student basic 9 fields, original-tab verify, tutor sido→si/gun` |
| push | `f6b5400..4660fd8` → `origin/main` |
| dothome | Run **331** 성공 (ftp-deploy 포함) |
| 파일 14 | 아래 목록 = 094 B와 일치 |

```
preview/auth-ui/src/layout.js
preview/auth-ui/src/main.js
preview/auth-ui/src/screens/signup-basic.js
preview/auth-ui/src/screens/signup-verify-email.js
preview/auth-ui/src/styles/student-basic.css
preview/shared/email-verify-tab.js
preview/shared/korea-sidos.js
preview/shared/tutor-region-slots.js
public/assets/css/auth/mvc.css
src/Auth/BasicRegisterService.php
src/Auth/EmailVerificationService.php
src/Views/auth/partials/basic-student.php
src/Views/auth/signup-basic.php
src/helpers.php
```

커밋 밖(의도): provider-status · study-room-reg · location-display · ProviderUsage · teaser · tmp · _verify · untracked docs

---

## 2. 스모크 (Cursor 보고 · 화면 이름)

| # | 결과 |
|---|------|
| 학생 가입 · 기본정보 아홉 칸 | 통과(보고) |
| 과외 희망 · 활동지역 L1/L2 | 통과(보고) |
| 공부방 희망 주소검색 유지 | 통과(보고) |
| 메일확인 원래 탭 이어가기 · 새 탭 폴백 | 통과(보고) |
| 가평군 API 행 없음 → region_id 비움 | **알려진 한계**(093) · 데이터 시드 아님 |
| 운영 URL 재오픈 | 미실시 · 필요 시 별도 |

---

## 3. 잔여

1. Tutor register same-tab 워크플로 실패 — 배포 롤백 사유 아님 · 별도 추적.  
2. cities API 군 행(가평군 등) — 후속.  
3. C 워킹트리 dirty 정리 — 배포와 무관 · 원할 때.

---

## 변경 이력

| 일시 (KST) | 내용 |
|------------|------|
| 2026-09-24 23:47 | Cursor 094 보고 · SHA·14파일·#331 대조 · 운영 수락 |
