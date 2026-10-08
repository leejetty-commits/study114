# 170 · Cursor — 금액 「천원」+ 1회 수업시간·주 회수 전역 (로컬)

- 작성: 2026-09-28 KST · 우동공과2
- 정본 정책: [168](168-form-fields-global-policy-2026-09-27.md) §0.2·§1.3–1.5·§3·§4
- 선행: **169 ACCEPT** (`662fa75` 로컬) — 과목·학교급/학년. **손대지 말 것**(회귀만)
- 상태: **Cursor 구현 대기** · push · `build:dothome` **금지**(「배포」 전)
- 저장소: **오직** `leejetty-commits/study114`
- 작업 경로: `D:\work\study114` · `git -c safe.directory=D:/work/study114`
- 범위: **170만** (천원 단위 · 1회 수업시간 · 주 회수)
- 다음: **171** 가입 첫단계 풀로고 — **이번 금지**
- Notion: **쓰지 말 것**
- 커밋: 코딩 완료 시 **로컬 1개**만. push 금지

---

## 0. 절대 규칙

1. **이번 PR = 170만.** 169 회귀 금지 · 171 로고 금지 · 관리자·배포 금지.
2. 표시: **공부방 · 과외쌤 · 학생 · 등록 · 베이직카드**. 「학생 의뢰」넣지 말 것.
3. **DB/저장은 원(정수) 유지.** UI만 **천원** 입력·표시. 입력값 ×1000 = 원.  
   기존 「만원」UI(×10000)와 혼동 주의 — 전수 치환.
4. dirty 다른 티켓 stage 금지.

---

## 1. Must — 금액 단위 「천원」

### 1.1 잠금

사용자에게 보이는 돈 관련 **입력·필터·카드·힌트 단위 = 천원**.  
예: 입력 35 → 「35천원」(「3.5만원」으로 바꾸지 말 것).

### 1.2 감사 키워드 (전수)

`만원` · `register-fee-manwon` · `formatMonthlyWon` · `최소(원)` · `최대(원)` · `preferred_fee` · `budget_amount` · `monthly_fee` · `price_amount` · `월 ${…}원` (student-reg format)

### 1.3 대표 BEFORE → AFTER

| 위치 | BEFORE | AFTER |
|------|--------|-------|
| 공부방 상세 step-lesson | UI 「만원」· placeholder「예: 35만원」· `register-fee-manwon` | **천원** 라벨·placeholder·클래스명/힌트. 저장 환산 **×1000**(기존 ×10000이면 반드시 고침) |
| 찾기 range 필터 | 「최소(원)」「최대(원)」· step 10000 | 「최소(천원)」「최대(천원)」등 · step은 천원 입력에 맞게 |
| `exposure-format.js` `formatMonthlyWon` | 「월 N만원~」(원÷10000) | 천원 표시(원÷1000). 함수명 변경 가능하나 **표시는 천원** |
| `student-reg/format.js` | `월 ${…}원` | 천원 축으로 통일 |
| 학생 가입/등록 예산 | 단위 라벨 약함 | **천원** 명시 |
| 과외쌤 preferred_fee | 단위 약함 | **천원** |
| search-schema 목업 카피 | 「월 48만원」등 | 천원 표기 |

#### 「커서 주석」

> 1. 라벨만 「천원」으로 바꾸고 환산(×10000)을 그대로 두면 **REJECT**.  
> 2. 카드·목록·상세·필터·폼 **전부** 같은 축. 한쪽만 「원」잔존 금지.  
> 3. 관리자 화면은 1차 범위 외(손대지 말 것). 찾기·가입·등록·마이·카드는 포함.

---

## 2. Must — 1회 수업시간

### 2.1 공통 옵션 (잠금)

**20 · 30 · 40 · 50 · 60 · 70 · 80 · 90 · 100 · 110 · 120**분 + **기타 (숫자)분**

- 공부방 `DAILY_LESSON_MINUTES`의 150·180·over_180 **제거** 또는 기타로만.
- 과외/학생 자유 텍스트 → 동일 옵션 UI.
- 라벨: 공부방 「1일 평균 수업시간」→ **「1회 수업시간」**으로 맞춤(168 §3.3).

공유 상수 권장: `preview/shared/lesson-duration-options.js` → 공부방·과외·학생·찾기 import.

---

## 3. Must — 주 회수

### 3.1 잠금

**1회 · 2회 · … · 7회** + **기타 (____)회**

- 「7회 이상」라벨 **폐기** → 정확히 **7회** + 기타.
- 과외·학생 자유 입력 → 동일 옵션.

공유 상수 권장: `preview/shared/lesson-weekly-options.js`.

---

## 4. Allowlist (초안)

- `preview/shared/lesson-duration-options.js` (신설)
- `preview/shared/lesson-weekly-options.js` (신설)
- `preview/study-room-ui/src/state.js` · `screens/step-lesson.js`
- `preview/tutor-ui/src/state.js` · lesson/detail 관련
- `preview/home-ui/src/student-reg/**` · `exposure-format.js` · `student-reg/format.js`
- `preview/search-ui/src/search-schema.js` · `search-find-surface.js` (range 단위·minutes/weekly 필드)
- `preview/auth-ui` 예산 필드가 있는 signup-basic 등
- (필요 시) CSS class rename `register-fee-manwon` → 천원 계열

**금지:** `school-grade.js` 동작 변경 · MAIN 과목 · `logo-full`/`renderBrandHero` · admin · push.

---

## 5. Must not

- 171 가입 풀로고
- 169 학교급/학년 로직 되돌리기
- DB 스키마를 천원 정수로 바꾸기(기본은 UI만 천원)
- 「만원」을 「만 원」띄어쓰기만 고치기
- push / `build:dothome`

---

## 6. 수락 스모크

1. 공부방 상세 수업료: 단위 **천원**, 입력 환산이 원으로 올바름(옛 만원×10000 아님).
2. 찾기 금액 필터: 천원 라벨.
3. 카드/목록 월 금액: 천원 표기(한쪽만 「원」「만원」잔존 없음).
4. 1회 수업시간: 20~120 + 기타. 150/180/「3시간초과」기본 옵션 없음.
5. 주 회수: 1~7 + 기타. 「7회 이상」없음.
6. 라벨 「1회 수업시간」.
7. 169 학생찾기 과목24·학교급/학년 분리 **회귀 없음**.

---

## 7. 완료 보고 (요점만)

- 환산 규칙(UI천원→원) 명시한 위치
- `만원`/`formatMonthlyWon`/`register-fee-manwon` 잔여 검색 결과
- 수업시간·주회수 공유 모듈 경로
- 스모크 결과 · push 안 함

---

## 8. 붙여넣기용 한 장

```
티켓 170만. leejetty-commits/study114 · D:\work\study114.
push·build:dothome 금지. 169 유지·171 로고 금지. Notion 금지.

Must:
1) 돈 단위 UI=천원. DB는 원 유지(입력×1000). 만원(×10000)·「원」표시·formatMonthlyWon·register-fee-manwon·최소(원)·학생 format 「월 N원」전수 천원축.
2) 1회 수업시간: 20~120분 + 기타. 150/180/over_180 기본 제거. 라벨 「1회 수업시간」. 공유 lesson-duration-options.js 권장.
3) 주 회수: 1~7회 + 기타. 「7회 이상」폐기. 공유 lesson-weekly-options.js 권장.
범위: 찾기·가입·등록·마이·카드. 관리자 제외.

정본: docs/168-… · docs/170-form-fee-duration-weekly-cursor-ticket-2026-09-28.md
로컬 커밋 1개. 요점 보고.
```
