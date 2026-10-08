# 048 · 044 보완 — hub 폴백 제거 · 조회 단방 COUNT

- 작성일: 2026-09-24 (KST)
- 선행: [044](044-studyroom-home-promo1-memberbox-ticket.md) Cursor 로컬 구현 · 정밀검토 조건부수락
- 상태: **Cursor 보완 지시 잠금** (로컬만 · push/`build:dothome` **금지**)
- 병행: 046·047·043·signup WIP와 **커밋 섞지 말 것**

---

## 0. 한 줄

044 핵심 UX는 통과. 남은 것은 (1) 홍보1 라벨이 hub **개설** `region_label`로 폴백할 수 있는 구멍, (2) `lifetime_views`가 **현재 공부방 1건**이 아니라 소유 전체(방+과외) 합산일 수 있는 구멍. 이 두 개만 막는다.

---

## 1. 044에서 통과한 것 (재작업 금지)

- 멤버박스: `study_room_name` · 수업지역=`promo_label`/primary · 쪽지 받음/안받음+unread · 배지→후기함/마이페이지 · edit/manage 제거 · 등록일 `created_at`
- 우리동네·지도·프라임/픽/베이직 현재위치 = 홍보1 (로컬 스모크: 논현1동). 로그인 홈 「대치」0. 게스트 대치 유지
- self id=1 제거 · 홈 목록=홍보1 지역 검색 · SearchService PDO 중복 placeholder 500 수정(티어 미변경)
- 커밋/push/`build:dothome` 없음

논현1동으로 스모크한 것은 DB에 가능동 방이 없어서다. 가능동 coords 추가는 044에 있음 — 경로 동일하면 OK.

---

## 2. 보완 MUST

### 2-1. `studyRoomPromo1Label` — hub/개설 폴백 삭제

파일: `preview/home-ui/src/study-room-home-seed.js` (또는 동일 헬퍼)

금지: `room.region_label` / hub `regionLabel()`(개설 `study_rooms.region_id` 우선)를 홈 수업지역·위치 SSOT 폴백으로 쓰는 것.

허용 순서만:
1. `saved_regions` **is_primary / slot1** 의 `promo_label`
2. 없으면 같은 primary 행의 표시용 `region_label`(슬롯 라벨 — hub 전체 room.region_label 아님)
3. 그래도 없으면 빈 문자열/`—` (개설 주소로 채우지 말 것)

### 2-2. `lifetime_views` — 현재 로그인 공부방 id 1건

파일: `ProviderRoiRepository.php` `countLifetimeViewsForProvider` (및 호출부)

티켓 044: `provider_profile_views` where `target_type=study_room` AND `target_id=현재 room.id`.

금지: 유저 소유 전체 study_rooms 합산, tutors 합산.

멤버박스 조회 = 그 방 누적 COUNT만. (본인 열람 제외 정책이 있으면 유지·보고)

### 2-3. (선택) 논현1동 coords

로컬 스모크 계정이 논현1동이면 `location-display.js` / `naver-map.js`에 가능동과 동일 패턴으로 좌표 추가. 필수 아님 — 라벨 SSOT가 논현이면 044 위치 요구는 충족.

### 2-4. 손대지 말 것

- 047: self `exposure_tier:'prime'` 하드코드 · `demo_prime_filled` · `resolveExposureTier`
- 046: 맵박스 카피·상태 dl·상세검색 hide
- auth/signup WIP, student-basic, 043 allowlist 파일
- push / `build:dothome`

---

## 3. 스모크

1. 홍보1만 있는 계정: 수업지역·우리동네 = 홍보1. 개설주소와 다르게 바꿔도(가능하면) 홈은 홍보1
2. `promo_label` 비어 primary만 있는 경우에도 **개설 region_label로 안 채워짐**
3. views: DB에서 해당 room.id COUNT와 멤버박스 숫자 일치 (다른 방/과외 조회 섞이지 않음)
4. 기존 044 스모크 회귀 없음 (이름·쪽지·링크·게스트 대치)

보고: diff 파일만, 폴백 제거 증거(시그니처), views SQL, 스모크.

---

## 4. Cursor 붙여넣기 블록

```
[044 fixup · 048 · hub 폴백 제거 · 조회 단방 COUNT]

범위: 아래 2개 MUST만. 046/047/signup/043 금지.
push / build:dothome 금지. 로컬만. 044 파일만 이어서.

1) studyRoomPromo1Label (study-room-home-seed.js 등):
   room.region_label / hub 개설 regionLabel 폴백 삭제.
   primary.promo_label → primary 슬롯 표시라벨만. 없으면 — .
2) lifetime_views / countLifetimeViewsForProvider:
   target_type=study_room AND target_id=현재 로그인 공부방 id 1건만.
   소유 전체 방·tutor 합산 금지.
3) (선택) 논현1동 coords — location-display/naver-map.
4) 047 prime 하드코드·046 맵/상세검색 건드리지 말 것.

스모크: 홍보1≠개설이어도 홈=홍보1 / views=해당 room COUNT / 044 회귀0.
보고: 파일·SQL·폴백 제거 증거.
```
