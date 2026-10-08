# Mobile GNB A/B/C Compare Pack

> UDX Stage 5B · **비교 팩만** · Stage 5B HOLD · 최종 GNB/IA/디자인 매뉴얼 v1.0 **미선언**  
> Primary `#266BC4` · 검증 폭 **430 · 390 · 360**만  
> 작성: 2026-09-10 KST

## 목적
현재 모바일 GNB **FAIL**(h-scroll/clip) 대체 방향 A/B/C를 정적 비교한다.  
배지 PASS · Type B body PASS · Prime/Pick 샘플 · Basic free notice · Notion/ops/GitHub/DB/API/Cursor 구현은 **범위 밖**.

## Baseline FAIL
- `GATE-AUDIT` RSP4 GNB clipping (`needsHScroll`, 예: 390 scrollW 436 > clientW 279)
- plans badge multi `scroll_disclosure` → **mobileGnb FAIL**
- 참조 복사: `shots/baseline-fail/` (원본 삭제 없음)

## Variants
| ID | 방향 | 폴더 |
|----|------|------|
| A | Logo + hamburger drawer | `a/` |
| B | 소수 코어 + 더보기 (**비교 가정 IA**, 최종 아님) | `b/` |
| C | Top logo + bottom nav (상세 sticky CTA 충돌 **위험 노출**) | `c/` |

## 열기
- 비교 인덱스: `index.html`
- 상태: 각 페이지 `?state=` (state-bar로 전환)

## 산출물
- `computed-mobile-gnb-abc.json` — variant×width×state 측정
- `MOBILE-GNB-ABC-REPORT.md` — 장단·위험·랭크(의견, 잠금 아님)
- `MOBILE-GNB-ABC-SELF-AUDIT.md`
- `KEEP-CHANGE-DELETE-FORBIDDEN.md` · `CHANGED.md`
- `shots/*.png` · Playwright true viewport
- ZIP + `.sha256` (팩 외부)

## 규칙 요약
- no h-scroll / no clip / current visible / touch ≥44×44 / no body·fixed 비의도 overlap
- UDX 색·타입·간격·radius · **이모지 아이콘 금지** · 999px 텍스트 필 금지 · 무거운 shadow/gradient 금지
- A/B/C **동일 데모 본문**으로 headerHeight·firstContentY 비교
- 새 header-height 토큰을 정책으로 잠그지 않음 (`--demo-topbar-h`는 관찰용)

## 종료 상태
**모바일 GNB 선택 미정 · Stage 5B HOLD · v1.0 미선언 · STOP**
