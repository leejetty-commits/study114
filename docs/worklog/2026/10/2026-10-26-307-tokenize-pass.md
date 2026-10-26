# [307] 토큰화 잔여 — FS-T1-001~003 promo / plans / zip (px→--space-*)

- **과제:** 307
- **브랜치:** `cursor/307-tokenize-promo-plans-zip-20261026`
- **RESTORE_BASE:** `2535632eb39e7f0394a85d9bc6e29c9a20e51948`
- **상태:** 검수 대기

## 지시서 원문

> 5개 CSS 파일의 하드코딩 px 간격값을 `var(--space-*)` 디자인 토큰으로 치환.
> spacing 프로퍼티만 대상 (margin, padding, gap, row-gap, column-gap, scroll-padding, inset).
> ≤3px(서브스케일)·>80px(스케일 밖)·1px 보정은 raw 유지. 토큰 스케일 외 값은 최근접 매핑, 동점 시 올림.

## 토큰 스케일

| px  |  4 |  8 | 12 | 16 | 20 | 24 | 32 | 40 | 48 | 64 | 80 |
|-----|----|----|----|----|----|----|----|----|----|----|-----|
| tok |  1 |  2 |  3 |  4 |  5 |  6 |  8 | 10 | 12 | 16 | 20 |

## 파일별 결과

### 1. promo-v2.css (FS-T1-001) — `0abb0ea5`

| 지표 | 수정 전 | 수정 후 |
|------|--------|--------|
| raw px 선언 | 98 | 29 |
| var(--space-*) | 0 | 97 |

- **치환:** 167건
- **raw 유지 (13건):** 3px×4, 2px×3 (서브스케일); 90px, 100px, 110px, 120px, 150px×2 (스케일 밖 — 캠페인 히어로 패딩)
- **비정확 매핑:** 14px→`--space-4`(16), 18px→`--space-5`(20), 56px→`--space-16`(64), 60px→`--space-16`(64), 70px→`--space-16`(64)

### 2. plans-theme.css (FS-T1-002) — `766a3ad9`

| 지표 | 수정 전 | 수정 후 |
|------|--------|--------|
| raw px 선언 | 87 | 15 |
| var(--space-*) | 2 | 75 |

- **치환:** 92건
- **raw 유지 (4건):** 2px×2, 3px×2 (서브스케일)
- **비정확 매핑:** 22px→`--space-6`(24), 10px→`--space-3`(12), 14px→`--space-4`(16), 28px→`--space-8`(32)

### 3. plans-store.css (FS-T1-002) — `81461f79`

| 지표 | 수정 전 | 수정 후 |
|------|--------|--------|
| raw px 선언 | 58 | 7 |
| var(--space-*) | 0 | 52 |

- **치환:** 73건
- **raw 유지 (3건):** 3px×1, 2px×2 (서브스케일)
- **border 1→2px 보정 (4건, 수동 수정):**
  - `.plans-badge-select__option.is-checked` → `padding: 15px 19px`
  - `.plans-region-chip:has(input:checked)` → `padding: 15px 15px`
  - `.plans-period-card.is-selected .plans-period-card__btn` → `padding: 15px 11px`
  - `.plans-ticket-card.is-selected .plans-ticket-card__btn` → `padding: 19px 15px`
  - 계산: 정상 padding 토큰화 후 값 − 1px (border 1→2px 차이)

### 4. zip-visual-v2.css (FS-T1-003) — `87437c4d`

| 지표 | 수정 전 | 수정 후 |
|------|--------|--------|
| raw px 선언 | 77 | 20 |
| var(--space-*) | 0 | 68 |

- **치환:** 111건
- **raw 유지:** 0건
- **비정확 매핑:** 28px→`--space-8`(32), 18px→`--space-5`(20), 14px→`--space-4`(16), 58px→`--space-16`(64)

### 5. zip-guide.css (FS-T1-003) — `7611f74b`

| 지표 | 수정 전 | 수정 후 |
|------|--------|--------|
| raw px 선언 | 56 | 2 |
| var(--space-*) | 0 | 54 |

- **치환:** 70건
- **raw 유지 (2건):** 1px×1, 2px×1 (서브스케일)

## 총합

| | 수정 전 px | 수정 후 px | 수정 후 var | 치환 수 |
|---|---|---|---|---|
| promo-v2 | 98 | 29 | 97 | 167 |
| plans-theme | 87 | 15 | 75 | 92 |
| plans-store | 58 | 7 | 52 | 73 |
| zip-visual-v2 | 77 | 20 | 68 | 111 |
| zip-guide | 56 | 2 | 54 | 70 |
| **합계** | **376** | **73** | **346** | **513** |

잔여 raw px 73건 = 서브스케일(≤3px) + 스케일 밖(>80px) + border 보정 + beyond-scale 미디어값.

## 스크린샷

| 페이지 | 1440px before | 1440px after | 390px before | 390px after |
|--------|--------------|-------------|-------------|-------------|
| promo study-room | `shots-307/before/promo-room-1440.png` | `shots-307/after/promo-room-1440.png` | `shots-307/before/promo-room-390.png` | `shots-307/after/promo-room-390.png` |
| plans hub | `shots-307/before/plans-hub-1440.png` | `shots-307/after/plans-hub-1440.png` | `shots-307/before/plans-hub-390.png` | `shots-307/after/plans-hub-390.png` |
| guide | `shots-307/before/guide-1440.png` | `shots-307/after/guide-1440.png` | `shots-307/before/guide-390.png` | `shots-307/after/guide-390.png` |

## 손대지 않은 파일 (후속 후보)

- `zip-bridge.css` — P3/별건
- `promo-catalog.css` — P3/별건
- `home-promo.css` — P3/별건
- `home-popup.css` — P3/별건
- `mypage-ops.css` — P3/별건

## 복원 명령

```bash
# 전체 되돌리기
git revert --no-commit 7611f74b 87437c4d 81461f79 766a3ad9 0abb0ea5

# 또는 base로 복원
git restore --source=2535632eb39e7f0394a85d9bc6e29c9a20e51948 -- \
  preview/home-ui/src/styles/promo-v2.css \
  preview/home-ui/src/styles/plans-theme.css \
  preview/home-ui/src/styles/plans-store.css \
  preview/home-ui/src/styles/zip-visual-v2.css \
  preview/home-ui/src/styles/zip-guide.css
```

## 위험도

- **중간** — spacing 값만 치환, 셀렉터·레이아웃 구조 변경 없음. 비정확 매핑(최근접 토큰)에 의한 미세 간격 차이 있으나 시각적 영향 최소.
- plans-store border 보정 4건은 수동 계산이므로 실제 기기에서 확인 권장.

## AC 체크리스트

- [x] 허용 5파일만 수정
- [x] tokens.css 미수정
- [x] `--s-*` 미사용
- [x] 셀렉터·구조 변경 없음
- [x] ≤3px / >80px / 1px 보정 raw 유지
- [x] 음수 margin → calc(-1 * var(--space-N)) (해당 없음 — 대상 파일에 음수 margin 없음)
- [x] minified 파일 포맷 재정렬 없음
- [x] 파일별 커밋 (5건)
- [x] before/after 스크린샷 (1440 + 390, 3페이지)
- [x] force-push 없음
- [ ] PR 생성 (merge/deploy 금지)
