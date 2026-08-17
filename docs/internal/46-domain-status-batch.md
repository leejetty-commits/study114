# 도메인 현황 · 일괄 전환

**기준일:** 2026-08-17  
**상태:** 코드·env 정본을 `https://study114.net` 으로 맞춤. **commit/push 보류** (콘솔 작업 끝날 때까지).  
**관련:** [01-dothome-deploy.md](./01-dothome-deploy.md) · `.cursor/rules/study114-workflow.mdc`

---

## 전환 정책 (임시, 소셜 안정화 전까지)

이건 영구 단일 호스트 통합이 아니다. 소셜로그인 안정화용 **임시 전환 정책**이다.

| 호스트 | 역할 |
|--------|------|
| `https://study114.net` | **정본.** 1차 검증·일반 이용·Vite 절대경로·메일 링크 |
| `https://www.study114.net` | 호환. 세션은 apex와 **분리** |
| `https://study114.dothome.co.kr` | **호환/검증용.** 직접 URL은 열리지만, 메뉴(Vite 절대경로)는 정본으로 유도됨 |
| `http://…` | 구 콘솔 호환만. 코드 301은 걸지 않음 |

세션 파일은 `storage/sessions`(프로젝트 전용). 닷홈 공유 `/tmp` GC(약 20분)와 분리한다. 쿠키 domain은 미지정.

세션 규칙:

- 쿠키 domain 미지정 → 호스트 전용. 세 호스트는 로그인 상태를 공유하지 않는다.
- 닷홈에서 **소셜 로그인을 시작**하면 callback·세션은 닷홈 안에서만 유지된다.
- 닷홈에서 메뉴를 누르면 `https://study114.net` 으로 넘어가고, 그 순간 닷홈 세션은 안 따라간다. **의도된 정본 유도.**
- www→apex 강제, dothome 제거, 코드 301은 **소셜 안정화 후**에만 검토.

---

## 지금 열린 주소

| URL | 상태 |
|-----|------|
| `https://study114.net` | 정본. Cloudflare HTTPS 확인됨 |
| `https://www.study114.net` | 호환 |
| `https://study114.dothome.co.kr` | 임시 호환. Cloudflare 없이 원서버 직접 접근 가능 |
| `http://study114.net` | 구 콘솔 호환만 |

---

## 코드에서 확정한 OAuth callback 경로

패턴: `{origin}/api/auth/oauth/callback.php?provider={naver|kakao|google}`

`origin` 은 소셜 로그인 **시작 요청**의 scheme+host. 세션 쿠키 호스트와 같아야 하므로 정본으로 강제 치환하지 않는다.

| 시작 주소 | 코드가 만드는 Callback URL |
|-----------|------------------------------|
| `https://study114.net` | `https://study114.net/api/auth/oauth/callback.php?provider=…` |
| `https://www.study114.net` | `https://www.study114.net/api/auth/oauth/callback.php?provider=…` |
| `https://study114.dothome.co.kr` | `https://study114.dothome.co.kr/api/auth/oauth/callback.php?provider=…` |

콘솔에는 위 HTTPS URI를 **추가**한다. 구 `http://study114.dothome.co.kr/...` 는 당장 삭제하지 않는다.

---

## `/oauth/start.php` 500에 대해

배포 전 관측(WebFetch)으로 `https://study114.net/api/auth/oauth/start.php?provider=naver` 가 500을 돌려준 적이 있다.

**1순위 가설:** 옛 코드의 HTTPS→HTTP 강제 전환 + Cloudflare HTTPS 유지 → 루프/실패.  
**단정하지 않는다.** 500은 서버 내부 에러이므로 아래도 후보로 남긴다.

- provider key 누락 (이 경우는 원래 로그인 화면으로 302 되어야 함)
- redirect URI 생성 예외
- 세션 start 실패
- PHP fatal / `src/bootstrap.php` include path
- Cloudflare 뒤 HTTPS 감지 실패

확정은 닷홈 PHP error_log / Apache error_log 의 `[oauth/start]` 한 줄이다. 배포 후 start 성공 시 `redirect provider=… origin=… redirect_uri=… https=1 trust_proxy=1` 이 남는다.

---

## 프록시 HTTPS 판단 (신뢰 경계)

`X-Forwarded-Proto` / `CF-Visitor` 는 **항상 믿지 않는다.**

믿을 때:

- `CF-Ray` 또는 `CF-Connecting-IP` 가 있다 (Cloudflare 프록시 통과), 또는
- `STUDY114_TRUST_PROXY=1`

닷홈 원서버(`study114.dothome.co.kr`) 직접 접근은 Cloudflare 흔적이 없으므로 헤더를 무시하고 `HTTPS`/`443` 만 본다.

전제: `study114.net` 은 Cloudflare를 통한다. 원서버 직접 접근을 방화벽으로 막았는지는 **인프라 확인 사항**이지 코드가 보장하지 않는다.

---

## CORS

`Access-Control-Allow-Origin: *` + `Allow-Credentials: true` 는 제거했다.  
`study114_send_cors_headers()` 가 허용 origin만 반사한다. 운영 same-origin은 Origin 헤더가 없어 CORS 헤더를 생략한다.

---

## 배포 후 1차 검증 (정본만)

처음부터 3호스트를 성공 기준으로 잡지 않는다.

1. `https://study114.net` 홈
2. 네이버 로그인 시작 → provider 이동 URL이 https
3. callback이 `https://study114.net/api/auth/oauth/callback.php?provider=naver` 로 복귀
4. 로그인 상태 반영
5. 새로고침 후 세션 유지

있으면 좋은 것: 카카오/구글 동일. 같은 브라우저에서 www 이동 시 세션 분리. 닷홈에서 시작한 OAuth는 닷홈 안에서만 유지.

아직 하지 않는 것: 코드 301, www→apex 통합, dothome 제거.

---

## 남은 사람 작업

1. 네이버·카카오·구글 콘솔에 HTTPS Callback **추가** (구 http 닷홈 유지)
2. 네이버 지도 Web 서비스 URL에 `https://study114.net` · `https://www.study114.net`
3. 콘솔 끝나면 commit/push → Actions `build:dothome`
4. 정본 호스트에서 위 1차 검증
5. Cloudflare 리디렉션·메일 MX/SPF는 후순위
