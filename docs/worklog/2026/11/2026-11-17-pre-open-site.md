# 오픈 전 사이트 (2026-11-17)

지시서: `origin/docs/pre-open-site-2026-11-17` 의 `docs/worklog/grok-sync/docs/pre-open-site-2026-11-17.md`.
기준: `origin/main` `3fab37196e26a7b51e87030b7dc94edd68fd8bfd`.
브랜치: `work/pre-open-site-2026-11-17`. 사용자 합격. 정적 사업자정보의 「· 전화」는 번호가 정해질 때까지 뺐다.

## 커밋

| 커밋 | 내용 |
|------|------|
| `2b50d201` | 우편번호 스크립트 `t1.kakaocdn.net`. `daum.Postcode` 폴백 유지. 로컬 Vite CSP에만 kakaocdn |
| `27a90be9` | 푸터 라벨 「요금 안내」→「유료상품」. href 유지 |
| `b2c9cdd9` | 다섯 앱 `index.html` 정적 사업자정보. 푸터에 「사업자정보확인」. 전화번호 비움. JS 푸터가 그려지면 `#site-biz-static` 제거 |
| `ae84d968` | 비로그인 `#/about`. 푸터 「서비스 소개」 |
| `c26833bc` | 공부방 홈 오른쪽 지역 카드 제거. 지도 위 박스에 학생 수. 홈만 박스 가로폭. 홍보지역 알약 |
| `a403509a` | 소개 제목이 보이게. 고객센터 앱 클래스는 제목 칸을 숨기므로 쓰지 않음 |

## 수락

1. 홈 빌드 성공. 엔트리 `660363` → `662081` 바이트 (`index-XSiTA69Y.js`). 소개 화면은 별도 청크 `about-*.js` 1.21 kB.
2. 로컬 프리뷰 `http://127.0.0.1:4174/#/about`: 제목·본문·유료상품·고객센터 링크가 보인다. 유료상품 링크는 `#/plans`로 열린다. 로그인으로 보내지 않는다.
3. JS가 뜬 뒤 푸터는 하나다. 라벨은 이용약관·개인정보 처리방침·플랫폼 고지·유료상품·환불정책·서비스 소개·고객센터. 전화번호는 없다. view-source 에는 `#site-biz-static` 과 사업자정보확인이 있다.
4. 지도 질의 검사: 「홈은 주소 선택이 있어도 대표 슬롯」 통과. 고른 인덱스가 있을 때만 그 슬롯을 쓴다.
5. 로그인 공부방 홈·공부방찾기 화면 스크린샷은 이 세션에서 하지 못했다. 계정이 없다.

## 학생 수

`region-stats.php` 는 POST만 받고, 게스트 대치·강남 고정이다. 로그인 화면은 그 함수를 쓰지 않는다. API 파일은 안 바꿨다. 학생 수는 고른 슬롯의 `region_id` 로 기존 `search.php` `total` 을 읽는다. 목록 길이(limit 20)는 세지 않는다. 실패하면 `—`.

## 운영 CSP (종현, 레포 밖)

위치: Cloudflare Response Header Transform. zone `study114.net`. ruleset `132970d7c91c492d848cef06caa75d26` (`http_response_headers_transform`). rule `857266f312294446b4c30520efd0ef68`. 기록 `docs/worklog/2026/11/2026-11-11-345-csp-kakao-postcode.md`.

추가: `https://t1.kakaocdn.net` 를 `script-src`, `connect-src`, `frame-src` 에 넣는다. `t1.daumcdn.net`·`*.daumcdn.net`·`postcode.map.daum.net`·`postcode.map.kakao.com` 은 유지. `unsafe-inline` / `unsafe-eval` 추가 금지. `.htaccess` 에 CSP를 넣지 않는다.
