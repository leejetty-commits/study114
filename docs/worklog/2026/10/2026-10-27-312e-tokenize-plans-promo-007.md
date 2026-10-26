# 312e — 토큰화 FS-T1-007 (5차): plans-store.css + home-promo.css

- **과제:** 312e
- **지시서:** 이 채팅 (복명복창 생략, 바로 착수 지시)
- **base:** `69771627e011b5470c2752d0e952fd15f5659b07` (312d merge 후 main tip)
- **RESTORE_BASE:** `69771627e011b5470c2752d0e952fd15f5659b07`
- **브랜치:** `cursor/312e-tokenize-plans-promo-007-20261027`

## 작업 요약

간격 선언(margin·padding·gap·row-gap·column-gap, longhand 포함)의 정확 일치 rem 리터럴을 `var(--space-*)` 토큰 1:1 치환. 시각 변화 0.

## 파일별 결과

### plans-store.css

| 항목 | 수정 전 | 수정 후 |
|------|---------|---------|
| 정확 일치 rem | 54 | 0 |
| 비스케일 rem | 84 | 84 (미수정) |

값별 치환:
- `1rem` → `var(--space-4)`: 16
- `0.75rem` → `var(--space-3)`: 15
- `0.25rem` → `var(--space-1)`: 8
- `0.5rem` → `var(--space-2)`: 8
- `1.25rem` → `var(--space-5)`: 5
- `1.5rem` → `var(--space-6)`: 2

### home-promo.css

| 항목 | 수정 전 | 수정 후 |
|------|---------|---------|
| 정확 일치 rem | 54 | 0 |
| 비스케일 rem | 42 | 42 (미수정) |

값별 치환:
- `1rem` → `var(--space-4)`: 15
- `1.25rem` → `var(--space-5)`: 9
- `2.5rem` → `var(--space-10)`: 7
- `0.75rem` → `var(--space-3)`: 6
- `0.5rem` → `var(--space-2)`: 5
- `1.5rem` → `var(--space-6)`: 5
- `0.25rem` → `var(--space-1)`: 3
- `2rem` → `var(--space-8)`: 3
- `3rem` → `var(--space-12)`: 1

**참고 집계와 차이:** home-promo.css 참고 48 → 실측 54 (+6). 실측값 기준 처리.

### 합계: 정확 일치 rem 108 → 0, var(--space-*) 치환 108

## 후속 (비스케일, 디자인 결정 필요)

### plans-store.css — 비스케일 rem 84개
| 값 | 개수 |
|-----|------|
| 0.35rem | 15 |
| 0.65rem | 9 |
| 0.55rem | 8 |
| 0.9rem | 8 |
| 0.85rem | 7 |
| 1.15rem | 7 |
| 0.4rem | 6 |
| 0.15rem | 5 |
| 1.1rem | 5 |
| 0.45rem | 4 |
| 0.2rem | 3 |
| 0.7rem | 2 |
| 0.6rem | 1 |
| 0.95rem | 1 |
| 1.05rem | 1 |
| 1.2rem | 1 |
| 1.35rem | 1 |

### home-promo.css — 비스케일 rem 42개
| 값 | 개수 |
|-----|------|
| 0.65rem | 8 |
| 0.85rem | 6 |
| 0.35rem | 5 |
| 0.55rem | 5 |
| 0.25rem | 3 (치환 후 잔여는 0 — 이것은 non-spacing prop에 있는 값) |
| 0.15rem | 2 |
| 0.2rem | 2 |
| 0.7rem | 2 |
| 0.9rem | 2 |
| 1.1rem | 2 |
| 1.2rem | 2 |
| 1.75rem | 2 |
| 0.3rem | 1 |
| 0.45rem | 1 |
| 1.15rem | 1 |
| 1.35rem | 1 |

## 검증

- [x] radius 변경 0
- [x] `--s-*` 사용 0
- [x] tokens.css 변경 0
- [x] 빌드 통과 (vite build OK)
- [x] 정확 일치 rem 잔존 0 (스크립트 검증)
- [x] 샷 생략 (정확 일치 토큰화, t516 면제)

## 커밋

1. `fdb895fa` — plans-store.css 54개 토큰화
2. `377cce29` — home-promo.css 54개 토큰화
3. (이 worklog 커밋)

## dirty 상태

- `.cursor/rules/work-routine.mdc` — 오너 로컬 (건드리지 않음, 커밋/restore/discard 금지)

## 복원

```
git restore --source=69771627 -- preview/home-ui/src/styles/plans-store.css preview/home-ui/src/styles/home-promo.css
```

## rg 명령 (수정 전 카운트)

```
rg -n "(margin|padding|gap|row-gap|column-gap)[a-z-]*\s*:\s*[^;]*[0-9]+\.?[0-9]*rem" preview/home-ui/src/styles/plans-store.css
rg -n "(margin|padding|gap|row-gap|column-gap)[a-z-]*\s*:\s*[^;]*[0-9]+\.?[0-9]*rem" preview/home-ui/src/styles/home-promo.css
```
