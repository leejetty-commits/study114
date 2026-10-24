# 2026-10-25 · 296 홈 픽 빈칸 공통 + 묶음 10 통일

- 기준: main `f425de83`
- 브랜치: `cursor/296-pick-home-vacant-and-set-size-20261025`
- 주인 확정(2026-10-25): 홈 픽 0장 → 공부방·과외쌤·학생·비회원 모두 빈 카드 1장. 1장 이상 → 한 묶음 10장 · 페이지 번호 · 15분 순환.
- 10/16「학생·비회원 빈 광고칸 줄임」은 픽 빈칸에 한해 폐기. 프라임 빈칸은 기존 동작 유지.

## 변경
- `exposure-rules.js` `homePickZeroPromoCount` → 항상 1. `|| 5` 대체값 → `PICK_SET_SIZE_FALLBACK`.
- `exposure-render.js` 주석 정리.
- `search-tier-render.js` · `search-find-surface.js`: 공부방 홈 「우리동네 공부방」 0장(조회 끝)일 때 프라임·픽 빈칸 줄을 그림(과외쌤 홈과 동일).
- 서버 `PaidCatalog::PICK_SET_SIZE = 10` → 카탈로그 `pick_set_size`. 관리자 화면 5 → 10, 업체 대시보드 상수 참조.
- 프론트 `catalog-store.js`가 서버 값 보관, `runtime-config.js` `PICK_SET_SIZE_FALLBACK = 10` 하나, 손님 덮어쓰기 제거. 죽은 `PICK_PAGE_SIZE = 5` 삭제.
- 문서: `docs/ssot/11-main-exposure-and-compare.md` §5-4b · 변경이력, `docs/internal/29-exposure-gnb-decisions.md`.

## 범위 밖
- 카드 정보 칸 수(13/15), `pick_page_size`, `$pickCap`(재고 상한), 운영 DB 변경 없음.
