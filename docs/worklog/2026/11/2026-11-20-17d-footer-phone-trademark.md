# 17d 푸터 대표전화 · 상표출원 표기

- 기준: `origin/main` `03eeaecc` (PR #282, 21h 푸터 서비스 소개 맨 앞)
- 지시: `origin/docs/footer-phone-trademark-17d:docs/worklog/grok-sync/docs/17d/17d-footer-phone-trademark.md`
- 2026-11-20. 대표전화와 상표출원 번호만 넣는다. `®`, `등록상표`, `특허`는 쓰지 않는다.

## 0단계 진단

`origin/main` `03eeaecc`에서 확인했다. 21h는 들어와 있다. `SITE_FOOTER_LINKS`와 PHP `policyLinks()`의 첫 항목은 서비스 소개다.

- `preview/shared/site-footer.js`: `phone`은 `''`, `SITE_FOOTER_COPYRIGHT`는 `© 2026 우동공과 · study114`. 102~104줄에서 `phone`이 있으면 2줄 끝에 「전화」로 붙는다.
- `src/Site/SiteFooterCopy.php`: `company()['phone']`은 `''`, `COPYRIGHT`는 같은 저작권 문구. `src/Views/partials/site-footer-legal.php`는 이미 `phone`을 출력하므로 뷰는 수정하지 않는다.
- `public/info/` 6페이지: 하단 두 번째 `info-foot__company` 끝이 이메일 `help@study114.net`이고, `info-foot__legal`은 `© 2026 우동공과 · study114`다.
- SPA 5개 `#site-biz-static`에 `이메일 help@study114.net`이 있다. `preview/home-ui/index.html` Organization JSON-LD에는 `email`만 있고 `telephone`은 없다.
- 라이브 저작권 문구의 다른 복제는 없다. `docs/worklog/grok-sync/footer-spec-v1/FOOTER-SPEC.md`는 명세 기록이라 고치지 않는다.

## 수정

허용 파일 14개만 수정했다.

- 전화 `070-4001-1422`. 저작권 줄 뒤에 ` | 상표출원 제40-2026-0229906호`.
- 안내 6페이지는 이메일 뒤에 구분선과 `전화 070-4001-1422`를 붙였다.
- SPA 5개는 `#site-biz-static` 이메일 뒤에 ` · 전화 070-4001-1422`. 홈 JSON-LD에 `"telephone":"+82-70-4001-1422"`.
- 푸터 링크 순서, CSS, `site-footer-legal.php`는 그대로다.

머지 커밋과 Deploy run 번호는 머지 뒤에 생긴다.
