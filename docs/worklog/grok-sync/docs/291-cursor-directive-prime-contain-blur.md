# 291 지시서 — 프라임 16:9를 자르지 않고 담기 + 빈 곳은 같은 사진 흐리게

- 결정: 종현 지시 2026-10-23 (공부방 사진 올리기 창 「썸네일 위치 조정」 화면을 보고)
- 기준(base): origin/main `b8d289fe` 또는 그보다 새것 (`git fetch` 후 확인)
- 새 브랜치: `cursor/291-prime-contain-blur-20261023`
- 290이 아직 병합 전이어도 괜찮다. 지금 main 위에서 작업한다. (290과 겹치는 파일 없음 — 아래 0번)
- 줄 번호는 `b8d289fe` 기준이다. **시작할 때 main에서 다시 확인**한다. 많이 달라졌으면 멈추고 보고.

## 목표

지금 「썸네일 위치 조정」 창 왼쪽 **프라임 16:9 미리보기는 사진을 자른다**. 서버의 prime_1280·prime_1600 파일도 잘린 파일이다.
앞으로:

- **프라임 16:9 = 자르지 않는다.** 사진 전체를 16:9 틀 안에 줄여 담고(contain), 남는 양옆(또는 위아래)은 **같은 사진을 흐리게** 채운다(288과 같은 느낌).
- **베이직 1:1 = 지금 그대로**(고른 중심으로 자름).
- 고르는 중심은 **베이직 정사각에만** 쓰인다. 창 문구도 그렇게 바꾼다.
- 카드 목록 CSS는 바꾸지 않는다(파일 자체가 이제 사진 전체를 담고 있다).
- **기존 파일은 다시 만들지 않는다**(테스트 데이터).
- **새 DB 컬럼·새 표 금지.**
- **범위 밖이 필요하면 멈추고 보고.**

---

## 0. 앞 지시서 확인 + 290과 겹침 확인

```bash
git fetch origin
git merge-base --is-ancestor b8d289fe origin/main && echo "OK b8d289fe" || echo "MISSING b8d289fe"
```

MISSING이면 멈추고 보고.

**290 파일과 겹치지 않는다.** 290이 고치는 파일: `studyroom-detail.js`, `tutor-detail.js`, `detail-utils.js`, `shop-formatters.js`, `home-listings.css`, `scripts/verify-shop-page.mjs`(+ 새 `verify-photo-nofit-square.mjs`). **291은 이 파일들을 하나도 건드리지 않는다.** 건드려야 하면 멈추고 보고.

---

## 1. 서버 — prime_1280·prime_1600을 contain + 흐린 배경으로

| 파일 | 줄 | 지금 | 바꿀 것 |
|---|---|---|---|
| src/Media/PromoImageProcessor.php | :108-141 `writeVariants` (:119-130) | 모든 변형을 `cropRect`(:231)로 잘라 `imagecopyresampled` | 변형이 **16:9(prime_1280·prime_1600)** 이면 새 함수 `containOnBlur($src, $tw, $th)` 사용. **1:1(basic_360·basic_720)** 은 지금처럼 `cropRect` 그대로 |
| 〃 | 새 private 함수 | — | `containOnBlur`: ① 배경 = 같은 사진을 틀에 꽉 차게(cover, 가운데) 작게 줄였다 키우고 `imagefilter(IMG_FILTER_GAUSSIAN_BLUR)` 몇 번 → 흐림 ② 앞 = 사진 전체를 `scale = min(tw/sw, th/sh, 1)`로 줄여 가운데에 놓기(**원본보다 키우지 않는다**. 앞 사진에 확대로 생기는 깨짐이 없게. 흐린 배경만 키워도 됨) ③ 임시 이미지 `imagedestroy` |
| src/Media/PromoImageSpec.php | :30-35 `VARIANT_ASPECT` | 16:9 / 1:1 | 값 그대로. 변형 종류 판단은 이 표(또는 새 상수 `CONTAIN_VARIANTS = ['prime_1280','prime_1600']`)로. `VARIANTS`(:22-27) 크기는 그대로 |
| 〃 | — | — | fit_1280(288)·EXIF(289)·`cropRect` 식·한도 검사는 그대로 |

- `writeVariants`의 인자·반환은 그대로 → `PromoImageService`·`TutorProfileImageService`는 **고치지 않는다**. (TutorProfileImageService는 `verify-tutor-basic-required.mjs` 잠금 대상이니 더욱 건드리지 않는다.)
- `PromoImageService::recrop`(공부방 위치 다시 고르기)도 같은 `writeVariants`를 쓰므로 prime은 위치와 상관없이 같은 결과가 된다. 고치지 않는다.
- 결과 크기: prime_1280 = 1280×720, prime_1600 = 1600×900 그대로.
- 닷홈 메모리: 배경용 캔버스는 작게(예: 틀의 1/8) 만들어 흐린 뒤 키운다.

---

## 2. 창 미리보기·문구 — preview/shared/promo-image.js

| 줄 | 지금 | 바꿀 것 |
|---|---|---|
| :90 문구 | 「사진을 눌러 잘릴 중심을 고르세요. 프라임(16:9)과 베이직(1:1)에 함께 적용됩니다. …」 | 예: 「프라임(16:9)은 사진 전체가 들어갑니다. 베이직(1:1) 정사각에 보일 가운데만 사진을 눌러 골라 주세요.」 (쉬운 말, 「잘린다」는 말을 프라임에 쓰지 않음) |
| :91-100 프라임 틀 | `<img>` 1장(cover) | 뒤에 흐린 같은 사진 + 앞에 contain 사진. 프라임 틀에서 **위치 점(spot) 빼기** |
| :121-130 `applyPos` | 프라임·베이직 둘 다 `objectPosition` | **베이직만** `objectPosition`. 프라임은 늘 가운데 contain |
| :133-142 `onPoint` + :143-144 이벤트 | 프라임 틀을 눌러 중심 고름 | **베이직 정사각 틀을 눌러** 고르게 옮긴다(또는 베이직 틀 안 사진 위치 기준). 위치 점도 베이직 틀로. 결과 `{ cropX, cropY }` 형식은 그대로 |
| :144 이벤트 줄 근처 | — | 버튼 「이 위치로 올리기」(:103)는 그대로 둬도 됨 |

CSS — preview/study-room-ui/src/styles/register.css:839-864

| 줄 | 바꿀 것 |
|---|---|
| :846-849 `.promo-crop-frame--prime` | `cursor: crosshair` 빼기 |
| :851-853 `.promo-crop-frame--basic` | `cursor: crosshair` 넣기 |
| :855-864 `.promo-crop-frame img` (cover) | 프라임 틀 안의 앞 사진만 `object-fit: contain`, 흐린 뒷 사진 규칙 새로(`filter: blur(...)`, 살짝 크게). **`.promo-crop-` 이름 안에서만.** 베이직은 cover 그대로 |

이 CSS는 공부방·과외쌤·홈 3곳에서 같이 쓴다(`study-room-ui/src/main.js:6`, `tutor-ui/src/main.js:6`, `home-ui/src/main.js:31`). 다른 규칙은 건드리지 않는다.

## 3. 과외쌤 브라우저 미리보기 — preview/home-ui/src/tutor-reg/profile-photos.js

| 줄 | 지금 | 바꿀 것 |
|---|---|---|
| :248-258 `processTutorProfilePhoto`의 prime | `cropResizeToCanvas(…1280,720)`(:195-215)로 잘라 로컬 미리보기 | 서버와 같은 contain + 흐린 배경 캔버스 함수(새 함수)로. basic(:239-247)은 그대로 |

과외쌤 자르기 창은 같은 `openPromoCropDialog`(:8 import, :513 근처)를 쓰므로 2번으로 함께 바뀐다.

**위 5개 파일(PromoImageProcessor.php, PromoImageSpec.php, promo-image.js, register.css, profile-photos.js) + 새 검사 파일 밖을 고쳐야 하면 멈추고 보고.**

---

## 4. 잠긴 검사 — 미리 허용한 것

**기준 커밋(REF)만 291 커밋으로 올리는 것 허용. 비교 코드·예외 목록 변경, 검사 끄기·건너뛰기는 금지.**

| 검사 | 줄 | 291에서 |
|---|---|---|
| scripts/verify-tutor-basic-required.mjs | :442 `PHOTO_UPLOAD_REF`(`03dbf649…`) | TutorProfileImageService.php를 안 건드리니 **걸리지 않아야 함**. 걸리면 기준 커밋만 올림 |
| scripts/verify-tutor-search-fields.mjs | :24, :78, :80 | 291 파일과 무관. 걸리면 기준 커밋만 올림 |
| scripts/verify-tutor-region-unit.mjs | :24, :428 | 291 파일과 무관. 걸리면 기준 커밋만 올림 |
| scripts/verify-photo-exif-nocrop.php | :105-141 | prime 크기 1280×720(:106)·basic crop 검사(:120-122)는 **그대로 통과해야 함**. 기대값 바꾸지 않음 |
| scripts/verify-input-fill-rule.mjs | :176-177, :874-875 | register.css의 `#fff7ee`·readonly 규칙 검사. 291은 그 규칙을 안 건드리니 통과해야 함 |

- **위 표 밖의 잠금이 걸리면 멈추고 보고.**

---

## 5. 새 검사 스크립트

`scripts/verify-prime-contain-blur.php` 추가, package.json에 `verify:prime-contain-blur` 등록. 테스트 사진은 임시 폴더에 만들고 끝나면 지운다. 사진은 가운데 진한 색 + 양 끝 다른 색 띠로 만들어 「전체가 보이는지」 확인한다.

1. 가로 2000×800 → prime_1280 **1280×720**, 사진 전체가 보임(왼쪽·오른쪽 끝 띠 색이 결과의 왼쪽·오른쪽 끝 근처에 있음), **위아래 빈 곳이 채워짐**(투명·단색 검정/흰색 아님, 흐린 사진 색).
2. 세로 800×2000 → 1280×720, 위·아래 끝 띠가 보임, **양옆이 채워짐**.
3. 정사각 1000×1000 → 1280×720, 네 끝 띠 보임, 양옆 채워짐.
4. prime_1600 = 1600×900, 같은 규칙.
5. basic_720은 지금처럼 crop: crop 0과 1이 서로 다른 쪽(정사각 아닌 원본으로).
6. 작은 원본(800×600)도 앞 사진을 키우지 않음(앞 사진 영역 ≤ 원본 크기).
7. 창 문구: promo-image.js에 「잘릴 중심」 + 「프라임」이 함께 나오지 않음, 새 문구 있음. 프라임 틀에 spot 없음, 베이직 틀에서 고름(정적 검사).
8. 변조 검사 1개 이상(예: prime을 crop으로 되돌린 함수 결과면 1·2번이 실패로 잡힘).

---

## 6. 테스트·보고

- **새 테스트 계정만** 쓴다. 기존 데이터는 지우지 않는다. 기존 파일 다시 만들지 않는다.
- 공부방·과외쌤 테스트 계정에서 가로·세로·정사각 사진을 올려 캡처(**1280·390**): ① 「썸네일 위치 조정」 창(프라임은 전체+흐림, 베이직은 고른 위치) ② 카드 목록 프라임 카드(사진 전체+흐린 양옆) ③ 베이직 카드(정사각, 고른 위치).
- `npm run verify:prime-contain-blur`(새), `php scripts/verify-photo-exif-nocrop.php`, `php scripts/verify-photo-fit-1280.php`, `verify:tutor-basic-required`, `verify:tutor-search-fields`, `verify:tutor-region-unit`, `verify:shop-page`, `verify:input-fill-rule`, 빌드 등 **모든 검사 초록**.
- 커밋은 고친 파일만 `git add <파일>`. **`git add -A` 금지.**
- **브랜치에만 push.** merge 금지. force-push 금지. docs 커밋 금지(시키지 않으면).

### 보고에 적을 것
1. 브랜치·커밋 해시
2. 고친 파일과 줄 범위 (290 파일을 안 건드렸는지)
3. 올린 잠금이 있으면 전·후 해시
4. 검사 결과(모두 초록)
5. 캡처 경로
6. 범위 밖이라 멈춘 것이 있으면 그 내용
