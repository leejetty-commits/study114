# 사이트 표시명 (display identity)

**작성:** 2026-07-19  
**상태:** 정책 잠금 · MVP  
**관련:** [15장 §8](15-mypage-structure.md) · [admin-dual-capability-accounts.md](admin-dual-capability-accounts.md)

---

## 1. 왜 필요한가

카카오 등 소셜 계정은 이메일을 받지 못하면 내부 auth email  
(`oauth_…@users.study114.local`)이 발급된다.  
이 값은 **로그인 식별자**이지, 사이트에 보이는 이름이 되어서는 안 된다.

## 2. 잠금

1. 내부 auth email은 사용자-facing 주표시값이 아니다.
2. 소셜 provider binding(`user_oauth_accounts`)은 유지한다.
3. 사용자는 **사이트 표시명**만 마이페이지에서 수정한다.
4. auth email 자체 변경은 **후속 검토** (계정 찾기·비번 재설정·중복·관리자 목록 영향).

## 3. 구현

| 항목 | 값 |
|------|-----|
| 필드 | `user_profiles.real_name` 재사용 (신규 컬럼 없음) |
| API | `GET`/`POST` `/api/auth/profile.php` — `display_name`만 |
| UI | 마이페이지 → 계정/설정 → 「사이트 표시명」 |
| 세션 | `AuthSession::updateName` · 프론트 `setAuthDisplayName` |

리스팅용 `tutor_display_name` / `study_room_name` / `public_display_name`은 **마켓 노출명**이며 계정 표시명과 분리한다.

## 4. 후속

- contact/public email 분리
- auth email 안전 변경 가능 여부 검토
- 계정 연결/병합 정책과의 정합
