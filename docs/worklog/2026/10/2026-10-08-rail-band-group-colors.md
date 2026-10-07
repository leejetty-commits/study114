# 2026-10-08 우측 레일 배너 띠 및 읽기 팝업 그룹별 색상 분기

## 1. 지시서 원문

> 우측 레일 배너의 위쪽 띠(`.live-rail-slot__band`) 색을 기존 파랑(`var(--uds-primary)`)에서 역할별 시안 승인 색상으로 분기 적용.
> 색상 배정:
> - 커뮤니티: `.live-rail-slot--best` (이달의 베스트), `.live-rail-slot--room` (공부방/과외쌤/학생·학부모 고민방) -> `#6d28d9` (보라)
> - HOT: `.live-rail-slot--field` (지금 고민 HOT / 많이 보는 고민 등) -> `#be123c` (진홍)
> - 정보게시판: `.live-rail-slot--info` (공부방 쏙쏙정보, 과외쌤 따끈 팁가이드, 학생 꿀팁 가이드) -> `#475569` (회청)
> - 안내: `.live-rail-slot--action` (이번 시즌 추천 행동 등) -> 파랑 유지 (`var(--uds-primary, #3b82f6)`)
> - 읽기 팝업 (`.rail-popup`, `preview/home-ui/src/rail-popup.js`):
>   - 루트 요소 `<div id="rail-popup" class="rail-popup" data-rail-popup-kind="...">`
>   - `data-rail-popup-kind`: `'concern-room'`, `'concern-best'` -> 커뮤니티 보라(`#6d28d9`)
>   - `data-rail-popup-kind`: `'info-board'` -> 정보게시판 회청(`#475569`)
>   - `data-rail-popup-kind`: `'notice'` -> 파랑 유지
>   - 적용 대상: `.rail-popup__head` 배경, `.rail-popup__category` 글자색, `.rail-popup__go` / `.rail-popup__login` 버튼 배경, 현재 페이지 버튼 `.rail-popup__page[aria-current='page']` 배경·테두리, 목록 항목 hover/현재 글 제목색
> 
> 규칙:
> 1. 마크업(HTML/JS) 수정 금지 (CSS만 수정).
> 2. CSS 변수 기반 구조 유지 (`--rail-tone`).
> 3. 덮어쓰기 규칙 조사.
> 4. 배포·품질 검증 통과 (11개 항목 및 dothome 빌드).
> 5. 검증 캡처: 홈 화면(게스트 및 각 역할 중 최소 1개)에서 레일이 노출되는 상태를 headless Edge 또는 정적 하네스로 캡처해 임시 폴더에 보관 (이 폴더는 커밋 금지). 색 구분이 눈으로 확인되는지 보고에 명시.
> 6. worklog 작성: `docs/worklog/2026/10/2026-10-08-rail-band-group-colors.md`
> 7. 커밋·push: 브랜치 `cursor/rail-band-group-colors-20261008` (커밋 메시지: `style(rail): 레일 배너 띠·읽기 팝업을 그룹별 색으로 나눈다`)

---

## 2. 변경 파일 및 상세

### 수정한 파일
- `preview/home-ui/src/styles/home-right-rail.css`

### 주요 변경 내용
1. **토큰 선언**:
   - `:root`에 그룹별 시안 승인 색상 변수 추가:
     - `--rail-tone-community: #6d28d9;` (커뮤니티 보라)
     - `--rail-tone-hot: #be123c;` (HOT 진홍)
     - `--rail-tone-info: #475569;` (정보게시판 회청)
2. **슬롯 그룹별 톤 바인딩**:
   - `.live-rail-slot--best`, `.live-rail-slot--room`: `--rail-tone: var(--rail-tone-community);` 및 `border-left: 2px solid var(--rail-tone, var(--uds-primary));`
   - `.live-rail-slot--field`: `--rail-tone: var(--rail-tone-hot);` 및 `border-left: 2px solid var(--rail-tone, var(--uds-primary));`
   - `.live-rail-slot--info`: `--rail-tone: var(--rail-tone-info);` 및 `border-left: 2px solid var(--rail-tone, var(--uds-primary));`
   - `.live-rail-slot--action`: 기본 파랑 유지 (`--rail-tone: var(--uds-primary, #3b82f6);`)
   - `.live-rail-slot__band`: `background: var(--rail-tone, var(--uds-primary, #3b82f6));`
3. **슬롯 내부 인터랙션/더보기/CTA 색상 연동**:
   - 방 링크 hover/focus, 베스트 제목 hover, 정보게시판 제목 hover 시 `color: var(--rail-tone, var(--uds-primary))` 적용
   - 더보기 링크(`.live-rail-room__more`), CTA 링크(`.live-rail-slot__cta`)에 `color: var(--rail-tone, var(--uds-primary))` 적용
   - HOT 슬롯 카드(`.live-rail-card`) hover/focus 테두리 및 제목 호버색 연동
4. **읽기 팝업 (`.rail-popup`) 그룹별 색상 분기**:
   - `.rail-popup[data-rail-popup-kind='concern-room']`, `.rail-popup[data-rail-popup-kind='concern-best']`: `--rail-tone: var(--rail-tone-community);`
   - `.rail-popup[data-rail-popup-kind='info-board']`: `--rail-tone: var(--rail-tone-info);`
   - `.rail-popup__head`: `background: var(--rail-tone, var(--uds-primary, #3b82f6));`
   - `.rail-popup__category`: `color: var(--rail-tone, var(--uds-primary, #3b82f6));`
   - `.rail-popup__go`, `.rail-popup__login`: `background: var(--rail-tone, var(--uds-primary, #3b82f6));`
   - `.rail-popup__page[aria-current='page']`: `background: var(--rail-tone, var(--uds-primary, #3b82f6)); border-color: var(--rail-tone, var(--uds-primary, #3b82f6));`
   - 현재 선택/hover 제목: `color: var(--rail-tone, var(--uds-primary, #3b82f6));`
5. **마크업/JS 불변**:
   - HTML 및 JS 일체 수정 없음, 오직 CSS 변수와 선택자 규칙으로 구현.

---

## 3. 다른 CSS 파일 덮어쓰기 조사

- `rg '\.live-rail-slot' preview/` 및 `rg '\.rail-popup' preview/` 전수 조사 결과:
  - `home-right-rail.css` 외 다른 CSS 파일에서 `.live-rail-slot`이나 `.rail-popup`의 배경색, 테두리, 글자색을 덮어쓰는 규칙 없음 (단일 책임 유지).

---

## 4. 검사 결과 표

| 검사 항목 | 실행 명령 / 위치 | 결과 | 비고 |
|---|---|---|---|
| 우측 레일 정보 배너 검증 | `cd preview/home-ui && npx vite-node ../../scripts/verify-rail-info-banners.mjs` | **PASS** | 268 passed, 0 failed |
| 우측 레일 고민 배너 검증 | `cd preview/home-ui && npx vite-node ../../scripts/verify-rail-concern-banners.mjs` | **PASS** | 255 passed, 0 failed |
| 정보게시판 클라이언트 검증 | `cd preview/home-ui && npx vite-node ../../scripts/verify-info-boards-client.mjs` | **PASS** | 58 passed, 0 failed |
| 학생 꿀팁 게시판 검증 | `cd preview/home-ui && npx vite-node ../../scripts/verify-student-tips-board.mjs` | **PASS** | 204 passed, 0 failed |
| 홈 소식 행 검증 | `cd preview/home-ui && npx vite-node ../../scripts/verify-home-news-row.mjs` | **PASS** | 226 passed, 0 failed |
| ShopPage 정본 게이트 | `npm run verify:shop-page` | **PASS** | 54 passed, 0 failed |
| 과외쌤 쪽지설정 게이트 | `npm run verify:tutor-inquiries-settings` | **PASS** | 6 passed, 0 failed |
| 공부방 쪽지설정 샘플 검증 | `npm run verify:study-room-inquiries-samples` | **PASS** | 5 passed, 0 failed |
| 게시판 ACL 검증 | `npm run verify:board-acl:js` | **PASS** | 통과 |
| 과외쌤 쪽지설정 DDL 존재 | `Test-Path sql/schema/064_tutor_inquiry_status.sql` | **PASS** | True |
| 커밋 비밀값 방지 검사 | `scripts/check-no-committed-secrets.sh` (Git Bash) | **PASS** | OK |
| shared hosting 빌드 검증 | `npm run build:dothome` | **PASS** | 4개 UI 번들 정상 빌드 완료 |

---

## 5. 캡처 보관 및 시각 확인 결과

- **캡처 경로**:
  - `d:\work\study114\.wt\rail-band\tmp-shots\rail-band-all.png` (와이드 전체 하네스)
  - `d:\work\study114\.wt\rail-band\tmp-shots\rail-band-harness.png` (기본 하네스)
  - `d:\work\study114\.wt\rail-band\tmp-shots\index.html` (정적 하네스 HTML)
- **시각적 색 구분 확인 결과**:
  - **게스트 / 과외쌤 / 공부방 홈 레일**:
    - **커뮤니티 슬롯** (`이달의 베스트`, `공부방 고민방`, `과외쌤 고민방`, `학생/학부모 고민방`): `#6d28d9` (보라) 상단 띠 및 좌측 2px 선 적용 확인.
    - **HOT 슬롯** (`지금 고민 HOT`): `#be123c` (진홍) 상단 띠 및 좌측 2px 선 적용 확인.
    - **안내 슬롯** (`이번 시즌 추천 행동`): 파랑(`var(--uds-primary, #3b82f6)`) 상단 띠 및 좌측 2px 선 유지 확인.
    - **정보게시판 슬롯** (`공부방 쏙쏙정보`, `과외쌤 따끈 팁가이드`, `학생 꿀팁 가이드`): `#475569` (회청) 상단 띠 및 좌측 2px 선 적용 확인.
  - **읽기 팝업**:
    - `kind="concern-room"` / `concern-best`: 상단 헤더, 카테고리 태그, CTA/로그인 버튼, 현재 페이저 번호가 `#6d28d9` (보라)로 일치 적용 확인.
    - `kind="info-board"`: 상단 헤더, 카테고리 태그, 버튼, 현재 페이저 번호가 `#475569` (회청)으로 일치 적용 확인.
    - `kind="notice"`: 기본 파랑 유지 확인.

---

## 6. 배포 전 사용자 할 일

- **배포 전 사용자 할 일: 없음**
  - SQL DDL 변경 없음
  - `.htaccess` 변경 없음
  - 환경변수 및 GitHub Actions Secrets 변경 없음
  - 마크업 및 JS 변경 없는 순수 CSS 스타일 변경 작업

---

## 7. 검수 및 승인

- **검수 상태**: 대기
- **승인 상태**: 대기
