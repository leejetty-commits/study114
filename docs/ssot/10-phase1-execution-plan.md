# 10장 — 1차 실행 순서 및 Cursor 병행 작업안

**상태: 잠금**

---

## 1. 원칙

1. **SSOT 먼저** — [docs/ssot/](README.md) 잠금 후 UI·코드
2. **프리뷰 우선** — 기능 완성 전 브라우저 확인 가능한 UI
3. **문서 ↔ 프리뷰 1:1** — 필드명·순서·화면명 일치
4. **충돌 시 SSOT 우선**

---

## 2. 1차 실행 순서 (잠금)

| 단계 | 작업 | SSOT | 상태 | 산출물 |
|:----:|------|------|------|--------|
| 0 | SSOT 문서 정립 | 2·4·5·9·10장 | ✅ | `docs/ssot/` |
| 1 | 인증/가입 UI 프리뷰 | 2장 §3 | ✅ | `preview/auth-ui/` |
| 2 | 메인 4종 UI 프리뷰 | 9장 | ✅ | `preview/home-ui/` |
| 3 | DB DDL 4·5·8장 적용 | 4·5·8장 | ✅ | `study114_dev` · Docker MySQL 8.4 |
| 3b | 검색 UI 프리뷰 | 13장 | ✅ | `preview/search-ui/` |
| 3c | 검색 API · dev 시드 | 13장 | ✅ | `public/api/search/` · `012_search_dev_seed.sql` |
| 4 | PHP MVC 인증·가입 | 2·14장 | ✅ | `/auth/*` · BasicRegisterService |
| 5 | 공부방 등록 UI 프리뷰 | 5장 | ✅ | `preview/study-room-ui/` |
| 6 | 공부방 API·DB 연동 | 5장 | ✅ | `StudyRoomRegisterService` · `api/study-room/register.php` · study-room-ui |
| 7 | 과외쌤 DDL·검색 | 4·8·13장 | ✅ | `008_tutors.sql` · SearchService tutor 탭 |
| 7b | auth-ui ↔ API 실연동 | 2·14장 | ✅ | `auth-api.js` · signup/basic-register/login |
| 8 | 과외쌤 등록 UI 프리뷰 | 8장 | ✅ | `preview/tutor-ui/` |
| 8b | 과외쌤 API·DB 연동 | 8장 | ✅ | `TutorRegisterService` · `api/tutor/register.php` |

---

## 3. Cursor 병행 작업안

### 3.1 권장 병행 패턴

```
[Track A] UI 프리뷰 (Vite 정적)     ←── SSOT 화면·필드 잠금 준수
[Track B] docs + SQL                ←── SSOT ↔ DDL 동기화
[Track C] PHP MVC                   ←── 프리뷰 확정 후 이식
```

- **동시에 하지 않을 것:** 프리뷰 필드 잠금 전 PHP 폼 구현
- **병행 가능:** 9장 홈 프리뷰 + 002 DDL 초안

### 3.2 작업 단위 (Cursor 1세션 권장)

| 세션 | 입력 | 완료 기준 |
|------|------|-----------|
| SSOT 정리 | 2·9·10장 | `docs/ssot/` + 충돌 문서 정리 |
| 인증 프리뷰 | 2장 | 7화면 + DOC-CHECKLIST |
| **홈 프리뷰** | **9장** | **4종 메인 + 역할 전환 + 반응형** |
| DDL 002 | 2장 §5 | migration SQL + members.md 일치 |
| Auth MVC | 2장 | `/auth/*` 라우트·뷰 |

### 3.3 프리뷰 패키지 규칙

| 패키지 | 포트(관례) | 용도 |
|--------|------------|------|
| `preview/auth-ui` | 5173 | 2장 인증/가입 |
| `preview/home-ui` | 5174 | 9장 메인 4종 |
| `preview/study-room-ui` | 5175 | 5장 공부방 등록 |
| `preview/search-ui` | 5176 | 13장 검색 3탭 |
| `preview/tutor-ui` | 5177 | 8장 과외쌤 등록 |

- 공통: `src/styles/base.css` 토큰·브랜드 자산 공유
- 프리뷰 툴바: 화면·테마 전환 (auth-ui 1안/2안 유지)

---

## 4. 완료 정의 (1차 MVP)

- [x] SSOT 2·9·10장 `docs/` 반영
- [x] 인증/가입 7화면 프리뷰 (2장 1:1)
- [x] 메인 4종 프리뷰 (9장)
- [x] 공부방 등록 UI 프리뷰 (5장)
- [x] DDL 로컬 적용 (`scripts/apply-schema-dev.ps1`)
- [ ] study114.net 배포 준비

---

## 5. 다음 우선 1건

> **15장 마이페이지 SSOT 확정** → `docs/ssot/15-mypage-structure.md` (초안) · 이후 16장 쪽지 · 15a 프리뷰

대안: study114.net 배포 준비 · home-ui exposure ↔ search-ui 연동

---

## 5b. 최근 완료

- **home-ui ↔ search-ui GNB 연동** — `preview/shared/preview-links.js` · GNB·지역바 검색 → search-ui (`?role=`)

---

## 6. Cursor 프롬프트 예시

```
기준: docs/ssot/README.md
회원 DB: 2장 + 4장
공부방 DB: 5장 + 005_study_room_ssot_align.sql
순서: 10장 단계 3
```

---

## 6. 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-05-31 | 1차 실행 순서·병행안 초안. 단계 0·1 완료 표시 |
| 2026-05-31 | 단계 2 메인 4종 프리뷰 완료 |
| 2026-05-31 | 4·5장 SSOT 추가 · Cursor 가이드 |
| 2026-07-04 | 단계 8·8b 과외쌤 — tutor-ui · TutorRegisterService · API 연동 |
| 2026-07-04 | auth-ui API — signup 세션 · basic-register · regions · login |
| 2026-07-04 | 단계 7 과외쌤 — 008/010 DDL · tutor 검색 API DISTINCT+ORDER BY 수정 |
| 2026-07-04 | 단계 6 공부방 API — StudyRoomRegisterService · study-room-ui 연동 |
| 2026-07-04 | home-ui ↔ search-ui GNB — preview-links · ?role= 동기화 |
| 2026-07-04 | Notion 6장(2026-07-03) — 안전과외 GNB 제외 · SSOT·nav-config 동기화 |
| 2026-07-04 | home-ui 찜·비교 — ⇄ 선택 3건 · 마이페이지 찜 모달 · sessionStorage |
