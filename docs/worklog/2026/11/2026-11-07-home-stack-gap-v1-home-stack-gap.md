# home-stack-gap-v1 — 홈 상단 스택 여백 통일(① 기준)

**과제ID:** home-stack-gap-v1  
**날짜:** 2026-11-07  
**브랜치:** `feat/home-stack-gap-v1`  
**위험도:** 낮음 (CSS·allowlist 한정)

---

## 지시 요점

- **①** = 본문 시작 ~ 3칸 상단 (`.home-body` padding-top)  
- **②** = 3칸 ~ 공지·동네인사 · **③** = 뉴스 ~ 지도 → ①과 동일 합산  
- C·L은 home-block-gap-v1에서 이미 적용 → 이번 과제에서 재확인만

---

## ①②③ px 표 (게스트 `#/guest`)

| 뷰포트 | ① (헤더~3칸) | ② (3칸~뉴스) | ③ (뉴스~지도) |
|--------|--------------|--------------|----------------|
| 전 1280 | ≈12 | 56 | 56 |
| 후 1280 | 12.4 | **12** | **12** |
| 후 768 | 12.2 | **12** | **12** |
| 후 390 | 12.2 | **12** | **12** |

토큰: `--home-stack-gap: var(--space-3)` (12px)  
지도→프라임(`--home-block-gap` 56px) **무변경**.

---

## 수정 파일

- `preview/home-ui/src/styles/tokens.css` — `--home-stack-gap` 추가  
- `preview/home-ui/src/styles/home.css` — `.home-body` 상단 패딩 → stack-gap  
- `preview/home-ui/src/styles/home-marketing-banner.css` — promo/news/mkt-wrap mb → stack-gap  

---

## Git

- 브랜치 커밋: `e9aa7e01`
- PR: [#107](https://github.com/leejetty-commits/study114/pull/107) squash → main `cf0fdf80`
- Deploy to dothome: run `42364070096` success (2026-11-07)
