# CANVAS-AB — 유료 섹션 배경 스코프 + 홈 full-bleed 시네마

정적 디자인 시안 · 운영 아님 · 정책/가격 변경 없음 · paid layout v2 canvas-ab · 최종 승인/v1.0 아님

정책·가격·IA 변경 없음. 우측 레일 콘텐츠 역할·푸터 유지. Shell 칼럼(1280 / nav160 / gap24 / body800 / gap8 / rail224 / pad32) 해체 없음.

---

## 1) 찬반 판단 (B 추천)

| | A (현재) | B (제안) |
|---|---|---|
| 웜 아이보리 | 센터 body **안쪽 패널**만 | **nav + body** 영역 캔버스 |
| 좌측 내비 | 화이트 카드가 사이트 회색 위에 | 화이트 카드가 **웜 캔버스 위** |
| 우측 레일 | 화이트 (유지) | 화이트 (유지·미터치) |
| 푸터 | 기존 (유지) | 기존 (유지·미터치) |
| 홈 시네마 | body 칼럼 안 (박스감) | **Shell 전체 폭** full-bleed 후 칼럼 재개 |
| 상세 | 시네마 없음 | 시네마 없음 (동일) |

**권장: B.** 사이트 전역은 화이트 유지하면서, 유료 작업 영역만 “한 장의 캔버스”로 묶어 박스-인-박스(웜 패널 안에 또 화이트 카드)를 줄인다. 레일·푸터는 의도적으로 화이트로 남겨 ops 대비를 지킨다.

---

## 2) 장점

- **작업면 일체감:** nav+body가 같은 웜 바탕 → 유료 섹션이 “한 구역”으로 읽힘.
- **내비 대비:** 화이트 내비 카드가 웜 위에 앉아 계층이 분명해짐.
- **중첩 크롬 감소:** body 바깥의 큰 아이보리 래퍼(테두리·라운드) 제거 → 카드가 주인공.
- **홈 시네마 설득력:** Shell 폭 full-bleed로 허브 얼굴이 강해지고, 상세와 역할 분리(홈=시네마 / 상세=구매)가 더 선명.
- **레일·푸터 안전:** 주문 요약·도움말·푸터는 화이트 유지 → 구매 UI·사이트 클로저가 웜 홍수에 묻히지 않음.

---

## 3) 리스크

- **웜 면적 확대:** 너무 진한 오렌지/샌드면 “유료 홍수”로 읽힐 수 있음 → `#F6F1E8`급 soft ivory 고정.
- **레일과의 단절:** nav+body만 웜이면 레일이 “다른 페이지”처럼 보일 수 있음 → 갭 8px·동일 Shell 리듬으로 완화 (레일 역할은 유지가 우선).
- **시네마 아래 칼럼 재개:** full-bleed 후 Type B 복귀가 어색하면 시네마 하단 마진·캔버스 라운드로 호흡 조절.
- **모바일:** 칼럼 스택 시 캔버스가 전폭이 됨 — 레일도 동일 스택이므로 허용. 시네마는 홈만.

---

## 4) 줄일 크롬 / 키울 카드

**줄일 것**
- body를 감싸던 큰 웜 패널(1px 라인 + r16 + overflow hidden)
- 상세 sub-hero의 또 다른 아이보리-온-아이보리 중첩 (B에서는 화이트 카드로)

**키울 것**
- Surface 화이트 카드(진입 2장 · panel · howto/faq): 1px Line + r12, 웜 캔버스 위에서 면적·대비 확보
- 홈 full-bleed 시네마 (홈 전용)
- 상세 구매 UI(기간/횟수 카드) 가독성

---

## 5) A vs B 추천

**B 채택 (chosen direction).**  
홈 = B 캔버스 + full Shell 시네마 + 허브 lean.  
상세(positions/access) = B 캔버스 + 컴팩트 인트로 + 구매 UI · **시네마 없음**.  
A는 baseline 비교판으로 `compare-a-*.html`에 보존.

---

## 6) 샷 경로

| 파일 | 내용 |
|---|---|
| `shots/compare-a-home-1440.png` | A 홈 baseline |
| `shots/compare-b-home-1440.png` | B 홈 · full-bleed 시네마 |
| `shots/compare-a-positions-1440.png` | A 상세 baseline |
| `shots/compare-b-positions-1440.png` | B 상세 · 웜 캔버스 |
| `shots/home-b-fullbleed-1440.png` | 최종 B 홈 |
| `shots/positions-b-1440.png` | 최종 B 노출상품 |
| `shots/COMPARE-home-A-B-1440.png` | 홈 A\|B 합성 |
| `shots/COMPARE-positions-A-B-1440.png` | 상세 A\|B 합성 |

페이지: `compare-a-home.html` · `compare-b-home.html` · `compare-a-positions.html` · `compare-b-positions.html` · `compare-b-access.html`(옵션) · `home.html` · `positions.html` · `access.html`
