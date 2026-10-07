# 120 · 홈 팝업 Phase 3 — 서버 저장(DB·API) + 홈이 서버 목록을 읽기

- 기준: 로컬 `997ae27` (Phase 2 수락 119). 브랜치 `feat/student-mypage-a-g`.
- 정책: 111 §1·§2, 053 Phase 3. 조사 근거: 저장소 읽기 2026-09-25.
- 상태: **잠금**. push·build:dothome 금지. 새 커밋 1개. 1a·1b·2 amend 금지.
- 다음: 121(Phase 4 관리자 화면)은 **120 수락 후** 붙여넣기.

## 0. 목표
팝업을 코드 안 더미가 아니라 **DB에 저장**하고, 홈은 **공개 GET**으로 받아 Phase 2 엔진(`pickHomePopup`)에 넣는다. 관리자 저장 화면은 121. 이번엔 API로 행을 넣어 확인한다.

## 1. DB — `sql/schema/069_home_popups.sql` (신규, 068 다음)
```
CREATE TABLE IF NOT EXISTS home_popups (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  type VARCHAR(10) NOT NULL,            -- notice | event | ad
  family CHAR(1) NOT NULL DEFAULT 'a',  -- a | b
  audience VARCHAR(100) NOT NULL,       -- JSON 배열 문자열 ["all"] 등
  content TEXT NOT NULL,                -- 유형별 문구 JSON (§3)
  start_at DATE NULL,
  end_at DATE NULL,
  published TINYINT(1) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_home_popups_pub (published, start_at, end_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```
- JSON 컬럼 타입 쓰지 말 것(호스팅 MySQL/MariaDB 호환). 시드 INSERT 넣지 말 것.
- 운영 반영은 배포 때 phpMyAdmin 수동 import(01-dothome-deploy 방식). 이번엔 로컬만 `scripts/apply-schema-dev.ps1`.

## 2. PHP
- `src/HomePopup/HomePopupRepository.php` — PDO(`Connection::get()`), prepared SQL만.
- `src/HomePopup/HomePopupService.php` — 검증·정규화:
  - `type` ∈ notice/event/ad, `family` ∈ a/b. 그 외 400.
  - `audience`: 허용값 all/guest/studyRoom/tutor/student만. 비면 400(`audience_required`). `all`이 있으면 `["all"]`로 정규화. 중복 제거.
  - 날짜 `YYYY-MM-DD` 또는 null. 둘 다 있으면 start<=end, 아니면 400.
  - `content`: §3 유형별 **허용 키만** 남기고 나머지 버림. 문자열 trim·길이 제한(제목 60, 본문 400, 버튼 20, 기타 80). `bullets` 최대 4줄.
  - 링크(`ctaHref`·`primaryHref`·`secondaryHref`): `#/`, `/`, `https://` 로 시작할 때만 허용. 아니면 400(`bad_href`). `javascript:` 등 차단.
  - `sort_order` 정수, `published` 0/1.
- **관리자 API** `public/api/admin/home-popups.php` — 모든 메서드 `AdminApi::requireMaster()` (기존 팝업 메뉴가 masterOnly라 동일).
  - `GET` → 전체 목록(sort: published desc, type 순위 공지<이벤트<광고, sort_order, updated_at desc). `?id=` 있으면 1건.
  - `POST` JSON → `id` 있으면 수정, 없으면 생성. 응답 `{ ok:true, popup }`.
  - `DELETE ?id=` → 삭제. 응답 `{ ok:true }`.
  - 응답 모양 `AdminApi::ok/fail` 그대로.
- **공개 API** `public/api/home-popups.php` — 로그인 불필요, `GET`만(그 외 405).
  - `published=1` 이고 서울 오늘(`Asia/Seoul`) 기준 기간 안인 행만.
  - 응답 `{ ok:true, popups:[ { id, type, family, audience:[...], content:{...}, startAt, endAt, sortOrder, updatedAt } ] }` (camelCase, id는 문자열).
  - `Cache-Control: no-store`.
- 기존 `support/notices.php` 방식(무인증 쓰기) 따라 하지 말 것.

## 3. content 키 (SET_A와 같은 이름)
| 유형 | 키 |
|---|---|
| notice | date, title, body, bullets[], cta, ctaHref |
| event | kicker, title, chip, body, period, note, cta, ctaHref |
| ad | chip, title, body, aside, primary, primaryHref, secondary, secondaryHref |

## 4. 홈 (프론트)
- `content.js`: 정적 `HOME_POPUPS` 더미 **삭제**. `SET_A`는 미리보기(`?popupDemo`)와 빈 칸 대체용으로 유지.
- `gate.js`: 공개 목록 캐시(모듈 변수). 첫 호출 때 `GET /api/home-popups.php` 1회(`credentials:'include'` 불필요). 실패·`ok:false`면 조용히 빈 목록. 받은 행을 그대로 `pickHomePopup`에 넣음(published는 서버가 이미 걸렀으니 `true`로 채워 넣기).
- `mount.js`: `main.js` 수정 없이 — 목록 도착 전이면 그리지 않고, 도착하면 마지막 `appRoot`로 `mountHomePopup`을 1번 다시 부름(그때 홈 화면이 아니면 아무것도 안 함).
- 공개 모드 카드 문구는 행의 `content`를 쓰고, 빈 키만 `SET_A[type]` 값으로 채움. 모든 문구 기존 `esc()` 통과, 링크도 `esc()`.
- 미리보기(`관리자 + ?popupDemo`)는 지금과 동일(SET_A, 서버 호출 무관).

## 5. Allowlist / 금지
- 허용: `sql/schema/069_home_popups.sql`, `src/HomePopup/HomePopupRepository.php`, `src/HomePopup/HomePopupService.php`, `public/api/admin/home-popups.php`, `public/api/home-popups.php`, `preview/home-ui/src/home-popup/{content,gate,mount}.js`.
- 금지: `main.js`, `site-ops-chrome.js`, `admin/site-settings-store.js`, 관리자 화면(a28-*) — 121에서, `engine.js` 규칙 변경, CSS, 이미지 업로드, 기존 SQL 파일 수정, 운영 DB 접속, 시드 데이터 커밋.
- 필요한 파일이 더 있으면 **멈추고 이유 보고**.

## 6. 스모크 (보고 필수, Docker·:8080 켠 상태)
1. `apply-schema-dev.ps1` 후 `home_popups` 생성 확인.
2. 관리자 쿠키 없이 `POST /api/admin/home-popups.php` → 401/403. 관리자(`jetty@naver.com` 또는 로컬 master 계정)로 생성·수정·삭제 성공.
3. 검증 거절: audience `[]`, `["all","guest"]`→`["all"]` 정규화, 잘못된 type, `javascript:` 링크, start>end.
4. 공개 GET: published 0 행 안 나옴 / 기간 밖 안 나옴 / 기간 안 published 1 나옴.
5. 홈: 공지(audience guest, published 1) 넣으면 손님 홈에 **DB 문구**로 뜸 → 하루 안 보기 저장 동작 → 행을 published 0으로 바꾸면 안 뜸.
6. 우선순위: 공지+광고 둘 다 공개 → 공지. 공지 삭제 → 광고.
7. 미리보기 6조합 회귀 없음. API 꺼져 있을 때 홈 에러 없이 팝업만 없음.
8. **커밋 전 로컬 테스트 행 삭제**(DB는 커밋 대상 아님). 파일 목록·SHA·스모크 결과 보고.
