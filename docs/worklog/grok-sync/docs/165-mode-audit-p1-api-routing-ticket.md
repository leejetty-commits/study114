# 165 · Cursor — 모드점검 P1 · API 호출 게이팅·라우팅 건강 (로컬)

- 작성: 2026-09-27 18:03 KST
- 선행: [163](163-mode-audit-2026-09-27.md) · [164](164-mode-audit-p0-routing-home-ticket.md) · `/workspace/study114-mode-audit/`
- 상태: **Cursor 구현 대기** · push · `build:dothome` **금지**(「배포」 전)
- 저장소: **오직** `leejetty-commits/study114`
- 작업 경로: `D:\work\study114` · `git -c safe.directory=D:/work/study114`
- 범위: 감사 신규 **N5–N10** 만 (P1)
- Notion: **쓰지 말 것**
- 커밋: 코딩 완료 시 **로컬 1개**만. push 금지

---

## 0. 목표 (사이트 표시 이름)

라우팅·콘솔 건강. 일반인이 길을 잃지 않고, 개발자 콘솔에 **역할 밖 403이 쏟아지지 않게** 한다.

1. 로그인 「로그인 없이 둘러보기」 링크에 **슬래시** 넣기 (`/#/guest`)
2. 역할이 못 읽는 **등록(registrations) API** 를 호출하지 않기 (403 스팸 제거). **ACL을 넓혀 조용히 만들지 말 것**
3. `board_key=submission` 도 역할이 없으면 **호출하지 않기**
4. 학생이 `#/plans` 직접 진입 시 **고아 화면**(헤더·푸터 없음) 해소
5. 학생찾기에서 `hope=tutor` 적용 시 **`role=parent` 유지**
6. 고객센터 진입을 검색 GNB에서도 **`#/support` 허브**로 통일 (권장)

표시 이름: **공부방 / 과외쌤 / 학생 / 등록 / 베이직카드**.  
유료상품은 공부방·과외쌤 회원용 — 학생에게는 안내만.

---

## 1. 잠금 정책

| 항목 | 잠금 |
|------|------|
| 둘러보기 URL | `https://study114.net/#/guest` (**슬래시 필수**). `study114.net#/guest` 금지 |
| 403 해결법 | **역할·게스트에 맞게 fetch 게이트**. 서버 ACL을 열어 403을 없애는 방식 **금지** |
| submission 보드 | 접근 불가 역할은 **요청 자체를 생략** |
| `#/plans` 학생 | (권장·최소) **정상 크롬(GNB·푸터) + 정중 안내** 또는 `#/parent` 리다이렉트+토스트. 둘 중 **작은 쪽** |
| hope 필터 | `hope=tutor` 클릭 후에도 `role=parent` (또는 현재 역할 쿼리) **유지** |
| 고객센터 | 검색 GNB도 `#/support` 허브 권장. notice 직행은 제품 잠금이 따로 없으면 허브로 맞춤 |
| 배포 | push / `build:dothome` 금지 |

---

## 2. 이슈별 수정 (N5–N10)

### N5 · 둘러보기 슬래시

- **BEFORE:** `study114.net#/guest` (슬래시 누락 · 해시가 path에 붙지 않음)
- **AFTER:** `study114.net/#/guest` 또는 상대 `/#/guest` / `…/auth` 기준 올바른 해시 라우트
- **위치:** 로그인 화면 「로그인 없이 둘러보기」(실측: `https://study114.net/auth/#/login`)

#### 「커서 주석」·오판 방지 (N5)

> 1. 문자열 연결 시 origin + `#/guest` 하면 슬래시가 빠진다. **`origin + '/#/guest'`** 또는 router `href`.  
> 2. auth 서브패스(`/auth/`)에 있어도 최종 브라우저 URL이 `study114.net/#/guest` 형태인지 확인.  
> 3. 로그인 폼·다른 카피는 건드리지 말 것. 링크 href만.

---

### N6 · registrations API 403 스팸 제거 (게이트)

- **재현:** 게스트·공부방·과외·학생 모두에서 역할과 무관하게  
  `GET …/api/registrations/study-rooms.php` · `tutors.php` · `students.php` 중 **권한 없는 것**이 호출되어 403.
- **AFTER:**  
  - 게스트 → registrations 목록 API **호출하지 않음** (공개 검색·홈 API만)  
  - 공부방 → 필요 시 study-rooms만. tutors/students registrations **불필요하면 생략**  
  - 과외 → tutors만. study-rooms/students registrations 생략  
  - 학생 → students만. study-rooms/tutors registrations 생략  
- **금지:** 403을 없애려고 PHP ACL을 「누구나 200」으로 넓히기.

#### 「커서 주석」·오판 방지 (N6)

> 1. **증상은 콘솔 403, 원인은 프론트 과호출.** 서버를 열어 조용히 만들지 말 것.  
> 2. 홈 부팅·레이아웃·멤버박스·비교함 등에서 **세 타입을 한꺼번에 prefetch**하는 코드가 흔한 원인. 역할 스위치로 분기.  
> 3. UI가 이미 빈/숨김이어도 fetch가 나가면 실패. **렌더 전에 게이트.**  
> 4. 공개 검색 `POST …/search` · `region-stats` 는 유지(정상). registrations와 혼동하지 말 것.  
> 5. 164의 역할 홈 헬퍼와 같은 **역할 판별**을 재사용하면 좋음.

---

### N7 · `board_key=submission` 403

- **재현:** 공부방·학생 등에서 `GET …/api/board/posts.php?board_key=submission` → 403
- **AFTER:** 해당 역할에 submission 보드 권한이 없으면 **호출 생략**. 메뉴/탭도 안 보이면 fetch도 없음.
- ACL 확대 금지 (N6과 동일 원칙).

#### 「커서 주석」·오판 방지 (N7)

> 1. 커뮤니티 허브가 **모든 board_key를 순회 fetch**할 수 있음. 역할 allowlist로 필터.  
> 2. 422(파라미터)와 403(권한)을 혼동하지 말 것. 이번 초점은 **403 과호출**.  
> 3. 권한이 있는 역할의 submission은 기존대로 동작 유지.

---

### N8 · 학생 `#/plans` 고아 화면

- **재현:** 학생으로 `https://study114.net/#/plans` 직접 진입 → 안내문만 있고 **GNB·푸터 없음**
- **권장(최소 택1):**  
  **A.** 안내 유지 + **정상 크롬(GNB·푸터)** 렌더  
  **B.** `#/parent`로 리다이렉트 + 짧은 토스트  
- **카피 제안 (A를 고를 때):**  
  「유료상품은 공부방·과외쌤 회원용이에요. 홈으로 돌아가 주세요.」  
  버튼 → `#/parent` (라벨 예: 「학생 홈으로」)
- GNB에 유료상품을 학생에게 다시 달지 말 것 (역할 배제 유지).

#### 「커서 주석」·오판 방지 (N8)

> 1. **최소 수정.** A와 B 중 하나. 유료상품 페이지 전면 개편 금지.  
> 2. 공부방·과외의 `#/plans` 정상 화면을 깨지 말 것.  
> 3. 「유료상품」사이트 표시명 유지. 「플랜」「PAID」영문 배지는 166 범위 — 필요하면 배지만 겹치지 않게 두고 본 티켓은 크롬/리다이렉트.

---

### N9 · `hope=tutor` 시 `role=parent` 유지

- **재현:** `…/search/#/search/student?role=parent` 에서 「과외 희망 학생」 클릭 →  
  `?hope=tutor` 만 남고 **`role=parent` 유실**
- **AFTER:** `…/search/#/search/student?role=parent&hope=tutor` (순서 무관 · role 필수 유지)
- 다른 hope 필터도 **기존 role 쿼리를 보존**하는 방식으로.

#### 「커서 주석」·오판 방지 (N9)

> 1. 필터 클릭 핸들러가 query를 **통째로 교체**하면 role이 날아감. **merge** 할 것.  
> 2. role 기본값을 guest/tutor로 바꾸며 「고쳐지지」 말 것. 현재 세션·URL의 role을 유지.  
> 3. 학생 역할 표시명은 「학생」. URL 토큰 `parent`는 해시 라우트 관례 — **해시 라우트 이름 변경 금지**(166·167과 동일).

---

### N10 · 고객센터 진입 통일 → `#/support`

- **재현:** 게스트 홈 고객센터 → `#/support` (허브).  
  검색 GNB 고객센터 → `/support/notice` (공지 직행) — **도착지 불일치**
- **권장 잠금:** 검색 GNB도 **`#/support` 허브**. notice만 보고 싶으면 허브에서 한 번 더.
- 제품이 「검색에서는 공지 직행」을 명시 잠금하면 그때 문서화 — **기본 권장은 허브 일치**.

#### 「커서 주석」·오판 방지 (N10)

> 1. `/support/notice` 절대경로와 해시 `#/support` 혼재 가능. **앱 라우터 기준**으로 맞춤.  
> 2. 164 N2(메인 홈)와 고객센터 **내부** 링크는 별개. 이번은 **GNB 진입점**.  
> 3. 146–148 고객센터 본문 카피 재작성으로 확대하지 말 것.

---

## 3. Allowlist (예상 · **실경로 확인 후**)

```
# N5 로그인 둘러보기
preview/**/auth/** · login 화면 링크 문자열

# N6·N7 fetch 게이트
preview/home-ui/src/** (홈 부팅·registrations prefetch)
preview/**/board** · community 데이터 로더
# registrations/*.php 호출부 grep 후 역할 분기만

# N8 plans 학생
preview/home-ui/src/**/plans*

# N9 search query merge
preview/search-ui/** 또는 search student 필터 핸들러

# N10 support GNB
검색 셸 GNB · support 링크 상수
```

**Forbidden:** push · `build:dothome` · `git add -A` · Notion · **ACL 완화로 403 침묵** · PHP 권한 개방 · 146–148 본문 · P0/P2/P3 대규모 혼입 · 해시 라우트 rename

커밋 메시지 예:  
`fix(mode-audit): P1 gate role API fetches, plans chrome, hope role query`

---

## 4. MUST / MUST NOT

### MUST

- N5: 둘러보기 → 주소창에 `…/#/guest` (슬래시 있음)
- N6: 각 역할·게스트에서 **권한 없는** registrations GET **네트워크 0** (또는 호출 안 함)
- N7: 권한 없는 역할에서 `board_key=submission` GET **0**
- N8: 학생 `#/plans` — GNB·푸터 있거나 `#/parent`로 안전 이동
- N9: `role=parent&hope=tutor` 동시 유지
- N10: 검색 GNB 고객센터 → `#/support` (권장 잠금 채택 시)

### MUST NOT

- registrations·board ACL을 손님/타역할에 개방
- 학생 GNB에 유료상품 재노출
- push / 배포 / Notion

---

## 5. 수락 스모크 매트릭스

| # | 역할 | URL / 행동 | 기대 |
|---|------|------------|------|
| S1 | 게스트 | `auth/#/login` 「로그인 없이 둘러보기」 | `https://study114.net/#/guest` (슬래시) |
| S2 | 게스트 | `#/guest` 로드 · Network | registrations study-rooms/students/tutors **403 없음**(호출 없음) |
| S3 | 공부방 | `#/study-room` 로드 | 타역할 registrations·submission **불필요 호출 없음** |
| S4 | 과외 | `#/tutor` 로드 | study-rooms/students registrations 호출 없음 |
| S5 | 학생 | `#/parent` 로드 | study-rooms/tutors registrations·submission 호출 없음 |
| S6 | 학생 | `#/plans` | 크롬 있음 + 정중 안내 **또는** `#/parent` 리다이렉트 |
| S7 | 학생 | student 검색 → 과외 희망 | URL에 `role=parent` **와** `hope=tutor` |
| S8 | 게스트 | 검색 GNB 고객센터 | `#/support` 허브 (notice 직행 아님 · 권장) |
| S9 | 공부방 | `#/plans` | **회귀 없음**(정상 유료 안내) |
| S10 | 과외 | `#/plans` | **회귀 없음** |

계정: `leejetty+room` / `+tutor` / `+student` / 게스트.

---

## 6. 붙여넣기 (Cursor)

```
[티켓 165 · 모드점검 P1 N5–N10 · 로컬만 · push/build:dothome 금지]

※ D:\work\study114 · 정본 docs/165 · 근거 docs/163
※ Notion 금지 · 커밋 1개 로컬

N5 둘러보기 study114.net/#/guest (슬래시). net#/guest 금지
N6 registrations API: 역할·게스트별 fetch 게이트. ACL 확대로 403 침묵 금지
N7 board_key=submission: 권한 없으면 호출 생략
N8 학생 #/plans: GNB/푸터 복구+안내 또는 #/parent 리다이렉트(최소). 카피예
   「유료상품은 공부방·과외쌤 회원용이에요. 홈으로 돌아가 주세요.」→ #/parent
N9 hope=tutor 시 role=parent 유지 (query merge)
N10 검색 GNB 고객센터 → #/support 허브 권장 (notice 직행 지양)

Forbidden: push · build:dothome · ACL 완화 · Notion · 해시 라우트 rename · git add -A
allowlist: 실경로 확인 후. registrations·submission 호출부 · login browse · plans · search query · GNB support

스모크: 슬래시 · 역할별 Network 403 소거 · plans 크롬 · hope+role · support 허브
계정: room / tutor / student(+student) / guest
```

---

## 7. 하지 말 것

- 「배포」 전 push / `build:dothome`
- 403을 숨기려고 서버 권한 열기
- 164·166·167을 한 커밋에 섞기
- Notion
