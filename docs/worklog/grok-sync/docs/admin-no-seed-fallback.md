# 관리자 회원 목록 — API 모드에서 시드 폴백 금지 (2026-11-24)

- 작성: 우동공과3 · 실행·1차 셀프검수: Cursor · 최종검수: 우동공과3
- 기준: `origin/main` (`52e814cc`, 회원 목록 status 검사 위치 수정 시점)
- 작업 브랜치: 최신 `origin/main`에서 `work/admin-no-seed-fallback`. 워크트리는 `D:\work\study114\.wt\` 안에만 만든다.
- PR까지만 올린다. **병합 금지.**

## 종현 확정 (2026-11-24 「확정」)

운영 관리자(`isAdminApiMode()`가 true)에서는 서버 결과가 0명이어도, 캐시가 없어도, 로딩·오류여도 `A28_MEMBER_SEED`(example.com 예시 회원)를 화면에 넣지 않는다. 0명이면 표 대신 「조건에 맞는 회원이 없어요」 한 줄을 보여 준다. 글자는 `a28-copy.js`에 둔다.

시드 데이터는 지우지 않는다. **비API 미리보기에서만** 쓴다.

## 진단 (우동공과3, 읽기만 함)

`preview/home-ui/src/admin/a28-screens.js` `renderMembers()` 1368~1375행 부근:

```
const cache = isAdminApiMode() ? getMembersCache() : null;
const seedFiltered = A28_MEMBER_SEED.filter(...);
const members = cache?.members?.length ? cache.members : seedFiltered;
const counts = cache?.counts ?? countMemberSeed(A28_MEMBER_SEED);
const totalLabel = cache?.total ?? seedFiltered.length;
```

`cache?.members?.length`는 배열이 비어 있으면 거짓이다. 그래서 운영 관리자에서 서버가 0명을 줘도 시드 회원이 표에 나온다. 캐시가 아직 없으면(`null`, 로딩) 같은 식으로 시드가 나온다. `counts`는 캐시가 있을 때 서버 숫자를 쓰므로, 표는 시드인데 칩은 0명일 수 있다. `total`은 `0`이면 `??`를 타지 않아 「목록 3명 / 조건 일치 0명」처럼 어긋날 수 있다. 지금 빈 표 문구는 1572행의 「회원 없음」이다.

같은 파일 `buildMemberDetail()` 215~321행: API 상세가 없으면 `A28_MEMBER_SEED`나 `user{id}@example.com` 더미로 상세를 만든다. API 상세가 있어도 유료 배열이 비면 `paidDefaults`(예: `ORD-DEMO-2`)로 채운다. `renderMembers()`가 상세를 이 함수로 그린다(1415~1416행).

`preview/home-ui/src/admin/a28-screens-bind-content.js` `bindNotifyAdminEvents()` 816~822행: 문자 주소록 동기화가 `cache?.members?.length ? cache.members : A28_MEMBER_SEED`라, 운영에서 회원 캐시가 비면 시드 연락처를 넣는다.

아래는 **같은 패턴이 아니다.** API 모드에서는 캐시만 쓰고, 시드는 `isAdminApiMode()`가 false일 때만 쓴다. 이번 대상에서 빼 둔다.

- 등록 목록 `a28-registration-list.js` `renderRegistrationList()` — 시드 없음. 빈 목록은 `REGISTRATION_EMPTY`(「이 조건에 해당하는 등록이 없습니다.」)
- 주문·이용권 `a28-screens.js` `renderCommerce()` — 시드 없음. 캐시 없으면 「서버 미연결」, 빈 배열은 「주문 없음」 등
- 이용권한 `a28-screens.js` `renderPermissions()` — 시드 없음. 캐시 `null`이면 「목록을 불러오는 중…」, 빈 배열이면 「등록된 운영 계정이 없습니다.」
- 신고 `renderReports()`, 운영 로그 `renderLogs()` — `isAdminApiMode() ? 캐시 : A28_REPORT_SEED` / `A28_LOG_SEED`. 서버 0건을 시드로 바꾸지 않는다.

## 대상 (이 파일만 수정)

1. `preview/home-ui/src/admin/a28-screens.js` — `renderMembers()`와 `buildMemberDetail()`만 고친다. `countMemberSeed()`는 미리보기용으로 남겨 도 된다.
2. `preview/home-ui/src/admin/a28-copy.js` — 빈 목록 문구 상수만 추가한다. 기존 글자는 바꾸지 않는다.
3. `preview/home-ui/src/admin/a28-screens-bind-content.js` — `bindNotifyAdminEvents()` 안의 문자 주소록 동기화(`data-sms-sync-members`)에서 시드 폴백만 고친다.
4. 작업 기록 1개: `docs/worklog/2026/11/` 아래.

`A28_MEMBER_SEED`가 있는 `preview/home-ui/src/admin/a28-screens-state.js`는 시드를 지우거나 고치지 않는다.

## 필수 작업

### A. 회원 목록 (`renderMembers()`)

1. `isAdminApiMode()`가 true이면 `members`·`counts`·`total`에 시드를 넣지 않는다.
   - 캐시가 있으면 `cache.members`(0명이어도 그대로), `cache.counts`, `cache.total`을 쓴다. `cache.members?.length`로 진위를 가리지 않는다.
   - 캐시가 없으면(로딩·오류 포함) 시드 대신 빈 배열과 0으로 둔다. 표 자리에는 기존에 있는 문구를 쓴다. 예: 권한 화면의 「목록을 불러오는 중…」. 새 긴 안내문을 만들지 않는다.
2. API 모드이고 캐시를 받은 뒤 0명이면 **표를 그리지 않고** `a28-copy.js`의 「조건에 맞는 회원이 없어요」 한 줄만 보여 준다. (`<p class="sup-empty">` 정도. 표 안의 「회원 없음」 행으로 대체하지 않는다.)
3. 상태 칩·검색 줄·일괄 막대는 그대로 둔다. 0명일 때도 검색은 할 수 있어야 한다.
4. `isAdminApiMode()`가 false이면 지금처럼 시드를 쓴다. 미리보기 시드 내용·건수는 바꾸지 않는다.

### B. 회원 상세 (`buildMemberDetail()`)

5. API 모드에서 `apiDetail`이 있으면 서버 값만 쓴다. 유료 `positions`·`tickets`·`orders`가 비어 있어도 `paidDefaults`나 시드로 채우지 않는다.
6. API 모드에서 `apiDetail`이 없으면 시드·`user{id}@example.com`·가짜 전화·주소를 넣지 않는다. 상세는 「불러오는 중…」처럼 짧은 기존 투 또는 빈 값만 보여 준다. `_source`를 `seed-dummy` / `empty-dummy`로 두지 않는다.
7. 미리보기(`apiDetail` 없음, API 모드 아님)에서는 지금 시드·더미 보강을 유지한다.

### C. 문자 주소록 동기화

8. `bindNotifyAdminEvents()`의 `data-sms-sync-members`: API 모드에서는 회원 캐시만 쓴다. 캐시가 없거나 0명이면 빈 배열로 동기화한다. `A28_MEMBER_SEED`로 채우지 않는다. 미리보기에서는 시드를 써도 된다.

### D. 문구

9. `a28-copy.js`에 빈 목록 글자만 추가한다. 값은 정확히 `조건에 맞는 회원이 없어요`. 상수 이름은 이 뜻이면 된다. 회원 행·상세의 다른 글자, 등록 목록 `REGISTRATION_EMPTY`는 건드리지 않는다.

## 금지사항

- 위 「대상」에 없는 파일은 열어서 고치지 않는다. 범위 밖에서 버그를 발견하면 고치지 말고 보고서 「발견 목록」에만 적는다.
- **서버·스키마·API를 바꾸지 않는다.** `src/`, `public/api/`, `sql/`는 수정하지 않는다.
- **시드 데이터를 삭제하거나 내용을 바꾸지 않는다.** `A28_MEMBER_SEED`, `A28_REPORT_SEED`, `A28_LOG_SEED`는 미리보기용으로 유지한다.
- 등록 목록, 주문, 이용권한, 신고, 운영 로그 화면은 이번 범위가 아니다.
- `.env`, `secrets`, 키·비밀번호·토큰·세션값, 실제 회원 이메일·전화는 문서·커밋·로그·보고·캡처에 쓰지 않는다.
- 관련 없는 리팩터링, 이름 바꾸기, 포맷 정리, 다른 화면 CSS·문구 변경은 하지 않는다.
- 검증 스크립트를 새로 만들어 실데이터 DB나 `study114_dev`에 돌리지 않는다. 운영 DB에 SQL을 실행하지 않는다.
- force push, `reset --hard`, `stash drop`은 하지 않는다. 더러운 워크트리에서 rebase하지 않는다.
- 커밋, push, PR까지만 한다. **병합하지 않는다.** 배포하지 않는다.
- 글자 수, 유사도, 줄 수, 커버리지 퍼센트 같은 기계 수치는 합격 기준으로 쓰지 않는다.

## 셀프검수 (Cursor)

- 운영 관리자 API 모드에서, 조건에 맞는 회원이 0명일 때 시드(example.com)가 표에 없는지, 「조건에 맞는 회원이 없어요」 한 줄이 표 대신 나오는지 확인한다.
- 캐시가 비어 있는 첫 화면(로딩)에도 시드가 잠시라도 보이지 않는지 확인한다.
- 회원 상세: API 모드에서 유료 항목이 없는 회원을 열면 `ORD-DEMO-2` 같은 더미 결제가 없는지 확인한다.
- 미리보기 모드(`isAdminApiMode()` false)에서는 시드 회원이 예전처럼 보이는지 확인한다.
- 실명·실제 전화번호·실제 이메일은 캡처와 보고에 나오지 않게 한다.

## 완료 보고

1. 바꾼 파일 목록. 새 파일은 「새 파일」로 표시한다.
2. 운영 API 모드, 너비 1280px:
   - 조건에 맞는 회원이 0명인 화면 1장(표 대신 한 줄 문구, 시드 회원 없음).
   - 찍을 수 없으면 재현 순서를 짧게 적는다.
3. 미리보기 모드에서 시드 회원이 그대로 보이는지 확인 한 줄.
4. 발견 목록: 범위 밖에서 보인 문제.
5. PR 링크. 병합하지 않은 상태로 보고한다.
