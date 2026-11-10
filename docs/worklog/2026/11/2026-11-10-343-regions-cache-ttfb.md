# 343 — regions 캐시 · 첫 페이지 TTFB 경로 확인

**브랜치:** `work/343-regions-cache-ttfb`  
**기준:** `origin/main` (`b105cfa9` · 341b merge)  
**일시:** 2026-11-10

## 지시 요점

- A. `api/auth/regions.php` 지역 목록 캐시 (사용자·세션 무관일 때만)
- B. `/` · `index.html` 응답 경로·CF 헤더 **확인만** (수정은 보고 후)
- 금지: 세션별 캐시, 가입·로그인 로직 변경, CSP 변경, main 직접 push, 341·342 섞기

---

## A-1. 사용자·세션 의존 여부 (판단)

**결론: `list` / `cities` / `tutor_units` 응답은 사용자·세션과 무관 → 공유 캐시 가능.**

| 근거 | 내용 |
|------|------|
| 인증 | `regions.php`는 세션·쿠키·로그인 검사를 하지 않음. `AuthSession`/`session_start` 미호출. |
| CORS | `study114_send_cors_headers(false)` — credentials 미허용. auth-ui도 `credentials: 'omit'`. |
| 요청 파라미터 | 기본 `action=list`(또는 빈값→list). 사용자 ID·토큰 없음. |
| 응답 소스 | `BasicRegisterService::listRegions/listCities/listTutorUnits/listComplexes` — DB 마스터 전량 SELECT. |
| 예외(캐시 금지) | `ensure`(카카오 주소→행 보장, 입력 의존) · `complex-by-name`(region_id+name 조회). |

POST `{action:list}` 와 GET `?action=list` 본문 스키마는 동일(공유 마스터).

---

## A-2 ~ A-3. 구현

1. **서버** `public/api/auth/regions.php`  
   - GET + `list`/`cities`/`tutor_units` → `Cache-Control: public, max-age=86400`  
   - `ensure` / `complex-by-name` → `Cache-Control: private, no-store`  
   - **POST 동작·경로 유지** (하위 호환). POST에는 public 캐시를 붙이지 않음.
2. **화면** `preview/shared/regions-catalog.js`  
   - GET `?action=list&v={REGIONS_CATALOG_VERSION}`  
   - 메모리 → `sessionStorage` → 네트워크 순 재사용  
3. **auth-ui** `fetchRegions()` → 위 모듈만 사용 (가입·로그인 화면 로직 변경 없음).  
4. **hope-region-masters** POST list → 동일 GET (화면 경로만).

---

## A-4. 지역 자료 변경 시 캐시 갱신

1. DB에 시·군·동·단지·과외단위가 바뀌면 **`preview/shared/regions-catalog.js`의 `REGIONS_CATALOG_VERSION`** 을 올린다 (예: `'1'` → `'2'`).  
2. URL `?v=` 와 `sessionStorage` 키 `study114:regions-catalog:v…` 가 함께 바뀌어 구 캐시를 버린다.  
3. 배포 후 필요 시 Cloudflare에서 `/api/auth/regions.php*` purge (선택).  
4. 브라우저 `max-age=86400` 만으로도 최대 1일 후 재검증. 버전 bump가 즉시 무효화의 정본.

---

## B. `/` · `index.html` 확인 (수정 없음)

**경로 판정**

- `public/.htaccess`: 실제 파일은 그대로 제공 (`-f`/`-d` → `[L]`). `DirectoryIndex index.html`.  
- `/` → 정적 `index.html` (PHP `index.php` 아님). SPA fallback `RewriteRule ^ index.html` 은 파일 없을 때만.  
- HTML에 `Cache-Control: no-cache, no-store, must-revalidate` (`.htaccess` FilesMatch html).

**운영 헤더 원문 (2026-11-10 curl -sI)**

### `https://study114.net/`

```
HTTP/1.1 200 OK
Content-Type: text/html; charset=UTF-8
Server: cloudflare
Cache-Control: no-cache, no-store, must-revalidate
Pragma: no-cache
cf-cache-status: DYNAMIC
```

### `https://study114.net/index.html`

```
HTTP/1.1 200 OK
Content-Type: text/html; charset=UTF-8
Server: cloudflare
Cache-Control: no-cache, no-store, must-revalidate
Pragma: no-cache
cf-cache-status: DYNAMIC
```

(CSP·HSTS·X-Frame-Options 등은 기존과 동일. **이번 과제에서 변경하지 않음.**)

**regions (변경 전 참고)** GET/POST 모두 `cf-cache-status: DYNAMIC`, `Cache-Control` 없음.

---

## 확인 체크리스트

| 항목 | 결과 |
|------|------|
| 로그인 창 첫/재방문 시간 전후 | 전=기존 측정 기록 / 후=배포 후 재측정 |
| 재방문 regions 캐시 (DevTools) | 배포 후: sessionStorage 또는 disk cache |
| 가입 지역 선택 | 배포 후 확인 |
| 빌드 | `npm run build:dothome` (또는 auth/home 해당 빌드) |
| 콘솔 CSP 오류 | 0 유지 목표 (헤더 미변경) |

### 전(변경 전) 로그인 창 수치 (`tmp/perf-login-measure.json`, 운영)

| | click_to_login_ui_ms | loginReady.ms | regions |
|--|---------------------|---------------|---------|
| 첫 방문 (cache disabled) | 2703 | 1221 | POST · 388ms · fromCache false |
| 재방문 (cache enabled) | 2698 | 1216 | POST · 372ms · fromCache false |

---

## 변경 파일 (구현)

- `public/api/auth/regions.php`
- `preview/shared/regions-catalog.js` (신규)
- `preview/auth-ui/src/auth-api.js`
- `preview/home-ui/src/student-reg/hope-region-masters.js`
- `docs/worklog/2026/11/2026-11-10-343-regions-cache-ttfb.md`

## 커밋 / PR

- 커밋 SHA: `4d9518c485dc1f6385e35731233ebee61e41d939`
- 줄 수: +274 / −12 (5 files)
- PR·머지: 검수 후
