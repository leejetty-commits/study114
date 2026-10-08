# 198. 178-1 찾기·등록 레일 인페이지 — 슬롯 잠금 (2026-10-06)

## 근거
- 잠금 정본: `178-planner-decisions-locked-2026-09-27.md` #1 = **B** (가능하면 그 화면 유지·인페이지, 메인 이탈 줄임).
- 2026-10-06 종현(t1415~t1416): 이탈이 어색한 화면만 대상 → **찾기·등록**. 그 화면의 남은 C(HOT·게시판에서 보기·이용안내 자세히)를 인페이지로 진행.
- 교차점검 PARTIAL(HEAD `45a14e1`): 1차 A는 이미 있음. 남는 C만 수정.

## 대상 화면 (이탈 금지)
- 찾기: `search_right_rail` (search-ui)
- 등록: `register_right_rail` (tutor-ui · study-room-ui · mypage registrations)

## 슬롯 표 (확정)

| 클릭 | 찾기 | 등록(entry) | 목표 |
| :--- | :--- | :--- | :--- |
| 방 제목·더보기·베스트 | A(이미) | 미렌더 | 유지 |
| 가이드 peek | A(이미) | A(이미) | 유지 |
| 정보 제목·더보기 | A(이미) | A(이미) | 유지 |
| HOT 카드·HOT CTA | C → **A** | 미렌더 | 고민 팝업(방·베스트와 동일 계열) |
| 팝업 「게시판에서 보기」(방·베스트·정보) | C → **A 우선** | C → **A 우선** | 팝업 안에서 이어 보기. 전체 커뮤니티·글쓰기까지 꼭 필요할 때만 새 탭 예외(보고) |
| 「이용안내에서 자세히」 | C → **A** | C → **A** | peek 확장 또는 이용안내 인페이지 오버레이(178-5 계열 재사용) |
| 팝업 「로그인」 | E | E | 변경 없음(인증 URL) |

## 범위 밖
- home-ui 홈 레일 자체, 상세 레일(178-6), 지도·현재위치, 홍보2·3 잔여, 사이트오류-5.
- commit / push / build:dothome / Notion — 종현 「배포」 전 금지.

## 티켓
- 사이트오류-32 (아래 Cursor 지시문).

## 상태 (2026-10-06)
- **사이트오류-32 ACCEPT** (교차검증=Cursor 보고 일치). 로컬만 HEAD `45a14e1`, 미커밋·미배포.
- 구현: HOT·HOT CTA·게시판에서 보기·이용안내 자세히 → 인페이지(A). 홈 hash·상세 blank·로그인 E 유지. entry에 HOT·방·베스트 미렌더.
- 검사: verify-rail-concern-banners 255/0, verify-rail-info-banners 268/0.
- 변경 8파일: right-rail.js, rail-concern-popup.js, info-rail.js, rail-popup.js, home-right-rail.css, search-ui/layout.js, verify-rail-concern-banners.mjs, verify-rail-info-banners.mjs.
- 배포: 종현 「배포」 대기. 라이브 실클릭은 종현 몫.

- **배포 완료** 2026-10-06: commit `5ad14ee`, Deploy to dothome success. 라이브 확인은 종현.
