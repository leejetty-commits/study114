# 21f /info/ 교육청·프랜차이즈 안내

- 기준: `origin/main` `dfae67f4` (PR #278)
- 지시: `origin/docs/info-pages-21f:docs/worklog/grok-sync/docs/21f/21f-info-edu-franchise-pages.md`
- 본문 정본: 같은 폴더의 `edu-office-content.md`, `franchise-content.md`. 문장은 고치지 않았다.

## 0단계 진단

`public/info/study-room/index.html` 껍데기를 확인했다.

- head: charset, viewport, title, description, canonical, og, 인라인 `<style>`만 있다. 외부 CSS·글꼴·스크립트는 없다.
- 헤더: 심벌 `udong-symbol-2026.png`(`alt=""`, 64×93) + 워드마크 `logo-wordmark-2026.png`(`alt="우동공과"`, 297×96). 링크는 `/`. 스타일은 워드마크 32px, 심벌 `32px * 1.05`, 간격 4px, 아랫선 맞춤.
- 푸터: 링크 7개, 고지, 회사 정보. 인라인 스타일만으로 그려진다.
- 교육청 16곳, 프랜차이즈 브랜드 14곳은 정본의 `###`와 같다. 기존 파일을 수정하지 않아도 새 HTML 2개와 이 기록으로 만들 수 있다.

## 확인

- 바뀐 파일은 허용 3개뿐이다.
- 두 페이지에 `<script` 가 없다.
- 정본 링크: edu-office 53개, franchise 29개. HTML에 URL이 모두 있다.
- 헤더·푸터 마크업은 study-room과 같다.
- 375·1440 가로 넘침 0. 심벌 23.11×33.6, 워드마크 99×32, 간격 4px. summary 높이 55px.
- 스크린샷: `C:\Users\jetty\AppData\Local\Temp\21f-shots\`
  - `edu-office-1440-collapsed.png`, `edu-office-1440-open.png`, `edu-office-375-collapsed.png`, `edu-office-375-open.png`
  - `franchise-1440-collapsed.png`, `franchise-1440-open.png`, `franchise-375-collapsed.png`, `franchise-375-open.png`

머지 커밋과 Deploy run 번호는 머지 뒤에 생긴다.
