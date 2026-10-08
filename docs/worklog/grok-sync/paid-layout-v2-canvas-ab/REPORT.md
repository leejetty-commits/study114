# REPORT — paid-layout-v2

정적 디자인 시안 · 운영 아님 · 정책/가격 변경 없음 · paid layout v2 · 최종 승인/v1.0 아님

참조: `paid-storefront-shell-fit` (Shell 실측·채택) · `plans-ui-v5` (본문 크롬) · 소스 폴더는 수정하지 않음.

---

## 1) 왜 각 페이지를 바꿨는지

### 상품홈 `home.html` (신규)
- **역할 고정:** 노출상품·쪽지권의 **안내 + 진입 허브만**. 설득형 랜딩에 **시네마급 히어로 1개**(홈 전용).
- 구매 UI·기간 카드·적용 대상·긴 이용 매뉴얼은 홈에 두지 않음.
- 진입은 **카드 2장만** (노출상품 / 쪽지권). **이용중 내역은 텍스트 링크** (3번째 카드·프라이머리 버튼 금지).
- 짧은 이용법(2–4 bullets) · 무료/유료 한 블록 · FAQ/문의 CTA만 유지해 LEAN 홈 유지.

### 노출상품 상세 `positions.html`
- shell-fit의 큰 `page-hero`/시네마 중복을 제거하고 **컴팩트 sub-hero**(eyebrow + 제목 + 1줄 + chips).
- 본문 스타 = **Prime / Pick / 배지 / 적용 대상** 선택 UI (v5·shell-fit 텍스처 유지).
- **주문 요약·구매 CTA는 우측 레일**로 이동 → 본문 선택 UI와 경쟁하지 않게.
- 동일 Type B Shell(좌측 내비 + ivory body + rail).

### 쪽지권 상세 `access.html`
- 노출상품과 **같은 상세 스켈레톤**: 컴팩트 인트로 → 횟수 선택 → 레일 요약/도움말.
- 홈 허브 역할과 겹치지 않음 (안내 장문·시네마 없음).

---

## 2) 홈에서 제거한 요소 (vs 상세/구 스토어프론트 얼굴)

| 제거·비배치 | 이유 |
|---|---|
| Full Prime / Pick 기간 카드·선택 UI | 상세 전용 |
| 홍보 배지 선택 그리드 | 상세 전용 |
| 적용 대상 / 지역·프로필 구매 폼 | 상세 전용 |
| 주문 요약·구매하기 CTA | 상세(레일) 전용 |
| 예약대기·occupancy 보드 | 상세/프로토 전용 |
| Pick 미리보기 그리드 | 상세 전용 |
| 긴 환불·이용 매뉴얼 본문 | 상세 accordion / 레일 요약 |
| 홈 얼굴에 시네마 배너 복제 (상세 쪽) | 상세는 sub-hero만 |
| 이용중을 3번째 카드·프라이머리 버튼으로 배치 | 텍스트 링크만 |

---

## 3) 본문에서 유지한 컴포넌트 (keep)

- Ivory paid skin (**center body만** · 좌측 내비 ivory 금지)
- Period cards (Prime / Pick 5열) · selected 보더
- Pick preview tiles + pagination 크롬
- Badge cards
- Apply-target / ticket profile 확인
- Ticket cards (1·5·10)
- Occupancy / waitlist 프로토 스트립 (상세 positions)
- Order summary 행·합계 룩 (레일로 이전)
- Primary CTA `#266BC4` · Pretendard · Surface+1px Line+r12
- Type B ops Shell 프레임 (GNB + 좌측 내비 + body + rail)

---

## 4) Shell 채택 수치 (live-adopted · shell-fit 동일)

| 항목 | px |
|---|---:|
| shell / `.home-body` | **1280** |
| pad L/R | **32** |
| left nav | **160** |
| nav → body gap | **24** |
| body track | **800** (`1fr`) |
| body → rail gap | **8** |
| right rail | **224** |
| 공식 | `32+160+24+800+8+224+32=1280` |

좌측 내비: 상품 안내 / 노출상품 / 쪽지권 active. ops surface 유지.

---

## 5) 시각 위계

- 가장 큰 히어로 = **홈만**
- 상세 = 구매 선택이 배너보다 먼저 읽힘
- 홈 = 설득 허브 · 상세 = 선택/구매

---

## 6) 한계

- 정적 시안. 실결제/DB/권한/라우트 변경 없음.
- 정책·가격·기간·상품명 카피는 v5/shell-fit 재사용 · 법적 카피 창작 없음.
- Stage complete / v1.0 / 최종 승인 선언 없음.

## 7) 산출물

- `home.html` · `positions.html` · `access.html` · `styles.css` · `app.js` · `fonts/` · `index.html`
- `shots/*-1440.png` · `shots/*-390.png`
- `REPORT.md` · `/workspace/study114-ds/paid-layout-v2.zip` (+ `.sha256`)

---

## 8) canvas-ab 갱신 (2026-09-18)

배경 스코프 A/B + 홈 full-bleed 시네마 실험. **정책/가격/IA·레일 역할·푸터·Shell 칼럼 해체 없음.**

- **A:** 웜 아이보리 = 센터 body 안쪽 패널 (v2 baseline)
- **B (채택):** 웜 캔버스 = left-nav 칼럼 + center body · 내비는 화이트 카드 · **레일·푸터 화이트** · 홈 시네마는 Shell 전폭 · 상세는 시네마 없음
- 상세 판단·샷 목록: `CANVAS-AB.md`
- Zip: `/workspace/study114-ds/paid-layout-v2-canvas-ab.zip` (v2.zip baseline 유지)
