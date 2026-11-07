# home-block-gap-v1 — 홈·검색 베이직·학생 제목 여백 + 홈 블록 간격 + 로그인 구분선 제거

**과제ID:** home-block-gap-v1  
**날짜:** 2026-11-07  
**브랜치:** `feat/home-block-gap-v1`  
**위험도:** 낮음 (CSS·allowlist 한정)

---

## 지시서 요점

1. 게스트 ①(지도→첫 섹션 제목)을 블록 간 기준값으로 고정  
2. 게스트·로그인에서 ①보다 좁은 블록 경계를 ①과 동급으로  
3. 로그인 역할 홈 `.content-section` 가로선 제거 (게스트와 동일)  
4. 베이직공부방·베이직과외쌤·학생 제목→카드 간격 1토큰 전역 통일  
5. CSS만 · allowlist 외 무접촉

---

## 토큰

| 토큰 | 값 | 근거 |
|------|-----|------|
| `--home-block-gap` | `3.5rem` (56px) | ① = map mb(`--space-6`=24) + heading pt(`--space-8`=32). 1280/768/390 동일 |
| `--home-basic-title-gap` | `var(--space-2)` (8px) | 베이직·학생 제목→첫 카드 |

---

## 수정 파일 (allowlist)

- `preview/home-ui/src/styles/tokens.css`
- `preview/home-ui/src/styles/design-system.css` — 역할 홈 구분선 제거 · 섹션 진입 pt · 베이직 제목바 pt 이중 방지
- `preview/home-ui/src/styles/home.css` — `.home-main .content-section` mb (로그인 `.parent-home-body` 중첩 포함)
- `preview/home-ui/src/styles/home-listings.css` — 티어·베이직 블록 경계 · C
- `preview/home-ui/src/styles/home-marketing-banner.css` — promo/news/mkt-wrap mb → `--home-block-gap`
- `preview/search-ui/src/styles/search-visily.css` — C만

---

## 검수

- [x] allowlist 외 `git diff --name-only` 0건
- [x] ① 전후 56px 유지 (로컬·운영 대조)
- [x] promo/news·섹션 경계 56px
- [x] 프라임/픽 **제목→카드** 8px 불변 (픽 **위** 블록 경계만 56)
- [x] 베이직 홈 8px · 검색 캐스케이드 8px
- [x] 로그인 구분선·mb — DOM 프로브 (`bb:0`, `mb:24`, heading `pt:32`)
- [x] 셀프검수에서 자식 선택자(`>`) 누락 발견 → 자손 선택자로 수정 후 재빌드

---

## Git

- 커밋: (push 후 기입)
- PR / main merge: (기입)
- Deploy to dothome: (기입)
