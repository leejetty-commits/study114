# 20 홈 속도 — SemiBold 제거 · 공지·인사 중복 요청

- 기준: `origin/main` `ce7e0ccd`
- 0단계: 600 규칙은 고치지 않는다. `font-weight: 600`은 preview 309회/46파일이라 지시서의 314회/50파일과 달랐고, 그 차이는 수정 범위가 아니다. `var(--fw-semibold)` 21회/3파일은 그대로다.
- 600은 Bold 파일로 그린다. Regular로 두면 브라우저가 가짜 굵기를 만든다.

## 바뀐 파일

- `preview/shared/fonts/pretendard.css` — 600 블록을 지우고 700 블록을 `font-weight: 600 700`
- `preview/shared/fonts/Pretendard-SemiBold.subset.woff2` — 삭제
- `preview/home-ui/src/board/board-backend.js` — `view=home&limit=3` 진행 중 요청만 공유
- `preview/home-ui/src/support/notice-store.js` — limit 3만 그 요청을 사용. 실패하면 예외
- `preview/home-ui/src/neighborhood-greeting-ui.js` — 같은 세션 주인·60초 안 원본 items 재사용
- `preview/shared/neighborhood-greeting-store.js` — 요청 없이 items 저장
- `home-news-row.js`, `main.js`는 그대로

## 중복 요청

- 공지: 홈 칸 `fetchHomeViewNotices(3)`와 `hydrateNoticeHome`이 같은 `view=home&limit=3`을 따로 불렀다. 진행 중일 때만 하나를 같이 쓰고, 끝나면 비운다. 팝업(limit 없음)은 공유하지 않는다. 로그인·로그아웃·역할 변경과 `resetNoticeCaches`는 진행 중 요청을 버린다.
- 인사: 홈 칸이 받은 원본 items를 세션 주인과 시각과 함께 둔다. `pullNeighborhoodGreetings`는 주인이 같고 60초 안이면 그 items로 localStorage만 쓴다. 주인이 다르거나 60초가 지났거나 값이 없으면 API를 다시 부른다.

## 확인

- 로컬 비로그인 홈: 공지 `view=home&limit=3` 1번, 인사 GET 1번. 폰트는 Regular·Bold만. SemiBold 요청 0. 600·700 글자 잘림(scrollWidth) 0.
- 배포 전 운영은 공지 2·인사 2·SemiBold 1이었다.
- `verify-mypage-notice-top`의 M6, `verify-home-news-row`의 공지 제목 중복 집계·trio 형제 순서는 이번 diff 밖(main.js·홈 마크업)에서 이미 어긋난다.
