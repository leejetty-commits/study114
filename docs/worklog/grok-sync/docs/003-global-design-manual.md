# 003 · 전역 디자인 통일 매뉴얼 (등록)

- 작성·등록: 2026-09-23 (KST)
- 상태: **작업 기준 등록** (원본 팩은 Stage 5B / UDX 계열 · 일부는 초안·최종 승인 아님 표기 유지)
- 역할: 우동공과2가 사이트 통일감을 잡을 때 **기본 정본**으로 사용

---

## 1. 정본 위치 (로컬)

| 우선 | 경로 | 무엇을 보는가 |
|-----:|------|----------------|
| 1 | `../stage5b-design-standard-v01/` | **전역 디자인 표준 팩** — 토큰·보드·예외·레이아웃 축 |
| 1a | `../stage5b-design-standard-v01/TOKENS.md` + `tokens.css` | Primary·타이포·간격·radius·역할·Paid |
| 1b | `../stage5b-design-standard-v01/EXCEPTIONS.md` | 허용/금지 예외 (pill 등) |
| 1c | `../stage5b-design-standard-v01/ssot/` | UDX-STD-001 발췌 (버튼 등) |
| 1d | `../stage5b-design-standard-v01/REPORT.md` | 보드 범위·캡처·요약 |
| 2 | `../udx-05-design-bot-protocol/UDX-05.md` | 제작·검수·제출 규약 (KEEP/CHANGE/DELETE/FORBIDDEN) |
| 3 | `../guide-community-cs-global-audit-2026-09-19.md` | 이용안내·커뮤니티·CS × 전역 기준 사실판정 |
| 참고 | Notion UDX-00 / UDX-10 / UDX-20 / UDX-STD-001 | 노션 정본(쿼터 이슈 시 로컬 팩을 실무 정본으로 사용) |

ZIP: `../stage5b-design-standard-v01.zip` · `../udx-05-design-bot-protocol.zip`

충돌 시 우선순위(UDX-05와 동일 취지):

1. 종현 님 **최신 명시 승인**
2. 본 docs 최신 문서 (002·003·후속)
3. Stage 5B 표준 팩 / UDX-STD 발췌
4. 과거 시안 ZIP·폐기안 (증거 재사용 금지)

---

## 2. 한눈에 쓰는 잠금 요약 (5A→5B)

작업할 때마다 원문 팩을 열되, 일상 검수는 아래를 기본으로 한다.

| 항목 | 규칙 |
|------|------|
| Primary | `#266BC4` — 페이지 대표 CTA만 Primary 채움 |
| Ink / Muted / Bg / Surface / Line | `#1C1917` / `#4B5563` / `#F7F8FA` / `#FFF` / `#E5E7EB` |
| 타이포 | Pretendard · FS **12 / 14 / 16 / 18 / 22 / 28 / 36** (중간값 금지 원칙) |
| 카드 / 컨트롤 radius | card 12 · ctl 8 |
| 뱃지 | **4px** rounded rect · **텍스트 999 pill 금지** |
| Role Tab / Filter chip | radius **6** · 텍스트 pill 금지 |
| 카드 「상세 보기」 | Secondary(흰+primary 글자/보더) · 데스크톱 h40 / 모바일 h44 |
| 검색 Primary | min-width ≥72 · h40(데스크톱) / h44(모바일) |
| 역할 색 | soft·탭·아이콘·선택선만 (CTA 채움에 역할색 금지) |
| Paid 맥락 | 아이보리 스킨 가능 · CTA는 여전히 Primary |
| 그림자 | sticky용 약한 그림자만 (광고판식 과다 그림자 지양) |

상세 수치·변수명: `TOKENS.md` / `tokens.css` / `ssot/UDX-STD-001-Button.md`.

---

## 3. 이례 허용 — 홍보·랜딩 (2026-09-23 확정)

**전역 매뉴얼이 기본**이다. 다만 아래는 **의도적으로 튀게** 갈 수 있다.

| 허용 | 조건 |
|------|------|
| 홍보 페이지 · 프로모 랜딩 · 캠페인 히어로 | 전역보다 강한 비주얼·다른 액센트·특별 레이아웃 가능 |
| 홈 팝업(공지/이벤트/광고) 등 단기 노출물 | 카테고리별 bright accent 등 **확정 시안 규칙** 우선 |

**그래도 유지할 것 (이례여도):**

- 로고 lockup 일체(연필+「우동공과」 합본) — 분리·orphan 마크 금지
- 사이트 셸/공통 GNB·푸터와의 **연결감** (완전 다른 사이트로 보이지 않게)
- 가독성·터치 최소 높이·접근성 하한
- Primary CTA 남용으로 전역 CTA 의미가 무너지지 않게

**이례 절차:**

1. “홍보/캠페인이라 전역에서 뺀다”를 시안·메모에 **명시**
2. 사용자 **확정** 후 적용 (002 흐름)
3. 확정본은 `docs/` 또는 해당 pack NOTES에 “전역 예외”로 한 줄 남김

일반 검색·마이페이지·커뮤니티·고객센터·이용안내 등 **일상 제품 UI**에는 이 예외를 기본 적용하지 않는다.

---

## 4. 우동공과2 사용법

- 새 페이지·컴포넌트 시안: **003 + Stage 5B 팩**으로 맞춤 → 어긋나면 지적
- Cursor 구현 핸드오프: 토큰·수치·금지(pill 등)를 이 문서·팩에서 인용
- 홍보물: 003 §3 예외 + 별도 확정 시안
- 노션 쿼터 부족 시: 이 로컬 등록본을 실무 기준으로 사용하고, 노션 반영은 요청 시에만

관련: [002-design-role-consistency.md](002-design-role-consistency.md)

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-09-23 | Stage 5B·UDX-05를 docs에 전역 매뉴얼로 등록 · 홍보 페이지 이례 허용 추가 |
