# 실시간 퀵매칭 홍보 (2026-11-17)

- 지시: `origin/docs/quickmatch-promo-2026-11-17` 의 `docs/worklog/grok-sync/docs/quickmatch-promo-2026-11-17.md`
- 기준: `origin/main` `3237f574`
- 워크트리: `D:\work\study114\.wt\work-quickmatch-promo` · 브랜치 `work/quickmatch-promo`
- 머지·배포 없음. PR만.

## 지시와 다른 점 (이번 요청)

비프라임 퀵매칭 메뉴와 NEW는 `#/promo/quick-match`로 보내지 않는다. 마이페이지 좌측 메뉴·상단을 유지한 채 본문에 같은 소개를 지연 청크로 넣는다. 소개를 보여주는 동안만 우측 배너레일을 빼고 그 폭을 본문에 준다. 본문 폭이 640px 아래면 사진·3단계가 1단이 된다. 소개 마크업은 `quick-match-view.js` 한 곳이고 `#/promo/quick-match`와 같이 쓴다.

## 구현

- 공부방·과외쌤 카탈로그 카드 4장 앞에 퀵매칭 칸. 기존 베이직·마이샵·프라임·픽 문구는 그대로.
- `#/promo/quick-match` 게스트 공개. 비프라임 CTA는 `#/plans/positions`. 프라임이면 `#/mypage/quick-match`.
- 마이페이지 메뉴에 NEW. 프라임은 금색, 그 외는 회색. 프라임은 설정 화면과 `GET /api/quick-match/settings.php` 재확인을 유지.
- 새 CSS는 `promo/quick-match.css`. `main.js`의 `promo-catalog.css`·`promo-v2.css`에는 규칙을 넣지 않았다.
- 실사는 기존 `/assets/promo/room-classroom.webp`. 가격·「최초」「유일」「1위」·학교명 없음.

## 빌드

홈 엔트리 JS: 변경 전 `index-CezyXfCD.js` 664.42 kB → 변경 후 `index-BpCP4q0u.js` 664.74 kB (+0.32 kB, 랜딩 목록 한 줄).

소개 JS는 엔트리 밖 `quick-match-view-CDJcFYw6.js` 3.18 kB, 카피 `quick-match-content-CTxlv89r.js` 1.26 kB. 마이페이지는 소개를 열 때 이 청크를 받는다.

CSS는 프로젝트 설정 `cssCodeSplit: false` 때문에 엔트리 스타일 한 파일에 합쳐진다. 672.05 kB → 676.03 kB.

## 확인

로컬 프리뷰에서 비로그인으로 확인했다.

- 공부방 카탈로그 1280: 퀵매칭 칸이 카드 4장보다 위. 사진·말풍선·3단. 캡처 `shots-quickmatch-promo/catalog-1280.png`
- 공부방 카탈로그 390: 사진·단계 1단. `catalog-390.png`
- 소개 1280·390: CTA `프라임으로 시작하기` → `#/plans/positions`. `intro-1280.png` `intro-390.png`
- 과외쌤 카탈로그에도 같은 칸. 3단.
- `prefers-reduced-motion: reduce`에서 말풍선 `animation-name`은 `none`.

로그인된 마이페이지의 NEW·금색/회색·레일 숨김은 화면 캡처를 하지 못했다. 레일은 `#/mypage/quick-match`에서 소개를 그릴 때만 `slotKey`를 비운다.

## 캡처

`docs/worklog/2026/11/shots-quickmatch-promo/`
