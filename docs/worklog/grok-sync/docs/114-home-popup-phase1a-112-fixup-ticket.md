# 114 · Cursor 보완 — 112 Phase 1a 시안 맞춤 (768 · 이벤트 왼쪽)

- 작성일: 2026-09-25 (KST)
- 선행: [112](112-home-popup-phase1a-set-a-shell-ticket.md) · 수락 [113](113-home-popup-phase1a-112-acceptance.md)
- 기준 커밋: `f63924a` (로컬, push 안 함)
- 상태: **로컬만** · push / `build:dothome` **금지**

---

## 0. 한 줄

112 골격은 유지한 채, 시안(pack6-v1.2)·티켓 112에 어긋난 **CSS 두 곳만** 고친다.

---

## 1. 잠금 (이 두 가지만)

1. **광고 세로 스택 기준**  
   - 지금: `@media (max-width: 640px)`  
   - 고침: **`max-width: 768px`** (112 §1-9 · 「광고만 ≤768px 세로 스택」)  
   - 민트 위 · 본문 아래 · 하루 안 보기 행 유지.

2. **이벤트 히어로 왼쪽 정렬**  
   - 지금: `.home-popup__hero { align-items: center; justify-content: center; }` → lockup·「Autumn Offer」가 **가운데**  
   - 고침: 시안 `.event-hero` / `.event-hero-brand`처럼 **왼쪽**  
     - 히어로: `align-items: flex-start` · `justify-content: flex-end`(또는 하단 패딩) · `padding: 20px` 류  
     - lockup + 「Autumn Offer」 캡션의 **왼쪽 끝선을 같게** (112 §1-7 · §3-2)  
   - lockup 높이: 시안 이벤트 ≈48–64px 권장(지금 78px는 과할 수 있음). 히어로 높이 ~210–220px 안에 체크박스가 카드 560에 들어가게 유지.

**하지 않음:** set-b · 대상 엔진 · API/DB · a28 폼 · site-settings-store · lockup PNG 재생성(합본 유지 OK) · push/빌드 · 다른 홈 축.

---

## 2. Allowlist

```
preview/home-ui/src/styles/home-popup.css
```

필요 시에만(최소·보고):

```
preview/home-ui/src/home-popup/mount.js   # 히어로 마크업 래퍼가 꼭 필요할 때만
```

그 외 파일 수정 금지. allowlist 밖이면 중단·보고.

---

## 3. Forbidden

112 Forbidden 전부 + 게이트/`isAdminUser` 로직 변경 · 쿼리 키 이름 변경 · 납작 팝업 억제 로직 제거.

---

## 4. 스모크

1. 폭 **700px** 전후: 광고가 **세로 스택**(640만으로는 부족했던 구간).  
2. 이벤트: 히어로 lockup 왼쪽 · 「Autumn Offer」 왼쪽 = lockup 왼쪽.  
3. 공지·광고·관리자 게이트·납작 억제 **회귀 없음**.  
4. push 안 함 · allowlist만 커밋(amend 금지 권장 · 새 커밋).

---

## 5. Cursor 붙여넣기

```
[티켓 114 · 112 Phase 1a 보완 · 로컬만]

기준 커밋: f63924a (이미 로컬). push·build:dothome 금지.

고칠 것 두 가지만 (주로 home-popup.css):
1) 광고 세로스택 미디어쿼리 640 → 768 (티켓 112 잠금).
2) 이벤트 히어로: lockup + 「Autumn Offer」를 가운데가 아니라 왼쪽 정렬.
   시안 pack6 event-hero / event-hero-brand = flex-start·같은 왼쪽 끝선.
   lockup 높이 과도하면 ~48–64px로 줄여 560 카드·체크박스 유지.

하지 말 것: set-b, 대상엔진, API/DB, a28, site-settings-store,
게이트/isAdminUser 변경, lockup PNG 교체 필수 아님, 다른 화면.

Allowlist: preview/home-ui/src/styles/home-popup.css
(+ 꼭 필요하면 mount.js만, 보고).
끝나면 파일·전/후·폭700 광고스택·이벤트 왼쪽 정렬 스모크 보고.
```
