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
- `sql/schema/088_provider_identity_verification.sql` — `user_profiles` 5칸 + UNIQUE 2개(`identity_ci_hash`, `identity_tx_id`)를 ALTER 한 번. `information_schema`·`PREPARE` 없음
- 로컬 Docker 새 DB `study114_088check`에 평문 088 적용 1회 (Actions는 SQL 미실행)

### 서버
- `IdentityVerificationService` · `PortOneIdentityClient` · `IdentityVerificationException`
- API: `GET/POST /api/auth/identity-verification/{config,complete}.php`
- Hub `setInquiry` open 시 `identity_required` 가드 (공부방·과외)
- Messages: **새 쪽지(콜드)만** 수신 피어 `open`+본인인증 검사. 이미 시작된 대화 답장은 inquiry/본인인증 게이트 없음
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
- `public/.htaccess` placeholder: `PORTONE_STORE_ID` · `PORTONE_API_SECRET` · `PORTONE_IDENTITY_CHANNEL_KEY` · `PORTONE_IDENTITY_TEST_CHANNEL_KEY` · `STUDY114_IDENTITY_CI_PEPPER`
- `deploy.yml`: 365 Secrets는 **없으면 경고만**(fail-soft). 빈 값 주입 → 앱 fail-closed(쪽지 ON 불가, 사이트 정상)
- `config/dothome.env.example` · `preview/home-ui/.env.example` 이름만
- 채널: 허용목록(`STUDY114_TEST_ACCOUNT_EMAILS`) → `PORTONE_IDENTITY_TEST_CHANNEL_KEY`, 그 외 → `PORTONE_IDENTITY_CHANNEL_KEY`
- SSOT 20: 휴대폰 게이트 → 본인인증 게이트로 교체
- 자동 테스트: `npm run verify:identity-inquiry-gate` (`scripts/verify-identity-inquiry-gate.php`)

## 거부 경로

| 코드 | 언제 |
|------|------|
| `identity_required` | 미인증 공급자가 `inquiry_status=open` 저장 / 쪽지 수신 피어(신규만) |
| `identity_channel` | channel.key/type·storeId 불일치 · 허용목록 밖 TEST · 채널 env 미설정 |
| `identity_pepper` | CI pepper 미설정(포트원 조회 전) |
| `identity_replay` | 세션/ID 불일치 · tx 재사용 · verifiedAt 10분 초과 |
| `identity_duplicate` | 동일 ci_hash 타 계정 |
| `identity_invalid` | 미 VERIFIED · 페이로드 부족 등 |
| `forbidden` | 비공급자 config/complete |

## 테스트표 (365-2단계 보완 · 로컬 Docker + 로컬 계정)

로컬 계정 alias만: `local-room1/2` · `local-tutor1` · `local-std1` (비밀번호·이메일은 비밀 파일, 채팅 미기록)

| # | 시나리오 | 기대 | 결과 |
|---|----------|------|------|
| T1 | 미인증 공부방 PATCH inquiry `open` | 403 `identity_required` | **PASS** `http=403 error=identity_required` |
| T1b | 미인증 과외 PATCH inquiry `open` | 403 `identity_required` | **PASS** |
| T2 | 학생 me/게이트 | 인증 없이 me 통과 · config/complete는 공급자 아님 | **PASS** me_ok · cfg=403/forbidden · complete=422/identity_invalid |
| T2b | 학생 `assertProviderVerifiedForInquiryOpen` | throw 없음 | **PASS** |
| T3 | 위조 `identityVerificationId` | `identity_invalid` | **PASS** `422 identity_invalid` |
| T3b | 빈 id | `identity_invalid` | **PASS** |
| T4 | 동일 CI 해시 2계정 | UNIQUE 1062 + `ciHashTakenByOther` → duplicate 경로 | **PASS** |
| T5a | room1→room2 inquiry PATCH (IDOR) | 거부 | **PASS** `422 validation`(타 소유 방 없음) |
| T5b | room2 인증 시도 후 room1 verified 유지 false | 교차 변경 없음 | **PASS** |
| T5c | room2 planted hash 유지 | 타계정 필드 불변 | **PASS** |
| T7 | 샌드박스 실인증 E2E | 완료까지 | **STOP** PortOne UI 팝업(`pages_open=2`) — **종현이 공급자 창에서 인증 완료 필요** |

## 캡처

경로: `docs/worklog/2026/11/shots-365/`

| 파일 | 상태 |
|------|------|
| `365-before-1280.png` / `365-before-390.png` | 인증 전 |
| `365-success-1280.png` / `365-success-390.png` | 인증 성공(배지) |
| `365-fail-1280.png` / `365-fail-390.png` | 실패 문구 |
| `365-room-inq-unverified-*` · `365-tutor-inq-unverified-*` | 초기 미인증 |
| `365-sandbox-after-click.png` | 실인증 클릭 직후(공급자 UI) |
| `365-sandbox-report.txt` | E2E 중단 로그(비밀 없음) |

### 데스크톱 1px 비교

`365-layout-before.json` vs `365-layout-success.json` (쪽지 카드 2개):

- width **736=736** · left **248=248** · saveW **120=120** · `desktop_card_width_match=true`
- 본인인증 카드는 **추가 블록**만. 기존 `p20-inq-card` 폭·좌측 오프셋 불변.

## 운영 배포 전 할 일 (사용자)

1. 운영 phpMyAdmin에 **088** 적용. 닷홈은 `information_schema`가 빈 결과라, 파일은 평문 ALTER 한 번이다. 아래 확인을 먼저 하고, `identity%`가 0행일 때만 실행한다. 다시 실행하면 컬럼 중복으로 실패한다.

실행 전:

```sql
SHOW COLUMNS FROM user_profiles LIKE 'identity%';
```

0행이어야 한다.

적용 후 (`identity%` 5행, UNIQUE 2개, 기본값 `paused`, 미인증 open 잔여 0):

```sql
SHOW COLUMNS FROM user_profiles LIKE 'identity%';
SHOW INDEX FROM user_profiles WHERE Key_name IN (
  'uq_user_profiles_identity_ci_hash',
  'uq_user_profiles_identity_tx_id'
);
SHOW COLUMNS FROM study_rooms LIKE 'inquiry_status';
SHOW COLUMNS FROM tutors LIKE 'inquiry_status';
SELECT COUNT(*) AS study_rooms_backed_up FROM _088_backup_study_rooms_inquiry;
SELECT COUNT(*) AS tutors_backed_up FROM _088_backup_tutors_inquiry;
SELECT COUNT(*) AS study_rooms_open_unverified
  FROM study_rooms sr
  LEFT JOIN user_profiles up ON up.user_id = sr.user_id
 WHERE sr.inquiry_status = 'open'
   AND (
     up.user_id IS NULL
     OR up.identity_verified_at IS NULL
     OR NULLIF(TRIM(up.identity_ci_hash), '') IS NULL
     OR NULLIF(TRIM(up.identity_tx_id), '') IS NULL
   );
SELECT COUNT(*) AS tutors_open_unverified
  FROM tutors t
  LEFT JOIN user_profiles up ON up.user_id = t.user_id
 WHERE t.inquiry_status = 'open'
   AND (
     up.user_id IS NULL
     OR up.identity_verified_at IS NULL
     OR NULLIF(TRIM(up.identity_ci_hash), '') IS NULL
     OR NULLIF(TRIM(up.identity_tx_id), '') IS NULL
   );
```
2. GitHub Secrets: `PORTONE_STORE_ID` · `PORTONE_API_SECRET` · `PORTONE_IDENTITY_CHANNEL_KEY`(실채널) · `PORTONE_IDENTITY_TEST_CHANNEL_KEY`(허용목록=샌드박스) · `STUDY114_IDENTITY_CI_PEPPER`(32자+ 난수). 미설정 시 배포는 되고 인증만 fail-closed
3. CF CSP Enforce에 추가 (실측 위반 우선, 예상):
   - `script-src`: `https://cdn.portone.io` `https://*.portone.io` `https://sa.inicis.com` `https://*.inicis.com`
   - `frame-src`: `https://checkout-service.prod.iamport.co` `https://*.portone.io` `https://cdn.portone.io` `https://sa.inicis.com` `https://*.inicis.com`
   - `connect-src`: `https://api.portone.io` `https://*.portone.io` `https://cdn.portone.io` `https://sa.inicis.com` `https://*.inicis.com` `https://checkout-service.prod.iamport.co`
4. 허용목록 계정은 TEST 채널, 그 외는 실채널. 로컬 키는 TEST 키로 `PORTONE_IDENTITY_TEST_CHANNEL_KEY`에 둔다
5. `.htaccess`·문서에 실키 평문 커밋 금지

## 자체검수

- [x] CI 원문·생년·휴대폰 컬럼 없음
- [x] 로그에 PII/키 미출력 (status·id_len만)
- [x] SMS OTP 경로 미연결
- [x] 유예 없음
- [x] placeholder만 .htaccess
- [~] 샌드박스 실인증 E2E — 로컬 로그인·CTA·PortOne 창까지 확인, **공급자 UI 인증은 종현**
- [x] 1280/390 전·성공·실패 캡처
- [x] 데스크톱 쪽지 카드 폭 1px 비교 (일치)
- [x] config 미로그인 401
- [x] PHP lint (Identity* · complete.php)
- [x] API T1~T5 (로컬 계정)

## 365-보완2 (PR #171 검수 보완)

| # | 항목 | 결과 |
|---|------|------|
| 1 | 채널 2개(TEST 허용목록 / 실채널) · config/complete 동일 · TEST 거부 · 로컬키=TEST · impl·env.example | 반영 |
| 2 | 서버 발급 ID+세션 · tx UNIQUE · verifiedAt 10분 · 재complete no-op · pepper 선검사 | 반영 |
| 3 | 신규 inquiry 기본 paused · 088 open→paused · 공개/검색 마스킹(CTA 숨김) | 반영 |
| 4 | AdminExposure open 금지 | 반영 |
| 5 | Messages 새 쪽지만 게이트 · 문서 | 반영 |
| 6 | 088 `USE study114` · rollback( paused 미복구 명시) | 반영 |
| 7 | deploy 365 Secrets fail-soft · 앱 fail-closed | 반영 |
| 8 | `npm run verify:identity-inquiry-gate` — pass=18 fail=0 | PASS |
| 9 | 캡처·disabled·데스크톱 수치 | 아래 |

### 보완2 캡처

- `docs/worklog/2026/11/shots-365/365-complement2-success-toast-1280.png` — 토스트+자동 ON
- `docs/worklog/2026/11/shots-365/365-complement2-duplicate-ci-1280.png` — 중복 CI
- `docs/worklog/2026/11/shots-365/365-complement2-unverified-disabled-1280.png` — `.p21-inq-choice.is-disabled`
- 수치 JSON: `365-complement2-desktop-compare.json`

### main 대비 데스크톱 (1280)

| 항목 | 값 |
|------|-----|
| 쪽지 카드 width | **736** (main 비교 기준과 동일, delta 0) |
| left | **248** |
| 저장 버튼 width | **120** (delta 0) |
| 현재상태 카드 높이 | 미인증 **229** / 성공 **177** (게이트 축소 Δ52) |
| 인증 블록 높이 | 미인증 게이트 **+100px** (성공 배지 48px) |
| `.p21-inq-choice.is-disabled` | main 없음 → 브랜치 추가 |

## 365-보완3 (PR #171 마무리)

| # | 항목 | 결과 |
|---|------|------|
| 1 | `channel.type` TEST/LIVE 엄격 · `storeId` 필수 | 반영 |
| 2 | 고객 ID: `requestedCustomer.id` 우선 필수 대조(`verifiedCustomer.id` 폴백) · 로그에 필드명만 | 반영 |
| 3 | verify: 오류 코드 확인 · Hub 「찾을 수 없」 제거 · 실제 답장 insert | **pass=19 fail=0** (커밋 전 재실행) |
| 4 | 088 백업 테이블 + rollback 복구 · profiles 없는 소유자도 paused | 반영 |
| 5 | BasicRegister 공부방 INSERT `inquiry_status=paused` | 반영 |
| 6 | 검색·공개 JOIN 1회 CASE 마스킹 | 반영 |
| 7 | 샌드박스 실인증 + CSP 호스트 | **미완** (아래) |

### 7번 미완 사유

1. 첫 샌드박스 실행 시 계정이 이미 인증 상태라 PortOne 창·호스트 수집 없이 `verified=true`만 찍힘  
2. identity를 지운 뒤 재실행에서는 대기 시간 안에 인증이 완료되지 않음(호스트·CSP 빈 목록)  
3. CTA 자동 클릭 재실행에서는 쪽지설정 게이트 버튼을 못 찾아 포트원 창이 열리지 않음  

**실인증은 종현 수동 1회로 진행 예정.** 그 결과로 CSP 위반 목록·실사용 PortOne/이니시스 호스트를 확정한다.
