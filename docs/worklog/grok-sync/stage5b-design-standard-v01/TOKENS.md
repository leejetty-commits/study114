# 5B 디자인 표준 초안 — 사용 토큰

작성: 2026-09-08 KST  
상태: **5B 초안 보드 · 최종 승인 아님 · 운영 적용 전**  
스코프: `.uds-theme` (`tokens.css`)  
패치: **shape-system** (뱃지 4 / Role Tab·Filter 6 / 텍스트 pill 폐기 / 상세 보기 Secondary)

## 5A 연속 (공통)

| 역할 | 변수 | 값 |
|------|------|-----|
| Primary CTA | `--uds-primary` | `#266BC4` |
| Primary hover/pressed/subtle/fg | `--uds-primary-hover` 등 | `#1F5AAB` / `#1A4F96` / `#EEF4FB` / `#FFF` |
| Focus | `--uds-focus` | `#266BC4` |
| Ink / Muted / Bg / Surface / Line | `--uds-ink` 등 | `#1C1917` / `#4B5563` / `#F7F8FA` / `#FFF` / `#E5E7EB` |
| Success / Warning / Error (+bg/line) | `--uds-success*` 등 | 5A와 동일 |
| Disabled | `--uds-disabled-*` | 5A와 동일 |
| Font sizes | `--fs-12`…`--fs-36` | 12/14/16/18/22/28/36 |
| Spacing | `--s-0-5`…`--s-8` | 4/8/12/16/24/32/40/48/64 |
| Radius card/ctl | `--r-card` / `--r-ctl` | 12 / 8 |
| Shadow | `--shadow-sticky` | `0 1px 2px rgba(15,23,42,.06)` only |

## 5B 확장

### 역할 액센트 (15%만 — soft 배너·Role Tab·아이콘 틴트·선택선. Primary CTA 채움 금지)

| 역할 | 변수 | 값 |
|------|------|-----|
| 공부방 | `--role-room` / `-soft` / `-line` | `#266BC4` / `#EEF4FB` / `#C5D4E8` |
| 과외쌤 | `--role-tutor` / `-soft` / `-line` | `#0F766E` / `#E6F4F1` / `#B7DED8` |
| 학생·학부모 | `--role-student` / `-soft` / `-line` | `#5B4BD6` / `#F0EEFB` / `#D4CFF0` |

### Shape radii · heights (shape patch)

| 변수 | 값 | 용도 |
|------|-----|------|
| `--r-badge-a` | 4px | **상태/증빙/유료 뱃지만** — small rounded rect, NO pill |
| `--r-badge-b` | 6px | 뱃지 비교 옵션 |
| `--r-chip` | 6px | **Role Tab + Filter chip** (텍스트 컨트롤) |
| `--r-pill` | 999px | **텍스트 라벨 폐기** — 토글 트랙 / 아이콘 전용만 |
| `--role-tab-h` | 34px | Role Tab (32–36 범위) |
| `--chip-h` | 32px | Filter chip min-height(데스크톱). 모바일(≤768) 터치 ≥44px |
| `--btn-detail-h` | 40px | 카드 「상세 보기」 데스크톱 |
| `--btn-detail-h-m` | 44px | 카드 「상세 보기」 모바일 (≤768) |

### Paid skin (구매 맥락만)

| 변수 | 값 |
|------|-----|
| `--paid-bg` | `#F6F1E8` |
| `--paid-surface` | `#FFFFFF` |
| `--paid-line` | `#E6DFD4` |
| `--paid-ink` | `#292823` |
| `--paid-muted` | `#766F64` |
| `--paid-selected` | `#FBF7EF` |
| `--paid-sand` | `#F4E7C9` |

CTA는 paid 맥락에서도 `--uds-primary` (`#266BC4`).

### Info 배너

`--uds-info` / `-bg` / `-line` → Primary 계열 soft.

## 규칙

- 컴포넌트 CSS(`board.css`)에 임의 raw HEX 없음 — 토큰만.
- 금·유리·강한 그림자·빈 이미지 그라데이션 없음.
- 가격 = Ink (있을 때만). 빈 가격 = 영역 숨김 (정책 TBD, 「가격 문의」 미사용).
- 카드 「상세 보기」 = Secondary (흰 bg + primary 텍스트/보더). 페이지 대표 CTA만 Primary fill.
- 텍스트 달린 999px pill 금지 (Role/Filter/Badge).


## 검색 Primary (UDX-STD-001 정본 동기화 · 72px 재보정)

| 변수 | 값 |
|------|-----|
| `--btn-search-min-w` | 72px (≥72 · 64는 FAIL) |
| `--btn-search-h` | 40px |
| `--btn-search-h-m` | 44px |
