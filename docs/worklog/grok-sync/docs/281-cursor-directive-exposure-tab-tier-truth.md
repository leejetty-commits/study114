# 281 지시서 — 노출 탭·prime_eligible·등록점검 대학 안내를 픽·프라임 기준(서버 tier-check) 하나로 맞추기 + 구매 뒤 필수 비우면 경고

- 기준: origin/main cc150247 (줄 번호는 2026-10-23에 이 코드로 다시 확인함). 브랜치: cursor/281-exposure-tab-tier-truth-20261023
- 2026-10-23 재확인: 281 작업은 아직 main에 없음(표의 「지금」 칸 모두 그대로). 바뀐 줄: SearchService :778→:783, :1028→:1048, :544→:545 / tutor-reg/format.js getExposureMatrix :218-235→:218-260(픽 :245-251, 프라임 :252-258) / study-room-reg/format.js getExposureMatrix :106-125→:105-127, productMatrixRow :81-103 표기 / plans/screens.js 캐시 :477→:480.
- 순서: 275 → 283 → 278 → 240 → 279 → 276 → 277-1 → 277-2 → **281** → 282 → 280

## 0. 앞 지시서 결과 확인 (먼저)
- 277-2가 합쳐진 main에서 시작한다. 276이 src/Search/SearchService.php를 고쳤으므로 줄이 밀렸을 수 있다(2026-10-23 cc150247 기준 :783, :1048). `rg -n "prime_eligible" src/Search/SearchService.php`로 새 줄을 찾고, 「prime_eligible = expanded_complete」 뜻이 그대로인지 확인한다.
- 아래 표의 다른 파일·줄도 「지금」 칸과 같은지 확인한다. 뜻이 달라졌으면 고치지 말고 멈추고 보고한다.

## 쉬운 말 요약 (종현 확인용)
- 노출 탭·검색·등록점검이 픽·프라임 조건을 서로 다르게 말하던 것을 하나(서버 기준)로 맞춘다.
- 픽·프라임을 산 뒤 필수 항목을 비우면 **경고만** 한다(2026-10-22 종현 확정). 저장은 되고, 카드도 그대로 나온다. 막거나 내리지 않는다.
- 기준 하나: 픽·프라임 조건은 서버 src/Paid/TierRequirement.php(missingFor :107, missingFromRecord :125, idsFor :148)와 public/api/paid/tier-check.php(:39-45 pick/prime의 can_buy·missing)뿐. 화면 목록은 preview/shared/pickprime-requirements.js(:13-27 ID 목록). 「상세등록 완료(expanded_complete)」로 판정하는 곳을 없앤다.

## 0-1. 정해진 것
- 구매 뒤 필수 항목이 비면: 경고만(마이페이지 등록 화면 위 노란 띠 하나, 저장은 됨, 카드 노출 그대로).
- 띠 문구: 「픽(또는 프라임) 카드에 필요한 항목이 비어 있어요: ○○, ○○. 채우지 않으면 카드가 덜 채워져 보여요.」

## 1. 허용 파일과 할 일
| 파일:줄 | 지금 | 할 일 |
|---|---|---|
| preview/home-ui/src/tutor-reg/format.js:198-208 | 추천 노출 = expanded_complete, 이유 「상세등록 완료 필요」 | 줄 이름 「픽 카드」, ok = tier-check pick.can_buy, 이유 = 빠진 항목 이름(최대 3개 + 「외 n」) |
| 〃 :209-214 | 대표 노출 = 유료+보임 | 줄 이름 「프라임 카드」, ok = prime.can_buy, 이유 같은 방식 |
| 〃 :218-260 getExposureMatrix (픽 행 :245-251, 프라임 행 :252-258) | expanded 사용 | 같은 tier-check 답 사용 |
| preview/home-ui/src/tutor-reg/store.js:146-155 | 「상세등록 완료 시 추천 노출 신청 가능」, exposureBoostReady=expanded | 힌트 「픽·프라임에 필요한 항목은 등록점검에서 확인하세요」, exposureBoostReady = pick.can_buy |
| preview/home-ui/src/tutor-reg/screens.js:514-524 renderExposure | — | tier-check 답을 받아 넘김(plans/screens.js:480 캐시 방식·paid-api.js:16 tierCheck 그대로 씀, 새 API 없음) |
| preview/home-ui/src/study-room-reg/store.js:152-162 | 「상세정보 완료 시 프라임/픽 노출 후보」 | 위와 같은 힌트, exposureBoostReady = pick.can_buy |
| preview/home-ui/src/study-room-reg/format.js:105-127 getExposureMatrix, :81-103 countProductConditions·productMatrixRow | 지금 자체 개수 셈 | tier-check missing 사용(ROOM_PICK_IDS/PRIME_IDS 라벨) |
| src/Search/SearchService.php:783, :1048 | prime_eligible = expanded_complete | TierRequirement::missingFromRecord(유형,'prime',$row) === [] (행에 필요한 칸이 없으면 멈춤 조건) · :545 주석 고침 |
| src/Registration/StudyRoomHubRepository.php:131 | 같음 | 같은 방식 |
| preview/home-ui/src/mypage/preview-data.js:56, :70 | :70 과외쌤은 expanded로 직접 셈 | 서버 값(t.prime_eligible) 그대로 |
| preview/search-ui/src/search-exposure-mapper.js:72 | 읽기만 | 그대로 |
| preview/home-ui/src/tutor-reg/registration-check-copy.js:142 | 대학/대학원 hint 「상세등록 완료·검색 노출 조건입니다」(틀림) | 「픽 카드 조건이에요. 경력이 있으면 경력으로 대신할 수 있어요.」 |
| 경고 띠: preview/home-ui/src/tutor-reg/screens.js:305-313 renderHub, preview/home-ui/src/study-room-reg/screens.js:325, :361-362 | 없음 | 산 상품(지금 이용 중 픽/프라임)이 있고 그 tier missing이 있으면 띠 하나. 「지금 이용 중」 정보는 plans 화면이 이미 쓰는 값만 사용 |
| 이어지는 verify | — | rg "상세등록 완료 필요\|상세등록 완료 시 추천\|프라임/픽 노출 후보" scripts preview/*/scripts 로 찾은 줄만 (2026-10-23 cc150247 기준 일치 0건 → 고칠 verify 없으면 그대로 둠) |

## 2. 하지 않는 것
- TierRequirement 조건 자체(282가 따로 바꿈), 결제·구매 막기, 저장 막기, 카드 자동 내림, 검색 순서, 새 API, DB.
- **범위 밖이 필요하면 멈추고 보고.**
- 금지 영역: 위 표에 없는 파일·줄 전부. 특히 src/Paid/TierRequirement.php·public/api/paid/tier-check.php·preview/shared/pickprime-requirements.js·paid-api.js·plans/screens.js(읽기만), 결제·DB 스키마·운영 설정, 277 팝업 끌기 파일(draggable-dialog.js 등), 292 카드 배지·사진 파일.

## 3. 확인 (1280 · 390)
- 로컬 새 과외쌤·공부방 계정: 아무것도 안 채움 → 노출 탭 픽/프라임 「빠진 항목」 이름이 tier-check 답과 같음. 등록점검과 같은 항목.
- 픽 항목만 채움 → 픽 ok, 프라임은 남은 항목만.
- 상세등록을 다 안 끝냈어도 픽 항목만 채우면 픽 ok(이전과 달라지는 점).
- 경고 띠: 로컬 DB에서 **새 테스트 계정에만** 이용 중 상품을 넣는 방법이 이미 있으면(seed·로컬 관리자) 그걸로, 없으면 화면 확인은 건너뛰고 단위 확인만. 결제 금지.
- 검색 응답 prime_eligible이 tier-check prime.can_buy와 같음(로컬 테스트 계정 2개).
- 운영·라이브 쓰기 금지.
- 스크린샷: 1280(세로 스크롤 막대가 보이는 상태로)과 390 각각, 로그인 상태별로 찍는다 — ① 비로그인(노출 탭 접근 시 막이/로그인 유도 그대로인지) ② 과외쌤 로그인(빈 계정·픽만 채운 계정) ③ 공부방 로그인(같은 두 경우) ④ 이용 중 상품 있는 테스트 계정(경고 띠, 가능할 때만). 각 장면 전/후 짝.
- 통과 기준: 화면 빠진 항목 = tier-check missing 라벨(순서 포함), 저장 막힘 없음, 콘솔 오류 없음, 기존 verify 스크립트 통과.

## 4. 멈출 때
- 공통 규칙: 표의 「지금」 칸과 실제 코드 뜻이 다르거나, 허용 목록 밖 파일을 고쳐야 하면 → 고치지 말고 즉시 멈추고 파일:줄과 이유를 보고.
- SearchService 행에 TierRequirement가 보는 칸(예: 사진·강의스타일·소개)이 없어 SELECT를 크게 늘려야 할 때 → 멈추고 필요한 칸 목록 보고.
- 「지금 이용 중」 값을 얻을 곳이 없을 때 → 경고 띠만 빼고 나머지 진행, 보고.

## 5. 커밋 나누기
1. 281 fix(exposure): 노출 탭을 tier-check 기준으로(과외쌤·공부방)
2. 281 fix(search): prime_eligible을 TierRequirement로
3. 281 fix(copy): 등록점검 대학 안내
4. 281 feat(hub): 구매 뒤 필수 항목 비면 경고 띠

## 6. 보고
- 커밋 줄, 파일:줄, 노출 탭 전/후 스크린샷(1280·390), tier-check 답과 화면 비교 표. 쉬운 말로.
