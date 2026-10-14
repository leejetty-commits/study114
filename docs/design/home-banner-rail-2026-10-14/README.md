# 홈 배너·여백·베스트 빨강 + 레일 노출 (2026-10-14)

- 요청: 종현 · 작성: 우동공과2 · 기준 `origin/main` @ 4446404
- `218-home-banner-gap-best-red-work-order.md` — Cursor 작업지시서(218-1 홍보 화면 3칸 유지, 218-2/3 상단 여백 8px 통일, 218-4 이달의 베스트 빨강 #BE123C, 218-5 003 매뉴얼 반영 diff)
- `219-rail-exposure-briefing.md` — 레일 화면×모드 현황표, 문서 규칙 인용, 잠긴 정책과 어긋난 오류, 추천안(미확정)
- `png/` — 로컬 렌더 캡처. `before-*` = 현재 코드, `after-*` = 218 diff를 임시 적용해 찍은 것(커밋 안 함). 파일명 = 세션역할-화면-폭.
- 측정: 로컬 vite + playwright chromium, `/api/auth/me.php` 역할 흉내. 라이브(https://study114.dothome.co.kr) 렌더 아님.
- 코드 변경·배포 없음.
- 2026-10-14 갱신(종현 t1581): 218-1 조건부(쉬우면 진행·어려우면 취소), 비회원 3칸 아래 8px 승인, 베스트 읽기 팝업 빨강 승인(634-637 추가), 고민방 3칸 홈 전용 여부 보류, 219 추천안 삭제.
- 2026-10-14 갱신2(종현 t1582): 218-1 확정·진행, 218-6 홈 HOT 팝업, 218-7 베스트 0건 빈 팝업, 218-8 「원장」 문구 제거 추가. 198 문서의 「홈 hash 유지」를 홈 HOT에 한해 대체.
- 2026-10-14 갱신3(종현 t1583): 218-8 나머지 「원장」 7곳은 수정 안 함(변경 시 불합격).
- `220-cursor-directive-A.md` — Cursor 작업지시 A(218-1·2·3만, 브랜치 cursor/home-a-banner-gap-20261014, main merge 금지, 작업 기록은 main)
- `221-home-a-review.md` — 작업 A 검수(배포 후 확인) PASS. main 원본은 docs/worklog/2026/10/2026-10-14-home-a-review.md
- `222-cursor-directive-B.md` — Cursor 작업지시 B(218-4 베스트 빨강 띠·팝업 + 218-7 0건 빈 팝업, 브랜치 cursor/home-b-best-red-20261014, main merge 금지). 측정 스크립트 `222-measure-B.py`
