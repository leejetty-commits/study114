# [309b] 토큰화 P3 잔여 — mypage-ops.css (px→--space-*)

- **과제 ID:** 309b
- **날짜:** 2026-10-26
- **브랜치:** `cursor/309b-tokenize-mypage-ops-20261026`
- **베이스:** `2afb8ff31656271789bb3c162f7f37716c981a8f` (309 머지 이후 main)

## 작업 대상

| 파일 | Before px | After px | 추가 var(--space) | 비고 |
|---|---|---|---|---|
| `mypage-ops.css` | 36 (+ fallback 1) | 3 | +40 (기존2→42) | 6px×3 raw 유지 |

## 치환 맵

### 정스케일 (1:1)
| 원본 px | 토큰 | 건수 |
|---|---|---|
| 4px | `--space-1` | 3 |
| 8px | `--space-2` | 4 |
| 12px | `--space-3` | 12 |
| 16px | `--space-4` | 14 |
| 24px | `--space-6` | 5 |

### 비스케일
| 원본 px | 매핑 | 실제 rem | 사유 |
|---|---|---|---|
| 10px (×2) | `--space-3` (12px) | 0.75rem | notice head/row 세로패딩. 8px은 좁고 12px이 리듬 통일 |
| -12px (×1) | `calc(-1 * var(--space-3))` | -0.75rem | msg-row 음수 마진 |
| 6px (×3) | raw 유지 | — | 뱃지/알약 좌우. 8px은 뚱뚱 |

### Fallback 정리
| 원본 | 변경 |
|---|---|
| `var(--space-6, 24px)` | `var(--space-6)` |

## AC 체크리스트

- [x] mypage-ops.css — px spacing 36→3 (6px×3 raw)
- [x] tokens.css 미수정, 신규 토큰 없음
- [x] `--s-*` 사용 없음
- [x] 빌드 성공 (`vite build`)
- [x] before/after 스크린샷 (guide·community 1440+390 — 마이페이지 본문은 로그인 필요)
- [x] 6px 뱃지 3곳 일관 raw 유지
- [x] merge / deploy 안 함
- [ ] PR 생성

## 스크린샷

- `docs/worklog/2026/10/shots-309b/before/` — guide·community ×2 뷰포트
- `docs/worklog/2026/10/shots-309b/after/` — 동일
- 마이페이지 전용 컴포넌트(.mypage-content, .mypage-notice)는 로그인 뒤에만 렌더. guide·community는 영향 없음 확인.

## 위험도

- **낮음** — mypage 스코프 내 spacing만 변경, 레이아웃·색상·타이포 미변경
- 10px→12px 마이페이지 notice 패딩 2px 증가 — 시각적으로 여유 추가 수준
