# 17d — 푸터 대표전화(070) · 상표출원 표기

작성: 2026-11-20 KST (우동공과3)
선행 조건: **21h 머지·배포 완료 후 `origin/main` 최신에서 시작** (`preview/shared/site-footer.js`, `src/Site/SiteFooterCopy.php`, `public/info/*/index.html`이 21h와 겹침).

## 0. 먼저 진단만 하고 보고한 뒤 작업
`origin/main`에서 아래 13개 파일의 현재 상태를 확인해 보고한다.
- `preview/shared/site-footer.js`: `SITE_FOOTER_COMPANY.phone`이 `''`인지, `SITE_FOOTER_COPYRIGHT`가 `'© 2026 우동공과 · study114'`인지, `phone`이 있으면 2줄 끝에 「전화」로 붙는 코드(약 102~104줄)가 있는지 확인.
- `src/Site/SiteFooterCopy.php`: `company()['phone']`이 `''`인지, `COPYRIGHT`가 `'© 2026 우동공과 · study114'`인지 확인. (`src/Views/partials/site-footer-legal.php`에 이미 `'phone'` 출력 코드가 있으므로 PHP 뷰 파일은 건드리지 않는다.)
- `public/info/` 6개 파일(`index.html`, `study-room/index.html`, `tutor/index.html`, `parents/index.html`, `edu-office/index.html`, `franchise/index.html`):
  - 하단 `<div class="info-foot__biz">` 두 번째 `<p class="info-foot__company">` 끝에 `<span>이메일 <a href="mailto:help@study114.net">help@study114.net</a></span>`이 있는지,
  - `<p class="info-foot__legal">© 2026 우동공과 · study114</p>`가 있는지 확인.
- 5개 SPA `index.html`(`preview/home-ui/index.html`, `preview/auth-ui/index.html`, `preview/search-ui/index.html`, `preview/study-room-ui/index.html`, `preview/tutor-ui/index.html`):
  - `#site-biz-static` 안 `이메일 help@study114.net</p>` 줄과 `preview/home-ui/index.html`의 Organization JSON-LD(`"email":"help@study114.net"`) 확인.
- 21h 변경(푸터 「서비스 소개」 맨 앞)이 `origin/main`에 이미 들어와 있는지도 같이 확인. (안 들어와 있으면 멈추고 보고. 다른 파일에 회사정보/푸터가 더 있으면 고치지 말고 멈추고 보고.)

## 1. 허용 파일 (이것만 수정)
1. `preview/shared/site-footer.js`
   - `SITE_FOOTER_COMPANY.phone`: `''` → `'070-4001-1422'`
   - `SITE_FOOTER_COPYRIGHT`: `'© 2026 우동공과 · study114'` → `'© 2026 우동공과 · study114 | 상표출원 제40-2026-0229906호'`
   - **주의:** `®`, `등록상표`, `특허` 표기 금지. `21h`의 `SITE_FOOTER_LINKS` 순서는 유지.
2. `src/Site/SiteFooterCopy.php`
   - `company()['phone']`: `''` → `'070-4001-1422'`
   - `COPYRIGHT`: `'© 2026 우동공과 · study114'` → `'© 2026 우동공과 · study114 | 상표출원 제40-2026-0229906호'`
3. `public/info/` 6개 파일(`index.html`, `study-room/index.html`, `tutor/index.html`, `parents/index.html`, `edu-office/index.html`, `franchise/index.html`)
   - 하단 두 번째 `<p class="info-foot__company">`의 이메일 `<span>` 뒤에 아래 두 줄 추가:
     ```html
     <span class="sep" aria-hidden="true">|</span>
     <span>전화 070-4001-1422</span>
     ```
   - `<p class="info-foot__legal">` 문구 교체:
     `© 2026 우동공과 · study114 | 상표출원 제40-2026-0229906호`
4. 5개 SPA `index.html`(`preview/home-ui/index.html`, `preview/auth-ui/index.html`, `preview/search-ui/index.html`, `preview/study-room-ui/index.html`, `preview/tutor-ui/index.html`)
   - `#site-biz-static` 안 `이메일 help@study114.net</p>`를 `이메일 help@study114.net · 전화 070-4001-1422</p>`로 수정.
   - `preview/home-ui/index.html`의 Organization JSON-LD에 `"telephone":"+82-70-4001-1422"` 추가.
5. 작업기록 `docs/worklog/2026/11/2026-11-20-17d-footer-phone-trademark.md`

## 2. 하지 말 것
- CSS 파일 수정 금지. `src/Views/partials/site-footer-legal.php` 수정 금지.
- 푸터 링크 순서·정책 문구·사업자번호 링크 수정 금지.
- 홈 로딩 속도에 영향 주는 스크립트/폰트/번들 변경 금지.

## 3. 수락 기준
- 운영 홈, `/info/` 6개 페이지, 로그인 화면(PHP 푸터) 모두 하단 2줄 끝에 `전화 070-4001-1422`가 보이고, 저작권 줄에 `상표출원 제40-2026-0229906호`가 보인다.
- `®` 또는 `등록상표`가 어디에도 없다.
- 5개 SPA HTML `#site-biz-static`에도 `전화 070-4001-1422`가 들어 있다.
- 변경 파일 목록이 허용 파일 14개(코드·HTML 13개 + 작업기록 1개)와 정확히 일치.
- 375 폭 스크린샷(홈 푸터, `/info/` 푸터) 첨부, PR·머지·배포 후 PR 번호, main 머지 커밋, Deploy run 번호 보고.
