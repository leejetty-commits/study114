# CHANGELOG · v1 → v2

## Kept (채택 유지)

- 커뮤니티 허브 선행 · 4보드 축 (공부방 / 과외쌤 / 학생·학부모 / 해결후기)
- 게스트 로그인 벽 + 블러 고스트 프리뷰 + `가상` 라벨
- 해결후기 맥락 카드 (리스트만 나열하지 않음)
- 고객센터 기하 히어로 (다크 포토 슬랩 거부)
- FAQ/문의/정책/자료 퀵링크 타일
- Primary `#266BC4` · tokens · Pretendard · Type B 셸
- GNB 소비자 헤더 라벨/순서 유지
- disclaimer · `가상` 칩

## Removed (제거)

- **모든 카드 코너 브라켓 / L-chevron** (`frame-card::before/::after` 및 동일 패턴)
- 카드마다 반복되는 큰 코너 모티프
- v1의 `visual-rich.css` 브라켓 의존 문법
- v2 범위 밖 보드: `c03` 피드, `c04` 상세, `s03` 공지 단독, `s04` 문의 게스트, `s05`/`s06` 분리 페이지
- BEFORE 라이브 썸네일 갤러리 블록 (v2 index는 6보드 썸네일만)

## New decoration grammar (기본 카드 문법)

**허용 (기본값)**

| 요소 | 용도 |
|------|------|
| 좌측 3–4px 엣지 액센트 | 카드 식별 · 역할 색 |
| eyebrow / section chip | 섹션 라벨 |
| soft halo (아이콘 뒤) | 밀도 · 초점 |
| icon tile 48–64 | 퀵링크·보드 엔트리 |
| section title thin underline | 제목 계층 |
| thin divider / stripe band | 히어로·헤더 구간만 |
| weak blob / linear bg | **히어로만** |

**제품 느낌** = Surface + 1px Line + radius 12 + spacing + icon tile + soft accent  
장식이 타이틀 / 한 줄 설명 / CTA / 섹션 구조보다 먼저 읽히면 실패.

## Adopt vs Reject (장식 목록)

### Adopt

- 좌측 엣지 바
- section chip + underline
- icon tile + soft halo
- 히어로 soft grid / 약한 blob
- support geometric hero (원·슬래시)
- ghost blur + 가상 라벨
- notice/FAQ 좌측 액센트

### Reject

- 카드 코너 브라켓 / 쉐브론 L
- 뉴모피즘 · 헤비 글래스 · 강한 드롭섀도
- 포털 광고판형 밀도
- 드리블 장식샷 · 큰 컬러 플러드
- 카드마다 스트라이프/블롭 반복

## Board-by-board notes

| 보드 | v2 노트 |
|------|---------|
| **c01-hub** | Type B2(nav+body). 4카드 = 엣지+할로+아이콘. 브라켓 없음. |
| **c02-board-guest** | Type B. 로그인 CTA 명확 + “홈으로” 탈출. 고스트는 blur·dashed·가상. |
| **c05-solved** | 문제→결과 2칸 플로우. 성공 과장 카피 없음. 좌측 성공 액센트. |
| **s01-home** | 기하 히어로 + 6 퀵타일 + 공지 액센트 리스트. help-hub. |
| **s02-faq** | 검색·칩·아코디언(+JS). 열린 항목에 좌측 프라이머리 바. |
| **s05-policies-library** | 약관·정책 그리드 + 자료실 PDF를 **한 보드**. 캐비닛 과밀 회피. |

## Intensity

- Support = help hub (캠페인 아님)
- Community = field/portal (광고판 아님)
- 기억점은 계층·여백·아이콘·얇은 선 — 큰 색면 아님
