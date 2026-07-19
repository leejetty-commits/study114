# 실계정 dual-capability 관리자 · 홈 미리보기 보류

**작성:** 2026-07-19  
**상태:** 정책 잠금 (038)

---

## 1. 관리자 홈 미리보기 실험 — 원복/보류

- `#/admin/home-preview` · 「서비스 홈 미리보기」 메뉴 · seed/store/guard/CSS/SSOT 문서는 **원복·제거**했다.
- 관리자 콘솔 안에서 역할 홈을 재현하지 않는다. 복잡도 대비 실효성이 낮다.
- **실제 검수는 아래 3개 실계정 로그인으로 진행한다.**

| 계정 | 시장 역할 | 기본 홈 |
|------|-----------|---------|
| `jetty@naver.com` | 공부방 (`study_room_owner`) | `#/study-room` |
| `oauth_4991290476_68f30aa0@users.study114.local` | 과외쌤 (`tutor`) | `#/tutor` |
| `leejetty@gmail.com` | 학생 (`guardian_student`) | `#/parent` |

---

## 2. 권한 정책 (dual-capability)

1. **기존 시장 역할은 primary로 유지**한다. 관리자 전용 계정으로 바꾸지 않는다.
2. **관리자 권한만 추가:** `users.admin_level = super_admin` + secondary `user_roles.role_type=admin` (`is_primary=0`).
3. **로그인 후 기본 진입은 시장 역할 홈**이다. `admin_level`이 있어도 `role_type`을 `admin`으로 덮지 않는다.
4. **관리자 콘솔은 별도 진입:** 유틸바 「관리자 콘솔」·마이페이지 「관리자 콘솔」·`#/admin`.
5. 콘솔에서 「역할 홈으로」로 돌아간다.

예:

- `study_room_owner` + `super_admin`
- `tutor` + `super_admin`
- `guardian_student` + `super_admin`

---

## 3. oauth_… 계정 표시

- **내부 auth email · provider subject 바인딩은 유지** (소셜 로그인 깨지지 않게).
- 사이트 UI에서는 `user_profiles.real_name`(사이트 표시명)을 우선 노출.
- 마이페이지 → 계정/설정 → **사이트 표시명** 수정 (`POST /api/auth/profile.php`).
- 과외 리스팅 노출명 `tutor_display_name`은 등록 UI에서 별도 관리 (계정 표시명과 분리).
- 내부 email 강제 교체는 이번 라운드 범위 밖 (후속 작업 조건 충족 시만).

### 표시 우선순위

1. 사이트 표시명 (`real_name` / 세션 `name`)
2. 소셜 라벨 fallback (예: `카카오 회원`) — 표시명 비어 있고 내부 auth email일 때
3. 일반 이메일 (내부 local 도메인이 아닐 때)
4. 로그인 계정(auth email)은 계정/설정 보조 정보로만

### auth email 변경을 이번에 하지 않는 이유

계정 찾기 · 비번 재설정 · 관리자 목록 · 중복 정책 · OAuth 복구 경로에 영향 가능 → **후속 검토**.

---

## 4. 적용

- SQL 메모: `sql/schema/038_dual_capability_admin.sql`
- 멱등 적용: `DualCapabilityAdminMigrateService` (`confirm: apply-038`)
- 임시 health: `public/api/health/migrate-038.php` (적용 후 삭제)
