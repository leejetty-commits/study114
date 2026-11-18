# 12 관리자 통계 최소판

기준: `origin/main` `8b52282c`. 지시서: `origin/docs/reapply-2026-11-17` `docs/handoff/12-admin-stats-min.md` (`837c04a4`).

## 0단계

- `origin/main`은 `8b52282c`였다.
- `/admin` 첫 화면은 `getDefaultAdminPath()`이고 메뉴 순서와 관계없다. `state.js`는 고치지 않았다.
- 메뉴 숨김·경로 차단은 `canAccessAdminMenu`와 `SUB_MASTER_BLOCKED_MENUS`다. 서버 최고관리자 검사는 `AdminApi::requireMaster`다.
- `TestAccountAllowlist::userIds`와 `ReportPeriod`의 `toStorage`, `dbOffsetMinutes`, `storageToKst`, `measuredTz`가 있다.
- 지시서의 표·칼럼 이름은 기존 쿼리·스키마와 같았다. 허용 9개 밖 파일은 필요 없었다.

## 바뀐 파일

- `src/Admin/AdminStatsRepository.php`
- `public/api/admin/stats.php`
- `preview/home-ui/src/admin/a28-stats.js`
- `preview/home-ui/src/admin/a28-copy.js`
- `preview/home-ui/src/admin/route-match.js` (`ADMIN_ROUTE_PATHS`에 `'/admin/stats'` 한 줄)
- `preview/home-ui/src/admin/a28-screens.js` (import 1, 분기 1)
- `preview/home-ui/src/admin/a28-screens-bind.js` (import 1, bind 1)
- `preview/home-ui/src/admin/admin-permissions.js` (`SUB_MASTER_BLOCKED_MENUS`에 `'stats'`)
- `docs/worklog/2026/11/2026-11-19-admin-stats-min.md`

## 수락

1. 메뉴 배열 맨 앞이 통계, 다음이 운영 홈이다. 경로는 `/admin/stats`. 실계정 클릭은 하지 않았다.
2. `getDefaultAdminPath()`는 `/admin` 그대로다. 미리보기 스크립트의 운영 홈 제목 검사는 통과했다.
3. 부마스터 차단 목록에 `stats`가 있고, API는 `requireMaster`다. 권한 화면 라벨은 `통계`다. 실계정 403·접근 제한 화면은 보지 않았다.
4. `requireAdmin()` 기본값이 콘솔 2차 비밀번호 검사다. 잠금 상태 실호출은 하지 않았다.
5. `days`는 7, 14, 30만 허용하고 그 외는 422다.
6. 화면 숫자와 `12-admin-stats-verify.sql` 대조는 운영 DB를 보지 않았다. 종현이 대조한다.
7. 응답·화면에 이메일, 전화, 실명, user_id, 내보내기 버튼을 넣지 않았다.
8. 금액은 화면에서만 천원으로 바꾼다.
9. 회귀 스크립트는 그대로 돌렸다. 실패는 고치지 않았다.
   - `npx vite-node scripts/verify-admin-preview-labels.mjs`: `menu-gray-token` 1건 실패. 이번 변경 파일이 아닌 `home-admin.css` 검사다. 통계 화면·운영 홈 제목은 통과했다.
   - `npx vite-node scripts/verify-admin-162-settlement.mjs`: `api-get-two` 1건 실패. 보고서 API 파일이고 이번 변경이 아니다.
   - `npx vite-node scripts/verify-admin-registration-list.mjs`: `preview-len-17`, `css-added-shell`, `diff-no-delete` 3건, `diff-allowed`, `state-untouched` 실패. `2723c5f`와의 과거 차이이고 스크립트는 허용 파일이 아니다.
10. `cd preview/home-ui && npm run build` 통과. 통계 문구는 관리자 청크에 들어가고, 엔트리 스크립트 `index.html`이 읽는 번들에는 `/api/admin/stats.php`가 없다.

## 보고서와 기준이 다른 점

기존 「보고서」(`/admin/settlement`)는 `status='paid'`만 세고 테스트 계정을 빼지 않는다. 이 통계의 누적 결제와 결제 표는 `paid`, `refund_requested`, `refunded`를 세고, 테스트 계정·운영자 주문은 뺀다. 탈퇴·삭제 회원과 `user_id`가 비어 있는 결제는 넣는다. 이 차이는 화면에 적지 않는다.

## 범위 밖

- `provider_id`가 비어 있는 구독은 미분류·카드 미지정으로 센다.
- 학생 추가 희망 지역(087)은 지역 표에 넣지 않았다.
- 삭제된 테스트 계정의 주문(`user_id` NULL)은 테스트 제외에 걸리지 않는다.
