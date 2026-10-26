# 312d — 토큰화 FS-T1-007 (4차): home-support-guide.css + info-pages.css

- **과제:** 312d
- **지시서:** 이 채팅 (복명복창 후 착수)
- **base:** `239e59642b333320aaf61f250eb154e8fb9ce488` (312c rebase-merge 후 main tip)
- **RESTORE_BASE:** `239e59642b333320aaf61f250eb154e8fb9ce488`
- **브랜치:** `cursor/312d-tokenize-support-info-007-20261027`

## 작업 요약

간격 선언(margin·padding·gap·row-gap·column-gap, longhand 포함)의 정확 일치 rem 리터럴을 `var(--space-*)` 토큰 1:1 치환. 시각 변화 0.

## 파일별 결과

### home-support-guide.css

| 항목 | 수정 전 | 수정 후 |
|------|---------|---------|
| 정확 일치 rem | 106 | 0 |
| var(--space-*) | 114 | 220 |
| 비스케일 rem | 77 | 77 (미수정) |

값별 치환:
- `1rem` → `var(--space-4)`: 35
- `0.25rem` → `var(--space-1)`: 21
- `0.5rem` → `var(--space-2)`: 20
- `0.75rem` → `var(--space-3)`: 16
- `1.25rem` → `var(--space-5)`: 9
- `1.5rem` → `var(--space-6)`: 4
- `4rem` → `var(--space-16)`: 1

### info-pages.css

| 항목 | 수정 전 | 수정 후 |
|------|---------|---------|
| 정확 일치 rem | 30 | 0 |
| var(--space-*) | 1 | 31 |
| 비스케일 rem | 55 | 55 (미수정) |

값별 치환:
- `1rem` → `var(--space-4)`: 13
- `0.75rem` → `var(--space-3)`: 6
- `0.5rem` → `var(--space-2)`: 5
- `1.5rem` → `var(--space-6)`: 4
- `0.25rem` → `var(--space-1)`: 1
- `1.25rem` → `var(--space-5)`: 1

### 합계: 정확 일치 rem 136 → 0, var(--space-*) 치환 136

## 후속 (비스케일, 디자인 결정 필요)

### home-support-guide.css — 비스케일 rem 77개
| 값 | 개수 |
|-----|------|
| 0.35rem | 10 |
| 0.85rem | 9 |
| 0.125rem | 8 |
| 0.375rem | 5 |
| 0.65rem | 5 |
| 1.15rem | 5 |
| 0.625rem | 3 |
| 0.55rem | 3 |
| 0.875rem | 3 |
| 0.95rem | 3 |
| 1.1rem | 3 |
| 1.35rem | 3 |
| 1.75rem | 3 |
| 0.4rem | 2 |
| 0.45rem | 2 |
| 0.7rem | 2 |
| 0.9rem | 2 |
| 1.2rem | 2 |
| 1.05rem | 1 |
| 1.6rem | 1 |
| 2.25rem | 1 |
| 3.5rem | 1 |

### info-pages.css — 비스케일 rem 55개
| 값 | 개수 |
|-----|------|
| 0.85rem | 8 |
| 0.2rem | 5 |
| 0.35rem | 5 |
| 0.45rem | 5 |
| 1.15rem | 5 |
| 0.7rem | 3 |
| 1.05rem | 3 |
| 0.4rem | 2 |
| 0.55rem | 2 |
| 0.6rem | 2 |
| 0.65rem | 2 |
| 0.8rem | 2 |
| 0.95rem | 2 |
| 1.1rem | 2 |
| 1.2rem | 2 |
| 0.05rem | 1 |
| 0.15rem | 1 |
| 0.3rem | 1 |
| 1.35rem | 1 |
| 1.6rem | 1 |

## 검증

- [x] radius 변경 0 (`git diff | rg radius` — 변경 줄 없음)
- [x] `--s-*` 사용 0
- [x] tokens.css 변경 0
- [x] 빌드 통과 (vite build OK)
- [x] 정확 일치 rem 잔존 0 (스크립트 검증)
- [x] 샷 생략 (정확 일치 토큰화, t516 면제)

## 커밋

1. `375087ec` — home-support-guide.css 106개 토큰화
2. `ffc50377` — info-pages.css 30개 토큰화
3. (이 worklog 커밋)

## dirty 상태

- `.cursor/rules/work-routine.mdc` — 오너 로컬 (건드리지 않음, 커밋/restore/discard 금지)

## 복원

```
git restore --source=239e5964 -- preview/home-ui/src/styles/home-support-guide.css preview/home-ui/src/styles/info-pages.css
```

## rg 명령 (수정 전 카운트)

```
rg -n "(margin|padding|gap|row-gap|column-gap)[a-z-]*\s*:\s*[^;]*[0-9]+\.?[0-9]*rem" preview/home-ui/src/styles/home-support-guide.css
rg -n "(margin|padding|gap|row-gap|column-gap)[a-z-]*\s*:\s*[^;]*[0-9]+\.?[0-9]*rem" preview/home-ui/src/styles/info-pages.css
```
