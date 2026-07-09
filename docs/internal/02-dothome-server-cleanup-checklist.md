# 닷홈 서버 정리 체크리스트 (무손상 방식)

**문서 성격:** FTP 실측 기준 서버 파일 정리·격리·검증 기록  
**기준일:** 2026-07-10  
**도메인:** `http://study114.dothome.co.kr`  
**관련:** [01-dothome-deploy.md](./01-dothome-deploy.md) · [00-project-tree-and-key-files.md](./00-project-tree-and-key-files.md) · `.cursor/rules/study114-workflow.mdc`

---

## 0. 작업 원칙

| # | 원칙 |
|---|------|
| 1 | 모르면 **삭제하지 말고 HOLD** |
| 2 | 즉시 삭제 ❌ → **목록화 → 분류 → 격리 → 검증** |
| 3 | 화면·페이지에 영향 줄 수 있는 경로는 **초기 정리 대상에서 제외** |
| 4 | **1개 또는 1묶음** 처리 후 사이트 확인 |
| 5 | **FTP 실측 항목만** 물리 존재 판단 근거로 사용 |
| 6 | **URL 200 ≠ 물리 파일 존재** (SPA fallback 가능) |
| 7 | **삭제보다 격리**(이동·이름변경) 우선 |
| 8 | 확신 없으면 KEEP이 아니라 **HOLD** |
| 9 | 검증 통과 전 **다음 항목 진행 금지** |
| 10 | 매 단계 **이 문서 갱신** |

**보고 형식 (매 단계):** 건드린 경로 · 처리 방식 · 검증 결과 · 다음 단계

---

## A. 보호 경로 (이번 단계 삭제·격리·이름변경 금지)

### A-1. Study114 운영 (FTP 실측 확인)

| FTP 경로 | 분류 | 근거 |
|----------|------|------|
| `/html/api/` | **KEEP·보호** | JSON API |
| `/html/assets/` | **KEEP·보호** | 정적·SPA 번들 |
| `/html/auth/` | **KEEP·보호** | auth-ui SPA |
| `/html/search/` | **KEEP·보호** | search-ui SPA |
| `/html/register/` | **KEEP·보호** | study-room · tutor SPA |
| `/html/index.php` | **KEEP·보호** | PHP MVC 진입 |
| `/html/index.html` | **KEEP·보호** | home-ui SPA |
| `/html/.htaccess` | **KEEP·보호** | Apache 라우팅 |
| `/src/` | **KEEP·보호** | PHP 앱 전체 (실측: Admin·Auth·…·bootstrap.php) |
| `/config/` | **KEEP·보호** | 서버 설정 |
| `/storage/` | **KEEP·보호** | 런타임 (attachments·logs) |

### A-2. 호스팅·계정 기본 (이번 정리 범위 제외)

| FTP 경로 | 처리 |
|----------|------|
| `/.bash_logout`, `/.bash_profile`, `/.bashrc` | **손대지 않음** |
| `/.htpasswd` | **손대지 않음** |
| `/.webalizer/` | **손대지 않음** |
| `/webalizer.conf` | **손대지 않음** |
| `/hosting/` | **손대지 않음** |

### A-3. 마지막 단계만 검토

| FTP 경로 | 비고 |
|----------|------|
| `/html/api/health/db.php` | 보호 아님 — **최종 단계** 삭제·접근제한 검토 |

---

## B. 서버 현재 트리 기록 (FTP 실측)

### B-1. 기록 메타

| 항목 | 값 |
|------|-----|
| 기록일 | `2026-07-10` |
| 기록 방법 | **FTP 실측** (사용자 제공 목록) + HTTP 기준선 (2026-07-10) |
| 해석 규칙 | 아래 목록에 **없는** 경로는 «실측 없음 → 판단 불가» |

### B-2. FTP 루트 (`/`) 관측

```
/
├── .webalizer/
├── config/
├── hosting/
│   └── study114/
├── html/
├── src/
├── storage/
├── .bash_logout
├── .bash_profile
├── .bashrc
├── .htpasswd
└── webalizer.conf
```

### B-3. `/html/` 관측

```
/html/
├── api/
├── assets/
├── auth/
├── register/
├── search/
├── .ftp-deploy-sync-state...    ← 파일명 전체 FTP에서 재확인 필요
├── .htaccess
├── .htaccess.bak
├── index.html
├── index.php
└── setup-finish.html
```

**FTP 실측에 없음 (판단 불가 — REMOVE 확정 금지):**

- `docs/`, `preview/`, `sql/`, `scripts/`, `e2e/`, `node_modules/`, `.git/` 등  
  → HTTP URL 200만으로는 실재 여부를 단정하지 않음. **추가 FTP 실측 전 HOLD.**

### B-4. `/src/` 관측

```
/src/
├── Admin/
├── Auth/
├── Board/
├── Controllers/
├── Core/
├── Database/
├── Handoff/
├── Messages/
├── Models/
├── Paid/
├── Registration/
├── routes/
├── Search/
├── StudyRoom/
├── Support/
├── Tutor/
├── Views/
├── autoload.php
├── bootstrap.php
└── helpers.php
```

### B-5. `/storage/` 관측

```
/storage/
├── attachments/
└── logs/
```

### B-6. HTTP 기준선 (참고용 — 물리 존재 근거 아님)

| 검증 | 결과 | 일시 |
|------|------|------|
| `/` | 200 OK | 2026-07-10 |
| `/auth/`, `/search/`, `/register/room/`, `/register/tutor/` | 200 OK | 2026-07-10 |
| `/api/health/db.php` | `ok: true` | 2026-07-10 |
| 500 | 없음 | 2026-07-10 |
| deploy run #8 | success | 2026-07-10 |

---

## C. 분류표 (FTP 실측 기준 1차 확정)

### C-1. KEEP

| FTP 경로 | 근거 |
|----------|------|
| `/config/` | 서버 설정 |
| `/html/` (전체 트리) | 웹 document root |
| `/src/` | PHP 앱 |
| `/storage/` | 런타임 저장소 |
| `/html/api/` | API |
| `/html/assets/` | 자산 |
| `/html/auth/` | SPA |
| `/html/register/` | SPA |
| `/html/search/` | SPA |
| `/html/.htaccess` | 라우팅 |
| `/html/index.html` | home-ui |
| `/html/index.php` | MVC 진입 |

### C-2. REMOVE 후보 (1건 — 격리 우선, 삭제는 검증 후)

| FTP 경로 | 근거 | 이번 단계 |
|----------|------|-----------|
| `/html/.htaccess.bak` | 백업 성격 · 핵심 동작 파일 아님 (FTP 실측) | **1차 격리 후보만 지정** |

### C-3. HOLD

| FTP 경로 | 근거 |
|----------|------|
| `/.webalizer/` | 호스팅·통계 구성 가능 |
| `/webalizer.conf` | 호스팅 구성 |
| `/hosting/` | 호스팅 메타 |
| `/.bash_logout`, `/.bash_profile`, `/.bashrc` | 계정 셸 설정 |
| `/.htpasswd` | 인증 설정 |
| `/html/.ftp-deploy-sync-state...` | FTP Deploy 동기화 상태 (삭제 시 재동기화 영향 가능) |
| `/html/setup-finish.html` | 용도 미확인 — 즉시 판단 금지 |
| `/html/api/health/db.php` | 동작 중 — **마지막 단계**까지 HOLD |
| `docs/`, `preview/`, `sql/` 등 | **FTP 실측 없음** — 존재 단정·REMOVE 확정 금지 |

---

## D. 정리 실행 순서

```
[1] FTP 실측 결과 기록          ← 완료 (§B)
[2] 분류표 확정                 ← 완료 (§C)
[3] 1차 격리 후보 지정          ← /html/.htaccess.bak (1건만)
[4] 격리 실행                   ← 미실행 (§D-2 실행안 검토 후)
[5] 격리 후 검증 6종 (§D-3)     ← 미실행
[6] 통과 시에만 다음 후보 검토
[7] db.php                      ← 마지막 단계: 삭제 또는 접근 제한
```

### D-1. 이번 단계에서 하지 않은 것 (금지 준수)

- `/src/`, `/storage/`, `/config/` 내부 정리
- `/html/api`, `assets`, `auth`, `register`, `search` 내부 정리
- `.htaccess`, `index.php`, `index.html` 수정
- `setup-finish.html`, `.ftp-deploy-sync-state...` 삭제·격리
- 실측 없는 경로 REMOVE 확정
- 다중 항목 동시 격리

### D-2. 1차 격리 실행안 초안 — `/html/.htaccess.bak` only

> **⚠️ 아직 실행하지 않음.** FTP에서 파일 존재·이름을 재확인한 뒤, **아래 중 하나만** 선택.

**권장: 방안 A (이동 격리)**

| 항목 | 내용 |
|------|------|
| 대상 | `/html/.htaccess.bak` |
| 처리 | **삭제 아님** — 계정 루트에 격리 폴더 생성 후 **이동** |
| 격리 폴더 (신규) | `/_quarantine/` (또는 `/_archive_20260710/`) — **`/html/` 밖** |
| 이동 후 경로 | `/_quarantine/.htaccess.bak` |
| 롤백 | 동일 이름으로 `/html/.htaccess.bak` 에 **다시 이동** |

**대안: 방안 B (이름변경 격리 — 같은 디렉터리)**

| 항목 | 내용 |
|------|------|
| 대상 | `/html/.htaccess.bak` |
| 처리 | `/html/.htaccess.bak.disabled_20260710` 로 **이름만 변경** |
| 주의 | Apache가 `*.bak` 외 패턴을 읽지 않는지는 환경 의존 — **방안 A가 더 안전** |
| 롤백 | 원래 파일명으로 복원 |

**실행 전 체크 (FTP)**

- [ ] `/html/.htaccess` 가 존재하고 운영 중인지 확인
- [ ] `/html/.htaccess.bak` 파일 크기·수정일 기록 (스크린샷)
- [ ] 격리 폴더가 **웹에서 URL로 접근 불가**한 위치인지 확인 (`/html/` 밖)

**실행 후 즉시 §D-3 검증 — 1개라도 FAIL이면 롤백**

### D-3. 1차 격리 후 검증 시나리오 (고정)

| # | 검증 | URL / 방법 | 기대 | 결과 |
|---|------|------------|------|------|
| 1 | 메인 | `http://study114.dothome.co.kr/` | 200 · 화면 | [ ] |
| 2 | auth | `.../auth/` | 200 | [ ] |
| 3 | search | `.../search/` | 200 | [ ] |
| 4 | register room | `.../register/room/` | 200 | [ ] |
| 5 | register tutor | `.../register/tutor/` | 200 | [ ] |
| 6 | API health | `GET .../api/health/db.php` | `ok:true` JSON | [ ] |
| 7 | 500 | 위 전부 | 500 없음 | [ ] |

---

## E. 각 단계별 검증 결과

### E-0. HTTP 기준선 — 2026-07-10 (격리 전 기준)

| 검증 | 결과 |
|------|------|
| `/` ~ register SPA | OK |
| `db.php` | `ok: true` |
| 500 | 없음 |
| deploy #8 | success |

### E-1. 단계 0 — HTTP 목록화

| 항목 | 내용 |
|------|------|
| 일시 | 2026-07-10 |
| 건드린 경로 | 없음 |
| 처리 방식 | 유지 · HTTP 실측만 |
| 검증 | §E-0 OK |
| 다음 | FTP 실측 |

### E-2. 단계 1 — FTP 실측 반영·1차 분류·격리 계획 (현재 단계)

| 항목 | 내용 |
|------|------|
| 일시 | 2026-07-10 |
| 건드린 경로 | **없음** (문서 업데이트만) |
| 처리 방식 | FTP 실측 반영 · 분류 확정 · 1차 격리 후보 `/html/.htaccess.bak` 지정 |
| 서버 파일 변경 | **없음** |
| 검증 | 기존 HTTP 기준선 유지 (재실측 생략 — 변경 없으므로) |
| 다음 단계 | §D-2 실행안 검토 → **단건 격리 실행** → §D-3 검증 |

### E-3. 단계 2 — `.htaccess.bak` 프리플라이트 (실행 직전)

| 항목 | 내용 |
|------|------|
| 일시 | 2026-07-10 |
| 대상 | `/html/.htaccess`, `/html/.htaccess.bak` 만 |
| 서버 파일 변경 | **없음** |

#### 프리플라이트 체크리스트 — **2026-07-10 최종 확인 (사용자 FTP)**

| # | 항목 | 결과 | 비고 |
|---|------|------|------|
| 1 | FTP `/html/.htaccess` 크기·수정일 | [x] **1KB · 2026-07-10 01:22:47** | 활성 운영 파일 |
| 2 | FTP `/html/.htaccess.bak` 크기·수정일 | [x] **2KB · 2026-07-09 20:37:58** | 구버전 백업 |
| 3 | 두 파일 내용 비교 | [x] **완료** | `.htaccess` = minimal safe · `.bak` = SetEnv+mod_expires 구버전 |
| 4 | 격리 경로 확정 | [x] `/_quarantine/` | `/html/` 형제 |
| 5 | 실행 판단 | [x] **실행 가능** | `.htaccess` KEEP · `.bak`만 격리 |

| 파일 | 크기 | 수정일 | 요약 |
|------|------|--------|------|
| `/html/.htaccess` | 1KB | 2026-07-10 01:22:47 | study114 minimal safe version — **KEEP** |
| `/html/.htaccess.bak` | 2KB | 2026-07-09 20:37:58 | SetEnv·mod_expires 포함 구버전 — **격리 대상** |

#### 실행 판단

**실행 가능** — `/html/.htaccess.bak` 1건 → `/_quarantine/.htaccess.bak` 이동 격리 (GitHub Actions `quarantine-htaccess-bak.yml`)


### E-4. 단계 3 — `.htaccess.bak` 격리 실행 (예정)

| 항목 | 내용 |
|------|------|
| 일시 | |
| 건드린 경로 | |
| 처리 방식 | [ ] 격리(이동 → `/_quarantine/`) [ ] 보류 |
| §D-3 검증 | [ ] 전부 PASS [ ] FAIL → 롤백 |
| 다음 단계 | |

---

## F. 최종 잔여 이슈

| # | 이슈 | 분류 | 조치 | 상태 |
|---|------|------|------|------|
| 1 | `/html/.htaccess.bak` 격리 방식 | 정리 | §D-2 방안 A/B 중 선택 · FTP 재확인 후 실행 | [ ] |
| 2 | `/html/setup-finish.html` 용도 | HOLD | 닷홈 기본·설치 잔여 파일 여부 조사 | [ ] |
| 3 | `/html/.ftp-deploy-sync-state...` | HOLD | FTP Deploy 재배포 영향 검토 후 판단 | [ ] |
| 4 | `docs/`, `preview/`, `sql/` 등 | HOLD | **FTP 실측 없음** — 추가 목록 없이는 판단 불가 | [ ] |
| 5 | `/html/api/health/db.php` | 보안 | 마지막 단계 삭제·접근제한 | [ ] |
| 6 | `/html/assets/index-*.js` 다수 | 용량 | HOLD — Deploy 동기화 정책 검토 | [ ] |

### F-1. 정리 완료 선언 조건

- [x] §B FTP 실측 기록
- [x] §C 1차 분류표 확정
- [ ] 1차 격리 실행 + §D-3 검증 PASS
- [ ] §A 보호 경로 무손상
- [ ] `db.php` 마지막 단계 처리

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-07-10 | 최초 작성 |
| 2026-07-10 | HTTP 1차 실측·기준선 |
| 2026-07-10 | **FTP 실측 반영** · 1차 분류 확정 · `.htaccess.bak` 격리 실행안 초안 · 단계 1 계획 수립 |
| 2026-07-10 | 단계 2 프리플라이트 — HTTP 403만 확인 · FTP 메타 미확인 → **실행 보류** |
