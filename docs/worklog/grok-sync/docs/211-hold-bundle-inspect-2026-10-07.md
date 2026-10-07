# 211 · 보류 묶음(찾기 주소 통일·단지·bname) — 점검지시문 (읽기 전용, 2026-10-07)

- **작성:** 2026-10-07 06:5x KST (우동공과2, 종현 수면 중 · t1523 야간 위임 — **배포 직전까지만**)
- **문서 번호:** 210은 숨김 재작업 문서용으로 「불필요」표기만 있고 파일 없음 → 본 문서는 **211**.
- **절차 위치 (종현 t1478 잠금):** **점검지시문 (이 문서)** → 커서 작업 후 보고 → 검수 → 보완 작업지시서 → 수행결과 보고 → 재작업 → 검수완료 → 종현 보고 → 종현 승인 후 배포. **이번 단계는 점검만. 작업지시서 발송·구현·배포·클라우드 에이전트 접촉 금지(작성 시점).**
- **정본:** [201](201-studyroom-student-find-region-levels-2026-10-06.md) 전체(특히 t1495~t1519) / [190](190-remaining-work-queue-2026-10-02.md) 보류 묶음·2026-10-07 줄 / [187](187-region-gu-policy-locked-2026-10-01.md)(201이 대체하는 곳) / [050](050-home-neighborhood-students-find-ticket.md) §0-2(201이 대체하는 곳) / ssot/13·internal/65·68(티어·광역)
- **큐 위치 (고정):** 관리자 159-c가 **검수완료**에 이른 **뒤**에 이 점검 결과를 작업지시서로 승격·발송. 숨김·162·159-c와 **병렬 구현하지 않음**. 점검 문서·골격만 미리 준비. **배포 직전에서 멈춤.**
- **같이 도는/이미 끝난 작업 (기준 SHA, 작성 시점):**
  - origin/main = `11b0c0d` (Deploy #393, 라이브)
  - 숨김+문의 `cursor/hide-inquiry-20261007` tip `2723c5f` — **검수완료·배포 직전**
  - 162 `cursor/admin-162-20261007` tip `0a7005c` — **검수완료·배포 직전**
  - 159-c 점검 docs/209 발송·진행 중(베이스=숨김 tip). **이 보류 묶음 작업지시 발송은 159-c 검수완료 후.**

## 0. 권장 베이스 브랜치 (점검이 뒤집지 않는 한)

| 선택 | 내용 | 판정 |
|---|---|---|
| **(a) 권장** | origin/main **`11b0c0d`** 에서 `cursor/hold-find-address-20261007` 분기. 관리자 숨김/162/159-c와 **독립**. | **채택** |
| (b) | 숨김 tip 위 | 기각 — 찾기·등록 주소 핵심 파일은 숨김에 거의 없음. 관리자 diff만 끌고 와 범위가 커짐. |
| (c) | 162 tip 위 | 기각 — 정산·등록쿼리와 무관. |

**겹침(작성 시점, `git diff --name-only origin/main...` 기준):**

| 파일 | 숨김 | 162 | 보류(예상) | 비고 |
|---|---|---|---|---|
| `preview/search-ui/**`, `src/Search/**`, `src/Region/**`, `preview/shared/study-room-basic-form.js`, `preview/shared/location-display.js`, `preview/shared/kakao-postcode.js`, `preview/shared/region-cascade.js`, `src/Auth/BasicRegisterService.php`, `public/api/search/**` | 없음 | 없음 | **핵심** | 독립 안전 |
| `src/StudyRoom/StudyRoomRegisterService.php` | **있음**(saveFacility ~1012 `profile_status` 숨김 유지 +19/−2) | 없음 | **있음**(bname ~560, AddressRegionMatch ~1117, 단지명 폴백 ~1131) | **같은 파일·다른 줄**. 머지 순서만 주의 |
| `preview/home-ui/src/student-reg/screens.js` | 숨김 안내 한 줄 | 없음 | 희망지역 문구(있으면) | 연한 겹침 — 희망 문구만 건드릴지 점검이 확정 |
| `preview/home-ui/src/study-room-reg/screens.js` | 숨김 안내 | 없음 | 보통 불필요 | 겹치면 보고 |
| `preview/study-room-ui/src/form-collect.js` · `TutorRegisterService` | 숨김 | 없음 | 보류 범위 밖(기본안) | 건드리지 말 것 |
| `a28-*.js` · settlement · support_tickets · 076/077 SQL | 숨김/162 | 숨김/162 | **금지** | 관리자 묶음 |

**머지 순서 권고:** 숨김·162·159-c를 main에 먼저 올린 뒤 보류 브랜치를 새 main에 rebase. 보류가 먼저면 숨김 rebase 때 `StudyRoomRegisterService::saveFacility` 숨김 가드를 유지하고, 보류의 bname/단지명 삭제를 되돌리지 말 것. **찾기 UI 파일 자체는 숨김/162/159-c와 경로 겹침 0.**

> 아래 블록 전체를 클라우드 에이전트에 그대로 전달. (**발송은 159-c 검수완료 + 이 점검 검수 합격 후. 지금은 문서만.**)

```
# [보류 묶음] 찾기 주소 통일 · 단지 검색 · 단지명 규칙 · bname 제거 — 점검지시문 (1단계: 읽기 전용)

## 0. 이번 단계 규칙 (어기면 점검 불합격)
- 저장소: leejetty-commits/study114.
- **기준 = origin/main `11b0c0d`** (운영 라이브, Deploy #393).
  시작: `git rev-parse origin/main`(또는 HEAD)가 11b0c0d인지 보고 첫 줄에 적기. 다르면 그 SHA를 적고 그 기준으로 읽기.
- 비교용(수정 0, `git show`만):
  1) `origin/cursor/hide-inquiry-20261007` (작성 시점 tip `2723c5f`) — StudyRoomRegisterService·student-reg 겹침 확인
  2) `origin/cursor/admin-162-20261007` (작성 시점 tip `0a7005c`) — 찾기 파일 겹침 0 재확인
  3) 159-c 브랜치가 있으면 tip SHA와 search-ui/Search/Region/Auth BasicRegister 경로 겹침 표
- 워크트리(권장): 기존 `/workspace/study114-wt159ab` 또는 `/workspace/study114-wt-base`에서 **detached** 로 `origin/main`(11b0c0d)만. **새 장기 워크트리 만들지 말 것.** `git show origin/main:경로` 우선.
- **읽기 전용.** 파일 수정 0, 새 파일 0, 커밋 0, 브랜치 생성 0(`cursor/hold-*` 포함), push 0, PR 0, 머지 0. 자동으로 브랜치·PR이 생기면 즉시 보고하고 아무것도 머지하지 마세요.
- 터미널은 읽기만: git fetch/log/show/status/rev-parse/ls-tree/diff/grep, rg, ls, cat, wc. npm install·build·테스트 실행·DB 접속·라이브 조작·운영 SQL 실행 금지.
- rg는 반드시 `-g '!node_modules' -g '!dist'` (안 붙이면 멈춤).
- 결과는 **마지막 메시지 하나 · 한국어**. 파일로 저장하지 않음. 끝: `git status -sb`(깨끗) + `git rev-parse HEAD` + `git branch --show-current`(detached) + 커밋·PR 0 증명.
- 새 정책 금지. docs/201·187·050·ssot와 코드가 어긋나면 「잠긴 정책과 어긋난 오류」, 정본에 없는 판단은 「종현 결정 필요」(기본안 1개).
- **「범위 밖」「다음에」로 미루지 말 것.** 막히면 「막힘 + 이유 + 풀 방법」.
- 용어: **학생**(학부모 금지). 과외쌤 지역=**과외지역**. 공부방 지역=**홍보지역**.
- 운영 DB 확인 SELECT는 **목록만** 제안. 에이전트가 실행하지 않음(종현/우동공과2).

## 1. 목적
다음 단계 작업지시서(허용 파일·금지·숫자 합격)를 쓸 수 있게, 보류 묶음 전 범위를 **파일:줄**로 확정한다.
범위 한 줄: 찾기 3종 주소 단위 통일 + 구 검색=베이직만 + 20개 페이지 번호 + both 제거 + 단지 검색(읽기전용 id + 서버 조건) + 단지명 추출 규칙 1개로 통일·구규칙 삭제 + bname 폴백 삭제 + 오류 A~D·라벨 LIKE·늦은응답 가드·검증 스크립트 3개 + 지도·현황박스·현재위치가 검색을 따름. **홈 「우리동네 학생」탭 시군구 전환은 미결(201 §2-1) — 건드리지 말고 질문으로만.**

## 2. 배경 결정 (날짜·근거 그대로, 바꾸지 말 것)
- 2026-10-06 t1466/t1467: 공부방→학생찾기 지역 = 시군구 / 동·단지 선택. 「같은 동만」 해제. docs/201 §1. 187:21·050 §0-2 대체.
- 2026-10-07 t1495·t1499: 찾기 3종 주소 단위 통일. 1단계 시·도=선택 가능·단독 검색 불가. 2단계 시군구=필수(공부방 광역 허용). 3단계 동·단지=공부방찾기·학생찾기 열림+행정동/단지 분기, 과외쌤찾기=회색(클릭 불가).
- t1499: 목록 20개 초과 시 페이지 번호 **전체 통일**(검색 결과 화면 포함). ssot/13:17 개정 대상.
- t1500: 찾기 검색필터 **미리 채우지 않음**. 진입 시 홍보1·과외지역1은 지도·현황박스·현재위치만. 검색하면 그 결과가 지도·박스·현재위치에 반영. 현재위치는 필터에 입력된 단계까지.
- t1501: 베이직카드는 모든 검색에서 기본.
- t1502: 게스트=대치동/서울시 강남구·블라인드 유지. 학생 로그인 첫 지도·박스·현재위치=본인 희망/공부방지역의 시군구.
- t1507: 공부방찾기 **시군구 검색 = 전체 베이직만**(픽·프리미엄 제외). 이전 B안(베이직+픽) 대체. 3단계(동·단지)일 때만 프리미엄 그 지역 3칸.
- t1508·t1511: 희망 유형 「과외쌤+공부방」(both) **모든 모드에서 제거**. 희망 유형 기본은 역할 정합(공부방 로그인→공부방) 유지·지역만 비움(201 t1508 기본안, 종현 「다같이 빼」).
- t1509: 학생찾기 주소는 통일 단위를 그대로. 희망=과외 → 3단계 회색, 희망=공부방 → 3단계 열림.
- t1511·t1512: 단지 검색은 가입 단지 추출을 재사용. 읽기전용 complex-id 조회 필요(ComplexEnsure INSERT 금지). 서버에 complex 목록 조건 신설.
- t1514: 단지 이름 추출 규칙 **1개로 통일**, 기존 3(+찾기 4번째) **삭제**.
- t1515 챙길 5가지 + t1519: (1) 4규칙→1공용함수 (2) 단지 이름 필수 검사 (3) 기존 단지 행 재사용·구독 확인 (4) verify 스크립트 3개 (5) 늦은 ensure 응답 덮어쓰기 가드. **사업장·홍보 bname(AddressRegionMatch) 폴백도 제거**(StudyRoomRegisterService ~560, BasicRegisterService=`src/Auth/BasicRegisterService.php` ~614 — 201 문구의 Registration 경로는 오기, Auth가 정본).
- 오류(201 §5·라벨절): A 세종 코드 불일치(확정) · B AddressRegionMatch 이름 폴백(확정, 제거 대상) · C 개편지역 코드(미확인) · D 동명 리 병합(미확인) · 라벨 LIKE 「강동」「성동」·단지→동 전체(확정, DB id 정확 일치로 교체).
- 26번 잔여: 구·라벨 검색 시 roomTierScope 비어 다른 동 프리미엄 표시 → t1507로 구=베이직만과 함께 해소 대상.

## 3. 먼저 읽을 파일·줄 (보고에 「읽음」체크)

### A. 정본
- docs/201 전체(없으면 이 지시 §2만으로 진행하고 「docs 미마운트」)
- docs/187:21 대체 메모 · docs/050 §0-2 대체 메모
- docs/ssot/13 (광역·페이지·preferred_lesson_type both · 지역(동/단지))
- docs/internal/65·68 (프라임 자리=행정동|단지) — 있으면

### B. 찾기 화면·API (origin/main)
- preview/search-ui/src/search-find-surface.js — canonicalFromKakao(~426) · confirmStudyroomDong(~614) · 지역 UI room/tutor/student(~1874-1921) · guPickIncomplete(~2374) · both/희망(~834-853·1750-1773·2757-2776) · 검색 수집·페이지(~2491)
- preview/search-ui/src/search-api.js — 동/구 배제(~65-83) · region_label(~92-99) · page/limit(~125-136)
- preview/search-ui/src/search-enums.js:67-71 · search-schema.js · student-hope-type.js · search-tier-render.js · search-page.js(URL 복원 both)
- preview/shared/location-display.js · region-cascade.js · kakao-postcode.js
- preview/home-ui/src/study-room-home-seed.js(시드·지도·complex_id) · exposure-rules.js · exposure-render.js(프라임/픽/베이직 페이지)
- public/api/search/search.php(게스트 덮어쓰기) · src/Search/SearchService.php(room 473-508·라벨 1326-1379·student 949-970·roomTierScope 1436-1531·studentGuBaseWhere)
- src/Region/RegionGuLink.php · RegionEnsure.php · AddressRegionMatch.php · ComplexEnsure.php
- public/api/auth/regions.php(cities·ensure·listComplexes 경로)

### C. 등록·단지명 규칙 (origin/main)
- preview/shared/study-room-basic-form.js — 사업장(~397-401) · 학생희망(~437-476) · 홍보슬롯(~498-505) · validate(~818-821) · ensure 호출(~627-666·875-881)
- src/StudyRoom/StudyRoomRegisterService.php — 사업장 bname(~560-567) · syncSavedRegions AddressRegionMatch(~1117) · 이름←주소 폴백(~1131-1133) · resolveComplexId
- src/Auth/BasicRegisterService.php — bname(~614-622) · 슬롯 이름 폴백(~715-719) · 학생 단지(~250-265)
- src/Registration/StudentHubRepository.php(applyNamedStudyRoomComplex) · StudentBasicCompleteness.php
- preview/home-ui/src/student-reg/screens.js · student-reg-copy.js · auth-ui signup-basic.js(희망 문구)

### D. 검사·문서 잠금
- scripts/verify-study-room-basic-register-api.mjs · verify-student-mypage-hope-region.mjs · verify-input-fill-rule.mjs
- (참고만) verify-region-save-rules.mjs · verify-map-center-by-role.mjs · verify-position-region-tier.php
- docs/ssot/13:182 both vs DB ENUM(sql/schema/004)

### E. 겹침 확인 (`git show` / `git diff --name-only`)
- hide tip: StudyRoomRegisterService saveFacility · student-reg/study-room-reg 숨김 한 줄
- 162 tip: a28·Report·BasicCardRegisteredQuery만인지(찾기 0이어야 함)
- 159-c tip(있으면): search-ui·Search·Region·Auth BasicRegister·study-room-basic-form 겹침 표

## 4. 점검 질문 (번호대로 전부 답)

### 항목 1 — 주소 단위 통일(화면)
Q1. 공부방/과외쌤/학생찾기 각각 현재 1·2·3단계 UI·보내는 키·전국 검색 경로를 파일:줄로(201 표와 어긋나면 「잠긴 정책과 어긋난 오류」).
Q2. 시·도 단독·빈 지역 검색을 막을 최소 고칠 줄(guPickIncomplete·room 항상 통과·tutor 빈값 통과). 세종(시·도=선택완료, 187) 처리.
Q3. 과외쌤 3단계 「회색」: disabled 관례(학년 칸) vs input-fill 회색 값칸 구분. CSS/마크업 최소안 1개(새 정책 금지, 기존 disabled 재사용이 기본안).
Q4. 학생찾기 희망=공부방일 때 시군구 칸 신설 위치·키(`preferred_region_id`+`preferred_lesson_type=study_room`)·3단계 고르면 구 키 삭제(search-api 재사용) 줄.
Q5. t1500 「필터 비움」: 진입 때 홍보1·저장 지역으로 채우는 줄(~859-878·1850-1857·2766-2771) 목록과 제거 후 지도·박스·현재위치만 남기는 경로(파일:줄).

### 항목 2 — 구 검색 노출·페이지 20
Q6. t1507 「구=베이직만」: searchRooms·roomTierScope·search-tier-render에서 프리미엄/픽을 빼는 최소안(서버에서 tier 비우기 vs 화면에서 베이직만). 기본안 1개.
Q7. 검색 결과 페이지 번호: 홈/게스트 페이지 구현을 재사용할지, search-api page·서버 total 필드가 있는지. 「검색 결과 N건」=받은 개수 결함(201:145) 고칠 줄.
Q8. ssot/13:17·182 개정 문구 초안(한 줄씩). 코드와 문서 동시 허용 목록에 넣을지.

### 항목 3 — both 제거
Q9. both 정의·렌더·URL 복원·서버 ENUM 경로 전부(201 t1508). 전 모드 제거 시 깨지는 verify 0건 재확인.
Q10. 희망 유형 기본값(역할 정합) vs 「필터 비움」충돌 — 201 기본안 유지 근거 줄. 「선택」빈 옵션 제거 여부.

### 항목 4 — 단지 검색
Q11. 읽기전용 complex 조회: regions.php에 action 신설 vs search 필터에서 SELECT만. ComplexEnsure::ensure를 검색 경로에서 호출하면 INSERT → **금지** 근거(ComplexEnsure.php:39-44). 시그니처 제안(region_id+name → id|null).
Q12. searchRooms `complex_id`(+region_basis_type='complex')·searchStudents `preferred_studyroom_complex_id` WHERE 초안 삽입 줄. roomTierScope는 이미 complex_id 수신 — 화면이 보내게만 하면 되는지.
Q13. 화면: 주소찾기 → ensure 동 id + 읽기전용 단지 id → 필터 키. 동 분기 vs 단지 분기 UI(라디오/토글) 위치. 단지 고른 뒤 라벨 LIKE 경로가 더 이상 안 타는지.

### 항목 5 — 단지명 규칙 1개 + bname 삭제
Q14. 4개 추출 규칙 위치(사업장·홍보슬롯·학생희망·canonicalFromKakao)와 **통일 규칙 제안 1개**(카카오 필드만 사용, apartment/buildingName/글자검사 중 무엇). 종현 미지정 → 「종현 결정 필요」+기본안(예: apartment=Y && buildingName 비어 있지 않으면 buildingName, 아니면 빈값 — 또는 점검이 더 안전한 안).
Q15. 서버 삭제 줄: StudyRoomRegisterService 560·1117·1131-1133, Auth BasicRegisterService 614·715-719. 삭제 후 빈 단지명 슬롯 문구(「홍보지역 1…」)와 validateStudyRoomBasicFields 단지명 필수.
Q16. 기존 complexes 행 재사용: 이름 바뀌면 새 id → Prime/Pick 구독 이탈 위험(201 t1515 §A5). 운영 확인 SELECT 목록(아래 §종현)과 코드 쪽에서 「이름 정규화 trim만 /  alike 매칭 금지」 기본안.
Q17. 늦은 ensure 응답 가드: 슬롯·사업장·학생·confirmStudyroomDong 요청 순번 검사 넣을 정확한 줄.

### 항목 6 — 오류 A~D·라벨 LIKE
Q18. 세종 dongIdsUnderGu('36000' vs '36110') 고칠 최소안(RegionGuLink vs 시드 vs 특수 분기). 기본안 1개. 라이브 SQL은 실행 금지·SELECT만 제안.
Q19. 라벨 LIKE 경로(SearchService 1326-1379)를 DB id 정확 일치로 바꾼 뒤 region_label 수신을 거절할지(rejectRegionLabel 재사용). 하위 호환.
Q20. C 개편지역·D 동명 리: 코드만으로 확정 불가한 부분과 운영 SELECT.

### 항목 7 — 지도·박스·현재위치·홈
Q21. 검색 후 지도·현황박스·현재위치 갱신 경로(파일:줄). 과외쌤 지도 없음 재확인.
Q22. 홈 「우리동네 학생」·study-room-home-seed 시군구 전환은 **미결** — 이번 허용 목록에 넣을지 빼야 하는지 근거. 기본안=**빼기**(찾기만).

### 항목 8 — 검사·스크린샷·커밋0
Q23. verify 3개(study-room-basic-register-api · student-mypage-hope-region · input-fill-rule)에서 깨질 줄과 고침 방향. 새 verify 초안 이름·숫자 항목.
Q24. 로컬 preview **만** 스크린샷(라이브 금지): (1) 공부방찾기 지역 칸 현재 (2) 과외쌤찾기 시군구 (3) 학생찾기 희망유형 3옵션(both 보임) (4) 가능하면 주소찾기 단지 선택 후 라벨. 불가 시 이유.
Q25. hide/162/159-c와 파일 겹침 최종표. 권장 베이스 (a) 유지/번복.
Q26. 점검 시작·끝: status·HEAD·detached·`gh pr list`/`git ls-remote`에 hold 브랜치 0.

## 5. 보고 형식 (한국어, 마지막 메시지 하나)
① main SHA · hide tip · 162 tip · (있으면 159-c tip) · 수정·브랜치·PR·push 0 증명
② Q1~Q26 답 — `파일:줄`
③ **바꿔야 할 곳 지도** | 영역 | 파일:줄 | 지금 | 바꿀 내용(한 줄) | 사이트 영향 |
④ **허용 파일 목록 초안** — [찾기화면] / [등록·공유] / [서버 검색·지역] / [서버 등록] / [검사] / [ssot 문구] 묶음. 「무엇만」.
⑤ **건드리면 안 되는 파일**(관리자 a28·settlement·support·076/077·form-collect 숨김 가드·ComplexEnsure INSERT 의미 변경·카카오 필드 삭제 등)과 이유
⑥ **숫자 합격 기준 초안**(측정 가능): 시·도만·빈지역 검색 0 · 구 검색 프리미엄·픽 0 · 페이지 20초과 시 2쪽 존재 · both 옵션 0 · 단지 필터 시 타단지 0 · bname/AddressRegionMatch 호출 0(등록 경로) · ensure 검색 INSERT 0 · verify3 fail=0 · 새 verify fail=0 · 「학부모」0
⑦ **종현 운영 DB SELECT 목록**(실행은 종현) — 아래 §잠정 골격과 동일 계열을 점검이 보완
⑧ 위험(높/중/낮) · 「잠긴 정책과 어긋난 오류」 · 「종현 결정 필요」(기본안)
⑨ 베이스 (a)/(b)/(c) 최종
⑩ `git status -sb` + detached

## 6. 하지 말 것
- 코드·문서·설정 수정, 커밋, 브랜치, push, PR, 머지
- 구조 재설계·무관 정리·관리자 화면·정산·문의·숨김 로직 변경
- ComplexEnsure를 검색에서 INSERT로 쓰기
- 운영 DB·라이브 조작, npm build/test(보고용 실행 금지 — 줄 읽기만)
- 홈 「우리동네 학생」시군구 전환을 임의 확정
- 「범위 밖」으로 미루기
```

---

## §잠정 작업지시서 골격 (점검 결과 반영 전 · **발송 금지**)

> 159-c **검수완료** + 211 점검 보고 검수 합격 후에만 별도 문서로 승격·발송. 지금은 골격.

```
# 보류 묶음 작업지시서 — 잠정 골격 (발송 금지)

기준: origin/main `11b0c0d` (점검이 다른 SHA를 강제하지 않는 한).
브랜치: `cursor/hold-find-address-20261007` (main 11b0c0d에서 분기).
main 푸시·머지·PR 금지(자동 PR은 Draft 유지). 배포는 별도 지시.
절차: 작업 → 보고 → 검수 → … → 검수완료 → 종현 보고 → 승인 후 배포.
**검수완료/배포 직전에서 멈춤.** 클라우드 에이전트 발송은 우동공과2가 함.

## 0. 목표 (잠긴 결정만)
1. 찾기 3종: 1시·도(단독검색불가) / 2시군구(필수) / 3동·단지(공부방·학생 열림+분기, 과외쌤 회색).
2. 공부방찾기 구 검색 = 베이직만(픽·프리미엄 0). 3단계에서만 프리미엄.
3. 검색 결과 포함 전 목록 20개 초과 → 페이지 번호.
4. both(과외쌤+공부방) 전 모드 삭제. 희망 유형은 역할 기본만 유지·지역 필터 비움.
5. 단지: 읽기전용 id 조회 + 서버 complex 조건. ComplexEnsure 검색 INSERT 금지.
6. 단지명 추출 1함수 · 구 4규칙 삭제 · 단지명 필수 · bname/AddressRegionMatch 폴백 삭제(홍보·사업장).
7. 지도·현황박스·현재위치 = 검색 결과 주소. 필터 미리채움 제거.
8. 라벨 LIKE·26번 티어 광역 오표시 해소. 오류 A(세종) 최소 수정.
9. verify 3개 갱신 + 늦은 ensure 가드. 기존 단지 행 재사용.
10. 용어: 학생 / 과외지역 / 홍보지역.

## 1. 허용 파일 후보 (점검이 확정·증감)

[찾기화면]
- preview/search-ui/src/search-find-surface.js — 단계 UI·분기·both·gu 필수·단지 id·페이지·필터 비움
- preview/search-ui/src/search-api.js — 키 배제·page/total
- preview/search-ui/src/search-enums.js · search-schema.js · student-hope-type.js
- preview/search-ui/src/search-tier-render.js · search-page.js(필요 시 URL both)
- preview/shared/location-display.js · region-cascade.js
- preview/shared/kakao-postcode.js — **필드 삭제 금지**, 읽기만
- (공용 추출) preview/shared/complex-name-from-kakao.js (새) 또는 동등 1파일

[등록·공유]
- preview/shared/study-room-basic-form.js — 4규칙→1함수 · validate 단지명 필수 · ensure 순번 가드
- preview/home-ui/src/student-reg/screens.js · student-reg-copy.js — 희망 실패 문구만(숨김 한 줄 삭제 금지)
- preview/auth-ui/src/signup-basic.js — 희망 문구만(해당 시)

[서버 검색·지역]
- src/Search/SearchService.php — 라벨거절/id일치 · complex WHERE · 구 검색 티어 · total/page · 세종
- public/api/search/search.php — 필요 시 total 전달만
- src/Region/RegionGuLink.php — 세종 최소
- public/api/auth/regions.php (+ Region 서비스 조회 메서드) — complex **읽기전용** action
- src/Region/AddressRegionMatch.php — 호출 제거 후 파일 삭제 여부는 점검(다른 호출 0일 때만)

[서버 등록]
- src/StudyRoom/StudyRoomRegisterService.php — bname·AddressRegionMatch·이름←주소 폴백 삭제만.
  ※ 숨김 tip의 saveFacility(~1012) 숨김 유지와 **같은 파일**. rebase 시 숨김 가드 유지.
- src/Auth/BasicRegisterService.php — bname·이름 폴백 삭제 · 학생 단지 메시지
- src/Registration/StudentHubRepository.php — 필요 시 이름 ensure 경로만

[홈·시드 — 기본안 제외, 점검 Q22]
- preview/home-ui/src/study-room-home-seed.js — 찾기 연동·지도만 필요 시. 「우리동네 학생」시군구 전환은 미결이라 **기본 제외**

[검사]
- scripts/verify-study-room-basic-register-api.mjs
- scripts/verify-student-mypage-hope-region.mjs
- scripts/verify-input-fill-rule.mjs
- scripts/verify-hold-find-address.mjs (새) — 숫자 항목은 점검이 채움

[문서·잠금]
- docs/ssot/13-… (both·페이지·광역 문구) — 허용 시 「문구만」

## 2. 금지
- 관리자 a28-* · settlement · support_tickets · 076/077 SQL · hide 알림/문의
- preview/study-room-ui/form-collect.js · TutorRegisterService 숨김 가드 손대기
- ComplexEnsure 검색 INSERT · complexes UNIQUE 강제 마이그레이션(운영 판단 전)
- 구조 재설계·무관 정리·허용 목록 밖 사이트 파일
- 홈 「우리동네 학생」시군구를 미결인데 구현
- 「학부모」카피 재도입 · both를 다른 이름으로 부활

## 3. 종현 운영 DB 체크리스트 (에이전트 실행 금지)
1. 동 행 unit_level='dong' sigungu_code 앞5가 073 선택 official_code에 안 붙는 목록(세종 36000/36110·개편·00000).
2. complexes: name=address 인 행 수 · 「(주소 미등록)」 수 · (region_id,name) 중복 · 037 시드 존재.
3. study_room_regions / students: basis=complex 인데 complex_id NULL · basis=dong 인데 complex_id 있음.
4. complex_id가 걸린 진행 중 Prime/Pick·대기(subscriptions·assignments·waitlists) 건수.
5. 학생 희망 단지 행에 preferred_studyroom_region_id가 같이 있는지.
6. AddressRegionMatch/bname으로 생겼을 법한 동 행(같은 시군구·동명·코드만 다름) 표본.
7. (참고) 068/숨김·162 SQL 적용 여부는 이 묶음 범위 밖 — 건드리지 말 것.

## 4. 숫자 합격 기대 (점검이 숫자 확정)
1. 시·도만 / 지역 빈 검색 → 검색 요청 0(막힘 UI)
2. 공부방찾기 구 검색 결과: 프리미엄 배지 0 · 픽 전용 칸 0 · 베이직만
3. 결과 21건 픽스처 → 페이지 2 존재, 1쪽 20
4. 희망 유형 옵션 정확히 2(과외쌤·공부방), both·「과외쌤+공부방」문자열 0
5. 단지 필터 → 타 단지 카드 0 · 검색 경로 complexes INSERT 0
6. 등록 경로 AddressRegionMatch::match 호출 0 · address_bname 폴백 0
7. verify 3개 fail=0 · 새 hold verify fail=0 · build OK
8. diff 파일이 §1 안 · 금지 파일 diff 0줄
9. 「학부모」0 · 게스트 대치/강남구 동작 회귀(덮어쓰기 유지)

## 5. 발송 전 체크
- [ ] 159-c 검수완료
- [ ] 숨김·162 배포 여부·main tip 재확인(베이스 SHA 갱신 필요 시 문서 정정)
- [ ] 211 점검 보고 검수 합격
- [ ] 단지명 통일 규칙 종현 확인(또는 기본안 이의 없음)
- [ ] 허용 파일·숫자 최종화
- [ ] 클라우드 에이전트 미발송(이 골격 단계)
```

---

## §작성 시점 코드 메모 (우동공과2, 읽기 전용, main `11b0c0d`)

- BasicRegisterService 정본 경로 = **`src/Auth/BasicRegisterService.php`**(201의 Registration 표기는 오기).
- both = `preview/search-ui/src/search-enums.js:70` 한 정의. 서버 ENUM에 both 없음 → URL both는 0건.
- ComplexEnsure는 없으면 INSERT. regions.php에 읽기전용 complex-by-name 없음(listComplexes는 목록용).
- 숨김이 만진 StudyRoomRegisterService는 saveFacility profile_status(~1012)뿐 → 보류 bname/단지 줄과 **줄 충돌 없음**, 파일 충돌만.
- 찾기 핵심 경로와 hide/162 파일 목록 교집합 ≈ StudyRoomRegisterService(+ 연한 student-reg 문구)뿐.

## §진행 메모
- 2026-10-07 06:5x: 211 점검지시문·잠정 골격 작성. **미발송.** 159-c 검수완료 후 점검 에이전트 발송 예정. git 브랜치·push·클라우드 접촉 없음.

- 2026-10-07 06:56: 점검 에이전트 발송(bc-492ae05d, main `11b0c0d`, 읽기전용). 159-c 구현과 병행.
- 2026-10-07 07:0x: 점검 보고 검수 → **점검 합격** (§검수 결과). 작업지시서 [212](212-hold-bundle-work-order-2026-10-07.md) 작성(발송·git·클라우드 미접촉).

---

## §검수 결과 (2026-10-07 07:0x KST, 우동공과2 · t1523 야간 위임)

### 판정: **점검 합격**

클라우드 점검(bc-492ae05d) 마지막 보고를 코드(`origin/main` `11b0c0d`, `/workspace/study114-wt-base`)와 대조. 커밋·브랜치·PR·push **0**. 핵심 주장 전원 재확인. 「종현 결정 필요」는 기본안을 **채택**(이의 없음 = 동의)해 작업지시서에 「종현 확인 필요(구현 기본안)」로 옮김. 작업지시서: [212](212-hold-bundle-work-order-2026-10-07.md).

### 1. 커밋·브랜치·PR 0 증명

| 항목 | 보고 | 검수 |
|---|---|---|
| HEAD / origin/main | `11b0c0d82769ba27fa0792be59550e0aa14f233d` detached | 동일 확인 |
| 숨김 tip | `2723c5f` | 동일 |
| 162 tip | `0a7005c` | 동일 |
| hold 원격 브랜치 | 0 | `git ls-remote --heads origin` hold 0 재확인 |
| hold PR | 0 | 보고·로컬 검색 일치 |
| 워크트리 수정 | 0 (보고 status 깨끗) | 검수 중에도 저장소 브랜치·파일 미수정 |

### 2. 스팟체크 (보고 주장 ↔ 코드)

| 주장 | 결과 | 근거 |
|---|---|---|
| `guPickIncomplete` room·학생공부방 항상 통과 | **맞음** | `search-find-surface.js:2374-2376` `return false` |
| `roomTierScope` sigungu/라벨 → 빈 배열 | **맞음** | `SearchService.php:1436-1448` complex_id·region_id만 |
| `regionLabelToken` `·` 앞 + LIKE 버그 | **맞음** | `:1333-1335` + `applyRegionLabelMatch` `%token%` on dong/sigungu/sido |
| `ComplexEnsure` 없으면 INSERT | **맞음** | `ComplexEnsure.php:38-44` |
| 단지명 규칙 4개 | **맞음** | 사업장 `397-399` apartment∧buildingName / 홍보 `498-500` buildingName 무조건 / 학생 `437-441` `아파트\|단지` / 찾기 `427` apartment∧buildingName |
| bname·이름 폴백 줄 | **맞음** | StudyRoom `560-567`·`1117`·`1131-1133` / BasicRegister `614-622`·`717-719`. AddressRegionMatch 호출처 = 이 3곳뿐 |
| 세종 `36000`≠`36110` | **맞음** | 073:125 `3600000000` · `dongIdsUnderGu` LEFT5 일치만 · 동 bcode `36110` |
| both | **맞음** | `search-enums.js:70` · DB ENUM both 없음 |
| 숨김 soft overlap | **맞음** | hide diff = `saveFacility` ~1012 profile_status만(+19/−2). bname 줄과 **줄 충돌 0** |
| 162 찾기 경로 겹침 | **맞음** | search/Region/BasicRegister/study-room-basic 0 |

### 3. 정정·보완 (합격에 영향 없음)

1. **docs 미마운트**: 점검 워크트리에 `docs/201`·`187`·`050`이 없어 「docs 미마운트」로 표기. 정책은 211 §2·정본은 `study114-ds`에 있음. **코드 사실 오류 아님.** 작업지시서는 ds 정본(201 t1495~t1519)을 잠금으로 쓴다.
2. **줄 ±1**: hide `saveFacility` 보고 「1013」 → 실제 diff 시작 `1012`. 작업지시서는 **~1012**로 통일.
3. **Q21 현재위치**: 검색 후에도 저장 지역을 쓰는 줄(`search-page.js:98-100`, `search-find-surface.js:2224-2229`)은 t1500과 어긋남 → 작업지시서에 **검색 후 필터 단계로 갱신** 포함(보고 기본안 채택).

### 4. 「잠긴 정책과 어긋난 오류」(보고 ⑧ 채택 · 구현으로 해소)

- **Q1 현재 UI ≠ 201 통일 3단계** — 공부방=주소 1칸·전국 가능 / 과외=시군구만·빈값 전국 / 학생=희망별 갈라짐. **가장 큰 잠금 어긋남.**
- 빈 지역·시·도 단독 검색 허용(Q2) · 구 검색≠베이직만(Q6, 26번) · 페이지·total 결함(Q7) · both 옵션(Q9) · 필터 미리채움(Q5) · 단지→동 LIKE(Q13·Q19) · ssot/13:17·182 문구 불일치.

### 5. 「종현 결정 필요」→ 채택 기본안 (이의 없음 = 동의)

| # | 주제 | 채택 기본안 |
|---|---|---|
| Q14 | 단지명 1규칙 | `apartment === true` && `buildingName` trim 비어 있지 않으면 그 이름, 아니면 빈값. 글자검사·주소 폴백 금지 |
| Q3 | 과외 3단계 회색 | 학년 칸과 같은 `disabled`(input-fill 회색 값칸 쓰지 않음) |
| Q6 | 구=베이직만 | 서버: 시군구만이면 `exposure_tier=basic`·프라임/픽 스코프 비활성. 3단계(region_id\|complex_id)만 기존 티어 |
| Q10 | 희망 유형 vs 필터 비움 | 유형=역할 정합 유지·빈 「선택」 제거. 비우는 것은 지역만 |
| Q11 | 단지 id 조회 | `regions.php` action `complex-by-name` SELECT만. ComplexEnsure 검색 경로 금지 |
| Q16 | 기존 단지 행 | trim 정확 일치만. LIKE·유사 매칭·UNIQUE 마이그레이션 금지(종현 전) |
| Q18 | 세종 | `dongIdsUnderGu`: 구 official 앞5=`36000`이면 동 `36110`도 포함. 시드 추가 없음 |
| Q19 | 라벨 | 공부방도 `rejectRegionLabel(...,'region_label')`. id 정확 일치만 |
| Q22 | 홈 우리동네 학생 | **시군구 전환 제외**. `region_label` 전송 중단만(id 없으면 지역 키 생략) |

### 6. 다음

- 작업지시서 **212** 작성 완료. **클라우드 발송·브랜치 생성은 이 검수 단계에 하지 않음**(우동공과2 발송 시점 = 159-c 검수완료 후·또는 종현/위임 재지시).
- 배포 직전에서 멈춤(t1523). 운영 DB SELECT는 종현만.
