# 179 · Cursor — 과외쌤·학생 소개 본문 + 역할별 홍보 CTA (로컬)

> **정정 2026-10-09 (종현):** 「마이샵」금지는 과외쌤 화면에만 적용. 공부방 등록 첫 탭 「마이샵」유지·복원. 본문 해당 금지 문구 옆에 인라인 정정 삽입.


- 작성: 2026-09-28 KST · 우동공과2
- 정본: [179](179-promo-tutor-parent-landing-ticket-2026-09-27.md) · 카피 [180](180-ecatalog-role-briefs-2026-09-27.md) · 정책 [178](178-planner-decisions-locked-2026-09-27.md) 잠금4 · 감사 [178a](178a-promo-role-routing-audit-2026-09-27.md)
- 상태: **Cursor 구현 대기** · push · `build:dothome` **금지**
- 저장소: `leejetty-commits/study114` · `D:\work\study114`
- Notion: **쓰지 말 것**
- 표시어: **공부방 · 과외쌤 · 학생 · 등록 · 베이직카드 · 픽 · 프라임 · 쪽지 · 찜 · 비교 · 노출 · 안전이용**
- 금지어: 「학생 의뢰」· BASIC/PICK/PRIME 영문 UI · 「마이샵」(→「프로필 꾸미기」) 「(2026-10-09 종현 확정 정정: 이 금지는 과외쌤 화면에만 적용. 공부방 내 등록 첫 탭 이름은 「마이샵」 유지·복원. 과외쌤은 「마이프로필」. 2026-09-28 커밋 9ee8454의 「프로필 꾸미기」 개명은 이 문서의 과잉 적용이었음.)」

---

## 0. 절대

1. 빈 planned「준비중」페이지로 과외쌤·학생을 **보내지 말 것**. 본문 만든 뒤 `live`.
2. 학생 소개에 **유료상품·픽·프라임·노출 강화 권유 금지**(178 잠금 2).
3. 게스트 「찾기」류 CTA는 **가입/로그인 게이트**(178 잠금 8). 찾기를 열어 주지 말 것.
4. 공부방 소개(`study-room`)는 **유지·슬림 보강만**. 전면 리라이트 금지. 180 B-1 반영은 선택(이번 Must 아님 — tutor/parent가 핵심).
5. 175·177 재작업 금지(링크만 확인).
6. push / `build:dothome` 금지.

---

## 1. Must — 본문

### 1.1 `/#/promo/tutor` (신규 · live)

카피 정본 = 180 **B-2** (Hero·3섹션·Primary「과외쌤 등록 시작하기」).  
구조는 기존 공부방 소개(`study-room-content` 골격)에 맞출 것.

### 1.2 `/#/promo/parent` (신규 · live) — 주독자 **학생**(학부모는 보조)

카피 정본 = 180 **B-3**.  
Primary: 가입/로그인 후 찾기로 이어지는 톤. **유료·픽·프라임 나열 금지.**

### 1.3 catalog

`preview/home-ui/src/promo/catalog.js`에서 tutor·parent를 **`live`**. planned 대체화면 제거.

---

## 2. Must — 역할별 CTA

본문이 live인 뒤:

| 역할 | 레일「소개…」·상단「홍보」도착 |
|------|------------------------------|
| 과외쌤 | `#/promo/tutor` |
| 공부방 | `#/promo/study-room` |
| 학생 | `#/promo/parent` |
| 게스트·등록 중 | 당분간 `#/promo/study-room` 허용 **또는** 라벨「서비스 소개」정직 표기. 빈 planned 금지 |

건드릴 곳: `right-rail.js` `landingPath` / `RAIL_MEDIA_TEASER`, 레이아웃「홍보」경로 — **navRole별 최소**.

---

## 3. Allowlist

- `preview/home-ui/src/promo/catalog.js`
- `preview/home-ui/src/promo/tutor-content.js` (신규 OK)
- `preview/home-ui/src/promo/parent-content.js` (신규 OK · 또는 한 모듈에 둘)
- `preview/home-ui/src/promo/screens.js`
- 필요 시 `preview/home-ui/src/promo/study-room-content.js` **슬림 보강만**(전면 금지)
- `preview/home-ui/src/right-rail.js` — landingPath·역할 분기 **최소**
- 레이아웃「홍보」경로 조립 **기존 1파일**만 (경로 보고서에 명시)

밖 = 오버스코프 → 멈추고 보고.

---

## 4. 금지

학생 유료 CTA, 전면 레일/카피 리라이트, guestFilter SQL, 커뮤니티 ACL, 175/177 재건, Notion, push, `build:dothome`

---

## 5. 수락 스모크

1. `/#/promo/tutor` · `/#/promo/parent`에 **실제 본문**(준비중 아님)
2. 과외쌤 로그인: 레일/홍보 → tutor 소개
3. 공부방: study-room 소개
4. 학생: parent 소개 · 유료·픽·프라임 권유 **0**
5. 게스트: planned 빈 페이지로 안 감 · 찾기 직접 오픈 없음
6. 로컬 커밋 · push 안 함

---

## 6. 붙여넣기

```
티켓 179만. D:\work\study114 · git -c safe.directory=D:/work/study114
push·build:dothome·Notion 금지. 175·177 재작업 금지.

Must:
1) /#/promo/tutor 본문 신규 + catalog live. 카피 정본 180 B-2. Primary「과외쌤 등록 시작하기」.
2) /#/promo/parent 본문 신규 + catalog live. 주독자「학생」(학부모 보조). 카피 180 B-3. 유료·픽·프라임 권유 금지.
3) 구조는 기존 공부방 소개 골격에 맞춤. study-room은 유지·슬림만(전면 리라이트 금지).
4) navRole별 레일「소개」·상단「홍보」: tutor→/#/promo/tutor · study_room→study-room · parent→parent.
   게스트·등록 중: study-room 또는 정직「서비스 소개」. 빈 planned로 보내지 말 것.
5) 게스트 찾기 CTA → 가입/로그인 게이트(찾기 직접 오픈 금지).

용어: 등록·베이직카드·픽·프라임·쪽지·찜·비교·노출·안전이용. 「학생 의뢰」·영문 BASIC/PICK/PRIME·「마이샵」금지(→프로필 꾸미기). 「(2026-10-09 종현 확정 정정: 이 금지는 과외쌤 화면에만 적용. 공부방 내 등록 첫 탭 이름은 「마이샵」 유지·복원. 과외쌤은 「마이프로필」. 2026-09-28 커밋 9ee8454의 「프로필 꾸미기」 개명은 이 문서의 과잉 적용이었음.)」

Allowlist: promo/catalog.js · tutor-content.js(신규) · parent-content.js(신규) · screens.js · study-room-content.js(슬림만) · right-rail.js(landingPath 최소) · 「홍보」경로 기존 1파일.
밖이면 멈추고 보고.

수락: tutor/parent 실본문 · 역할별 도착 · 학생 유료0 · 게스트 planned/찾기오픈 없음. 로컬 커밋. 요점 보고.
정본: docs/179… · docs/180-ecatalog-role-briefs… · docs/178-planner-decisions-locked… · docs/179-promo-tutor-parent-landing-cursor-ticket-2026-09-28.md
```


## 잠금 추가 · 공개 홍보 (2026-09-29)

- `/promo/tutor`·`/promo/parent` = e카탈로그 홍보. **게스트·회원 모두 열람** (로그인 게이트 금지).
- 진입: 배너·팝업·링크만 (GNB「홍보」없음).


## 잠금 · 배너 3개 (2026-09-29)

홈(또는 배너 자리)에 작은 배너 3개 → study-room / tutor / parent 각각.
