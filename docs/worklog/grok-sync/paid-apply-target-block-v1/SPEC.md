# 「적용 대상」 블록 규격 — paid-apply-target-block-v1

작성: 2026-09-19 KST  
범위: **노출상품(positions) 상세의 「적용 대상」 섹션 카드만**  
성격: Cursor 이식용 수치 SSOT · IA/정책/가격/전역 토큰 변경 없음  
근거: IMPLEMENTATION-GUIDE B안 잠금 · 사용자 브리프(약한 칩 → 3열 등분 타일)

> BEFORE 문제: 작은 지역 칩이 좌정렬되고 우측에 빈 공간 · Prime/Pick 기간 카드 대비 위계·면적 약함.  
> AFTER: 섹션 콘텐츠 폭을 `repeat(3, 1fr)`로 채우는 등분 타일 + 프로필 요약 라인.

---

## 1) 보드 / 캔버스

| 항목 | 값 | 비고 |
|------|-----|------|
| 검수 뷰포트 | **1440** | 표준 데스크톱 |
| 보드 배경 | `--paid-bg` **#F6F1E8** | B안 warm ivory · 철학 변경 금지 |
| 섹션 콘텐츠 폭 | **762** | body 800 − page pad 18×2 FACT |
| 폰트 | Pretendard | Regular/Medium/SemiBold/Bold |

---

## 2) 섹션 카드 크롬 (주변 panel과 동일)

| 항목 | 값 | 토큰/근거 |
|------|-----|-----------|
| padding | **22** | FACT section card pad |
| border-radius | **12** | `--r-card` |
| border | **1px** solid `#E6DFD4` (`--paid-line`) | LOCK |
| background | `#FFFFFF` (`--uds-surface`) | |
| 내부 content 폭 | `100%` of card content box ≈ **718** (762 − 22×2) | 타일 그리드가 이 폭을 채움 |

---

## 3) 타이포그래피

| 요소 | size | weight | line-height | color | 비고 |
|------|-----:|-------:|------------:|-------|------|
| H2 「적용 대상」 | **22** (FS-5) | **700** | 1.3 | `#292823` (`--plans-ink`) | 타 섹션 타이틀과 동일 · letter-spacing −0.02em · margin-bottom **6** |
| lead | **14** (FS-2) | **400** | 1.5 | `#766F64` (`--plans-muted`) | 「상품을 고른 뒤, 적용할 프로필과 지역을 확인합니다.」 · margin-bottom **16** |
| profile 요약 | **16** (FS-3) | **600** | 1.4 | ink | 「가능동베스트 · 공부방」 · 3rd H2 아님 · context label |
| profile 구분자 ` · ` | 16 | 500 | 1.4 | muted | 동일 라인 안 |
| status badge 「published」 | **12** (FS-1) | **600** | 1 | `#15803D` on `#ECFDF3` | height 22 · pad 0 8 · radius **4** (`--r-badge`) · optional |
| region name | **16** (FS-3) | **600** | 1.35 | ink | |
| region meta 「구매 가능」 | **12** (FS-1) | **400** | 1.4 | muted · selected 시 Primary | |
| footer link | **14** (FS-2) | **500** | 1.45 | muted · underline | hover Primary |

금지: raw 11/13/15/17 (UDX-10).

---

## 4) 프로필 라인

```
가능동베스트 · 공부방   [published]
```

- 역할: 지역 타일이 **어느 샵/프로필**에 속하는지 보여주는 identity summary.
- 카피 출처 불명 → 구현 시 샵명 · 역할 · 상태 필드로 바인딩.
- margin-bottom **16** (lead → profile → tiles 리듬 = 16 계열).
- badge는 선택: 없으면 텍스트로 ` · published`를 muted 16/400으로 붙여도 됨. **본안은 badge 채택.**

---

## 5) 지역 타일 그리드

| 항목 | 값 | 근거 |
|------|-----|------|
| display | `grid` | |
| columns | **`repeat(3, 1fr)`** | 등분 · 섹션 content 폭 **100%** 채움 (기간 5열과 같은 “행 채움” 리듬, 열 수만 3) |
| column-gap / row-gap | **12** | pick gap-12 정렬 |
| 타일 min-height | **80** (범위 72–88 중점) | 작은 칩 금지 |
| 타일 padding | **14** 세로 · **16** 가로 | 선택 시 border 2px 보정 → **13 / 15** |
| 타일 radius | **8** (`--r-ctl`) | 컨트롤형 · period card 12와 구분하되 chrome 동일(white + line) |
| 타일 border (default) | **1px** `--paid-line` | |
| 타일 border (selected) | **2px** `#266BC4` | period selected와 동일 |
| 타일 bg (selected) | `#EEF4FB` (`--uds-primary-subtle`) | period는 soft selected fill 계열 · primary-subtle로 강조 명확화 |
| radio | **18×18** · border 2 · 내부 점 8 | top-left · name과 gap **8** |
| meta indent | padding-left **26** (= 18+8) | name 텍스트 시작선과 정렬 |
| gap title→tiles | (profile mb 16) | |

### 폭 채움 공식

```
section width     = 762
section pad       = 22 × 2
content inner     = 762 − 44 = 718
grid              = repeat(3, 1fr) + gap 12 × 2
tile width each   = (718 − 24) / 3 ≈ 231.333
```

→ 좌측 칩 + 우측 공백 패턴 제거. 3타일이 행을 등분.

---

## 6) 푸터 링크

| 항목 | 값 |
|------|-----|
| 카피 | 「상세등록에서 지역/과목 수정」 |
| size / weight | **14** / **500** |
| color | muted · underline offset 3 · thickness 1 |
| hover | Primary |
| margin-top | tiles mb **16** 으로 분리 (별도 mt 0) |

---

## 7) 스택 간격 요약 (카드 내부)

```
H2
  ↓ 6
lead
  ↓ 16
profile row
  ↓ 16
region grid (3×1fr, gap 12)
  ↓ 16
footer link
```

카드 바깥 세로 간격(다른 panel과의 gap)은 페이지 기존 **16~24** 유지 · 본 보드 범위 밖.

---

## 8) 구현 체크리스트 (Cursor)

```text
[ ] .panel / .apply-section: pad 22 · r12 · border 1 paid-line · white
[ ] h2: 22/700 · mb 6
[ ] .lead: 14/400 muted · mb 16
[ ] profile: 16/600 ink · optional published 12 badge r4
[ ] .apply-regions: grid-template-columns: repeat(3, 1fr); gap: 12px; width: 100%
[ ] tile: min-h 80 · pad 14/16 · r8 · radio 18 · name 16/600 · meta 12
[ ] selected: border 2 primary + bg primary-subtle · pad compensate
[ ] footer link: 14 muted underline
[ ] no 11/13/15/17 · no new IA · no whole-page redesign
```

---

## 9) 파일

| 파일 | 역할 |
|------|------|
| `apply-target.html` | AFTER 단독 보드 |
| `apply-target.css` | 블록 + 최소 잠금 토큰 |
| `fonts/*.woff2` | Pretendard 4 weights |
| `shots/apply-target-1440.png` | @1440 캡처 |
| `SPEC.md` | 본 문서 |
