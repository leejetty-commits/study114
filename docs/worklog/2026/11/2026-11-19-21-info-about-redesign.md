# 21 푸터 서비스 소개를 /info/로 모으고 디자인

- 기준: `origin/main` `497cdd35` (PR #272)
- 지시서: `origin/docs/reapply-2026-11-17` `docs/handoff/21-info-about-redesign.md`
- 승인: 2026-11-19 고칠 방법 1~5

## 0단계

멈춤 사유 없음. `link()`는 해시·absolute만 있었고 `href` 칸이 없었다. 속성이 없는 `<a href="/info/">`는 클릭 가로채기 대상이 아니다. `about.js`는 동적 import다. 허용 8개 파일 안에서 끝낸다.

## 고친 방법

1. `preview/shared/site-footer.js` 소개 항목을 `{ href: '/info/', label: '서비스 소개' }`로 바꿨다. `link()`는 `item.href`가 있으면 `data-nav`·`data-util-href` 없이 `<a href="/info/">`만 반환한다. 유료상품 항목은 그대로다.
2. `src/Site/SiteFooterCopy.php` 정책 링크의 서비스 소개 href를 `/info/`로 바꿨다.
3. `preview/home-ui/src/about.js` `renderAbout()` 첫 줄에서 `window.location.replace('/info/')` 후 `''`를 반환한다.
4. `public/info/` 네 장은 페이지 안 `<style>`만 바꿨다. 기존 title·description·canonical·og·h1·h2·본문 문장은 유지했다. 유료 노출 문장은 `유료 노출 상품이 있으며 자세한 내용은 로그인 후 안내합니다.` 그대로이고 가격 숫자는 없다. 주소 라벨은 `주소`다. 전화는 그리지 않는다.
5. 이 기록.

## 고치기 전 비로그인 홈 (운영)

`https://study114.net/?v=21base#/guest`

- CSS 1: `/assets/index-578MdkTO.css`
- 우리 JS 2: `/assets/index-ZByK04a_.js`, `/assets/session-snapshot-Vf7FZHsK.js`
- 폰트 2: Pretendard Regular, Pretendard Bold
- about 청크 0, `/info/` 0

## 로컬 확인

- 네 장 375·1440 스크린샷: `D:\work\study114-shots\21-info\` (`info`, `study-room`, `tutor`, `parents` × `375`·`1440`). 375에서 소개 카드는 1열, 1440에서 3열. 가로 넘침 0. 외부 CSS·JS·웹폰트 0. 로고 `/assets/brand/logo-wordmark-2026.png`만 요청.
- 홈·공부방 등록·과외쌤 등록 푸터의 서비스 소개는 `href="/info/"`이고 `data-nav`·`data-util-href`·`data-action`이 없다. 클릭은 경로 `/info/`로 이동한다.
- `#/about` 경로는 `/#/about` → `/info/`. `/about` 경로는 `/about` → `/#/about` → `/info/`. 로컬 Vite는 `/info/`에 SPA를 다시 띄워 해시가 붙는다. 운영 정적 파일에서는 그렇게 되지 않는지 배포 뒤에 다시 본다.
- 홈·공부방·과외쌤 첫 화면에서 `/info/` 페이지 요청과 `about.js` 요청은 0이었다.

머지 커밋과 Deploy run 번호는 머지 뒤에 생긴다.
