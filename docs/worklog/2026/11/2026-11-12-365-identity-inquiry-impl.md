# 365 · 쪽지 허용 본인인증 — 2단계 구현

**브랜치:** `work/365-identity-design`  
**작업 폴더:** `D:\work\study114\.wt\work-365-identity-design`  
**기준 설계:** `2026-11-12-365-identity-inquiry-design.md`  
**일시:** 2026-11-12

## 지시 요점

- SQL **088** · 유예 없음 · 저장 5칸만(ci_hash·verified_at·provider·tx_id·이름)
- 공부방·과외만 · 학생 제외
- 포트원 V2 × KG 통합인증 · 서버 단건 조회로만 완료 기록
- SMS OTP(053) 유지·미사용
- 로컬 Vite CSP만 추가 · 운영 CF CSP는 호스트 목록만 보고
- 비밀/PII 커밋·출력 금지

## 검수·승인

| 시각 | 내용 |
|------|------|
| 2026-11-12 | 365-2단계 복명복창 → 종현 「ㅇㅋ」 → 구현 |

## 구현 요약

### DB
- `sql/schema/088_provider_identity_verification.sql` — `user_profiles` 5칸 + UNIQUE(`identity_ci_hash`)
- 로컬 Docker `study114_dev` 적용 완료 (Actions는 SQL 미실행)

### 서버
- `IdentityVerificationService` · `PortOneIdentityClient` · `IdentityVerificationException`
- API: `GET/POST /api/auth/identity-verification/{config,complete}.php`
- Hub `setInquiry` open 시 `identity_required` 가드 (공부방·과외)
- Messages 수신 피어 open 시 미인증 거부
- 탈퇴 시 5칸 NULL
- `me.php` → `identity_verified` / `identity_verified_at`
- bootstrap: 로컬 `.env`의 `PORTONE_*` · `STUDY114_IDENTITY_*` 로드 (워크트리→루트)

### 프론트
- `provider-identity-gate.js` + CSS — 공통 카드
- 공부방 P20 · 과외 P21 쪽지설정 연동 (미인증 시 ON 잠금 · 인증 후 자동 open 저장)

### CSP (로컬 Vite만)
`preview/home-ui/vite.config.js` server/preview headers:
- `script-src` / `frame-src` / `connect-src`에 `cdn.portone.io` · `*.portone.io` · `api.portone.io` · `sa.inicis.com` · `*.inicis.com` · checkout iamport
- **운영 CF CSP는 미변경** — 배포 전 아래 호스트 목록을 CF에 추가해야 함

### env · 배포
- `public/.htaccess` placeholder: `PORTONE_STORE_ID` · `PORTONE_API_SECRET` · `PORTONE_IDENTITY_CHANNEL_KEY` · `STUDY114_IDENTITY_CI_PEPPER`
- `deploy.yml` 필수 Secrets 주입 추가
- `config/dothome.env.example` · `preview/home-ui/.env.example` 안내
- SSOT 20: 휴대폰 게이트 → 본인인증 게이트로 교체

## 거부 경로

| 코드 | 언제 |
|------|------|
| `identity_required` | 미인증 공급자가 `inquiry_status=open` 저장 / 쪽지 수신 피어 |
| `identity_channel` | channelKey 불일치 · 채널 env 미설정 |
| `identity_duplicate` | 동일 ci_hash 타 계정 |
| `identity_invalid` | 미 VERIFIED · 페이로드 부족 · pepper 없음 등 |
| `forbidden` | 비공급자 config/complete |

## 테스트표

| # | 시나리오 | 기대 | 결과 |
|---|----------|------|------|
| T1 | 미인증 + 공부방 open 저장 | 403 `identity_required` | 코드 가드 ○ · 실API는 로컬 API기동 후 |
| T2 | 미인증 + 과외 open 저장 | 동일 | FE 잠금 ○ |
| T3 | 인증 완료 후 open | 저장 성공 · 배지 표시 | 샌드박스 실인증 필요 |
| T4 | 미인증 피어로 쪽지 작성 | 수신 거부 | 서버 가드 ○ |
| T5 | 학생 역할 | 본인인증 대상 아님 | `isProviderRole` ○ |
| T6 | 탈퇴 | 5칸 NULL · UNIQUE 해제 | 코드 ○ |
| T7 | CSP 로컬 | SDK/인증창 blocked 없음 | Vite 헤더 추가 ○ · 실창 확인 필요 |

## 캡처

경로: `docs/worklog/2026/11/shots-365/` (목 로그인 · 미인증)

| 파일 | 비고 |
|------|------|
| `365-room-inq-unverified-1280.png` | 공부방 · 게이트·ON 잠금 |
| `365-room-inq-unverified-390.png` | 공부방 390 |
| `365-tutor-inq-unverified-1280.png` | 과외 · 동일 |
| `365-tutor-inq-unverified-390.png` | 과외 390 |

실측: `hasGate=true` · `receivingLocked=1` (미인증 시 받는 중 라디오 disabled)

## 운영 배포 전 할 일 (사용자)

1. 운영 phpMyAdmin에 **088** 적용
2. GitHub Secrets: `PORTONE_STORE_ID` · `PORTONE_API_SECRET` · `PORTONE_IDENTITY_CHANNEL_KEY` · `STUDY114_IDENTITY_CI_PEPPER`(32자+ 난수)
3. CF CSP Enforce에 추가 (실측 위반 우선, 예상):
   - `script-src`: `https://cdn.portone.io` `https://*.portone.io` `https://sa.inicis.com` `https://*.inicis.com`
   - `frame-src`: `https://checkout-service.prod.iamport.co` `https://*.portone.io` `https://cdn.portone.io` `https://sa.inicis.com` `https://*.inicis.com`
   - `connect-src`: `https://api.portone.io` `https://*.portone.io` `https://cdn.portone.io` `https://sa.inicis.com` `https://*.inicis.com` `https://checkout-service.prod.iamport.co`
4. 실채널(과금) 전환 시 `PORTONE_IDENTITY_CHANNEL_KEY`만 교체 · 샌드박스와 혼용 금지
5. `.htaccess`·문서에 실키 평문 커밋 금지

## 자체검수

- [x] CI 원문·생년·휴대폰 컬럼 없음
- [x] 로그에 PII/키 미출력 (status·id_len만)
- [x] SMS OTP 경로 미연결
- [x] 유예 없음
- [x] placeholder만 .htaccess
- [ ] 샌드박스 실인증 E2E (종현 채널 · 로컬 로그인 후)
- [x] 1280/390 미인증 UI 캡처 첨부
- [x] config 미로그인 401
- [x] PHP lint (Identity* · complete.php)
