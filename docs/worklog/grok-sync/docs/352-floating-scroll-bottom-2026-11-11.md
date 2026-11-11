# 352 플로팅 「맨 아래로」 버튼 추가 (2026-11-11)

- 작성: 우동공과3 · 실행·1차 셀프검수: Cursor · 최종검수: 우동공과3
- 브랜치: `work/352-scroll-to-bottom`
- 선행: 없음

## 대상
- `preview/shared/back-to-top.js` (전체 79줄) — 현재 「맨 위로」 버튼 생성·표시 로직(`syncVisibility`, `isModalOpen`, `refreshBackToTop`)
- `preview/home-ui/src/styles/design-system.css` 428~470줄 `.back-to-top` 스타일
- `preview/home-ui/src/styles/product-chrome.css` 144줄 `.back-to-top:hover`
- 호출부: `preview/home-ui/src/layout.js:9`, `preview/shared/site-chrome.js:19`, 모달 갱신 `compare-modal.js:14`, `detail-decision/detail-shell.js:42`

## 범위
1. 같은 파일(`back-to-top.js`)에서 「맨 아래로」 버튼을 함께 만든다. id 예: `study114-back-to-bottom`, aria-label·title 「맨 아래로」, 라벨 「맨아래」, 화살표 ↓.
2. 배치: **모바일(≤768px)에서만** 「맨 위로」 바로 위에 세로로 쌓기 (간격 8px). 데스크톱(>768px)에서는 표시하지 않음 → 데스크톱 0px 변화.
   - 데스크톱에도 넣을지는 ⚠ 종현 확인 필요 (권장: 모바일만).
3. 표시 규칙(맨 위로와 대칭):
   - 문서가 1뷰포트보다 길 때만 (`pageOverflows()` 재사용).
   - 맨 아래 근처(남은 거리 ≤ 96px)에서는 숨김, 그 외 표시.
   - 모달 열림(`isModalOpen()`)이면 둘 다 숨김. `isModalOpen`에 349 리뷰 모달·로그인/가입 모달·이미지 뷰어 등 현재 존재하는 모달 루트를 조사해 추가 (선택자 목록 보고).
   - `refreshBackToTop()`이 두 버튼을 같이 갱신.
4. 스크롤 동작: `prefers-reduced-motion: reduce`면 `behavior: 'auto'`, 아니면 `'smooth'`. 「맨 위로」에도 같은 규칙 적용(동작만, 모양 변경 없음).
5. 하단 고정 요소(쿠키·하단 탭·채팅 버튼·☰ 메뉴 등)와 겹치지 않는지 확인. 겹치면 bottom 값만 조정(모바일 한정).
6. z-index는 모달보다 낮게 (현 1200 유지, 모달 z-index 실측 보고).

## 필수
- 버튼 터치 영역 최소 44×44px.
- 키보드 포커스 가능, focus-visible 테두리.
- 다크 배경 위에서도 보이는지 확인.
- 검증 스크립트: `scripts/verify-back-to-bottom.mjs`(문자열·로직 검사 수준) 추가, 기존 `npm run verify:*` 중 home-ui 관련 통과.

## 금지
- 「맨 위로」의 위치·크기·색 변경 금지 (데스크톱·모바일 모두).
- 새 라이브러리 금지.
## 공통 금지 (모든 지시서 공통 · 생략 불가)
- force push, `reset --hard`, `stash drop` 금지.
- 운영 `.env`·운영 DB 쓰기는 종현 승인 없이 금지 (SELECT 조회도 운영은 승인 후).
- 키·비밀번호·토큰·세션값을 문서·커밋·로그·보고에 쓰지 않음 (테스트 계정 비밀번호 포함).
- 데스크톱 레이아웃은 1px도 바뀌면 안 됨 (데스크톱이 대상인 지시서만 예외, 그때도 대상 화면 외 0px).
- 기본 카드는 가로형 유지.
- 프로모 잠금 손대지 않음: 배너 로고, 팝업 헤더 로고, `preview/home-ui/src/promo-video-config.js`, `preview/home-ui/src/right-rail.js`·`preview/home-ui/src/styles/home-right-rail.css`의 프로모 부분.
- 개인정보 암호화 작업 금지.
- 커밋까지만. push·PR·머지는 우동공과3 최종검수 후 종현 승인으로.
- 브랜치는 `D:\work\study114` 안에서 `work/<번호>-<slug>`로 생성 (main 최신 pull 후).
- 범위 밖에서 발견한 버그는 고치지 말고 보고서 「발견 목록」에만 적음.

## 확인 (셀프검수 방법)
1. 로컬 5174에서 홈·찾기·공부방 상세·마이페이지·정보게시판 목록을 390·360 폭으로: 상단/중간/하단 위치별 스크린샷 (맨 아래 버튼 표시·숨김 확인).
2. 1920 폭 같은 화면 스크린샷 → 「맨 아래로」 없음, 기존과 픽셀 동일(가능하면 이전 캡처와 diff).
3. 상세 모달·비교 모달·리뷰 모달 열고 390 스크린샷 → 두 버튼 모두 숨김.
4. 개발자도구 Rendering에서 reduced motion 켜고 클릭 → 즉시 이동 확인(동영상 대신 설명+전후 캡처).

### 셀프검수 체크리스트
| # | 항목 | 결과 | 근거 |
|---|---|---|---|
| 1 | 390·360에서 맨위 위에 맨아래 표시 | | 스크린샷 |
| 2 | 맨 아래 근처에서 숨김 | | |
| 3 | 짧은 페이지에서 둘 다 숨김 | | |
| 4 | 모달 열림 시 둘 다 숨김 (모달 목록) | | |
| 5 | reduced motion 즉시 이동 | | |
| 6 | 1920 변화 0px, 맨아래 미표시 | | |
| 7 | 하단 고정 요소와 겹침 없음 | | |
| 8 | 44px·포커스·aria 확인 | | |
| 9 | verify PASS 수 | | |
| 10 | 공통 금지 위반 없음 | | |

## 보고
변경 파일, 추가한 모달 선택자 목록, 스크린샷 경로, 체크리스트.
## 최종검수 패키지 (우동공과3에게 넘길 것)
보고 맨 끝에 아래 형식 그대로 붙인다.
```
[최종검수 패키지 — <번호>]
브랜치 / 커밋: work/<번호>-<slug> / <hash>
변경 파일: (경로 목록, 파일별 +/- 줄 수: git diff --stat main...HEAD)
diff 요약: (파일별 1~2줄, 무엇을 왜)
테스트: (명령 → PASS n / FAIL n, 기존 회귀 포함)
스크린샷: (경로 목록, 폭 표기 1920·390 등)
API 확인: (curl 요청 → HTTP 상태, 응답 요지)
셀프검수 체크리스트: (아래 표 채운 것)
미해결·종현 결정 필요: (없으면 「없음」)
```
