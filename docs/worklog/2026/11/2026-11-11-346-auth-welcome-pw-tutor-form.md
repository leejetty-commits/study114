# 346 — 환영 카피 · 비번 보이기 · 과외쌤 폼 · 주소 이중입력 조사

**브랜치:** `work/346-auth-welcome-pw-tutor-form`  
**기준:** `origin/main` (`30a9c15c`)  
**일시:** 2026-11-11  
**작업 폴더:** `D:\work\study114\.wt\work-346-auth-welcome-pw-tutor-form`

## 지시 요점

1. 로그인·가입 환영 카피 후보 2~3안 → **1안 구현**
2. 이메일 중복 차단 확인 · 비밀번호 보이기/감추기 토글
3. 공부방 주소 이중입력 **조사만** (승인 전 구현 금지)
4. 과외쌤 가입정보 폼 overflow 수정  
→ **1+2+4 한 PR** · 3은 별도 보고·승인 후

---

## 1. 환영 카피 후보

| 안 | 제목 | 부제 |
|----|------|------|
| **1안 (채택)** | 우동공과에 오신 걸 환영해요 | 우리 동네 공부방·과외쌤을 쪽지로 이어 보세요. |
| 2안 | 우리 동네 공부 연결에 오신 걸 환영해요 | 공부방·과외쌤을 쪽지로 만나 보세요. |
| 3안 | 만나서 반가워요 | 로그인하면 우리 동네 공부방·과외쌤을 이어 볼 수 있어요. |

**채택 이유:** 브랜드명 선명 · 쪽지 연결 가치 한 줄 · 압박·탓 없음(해요체).

**적용:** `AUTH_WELCOME_COPY.gateTitle` / `gateSub`  
- 로그인 `h1`+부제  
- 약관 동의: 같은 환영 → 섹션「약관 동의」+ `termsSub`

---

## 2. 이메일 중복 · 비밀번호 토글

### 이메일 중복 (이미 막힘 — 코드 변경 없음)

| 층 | 내용 |
|----|------|
| 정규화 | `EmailNormalizer::normalize` = `strtolower(trim)` |
| 서비스 | `SignupService` / `AccountContactService` → 「이미 사용 중인 이메일…」 |
| DB | `users.email` UNIQUE (탈퇴 시 재가입 풀어주는 별도 경로 있음) |

대소문자만 다른 주소도 동일 취급.

### 비밀번호 보이기/감추기

- 공용: `preview/shared/password-field.js` + `.css`
- 기본 `type=password` · 버튼 「보이기」↔「감추기」 · `aria-pressed`/`aria-label`
- 적용: 로그인 · 가입폼(비번·확인) · 재설정 · 마이페이지 비밀번호 변경

---

## 3. 공부방 주소 이중입력 — 조사만 (구현 없음)

### UI (공부방 기본등록)

| 라벨 | 필드명 | 힌트(현재) |
|------|--------|------------|
| 집주소 | `home_address` (+ zip/line2) | 계정·연락용. 검색·지도·홍보에 안 씀 |
| 사업장주소 | `address_text` (+ zip/line2) | 지도 핀. 홈 카드 「위치」에는 안 나감 |
| 홍보지역 1~3 | 슬롯 | 카드 「위치」= 홍보1(대표). 개설주소 확정 시 홍보1만 채움(직접 고치면 덮지 않음) |

공통 가입폼(`signup/form`) 주소 → 계정 `user_profiles`로 들어감.  
공부방 기본의 **집주소**도 같은 `user_profiles.address_line1/zip/line2`에 UPDATE.

### 저장

| 값 | 테이블 |
|----|--------|
| 가입 주소 / 집주소 | `user_profiles.address_line1`, `address_zip`, `address_line2` |
| 사업장주소 | `study_rooms.address_text` (+ 좌표 등) |
| 홍보지역 | `study_room_regions` (슬롯) |

지도 핀·검색 반경은 **사업장(개설) 주소 좌표** 기준. 집주소는 노출·핀에 쓰이지 않음.  
가입 때 넣은 주소를 집주소 초깃값으로 넘기는 경로 있음(`draft.address` / `signupState.accountAddress`).

### 정리 (승인 대기)

- 「이중」은 UI 두 칸이지만 **저장 목적·테이블이 다름** (계정 연락 vs 사업장/지도).
- 사업장·홍보 로직·핀 정책은 건드리면 안 됨.
- 통합/생략 여부는 **제품 승인 후** 별 티켓. 이번 PR에 코드 변경 없음.

---

## 4. 과외쌤 가입정보 overflow

- `form-group--full`: 월 과외비 · 주 회수 · 1회 수업시간
- 신규 `preview/auth-ui/src/styles/tutor-basic-form.css` — **`form[data-form=basic-tutor]`만**  
  지역 헤더 `form-row` 잘림 · select `min-width:0` · 640px 이하 1열

---

## 5. 스크린샷 (after)

로컬 auth-ui `:5173` · Playwright. before는 코드 선반영으로 생략.

| 화면 | 1280 | 390 |
|------|------|-----|
| 로그인 | `tmp/346-shots/after-login-1280.png` | `after-login-390.png` |
| 약관 | `after-terms-1280.png` | `after-terms-390.png` |
| 과외쌤 픽스처 | `after-tutor-1280.png` | `after-tutor-390.png` |

확인: 환영 카피 · 「보이기」토글 · 과외쌤 2열·긴 시·도 잘림 없음.

---

## 6. Git / PR

- 허용 stage만 (`git add -A` 금지). `tmp/`·픽스처 HTML 커밋 안 함.
- PR: 1+2+4. 항목 3은 본 워크로그 §3.
