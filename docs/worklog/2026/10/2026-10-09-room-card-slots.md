# 2026-10-09 공부방 카드 = 과외쌤 카드 규칙 맞추기 (room-card-slots)

- 브랜치: `cursor/room-card-slots-20261009` (기준 `origin/main` `0d125cc1`)
- worktree: `D:\work\study114\.wt\room-card-slots`
- 작업: 메인 에이전트 직접 (하위 에이전트 없음)
- 위험도: 중간 (공부방·과외쌤 카드 공통 렌더 함수 변경. 서버·DB 변경 없음)

## 1. 지시 원문

> 스샷 두개를 올리는데, 공부방모드야. 기본등록정보가 저런데, 현재 카드에 노출된 항목이 제대로 다 나온거 맞니? 확인해봐. 이상하게 적은거 같은데...

> (베이직 카드 항목은) 9개다. / 과외쌤 카드에서 살펴봐라

> 과외쌤하면서 베이직카드, 픽카드, 프라임카드, 확대카드 등에서 항목들을 전부 정리했어. 공부방에서도 그 규칙들이 맞는지 확인해야해. 그리고 기본등록만으로 노출이 되어야 하고, 베이직카드에 다른 항목이 있다면 그건 상세정보에서 채울거야(선택). 그래서 입력값이 없으면 그대로 빈항목으로 나오면 된다.

점검 보고 뒤 답 (2026-10-09):

> 진행 · 빈 칸 「—」 · 공부방·과외쌤 같이 · (칸 이름) db는 같은걸 받고 있니? 거기에 어떤 내용이 들어가니?

> 각 카드에서 입력값이 없더라도 항목제목은 나와야 해. 그리고 빈자리로 표시하면 돼.

> 빈자리는 그냥 비워두지 말고 하이픈 으로 넣어. '수업운영방식' 이 맞아.
> 「1~4명 / 5~8명 / 9명 이상」으로 바꿔 보여 주는 것도 같이 고칠게요.===> 고쳐

최종 확인: 「수업운영방식」으로 통일 + 1~7번 범위 진행.

## 2. 점검 결과 (작업 전)

이미 맞음:

- 노출 = 기본등록(홍보지역 1)만. `src/Search/SearchService.php` 543~549행 조건은 숨김 제외 + 홍보지역 1. 마이페이지 `study-room-reg/store.js` 159~160행도 상세 완성도와 무관.
- 기본등록은 가격·원생수·수업운영방식을 미리 채우지 않음(`src/Auth/BasicRegisterService.php` 412~553행).
- 픽·프라임 카드는 베이직 9칸 + 특징·소개·배지를 모두 그림(`exposure-render.js` `studyRoomTableRows`).
- 확대카드는 모든 칸이 있음(`detail-decision/studyroom-detail.js`, 같은 날 detail-card-all-fields 작업).
- 서버 검색 응답·검색 페이지 변환은 카드 값을 모두 넘김.

고칠 부분:

1. 홈·찜 변환(`home-basic-live.js` `mapRoom`)이 대상·교습형태·슬로건·원생수·수업운영방식·특징을 버림 → 계동공부방1 카드에 대상·슬로건이 안 보이고 교습형태가 「(선택)」.
2. 확대카드 대체 변환(`exposure-bridge.js` `mapRoomItem`)도 같은 값을 버림.
3. 실제로 쓰는 베이직 가로카드가 값이 없으면 항목을 통째로 숨김(`renderHcardMetaItem`, 슬로건 줄). 과외쌤 가로카드도 같은 함수라 빈 원생수·특징이 숨겨짐.
4. 과목이 비면 summary 줄(소개 문구)로 과목 칸을 채움(홈·확대카드 대체·검색 페이지 변환).
5. 교습형태가 비면 「(선택)」(기본등록 필수 항목인데 선택 표시). 과외쌤 수업장소도 「(선택)」.
6. 정본 47이 옛 공개 게이트(「사진·수업형태·원생수 등이 노출을 막음」) 그대로.

함께 발견: 원생수는 저장값이 영어 코드(`one_to_four` 등)인데 카드가 그대로 찍음. 같은 칸 이름이 베이직 「수업운영방식」, 픽·프라임·확대카드 「수업형태」로 갈림. DB 칸은 하나(`study_rooms.lesson_operation_type`, 타임별 그룹·타임별 혼합학년·개별 방문), 입력 화면 이름은 「수업운영방식」.

## 3. 변경

| 파일 | 내용 |
|---|---|
| `preview/home-ui/src/home-basic-live.js` | `studyRoomSearchCardFields()` 추가: 공부방 카드 칸 값을 검색 응답 그대로. `mapRoom`(홈·찜)이 이 함수를 씀. summary 대체 삭제 |
| `preview/home-ui/src/exposure-bridge.js` | `mapRoomItem`(확대카드 대체)도 같은 함수 사용. summary 대체 삭제 |
| `preview/search-ui/src/search-exposure-mapper.js` | 공부방: 과목·소개·강의방식 summary 줄 대체 삭제 |
| `preview/home-ui/src/exposure-format.js` | `formatStudyRoomCapacity()` 추가: `one_to_four` 1~4명 · `five_to_eight` 5~8명 · `nine_plus` 9명 이상, 모르는 코드 「—」, 예전 자유 입력 문구는 그대로 |
| `preview/home-ui/src/exposure-render.js` | 표 칸(`labeled`·`valOnly`)은 빈 값이면 「—」(전에는 빈칸). 공부방·과외쌤 베이직 가로카드는 새 `renderHcardSlot`·`renderHcardSlogan`으로 항목제목 + 값/「—」를 항상 그림(위치·과외쌤 대상 배지·일정·특징 포함). 슬로건 줄에 「슬로건」 제목. 교습형태·수업장소 「(선택)」 삭제. 칸 이름 「수업형태」→「수업운영방식」. 원생수 한글 표시. 특징과 같은 문구일 때 슬로건을 숨기던 `distinctSlogan` 삭제(입력값은 그대로 보임). 학생 카드의 `renderHcardMetaItem`은 그대로 |
| `preview/search-ui/src/styles/search-visily.css` | 특징 줄에 제목이 붙어 세로 가운데 정렬 1줄 |
| `preview/home-ui/src/detail-decision/studyroom-detail.js` | 확대카드: 「수업운영방식」, 원생수 한글 |
| `preview/home-ui/src/study-room-reg/shop-view-model.js` | 마이샵 칸 이름 「수업운영방식」 |
| `docs/internal/47-study-room-home-card-map.md` | 0절(2026-10-09 최종) 추가: 9칸 표·받는 곳·빈 값 「—」·규칙 8개. 옛 공개 게이트 문장을 노출 조건으로 바꿈, 「수업형태」 말 정리 |
| `scripts/verify-detail-card-all-fields.mjs` | 칸 이름 대응표 「수업운영방식」 |
| `scripts/verify-room-card-slots-20261009.mjs` | 새 검사 |

## 4. 검수 (이 PC)

- 새 검사 `cd preview/home-ui && npx vite-node ../../scripts/verify-room-card-slots-20261009.mjs`: **75 passed, 0 failed**
  - 홈·찜 변환이 서버 응답의 대상·교습형태·슬로건·원생수·수업운영방식·특징·소개를 그대로 넘김, 과목·소개가 비면 비워 둠
  - 계동공부방1과 같은 입력(상세 미입력): 교습형태 공부방 · 대상 초등 · 슬로건 보임, 원생수·수업운영방식·가격 「—」
  - 빈 공부방 × 베이직(로그인·손님·표)·픽·프라임: 항목제목 모두 보이고 값 「—」, 「(선택)」·「수업형태」 없음
  - 원생수 3코드 × 카드 5종 + 확대카드 한글 표시, 영어 코드 안 보임
  - 빈 과외쌤 베이직(로그인·손님)·픽·프라임: 항목제목 + 「—」
  - 수정 전 코드(main `0d125cc1`과 같은 `.wt/card-detail-mask`)에 같은 검사: 6 passed, 69 failed → 이번 변경을 잡는 검사임을 확인
- 기존 검사 (실패 0): detail-card-all-fields 142/0, card-detail-mask-20261009 65/0, wishlist-card-zoom-screen, wishlist-card-zoom, card-visual, card-visual-penetration, tutor-search-fields, student-home-tutor-tier 24/0, guest-baseline-map-cards, smoke-paid-badges-proof, role-home-guard, tutor-box-real-values 49/0
- 수정 전에도 같은 실패(이번 변경과 무관): `verify:tutor-basic-required` 4건(이 PC PHP에 `mb_strlen` 없음), `verify-tutor-region-unit` 1건(4부 비교용 옛 파일이 없는 모듈 `search-provider-self.js`를 찾음). 수정 전 폴더에서 같은 결과 확인.
- 배포 전 검사: `verify:shop-page`, `verify:tutor-inquiries-settings`, `verify:study-room-inquiries-samples`, `verify:board-acl:js`, `verify-no-sample-data`, `check-no-committed-secrets.sh`(Git Bash) 모두 성공
- `npm run build:dothome`: 성공 (산출물은 커밋하지 않음)
- e2e(Playwright)·화면 눈확인은 로컬 서버가 필요해 하지 않음(미확인).
- 독립 리뷰: 사용자 지시 없어 하지 않음.

## 5. 미확인 · 남은 것

- 공부방 상세정보 입력 화면의 원생수 선택지 이름은 `nine_plus` = 「최대 9명」(`preview/study-room-ui/src/state.js` 52행), 카드는 지시대로 「9명 이상」. 입력 화면 말은 이번에 안 바꿈.
- 공부방 픽·프라임 자격(`detail_completion_status`)은 상세 마지막 단계 저장 기준(`StudyRoomRegisterService.php` 1430~1445행). 과외쌤처럼 항목별 판정이 아님. 이번 범위 밖.
- 홈 변환의 쪽지 상태 기본값 `paused`(값이 없을 때)는 이전부터 남은 질문이라 그대로.
- 과외쌤 픽·프라임 사진 위 글자(학적·학교·경력·수업료)는 제목 없는 칸이라 빈 값이면 빈칸 그대로.
- 운영 화면 눈확인은 배포 후.

## 6. 배포 전 사용자 할 일

- 없음 (SQL·환경변수·Secrets·`.htaccess` 변경 없음).

## 7. 승인·main 반영

- 작업 전 확인: 사용자 2026-10-09 18:5x 「진행」·「수업운영방식」·「고쳐」.
- 작업 커밋 `4222bec2` (브랜치 push 완료). main 병합은 사용자 승인 후.
