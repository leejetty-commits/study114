# CUR-006 · config 배포 · Resend

## CONFIG_DEPLOY_GATE: GO (env)

운영은 `public/.htaccess` SetEnv:
- `STUDY114_MAIL_TRANSPORT=resend`
- `STUDY114_MAIL_FROM=no-reply@study114.net`
- `STUDY114_RESEND_API_KEY` ← GitHub Secret 주입 (placeholder `__STUDY114_RESEND_API_KEY__`)

`config/auth.php`는 Git 추적·비밀번호 없음. FTP `config/` 전체 업로드 금지.
`database.php`·`storage/` 미배포.

`deploy.yml`은 `STUDY114_RESEND_API_KEY`를 **선택 주입**. 미설정 시 placeholder 유지 → fail-closed.
