# 01. #227 다시 넣기 — 사업자정보·서비스 소개·푸터 「유료상품」

오픈 필수(KG이니시스 심사). #234 다음, 가장 먼저.

## 목적

PR #227(`1823d2b5`)을 그대로 되살린다. 코드 수정은 하지 않는다.
#227은 원인이 아니었다. #238로 빼도 상세등록 멈춤이 그대로였고, 원인은 #224 `main.js` 한 줄(#239로 수정)이었다.

들어오는 것:
- 다섯 앱 `index.html`의 정적 사업자정보 `#site-biz-static`(소스 보기에 보임). JS 푸터가 그려지면 지운다.
- 푸터 「사업자정보확인」 링크(공정위 `bizCommPop.do?wrkr_no=4712901819`). PHP 푸터에도.
- 비로그인 공개 `#/about`(서비스 소개), 푸터 「서비스 소개」.
- 푸터 라벨 「요금 안내」→「유료상품」(href 그대로).
- 우편번호 스크립트 `t1.daumcdn.net`→`t1.kakaocdn.net`. 운영 CSP에 이미 있음(11-17 14:4x KST 확인).
- 같은 PR에 묶인 공부방 홈 변경(`c26833bc`): 오른쪽 지역 카드 제거, 지도 박스 학생 수, 홍보지역 알약 번호(`studyRoomPromoIndex`). 02(#228)가 이것에 기대므로 같이 들어와야 한다. 따로 빼지 않는다.

## 명령 (PowerShell)

```
git fetch origin
git switch -c work/reapply-227 origin/main
git revert --no-edit a0c93484
```

이어서 **화면 깜빡임 수정 커밋 1개**를 더 만든다(아래 「깜빡임 수정」). 그다음 `npm run build:dothome`.

#234가 먼저 머지됐으면 그 main 위에서 한다. 박스에서 #234 위 적용 충돌 없음 확인.

## 깜빡임 수정 (11-17 종현 지적 반영)

증상: 메뉴를 옮길 때 사업자정보 글자가 잠깐 비쳤다. 원인은 `#site-biz-static`가 JS보다 먼저 그대로 화면에 그려지기 때문이다.

수정: 다섯 `index.html`의 여는 태그 한 줄만 아래처럼 바꾼다. 문구·순서·링크는 그대로. 소스 보기에는 그대로 보이고, 화면에는 JS 푸터 하나만 보인다.

```
<div id="site-biz-static" style="position:absolute;width:1px;height:1px;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0">
```

- 커밋 메시지: `fix(site): hide static biz block on screen to stop flash`
- 이 커밋은 다섯 `index.html` 외 파일 금지. `display:none`·`hidden` 속성은 쓰지 않는다(심사·검색이 숨긴 글로 볼 수 있음).
- `site-footer.js`가 그릴 때 지우는 동작은 그대로 둔다.

## 허용 파일 (revert가 바꾸는 것만)

`preview/{auth,home,search,study-room,tutor}-ui/index.html`, `preview/home-ui/src/{about.js,find-state.js,main.js,state.js,study-room-home-seed.js,screens/study-room.js,styles/home-listings.css}`, `preview/home-ui/vite.config.js`, `preview/search-ui/src/{search-find-surface.js,search-map.js,styles/search-visily.css}`, `preview/shared/{kakao-postcode.js,route-access.js,site-footer.js}`, `src/Site/SiteFooterCopy.php`, `src/Views/auth/{partials/basic-study-room.php,signup-form.php}`, `src/Views/partials/site-footer-legal.php`, `docs/worklog/2026/11/2026-11-17-pre-open-site.md`.

PR 본문용 점검 기록 1개만 추가 허용: `docs/worklog/2026/11/2026-11-17-reapply-227.md`.

## 금지

- revert 결과에 손대지 않는다. 충돌이 나면 멈추고 보고(손으로 풀지 않는다).
- `main.js`에서 revert가 넣는 `/about` 관련 줄 외 변경 금지. capture 클릭 가로채기(지금 581~606줄)는 그대로.
- 사업자정보 문구·번호를 바꾸지 않는다. 전화번호는 넣지 않는다(미정).
- `.htaccess`에 CSP를 넣지 않는다.

## 위험 점검 (diff 직접 읽음)

- `main.js`: `/about` 라우트 분기·부트 추가만. capture·preventDefault 없음.
- `state.js bootstrapAboutRoute`: 경로 `/about`이고 해시가 없을 때만 `location.replace` 1회. 반복 없음.
- `site-footer.js renderSiteFooter`: 그릴 때 `#site-biz-static`를 지운다. 다시 그리기 없음.
- `study-room-home-seed.js readStudyRoomRegionStudentCount`: 결과를 글자로만 넣고 rerender하지 않는다. 성공값은 캐시. 실패하면 다음 그리기 때 한 번 더 부를 뿐 반복은 없다.
- `screens/study-room.js` 알약 클릭: `bootStudyRoomHome` + `rerender` 1회. 같은 알약이면 무시.
- 실측: #237 직후(#224~#227 운영) 공부방찾기 정상(Cursor `after-228-search-room.png`).

## 수락

1. 00-INDEX 「공통 수락 점검」 전부(공부방·과외쌤·학생, 메뉴 실클릭).
2. 메뉴 이동 중(세 계정·비로그인, 일반·시크릿) 사업자정보 글자가 화면에 비치지 않는다.
3. 비로그인: 소스 보기에 사업자정보·「사업자정보확인」. 화면엔 푸터 하나만. 푸터 라벨 순서: 이용약관·개인정보 처리방침·플랫폼 고지·유료상품·환불정책·서비스 소개·고객센터.
4. 비로그인 `#/about` 열림, 로그인으로 보내지 않음. 거기서 유료상품·고객센터·메인 홈 링크 동작.
5. 「사업자정보확인」 새 탭으로 공정위 페이지.
6. 공부방 가입·기본정보의 주소 검색 팝업이 열림(kakaocdn).
7. 로그인 공부방 홈: 알약 누르면 지도·박스·카드가 그 동으로 바뀜. 지도 박스 학생 수가 숫자 또는 「—」.

## 되돌리기

`git revert -m 1 <이 PR merge 커밋>`으로 새 PR.
