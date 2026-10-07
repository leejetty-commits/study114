# 171 · Cursor — 가입 첫단계 우동공과 풀로고 (로컬)

- 작성: 2026-09-28 KST · 우동공과2
- 정본 정책: [168](168-form-fields-global-policy-2026-09-27.md) §0.2.4 · §1.6 · §4
- 선행: **169 ACCEPT** · **170 ACCEPT** (`95aca1f`) — 회귀만 스모크, **로직 손대지 말 것**
- 상태: **Cursor 구현 대기** · push · `build:dothome` **금지**(「배포」 전)
- 저장소: **오직** `leejetty-commits/study114`
- 작업 경로: `D:\work\study114` · `git -c safe.directory=D:/work/study114`
- 범위: **171만** (가입 첫단계 풀로고)
- Notion: **쓰지 말 것**
- 커밋: 코딩 완료 시 **로컬 1개**만. push 금지

---

## 0. 절대 규칙

1. **이번 PR = 171만.** 169 학교급/과목 · 170 천원/수업시간/주회수 **변경 금지**(회귀만).
2. 새 로고 자산 만들지 말 것. 기존 `public/assets/brand/logo-full.png` + 헬퍼 **재사용**.
3. 표시: 공부방 · 과외쌤 · 학생 · 등록 · 베이직카드.
4. push / `build:dothome` 금지.

---

## 1. Must — 풀로고 위치

자산: `public/assets/brand/logo-full.png`  
헬퍼: `preview/auth-ui/src/layout.js` → **`renderBrandHero()`** (이미 logo-full 사용 · 정의만 있고 일부 화면 미호출)

| 화면 | BEFORE | AFTER |
|------|--------|-------|
| 로그인 | 있음 | **유지** |
| 가입 약관 `signup-terms` | 있음(wordmark) | **유지** |
| 회원구분 `signup-role` | **없음** | 상단 제목줄에 **풀로고** (`renderBrandHero` 우선) |
| 역할별 기본정보 `signup-basic?role=…` (학생·공부방·과외쌤) | **없음** | 상단 제목줄에 **풀로고** |

**잠금 해석:** 「모드별 가입의 첫단계」= 역할 정한 뒤 **회원구분(`signup-role`)** + **역할별 기본정보(`signup-basic`)**.  
이메일확인·계정연락처 등 중간 단계는 **필수 아님**(넣어도 무방하나 우선순위는 role + basic).

#### 「커서 주석」

> 1. 새 img 마크업을 복제하지 말고 **`renderBrandHero()` 재사용**.  
> 2. wordmark만 넣고 full이 아니면 **REJECT**.  
> 3. 로그인/약관 기존 로고를 지우거나 바꾸지 말 것.  
> 4. 홈·찾기·등록·마이 레이아웃에 로고를 뿌리지 말 것 — **auth 가입 첫단계만**.

---

## 2. Allowlist

- `preview/auth-ui/src/layout.js` (헬퍼 확인·필요 시 미세 조정만)
- `preview/auth-ui/src/screens/signup-role.js`
- `preview/auth-ui/src/screens/signup-basic.js`
- (역할별 basic이 분리 파일이면 해당 screen만)

**금지:** `fee-cheonwon.js` · `school-grade.js` · lesson-duration/weekly · search-ui · home-ui 등록 · admin · CSS 전역 리브랜드.

---

## 3. Must not

- 170/169 환산·옵션 변경
- 새 브랜드 색·폰트 전면 개편
- push / 배포
- Notion

---

## 4. 수락 스모크

1. `#/signup/role` (또는 실제 회원구분 경로): 상단에 **logo-full** 보임.
2. 학생·공부방·과외쌤 각각 `#/signup/basic?role=…`: 상단 **logo-full**.
3. 로그인·약관 로고 **그대로**.
4. 169 학교급/학년 · 170 천원 라벨 **회귀 없음**(basic 화면에서 한 번만 확인).

---

## 5. 완료 보고 (요점만)

- `renderBrandHero` 호출 위치
- 스모크 1~4 · push 안 함

---

## 6. 붙여넣기용 한 장

```
티켓 171만. leejetty-commits/study114 · D:\work\study114.
push·build:dothome 금지. 169·170 로직 변경 금지. Notion 금지.

Must:
- 회원구분 signup-role · 역할별 signup-basic(학생·공부방·과외쌤) 상단에 우동공과 풀로고
- public/assets/brand/logo-full.png · preview/auth-ui layout.js의 renderBrandHero() 재사용 (새 자산·복제 마크업 지양)
- 로그인·약관 기존 로고 유지. 중간 가입 단계는 필수는 아님.

정본: docs/168-… · docs/171-signup-brand-logo-cursor-ticket-2026-09-28.md
로컬 커밋 1개. 요점 보고.
```
