# 2026-11-08 — 찾기(검색)에서 학생→공부방 쪽지 차단 수정

**상태:** 코드 수정 · 배포·승인자 실측 대기  
**브랜치:** `fix/search-memo-nav-role`  
**계기:** 보안 5-2 쪽지 스모크 중. 학생 홈(가능동)에 공부방 없어 찾기에서 의정부 타동 공부방 쪽지 → 「이 대상에게는 쪽지를 보낼 수 없습니다.」

## 원인 (쉬운 말)

- 학생→공부방 쪽지 자체는 허용 정책이 맞음(상대 `inquiry_status=open`일 때).
- 찾기 SPA(`/search/#/search/room…`)는 홈 `SCREEN_META` 밖이라 `getNavRole()`이 **guest**로 떨어짐.
- 쪽지 시작(`startFirstMemoFlow`)이 그 guest를 보고 막아 버림. 쪽지설정(받는 중)과 무관.

## 수정

| 파일 | 내용 |
|------|------|
| `preview/home-ui/src/state.js` | `isSearchRoute()` 추가. 찾기에서는 로그인 세션 역할 우선 |
| `preview/home-ui/src/messages/compose-flow.js` | nav가 guest면 `navRoleFromAuthUser(getAuthUser())`로 보정 (layout과 동일 축) |

## 승인자 확인

1. 학생(소셜 OK) 로그인  
2. 공부방 찾기에서 가능동 외·의정부 등 받는 중 공부방 카드 → 쪽지  
3. **기대:** 작성 창이 열림 (막힘 문구 아님)  
4. (참고) 학생 홈 `#/parent` 같은 동네에 공부방이 뜨면 그쪽 쪽지도 계속 가능해야 함

## 보안 5-2과의 관계

확인 1(설정 URL 교차)은 이미 통과. 쪽지 실측은 이 수정 배포 후 이어서.
