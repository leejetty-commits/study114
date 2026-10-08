# 164 · Cursor — 모드점검 P0 · 등록 카피·역할 홈·마이페이지 첫 진입 (로컬)

- 작성: 2026-09-27 18:03 KST
- 선행: [163](163-mode-audit-2026-09-27.md) · `/workspace/study114-mode-audit/` (`01-guest` · `02-study-room` · `03-tutor` · `04-student`)
- 상태: **Cursor 구현 대기** · push · `build:dothome` **금지**(사용자가 「배포」라고 말하기 전)
- 저장소: **오직** `leejetty-commits/study114`
- 작업 경로: `D:\work\study114` · `git -c safe.directory=D:/work/study114`
- 범위: 감사 신규 **N1–N4** 만 (P0)
- Notion: **쓰지 말 것**
- 커밋: 코딩 완료 시 **로컬 1개**만 (티켓당 1커밋). push 금지

---

## 0. 목표 (사이트 표시 이름)

일반인이 길을 틀리지 않게 **네 가지**만 고친다.

1. **학생찾기** 화면에 남은 「학생 의뢰」 표기를 **「학생 등록」**으로 바꾼다. (정책 잠금)
2. 로그인 중 「메인 홈으로」「홈으로」가 **역할 홈**으로 간다. (게스트로 보내지 않음)
3. **게스트** 커뮤니티 하단 「메인 홈」이 과외쌤 홈(`#/tutor`)이 아니라 **게스트 홈**(`#/guest`)으로 간다.
4. **공부방** 계정으로 마이페이지에 처음 들어가면 **그 계정의 공부방 등록**이 열린다. (학생 등록 목록이 아님)

사이트에 보이는 이름만 쓴다: **공부방 / 과외쌤 / 학생 / 등록 / 베이직카드**.  
**「학생 의뢰」는 올바른 용어가 아니다. 올바른 말은 「등록」이다.**

---

## 1. 잠금 정책

| 항목 | 잠금 |
|------|------|
| 학생찾기 카피 | 사용자에게 보이는 「의뢰」 → **「등록」**. 헤딩·버튼·빈상태·aria 포함 |
| API·DB 필드 | `request` / `의뢰` 가 **내부 키·컬럼·엔드포인트**에 있어도 **이름 바꾸지 말 것**. 보이는 문자열만 |
| 역할 홈 | `study-room`→`#/study-room` · `tutor`→`#/tutor` · `parent`(학생)·`guardian_student`→`#/parent` · 비로그인→`#/guest` |
| 하드코딩 `#/guest` | 로그인 회원을 게스트로 보내는 링크 **금지**. 세션 역할 헬퍼로 resolve |
| 커뮤니티 게스트 푸터 | 「메인 홈」= `#/guest` 만. `#/tutor` **금지** |
| 공부방 마이페이지 첫 진입 | 해당 계정의 공부방 등록(예: `#/mypage/registrations/study-rooms/7`) |
| 과외·학생 첫 진입 | **이미 정상**. 건드리지 말 것 |
| 146–148 | 이용안내·고객센터 **본문 전면 재작성 금지**. 이번은 N1–N4만 |
| 배포 | push / `build:dothome` 금지 |

---

## 2. 이슈별 수정 (N1–N4)

### N1 · 학생찾기 「의뢰」 → 「등록」

- **재현:** `https://study114.net/search/#/search/student?role=parent`  
  헤딩: **「어떤 학생 의뢰를 볼까요?」** (정책 위반 · 실사이트 잔존)
- **AFTER (잠금):** **「어떤 학생 등록을 볼까요?」**
- **추가:** 학생찾기 UI에서 **사용자에게 보이는** 「의뢰」 문자열을 **전부** grep 후 「등록」으로 교체.  
  예: 빈 목록, 필터 라벨, 버튼, `title`/`aria-label`, 배너 문장.
- **BEFORE → AFTER (예시)**

| BEFORE (금지·잔존) | AFTER (잠금) |
|--------------------|--------------|
| 어떤 학생 의뢰를 볼까요? | 어떤 학생 등록을 볼까요? |
| 학생 의뢰 | 학생 등록 |
| 의뢰 목록 | 등록 목록 |
| 공개 중인 의뢰가 없습니다 | 공개 중인 등록이 없습니다 *(문맥에 맞게 정중하게)* |

#### 「커서 주석」·오판 방지 (N1)

> 1. **「의뢰」를 전역 replace 하지 말 것.** 학생찾기·검색 학생 UI의 **표시 카피**만.  
> 2. API 경로·쿼리·스토어 키·PHP 필드에 `request`/`의뢰`가 있어도 **리네임 금지**. 화면 문자열만.  
> 3. **146–148 이용안내·고객센터 가이드 본문 전면 재작성으로 확대하지 말 것.** 학생찾기 헤딩·관련 UI 카피로 끝.  
> 4. 「학생 의뢰」를 「요청」「리퀘스트」로 바꾸지 말 것. **「등록」만.**  
> 5. 사이트 표시에 「베이직카드」등 제품명은 유지. 이번 티켓에서 제품명 손대지 말 것.

---

### N2 · 「메인 홈으로」「홈으로」 → 역할 홈

- **재현:** 로그인(공부방·학생 등) 상태에서  
  - 고객센터 `#/support` 좌측 하단 「← 메인 홈으로」 → `#/guest` (잘못됨)  
  - 검색 소개 배너(`search/#/search/room?role=...` 등) 「홈으로」 → `#/guest` (잘못됨)
- **AFTER:** 세션 역할에 따라

| 역할 | 도착 |
|------|------|
| 공부방 (`study-room`) | `#/study-room` |
| 과외쌤 (`tutor`) | `#/tutor` |
| 학생·학부모 (`parent` / `guardian_student`) | `#/parent` |
| 게스트·비로그인 | `#/guest` |

- **위치(실측 기준 · 실경로 확인 후):** 고객센터 좌측 푸터, 검색 인트로/상단 배너 「홈으로」.  
  같은 패턴의 「메인 홈」링크가 더 있으면 **같은 헬퍼**로 통일.

#### 「커서 주석」·오판 방지 (N2)

> 1. **버그의 본질은 `#/guest` 하드코딩.** 「홈」을 항상 게스트로 두면 로그인 회원이 튕긴다.  
> 2. **세션/역할 resolve 헬퍼**를 쓰거나 기존 역할 홈 유틸이 있으면 재사용. 화면마다 다른 해시 문자열을 박지 말 것.  
> 3. **비로그인만** `#/guest`. 로그인 회원을 게스트로 **절대** 보내지 말 것.  
> 4. GNB 「홈」이 이미 역할 홈이면, 푸터·배너만 고치면 됨. GNB를 게스트로 바꾸지 말 것.  
> 5. 로그아웃 버튼의 게스트 착지는 **유지**(로그아웃 후 `#/guest`는 정상).

---

### N3 · 게스트 커뮤니티 푸터 「메인 홈」 ≠ `#/tutor`

- **재현:** 비로그인 `#/community` 하단 「← 메인 홈으로」(또는 「메인 홈」) → `#/tutor` (잘못됨 · 과외쌤 기본값 잔재로 보임)
- **AFTER:** 게스트 → `#/guest`

#### 「커서 주석」·오판 방지 (N3)

> 1. 커뮤니티 레이아웃에 **tutor 기본 홈**이 박혀 있을 가능성 큼. 게스트 분기에서 `#/guest`로.  
> 2. N2와 **같은 역할 홈 헬퍼**를 쓰면 N3는 자동으로 맞을 수 있음. 헬퍼 도입 시 게스트도 커버.  
> 3. 로그인 과외쌤이 커뮤니티에 있을 때는 `#/tutor`가 맞음. **게스트만** `#/guest`.  
> 4. 커뮤니티 GNB IA(N22)는 **167**. 이번은 **푸터 홈 링크만**.

---

### N4 · 공부방 마이페이지 첫 진입 → 공부방 등록

- **재현:** `leejetty+room@gmail.com` → 마이페이지 첫 진입이  
  `#/mypage/registrations/students` → 「이 계정의 학생이 0명…」  
  실제 공부방 등록은 `#/mypage/registrations/study-rooms/7` 에 있음.
- **AFTER:** 공부방 역할 첫 진입 = **그 계정의 공부방 등록** (id는 계정별 · 예: `study-rooms/7`).  
  목록 허브만 필요하면 `study-rooms` 허브 후 단일 등록으로 리다이렉트해도 됨 — **학생 탭으로 떨어지지 말 것.**
- **유지:** 과외쌤 첫 클릭 → `tutors/{id}` 정상. 학생 첫 클릭 → `students/{id}` 정상. **변경 금지.**

#### 「커서 주석」·오판 방지 (N4)

> 1. **공부방만** 어긋남. 과외·학생 첫 진입 로직을 「통일」한다며 깨지 말 것.  
> 2. 기본 탭을 `students`로 둔 공용 mypage 라우터가 원인일 수 있음 → **역할별 기본 registration 타입**.  
> 3. id `7`은 점검 계정 예시. 하드코딩 `7` 금지. **현재 사용자 공부방 등록 id** resolve.  
> 4. 「학생 0명」 빈 상태를 숨기는 식으로 우회하지 말 것. **올바른 등록으로 보내기.**

---

## 3. Allowlist (예상 · **실경로 확인 후** stage)

아래는 **후보**. 존재하지 않거나 이름이 다르면 grep으로 찾고, 티켓 결과에 **실제 경로**를 적을 것.

```
# N1 학생찾기 「의뢰」 카피
preview/home-ui/src/**/*student*search*   (또는 search student UI 카피)
preview/search-ui/**                      (검색 앱이 분리되어 있으면)
# 문자열 「학생 의뢰」「의뢰를 볼까요」 grep 후 해당 파일만

# N2·N3 역할 홈 링크
preview/home-ui/src/**/support*
preview/home-ui/src/**/community*
preview/home-ui/src/**/*search*banner* · intro*
# 역할 홈 resolve 헬퍼가 있으면 그쪽 + 호출부만

# N4 공부방 mypage 첫 진입
preview/home-ui/src/**/mypage*router*
preview/home-ui/src/study-room-reg/router.js
```

**Forbidden**

- push · `build:dothome` · `git add -A` · dirty 잔여 무관 파일
- Notion 기록
- API/DB 필드 rename · ACL 완화
- 146–148 가이드 본문 전면 개편
- 과외·학생 mypage 첫 진입 로직 변경
- P1–P3(N5–N28) 범위 혼입 (165–167)
- 다른 저장소

커밋 메시지 예:  
`fix(mode-audit): P0 role home links, student 등록 copy, study-room mypage entry`

---

## 4. MUST / MUST NOT

### MUST

- N1: 학생찾기 헤딩이 「어떤 학생 **등록**을 볼까요?」  
- N1: 학생찾기 **유저 페이싱** 「의뢰」 0건 (내부 키 제외)  
- N2: 로그인 공부방·과외·학생에서 「메인 홈」「홈으로」→ 각각 `#/study-room` `#/tutor` `#/parent`  
- N3: 게스트 `#/community` 「메인 홈」→ `#/guest`  
- N4: 공부방 마이페이지 첫 진입 → 공부방 등록(해당 id)  
- 로컬 커밋 1개 · HEAD SHA 보고

### MUST NOT

- 「학생 의뢰」를 올바른 말로 문서·카피에 남기기  
- 로그인 회원을 `#/guest`로 보내기  
- 게스트를 `#/tutor`로 보내기  
- API 키/DB 컬럼 rename으로 N1 해결하기  
- push / 배포  
- Notion

---

## 5. 수락 스모크 매트릭스 (역할별)

계정:  
- 공부방 `leejetty+room@gmail.com`  
- 과외쌤 `leejetty+tutor@gmail.com`  
- 학생 `leejetty+student@gmail.com` (**`+std` 아님**)  
- 게스트 비로그인  

| # | 역할 | URL / 행동 | 기대 |
|---|------|------------|------|
| S1 | 학생 | `…/search/#/search/student?role=parent` | 헤딩 「어떤 학생 **등록**을 볼까요?」 · 「의뢰」 없음 |
| S2 | 공부방 | `#/support` → 「메인 홈으로」 | `#/study-room` (게스트 아님) |
| S3 | 학생 | `#/support` → 「메인 홈으로」 | `#/parent` |
| S4 | 과외 | `#/support` → 「메인 홈으로」 | `#/tutor` |
| S5 | 학생 | `search/#/search/room?role=parent` 「홈으로」 | `#/parent` |
| S6 | 게스트 | `#/community` 하단 「메인 홈」 | `#/guest` (**`#/tutor` 아님**) |
| S7 | 공부방 | 마이페이지 첫 진입 | `…/registrations/study-rooms/{id}` · 「학생 0명」 허브 아님 |
| S8 | 과외 | 마이페이지 첫 진입 | `…/registrations/tutors/{id}` **회귀 없음** |
| S9 | 학생 | 마이페이지 첫 진입 | `…/registrations/students/{id}` **회귀 없음** |
| S10 | 게스트 | 「메인 홈」류 | `#/guest` |

결과 보고: HEAD SHA · 커밋 SHA · **실제** 변경 파일 · S1–S10 · N1 grep 잔여 「의뢰」(유저 페이싱) 여부.

---

## 6. 붙여넣기 (Cursor)

```
[티켓 164 · 모드점검 P0 N1–N4 · 로컬만 · push/build:dothome 금지]

※ D:\work\study114 · git -c safe.directory=D:/work/study114
※ 정본: study114-ds/docs/164 · 근거: docs/163 · study114-mode-audit/*
※ Notion 금지 · 커밋 1개 로컬만

목표
N1 학생찾기 「어떤 학생 의뢰를 볼까요?」→「어떤 학생 등록을 볼까요?」
   · 학생찾기 UI 유저페이싱 「의뢰」전부 「등록」. API/DB 키 rename 금지
N2 로그인 「메인 홈」「홈으로」→ 역할 홈 (#/study-room|#/tutor|#/parent). #/guest 하드코딩이 버그
N3 게스트 커뮤니티 「메인 홈」→ #/guest (#/tutor 금지 · tutor 기본값 잔재)
N4 공부방 mypage 첫 진입 → 그 계정 공부방 등록(study-rooms/{id}). 과외·학생 첫진입 건드리지 말 것

표시 이름만: 공부방/과외쌤/학생/등록/베이직카드. 「학생 의뢰」는 틀린 말.

Forbidden: push · build:dothome · Notion · 146-148 본문 전면 · P1-P3 혼입 · ACL 완화 · git add -A

allowlist: 실경로 확인 후. 「의뢰를 볼까요」·메인 홈·mypage registrations 기본 진입 grep.

스모크: 학생 검색 헤딩 등록 · 역할별 홈 링크 · 게스트 community→guest · 공부방 mypage→study-rooms/{id}
계정: room / tutor / student(+student not +std) / guest
```

---

## 7. 하지 말 것

- 「배포」「푸시해」 전 push / `build:dothome`
- 「의뢰」→「요청」등 임의 대체어
- 165–167 범위(API 403·영문 배지·내비 IA)를 이 커밋에 섞기
- Notion 자동 기록
