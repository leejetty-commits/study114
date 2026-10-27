RESTORE_BASE = `2c54bcb516c14523024b2d304bf564e92fe5126f`

원복 절차:
1) 미커밋 코드: `git restore --source=HEAD -- src/Paid/TierRequirement.php scripts/verify-pickprime-purchase-gate.php preview/home-ui/src/study-room-reg/registration-check-model.js preview/home-ui/src/plans/screens.js preview/shared/pickprime-requirements.js`
2) 잘못된 커밋: `git reset --hard 2c54bcb516c14523024b2d304bf564e92fe5126f` (push 후 force-push 금지 → 보고)

# 321 — 픽·프라임 구매조건 점검 빈틈 F1~F7

- **과제:** 321
- **브랜치:** `cursor/321-tier-loadroom-feature23-20261027`
- **base:** `2c54bcb5` (origin/main)
- **커밋/PR:** 사용자 지시 전이라 하지 않음

## 수정

- **F1** `TierRequirement::loadRoom()` SELECT에 `feature_2, feature_3` 추가. ROOM_PRIME_IDS 텍스트 칸(`intro_long`, `teaching_style`, `teaching_style_note`, `fee`←`price_amount`+`monthly_fee_manwon`, `lessons_per_week`, `feature_1~3`)이 SELECT에 있음. `cover`는 `study_room_images`.
- **F2** `room_pick_open_without_expanded` 픽스처를 현재 `ROOM_PICK_IDS`(cover·intro_long·fee·teaching_style·feature_1)로 채움. `intro_long` 빈값·`feature_1` 공백(trim-empty) 막힘 케이스 추가.
- **F3** sqlite에 `study_rooms`·`study_room_images` 추가. `missingFor(..., 'study_room', ...)` 로 `pdo_room_pick_full` / `pdo_room_prime_full` / `pdo_room_prime_missing_feature_3`. tutor 케이스 유지. pdo_sqlite 없으면 기존처럼 건너뜀.
- **F4** `fieldOkMap` tierRoom의 `intro_long`, `teaching_style_ids`, `teaching_style`, `teaching_style_note`, `monthly_fee_manwon`, `lessons_per_week`, `price_amount`를 `blank(s?.X) ? s.X : room?.X` 로 통일.
- **F5** `isProductReady`: `tierPhase === 'loading'`이면 캐시 `canBuy`와 관계없이 준비 완료로 보지 않음. 비티어 누락이 있으면 그 문구, 없으면 `확인 중`. loading 중 캐시 side로 `ready:true` 주던 분기 삭제.
- **F6 no-op (일치 확인)** 같은 상품 안 라벨이 이미 같음. 공부방 PHP `ROOM_LABELS` = JS `ROOM_META`(대표사진, 공부방 소개 / 자랑, 월 평균 수업료, 수업 스타일, 수업 스타일 추가설명, 주 회수, 경력특징 1~3). 과외쌤 PHP `TUTOR_LABELS` = JS(`학교·학과 또는 경력`, 강의스타일, 상세 소개, 특징 2, 특징 3). 상품끼리 이름은 바꾸지 않음.
- **F7** `TUTOR_LABELS['main_material_note']`와 `TUTOR_HINTS.main_material_note`만 삭제. 두 맵은 id 키 조회(`idsFor` / `TUTOR_PRIME_IDS`)뿐이고 그 id 목록에 `main_material_note`가 없어 다른 조회처 없음. `loadTutor` SELECT·DB 칸·exposure·tutor-detail·home-basic-live·registration-check-copy는 유지.

## F1 되돌림 확인

로컬에 `php`가 PATH에 없고, 받은 portable PHP 8.2는 프로세스 시작 실패(exit `-1058471934`, 출력 없음), Docker 데몬도 꺼져 있어 **스크립트를 실제로 한 번 돌리지는 못함.**

코드 경로상 SELECT에서 `feature_2, feature_3`을 빼면 `loadRoom` 행에 두 칸이 없고 `roomFilled`가 빈 문자열로 봐서, id 31 프라임 missing이 `feature_2`,`feature_3`가 된다. 그래서 `pdo_room_prime_full`(기대 `[]`)은 실패하고, `pdo_room_prime_missing_feature_3`(기대 `['feature_3']`만)도 같이 실패한다. `pdo_room_pick_full`은 픽 id에 feature_2/3가 없어 그대로 통과한다.

## 검증

- `php scripts/verify-pickprime-purchase-gate.php` — 이 환경에서 실행 불가 (위와 같음). CI(PHP 8.2 + pdo_sqlite)에서 확인 필요.
