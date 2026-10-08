# 126 · 배포 — 홈 팝업 Phase 1a~4 (커밋 6개 그대로)

- 작성일: 2026-09-25 04:1x KST
- 사용자 허가: 「배포」(2026-09-25 04:10) → push · Actions Deploy to dothome 허가
- 로컬 수락: 112/114(1a) · 117(1b) · 119(Phase2) · 123(Phase3) · 124(Phase4)
- 기준: `origin/main` = `5c12a5d`. 로컬 `feat/student-mypage-a-g` upstream=origin/main, 앞선 커밋 6개(선형).
- 새 커밋·새 stage 없음. `git add` 자체 금지.

## 0. 순서 (중요)
1. **사용자가 먼저** 운영 phpMyAdmin에서 `home_popups` 표 생성 (아래 §1). 표 없이 올리면 공개 목록 API가 500(홈은 팝업 없이 열리지만 관리자 화면 오류).
2. 그다음 Cursor가 push → Actions Deploy to dothome.

## 1. 운영 DB (사용자 직접)
- phpMyAdmin 왼쪽에서 사이트 DB 선택 → SQL 탭 → 아래만 실행. (`USE study114;` 줄은 빼고 실행: 운영 DB 이름이 다를 수 있음)
```sql
CREATE TABLE IF NOT EXISTS home_popups (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  type VARCHAR(10) NOT NULL,
  family CHAR(1) NOT NULL DEFAULT 'a',
  audience VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  start_at DATE NULL,
  end_at DATE NULL,
  published TINYINT(1) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_home_popups_pub (published, start_at, end_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```
- 확인: 왼쪽 표 목록에 `home_popups`, 0건.

## 2. Cursor 게이트
1. `git fetch origin` → `origin/main`이 `5c12a5d`인지 확인. 다르면 **중단·보고**.
2. `git log --oneline origin/main..HEAD` = 정확히 6개: f63924a · 345590b · 05f8df7 · 997ae27 · 2a2fe69 · 8eaf74d. 다르면 중단.
3. `git diff --name-only origin/main..HEAD` 전량 보고 (팝업·관리자 팝업·HomePopup·home-popups API·069만이어야 함).
4. 워킹트리 잔여물(study-room-reg/screens.js 빈 줄, 미추적 docs/046·047·README.md)은 **건드리지 말고 커밋 금지**. stash·reset·clean 금지.
5. `git push origin HEAD:main` (fast-forward만. force 금지).
6. Actions Deploy to dothome 완료 대기. 로컬 build:dothome 실행 안 함.

## 3. 운영 스모크
| # | 확인 |
|---|---|
| 1 | `GET /api/home-popups.php` → `{"ok":true,"popups":[]}` |
| 2 | 비로그인 손님 홈: 팝업 없음, 기존 홈 회귀 없음 |
| 3 | 관리자(jetty@naver.com) `#/admin/settings/popups`: 「팝업 없음」, 오류 없음 |
| 4 | 관리자로 공지 1건(공개 꺼짐) 저장 → [홈에서 미리보기] 뜸 → 손님 홈엔 안 뜸 → **삭제** → 0건 |
| 5 | 관리자 `/?popupDemo` 공지/이벤트/광고 × set-a/set-b 열림 |
| 6 | 비로그인 `/api/admin/home-popups.php` → 401 |
CF 5xx는 앱 버그로 단정 금지, 재시도. 스모크 행은 반드시 삭제(운영 0건으로 끝).

## 4. 보고
push 전후 origin/main SHA · Actions # · diff 파일 목록 · 스모크 1~6 · 잔여물 미커밋.
