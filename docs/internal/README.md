# 내부 문서 인덱스 (docs/internal)

**기준일:** 2026-07-17  
**대상:** 기획·개발·배포 논의 (Notion 보조용)

---

## 문서 목록

| 문서 | 용도 | 현재 우선순위 |
|------|------|----------------|
| [00-project-tree-and-key-files.md](./00-project-tree-and-key-files.md) | 코드베이스 지도·중요 파일·API 매핑·배포 트리 | ★ 항상 |
| [01-dothome-deploy.md](./01-dothome-deploy.md) | **닷홈** 배포·CI·DB·빌드·검증·작업 원칙 | ★ **1차 목표** |
| [02-dothome-server-cleanup-checklist.md](./02-dothome-server-cleanup-checklist.md) | **닷홈 서버 파일 정리** (무손상·격리 우선) | 운영 정리 시 |
| [01-cafe24-staging-deploy.md](./01-cafe24-staging-deploy.md) | 카페24 스테이징 (보류·참고용) | 참고 |
| [23-board-community-integration-draft.md](./23-board-community-integration-draft.md) | 게시판 엔진·GNU·SSO 초안 | 장기 |
| [23-board-menu-boundary-audit.md](./23-board-menu-boundary-audit.md) | 게시판/정적/서비스 메뉴 경계 진단 · 프리셋 생성 로직 | ★ 23·33 정렬 |
| [24-youngcart-sample-lab-purpose.md](./24-youngcart-sample-lab-purpose.md) | 영카트 샘플 Lab — 관리자 UX 벤치마크(주) · 커뮤니티 로그인 기초(부) | ★ Lab |
| [28-gnu-member-field-mapping-review.md](./28-gnu-member-field-mapping-review.md) | g5_member ↔ users 기초 대조 · **우동공과 정본** 맞춤 방향 | ★ SSO 전 |
| [29-exposure-gnb-decisions.md](./29-exposure-gnb-decisions.md) | 10-6·관리자 GNB 결정 확정/보류 | ★ |
| [25-youngcart-admin-member-board-port.md](./25-youngcart-admin-member-board-port.md) | 회원·게시판 관리 편의성 이식 Must 1~5 | ★ 진행 중 |
| [26-youngcart-settings-port.md](./26-youngcart-settings-port.md) | 환경설정 → A28-09 운영 설정 이식 | ★ 신규 |
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

## 후속 작업 (보류)

| 항목 | 상태 | 메모 |
|------|------|------|
| 학생 상세 **듀얼 희망지역 UI** (공부방용 1~3 · 과외용 1~3) | 대기 | 14장 프로세스 정렬 완료 후 남은 UI 보완. `main` merge·배포와 별도 |

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-07-18 | 14장 가입·기본=draft·상세=본체·유료=구매 정렬 (feature branch, 배포 보류) |
| 2026-07-09 | 인덱스 최초 작성 — 닷홈 1차·카페24 참고 분리 |
| 2026-07-10 | GitHub Actions CI 배포·Variable·gitignore 산출물·작업 원칙 반영 |
| 2026-07-10 | 02-dothome-server-cleanup-checklist.md 추가 |
| 2026-07-17 | 23-board-menu-boundary-audit.md · Notion 23/30/33 동기화 · policy-log route 잠금 |
| 2026-07-17 | 24-youngcart-sample-lab-purpose.md 추가 — 영카트 Lab 취지·우선순위·진행방식 |
| 2026-07-18 | 25-youngcart-admin-member-board-port.md · 회원·게시판 Must 이식 순서 |
| 2026-07-18 | 26-youngcart-settings-port.md · A28-09 환경설정 |
| 2026-07-18 | 28-gnu-member-field-mapping-review.md — S114 정본·GNU 파생 매핑 · **호스팅 전까지 문서만** |
| 2026-07-18 | 29-exposure-gnb-decisions.md — 1-A·2 B-완화·**3 피어비교열람**·관리자 B·SSO 확정 / 6 보류 |
