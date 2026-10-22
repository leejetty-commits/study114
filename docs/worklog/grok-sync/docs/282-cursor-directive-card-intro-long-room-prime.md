# 282 지시서 — 공부방 「짧은 소개」 입력 빼기, 카드 소개를 긴 소개로, 픽·프라임 카드에 수업스타일 보이기

- 기준: origin/main 1e42b27d (줄 번호는 2026-10-22에 이 코드로 다시 확인함). 브랜치: cursor/282-card-intro-long-20261022
- 순서: 275 → 283 → 278 → 240 → 279 → 276 → 277-1 → 277-2 → 281 → **282** → 280

## 0. 앞 지시서 결과 확인 (먼저)
- 281이 합쳐진 main에서 시작한다. 276·281이 exposure-render.js, SearchService.php, 노출 탭을 고쳤으므로 줄이 밀렸을 수 있다. `rg -n "intro_short" <파일>`로 새 줄을 찾고 아래 「지금」과 뜻이 같은지 확인한다.
- 281이 노출 탭·경고 띠를 TierRequirement 기준으로 바꿨는지 확인한다(이번에 그 기준 목록을 바꾸므로, 281 화면이 새 목록을 그대로 따라가야 한다).
- 다르면 고치지 말고 멈추고 보고한다.

## 쉬운 말 요약 (종현 확인용, 2026-10-22 확정)
- 공부방: 「짧은 소개」 입력칸을 없앤다. 픽 필수 항목에서도 빼고 「긴 소개」를 넣는다.
- 공부방 **픽·프라임 카드 둘 다** 「소개」 = 긴 소개를 한 줄로 줄여 보여 주고(2026-10-21 종현 결정), 확대카드에서는 전부 보여 준다.
- 공부방 픽 카드에 「수업스타일」을 더 보인다. 프라임 카드에 「수업스타일」「수업스타일 추가설명」「주당 수업회수」를 더 보인다.
- 과외쌤: 카드 「소개」도 긴 소개를 쓴다(검색 결과에 긴 소개를 실어 보냄).
- 이미 저장된 짧은 소개 데이터는 **지우지 않는다.** DB 칸도 그대로.

## 1. 공부방 — 짧은 소개 입력 빼기
| 파일:줄 | 지금 | 할 일 |
|---|---|---|
| preview/study-room-ui/src/screens/step-lesson.js:285-287 | 짧은 소개 입력칸 | 제거 |
| preview/study-room-ui/src/form-collect.js:293, :366, :378, :437 | intro_short 모으기·보내기 | 입력칸이 없어도 오류 없게. **보내지 않음**(서버가 키 없으면 기존 값 유지하는지 확인, 지우는 동작이면 멈추고 보고) |
| preview/home-ui/src/study-room-reg/screens.js:480 | renderDetailForm(:435) 안 짧은 소개 — 이 함수는 부르는 곳이 없음 | 손대지 않음(쓰지 않는 코드). 보고만 |
| preview/home-ui/src/study-room-reg/registration-check-model.js:484 | 등록점검 고치기 창(RC_LIGHT_FIELDS)의 짧은 소개 | 공부방에서 제거(과외쌤 쪽이 같은 목록을 쓰면 공부방만) |
| preview/home-ui/src/study-room-reg/embedded-panels.js:117, :300 · summary.js:173 · shop-completeness.js:30, :92 | 짧은 소개 표시·완성도 셈 | 공부방에서 짧은 소개 줄 제거, 완성도는 긴 소개로 |

## 2. 공부방 — 픽·프라임 필수 목록
| 파일:줄 | 할 일 |
|---|---|
| src/Paid/TierRequirement.php:28 ROOM_PICK_IDS | `['cover','intro_long','fee','teaching_style']` |
| 〃 :31-38 ROOM_PRIME_IDS(:33에 intro_short) | intro_short 제거(입력칸이 없어 영원히 못 채우므로). 나머지 그대로 |
| 〃 :55 라벨, :188 | 그대로 두어도 됨(과외쌤·다른 곳이 쓰면 유지) |
| preview/shared/pickprime-requirements.js:17, :20, :42, :170, :182 | 서버와 같은 목록으로 |
| preview/home-ui/src/study-room-reg/registration-check-copy.js:84, :87, :95 · registration-check-model.js:170, :300, :302, :370 | 등록점검 화면이 새 목록을 따르게 |
| scripts/verify-pickprime-purchase-gate.php / .mjs | 공부방 목록을 확인하는 줄만 새 목록으로 |

## 3. 카드
| 파일:줄 | 할 일 |
|---|---|
| preview/home-ui/src/exposure-render.js:444 (공부방), :479·:498 (과외쌤) | 소개 = `intro_long || '—'`. 함수 하나(introText)를 :356 근처에 두고 세 곳이 씀 |
| preview/home-ui/src/styles/home-listings.css:1327 .expo-tbl__cell--intro | 한 줄 말줄임(white-space:nowrap; overflow:hidden; text-overflow:ellipsis) |
| exposure-render.js:418-446 studyRoomTableRows, :522 renderPickStudyRoom | 픽(stack 갈래 :420-431, :522의 `showIntro: false`→`true`): 「수업스타일」 줄과 「소개」(긴 소개 한 줄) 줄 추가. 프라임(아래 갈래 :433-446, :504에서 부름): 「수업스타일」「수업스타일 추가설명」(한 줄 말줄임)「주당 수업회수」(「주 n회」) 줄 추가, 비면 「—」 |
| 수업스타일 이름 | 공부방 등록 화면이 쓰는 이름 목록(study-room-ui state.js TEACHING_STYLE_OPTIONS)을 그대로 씀. home-ui에서 가져올 수 없으면 멈추고 보고 |
| preview/home-ui/src/detail-decision/studyroom-detail.js:46 | 확대카드 소개 = 긴 소개 전부(없으면 「—」) |
| src/Search/SearchService.php:684-701 공부방 SELECT | sr.teaching_style_ids, sr.teaching_style_note, sr.lessons_per_week 추가(칸은 sql/schema/043에 있음) → :761 근처 응답에 같은 키 |
| 〃 :927-929 과외쌤 SELECT | t.intro_long 추가 → :1012 근처 응답 'intro_long' |

## 3-1. 정본 문서 고치기 (문서만)
| 파일 | 할 일 |
|---|---|
| docs/internal/47-study-room-home-card-map.md §0-2 #6 | 픽 = 베이직 9칸 + 특징 1개 + 수업스타일 + 소개(상세소개 한 줄) + 신뢰배지. 프라임 = 베이직 9칸 + 특징 1~3 + 수업스타일 + 수업스타일 추가설명 + 주당 수업회수 + 소개(상세소개 한 줄) + 신뢰배지 |
| 〃 「카드 말 ↔ 등록 폼 말」 표 소개 줄(:110) | 「소개 = 공부방 소개/자랑(상세소개) 한 줄 · 픽·프라임」. 수업스타일·추가설명·주당 수업회수 줄 추가 |
| docs/ssot/11-main-exposure-and-compare.md §4-1 소개(:97) `intro_short`→`intro_long`, §4-2(:103) 「Pick: Prime에서 소개 제외」→ 픽 = 위 47 목록, §5-1(:134-135) 과외쌤 소개 = `intro_long` | 같은 내용으로 |
| Notion 11장(메인 노출 항목) 카드 항목 목록 | 저장소에서 고치지 않는다. 보고에 「Notion 11장 고칠 내용」으로 위 목록을 적어 종현이 고치게 한다 |

## 4. 하지 않는 것
- 기존 짧은 소개 데이터·DB 칸 삭제, 마이샵(275 파일: shop-view-model.js:161, public-model.js:102·159), 과외쌤 입력칸·과외쌤 필수 목록, 과외쌤 확대카드(tutor-detail.js:52 — 정해지지 않음), exposure-format.js:271-282·SearchService.php:729 「가운데 글」(짧은 소개를 씀, 이번 아님), 학생 카드, 카드 크기.
- **범위 밖이 필요하면 멈추고 보고.**

## 5. 확인 (1280 · 390)
- 로컬 새 공부방 계정: 상세1에 짧은 소개 칸 없음, 저장 성공, 로컬 DB의 기존 intro_short 값 그대로.
- 등록점검·노출 탭: 픽 항목에 「긴 소개」, 「짧은 소개」 없음. tier-check 답과 같음.
- 공부방 픽 카드에 수업스타일·소개 한 줄, 프라임 카드에 세 줄 추가, 소개 한 줄 말줄임, 확대카드는 전부.
- 과외쌤 카드 소개가 긴 소개. 같은 줄 카드 높이 맞음(1280), 390 넘침 없음.
- 운영·라이브 쓰기 금지, 결제 금지.

## 6. 멈출 때
- 짧은 소개를 안 보내면 서버가 값을 지울 때, 수업스타일 이름표를 가져올 수 없을 때, 프라임 카드 높이 규칙이 깨질 때(스크린샷과 함께).

## 7. 커밋 나누기
1. 282 fix(study-room): 짧은 소개 입력 빼기, 픽 필수에 긴 소개
2. 282 feat(search): 공부방 수업스타일·추가설명·주 회수, 과외쌤 긴 소개를 응답에
3. 282 feat(card): 픽·프라임 소개 = 긴 소개 한 줄, 수업스타일 줄, 확대카드 전체
4. 282 docs: 정본 47 §0-2 #6·ssot 11 카드 항목

## 8. 보고
- 커밋 3줄, 파일:줄, 카드·확대카드 1280·390 전/후 스크린샷. 쉬운 말로.
