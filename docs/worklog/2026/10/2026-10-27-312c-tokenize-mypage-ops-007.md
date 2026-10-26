# [312c] 토큰화 FS-T1-007(3차) — mypage-ops.css

- **과제**: 312c
- **브랜치**: `cursor/312c-tokenize-mypage-ops-007-20261027`
- **base**: `3bfd53bb` (main tip, 314 병합 후)
- **RESTORE_BASE**: `3bfd53bb`

## 지시 요약

`mypage-ops.css`에서 간격 선언(margin·padding·gap·row-gap·column-gap)의 정확 일치 rem → `var(--space-*)` 치환. border-radius 절대 치환 금지. 비스케일 rem 그대로.

## 카운트 명령

```
node -e "..." (spacingProps regex + tokenMap, border-radius 행 제외)
```

## 전/후 카운트

| 항목 | before | after |
|------|--------|-------|
| 정확 일치 rem (간격 선언) | 121 | **0** |
| var(--space) 행 수 | 34 | 138 |
| 비스케일 rem (간격 선언) | 64 | 64 (미수정) |

## 정확 일치 값별 치환 수

| rem 값 | 토큰 | 개수 |
|--------|------|------|
| -0.25rem | calc(-1 * var(--space-1)) | 1 |
| 0.25rem | --space-1 | 10 |
| 0.5rem | --space-2 | 21 |
| 0.75rem | --space-3 | 30 |
| 1rem | --space-4 | 38 |
| 1.25rem | --space-5 | 12 |
| 1.5rem | --space-6 | 7 |
| 2rem | --space-8 | 2 |
| **합계** | | **121** |

## 남은 비스케일 rem (후속 — 디자인 결정 필요)

| 값 | 개수 |
|----|------|
| 0.1rem | 1 |
| 0.125rem | 1 |
| 0.15rem | 6 |
| 0.2rem | 3 |
| 0.22rem | 1 |
| 0.35rem | 5 |
| 0.375rem | 3 |
| 0.4rem | 4 |
| 0.45rem | 2 |
| 0.55rem | 6 |
| 0.65rem | 10 |
| 0.7rem | 3 |
| 0.85rem | 12 |
| 0.9rem | 3 |
| 1.1rem | 3 |
| 1.35rem | 1 |
| **합계** | **64** |

## 검증

- radius 변경 행: `git diff | rg "^[+-].*radius"` → **0** ✅
- `--s-*` 사용: **0** ✅
- `tokens.css` 변경: **0** ✅
- 빌드: `npm run build` ✅ (6.47s)
- diff stat: `mypage-ops.css` +105 −105

## 스크린샷

- **before** (base `3bfd53bb` CSS): `docs/worklog/2026/10/shots-312c/before/`
  - `mypage-1440-before.png` — 내 등록 (공부방) 1440px
  - `mypage-390-before.png` — 내 등록 (공부방) 390px
  - `account-1440-before.png` — 계정설정 1440px
- **after** (tip CSS): `docs/worklog/2026/10/shots-312c/after/`
  - `mypage-1440-after.png` — 내 등록 (공부방) 1440px
  - `mypage-390-after.png` — 내 등록 (공부방) 390px
  - `account-1440-after.png` — 계정설정 1440px
- mock 로그인(fetch intercept + initAuthSession)으로 마이페이지 콘텐츠 화면 촬영
- 시각 동등 확인 ✅

## dirty/stash

- dirty: `work-routine.mdc` (오너 로컬, 미커밋)
- stash: 없음

## 복원

```
git restore --source=3bfd53bb -- preview/home-ui/src/styles/mypage-ops.css
```
