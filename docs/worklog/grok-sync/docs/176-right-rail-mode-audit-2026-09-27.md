# 176 — 우측 배너 레일 모드별 읽기/쓰기·라우팅 감사 (코드)

일자: 2026-09-27  
정본: Quiet Rails `preview/home-ui/src/right-rail.js` (+ `right-rail-store.js`)  
구 `promo-sidebar.js` = deprecated(빈 렌더) · 재연결 금지  
히어로 배너(`home-marketing-banner.js`)와 **다름** (175 대상)

정책 힌트(레포): `docs/ssot/09-main-screen-roles.md` §14-b · `docs/internal/23-board-menu-boundary-audit.md` §H

## 한줄

레일 = **읽기 표면**(진입·요약·CTA). 게시 쓰기는 레일에서 안 함 → `#/community` 등 도착 후 ACL.

## 슬롯

`home_right_rail` · `search_right_rail` · `detail_right_rail` · `register_right_rail` · `plans_right_rail` · `support_right_rail`

3층: 현장(HOT) · 안내(CTA) · 영상(현재 videoUrl 빈 경우 많음)

## 모드 × 홈 레일 (요약)

| 모드 | 현장 | 안내 CTA | R/W |
| :--- | :--- | :--- | :--- |
| guest | intro_only · 제목 숨김 소개 | promo/study-room · guide/saved-contact | RO |
| parent | concern-parent HOT | 동계열 | RO |
| study_room | concern-director + parent 열람 | 등록가이드 · community/director | RO |
| tutor | concern-tutor + parent 열람 | 프로필 · community/tutor | RO |

검색/등록 SPA: `linkMode:absolute` → **home-ui로 이탈**(의도 가능).

## Top issues → 최소 수정 후보

| ID | 이슈 | 최소 방향 | 175와 |
| :--- | :--- | :--- | :--- |
| RR1 | **plans 레일 navRole 미전달** + getNavRole(plans)=guest → 공급자인데 게스트 CTA | `plans/shell.js`에 mapped navRole 전달 | 맞물림·**별 PR 권장**(175 allowlist 밖) |
| RR2 | JS seed vs SQL `guest_filter` 드리프트 | 스키마·시드 동기 | 별 |
| RR3 | live층이 concern만 → notice/safe-guide seed 무시 | SSOT 확인 후 필터 or 카피 | 별 |
| RR4 | detail `guestFilter: floating` boolean 오용 | 문자열/navRole | 별 |
| RR5 | parent @ register_right_rail에 director CTA 잔존 가능 | CTA 역할별 | 별 |

## 금지(오버스코프)

커뮤니티 compose ACL 재설계 · promo-sidebar 부활 · 마케팅 배너와 레일 통합 · 배포

## 실사이트 스모크 (이어감)

- [ ] 공부방 · `/#/plans` 우측 레일 CTA가 게스트용인지
- [ ] 과외쌤 · 동일
- [ ] 게스트·학생 홈 레일: 소개만 / HOT 노출 · 클릭 후 로그인·역할 벽
- [ ] 검색 레일 클릭 → home-ui 이동이 자연스러운지


## 실사이트 스모크 (2026-09-27) — RR1 확인

- 공부방·과외쌤 `/#/plans` Quiet Rails: **게스트 CTA**(찜·비교·쪽지 → guide/saved-contact, 안전가이드 → guide/safety, 소개 → promo/study-room). RR1 **확정**.
- 과외쌤도 promo/study-room (T4/S6과 동일 계열).
- 게스트 홈 레일: concern intro_only + promo/saved-contact — 정책과 대체로 일치.
- 스크린: room `.../6bb8e82a...png` · tutor `.../121bd5a7...png`

### Cursor 후보 177 (RR1만 · 175와 분리)

Allowlist 초안: `preview/home-ui/src/plans/shell.js` (+ rail에 navRole 넘기는 기존 시그니처만).  
금지: 배너 카피 전면 교체, community ACL, 175 파일 섞기, 배포.  
수락: study_room/tutor @ plans 레일 ≠ 찜·안전 게스트 CTA; guest @ plans는 기존 허브 유지.
