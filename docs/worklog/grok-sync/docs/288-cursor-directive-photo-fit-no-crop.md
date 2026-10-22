# 288 지시서 — 사진을 자르지 않고 긴 변 기준으로 보여 주기 (fit_1280)

- 결정: 종현 승인 2026-10-23 「사진을 자르지 않고 긴 변 기준으로 보여 준다」. 기존 사진도 다시 만든다.
- 기준(base): origin/main `00c0bd1d` 또는 그보다 새것 (`git fetch` 후 확인)
- 새 브랜치: `cursor/288-photo-fit-no-crop-20261023`
- 순서: 287과 파일이 겹치지 않는다(287은 학생 쪽지설정 화면만). 그래서 287을 기다리지 않아도 된다.
- 줄 번호는 `00c0bd1d` 기준이다. **시작할 때 main에서 줄 번호를 다시 확인**한다. 많이 달라졌으면 멈추고 보고.

## 목표

지금 사진 파일(prime_1280, basic_720 등)은 올릴 때 이미 **잘린(cover) 파일**이다. 그래서 화면에서 `contain`만 바꿔도 사진 전체가 안 보인다.
자르지 않은 파일 `fit_1280`(긴 변 1280, 작은 사진은 키우지 않음, webp)을 따로 만들고, 아래 3곳에서 이 파일로 사진 전체를 보여 준다.

1. 펼친 카드(상세) — 공부방·과외쌤
2. 공부방 마이샵
3. 과외쌤 마이프로필

**카드 목록(베이직·픽·프라임)은 바꾸지 않는다.**

**범위 밖이 필요하면 멈추고 보고.**

---

## 0. 앞 지시서 결과 확인 (시작 전에 꼭)

```bash
git fetch origin
for c in 62798e36 00c0bd1d; do
  git merge-base --is-ancestor $c origin/main && echo "OK $c" || echo "MISSING $c"
done
```

| 커밋 | 내용 |
|---|---|
| 62798e36 | 285 |
| 00c0bd1d | 286 |

하나라도 MISSING이면 멈추고 보고.
287이 먼저 main에 들어갔어도 상관없다. 만약 작업 중 287 파일(`student-memo-status.js`, 학생 `renderSettings`)을 고쳐야 한다면 멈추고 보고(그럴 일은 없어야 한다).

---

## 1. 서버 — 올릴 때 fit_1280 만들기

### 규칙
- 파일 이름: 같은 사진의 다른 파일과 같은 토큰 + `_fit_1280.webp` (예: `..._prime_1280.webp` 옆에 `..._fit_1280.webp`).
- 원본(`_orig`)에서 만든다. 자르지 않는다. 긴 변 1280. 원본이 더 작으면 **키우지 않는다**. webp.
- 이미 있는 함수 `PromoImageProcessor::shrinkLongEdgeWebp($src, $dest, 1280, 82, $targetBytes)`(src/Media/PromoImageProcessor.php:188-241)를 그대로 쓴다. 이 함수는 줄이기만 하고 키우지 않는다. `$targetBytes`는 약 400KB(409600)로 한다.
- **`PromoImageSpec::VARIANTS`(src/Media/PromoImageSpec.php:22-27)·`VARIANT_ASPECT`(:30-35)에 fit을 넣지 않는다.** 넣으면 잘리고, 서비스의 반복문이 바뀐다. 대신 PromoImageSpec에 상수/함수 하나만 더한다(예: `FIT_KEY='fit_1280'`, `FIT_LONG_EDGE=1280`, `fitPathFor(string $variantPath): string` — `_prime_1280`/`_prime_1600`/`_basic_720`/`_basic_360`를 `_fit_1280`으로 바꾸고 확장자를 `.webp`로).
- fit 만들기가 실패해도 사진 올리기 자체는 **실패시키지 않는다**(로그만 남김). 화면은 fit이 없으면 지금 파일을 쓴다.

### 고칠 곳
| 파일 | 줄 | 할 일 |
|---|---|---|
| src/Media/PromoImageSpec.php | :22-35 근처 | 위 상수·fitPathFor 추가 (VARIANTS는 그대로) |
| src/Media/PromoImageProcessor.php | :188 | 원칙적으로 고치지 않는다. 꼭 필요하면 얇은 감싸기 함수(`writeFit`)만 |
| src/Media/PromoImageService.php (공부방) | :77-83 뒤 | writeVariants 다음에 fit 만들기 |
| 〃 | :120-133 (catch) | 실패 때 지우는 목록에 fit 추가 |
| 〃 | :135-149, :360-372 (mapRow) | 응답에 `fit_1280_path` 추가 (파일이 있을 때만, 없으면 '') |
| 〃 | :219-235 (`delete`, 목록 :226) | 사진 지울 때 fit도 지움 (토큰에서 이름 만들기) |
| 〃 | :153-200 (`recrop`) | 고치지 않는다. fit은 자르기 위치와 상관없다 |
| src/Media/TutorProfileImageService.php (과외쌤) | :75-82 뒤 | fit 만들기 |
| 〃 | :102-115 (catch) | 실패 때 지우는 목록에 fit 추가 |
| 〃 | :117-129, :229-251 (mapRow) | 응답에 `fit_1280_path` 추가 |
| 〃 | :267-289 (`unlinkVariants`, 후보 :273-278) | fit 추가 (사진 지울 때 :173-184에서 같이 지워짐) |

### 지울 때 함께 지우는 목록 (240 정책)
- 사진 한 장 지우기: 위 표의 PromoImageService `delete`, TutorProfileImageService `unlinkVariants`에 fit을 넣는다.
- 회원·카드 지우기: `src/Admin/MemberUploadPurge.php:85-145`가 `uploads/promo/rooms/{id}`, `uploads/promo/tutors/{id}` **폴더째** 지우므로 fit도 같이 지워진다. **고치지 않는다.** `src/Admin/AdminMemberDeleteService.php`(:274-306 collectCardUploadPaths)도 고치지 않는다. 확인만 하고, fit이 남는 경우가 보이면 멈추고 보고.

---

## 2. DB는 그대로 — 이름 규칙으로 찾기

- **새 컬럼·새 표 금지.** (`scripts/verify-tutor-basic-required.mjs`가 「sql/ 과외쌤 표에 새 컬럼·새 표 없음」을 검사한다.) `ensureColumns`(PromoImageService.php:244 근처)에도 넣지 않는다.
- fit 경로는 `PromoImageSpec::fitPathFor()`로 이름을 만들고, **서버에서 `is_file`로 있을 때만** 응답에 넣는다.
- 응답에 fit을 싣는 곳(최소 변경만 허용):

| 파일 | 줄 | 더할 값 |
|---|---|---|
| src/StudyRoom/StudyRoomPublicReadService.php | publicImages :361-377 | 사진마다 `fit_1280_path` |
| src/StudyRoom/StudyRoomRegisterService.php | :1644-1656 (사진 목록) | `fit_1280_path` |
| src/Search/SearchService.php | 공부방 item :799-805 | `image_path_fit` (대표사진) |
| 〃 | 과외쌤 :1006-1012, item :1056-1060 | `image_path_fit` |
| src/Registration/TutorHubRepository.php | profileImages :285-312 | `fit_1280_path` |

이 밖의 API를 고쳐야 하면 멈추고 보고.

---

## 3. 화면 — fit 있으면 fit, 없으면 지금 파일

공통: `object-fit: contain` + 뒤에 **같은 사진을 흐리게**(275 규칙 5). 흐린 배경은 가벼운 파일(basic_360 또는 basic_720)을 쓴다. 사진은 `loading="lazy"`(첫 사진 제외 가능), `decoding="async"`.

| 화면 | 파일 | 줄 | 할 일 |
|---|---|---|---|
| 펼친 카드 공부방 | preview/home-ui/src/detail-decision/studyroom-detail.js | :36 (`listingImage(item,'pick')`) | `item.image_path_fit` 먼저 |
| 펼친 카드 과외쌤 | preview/home-ui/src/detail-decision/tutor-detail.js | :35 (`item.image_path`) | `item.image_path_fit` 먼저 |
| 〃 공통 | preview/home-ui/src/detail-decision/detail-utils.js | 새 함수 | 흐린 배경 + contain 사진 마크업 함수 하나 (`renderMedia`는 쓰지 않음) |
| 〃 CSS | preview/home-ui/src/styles/home-listings.css | :941-969 근처 | **`.p24-dl` 안에서만** 새 규칙. `.expo-media`(:947-951)·`--pick`(:963-969) 기본 규칙은 그대로 |
| 마이샵 | preview/home-ui/src/study-room-reg/shop-formatters.js | :187-190 imgSrc | `fit_1280_path` → prime_1280 → … 순서. blurSrc(:206)는 그대로 basic_720 |
| 〃 | preview/home-ui/src/myshop/public-model.js | normalizeImages :19-40 | `fit_1280_path` 넘겨주기 (같은 사진 한 번 규칙 유지) |
| 〃 | preview/home-ui/src/myshop/myshop-render.js, styles/myshop.css | :44-53, :62-107 | contain·흐린 배경은 이미 있음. 고칠 것 없으면 고치지 않는다 |
| 마이프로필 | preview/home-ui/src/tutor-reg/profile-photos.js | :65-67 tutorPhotoPreviewSrc, :380-395 | fit 먼저 + 흐린 배경 변수 |
| 〃 | preview/home-ui/src/tutor-reg/profile-read.js | :148-162 | 흐린 배경 변수 |
| 〃 | preview/home-ui/src/styles/tutor-profile-photos.css | :44-56, :136-154 | cover → contain + 흐린 배경(::before) |

**하지 말 것:** `exposure-render.js`(renderMedia :295-314, listingImage :336-341), 홈 카드 목록, `home-basic-live.js`, `registration-check-model.js`는 고치지 않는다.

---

## 4. 기존 사진용 한 번 쓰는 스크립트

- 위치: `scripts/backfill-photo-fit-1280.php` (**public 밖**).
- `_orig` 원본에서 **fit만** 만든다. 원본이 없으면 건너뛰고 목록에 적는다.
- **기존 파일은 하나도 지우거나 바꾸지 않는다.** DB도 쓰지 않는다(읽기만).
- **기본은 dry-run**(만들 목록·건너뛸 목록·개수만 출력). 진짜로 만들려면 `--apply`.
- 이미 fit 파일이 있으면 건너뛴다(여러 번 돌려도 같은 결과).
- 대상: study_room_images, tutor_images (시스템 기본 사진 `is_system_default=1` 제외).
- **운영에서는 절대 돌리지 않는다.** 로컬에서 테스트 계정 사진으로만 dry-run → --apply 확인. 운영 실행 방법(명령 한 줄)만 보고에 적는다. 운영 실행은 병합 뒤 종현 승인으로 따로 한다.

---

## 5. 잠긴 검사

- `scripts/verify-tutor-basic-required.mjs:441-443` `PHOTO_UPLOAD_REF`(지금 `fbf76450…`)는 TutorProfileImageService.php를 잠근다(:455-459). **기준 커밋을 이번 커밋으로 올리는 것만** 허용.
- `scripts/verify-shop-page.mjs`(사진 검사 :358-411): fit을 먼저 쓰는지 검사를 **더하는 것**과 기대값을 이번 변경에 맞게 올리는 것만 허용.
- 검사를 끄거나, 건너뛰거나(skip), 조건을 약하게 하는 것은 **금지**.
- 새 검사 추가: fit이 VARIANTS에 없음, fit은 잘리지 않음(가로 2000×800 → 1280×512, 세로 800×2000 → 512×1280, 작은 600×400 → 600×400 그대로), 지우기 목록에 fit 있음.

---

## 6. 테스트·보고

- **새 테스트 계정만** 쓴다. 기존 데이터는 지우지 않는다.
- 가로 사진 1장(예 2000×800), 세로 사진 1장(예 800×2000)을 올려서 3곳(펼친 카드 공부방·과외쌤, 마이샵, 마이프로필)을 **1280px·390px**로 캡처. 사진 전체가 보이고 뒤가 흐린지 확인.
- 카드 목록(베이직·픽·프라임) 캡처 1장씩: **바뀌지 않았는지** 확인.
- 페이지 무게: fit은 webp·약 400KB 이하, lazy.
- `npm run verify:shop-page`, `npm run verify:tutor-basic-required`, `npm run verify:wishlist-card-zoom`, 빌드 등 **모든 검사 green**.
- 커밋은 고친 파일만 하나씩 `git add <파일>`. **`git add -A` 금지.**
- **브랜치에만 push.** main 병합 금지. force-push 금지. docs 커밋 금지(시키지 않으면).

### 보고에 적을 것
1. 브랜치·커밋 해시
2. 고친 파일과 줄 범위
3. 검사 결과(모두 green)
4. 캡처 경로(3곳 × 가로·세로 × 1280·390, 카드 목록)
5. 스크립트 dry-run 결과(로컬)와 운영 실행 명령 한 줄(실행하지 말 것)
6. 범위 밖이라 멈춘 것이 있으면 그 내용
