# 30 — Admin / 부마스터 계정 생성 구조

**작성:** 2026-07-18  
**상태:** 정책 잠금 · MVP 구현 (036 + operators API + `#/admin/permissions`)  
**관련:** 4장 `role_type` · 9장 부록 로그인 · 28장 A28 · A28-08b 권한·계정

---

## 0. 잠금 문장

1. **admin / 부마스터는 공개 회원가입 대상이 아니다.**
2. **signup flow(이메일 가입·OAuth 역할선택)로 `admin`을 만들면 안 된다.**
3. **공통 `users` 체계를 쓰더라도, 생성 경로는 관리자모드 내부 발급만.**
4. **생성·관리 UI 위치: `#/admin/permissions` (권한·계정).**
5. **권한 2단계: `super_admin` / `sub_master`.**
6. **`super_admin`만** admin·부마스터 생성 / 비활성 / 권한변경 / 비밀번호 초기화.
7. **`sub_master`는 운영 기능만** — 계정 생성·권한 변경 불가.
8. **초기 최고관리자:** `jetty@naver.com` (시드 유지 · `super_admin`).
9. **이후 신규 admin/부마스터는 관리자모드 발급만.**

---

## 1. 현재 구조 진단

### 1-1. 데이터

| 계층 | 현재 | 문제 |
|------|------|------|
| `users` | 공통 계정 (email + password_hash + status) | OK — 재사용 |
| `user_roles.role_type` | `… \| admin` | 시장 역할과 운영 역할이 한 ENUM에 공존 (허용하되 **생성 경로 분리** 필요) |
| 관리자 등급 | **코드 하드코딩 이메일 리스트** (`AdminRoleService` / `admin-permissions.js`) | DB 없음 · UI로 추가 불가 |
| 계정 프로비저닝 | SQL seed `026`·`032`만 | 운영 중 발급 UI/API 없음 |
| 강제 비번변경 | 컬럼·플로우 **없음** | 임시비번 운영에 부적합 |
| 감사 | `admin_operation_logs` 존재 · **계정 lifecycle 액션 없음** | 생성/권한변경 로그 미기록 |

### 1-2. 인증·권한

| 경로 | 동작 | 평가 |
|------|------|------|
| 공개 Signup | `student` / `study_room` / `tutor`만 (`SignupService::ROLE_MAP`) | admin 생성 **이미 차단** |
| OAuth 역할선택 | 동일 ROLE_MAP | admin 선택 **이미 차단** |
| OAuth **신규 유저** | `jetty@naver.com`이면 DB에 `admin` 자동 삽입 | **우회 생성 경로** → 차단·정리 대상 |
| 로그인 elevation | master 이메일이면 세션 `role_type`을 `admin`으로 강제 | bootstrap 유지용으로 허용하되, **등급은 DB로 이전** |
| A28-08b UI | 이메일 표 **조회만** | 생성/비활성/초기화 **미구현** |

### 1-3. 용어 (현재 → 목표)

| 현재 코드 | 목표 정책명 | 비고 |
|-----------|-------------|------|
| `master` | **`super_admin`** | UI: 최고관리자 |
| `sub_master` | **`sub_master`** | UI: 부마스터 (유지) |
| `role_type=admin` | 동일 | “운영 계정” 플래그 (등급과 별개) |

> `role_type=admin` = 운영 콘솔 접근 자격  
> `admin_level` = `super_admin` \| `sub_master` (콘솔 안에서의 권한)

---

## 2. DB / role 설계안

### 2-1. 원칙

- 공개 회원과 **같은 `users` 테이블** 사용 (이메일 로그인 단일화).
- 공개 signup이 넣는 역할 ENUM에 **등급을 섞지 않음** → `user_roles.role_type`은 계속 `admin` 한 값.
- **등급·운영 메타는 별도 컬럼/테이블**에 둔다 (이메일 화이트리스트 폐기 목표).

### 2-2. 권장 스키마 (최소)

**옵션 A (권장) — `users`에 운영 메타 추가**

```sql
-- 예시 migration (번호는 구현 시 확정)
ALTER TABLE users
  ADD COLUMN must_change_password TINYINT(1) NOT NULL DEFAULT 0
    COMMENT '임시비번 발급 후 강제 변경' AFTER password_hash,
  ADD COLUMN admin_level ENUM('super_admin','sub_master') NULL
    COMMENT 'NULL=비운영 · role_type=admin일 때만 의미'
    AFTER status;
```

규칙:

| 조건 | 의미 |
|------|------|
| primary `user_roles.role_type = admin` + `admin_level = super_admin` | 최고관리자 |
| primary `admin` + `admin_level = sub_master` | 부마스터 |
| `admin_level IS NULL` 인데 role이 admin | **데이터 오류** — 로그인 시 sub_master로 degrade 또는 거부 (구현 시 택1, 권장: degrade + 로그) |
| 시장 역할만 | `admin_level` 항상 NULL |

**옵션 B — `admin_accounts` 보조 테이블**

```text
admin_accounts (
  user_id PK/FK → users,
  admin_level ENUM(...),
  status ENUM('active','inactive'),  -- users.status와 동기 또는 여기만
  created_by_user_id,
  created_at, updated_at
)
```

1차는 **옵션 A**로 충분. 운영자 수가 적고 조회가 단순함.

### 2-3. 상태

| 필드 | 값 | 효과 |
|------|-----|------|
| `users.status` | `active` / `blocked`(또는 `pending`) | 로그인 거부 · 기존 LoginService 상태 검사와 정렬 |
| UI 라벨 | 활성 / 비활성 | 비활성 = `blocked` (또는 role `inactive`) — **구현 시 한쪽으로 통일** |

권장: **비활성 = `users.status = blocked`** + 운영 로그. (시장 회원 제재와 동일 축, 운영 계정만 필터)

### 2-4. 시드 / bootstrap

| 이메일 | admin_level | 비고 |
|--------|-------------|------|
| `jetty@naver.com` | `super_admin` | **초기 발급 최고관리자 · 유지** |
| `ops@dev.local` 등 | `sub_master` | 로컬/스테이징 전용 · 프로덕션 시드 제외 가능 |

하드코딩 `MASTER_EMAILS` / `SUB_MASTER_EMAILS`는 **마이그레이션 브릿지**로만 남기고, DB `admin_level` 우선 → 최종 제거.

### 2-5. 로그인·세션

```
이메일+비밀번호 검증 (기존)
→ users.status == active
→ primary role_type == admin
→ admin_level ∈ {super_admin, sub_master}
→ 세션: role_type=admin, admin_level=…
→ must_change_password == 1 이면 비밀번호 변경 화면으로만 이동 (A28 진입 차단)
```

`isMasterEmail` 세션 강제 elevation은:

- **유지(과도기):** bootstrap 이메일만, 그리고 DB에 이미 `super_admin` row 있을 것.
- **최종:** elevation 제거 · DB만 신뢰.

---

## 3. 관리자모드 IA — 어디에 넣나

기존 메뉴를 **확장**한다 (신규 탑레벨 불필요).

| 항목 | 값 |
|------|-----|
| 그룹 | 환경설정 (기존) |
| 메뉴 | **권한·계정** |
| 경로 | `#/admin/permissions` |
| screenId | `A28-08b` (확장) |
| 접근 | **`super_admin` only** (현 `masterOnly`) |
| `sub_master` | 메뉴 자체 비노출 · API 403 |

### 화면 구성 (목표)

1. **운영 계정 목록** — 이름 · 이메일 · 등급 · 상태 · 최근 로그인 · 임시비번여부  
2. **계정 발급** — 이름, 로그인 이메일, 임시 비밀번호, 권한등급(`super_admin`|`sub_master`), 상태(활성/비활성)  
3. **행 액션** — 권한변경 · 활성/비활성 · 비밀번호 초기화 (임시비번 재발급 + `must_change_password=1`)  
4. **안내** — “공개 회원가입으로 운영 계정을 만들 수 없습니다”  
5. (기존) 부마스터 차단 메뉴 요약 — 유지 가능

일반 **회원관리**(`#/admin/members`)와 분리:

- 회원관리 = 시장 참여자(학부모·공부방·과외) 제재  
- 권한·계정 = **운영 계정 lifecycle만**

---

## 4. 최소 구현안 (MVP)

### 4-1. 범위

| 포함 | 제외 (후속) |
|------|-------------|
| DB `admin_level` + `must_change_password` | 세분 권한 매트릭스 (메뉴별 체크) |
| API: list / create / patch(level·status) / reset-password | 이메일 초대 링크 |
| UI: `#/admin/permissions` CRUD | 자기 자신 등급 강등 금지 외 UX polish |
| `admin_operation_logs` 기록 | 별도 audit 테이블 |
| Signup/OAuth admin 생성 차단 강화 | 로그인 URL 완전 분리 |
| bootstrap `jetty@naver.com` 시드 정렬 | 다중 super_admin 거버넌스 정책 UI |

### 4-2. API 스케치

| Method | Path | 권한 | 역할 |
|--------|------|------|------|
| GET | `/api/admin/operators.php` | super_admin | 목록 |
| POST | `/api/admin/operators.php` | super_admin | 발급 |
| PATCH | `/api/admin/operators.php` | super_admin | level / status |
| POST | `/api/admin/operators.php?action=reset_password` | super_admin | 임시비번 |

가드: `role_type=admin` ∧ `admin_level=super_admin`.  
`sub_master` → 403.  
자기 자신: 마지막 `super_admin` 비활성/강등 **거부**.

### 4-3. 생성 입력값 (요청 기준)

| 필드 | 검증 |
|------|------|
| 이름 | 필수 · profile.real_name |
| 로그인 이메일 | 필수 · unique · PasswordPolicy와 동일 정규화 |
| 임시 비밀번호 | 필수 · `PasswordPolicy` 적용 |
| 권한등급 | `super_admin` \| `sub_master` |
| 상태 | 활성(`active`) / 비활성(`blocked`) |

생성 시:

1. `users` insert (또는 기존 시장 회원에 admin 부여는 **1차 금지** — 충돌·권한혼선 방지)  
2. `user_profiles` 최소 행  
3. `user_roles` primary `admin`  
4. `admin_level` · `must_change_password=1`  
5. 운영 로그 `admin_account_create`

> 1차 정책: **이미 있는 시장 계정 이메일에 admin을 덧씌우지 않음.** 운영 전용 이메일로만 발급.

### 4-4. 첫 로그인 비밀번호 변경 강제 — 검토 결론

| 선택 | 내용 |
|------|------|
| **채택 (권장)** | 발급·초기화 시 `must_change_password=1`. 로그인 후 비밀번호 변경 완료 전 `#/admin/*` 진입 차단. 기존 `#/mypage/account` 또는 auth 비밀번호 변경 API 재사용. |
| 이유 | 임시비번이 운영자 간 공유·메신저 전달될 수 있음 · seed `"password"` 관행과도 단절 |
| 최소 UX | 변경 성공 시 플래그 0 → 의도한 랜딩(손님홈 또는 직전 URL) |

**1차 MVP에 포함**하는 것을 권장. (없으면 임시비번 운영이 반쪽)

### 4-5. 관리자 로그

기존 `admin_operation_logs` 재사용.

| action_kind | target_type | 메모 예 |
|-------------|-------------|---------|
| `admin_account_create` | `admin_user` | level=sub_master |
| `admin_account_level_change` | `admin_user` | sub_master→super_admin |
| `admin_account_deactivate` / `activate` | `admin_user` | |
| `admin_account_password_reset` | `admin_user` | must_change=1 |

`operator_id` = 조치자 이메일(기존 관례).  
조회는 기존 `#/admin/logs`에 필터 추가(후속) 또는 permissions 화면 하단 최근 N건.

### 4-6. 권한 매트릭스 (1차)

| 능력 | super_admin | sub_master |
|------|-------------|------------|
| A28 운영 조회·숨김·복구·로그 열람 등 | ✅ | ✅ (기존 허용분) |
| permissions / settings / system | ✅ | ❌ |
| 운영 계정 생성·권한변경·비활성·비번초기화 | ✅ | ❌ |
| 자기 비밀번호 변경 | ✅ | ✅ |

---

## 5. 차단해야 할 기존 signup·우회 경로

| # | 경로 | 현재 | 조치 |
|---|------|------|------|
| 1 | `SignupService` ROLE_MAP | admin 없음 | **유지** + 회귀 테스트: `role=admin` 422 |
| 2 | OAuth 역할선택 ROLE_MAP | admin 없음 | **유지** + 동일 테스트 |
| 3 | `OAuthService` 신규유저 · master 이메일이면 `admin` INSERT | **우회 생성** | **제거:** OAuth는 시장 역할만 생성. bootstrap은 SQL/관리자발급만. (이미 있는 jetty row는 유지) |
| 4 | `login.php` / `me.php` / `AuthSession` master elevation | DB 없이도 admin 세션 가능 | 과도기 유지 → DB `super_admin` 필수화 후 **제거** |
| 5 | SQL seed로만 추가 | 개발용 | 프로덕션 런북: seed는 bootstrap 1계정(+선택적 ops)만 · 나머지는 UI |
| 6 | Admin 회원 목록에서 role을 admin으로 변경 | 없음 | **금지 유지** — members API에 role escalate 추가하지 않음 |
| 7 | 클라이언트 Dev 로그인 버튼 | `ops@dev.local` | 개발 전용 · 프로덕션 빌드 제거/비활성 확인 |

**정리 문장:**  
signup mode로 admin이 “생성되던” 공개 경로는 사실상 없었고, **실질 우회는 OAuth master 자동 admin + SQL seed**다. 공개 signup은 차단 상태를 고정하고, OAuth 자동 admin을 제거하는 것이 핵심이다.

---

## 6. 구현 순서 (제안)

1. **정책 문서 확정** (본 문서)  
2. Migration: `admin_level` · `must_change_password` · jetty/ops 시드 백필  
3. `AdminRoleService`를 DB `admin_level` 우선으로 전환 (이메일 리스트 fallback)  
4. API operators + 로그 액션  
5. `#/admin/permissions` UI 확장  
6. `must_change_password` 게이트  
7. OAuth 자동 admin INSERT 제거 + signup/OAuth 회귀 테스트  
8. 하드코딩 이메일 리스트 제거 (bootstrap row DB 확인 후)

---

## 7. 수용 기준 (Done)

- [x] 공개 signup / OAuth 역할선택으로 `admin` 생성 불가 (API 검증)
- [x] OAuth 신규가입이 master 이메일이어도 **새 admin row를 만들지 않음** (기존 jetty 유지)
- [x] `super_admin`만 `#/admin/permissions`에서 계정 발급·권한·상태·비번초기화
- [x] `sub_master`는 동일 API 403 · 메뉴 비노출
- [x] 발급 계정 첫 로그인 시 비밀번호 변경 강제
- [x] 생성/권한변경/비활성/비번초기화가 `admin_operation_logs`에 남음
- [x] `jetty@naver.com` = `super_admin` 유지

### 배포 시 필수

```bash
mysql … < sql/schema/036_admin_level_and_must_change.sql
```

---

## 8. 한 줄 요약

**운영 계정은 공통 users를 쓰되, 생성은 `#/admin/permissions`의 super_admin 발급만 허용한다. 공개 signup·OAuth로는 admin을 만들지 못하며, 등급은 DB의 `super_admin` / `sub_master` 2단계로 관리한다.**
