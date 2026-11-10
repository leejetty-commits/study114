# 347 — 공부방 집주소 일원화 (가입 1회 · 기본등록 중복 제거)

**브랜치:** `work/347-study-room-home-address-unify`  
**기준:** `origin/main` (`30a9c15c`) · **346과 분리**  
**일시:** 2026-11-11  
**작업 폴더:** `D:\work\study114\.wt\work-347-study-room-home-address-unify`

## 지시 요점

- 가입 `signup/form` 라벨 「주소」→「집주소」
- 공부방 기본등록 집주소 입력·필수 제거 (화면·서버)
- `user_profiles`는 가입값 유지 · 기본등록 저장 시 덮어쓰지 않음
- 마이페이지 계정 집주소 수정은 유지(아래 §4)
- 사업장·핀·홍보·반경10km·스키마·홍보잠금 손대지 않음

---

## 1. 라벨 적용 범위

| 화면 | 결과 |
|------|------|
| `signup/form` (역할 선택 **전** 공통) | **공통** 「집주소」 — 학생·과외쌤·공부방 모두 |
| PHP `src/Views/auth/signup-form.php` | 동일 공통 |

공부방만 분기하려면 역할 선택 순서 변경이 필요해 이번 범위 밖. **공통 적용**.

---

## 2. 변경 요약

### 화면
- `preview/shared/study-room-basic-form.js` — 집주소 입력란·검색·필수검사 제거. 안내 문구만.
- `preview/auth-ui/.../signup-basic.js` — 필수 안내에서 집주소 제외.
- `preview/study-room-ui` — `isRoomBasicComplete`에서 집주소 제외. 현황 라벨 `집주소(계정)`.
- `form-collect.js` — 저장 payload에서 `home_address*` 제거.
- PHP `basic-study-room.php` — 집주소 칸 제거.

### 서버
- `BasicRegisterService::registerStudyRoom` — 집주소 필수·`user_profiles` UPDATE 제거.
- `StudyRoomRegisterService::saveLocation` — 집주소 필수·`saveHomeAddress` 호출 제거.
- GET 응답의 `home_address*` (프로필 읽기)는 현황 표시용으로 유지. 쓰기 경로 없음.

### 금지 준수
사업장 `address_text` · 좌표 · `study_room_regions` · 반경 로직 · DB 스키마 · 홍보 잠금 파일 변경 없음.

---

## 3. 빈 주소 기존 회원 처리

| 항목 | 방식 |
|------|------|
| 기본등록 필수검사 | 집주소 **미요구** → 빈 `user_profiles`여도 기본등록·완료 판정에 **막히지 않음** |
| 저장 | 기본등록이 프로필 주소를 **덮어쓰지 않음** (빈 값으로 지우지도 않음) |
| UX | 폼 안내: 「비어 있거나 바꾸려면 마이페이지 · 계정설정에서…」 |

---

## 4. 마이페이지 계정 집주소 수정 — 이미 있음/고칠 부분

**이미 없음.** 계정설정(`#/mypage/account`)은 표시명·비밀번호·탈퇴만.  
집주소를 `user_profiles`에 쓰던 경로는 **공부방 기본등록뿐**이었음.

이번 PR에서 그 쓰기 경로를 제거했으므로, **가입 이후 집주소 수정 UI/API는 현재 없음**.  
지시의 「계정에서 유지」를 충족하려면 **계정 화면 집주소 수정 추가가 후속 티켓**(승인 후).  
이번 범위에서 계정 화면·새 API는 추가하지 않음(다른 화면 변경 최소화).

---

## 5. 과외쌤·학생 중복 입력 (확인만)

| 역할 | 기본등록 주소 | 판정 |
|------|---------------|------|
| 과외쌤 | 과외지역(슬롯)만. 집주소·사업장 이중 입력 없음 | 중복 없음 |
| 학생 | 희망지역만. 집주소 재입력 없음 | 중복 없음 |
| 공통 | 가입 `signup/form` 집주소 → `user_profiles` 1회 | 정상 |

수정은 승인 후.

---

## 6. 스크린샷

`tmp/347-shots/` (커밋 제외)

| 파일 | 내용 |
|------|------|
| `after-signup-form-1280.png` / `390` | 가입 라벨 「집주소」 |
| `after-study-basic-1280.png` / `390` | 기본등록에 집주소 입력란 없음 · 안내만 |

---

## 7. Git / PR

- 별도 브랜치·PR (346 분리)
- stage 허용 파일만
