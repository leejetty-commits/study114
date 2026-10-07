# 150 · Cursor — 게스트 홈 지도·핀을 서울 대치동만으로 한정 (로컬)

- 작성: 2026-09-25 14:45 KST
- 선행: [149](149-guest-home-map-nationwide-vs-daechi.md) · [122](122-guest-home-remove-fake-numbers-backlog.md) · [129](129-guest-home-122-cursor-ticket.md) · [141](141-tutor-region-label-140-deploy-acceptance.md)
- 상태: **Cursor 구현 대기** · push · `build:dothome` **금지**(「배포」 말하기 전)
- 사용자 잠금(2026-09-25): 손님 홈 지도는 **서울 대치동으로 한정**
- 작업 경로: `D:\work\study114` · `git -c safe.directory=D:/work/study114`
- 기준: fetch 후 `origin/main` SHA 보고. (운영 카피 배포분 `f154183` 이후일 수 있음 — **실제 HEAD를 티켓 결과에 적을 것**)
- 샷(재현): `/workspace/guest-map-audit/guest-home-map-after.png` (광역 줌) — Cursor 채팅에 사용자가 직접 첨부 가능
- dirty 잔여(커밋 금지): `preview/home-ui/src/study-room-reg/screens.js` · repo docs 잔여 등 — **이번 stage에 넣지 말 것**

---

## 0. 목표 (사이트 표시 이름)

**손님 홈** `#/guest` 상단 지도:

1. 지도 화면이 **서울 대치동 동네**처럼 보이게 (한반도·타 시도 광역 줌 금지)
2. 지도 핀도 **대치동(데모 축)에 해당하는 공부방만**
3. 박스 제목 「대치동」·현재위치 「서울 강남구 대치동」·region-stats 숫자 축 **유지**

로그인 홈·찾기(검색) 지도 UX는 **이번 범위 밖**(회귀만 금지).

---

## 1. 잠금 정책

| 항목 | 잠금 |
|------|------|
| 지도 카메라 | 손님 홈 = **서울 대치동** 중심 · 동네 줌(대략 zoom 13–15). 전국·광역 fit 금지 |
| 지도 핀 | **대치동 축** 공부방만. 부산·의정부 등 타 지역 좌표 핀 **올리지 않음** |
| 데모 축 문자열 | 기존과 동일: `서울 강남구 대치동` / `대치동` (`GUEST` 데모 `Gf` / `GUEST_DEMO_REGIONS_BY_AXIS.room`) |
| GPS | **도입 금지** |
| region-stats | 축·API **변경 금지** (이미 대치/서울시) |
| 카드 목록(프라임·픽·베이직) | 이번 티켓에서 **전국 목록 정책을 바꾸라는 뜻이 아님**. **지도 핀·카메라만** 대치 한정. (목록과 지도가 어긋나도 지도는 대치 유지) |

---

## 2. 원인 (운영 실측 · 가설로 검증)

운영 `filters:{}` 홈 목록에 대치+부산(센텀·우동) 좌표가 같이 오고, 핀 2개+이면 네이버 `fitBounds`가 **광역**으로 벌림.  
라벨·숫자는 대치 축이라 **불일치**. 상세: [149](149-guest-home-map-nationwide-vs-daechi.md).

가설이 틀리면 보고 후 최소 수정으로 같은 목표 달성.

---

## 3. 수정 방향 (최소 · 구현자 판단)

아래 중 **목표를 만족하는 최소 조합** (과잉 리팩터 금지):

1. 손님 홈 지도에 넘기는 items를 **대치동 데모 축으로 필터**  
   - 예: `region_label` / `location_label`에 대치 토큰 매칭, 또는 홈 fetch에 공부방 지역 필터를 대치로 넣되 **지도 전용**이면 목록 hydrate와 분리해도 됨
2. 손님 홈 지도 마운트에서는 핀이 여러 개여도 **타 시도까지 fitBounds 하지 않음**  
   - 중심·zoom = 대치 데모 좌표(`37.4946, 127.0626` 시드 또는 `REGION_COORDS` / resolve 결과) 고정  
   - 또는 fitBounds를 대치 인근 바운드로 클램프
3. 핀 0개여도 대치 동네 줌 유지 (빈 지도여도 전국으로 가지 말 것)

**금지:** GPS · region-stats 변경 · 로그인 홈 맵 동작 깨기 · 스키마 변경 · 카피 146–148 작업 혼입

---

## 4. Allowlist (실경로 확인 후 stage · 예상)

```
preview/home-ui/src/guest-sections.js
preview/home-ui/src/home-basic-live.js
preview/shared/naver-map.js
```

필요 시만 (지도 전용 필터 헬퍼가 여기 있으면):

```
preview/home-ui/src/data.js
preview/shared/location-display.js
```

**Forbidden:** push · `build:dothome` · `git add -A` · dirty 잔여 · PHP/SearchService(이번 불필요 시) · Notion · 이용안내/고객센터 카피 · 로그인 홈 전면 개편

커밋 **1개** 로컬만. 메시지 예: `fix(guest-home): keep guest map pins and camera on Daechi-dong`

---

## 5. 스모크 (수락 기준)

1. 게스트 `#/guest` (비로그인) — 지도가 **대치·강남 동네** (한반도·울릉·독도가 한눈에 보이면 **실패**)
2. 현재위치 라벨 **서울 강남구 대치동** · 박스 「대치동」 · 숫자 = `POST region-stats {}`와 동일
3. 운영에 부산 좌표 공부방이 있어도 **지도에 부산 핀 없음** · 카메라가 부산으로 안 끌림
4. 새로고침 직후·목록 로드 후에도 광역으로 벌어지지 않음
5. 로그인 홈·공부방찾기 지도 **회귀 없음**(스모크 한 줄)

결과 보고: HEAD SHA · 커밋 SHA · 변경 파일 목록 · 스모크 1–5 · 광역 재발 여부

---

## 6. 붙여넣기 (Cursor)

```
[티켓 150 · 게스트 홈 지도·핀 서울 대치동 한정 · 로컬만 · push 금지]

※ D:\work\study114 · git -c safe.directory=D:/work/study114
※ 정본: study114-ds/docs/150 · 원인: docs/149
※ 사용자 잠금: 손님 홈 지도는 서울 대치동으로 한정

목표
- #/guest 지도 카메라 = 대치동 동네 줌 (전국·광역 fitBounds 금지)
- 지도 핀 = 대치동 축 공부방만 (부산 등 타 지역 핀 금지)
- 박스「대치동」·현재위치「서울 강남구 대치동」·region-stats 축 유지
- GPS 금지 · 로그인 홈/찾기 맵 대수술 금지 · 카드 목록 정책 이번 아님

원인(운영): home 목록 filters:{}에 대치+부산 좌표 → 핀 2+ fitBounds 광역. 라벨만 대치.

수정(최소): 손님 홈 지도 items 대치 필터 + guest/home에서 fitBounds 비활성 또는 대치 클램프. 핀0도 대치 줌.

allowlist 후보(확인 후):
preview/home-ui/src/guest-sections.js
preview/home-ui/src/home-basic-live.js
preview/shared/naver-map.js
(+ 필요 시 data.js · location-display.js)

Forbidden: push · build:dothome · git add -A · dirty 잔여 · Notion · PHP 불필요 변경 · 146–148 카피

스모크: #/guest 대치 동네 줌 · 부산 핀 없음 · region-stats 숫자 일치 · 로드 후에도 광역 없음 · 로그인홈/찾기 회귀 없음
커밋 1개 로컬만. fetch 후 HEAD 보고.
```

---

## 7. 하지 말 것

- 「배포」「푸시해」 전 push / `build:dothome`
- 게스트 홈 GPS
- 숫자 박스 API 재설계
- 이용안내·고객센터(146–148)와 한 커밋에 섞기
