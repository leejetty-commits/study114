# 044 · 공부방 로그인 홈 — 멤버박스·홍보1 위치 전역 수정

- 작성일: 2026-09-24 (KST)
- 출처: 종현 스크린샷 지적 (1·2·5·7·8만) · 첨부 이미지 기준
- 정책 SSOT: 노션 7장·9장 (공부방 홈 = **대표 홍보지역1**) · [031](031-studyroom-open-address-promo1-policy.md)
- 상태: **로컬 수락**(044+048) · [048 수락](048-studyroom-home-044-fixup-acceptance.md) · push/`build:dothome` **금지**
- 병행: 043 배포 티켓과 **커밋 섞지 말 것**. 043 결과와 별도 워킹트리/브랜치 권장.

---

## 0. 한 줄

공부방 로그인 홈이 **게스트 대치동 데모 + `MY_STUDY_ROOM` 하드코드 + 시드 id=1**에 묶여 있다.  
로그인 세션의 **실공부방**(`study_room_name`·홍보1·inquiry·미읽음·실조회)로 갈아끼운다.  
이번 범위는 스크린샷 **1·2·2.1·5·7·8만**. 3·4·6·9 및 나머지 번호는 **후속**.

---

## 1. 재현 (사용자 계정)

- 역할: 공부방 로그인
- 실제 공부방명: **가능동베스트3**
- 홍보지역1: **의정부 가능동** (표시 예: `의정부 가능동` / `경기도 의정부시 가능동` — DB 라벨 SSOT 그대로, 게스트 대치동 금지)
- 증상: 우측 멤버박스에 「우동공부방 대치점」·상태 운영중·문의 5·조회 128·등록일 더미  
  우리동네·지도·현재위치(프라임/픽/베이직)가 **서울 강남구 대치동**

---

## 2. 원인 (코드로 확인됨)

| 증상 | 원인 |
|------|------|
| 잘못된 공부방 이름·상태·문의·조회 | `preview/home-ui/src/data.js` `MY_STUDY_ROOM` 하드코드 → `screens/study-room.js` `renderMyStudyRoomBox()`가 그대로 렌더 |
| 자기 홈이 남의/데모 카드 | `preview/search-ui/src/search-provider-self.js` `PREVIEW_OWN_STUDY_ROOM_ID = 1` + `EXPOSURE_STUDY_ROOMS` 시드 |
| 우리동네·지도·현재위치 = 대치동 | `resolveActiveRegionLabel` room 탭이 `MOCK_REGIONS.room`(=게스트 대치동) 폴백. map도 `activeRegionLabel || MOCK`. **홍보1을 find state에 시드하는 경로 없음** |
| 쪽지 미확인 숫자 | 알고리즘 **있음**: `message_thread_reads.read_at` · `MessagesRepository::countUnreadForUser` · threads `counts=1`. 멤버박스가 안 씀 |
| 조회 실값 | `provider_profile_views` + `ProviderRoiService` + `GET public/api/paid/roi.php`. 멤버박스가 128 하드코드 |

### 2-1. 함정 — hub `region_label` ≠ 홈 위치 SSOT

`StudyRoomHubRepository::regionLabel()`은 **`study_rooms.region_id`(개설)를 먼저** 쓰고, 그다음 `study_room_regions.is_primary`(홍보1)다.  
홈 우리동네·지도·현재위치·멤버박스「수업지역」은 사용자·노션7·9·031에 따라 **홍보1만** 쓴다.  
**hub `region_label`을 그대로 홈 위치로 쓰지 말 것.** `saved_regions`에서 `is_primary=1`(또는 slot1) 라벨을 집어서 `activeRegionLabel` / 수업지역에 넣는다.

정책(노션 7·9): 비회원만 대치1동 데모. **공부방 로그인 홈 = 홍보지역1.**

---

## 3. 목표 UX (잠금)

### 3-1. 멤버박스 (스크린샷 ①)

| # | 요구 | 바인딩 |
|---|------|--------|
| 1-1 | 제목 = 로그인 공부방 **실명** | `study_rooms.study_room_name` (예: 가능동베스트3). `MY_STUDY_ROOM.name` 금지 |
| 1-2 | `수업지역 : {홍보1표시}` | `study_room_regions` **is_primary=1** (slot1/홍보1) 라벨. 개설주소(`study_rooms.region_id`)와 **다를 수 있음**(031). 라벨 예: `수업지역 : 의정부 가능동` |
| 1-3 | `쪽지상태 : {수신} / {N}개 미확인` | 수신: `inquiry_status` — `open`→`받음`, `paused`/`capacity_full`/`waiting_only`→카피 짧게(`안받음` 등, 기존 P20 카피와 충돌 없으면 그 표기). 미확인: **쪽지 unread** (`countUnreadForUser` / 기존 messages API). 「열어봤는지」= `message_thread_reads.read_at` 기준 — **이미 있음** |
| 1-4 | `조회` = **실값** | `provider_profile_views`에서 이 공부방(`target_type=study_room`, `target_id=room.id`) COUNT. ROI `days` 윈도우만 있으면 멤버박스용 **누적(또는 기존 허브 필드)** 최소 추가·재사용. **128 하드코드 금지**. 기록 경로(`recordProfileView`)가 상세/카드 진입에 붙어 있는지 스모크·보고 |
| 1-5 | 배지 | **제거** `공부방 수정`(`edit-room`), `등록 관리`(`manage-room`). **신설** `쪽지 후기함 바로가기`(글자만 작게) → `#/mypage/messages/reviews` · `마이페이지` → `#/mypage` (기존 라우트, 30장) |
| (유지) | `등록` 일 | 하드코드 날짜 금지. 실 `created_at`/`registered` 필드가 있으면 그걸. 없으면 칸 숨기거나 API에 있는 날짜만 |

### 3-2. 위치 전역 (②·②.1·⑤·⑦·⑧)

공부방 로그인 + **우리동네 공부방** 자기탭(homeSelf)에서:

| 위치 | 표시 |
|------|------|
| 우리동네 브레드/헤더 (②) | 홍보1 라벨 (의정부 가능동) |
| 지도 (②.1) | 동일 홍보1 중심·라벨. **게스트 대치동 폴백 금지** |
| 현재위치 (⑤ 프라임 · ⑦ 픽 · ⑧ 베이직) | 동일 홍보1 |

`resolveActiveRegionLabel` / map `regionLabel` / `section-headings` `locationLabel`이 **한 SSOT**(홍보1)을 쓰게 할 것.  
게스트 `#/guest` 대치동 데모는 **유지**.

### 3-3. 잠긴 결정 (조사 후)

1. **홈 위치 SSOT = 홍보1** (`saved_regions` primary). 개설·hub `region_label` 아님.
2. **수업지역 표시문** = 그 홍보1의 기존 region/단지 표시 라벨(마스터 라벨). 새 free-text 컬럼 금지.
3. **조회** = 이 공부방 `provider_profile_views` **누적 COUNT** (멤버박스). ROI 7일 요약만 있으면 누적 쿼리 최소 추가·재사용. 기간 필터 UI는 이번 범위 밖.
4. **등록일** = hub에 있는 실날짜 필드 유지(하드코드 금지). 재정의하지 않음.
5. **쪽지 후기함** 링크 = `#/mypage/messages/reviews` (없으면 `#/mypage/messages`로 폴백하되 보고).

### 3-4. 이번 제외 (후속)

- ③·④ 맵박스·상세검색 제거 → **[046](046-studyroom-home-mapbox-detailsearch-ticket.md)**
- ⑥ 프라임/베이직 점유 → **[047](047-studyroom-home-prime-basic-occupancy-ticket.md)**
- ⑨ 및 사용자가 “다시 작성”하기로 한 번호
- 과외쌤/학생 홈 멤버박스 · **과외쌤 홈 홍보1 전역 = 후속 점검**
- push / `build:dothome` / 043과 한 커밋

---

## 4. 구현 방향 (최소)

1. `renderMyStudyRoomBox`를 **async/세션 데이터**로: StudyRoom hub GET(기존 등록 허브 API)에서 `study_room_name`, `inquiry_status`, `saved_regions`(primary), 등록일 + messages unread + views count.
2. `getProviderSelfFeed` / `PREVIEW_OWN_STUDY_ROOM_ID=1` 고정을 **로그인한 내 room id**로 교체. 시드 exposure만으로 이름·location 쓰지 말 것.
3. 공부방 homeSelf 진입 시 `state.activeRegionLabel`(및 canonical)에 **홍보1 라벨**을 먼저 심고, map/섹션 헤더가 그걸 소비.
4. 새 테이블·새 엔드포인트는 가급적 금지. 필요 시 기존 hub/messages/roi에 **필드 1~2개**만. views 누적이 roi에 없으면 **최소 COUNT 쿼리**를 기존 paid/hub 쪽에.

---

## 5. Allowlist (원칙)

작업 전 검색으로 확정 후 보고. 예상 중심:

```
preview/home-ui/src/screens/study-room.js
preview/home-ui/src/data.js          (MY_STUDY_ROOM 제거 또는 dead 표시만 — 런타임 경로 끊기)
preview/search-ui/src/search-provider-self.js
preview/search-ui/src/search-find-surface.js   (homeSelf 홍보1 seed — 최소)
preview/home-ui/src/auth-session.js 또는 기존 hub fetch 헬퍼
(+ 필요 최소) public/api/... hub | messages unread | views
src/Registration/StudyRoomHub*.php · src/Messages/* · src/Paid/ProviderRoi*.php
(+ 최소 CSS) 쪽지후기함 링크 작은 글씨
```

**금지:** auth signup WIP, student-basic PHP/CSS, 043 allowlist와 무관한 대량 리팩터, exposure-data 시드 “대치” 전면 삭제(게스트 데모용 유지), 지도 라이브러리 교체, 상세검색 전면.

---

## 6. 스모크 (필수)

공부방 로그인(가능동베스트3 / 홍보1=의정부 가능동):

1. 멤버박스 제목 = **가능동베스트3** (대치점 문구 0)
2. `수업지역 :` 뒤에 홍보1 (의정부 가능동) — 개설주소와 달라도 홍보1
3. `쪽지상태 : 받음 / N개 미확인` — N이 messages unread와 일치. 쪽지 열어 `read_at` 찍힌 뒤 N 감소
4. 조회 = DB `provider_profile_views` 카운트와 일치 (128 고정 아님). 기록 경로 유무 보고
5. 배지: 공부방수정·등록관리 **0**. 쪽지후기함→reviews, 마이페이지→mypage
6. 우리동네·지도·프라임/픽/베이직 현재위치 = 홍보1. 대치동 **0**
7. 게스트 홈은 여전히 대치동 데모

보고: diff 파일 목록, hub/API 필드, unread·views 증거, 스모크, 의도적 미포함(③④등).

---

## 7. Cursor 붙여넣기 블록

```
[티켓 044 · 공부방 로그인 홈 멤버박스·홍보1 전역]

범위: 스크린샷 1·2·2.1·5·7·8만. 3·4·6·9 금지.
push / build:dothome / 043 커밋 혼합 금지. 로컬만.

정책: 노션7·9 · 공부방 홈=홍보지역1. 게스트만 대치동 데모.

원인(확정):
- data.js MY_STUDY_ROOM → study-room.js 멤버박스 하드코드
- search-provider-self.js PREVIEW_OWN_STUDY_ROOM_ID=1 + EXPOSURE 시드
- MOCK/GUEST_DEFAULT room=대치동 폴백, 로그인 홍보1 미시드
- 쪽지 unread=message_thread_reads 있음 / 조회=provider_profile_views·roi 있음 → 박스 미연결

해야 할 일:
1) 멤버박스 실데이터: study_room_name, 수업지역=saved_regions primary(홍보1),
   쪽지상태=inquiry_status(open→받음)+unread N개 미확인,
   조회=provider_profile_views 실COUNT(128 금지), 등록=실날짜,
   배지: 공부방수정·등록관리 제거 / 「쪽지 후기함 바로가기」(작게)→#/mypage/messages/reviews /
   「마이페이지」→#/mypage
2) homeSelf 우리동네·지도·현재위치(프라임·픽·베이직)=홍보1 (의정부 가능동). 대치동 0
3) 자기피드 id=1 고정 제거 → 로그인 내 room
4) 함정: hub region_label은 개설 우선 → 홈 위치에 쓰지 말 것. saved_regions is_primary만.
5) 조회=누적 provider_profile_views COUNT (7일 ROI만으로 퉁치지 말 것)

스모크: 가능동베스트3 / 홍보1 의정부가능동 / unread 감소 / views DB일치 / 게스트 대치 유지.
보고: 파일·API·증거·제외범위.
```
