# 021 · 학생 마이페이지 리뉴얼 F — Stage5B 디자인 패스

- 작성일: 2026-09-24 (KST)
- 선행: [008](008-student-mypage-renewal-master-plan.md) · [020](020-student-mypage-renewal-ticket-e-acceptance.md) · [003](003-global-design-manual.md)
- 정본 디자인: `stage5b-design-standard-v01` (TOKENS / EXCEPTIONS / ssot) · `udx-05-design-bot-protocol` · docs/003
- 정본 구조: 노션 [학생 마이페이지 구조 및 프로필 입력 기준](https://app.notion.com/p/5b76f666474845128bf04e4aa9ac5486) (IA·필드·카피는 A~E 잠금 유지)
- 상태: **로컬 수락** → [022](022-student-mypage-renewal-ticket-f-acceptance.md)

---

## 0. 한 줄 목적

A~E에서 **이미 만진 학생 마이페이지·내 등록 화면**만 Stage5B 토큰·타이포·radius·빈상태·버튼 톤에 맞춘다.  
필드 세트·저장 API·라우팅·카피 정본 **재설계 금지.**  
홈·검색·타역할·전역 리디자인 **금지.**

---

## 1. 컨텍스트

| 티켓 | 상태 | F에서 |
|------|------|--------|
| A~E | 로컬 수락 | **회귀 금지** (IA·카드·기본9·상세9·레거시 청소) |
| F | **이번** | 만진 화면만 디자인 패스 |

정책: 일상 제품 UI → **홍보 예외 없음** (003 §3). Primary `#266BC4`만 CTA 채움.

데이터: 활성 학생 **id=1**. 점검 기준 id=1.

---

## 2. 범위

### 2-1. 포함 (시각·클래스·토큰만)

아래 **화면**에 보이는 마크업/스타일만. 작업 전 검색으로 실제 CSS·클래스 파일을 목록에 올리고 **그 목록만** 수정.

**화면 (필수 점검):**

1. 마이프로필 (`#/mypage/registrations/students/1`) — Basic 카드 selfView + 리스트
2. 기본정보 탭 — 9필드 폼 (구조 유지)
3. 상세정보 탭 — 9필드 폼 + §5-2 안내 한 줄
4. 쪽지설정 탭 — **표시만** (저장 연결 금지)
5. 학생 마이페이지 셸 — 좌측 1차 메뉴·상단 탭 톤 (IA 변경 금지)

**허용 파일 유형 (원칙):**

- `preview/home-ui` 내 학생 mypage / student-reg **관련** CSS·클래스·빈상태 마크업
- 기존 전역/공유 토큰 클래스 **재사용**이 우선. 새 디자인 시스템 파일을 만들면 보고·승인
- E 잔여 chore **선택:** `GUARDIAN_PLANS_COPY` 심볼 개명(화면 문자열 불변), store dead `publishStudent`/`getPublishReadiness` 삭제(호출 0일 때만)

파일 allowlist를 미리 전부 박지 않는다. **작업 전** 손댈 파일 목록을 보고에 적고 그 목록만. 목록 밖 필요 시 **중단·보고·승인 대기.**

### 2-2. 제외 (한 줄이라도 건드리면 거부)

1. A~E 필드 세트·라벨 의미·저장 경로·라우트 재설계
2. 쪽지설정 **저장** / PHP `memo_status` allowlist (별도)
3. 마이프로필 카드/리스트 **정보 구조** 재작성 (B 잠금)
4. 자녀/guardian UX 재도입, 공개 게이트·스테퍼 부활
5. 홈·검색·학생찾기·가입 14장·공부방·과외쌤 마이페이지 전면
6. DB 스키마·새 API·새 엔드포인트
7. auth/signup WIP와 커밋 혼합
8. push / `build:dothome` (요청 전 금지)
9. 전역 리디자인·사이트 전체 tokens.css 대수술 (학생 마이페이지에 필요한 **최소 클래스**만)
10. 홍보/팝업 예외 비주얼을 마이페이지에 적용

---

## 3. 디자인 잠금 (003 · Stage5B)

| 항목 | 규칙 |
|------|------|
| Primary CTA | `#266BC4` — **페이지 대표 CTA만** 채움 |
| Ink / Muted / Bg / Surface / Line | `#1C1917` / `#4B5563` / `#F7F8FA` / `#FFF` / `#E5E7EB` |
| 타이포 | Pretendard · FS **12 / 14 / 16 / 18 / 22 / 28 / 36** (중간값 금지 원칙) |
| radius | card **12** · ctl **8** · 뱃지 **4** · Role Tab/칩 **6** |
| 뱃지 | 텍스트 **999 pill 금지** |
| 학생 역할 액센트 | soft/탭/아이콘/선택선만 (`--role-student*`). CTA 채움에 역할색 금지 |
| 그림자 | sticky용 약함만 |
| 공란 | 경고형 실패 아님 — 색·톤·옅은 배경 **시각 구분만** (정본 §5-3) |
| 「필수」마킹 | 두지 않음 |
| 상세 상단 안내 | 문장 **변경 금지** (D 잠금) |

수치·변수: `stage5b-design-standard-v01/TOKENS.md` · `tokens.css` · `EXCEPTIONS.md`.  
검수 규약: UDX-05 KEEP/CHANGE/DELETE/FORBIDDEN 취지 — **임의 새 컴포넌트 남발 금지.**

---

## 4. 저장·API

- **쓰기 API·스키마 변경 금지.**
- F는 CSS/마크업/클래스. 폼 submit·PATCH 본체 손대지 말 것.
- 회귀 스모크만: basic `request_summary`·detail `special_request_note` **각 1회** (값 원복).

---

## 5. 완료 전 필수 점검

### 5-1. 라우팅 (회귀)

`#/mypage` · basic · detail · settings 정상. list/publish 레거시 → 마이프로필 유지.

### 5-2. 화면 디자인

1. 네 탭 각각 **데스크톱 1회 + 가능하면 좁은 폭 1회** 점검.
2. Primary CTA가 페이지당 과다하지 않은지.
3. pill 뱃지·중간 FS·임의 hex가 Stage5B와 어긋나면 수정 또는 보고.
4. 금지어(자녀/대표학생/게이트/스테퍼) **재유입 0건.**

### 5-3. API

조회 200. 저장 스모크 원복. 새 엔드포인트 없음.

### 5-4. 예상외

중단·보고·승인 대기.

---

## 6. 산출물

1. 손댄 파일 목록 + 한 줄 이유 (F만; auth 분리)
2. Before/after 메모 또는 캡처 요약 (어느 화면·무엇을 맞춤)
3. §5 라우팅·디자인·스모크
4. 「안 한 것」(쪽지 저장·스키마·push 등)
5. 로컬만. push/빌드/커밋은 요청 전 금지

---

## 7. Cursor 복사용 (§0~§6을 따를 것)

```
020 E 수락됨. 021 티켓 F만. 학생 마이페이지 Stage5B 디자인 패스.

【목적】
A~E에서 만진 학생 마이페이지·내 등록 화면만 Stage5B 토큰·타이포·radius·빈상태·버튼 톤에 맞춤.
필드·저장·라우팅·카피 정본 재설계 금지. 홈/검색/타역할/전역 리디자인 금지.

【포함 화면】
마이프로필(selfView+리스트), 기본정보, 상세정보, 쪽지설정(표시만), 학생 셸(메뉴·탭 톤).
작업 전 파일 목록 보고 → 그 목록만. 밖이면 중단·보고·승인 대기.
선택 chore: GUARDIAN_PLANS_COPY 개명(문자열 불변), dead publish API 삭제.

【제외 = 거부】
A~E 필드/저장/라우트 재설계, 쪽지설정 저장/memo_status, 카드 정보구조 재작성,
자녀·게이트 재도입, 홈·검색·14장·타역할, 스키마·새 API, auth WIP 혼합,
push/build:dothome, 전역 tokens 대수술, 홍보 비주얼을 마이페이지에 적용.

【디자인 잠금】
Primary #266BC4 CTA만. FS 12/14/16/18/22/28/36. card12 ctl8 badge4 chip6.
pill 텍스트 뱃지 금지. 역할색은 soft/탭만. 공란=시각구분, 「필수」마킹 없음.
상세 상단 안내 문장 변경 금지. 정본: docs/003 · stage5b TOKENS/EXCEPTIONS.

【필수 종료】
파일 목록 + 화면 점검(4탭) + 라우팅 회귀 + basic/detail 저장 스모크 원복 + 금지어0.
예상외면 중단·보고·승인 대기.
```
