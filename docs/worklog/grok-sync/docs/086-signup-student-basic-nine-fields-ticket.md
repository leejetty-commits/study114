# 086 · Cursor — 가입 학생 기본정보 = 마이페이지 아홉 칸

- 작성일: 2026-09-24 (KST)
- 소견: [085](085-signup-student-basic-nine-fields-findings.md)
- 필드 정본: [014](014-student-mypage-renewal-ticket-c-basic.md) · 수락 참고 [015](015-student-mypage-renewal-ticket-c-acceptance.md)
- 희망지역 운영: [084](084-student-hope-region-083-deploy-acceptance.md) `f6b5400` — **회귀 금지**
- 시안: `docs/assets/085-signup-student-basic-desktop.png` · `…-mobile-390.png` (레포에 없으면 채팅 첨부·`.tmp-student-basic/`)
- 디자인: [003](003-global-design-manual.md) · UDX-STD 입력·버튼
- 상태: **로컬 수락** → [087](087-signup-student-basic-086-acceptance.md) · push/`build:dothome` 여전히 금지
- 기준 HEAD: `f6b5400` 재확인

---

## 0. 한 줄

가입 흐름의 **학생 기본정보**를 마이페이지 기본정보와 같은 **아홉 칸**으로 맞춘다.  
로컬 dirty 초안을 출발점으로 **완성·검증**한다. 홈·유료 dirty와 섞지 않는다.

---

## 1. 아홉 칸 (필수 구성 · 가입에서도 동일)

1. 표시명  
2. 학교급 / 학년  
3. 희망 유형 (과외쌤 찾기 / 공부방 찾기)  
4. 희망지역 — 공부방: `renderStudentHopeRegion` 주소 검색(**은마·대치 하드코드 폴백 금지**). 과외쌤: 기존 시·도 등 회귀 유지.  
5. 희망과목  
6. 수업형태 (`one_on_one` / `group`)  
7. 수업인원 (1:1이면 solo 고정 등 기존 초안 로직 유지·문서화)  
8. 예산 — 과외/`preferred_fee_amount` · 공부방/`preferred_studyroom_fee_amount` (유형에 안 맞는 칸 disabled)  
9. 한 줄 요청문 `request_summary` (max 200)

**카피:** 「대표*」「부족 n개」「공개 전 완료」 금지. 필수 빨간 * 남발 금지(014와 동일 톤). 공란은 시각 구분만.

**넣지 말 것:** 상세 전용 필드, 자녀/guardian 신규 UI, 새 위저드, DB 스키마 대수술.

---

## 2. Allowlist (B)

초안에 있는 경로만. unchanged면 skip·보고.

```
preview/auth-ui/src/screens/signup-basic.js
preview/auth-ui/src/styles/student-basic.css
preview/auth-ui/src/main.js
preview/auth-ui/src/layout.js
public/assets/css/auth/mvc.css
src/Views/auth/partials/basic-student.php
src/Views/auth/signup-basic.php
src/Auth/BasicRegisterService.php
```

enums/helpers가 **꼭** 필요하면 파일·이유를 보고에 쓰고, allowlist 밖이면 **중단·보고**(몰래 넓히지 말 것).

### 절대 제외 (C)
```
preview/home-ui/src/provider-status.js
preview/home-ui/src/study-room-reg/**
preview/shared/location-display.js
src/Paid/ProviderUsageService.php
src/helpers.php   (필요 시 중단·보고)
public/assets/teaser-*
.tmp* · _verify/ · git add -A
push · build:dothome
```

---

## 3. 저장·API

1. 기존 `BasicRegisterService` / basic register API만. **새 PHP 파일·새 테이블 금지.**  
2. 위 칸이 payload에 실리고 저장·재조회되는지 확인.  
3. 컬럼/allowlist 없어 거절되면 **임의 컬럼에 쑤셔 넣지 말고 중단·보고.**  
4. 예산 상한: 마이페이지 015처럼 **스키마 변경 없이** 검증만 맞출 것.  
5. 과목 저장 시 학교급 필요하면 초안 로직 유지·문서화.

---

## 4. UX·디자인

1. 시안(desktop/mobile) 방향: 카드·필드 간격·칩·하단 저장. 전역 토큰 이탈 시 보고.  
2. `student-basic.css`는 **이 화면만**. 다른 auth 화면 깨면 수정.  
3. 미리보기(auth-ui)와 PHP partial 동작이 **어긋나면** 맞추거나 차이 보고.  
4. 희망유형 전환 시 희망지역·예산 칸 show/hide·disabled 동기화.

---

## 5. 완료 전 점검

1. 학생 가입 → 기본정보: 아홉 칸 모두 보임.  
2. 공부방 희망지역: **검색 칸** · 은마/대치 가짜 목록 **없음**.  
3. 과외쌤: 시·도(또는 기존) 회귀.  
4. 저장 성공 → 값 유지(재진입 또는 API 증거).  
5. `request_summary` 저장 증거.  
6. 마이페이지 기본정보(014)와 **의미 충돌 없음**(이름·코드).  
7. C 파일 미포함 · push 안 함.

---

## 6. 완료 보고

1. 최종 diff 파일 목록(=B)  
2. 아홉 칸 표: UI / 저장 키 / 결과  
3. 희망지역 회귀 없음 증거  
4. API·스키마 이슈 있으면 중단 사유  
5. 스크린샷(가능하면 desktop+390)

---

## 7. 붙여넣기

```
[티켓 086 · 가입 학생 기본정보 = 마이페이지 아홉 칸 · 로컬만]

사용자 「기본정보 초안 하자」. base≈f6b5400. push/build:dothome 금지. git add -A 거부.

정본 필드(014): 표시명 · 학교급/학년 · 희망유형 · 희망지역 · 희망과목 · 수업형태 · 수업인원 · 예산 · 한줄요청문(request_summary).
카피: 대표*/부족n/공개완료 금지. 상세필드 금지.

출발: 로컬 dirty 초안 완성·검증. 희망지역은 f6b5400 운영 유지(은마·대치 폴백 복구 금지).

B만: signup-basic.js · student-basic.css · main.js · layout.js · mvc.css · basic-student.php · signup-basic.php · BasicRegisterService.php
C제외: provider-status · study-room-reg · location-display · ProviderUsage · helpers · teaser · tmp

기존 BasicRegister만. 새테이블/스키마대수술 금지. 컬럼없으면 중단보고.
시안: .tmp-student-basic desktop/mobile 또는 docs/assets/085-*.
보고: 아홉칸 UI+저장 · 희망지역회귀없음 · push안함.
```
