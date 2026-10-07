# 121 · 홈 팝업 Phase 4 — 관리자 팝업 화면을 서버 저장으로 교체 + 행 단위 미리보기

- 기준: 120 수락 커밋 `2a2fe69` (수락 문서 123).
- 로컬 관리자 검증: jetty@naver.com 메일 인증이 없으면 스모크 동안만 email_verified_at을 채우고 끝나면 NULL로 되돌린다(120과 같은 방식).
- 정책: 111 §1·§2·§4, 053 Phase 4.
- 상태: **잠금**. push·build:dothome 금지. 새 커밋 1개.

## 0. 목표
관리자 `#/admin/settings/popups` 화면에서 홈 팝업을 **만들고·고치고·지우고·공개 켜고 끄고·홈에서 미리보기**까지 한다. 저장은 120의 `/api/admin/home-popups.php`.

## 1. 화면 구성 (기존 settings 표·폼 스타일 재사용, 새 디자인 금지)
**목록 표** 열: 유형(공지/이벤트/광고) · 모양(set-a/set-b) · 제목 · 대상 · 기간 · 공개(켜짐/꺼짐) · 순서 · 수정일 · [수정] [삭제] [홈에서 미리보기].

**폼**
1. 유형: 공지 / 이벤트 / 광고 (바꾸면 아래 문구 칸이 그 유형 칸으로 바뀜)
2. 모양: set-a / set-b
3. 대상(복수): 전체 · 비회원 · 공부방 회원 · 과외쌤 회원 · 학생 회원
   - 「전체」 체크 시 나머지 해제·비활성. 전체가 아니면 1개 이상 필수(저장 막고 문구 「대상을 하나 이상 고르세요」).
4. 기간: 시작일 · 종료일 (비우면 제한 없음)
5. 공개 표시: 켜짐 / 꺼짐 (기본 꺼짐)
6. 순서: 숫자 (작을수록 먼저, 기본 0)
7. 유형별 문구 칸 (120 §3 키, 화면 라벨은 한글)
   - 공지: 날짜 문구, 제목, 본문, 목록(한 줄에 하나, 최대 4줄), 버튼 글자, 버튼 링크
   - 이벤트: 윗글(작은 제목), 제목, 표시칩, 본문, 기간 문구, 안내 문구, 버튼 글자, 버튼 링크
   - 광고: 표시칩, 제목, 본문, 옆 패널 문구, 주 버튼 글자·링크, 보조 버튼 글자·링크
8. [저장] [취소]. 삭제는 확인창 「이 팝업을 삭제할까요?」.
- 서버 오류(`audience_required`, `bad_href` 등)는 한글 문구로 폼 위에 표시.
- 공개 켜짐으로 저장 시 한 줄 안내: 「저장하면 대상 홈에 바로 보입니다(동시 1개, 공지>이벤트>광고).」

## 2. 행 단위 미리보기
- [홈에서 미리보기] → 새 탭 `/?popupPreviewId=<id>#/guest` (대상이 특정 역할이면 그 역할 홈 해시로 열어도 됨. 미리보기는 대상·기간·공개와 **무관하게** 그 행을 그림).
- 홈 `gate.js`: **관리자 + `?popupPreviewId`** → `GET /api/admin/home-popups.php?id=` (credentials include)로 1건 받아 mode `preview`로 그림. 스위치 없음, 하루 안 보기 저장 없음.
- 우선순위: `popupPreviewId` > `popupDemo` > 엔진. 관리자 아님/조회 실패 → 미리보기 없음(엔진으로).

## 3. 파일
- 신규 `preview/home-ui/src/admin/home-popup-api.js` — `listHomePopups`, `getHomePopup(id)`, `saveHomePopup(row)`, `deleteHomePopup(id)`. `admin-api.js`/`content-config-api.js`와 같은 패턴(상대경로 `/api/admin/…`, `credentials:'include'`, `{ok:true}` 확인).
- 수정 `preview/home-ui/src/admin/a28-screens.js` — `renderSettings('popups')` 부분만.
- 수정 `preview/home-ui/src/admin/a28-screens-bind.js` — popups 바인딩 부분만(`savePopup`/`deletePopup` 호출을 새 API로).
- 수정 `preview/home-ui/src/home-popup/gate.js`, `mount.js` — §2.
- 금지: `main.js`, `site-ops-chrome.js`, `site-settings-store.js`(파일 삭제·수정 금지, 이 화면에서 호출만 끊음), 다른 settings 섹션, 서버 PHP·SQL(필요하면 멈추고 보고), CSS 신규 디자인, 이미지 업로드, 메뉴 권한(masterOnly) 변경.

## 4. 스모크 (보고 필수)
1. 관리자 로그인 → 팝업 화면에서 공지 생성(대상 비회원, 공개 꺼짐) → 목록에 보임 → 새로고침·다른 브라우저 관리자에서도 보임.
2. [홈에서 미리보기] → 공개 꺼짐인데도 그 문구로 뜸. 손님(다른 브라우저)에겐 안 뜸.
3. 공개 켜짐 저장 → 손님 홈에 뜸. 끄면 안 뜸.
4. 「전체」 체크 시 다른 칸 해제, 대상 0개 저장 막힘, `javascript:` 링크 서버 거절 문구.
5. 유형 변경 시 문구 칸 교체, 이벤트·광고 각 1건 set-b로 만들어 미리보기(워터마크 확인).
6. 삭제 확인창 → 목록·홈에서 사라짐.
7. `?popupDemo` 6조합 회귀 없음. 다른 settings 섹션 영향 없음.
8. 커밋 전 로컬 테스트 행 정리. 파일 목록·SHA·스크린샷(목록·폼·미리보기) 보고.
