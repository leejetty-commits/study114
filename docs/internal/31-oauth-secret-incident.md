# 31 — OAuth 비밀값 유출 대응 (2026-07)

**상태:** ✅ 구조 대응 완료 · **시크릿 재발급·로그인 확인 완료 (2026-11-08)**  
**관련:** `public/.htaccess` · `.github/workflows/deploy.yml` · `config/oauth.php` · `src/bootstrap.php` · `docs/internal/81-youtube-pre-security-lock.md` · grok-sync `328`

---

## 0. 무슨 일이 있었나

`public/.htaccess`(git 추적 파일)의 `SetEnv` 블록에 소셜 로그인 3종의
**client_id / client_secret + 카카오 REST 키 + 메일 프로브 키**가 평문으로 커밋되어
공개 저장소에 노출되었다.

- 노출 커밋: `a990122`(네이버), `fce2c28`(카카오), `1d56525`(구글)
- 감지: GitGuardian + GitHub Secret Scanning (public/.htaccess L40~41 구글 키)

노출된 값은 **git 히스토리·포크·외부 스캐너에 이미 남아 영구 노출**로 간주한다.
파일에서 지운다고 해결되지 않으며 **반드시 재발급(rotate)** 해야 한다.

---

## 1. 왜 로그인 3개가 동시에 깨졌나 (진단)

라이브 점검 결과:

- 서버 `.htaccess` SetEnv 설정 자체는 살아 있음 → `start.php`가 3종 모두 정상 authorize URL 생성.
- 카카오·구글 authorize 는 provider 로그인 페이지까지 도달(=client_id·redirect_uri 등록 유효).

즉 **서버 설정 유실이 아니라 provider 측 비밀값 상태 문제**다.
유출된 secret 은 신뢰할 수 없으므로(구글은 유출 감지 시 client 를 자동 비활성화하기도 함),
**3개 모두 재발급 → 서버 반영**이 정상 복구 경로다.

---

## 2. 구조 변경 (이번 커밋)

1. `public/.htaccess` 의 OAuth/메일 secret 값을 `__OAUTH_*__` placeholder 로 교체.
2. 배포 시 `deploy.yml` 의 **Inject OAuth secrets** 스텝이 GitHub Actions **Secrets** 값으로 치환.
   - 서버 `.htaccess` 에만 실값이 들어가고 저장소에는 남지 않음.
   - `.htaccess` 는 Apache 가 HTTP 로 직접 서빙하지 않으므로 서버 저장은 안전.
3. secret 미설정 시 배포가 **중단**(placeholder 업로드로 로그인 깨짐 방지).
4. 실패만 반복되던 `Quarantine htaccess.bak` 워크플로·트리거 제거.

> 로컬에서 `public/.htaccess` 에 실 secret 을 넣지 말 것. 항상 placeholder 유지.

---

## 3. 사람 작업 — 재발급·확인 (2026-11-08 완료)

> 아래는 **완료 기록**이다. 이후 유출 의심 시 같은 절차를 반복한다.

### 3-1. provider 콘솔에서 키 재발급 — ✅ 2026-11-08

| provider | 조치 | 확인 |
|----------|------|------|
| Naver | Client ID 유지 · Client Secret 재발급 | 로그인 OK |
| Kakao | REST API 키 유지 · **카카오 로그인** Client Secret 재발급 (비즈니스 인증 시크릿 ✕) | 로그인 OK |
| Google | Add secret → Secrets 반영 → 옛 secret 삭제 | 로그인 OK |

- redirect URI 정본:
  `https://study114.net/api/auth/oauth/callback.php?provider=<naver|kakao|google>`
- 호환(필요 시): `www` · `study114.dothome.co.kr` (https). `http`/`https`는 다른 등록이다.

### 3-2. GitHub Actions Secrets — ✅ 갱신됨

- `OAUTH_NAVER_CLIENT_ID` / `OAUTH_NAVER_CLIENT_SECRET`
- `OAUTH_KAKAO_REST_API_KEY` / `OAUTH_KAKAO_CLIENT_SECRET`
- `OAUTH_GOOGLE_CLIENT_ID` / `OAUTH_GOOGLE_CLIENT_SECRET`
- (선택) `STUDY114_MAIL_PROBE_KEY`

### 3-3. 배포 → 복구 확인 — ✅

- Secrets만 바꾼 날: Actions **Deploy to dothome** 수동 Run (`main`) 후 주입.
- 정본 `https://study114.net` 에서 네이버·카카오·구글 로그인 확인 완료 (2026-11-08).

---

## 4. 히스토리 정리 (권장, 별도 승인 필요)

파일 삭제만으로 과거 커밋의 값은 사라지지 않는다. 완전 제거하려면:

- `git filter-repo` 또는 BFG 로 `public/.htaccess` 과거 blob 의 secret 제거 후 **force push**.
- 공개 저장소·포크·PR 에 남은 값은 재발급으로 무력화하는 것이 핵심.

force push 는 파괴적이므로 사용자 명시 승인 후 진행한다.

---

## 5. 후속 점검

- `STUDY114_MAIL_PROBE_KEY` 및 `_mail-probe.php`: 상시 필요 없으면 엔드포인트 삭제 검토.
- FTP 자격(`FTP_PASSWORD`)은 이미 GitHub Secret — 유지.
- 저장소 전체 재스캔으로 다른 평문 secret 없는지 확인 (이번엔 `public/.htaccess` 단일 지점).

---

## 6. 재발 방지 (2026-07-22)

| 장치 | 내용 |
|------|------|
| placeholder `.htaccess` | 실값 대신 `__OAUTH_*__` 만 커밋 |
| deploy 주입 | GitHub Secrets → 배포 직전 `.htaccess` 치환 · 미설정 시 배포 중단 |
| CI 가드 | `scripts/check-no-committed-secrets.sh` — 실값 재커밋 시 배포 실패 |
| Cursor 규칙 | `.cursor/rules/study114-workflow.mdc` §4-1 — AI/작업자가 `.htaccess`에 시크릿 넣지 않음 |
| 구문서 정리 | `01-dothome-deploy.md` · `core-flow-audit-checklist.md` — 「서버 `.htaccess`에 직접 SetEnv」안내 제거 |

**사람 체크리스트 (주기)**

1. Secrets에 OAuth 6개가 있는지 확인 (값 조회는 불가 — 로그인 동작으로 검증).
2. `public/.htaccess` 로컬 파일에 실값이 들어가지 않았는지 `git diff`로 확인.
3. 키 유출 의심 시 provider 콘솔에서 **즉시 재발급** 후 Secrets 갱신 → 재배포.
4. (선택) 과거 커밋 히스토리 정리는 force push 승인 후 별도 진행.

---

## 7. 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-07 | 유출 감지 · placeholder·Deploy 주입·CI 가드 |
| 2026-07-22 | 재발 방지 장치 문서화 |
| 2026-11-08 | 3사 Client Secret 재발급·Deploy·로그인 OK · 상태 ✅ · 유튜브 전 보안 5번 닫음 (`81`) |