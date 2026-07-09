# 내부 문서 인덱스 (docs/internal)

**기준일:** 2026-07-10  
**대상:** 기획·개발·배포 논의 (Notion 보조용)

---

## 문서 목록

| 문서 | 용도 | 현재 우선순위 |
|------|------|----------------|
| [00-project-tree-and-key-files.md](./00-project-tree-and-key-files.md) | 코드베이스 지도·중요 파일·API 매핑·배포 트리 | ★ 항상 |
| [01-dothome-deploy.md](./01-dothome-deploy.md) | **닷홈** 배포·CI·DB·빌드·검증·작업 원칙 | ★ **1차 목표** |
| [01-cafe24-staging-deploy.md](./01-cafe24-staging-deploy.md) | 카페24 스테이징 (보류·참고용) | 참고 |
| [23-board-community-integration-draft.md](./23-board-community-integration-draft.md) | 커뮤니티(그누보드) 연동 초안 | 장기 |
| `.cursor/rules/study114-workflow.mdc` | Cursor 에이전트 작업 원칙 (Git·빌드·배포) | ★ 개발 시 |

---

## 배포 호스팅 한눈에

| 항목 | 닷홈 (현재) | 카페24 스테이징 (참고) |
|------|-------------|------------------------|
| URL | `http://study114.dothome.co.kr` | `https://study114new.mycafe24.com` |
| 웹루트 FTP | `/hosting/study114/html` | `www/` (= `public/` 내용) |
| **자동배포** | `main` push → Actions: `build:dothome` → FTP `public/` | (수동·별도) |
| GitHub Secret | `FTP_PASSWORD` | — |
| GitHub Variable | `VITE_NAVER_MAP_CLIENT_ID` | — |
| PHP | 8.2 | 8.2 |
| DB | MySQL 8.0 · `study114` / `study114@localhost` | MariaDB 10.x |
| 빌드 명령 | `npm run build:dothome` (로컬·CI 공통) | `npm run build:staging` |
| env 예시 | `preview/.env.dothome.example` | `preview/.env.staging.example` |
| DB 예시 | `config/database.php.dothome.example` | `config/database.php.cafe24-staging.example` |
| PHP env 참고 | `config/dothome.env.example` | `config/staging.env.example` |
| 배포 가이드 | [01-dothome-deploy.md](./01-dothome-deploy.md) | [01-cafe24-staging-deploy.md](./01-cafe24-staging-deploy.md) |

**공통:** SPA 경로·`public/.htaccess`·`scripts/build-shared-hosting.ps1` 동일 구조.

**닷홈 주의:** 빌드 산출물(`public/index.html`, SPA 폴더, `assets/index-*`)은 `.gitignore` → **CI 빌드 후 FTP**가 정식. `src/`·`config/`·`storage/`는 `html/` 형제로 **수동 배치** 필요.

---

## 빠른 명령 (개발자)

```powershell
# 로컬 DB + API
docker compose -f docker/docker-compose.dev.yml up -d
.\scripts\apply-schema-dev.ps1

# 닷홈 빌드 (로컬 검증·수동 FTP용)
npm run build:dothome

# 닷홈 프론트 배포 (권장): main push → GitHub Actions
# 사전: Variable VITE_NAVER_MAP_CLIENT_ID · Secret FTP_PASSWORD

# DB 연결 테스트 파일 (업로드 후 삭제)
# public/api/health/db.php → http://study114.dothome.co.kr/api/health/db.php
```

**작업 순서:** 수정 → 빌드 → `git status` → commit → push → Actions 확인 → 사이트 확인

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-07-09 | 인덱스 최초 작성 — 닷홈 1차·카페24 참고 분리 |
| 2026-07-10 | GitHub Actions CI 배포·Variable·gitignore 산출물·작업 원칙 반영 |
