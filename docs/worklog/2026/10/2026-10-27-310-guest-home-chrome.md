# [310] 게스트 홈 여백·구분선·로그인띠 · 풋터 D · 마이페이지 왼쪽메뉴 S2-2

- **과제 ID:** 310
- **날짜:** 2026-10-27
- **브랜치:** `cursor/310-guest-home-chrome-20261027`
- **베이스:** `5d9db73c34868b0a1dfc2a9035f9d3d6897f4a26` (309b 머지 후 main)
- **RESTORE_BASE:** `5d9db73c34868b0a1dfc2a9035f9d3d6897f4a26`
- **시안 근거:** 종현 t462~t467 · audits/guest-home-chrome-mockups/ (D 풋터 · S2-2 #d4d4d8)

## 변경 요약

### 커밋 1: 게스트 여백 통일·키움 + 구분선 제거
| 선택자 | 이전 | 이후 | 파일 |
|---|---|---|---|
| `.home-shell--guest .content-section .section-heading` | `--space-3` (12px) | `--space-8` (32px) | design-system.css |
| `.home-shell--guest .guest-browse-lists .section-heading` | (같은 위) | `--space-8` (32px) | design-system.css |
| `.guest-browse-lists` (`home-listings.css`) | `border-top: 1px solid var(--gray-200)` | `border-top: none` | home-listings.css |
| `.guest-browse-lists--students` | `border-top: 1px solid var(--gray-200)` | `border-top: none` | design-system.css |
| `.home-shell--guest .content-section` | `border-bottom: 1px solid var(--gray-100)` | `border-bottom: none` | design-system.css |

**학생 홈 티어 라인** (`.home-shell--parent .content-section--blue .list-subsection .section-heading--pick` 등) — 더 높은 특이도, **미변경**.

### 커밋 2: guest-login-strip 세로 중앙
| 선택자 | 변경 | 파일 |
|---|---|---|
| `.home-shell > .guest-login-strip .guest-login-strip__text` | +`line-height: var(--leading-normal, 1.5); margin: 0;` | design-system.css |

### 커밋 3: 풋터 D + 마이페이지 사이드바 S2-2
**풋터 D (시안 D: 소프트 차콜)**
| 속성 | 이전 | 이후 (hex) |
|---|---|---|
| background | `var(--uds-surface)` (#fff) | `#334155` |
| border-top | `1px solid var(--uds-line)` | `none` |
| color (body) | `var(--uds-muted)` | `#94a3b8` |
| links | `var(--uds-muted)` | `#e2e8f0` |
| link hover | `var(--uds-ink)` | `#f8fafc` |
| underline-color | `var(--uds-primary)` | `#94a3b8` |
| sep | `var(--uds-line)` | `#64748b` |
| company-label | `var(--uds-muted)` | `#94a3b8` |
| company-value | `var(--uds-ink)` | `#cbd5e1` |
| legal | `var(--uds-muted)` | `#94a3b8` |

**사이드바 S2-2**
| 선택자 | 이전 | 이후 |
|---|---|---|
| `.mypage-sidebar` background | `var(--mp-panel)` (#fff) | `#d4d4d8` |

`--mp-panel` 전역 값 미변경 → 카드·패널은 흰색 유지.

## 수정 파일
| 파일 | ins/del |
|---|---|
| `preview/home-ui/src/styles/design-system.css` | +14/-1 |
| `preview/home-ui/src/styles/home-listings.css` | +1/-1 |
| `preview/home-ui/src/styles/mypage-ops.css` | +2/-2 |
| `preview/home-ui/src/styles/udx-std-apply.css` | +12/-12 |

## AC 체크리스트
- [x] base = `5d9db73c` · 브랜치 `cursor/310-guest-home-chrome-20261027`
- [x] dirty 목록 변경·커밋 0 (`.cursor/rules/work-routine.mdc` 등 dirty-only)
- [x] 게스트 섹션 위 여백 통일 `--space-8` (32px) · 게스트 불필요 border 0
- [x] guest-login-strip 카피·버튼 세로 중앙
- [x] footer 바탕 `#334155` + 밝은 텍스트 대비 OK
- [x] `.mypage-sidebar` 바탕 `#d4d4d8` · `--mp-panel` 카드는 흰색 유지
- [x] 학생 홈 티어 라인 회귀 0 (높은 특이도 유지)
- [x] before/after 샷
- [x] 빌드 통과
- [ ] PR 생성
- [ ] merge 안 함

## 스크린샷
- `docs/worklog/2026/10/shots-310/before/` — guest-home, guest-footer, community (1440+390)
- `docs/worklog/2026/10/shots-310/after/` — 동일

## 위험도
- **낮음** — CSS-only, 게스트 스코프 여백·풋터 전역 색·사이드바 한 속성
- 풋터 D는 전역 영향이나, 기존 var() 참조를 직접 hex로 고정했으므로 다른 파일에서 `--uds-*` 토큰을 재정의해도 풋터는 흔들리지 않음
- 사이드바 `#d4d4d8`은 `.mypage-sidebar`만 — 카드·패널 흰색 불변

## 복원
```bash
git restore --source=5d9db73c -- preview/home-ui/src/styles/design-system.css preview/home-ui/src/styles/home-listings.css preview/home-ui/src/styles/mypage-ops.css preview/home-ui/src/styles/udx-std-apply.css
```
