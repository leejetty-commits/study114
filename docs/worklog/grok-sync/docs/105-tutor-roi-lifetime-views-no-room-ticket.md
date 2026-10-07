# 105 · Cursor — 과외쌤 ROI `lifetime_views` (study_room_id 없을 때)

- 작성일: 2026-09-25 (KST)
- 화면: **과외쌤 로그인 홈 · 과외쌤 박스 · 조회**
- 선행: [103](103-tutor-home-views-real-lifetime-ticket.md) 화면 연결 · [104](104-tutor-home-views-103-acceptance.md) 부분 수락
- 사용자 잠금: 조회는 허수 금지 · **실제 누적** (2026-09-25)
- 상태: **로컬 수락** → [108](108-tutor-roi-lifetime-105-acceptance.md) · push 금지 · 배포 시 103과 묶음 후보
- 기준 HEAD: `0456459` + 워킹트리 103 프론트(미푸시) — Cursor가 재확인

---

## 0. 한 줄

`/api/paid/roi.php`에서 **`study_room_id`가 없으면** 과외쌤(tutor) 프로필 누적 조회를 `lifetime_views`로 돌려준다.  
`study_room_id`가 있으면 **지금처럼 그 공부방 1건만**(회귀 금지).

---

## 1. 지금

`ProviderRoiService::getSummary`:

- room id 있음 → `countLifetimeViewsForProvider(user, roomId)` (study_room만)
- room id 없음 → **`lifetime_views = null`** ← 과외쌤 박스 **—** 원인

기록은 이미 `target_type=tutor` / `tutors.id`로 쌓임(`recordProfileView`).

---

## 2. 잠금

1. **`study_room_id` 있음(>0):** 기존과 동일 — 해당 공부방만. 공부방 홈 조회 숫자 회귀 금지.
2. **`study_room_id` 없음:**  
   `lifetime_views` = 그 공급자 유저 소유 **tutor** 대상 누적 COUNT  
   (`provider_profile_views` · `target_type='tutor'` · `target_id IN (SELECT id FROM tutors WHERE user_id=?)` · 본인 열람 제외 — `countViewsForProvider`의 tutor 분기와 동일 소유·제외 규칙, **기간 필터 없음**).
3. 과외 프로필이 없으면 **0** 또는 null 중 하나 — **잠금: 숫자 0** (박스는 `0` 표시; 프론트는 null만 — 이므로 0을 주면 `0`이 보임).  
   실패/권한 오류가 아니면 null로 숨기지 말 것.
4. 최근 N일 `metrics.views` 동작 변경 금지(이번 범위 밖).
5. 103 프론트(`tutor-home-seed.js` · `tutor.js`) **유지** · 허수 재도입 금지.

---

## 3. Allowlist (B)

```
src/Paid/ProviderRoiService.php
src/Paid/ProviderRoiRepository.php
```

필요 시만·보고:

```
public/api/paid/roi.php          # 파라미터 패스스루만 확인할 때
```

프론트 103 파일은 **이미 워킹트리에 있음** — 이번 티켓에서 서버만 고쳐도 됨. 같이 손대면 회귀만 스모크.

---

## 4. Forbidden

```
push · build:dothome
git add -A
공부방 lifetime 공식 변경(room id 있을 때)
가입·홈 UI vacant·학생찾기
location-display · ProviderUsage · teaser
```

---

## 5. 스모크

1. `GET/POST` roi · **study_room_id 없음** · 과외쌤 로그인: `lifetime_views`가 **숫자**(쌓인 조회 또는 0).
2. 같은 유저·**study_room_id=소유방**: 공부방 홈과 같이 **그 방만** COUNT(기존과 동일 체감).
3. 과외쌤 홈 박스 조회: **—**가 아니라 그 숫자(103 프론트 연결 상태).
4. 공부방 홈 조회 회귀 없음.
5. push 안 함.

---

## 6. 완료 보고

1. before/after: room 없을 때 null → 숫자  
2. SQL/메서드 요약(tutor 누적)  
3. diff 파일 = B  
4. 스모크 1~4 · push 안 함

---

## 7. Cursor 붙여넣기

```
[티켓 105 · ROI lifetime_views 과외쌤(room id 없음) · 로컬 · push 금지]

원인: ProviderRoiService는 study_room_id 있을 때만 lifetime_views. 없으면 null → 과외쌤 박스 —.
103 프론트(tutor-home-seed fetchRoiSummary(7))는 유지.

잠금:
- study_room_id 있음: 지금과 동일(공부방 1건만) · 회귀 금지
- study_room_id 없음: 그 유저 소유 tutor 프로필 누적 COUNT → lifetime_views (본인열람 제외, 기간필터 없음). 없으면 0(null로 숨기지 말 것)
- metrics.views(최근 N일) 손대지 말 것

Allowlist: src/Paid/ProviderRoiService.php · ProviderRoiRepository.php
스모크: room없이 숫자 · room있으면 공부방 동일 · 과외쌤 홈 조회에 숫자 · 공부방 홈 회귀 · push 금지
```
