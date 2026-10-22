# 289 지시서 — 과외쌤 사진 자르지 않고 올리기 + EXIF 회전 보정

- 결정: 종현 지시 2026-10-23 「사진 문제를 마무리한다」
- 기준(base): origin/main `0a2399cc`(Merge 288) 또는 그보다 새것 (`git fetch` 후 확인)
- 새 브랜치: `cursor/289-tutor-photo-nocrop-exif-20261023`
- 줄 번호는 `0a2399cc` 기준이다. **시작할 때 main에서 다시 확인**한다. 많이 달라졌으면 멈추고 보고.

## 목표

(A) 과외쌤 프로필 사진: 지금은 브라우저가 **1200 정사각으로 자른 JPEG만** 서버로 보낸다. 그래서 fit_1280도 정사각이 되어 「자르지 않고 보기」(288)가 과외쌤에서는 효과가 없다. 공부방처럼 **자르지 않은 사진 + crop 값**을 보내게 바꾼다.
(B) EXIF 회전 보정: 서버가 `imagecreatefromstring`만 써서, 휴대폰 세로 사진(원본 그대로 올린 것)이 누워 보일 수 있다. 공부방·과외쌤 모두 바로 세운 뒤 변형과 fit을 만든다.

- **기존 과외쌤 사진은 되살리지 않는다**(모두 테스트 데이터).
- **새 DB 컬럼·새 표 금지.**
- **범위 밖이 필요하면 멈추고 보고.**

---

## 0. 앞 지시서 결과 확인 (시작 전에 꼭)

```bash
git fetch origin
git merge-base --is-ancestor 0a2399cc origin/main && echo "OK 0a2399cc" || echo "MISSING 0a2399cc"
```

| 커밋 | 내용 |
|---|---|
| 0a2399cc | Merge 288 (fit_1280) |

MISSING이면 멈추고 보고.

---

## 1. (A) 브라우저 — 자르지 않은 사진 + crop 값 보내기

| 파일 | 줄 | 지금 | 바꿀 것 |
|---|---|---|---|
| preview/home-ui/src/tutor-reg/profile-photos.js | :26 `uploadSize: 1200` | 정사각 업로드 크기 | 쓰지 않게. 대신 「긴 변 1600」 상수(예 `uploadLongEdge: 1600`) |
| 〃 | :517-525 | `processTutorProfilePhoto`의 `upload_1200_path`(정사각)를 `dataUrlToJpegFile`로 보냄 | **원본 파일**을 보낸다. 원본이 4MB(`PROMO_IMAGE_SPEC.maxBytes`)를 넘거나 긴 변이 1600보다 크면 **자르지 않고 긴 변 1600으로만** 줄인 JPEG를 보낸다 |
| 〃 | :225-280 `processTutorProfilePhoto` | 화면용 basic·prime 미리보기 + upload 1200 | 미리보기(basic_720·prime_1280)는 그대로. `upload_1200_path`는 빼거나 쓰지 않는다 |
| 〃 | :325-335 `uploadTutorProfilePhotoApi` | `crop_x`·`crop_y` 이미 보냄(:330) | 그대로 |
| 〃 | :140-175 `ensureTutorProfilePhotoMinSize` | 800 미만이면 키움 | 그대로 |

참고: 공부방은 `preview/shared/promo-image.js:159-163`처럼 원본 `file`과 crop 값을 그대로 보낸다. 같은 방식으로 한다.
브라우저 캔버스로 줄인 JPEG는 EXIF가 이미 반영되어 바로 서 있다(그래서 (B)는 원본을 보낼 때 필요).

### 자르기 미리보기 = 실제 카드 모양
- 자르기 창: `openPromoCropDialog`(preview/shared/promo-image.js:78-150). 미리보기는 CSS `object-position: X% Y%`(:122)로 보여 준다. 즉 잘린 시작점 = `(원본폭 − 자를폭) × cropX`.
- 브라우저 미리보기 `cropResizeToCanvas`(profile-photos.js:195-215, :209)도 같은 식이다.
- 서버 `PromoImageProcessor::cropRect`(src/Media/PromoImageProcessor.php:160-178, :172-173)는 `cropX × 원본폭 − 자를폭/2`(가운데 기준)로 계산한다. **식이 다르다.** 원본을 보내면 이 차이가 실제 카드에 드러난다.
- `cropRect`를 미리보기와 같은 식(`(w − cw) × fx`, `(h − ch) × fy`)으로 맞춘다. 0.5(가운데)는 두 식이 같으니 지금 카드는 바뀌지 않는다. 공부방도 같은 함수를 쓰므로 공부방 미리보기와도 맞게 된다(보고에 적을 것).
- 바꾸지 않고 다른 방법이 필요하면 멈추고 보고.

### 카드 모양은 그대로
- 지금 만드는 파일과 크기는 그대로: basic_360(1:1), basic_720(1:1), prime_1280(16:9) — `TutorProfileImageService.php:75-80` `$dests`, `PromoImageSpec::VARIANTS`(src/Media/PromoImageSpec.php:22-27).
- 카드·마이프로필의 정사각 모양이 바뀌면 안 된다. CSS·카드 코드는 고치지 않는다.

---

## 2. (A) 서버 — crop 값으로 변형, fit은 자르지 않은 원본에서

| 파일 | 줄 | 할 일 |
|---|---|---|
| public/api/tutor/profile-image.php | :89-95 | `crop_x`·`crop_y`를 받아 **범위 검사**: 숫자이고 유한(`is_finite`)하고 0~1 안이면 그 값, 아니면(없음·문자·NaN·INF·범위 밖) **0.5(가운데)**. 검사 함수는 한곳에 두고 서비스에서도 한 번 더 막는다 |
| src/Media/TutorProfileImageService.php | :28 `upload(...)` | 위 검사 값 사용 |
| 〃 | :81-84 | `writeVariants($originalAbs, $cropX, $cropY, $dests)` 그대로 → 이제 원본이 정사각이 아니라 crop 값이 실제로 쓰인다. `writeFitQuiet($originalAbs, $fitAbs)`는 자르지 않은 원본에서 그대로 |
| 〃 | :236-258 mapRow | `crop_offset_x/y`는 0.5 고정(:257-258). DB 컬럼이 없으니 **그대로**(새 컬럼 금지) |

**그대로 지킬 것(285·288):**
- 검사 순서: 임시 파일 검사(`assertUploadTmp`, PromoImageProcessor.php:61-100) → 이동(`move_uploaded_file`, TutorProfileImageService.php:60) → 변형.
- 실패 정리: catch에서 변형·fit·원본 지우기(TutorProfileImageService.php:102-120).
- 한도: 12000px·4천만 픽셀(PromoImageProcessor.php:85-86), 4MB(`PromoImageSpec::MAX_BYTES` :9).

---

## 3. (B) EXIF 회전 보정 (공부방·과외쌤 공통)

| 파일 | 줄 | 할 일 |
|---|---|---|
| src/Media/PromoImageProcessor.php | :143-155 `load()` (`imagecreatefromstring` :149) | 읽은 뒤 JPEG이면 EXIF Orientation(1~8)을 읽어 바로 세운다(회전 `imagerotate`, 뒤집기 `imageflip`). 2·4·5·7(뒤집힘 포함)도 처리 |

- `load()`는 `writeVariants`(:110)와 `shrinkLongEdgeWebp`(:199) 둘 다 쓰므로, 여기 한 곳에서 고치면 **모든 변형과 fit**이 바로 선다.
- `function_exists('exif_read_data')`가 아니면 **조용히 건너뛴다**(오류·경고 없음, `@` 또는 try). EXIF가 깨졌어도 업로드는 실패시키지 않는다.
- 가로·세로 한도 검사(:85-86)는 회전 전 값으로 해도 된다(픽셀 수 같음).
- 회전에 쓴 임시 이미지는 `imagedestroy`로 정리.
- 닷홈 PHP 8.2에 exif가 켜져 있는지는 모른다 → 아래 6번 「배포 뒤 확인」에 넣는다.

---

## 4. 새 검사 스크립트

`scripts/verify-photo-exif-nocrop.php`(또는 .mjs) 추가, package.json에 `verify:photo-exif-nocrop` 등록. 테스트 사진은 스크립트가 임시 폴더에 만들고 끝나면 지운다.

1. 가로 2000×800 원본 + crop 0.5 → basic_720 720×720, prime_1280 1280×720, fit 1280×512.
2. 세로 800×2000 → fit 512×1280.
3. EXIF 6(90도) JPEG(저장은 가로, 보이는 건 세로) → fit이 세로(높이>너비), 위쪽 표시 색이 위에 있음.
4. EXIF 3(180도) → 위·아래 색이 바로 섬.
5. crop 값 검사: `'abc'`, `'NaN'`, `'1e999'`, `-1`, `2`, 빈 값 → 0.5. `0`·`1` → 그대로. crop 0과 1의 basic_720이 서로 다른 쪽을 자름.
6. cropRect 식 = 미리보기 식(`(w−cw)×fx`) 확인.
7. exif 확장이 없을 때(함수 없는 경로를 흉내) 오류 없이 지나감.
8. 브라우저: profile-photos.js에 `upload_1200_path` 업로드가 남아 있지 않음, 원본/1600 축소 경로가 있음(정적 검사).
9. 변조 검사: 일부러 틀리게 하면 위 검사가 잡는지 1개 이상.

---

## 5. 잠긴 검사 — 미리 허용한 것

**기준 커밋(REF)만 289 커밋으로 올리는 것 허용. 비교 코드·예외 목록 변경, 검사 끄기·건너뛰기는 금지.**

| 검사 | 줄 | 잠그는 것 | 289에서 |
|---|---|---|---|
| scripts/verify-tutor-basic-required.mjs | :441-442 `PHOTO_UPLOAD_REF`(`f41408da…`), assert :455-459 | `src/Media/TutorProfileImageService.php` | **걸림 예상** → 기준 커밋만 올림 |
| scripts/verify-tutor-search-fields.mjs | :24 `BASE_REF`, :78 `ROOM_BODY_REF`, :80 `TUTOR_DETAIL_REF` | SearchService·tutor-detail.js 등 | 289는 안 건드림. 걸리면 기준 커밋만 올림 |
| scripts/verify-tutor-region-unit.mjs | :24 `BASE_REF`, :428 `SEARCH_ROOMS_REF` | SearchService·region-cascade 등 | 289는 안 건드림. 걸리면 기준 커밋만 올림 |
| scripts/verify-photo-fit-1280.php | (288) | fit 크기 | 기대값은 그대로 통과해야 함 |

- 같은 검사의 `sql/ 과외쌤 표에 새 컬럼·새 표 없음`은 반드시 통과(새 컬럼 금지).
- **위 표 밖의 잠금이 걸리면 멈추고 보고.**

---

## 6. 테스트·보고

- **새 테스트 계정만** 쓴다. 기존 데이터는 지우지 않는다.
- 새 과외쌤 테스트 계정으로 가로·세로·EXIF 6 휴대폰식 사진을 올려 마이프로필·펼친 카드를 **1280·390**으로 캡처: 사진 전체가 보이고(fit), 카드는 정사각 그대로, 자르기 창에서 고른 위치와 카드 모양이 같음.
- 공부방 테스트 계정으로 EXIF 6 사진 1장: 바로 서 있음.
- `npm run verify:photo-exif-nocrop`(새), `verify:tutor-basic-required`, `verify:tutor-search-fields`, `verify:tutor-region-unit`, `verify:shop-page`, `php scripts/verify-photo-fit-1280.php`, 빌드 등 **모든 검사 초록**.
- 커밋은 고친 파일만 `git add <파일>`. **`git add -A` 금지.**
- **브랜치에만 push.** merge 금지. force-push 금지. docs 커밋 금지(시키지 않으면).

### 배포 뒤 확인 (종현)
1. 닷홈 PHP 8.2에서 exif 켜짐 여부(`function_exists('exif_read_data')`). 꺼져 있으면 세로 원본 사진이 누울 수 있음 → 따로 결정.
2. 휴대폰 세로 사진을 과외쌤·공부방에 올려 바로 서 있는지.
3. 과외쌤 가로 사진: 펼친 카드·마이프로필에서 전체 보임, 카드 목록은 정사각 그대로.

### 보고에 적을 것
1. 브랜치·커밋 해시
2. 고친 파일과 줄 범위
3. cropRect 식을 바꿨는지, 공부방에 주는 영향
4. 기준 커밋을 올린 잠금 목록(전·후 해시)
5. 검사 결과(모두 초록)
6. 캡처 경로
7. 범위 밖이라 멈춘 것이 있으면 그 내용
