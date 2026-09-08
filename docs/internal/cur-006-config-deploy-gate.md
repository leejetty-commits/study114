# CUR-006 · config/auth.php 배포 경로 · deploy dry-run 표

## CONFIG_DEPLOY_GATE 결론

**GO (환경변수 경로)** — 운영 런타임은 `public/.htaccess` `SetEnv` → `study114_env()` → `MailTransportFactory` 가 **config/auth.php 미갱신 서버에서도** SMTP를 선택할 수 있다.

**HOLD (파일 동기화)** — `deploy.yml`은 `config/`를 FTP하지 않는다. 추적 파일 `config/auth.php`를 서버 `/hosting/study114/config/auth.php`에 맞추려면 **수동 단일 파일 업로드**가 필요하다. DB용 `database.php`와 섞어 올리지 말 것.

## 경로 사실

| 항목 | 값 |
|------|-----|
| Git 추적 | `config/auth.php` ✅ / `config/database.php` ❌ (gitignore) |
| 운영 예상 루트 | `/hosting/study114/` |
| bootstrap config 로드 | `src/bootstrap.php` → `dirname(__DIR__).'/config/'.$name.'.php'` → `/hosting/study114/config/auth.php` |
| Actions 배포 | `public/` → `html/` · `src/` → `src/` · **config 미포함** |
| SMTP 비밀 | `.htaccess` placeholder → Secrets 주입 · `auth.php`에 비밀번호 금지 |

## deploy.yml dry-run (정적)

| 로컬 | 서버 | 동작 |
|------|------|------|
| `./public/` | `/hosting/study114/html/` | FTP 동기화 |
| `./src/` | `/hosting/study114/src/` | FTP 동기화 |
| `./config/auth.php` | — | **미배포** |
| `./config/database.php` | — | **미배포·덮어쓰기 없음** |
| `./storage/` | — | **미배포·미삭제** |
| `public/.htaccess` | html/.htaccess | OAuth 필수 Secrets 치환 · SMTP 선택 치환 · 누락 시 배포 중단(OAuth) |

`SamKirkland/FTP-Deploy-Action`에 `dangerous-clean-slate` 등 전체 삭제 옵션 **없음** (현 deploy.yml).

## 권장 운영 적용 순서 (배포 승인 후)

1. Secrets: `STUDY114_SMTP_USERNAME` / `STUDY114_SMTP_PASSWORD`
2. main merge → Actions가 `.htaccess` SetEnv 주입 + `src/Mail/*`·`AuthMailer` 배포
3. (선택) 수동 FTP: **오직** `config/auth.php` 1파일 (비밀번호 없음)
4. `database.php`·`storage/` 손대지 않음
5. probe는 별도 승인 후
