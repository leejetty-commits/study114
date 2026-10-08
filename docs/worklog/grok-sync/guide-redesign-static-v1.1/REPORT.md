# 이용안내 리디자인 v1.1 · REPORT

성격: 정적 디자인 시안 · 운영 아님 · v1.1 카피 확정 패키지 · 최종 승인/v1.0 아님  
근거: `live-guide-inventory-2026-09-18/` · `guide-ia-proposal-v1/REDESIGN-BRIEF-2026-09-18.md`  
비주얼: `community-support-visual-refresh-v2` (Surface · 1px · r12 · Pretendard · Primary `#266BC4` · 브래킷 없음)

---

## Kept (유지)

- 이용안내 ≠ 고객센터 역할 분리
- 하위 메뉴 5: 이용안내 홈 / 찾기·첫 이용 / 등록·공개 / **비교·찜·쪽지** / 안전이용
- 안전이용(가이드) + CS 안전과외·신고·정책 **병행** (병합·삭제 없음)
- 쪽지 = 회원 간 · 운영문의 = 운영자 (혼용 금지)
- GNB 이름·구조 변경 없음
- Type B 좌메뉴 셸
- 친절 배너 + 짧은 H1 + 초보 본문

## Cut (삭제·축소)

| 라이브/기존 | 처리 |
|-------------|------|
| 허브 CS 타일 벽(공지·FAQ·약관·자료·문의 격자) | **삭제** → `고객센터` 텍스트 링크 1 |
| 허브「빠른 흐름 요약」동어반복 블록 | **삭제** |
| 허브·서브 우레일 가이드 카드 복제 | **삭제** (우레일 omit · layout-shell--b2) |
| 서브 플로우 차트 + 전체 스텝 이중 전개 | **차트 삭제**, 스텝 한 벌만 |
| H1 `이용안내 / ○○` 이중 표기 | **삭제** → H1=페이지명, Eyebrow=`이용안내` |
| 비교·찜·쪽지 과밀(기능카드+표+차트+장문 FAQ) | **3칩 + 스텝 1벌 + 짧은 tip** |
| 레거시 `#/policy/reporting` CTA 노출 | **정본** `#/support/policies/reporting`만 |
| 허브 전면 운영문의 CTA | **제거** → 안전이용·CS 경로에서 강조 |

## Changed (표현만)

- 홈 = 상황 카드 3 + 보조 링크 2 + 슬림 찾기 CTA
- 등록 = 공통 5스텝 + 공부방/과외쌤 탭 체크리스트
- 비교 페이지 라벨 순서 **비교·찜·쪽지** 고정 (메뉴/H1/카드/CTA)
- 라우트 정본: `start` / `register` / `compare` / `safe` (+ alias)
- 모바일: 좌메뉴 → 상단 select (가로 스크롤 메뉴 금지)

## Not invented

- 신규 정책·기능·GNB 항목 추가 없음
- CS 본문(FAQ 벽·정책 dump)을 가이드에 복제하지 않음 — 필요 지점 링크만

## Deliverables

- HTML 5: `01-hub` … `05-safe` (+ CSS · assets)
- Shots @1440 ×5 + @390 hub+4subs
- Docs: `COPY.md` · `CHANGELOG-v1.1.md` · `ROUTES.md` · `REPORT.md` · `index.html`
- Zip + sha256

## v1.1 note

카피 픽 반영(홈 문안 A · 등록 유료 선택 명확화 · 쪽지≠운영문의 · 안전이용 중개 뉘앙스 회피).  
상세: `CHANGELOG-v1.1.md`.


## Illustrations (2026-09-18)

친절 SVG 일러스트 추가 — 히어로 5 · 상황 타일 3 · 스텝 아이콘 · 안전 Do/Don't 아이콘.  
상세: `CHANGELOG-images.md`. IA/카피/라우트/락 변경 없음.
