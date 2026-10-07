# 177 · Cursor — 유료상품 우측 레일 역할 전달 (RR1) (로컬)

- 작성: 2026-09-28 KST · 우동공과2
- 정본: [177](177-plans-right-rail-navrole-ticket-2026-09-27.md) · 근거 [176](176-right-rail-mode-audit-2026-09-27.md) RR1
- 상태: **Cursor 구현 대기** · push · `build:dothome` **금지**
- 배치: 로컬 수락 **173 + 175 + 177** 후 「배포」
- 저장소: `leejetty-commits/study114` · `D:\work\study114`
- Notion: **쓰지 말 것**
- **175와 별 커밋.** state.js 대규모 수정 금지(겹치면 멈추고 보고)

---

## Must

`/#/plans` Quiet Rails가 공부방·과외쌤일 때 **게스트용** 찜·비교·쪽지 / 안전과외 가이드 CTA를 쓰지 않게 한다.

최소: `preview/home-ui/src/plans/shell.js`에서 `renderPromoWithRightRail('plans_right_rail', …)` 호출 시 **매핑된 navRole**(study_room / tutor / guest / parent)을 넘긴다.  
`getNavRole()`이 plans에서 guest를 강제해도, **레일 렌더에만** 실세션 역할을 넘기면 됨. 새 API 만들지 말 것.

용어: 공부방 · 과외쌤 · 학생 · 등록 · 베이직카드.

---

## Allowlist

- `preview/home-ui/src/plans/shell.js` (필수)
- 필요 시 `preview/home-ui/src/right-rail.js` 호출 시그니처 **최소**만
- `state.js` — 175와 겹치면 **손대지 말고 보고**

---

## 금지

카피 전면 수정, promo CTA study-room→tutor 일반화(별도), guestFilter SQL, 커뮤니티 ACL, promo-sidebar 부활, 배포, allowlist 밖

---

## 수락

1. 공부방·과외쌤 `/#/plans` 우측: 게스트용 찜·비교·쪽지 / 안전가이드 **미노출**(또는 공급자 CTA로 교체된 seed)
2. 게스트 `/#/plans`: 기존 비회원 허브 유지
3. diff: plans/shell 중심, 파일 남용 없음 · push 안 함

---

## 붙여넣기

```
티켓 177만(RR1). D:\work\study114 · git -c safe.directory=D:/work/study114
push·build:dothome·Notion 금지. 175와 별 커밋. state.js 대규모 수정 금지(겹치면 멈추고 보고).

Must:
/#/plans Quiet Rails에 실세션 navRole(study_room/tutor/guest/parent)을 넘겨,
공부방·과외쌤일 때 게스트용 찜·비교·쪽지 / 안전과외 가이드 CTA가 안 나오게.
최소: preview/home-ui/src/plans/shell.js 의 renderPromoWithRightRail('plans_right_rail', …)에 역할 전달.
필요 시 right-rail.js 시그니처 최소만. 새 API 금지.

Allowlist: plans/shell.js · (필요 시) right-rail.js 최소.
금지: 카피 전면, promo CTA 일반화, guestFilter SQL, 커뮤니티 ACL, 배포, allowlist 밖.

수락: room/tutor @ plans 우측 ≠ 게스트 찜·안전 CTA · guest @ plans 기존 유지. 로컬 커밋. 요점 보고.
정본: docs/177-plans-right-rail-navrole-ticket-2026-09-27.md · docs/177-plans-right-rail-navrole-cursor-ticket-2026-09-28.md
```
