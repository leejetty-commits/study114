# 닷홈 서버 정리 체크리스트 (무손상 방식)

**문서 성격:** `/hosting/study114/` 서버 파일 정리 작업 기록·검증용  
**기준일:** 2026-07-10  
**도메인:** `http://study114.dothome.co.kr`  
**관련:** [01-dothome-deploy.md](./01-dothome-deploy.md) · [00-project-tree-and-key-files.md](./00-project-tree-and-key-files.md) · `.cursor/rules/study114-workflow.mdc`

---

## 작업 원칙 (필수)

| # | 원칙 |
|---|------|
| 1 | **모르면 삭제하지 말고 HOLD** |
| 2 | 즉시 삭제 ❌ → **목록화 → 분류 → 격리 → 검증** |
| 3 | 화면·페이지에 영향 줄 수 있는 경로는 **초기 정리 대상에서 제외** |
| 4 | 각 단계마다 **이 문서 체크리스트 갱신** |
| 5 | **1묶음 처리 후 사이트 확인** — 한 번에 많이 지우지 않음 |

**보고 형식 (매 단계):**

- 이번 단계에서 건드린 경로
- 처리 방식 (유지 / 격리 / 삭제 / 보류)
- 검증 결과
- 다음 단계

---

## A. 보호 경로 (절대 즉시 삭제 금지)

아래 경로는 **운영·화면·API 동작에 직결**. 정리 1단계~중반까지 **손대지 않음**.

### A-1. 웹 document root (`html/`)

| 경로 | 이유 |
|------|------|
| `/hosting/study114/html/api/` | JSON API 전체 |
| `/hosting/study114/html/assets/` | MVC CSS·브랜드·SPA 번들 |
| `/hosting/study114/html/auth/` | auth-ui SPA |
| `/hosting/study114/html/search/` | search-ui SPA |
| `/hosting/study114/html/register/` | study-room-ui · tutor-ui SPA |
| `/hosting/study114/html/index.php` | PHP MVC 진입 |
| `/hosting/study114/html/index.html` | home-ui SPA |
| `/hosting/study114/html/.htaccess` | Apache 라우팅 |

### A-2. PHP 백엔드 (`html/` 형제)

| 경로 | 이유 |
|------|------|
| `/hosting/study114/src/` | `index.php` → `bootstrap.php` 참조 |
| `/hosting/study114/config/` | DB·OAuth·앱 설정 (`database.php` 포함) |
| `/hosting/study114/storage/` | 로그·첨부 (런타임 쓰기) |

### A-3. 정리 시 주의 (보호는 아니나 신중)

| 경로 | 비고 |
|------|------|
| `/hosting/study114/html/api/health/db.php` | 보호 목록은 아님 — **마지막 단계**에서만 삭제·접근제한 검토 |

---

## B. 서버 현재 트리 기록

> **작업 전 FTP·파일관리자로 실제 목록을 채운다.**  
> 아래는 **기대 구조**와 **잘못 올라갔을 수 있는 항목** 템플릿.

### B-1. 기록일 / 담당

| 항목 | 값 |
|------|-----|
| 기록일 | `2026-07-10` |
| 기록자 | Cursor 에이전트 (HTTP 실측 1차) |
| 기록 방법 | HTTP GET/HEAD + `api/health/db.php` · **FTP 실측은 미완** |

### B-2. `/hosting/study114/` 실제 트리 (채워 넣기)

```
/hosting/study114/
├── html/                    [x] HTTP로 운영 경로 확인  [ ] FTP 전체 목록 미완
│   ├── .htaccess            [x] 동작 중 (rewrite·SPA)
│   ├── index.php            [x] (API·MVC 경유)
│   ├── index.html           [x] 200 · home-ui
│   ├── api/                 [x] health/db.php 응답 확인
│   ├── assets/              [x] index-DWF3U39s.js 서빙
│   ├── auth/                [x] 200
│   ├── search/              [x] 200
│   ├── register/            [x] room·tutor 200
│   └── (기타)               [ ] FTP로 html/ 직접 목록 필요
├── src/                     [ ] FTP 미확인 (db.php ok → 추정 존재)
├── config/                  [ ] FTP 미확인 (db.php ok → 추정 존재)
├── storage/                 [ ] FTP 미확인
└── (기타 최상위)            [ ] FTP 미확인
```

**HTTP 1차 관찰 (2026-07-10):**

- 운영 URL 전부 200 (메인·auth·search·register)
- 현재 home 번들: `assets/index-DWF3U39s.js` (지도 Client ID `n1eb29x3e5` 포함 확인)
- GitHub Actions deploy run #8 **success** (commit `4e8f624`)

### B-3. `html/` 안에 **있으면 안 되는** 후보 (실제 존재 여부 체크)

| 서버 경로 (html/ 하위) | repo 대응 | HTTP 1차 | FTP 실측 |
|------------------------|-----------|----------|----------|
| `docs/` | `docs/` | SPA fallback만 (물리 폴더 **미확인**) | [ ] |
| `docs/ssot/README.md` | 파일 직접 | SPA fallback (파일 **없음** 추정) | [ ] |
| `backups/` | `backups/` | SPA fallback만 | [ ] |
| `.cursor/` | `.cursor/` | (미요청) | [ ] |
| `preview/` | `preview/` | SPA fallback만 | [ ] |
| `preview/home-ui/package.json` | 파일 직접 | SPA fallback (파일 **없음** 추정) | [ ] |
| `sql/` | `sql/` | SPA fallback만 | [ ] |
| `scripts/` | `scripts/` | SPA fallback만 | [ ] |
| `docker/` | `docker/` | (미요청) | [ ] |
| `legacy/` | `legacy/` | (미요청) | [ ] |
| `e2e/` | `e2e/` | SPA fallback만 | [ ] |
| `test-results/` | `test-results/` | SPA fallback만 | [ ] |
| `node_modules/` | 루트 | SPA fallback만 | [ ] |
| `.git/HEAD` | 루트 | SPA fallback만 | [ ] |
| `src/` (html **안**) | 잘못된 배치 | (미요청) | [ ] |
| `config/` (html **안**) | 잘못된 배치 | (미요청) | [ ] |
| `.htaccess.bak` | 백업 | **403** (파일 **존재** 추정) | [ ] |
| `api/health/db.php` | health | **200 JSON** `ok:true` | [x] |

> **해석:** `/docs/`, `/preview/` 등 URL은 200이지만 **home-ui SPA fallback**(`<div id="app">`)이다.  
> `.htaccess`가 실제 파일 없으면 `index.html`로내므로, **URL 200 ≠ 개발 폴더가 서버에 있음**을 의미하지 않는다.  
> **FTP로 `html/` 실제 디렉터리 목록**을 반드시 확인한 뒤 REMOVE 후보를 확정한다.

### B-4. `/hosting/study114/` 최상위에 **있으면 안 되는** 후보

| 서버 경로 (study114/ 최상위) | 비고 | 실제 존재 |
|------------------------------|------|-----------|
| `docs/` | 개발용 | [ ] |
| `preview/` | Vite 소스 | [ ] |
| `node_modules/` | 의존성 | [ ] |
| `.git/` | Git 메타 | [ ] |
| 기타: | | [ ] |

---

## C. 분류표

분류: **KEEP** · **REMOVE 후보** · **HOLD**

| 서버 경로 (예시) | 분류 | 근거 | 격리 가능 | 비고 |
|------------------|------|------|-----------|------|
| `html/api/` | **KEEP** | 운영 API | — | A 보호 |
| `html/assets/` | **KEEP** | 정적·SPA 번들 | — | A 보호 |
| `html/auth/`, `search/`, `register/` | **KEEP** | SPA | — | A 보호 |
| `html/index.php`, `index.html`, `.htaccess` | **KEEP** | 진입·라우팅 | — | A 보호 |
| `src/` | **KEEP** | PHP 앱 | — | A 보호 |
| `config/` | **KEEP** | 설정 | — | A 보호 |
| `storage/` | **KEEP** | 런타임 | — | A 보호 |
| `html/docs/` | **HOLD** → FTP 후 재분류 | HTTP상 SPA만 | FTP 목록 전 | 물리 폴더 미확인 |
| `html/preview/` | **HOLD** → FTP 후 재분류 | HTTP상 SPA만 | FTP 목록 전 | |
| `html/node_modules/` | **HOLD** → FTP 후 재분류 | HTTP상 SPA만 | FTP 목록 전 | |
| `html/.git/` | **HOLD** → FTP 후 재분류 | HTTP상 SPA만 | FTP 목록 전 | |
| `html/.htaccess.bak` | REMOVE 후보 | HTTP 403 | ✅ 격리 가능 | `.htaccess` 정상 후 마지막에 |
| `html/api/health/db.php` | REMOVE 후보 | 동작 중 | ⚠️ 마지막 단계만 | 삭제 전 §E-0 재검증 |
| `study114/docs/` (최상위) | REMOVE 후보 | 개발용 | ✅ | html 밖이면 노출 낮음 |
| `study114/preview/` (최상위) | REMOVE 후보 | 소스 | ✅ | |
| 용도 불명 파일/폴더 | **HOLD** | 확인 필요 | ❌ | 삭제 금지 |

---

## D. 정리 실행 순서

```
[0] 이 문서 §B 서버 트리 실측 기록
[1] §C 분류표 실측 반영
[2] REMOVE 후보도 즉시 삭제 ❌ → 격리(이름변경·상위 이동) 가능 여부 확인
[3] 가장 안전한 1묶음만 처리 (권장 첫 묶음: html/ 안의 docs/ 또는 test-results/)
[4] §E 검증 체크리스트 실행
[5] 문제 없으면 [3] 반복 · 문제 있으면 즉시 롤백(격리 복구)
[6] 모든 REMOVE 후보 처리 후 §F 잔여 이슈 정리
[7] 마지막: api/health/db.php 삭제 또는 접근 제한
```

### D-1. 권장 처리 우선순위 (안전 → 신중)

| 순서 | 대상 묶음 | 처리 방식 | 위험도 |
|------|-----------|-----------|--------|
| 1 | `html/test-results/`, `html/e2e/` | 격리 → 검증 → 삭제 | 낮음 |
| 2 | `html/docs/`, `html/docs/ssot/` | 격리 → 검증 → 삭제 | 낮음 |
| 3 | `html/backups/`, `html/.cursor/` | 격리 → 검증 → 삭제 | 낮음 |
| 4 | `html/scripts/`, `html/docker/`, `html/sql/` | 격리 → 검증 → 삭제 | 낮음 |
| 5 | `html/preview/`, `html/node_modules/` | 격리 → 검증 → 삭제 | 중간 (용량·시간) |
| 6 | `html/.git/`, `html/legacy/` | **HOLD** 우선 → 확인 후 격리 | 중간~높음 |
| 7 | `html/src/`, `html/config/` (잘못 배치) | **HOLD** — 형제 폴더와 비교 후 | 높음 |
| 8 | `html/.htaccess.bak` | 격리 → 검증 → 삭제 | 중간 |
| 9 | `html/api/health/db.php` | 삭제 또는 IP/인증 제한 | 마지막 |

**격리 예시 (삭제 대신):**

- `docs` → `_TRASH_20260710_docs` (html 밖 `study114/_quarantine/`로 이동 권장)
- 닷홈 파일관리자: **이동** 우선, **삭제**는 검증 후

---

## E. 각 단계별 검증 결과

매 묶음 처리 후 **반드시** 기록. 하나라도 실패 시 **다음 묶음 진행 금지**.

### E-0. 기준선 (정리 시작 전 1회) — **2026-07-10 완료**

| 검증 | URL / 방법 | 기대 | 결과 | 일시 |
|------|------------|------|------|------|
| HTTP 상태 | `http://study114.dothome.co.kr/` | 200, 화면 표시 | [x] OK | 2026-07-10 |
| home-ui | `.../#/guest` | 비회원 화면 | [x] OK (200) | 2026-07-10 |
| auth SPA | `.../auth/#/login` | auth-ui | [x] OK (200) | 2026-07-10 |
| search SPA | `.../search/#/search/room` | search-ui | [x] OK (200) | 2026-07-10 |
| register SPA | `.../register/room/`, `tutor/` | SPA | [x] OK (200) | 2026-07-10 |
| API health | `GET .../api/health/db.php` | `ok:true` JSON | [x] OK | 2026-07-10 |
| 지도 번들 | `assets/index-DWF3U39s.js` | Client ID 포함 | [x] `n1eb29x3e5` | 2026-07-10 |
| 500 없음 | 위 URL 전부 | 500 없음 | [x] | 2026-07-10 |
| PHP MVC (선택) | `.../auth/login` | MVC 또는 리다이렉트 | [ ] 미실측 | |

### E-1. 단계 로그

#### 단계 0 — 목록화·기준선 (서버 파일 변경 없음)

| 항목 | 내용 |
|------|------|
| 일시 | 2026-07-10 |
| 건드린 경로 | 없음 (HTTP 실측만) |
| 처리 방식 | [x] 유지 |
| 메인 `/` | [x] OK |
| `/auth` | [x] OK |
| `/search` | [x] OK |
| 주요 화면 | [x] OK |
| 500 여부 | [x] 없음 |
| 롤백 여부 | [x] 없음 |
| 다음 단계 | **FTP로 `html/` 실제 목록** → REMOVE 후보 확정 → 1묶음 격리 |

#### 단계 1

| 항목 | 내용 |
|------|------|
| 일시 | |
| 건드린 경로 | |
| 처리 방식 | [ ] 유지 [ ] 격리 [ ] 삭제 [ ] 보류 |
| 격리 위치 (해당 시) | |
| 메인 `/` | [ ] OK [ ] FAIL |
| `/auth` | [ ] OK [ ] FAIL |
| `/search` | [ ] OK [ ] FAIL |
| 주요 화면 (`#/guest` 등) | [ ] OK [ ] FAIL |
| 500 여부 | [ ] 없음 [ ] 있음 |
| 롤백 여부 | [ ] 없음 [ ] 있음 |
| 다음 단계 | |

#### 단계 2

| 항목 | 내용 |
|------|------|
| 일시 | |
| 건드린 경로 | |
| 처리 방식 | [ ] 유지 [ ] 격리 [ ] 삭제 [ ] 보류 |
| 메인 `/` | [ ] OK [ ] FAIL |
| `/auth` | [ ] OK [ ] FAIL |
| `/search` | [ ] OK [ ] FAIL |
| 주요 화면 | [ ] OK [ ] FAIL |
| 500 여부 | [ ] 없음 [ ] 있음 |
| 다음 단계 | |

*(단계 3, 4, … 동일 형식으로 추가)*

---

## F. 최종 잔여 이슈

정리 완료 후 작성.

| # | 이슈 | 분류 | 조치 | 담당 | 상태 |
|---|------|------|------|------|------|
| 1 | FTP `html/` 실제 목록 미완 | 정리 | 닷홈 파일관리자로 §B-2·B-3 채우기 | | [ ] 진행 필요 |
| 2 | `api/health/db.php` 잔존·동작 중 | 보안 | **마지막 단계** 삭제 또는 접근 제한 | | [ ] |
| 3 | `html/.htaccess.bak` 403 | 정리 | FTP 확인 후 격리 → 검증 → 삭제 | | [ ] |
| 4 | `html/assets/index-*.js` 다수 | 용량 | HOLD — FTP Deploy 동기화 후 검토 | | [ ] |
| 5 | `src/`·`config/`·`storage/` FTP 미확인 | 운영 | 형제 폴더 존재 확인 (db.php ok) | | [ ] |
| 6 | docs/preview URL 200 | 오해 방지 | SPA fallback — FTP 전 REMOVE 금지 | | [x] 문서화 |

### F-1. 정리 완료 선언 조건

- [ ] §B 서버 트리 실측과 §C 분류표 일치
- [ ] REMOVE 후보 중 **확정 삭제** 항목 처리 완료 (또는 HOLD 사유 기록)
- [ ] §E 모든 단계 검증 PASS
- [ ] §A 보호 경로 무손상 확인
- [ ] `db.php` 마지막 단계 처리 완료

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-07-10 | 무손상 서버 정리 체크리스트 최초 작성 |
| 2026-07-10 | HTTP 1차 실측·§E-0 기준선·단계 0 로그 반영 |
