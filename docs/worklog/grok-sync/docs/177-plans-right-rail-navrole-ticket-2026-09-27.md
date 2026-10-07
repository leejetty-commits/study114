# 177 — 유료상품 우측 레일에 역할 전달 (RR1) · Cursor 잠금

근거: `176-right-rail-mode-audit-2026-09-27.md` 실클릭 확정  
**175와 별 PR.** 배포 금지.

## 목표
`/#/plans` Quiet Rails가 공부방·과외쌤일 때 **게스트용 찜·안전 CTA**를 쓰지 않고, 공급자용 슬롯/카피를 쓴다.

## 솔루션(최소)
`preview/home-ui/src/plans/shell.js`에서 `renderPromoWithRightRail('plans_right_rail', …)` 호출 시 **매핑된 navRole**(study_room / tutor / guest / parent)을 넘긴다.  
`getNavRole()`이 plans에서 guest를 강제하는 것과 충돌하면, **레일 렌더에만** 실세션 역할을 넘기고 전역 getNavRole 동작은 175에서 다룰 것(이 티켓에서 state.js 대규모 수정 금지). 가설이 틀리면 조사 후 최소 경로로.

## Allowlist
- `preview/home-ui/src/plans/shell.js` (필수)
- 필요 시 `preview/home-ui/src/right-rail.js` 호출부 시그니처 확인용 **최소** (새 API 만들지 말 것)
- `state.js`는 **건드리기 전에** 175와 겹치면 멈추고 보고

## 금지
카피 전면 수정, promo CTA study-room→tutor 일반화(별도), guestFilter SQL, 배포, allowlist 밖

## 수락
- room/tutor @ `/#/plans` 우측: 찜·비교·쪽지 / 안전과외 가이드 **미노출**(또는 공급자 CTA로 교체된 seed)
- guest @ plans: 기존 비회원 허브 유지
- diff: plans/shell 중심, 파일 남용 없음
