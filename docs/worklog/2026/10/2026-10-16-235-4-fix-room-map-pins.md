# 235-4 fix — 핀 누르는 칸·그림 크기·상세 상태 (2026-10-16)

기준: `main` `14a5316648ddcc21da39aee23e26b81c79a93a84`. 브랜치 `cursor/room-map-pin-fix-20261016`. main에 올리지 않음. 이 세션은 승인하지 않음.

## 지시

1. `naver-map.js` `makePinIcon` 누르는 칸 44×52, anchor (22, 52). `home.css` `.naver-map-pin` 같은 크기, `padding-bottom` 0.
2. 핀 그림을 약 64×120, 몇 KB로 줄여 `preview/home-ui/public/assets/brand/src/udong-pin.png` 교체. auth-ui 복사본 삭제.
3. `search.css` 등에 남은 옛 핀 스타일이 쓰이지 않으면 삭제.
4. 공개 상세 API에 `profile_status`를 넣거나, 찜에서 연 상세에도 핀이 나오는지 확인하고 보고.
5. `b71343ae`의 두 절을 부록 A대로 붙여 문서 커밋. 문서는 main 직행 가능.
6. 좌표 채우기 화면 `room-coords-once.html` / `.js` 삭제.

## 한 일

- 누르는 칸 44×52, anchor는 가로의 절반·세로 끝 `(22, 52)`. 그림은 그대로 16×30, 누르면 20×38. 여백 없음.
- 핀 그림 415×604(17,682바이트)를 비율을 유지해 64×93 PNG(6,197바이트)로 줄였다. 같은 파일을 `public/assets/brand/src/udong-pin.png`에도 넣었다. 페이지가 부르는 주소가 그 파일이라서다. auth-ui 복사본은 삭제.
- 쓰이지 않던 옛 핀: `search.css`의 `.map-block__pin[data-map-pin]`, `home.css`의 물방울 핀(`.map-block__pin`, `.map-block__center-pin`, `.map-block__pin--*`). `search-map.js`의 `data-map-pin-id` 조회도 지웠다. 카드 강조(`.expo-card.is-map-focused`)는 그대로다.
- `StudyRoomPublicReadService` 응답에 `profile_status`를 넣었다. 조회에는 이미 있었고 응답에만 빠져 있었다. 값은 DB 그대로(초안이면 `draft`).
- `room-coords-once.html`, `room-coords-once.js` 삭제. 235-3 기록은 그대로 둔다.

## 상세·찜 핀

찜에서 연 확대 지도는 공개 상세 API를 쓰지 않는다. 찜 카드는 검색 카드와 같은 `SearchService::publicCardsByIds`이고, 그 카드에 `profile_status`와 위도·경도가 있다. 화면은 `mapSearchRoomItem`이 `profile_status: 'published'`와 좌표를 넘긴 뒤 `bindStudyRoomMapSection`으로 핀을 찍는다. 공개된 공부방이고 좌표가 있으면 찜에서 연 상세에도 핀이 나온다. 로그인 화면으로 다시 누르지는 못했다.

공개 상세 API(`public.php` → `StudyRoomPublicReadService`)는 마이샵 본문에 쓰이고, 그 화면에는 지도가 없다. 이번 필드는 그 응답을 지도에 쓸 때 초안을 게시로 오인하지 않게 하려는 것이다.

## 문서 두 절

`b71343ae`는 origin/main, 이 저장소, `study114-docs`에 없다. GitHub 조회도 422. 부록 A 본문도 없다. 두 절(호스팅 문서 「뉴아우토반 요금표와 개발 기간 결정」, 193 문서 「2026-10-16 지도 핀 좌표 조사·결정」)은 지어 넣지 않았다. 문서 커밋 없음.

## 확인

로컬 미리보기에서 13번 좌표(37.4977414, 127.0650701)에 핀을 찍었다. 누르는 칸은 44×52, 누르면 그림 20×38, `padding-bottom` 0px, 그림 아래와 칸 아래가 같다. 같은 주소 `서울 강남구 삼성로 212`를 지도에서 찾으면 위도·경도가 저장값과 같고, 핀 끝은 한보은마아파트 위다. 파란 테두리는 확인용이고 커밋하지 않았다.

main 푸시 없음. 배포 없음.
