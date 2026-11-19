# 21e /info/ 헤더에 메인과 같은 심벌

- 기준: `origin/main` `2dfc8d7b` (PR #277)
- 2026-11-20. `/info/` 네 HTML의 헤더 로고 링크와 그 인라인 스타일만 고쳤다. 본문과 푸터는 그대로다.

## 지시 원문

0단계: 먼저 진단만 하고 보고한 뒤 작업해. 메인 헤더의 brand-lockup(심벌 udong-symbol-2026.png + 워드마크 logo-wordmark-2026.png)의 마크업과 CSS 값(높이·간격·정렬)을 확인해서 보고해.
작업: /info/ 네 HTML(public/info/index.html, study-room/, tutor/, parents/)의 헤더 로고 링크 안에, 워드마크 앞에 심벌 이미지를 메인과 같은 크기·간격으로 넣어. 심벌 img는 alt="" (워드마크 alt="우동공과" 유지), width·height 속성 지정. 인라인 style만 수정, JS·외부 CSS·글꼴 추가 금지.
본문 문장과 푸터는 건드리지 마. 허용 파일 밖이 필요하면 멈추고 보고해.
확인: 375·1440에서 메인 헤더와 나란히 스크린샷 비교, 가로 넘침 0, 로고 클릭 시 / 이동.
작업 기록 docs/worklog/2026/11/2026-11-20-21e-info-header-symbol.md 를 남기고, 바뀐 파일이 이 5개뿐인지 확인한 다음 PR·머지·배포 후 PR 번호, main 머지 커밋, Deploy run 번호를 보고해. Cloudflare 캐시는 하지 마.

## 진단 (origin/main `preview/home-ui/src/styles/home.css`)

메인 헤더 로고는 `.brand-lockup`이 아니라 `.home-header__logo`다.

```html
<a href="…" class="home-header__logo" aria-label="우동공과 홈">
  <img src="/assets/brand/udong-symbol-2026.png" alt="" class="home-header__symbol"><img src="/assets/brand/logo-wordmark-2026.png" alt="우동공과" class="home-header__wordmark">
</a>
```

- `.home-header__logo`: `display: flex`, `align-items: flex-end`, `gap: 4px`, `text-decoration: none`
- 워드마크 높이 `--home-header-wordmark-h: 32px`
- 심벌 높이 `calc(32px * 1.05)` = 33.6px, `width: auto`, `flex-shrink: 0`
- 워드마크 `height: 32px`, `width: auto`, `flex-shrink: 0`
- 원본 크기: 심벌 64×93, 워드마크 297×96
- 화면 크기(1440·375 동일): 심벌 23.11×33.6, 간격 4px, 워드마크 99×32, 아랫선 맞춤
- 375 이하에서는 태그라인만 `display: none`. 로고 크기는 바뀌지 않는다.
- `/info/`는 워드마크만 있었고 `.logo { display: block; height: 32px; width: auto; }`

## 확인

- 375·1440에서 네 페이지 로고: 심벌 23.11×33.59, 워드마크 99×32, 간격 4px, 아랫선 차이 0. 운영 홈 로고와 같다.
- 네 페이지 모두 375·1440 가로 넘침 0. 운영 홈도 1440·375 가로 넘침 0.
- 로고 링크는 `/`. 클릭하면 그 주소로 이동한다.
- 심벌 `alt=""`, `width="64"` `height="93"`. 워드마크 `alt="우동공과"`, `width="297"` `height="96"`.

머지 커밋과 Deploy run 번호는 머지 뒤에 생긴다.
