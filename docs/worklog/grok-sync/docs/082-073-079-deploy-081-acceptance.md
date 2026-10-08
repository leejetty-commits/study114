# 082 · 수락 — 081 배포 (073 메일·공부방희망 모듈 + 079 픽)

- 작성일: 2026-09-24 (KST)
- 배포 티켓: [081](081-073-079-allowlist-deploy-ticket.md)
- 로컬 수락 선행: [077](077-signup-073-mail-guidance-hope-region-acceptance.md) · [080](080-home-pick-vacant-079-acceptance.md)
- 상태: **운영 배포 수락** (희망지역 **화면**은 잔여 · 아래 §2)

---

## 0. 판정

| 축 | 결과 |
|----|------|
| allowlist 6파일 · C 미포함 | **수락** |
| base `f6b8498` → `4dae030` · push origin/main | **수락** |
| Deploy to dothome Run **329** | **수락** |
| ShopPage gate 162 · Board ACL 264 | **수락** |
| Tutor register same-tab Run 30 실패 | **비관련** (직전 Run 29도 동일 실패 · 이번 6파일 탓 아님) |
| 073 Part A 메일 새탭 카피 운영 번들 | **수락** |
| 079 픽 `data-pick-empty` 홈 번들 | **수락** (로그인 실0 브라우저 유보) |
| 073 Part B 희망지역 **사용자 화면** | **부분** — 공유 모듈만 배포 · 호출부 `signup-basic.js` 미배포 → 운영 인증 번들에 **은마 폴백 잔존** (081 의도) |
| CF 525 헤더 점검 | **인프라** · 앱 롤백 사유 아님 · `#/guest` 대치 열림 |

**한 줄:** 배포 절차·메일·픽 코드는 운영 수락. 희망지역 **검색 UI는 아직 운영 미반영**(다음 selective).

---

## 1. 증거

| 항목 | 값 |
|------|-----|
| base | `f6b8498` |
| 커밋 | `4dae030` `fix: mail new-tab copy, study-room hope region, pick vacant 1+EMPTY4` |
| push | `f6b8498..4dae030` → `origin/main` |
| dothome | Run **329** 성공 (로컬 `build:dothome` 없음 · Actions 빌드) |
| cached | 아래 6경로만 |

```
preview/auth-ui/src/screens/signup-verify-email.js
preview/auth-ui/src/styles/base.css
src/Auth/EmailVerificationService.php
preview/shared/study-room-basic-form.js
preview/home-ui/src/exposure-render.js
preview/home-ui/src/styles/udx-std-apply.css
```

운영 스모크(Cursor):
- 메일: `/auth/assets/index-DH-ZlYU6.js`에 새 탭 안내 · 「이 창에서 기본정보를 이어서 입력하세요.」
- 희망: 호출부 미배포 → 은마 폴백 유지 · 「샘플 주소」문구 없음
- 홈: `data-pick-empty` 포함 · 로그인 실0 미확인
- 게스트 `#/guest`: 대치 · 샘플0 · 픽빈0 · 프라임빈2(데모) · 당시 CF 5xx 아님
- 헤더 한 번 525 → 앱 실패 아님

로컬(ljh_work) 재확인: `HEAD`=`origin/main`=`4dae030` · show 파일 6개 일치 · `signup-basic.js` 등 C는 워킹트리 dirty로 잔존.

---

## 2. 잔여 (차단 아님)

1. **학생·가입 Basic 희망지역 UI** — `signup-basic.js` (+필요 시 9축 분리) selective 배포 전까지 운영은 구 UI(은마 폴백).
2. 로그인 공부방 · 실노출 0에서 픽 샘플1+EMPTY4 · 프라임 샘플1+EMPTY2 육안 1회.
3. Tutor register same-tab 워크플로 실패는 **별 트랙**(이번 배포와 무관).
4. CF/닷홈 간헐 525·522 — [076](076-cloudflare-525-ssl-handshake-incident.md) · [078](078-hosting-migrate-candidates-dev-stage.md).

---

## 3. 다음

- 사용자 추가 작업 **없음**. 희망지역 화면까지 운영에 필요하면 「학생 Basic 희망지역만」또는 「9축 수락 후」라고 지시.
- 노션 동기화는 요청 시에만.

---

## 변경 이력

| 일시 (KST) | 내용 |
|------------|------|
| 2026-09-24 18:48 | Cursor 081 보고 대조 · 운영 배포 수락(희망 UI 부분) |
