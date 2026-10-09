# 193 · Cursor — 마이페이지 좌측메뉴 줄간 좁히기 · 항목 사이 얇은 실선

- 작성: 2026-09-29 · 우동공과2
- 근거: 종현 잠금 — 전 역할 마이페이지 좌측 메뉴 줄간 타이트 + 항목 사이 얇은 실선으로 구분
- 선행: **192 수락 후** 착수 (지금은 지시문만)
- push · build:dothome · Notion · commit **금지**

## Must

1. 학생·과외쌤·공부방(·공통 셸) 마이페이지 **좌측 `.mypage-nav`** 항목 간 여백을 지금보다 **더 타이트**하게.
2. 메뉴 항목 **사이마다 얇은 실선**(1px급, 연한 회색)으로 구분. 마지막 항목 아래 불필요 굵은 선 금지.
3. 활성/호버 스타일은 유지하되, 실선·줄간이 안 깨지게.
4. 모바일 가로 스크롤 내비도 **같은 구분 의도** 유지(깨지면 PC 우선·모바일은 최소 회귀만).

## Allowlist

- `preview/home-ui/src/styles/mypage-ops.css`
- `preview/home-ui/src/styles/home-member-flows.css`
- 필요 최소: `preview/home-ui/src/mypage/shell.js` (마크업이 꼭 필요할 때만)
- 학생 전용 덮어쓰기 있으면 `student-mypage-stage5b.css` 등 **좌측내비에 영향 있는 CSS만**

## Forbid

- 메뉴 항목 추가·삭제·라우트 변경 · 라벨 개명
- 192 공개블록 · 189 대학 · 동네인사
- commit / push / `build:dothome`

## 스모크

1. 세 역할 마이페이지 좌측: 줄간 더 촘촘 + 항목 사이 얇은 실선
2. 「내 등록」 활성 표시 유지
3. 메뉴 클릭 이동 정상

## 커밋 예 (수락·배포 지시 후)

`style(mypage): tighten left nav spacing and thin dividers`
로컬만.
