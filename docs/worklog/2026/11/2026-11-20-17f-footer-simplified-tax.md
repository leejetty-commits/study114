# 17f 푸터 간이과세자 표기

- 기준: `origin/main` `0c9f06a9` (PR #284)
- 2026-11-20. 사업자등록번호 바로 뒤에 `(간이과세자)`를 붙인다.

## 0단계 진단

표시용 `471-29-01819`는 아래 파일에만 있다.

- `preview/shared/site-footer.js` `bizNo`. 화면은 이 값 뒤에 사업자정보확인 링크를 붙인다. 링크 주소는 `SITE_FOOTER_BIZ_CHECK_URL`이다.
- `src/Site/SiteFooterCopy.php` `company()['bizNo']`. `src/Views/partials/site-footer-legal.php`가 이 값을 출력한 뒤 같은 링크를 붙이므로 뷰는 수정하지 않는다.
- `public/info/` 6페이지의 사업자등록번호 문구.
- SPA 5개 `#site-biz-static`의 같은 문구.

확인 링크의 `wrkr_no=4712901819`는 표시 문구와 별도다. CSS는 바꾸지 않는다.

## 수정

보이는 번호는 `471-29-01819(간이과세자)`다. 사업자정보확인 링크와 주소는 그대로다.

머지 커밋과 Deploy run 번호는 머지 뒤에 생긴다.
