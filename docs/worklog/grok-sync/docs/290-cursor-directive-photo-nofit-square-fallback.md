# 290 지시서 — fit 없는 옛 사진은 정사각(basic)으로 크게, 자르지 않고

- 결정: 종현 지시 2026-10-23
- 기준(base): origin/main `3a39df06`(Merge 289) 또는 그보다 새것 (`git fetch` 후 확인)
- 새 브랜치: `cursor/290-photo-nofit-square-fallback-20261023`
- 줄 번호는 `3a39df06` 기준이다. **시작할 때 main에서 다시 확인**한다. 많이 달라졌으면 멈추고 보고.

## 목표

펼친 카드(공부방·과외쌤)에서 사진에 `fit_1280` 파일이 없으면(288 전에 올린 사진) 지금은 **16:9 prime(잘린 파일)** 으로 돌아가서 사진 일부가 잘려 보인다.

- fit **있음** → 지금 그대로(288: 16:9 틀 + contain + 흐린 배경).
- fit **없음** → 정사각 basic 사진(`basic_720`, 없으면 `basic_360`, 없으면 `basic`)을 **더 큰 정사각 틀**에 자르지 않고 보여 준다. prime으로 돌아가지 않는다.
- 사진이 아예 없음 → 지금 그대로(공부방 로고, 과외쌤 첫 글자).
- **카드 목록(베이직·픽·프라임)은 바꾸지 않는다.** `exposure-render.js`(`listingImage` :336-341, `renderMedia`)는 고치지 않는다.
- **범위 밖이 필요하면 멈추고 보고.**

---

## 0. 앞 지시서 결과 확인 (시작 전에 꼭)

```bash
git fetch origin
git merge-base --is-ancestor 3a39df06 origin/main && echo "OK 3a39df06" || echo "MISSING 3a39df06"
```

| 커밋 | 내용 |
|---|---|
| 3a39df06 | Merge 289 (과외쌤 사진 자르지 않고 올리기 + EXIF) |

MISSING이면 멈추고 보고.

---

## 1. 지금 prime으로 돌아가는 곳 (찾은 결과)

| 파일 | 줄 | 지금 코드 | 문제 |
|---|---|---|---|
| preview/home-ui/src/detail-decision/studyroom-detail.js | :36-41 (:37) | `item.image_path_fit \|\| listingImage(item, 'pick')` | `listingImage(…,'pick')`(exposure-render.js:337-338)는 `image_path_prime \|\| image_path` → **16:9 prime** |
| preview/home-ui/src/detail-decision/tutor-detail.js | :34-39 (:35) | `item.image_path_fit \|\| item.image_path` | `image_path`는 프라임 노출이면 prime(SearchService가 tier별로 넣음) → **잘린 파일** |
| preview/home-ui/src/detail-decision/detail-utils.js | :37-60 `renderUncroppedPhoto` | 받은 사진을 늘 16:9 틀(`.p24-fit-photo`)에 넣음 | fit인지 아닌지 모름 |
| preview/home-ui/src/study-room-reg/shop-formatters.js (마이샵) | :187-190 `imgSrc` (:189) | `fit_1280_path \|\| prime_1280_path \|\| image_path …` | **같은 문제**: fit 없으면 prime(잘린 16:9) |
| preview/home-ui/src/myshop/public-model.js (마이샵) | :24-46 `normalizeImages` | fit·prime·basic을 넘기기만 함 | 고칠 것 없음(값은 이미 다 넘김). **고치지 않는다** |

CSS: `preview/home-ui/src/styles/home-listings.css:971-1006` (`.p24-dl .p24-fit-photo` 16:9, `max-width: 28rem` :975-976). 마이샵 칸은 이미 contain + 흐린 배경이라 CSS 변경 없음.

---

## 2. 고칠 것 (이 파일만)

| 파일 | 줄 | 할 일 |
|---|---|---|
| detail-utils.js | :37-60 | `renderUncroppedPhoto`가 「fit 사진」과 「정사각 대체 사진」을 구분해 받게 한다(예: 옵션 `{ square: true }` 또는 인자 객체 `{ fit, square, blur }`). fit 있으면 지금 마크업 그대로. fit 없고 정사각만 있으면 `class="p24-fit-photo p24-fit-photo--square"`. 사진 없음·로고·첫 글자 분기는 그대로 |
| studyroom-detail.js | :36-41 | fit = `item.image_path_fit`. 정사각 = `image_path_basic_720 \|\| image_path_basic_360 \|\| image_path_basic`. **`listingImage(item,'pick')` 사용을 뺀다**(import :7이 안 쓰이면 지움). 로고 옵션 그대로 |
| tutor-detail.js | :34-39 | fit = `item.image_path_fit`. 정사각 = `image_path_basic_720 \|\| image_path_basic_360 \|\| image_path_basic`. **`item.image_path`(prime일 수 있음)로 돌아가지 않는다** |
| home-listings.css | :971-1006 뒤 | `.p24-dl .p24-fit-photo--square { aspect-ratio: 1 / 1; max-width: 20rem; }` 정도. **`.p24-dl` 안에서만.** 기존 `.p24-fit-photo`·카드 목록 규칙은 그대로 |
| shop-formatters.js | :189 | `fit_1280_path \|\| basic_720_path \|\| image_path \|\| name \|\| src \|\| prime_1280_path` 순서로(fit 없으면 basic 정사각, prime은 마지막). blurSrc(:206) 그대로 |

- 흐린 배경 값은 지금처럼 basic_360/720 그대로 넘긴다(정사각 틀이면 배경이 거의 안 보여도 괜찮다).
- 이미지 `loading`·`decoding` 속성은 그대로(첫 사진 eager, 나머지 lazy).
- 위 5개 파일 + 아래 검사 파일 밖을 고쳐야 하면 멈추고 보고.

---

## 3. 잠긴 검사 — 미리 허용한 것

**기준 커밋(REF)만 290 커밋으로 올리는 것 허용. 비교 코드·예외 목록 변경, 검사 끄기·건너뛰기는 금지.**

| 검사 | 줄 | 잠그는 것 | 290에서 |
|---|---|---|---|
| scripts/verify-tutor-search-fields.mjs | :80 `TUTOR_DETAIL_REF`(`f41408da…`), 비교 :154-160 | `tutor-detail.js` 파일 전체가 기준 커밋과 같아야 함 | **걸림 예상** → `TUTOR_DETAIL_REF`만 290 커밋으로 |
| scripts/verify-shop-page.mjs | :363, :368 | fit 없는 사진의 마이샵 src가 `/N-prime.jpg`라고 기대 | **걸림 예상** → 이 두 줄의 **기대값만** `-prime.jpg` → `-basic.jpg`로(새 규칙과 같게). 다른 검사·비교 방식은 그대로 |

- `verify-tutor-region-unit.mjs:695-698`(coarseRegionForGuest 호출 8곳)·`verify-detail-card-all-fields.mjs`는 그대로 통과해야 한다. 호출부를 지우거나 늘리지 않는다.
- **위 표 밖의 잠금이 걸리면 멈추고 보고.**

---

## 4. 새 작은 검사

`scripts/verify-photo-nofit-square.mjs` 추가, package.json에 `verify:photo-nofit-square` 등록.

1. 공부방 펼친 카드: fit 있음 → `p24-fit-photo`(square 아님), src = fit.
2. 공부방: fit 없음 + basic_720·prime 있음 → `p24-fit-photo--square`, src = basic_720, **HTML에 prime 경로 없음**.
3. 공부방: basic_720 없고 basic_360만 → src = basic_360, square.
4. 공부방: 사진 없음 → 로고 그대로.
5. 과외쌤: fit 없음, `image_path` = prime, basic_720 있음 → square, src = basic_720, prime 경로 없음.
6. 과외쌤: 사진 없음 → 첫 글자 그대로.
7. 마이샵 `collectShopPhotos`: fit 없음 → src = basic_720, fit 있음 → fit.
8. CSS: `.p24-dl .p24-fit-photo--square`에 `aspect-ratio: 1 / 1`, `.p24-dl` 밖에 새 규칙 없음.
9. 카드 목록: `exposure-render.js`가 `3a39df06`과 같음.
10. 변조 검사 1개 이상(일부러 prime으로 돌리면 2·5번이 잡음).

---

## 5. 테스트·보고

- **새 테스트 계정만** 쓴다. 기존 데이터는 지우지 않는다.
- fit 없는 사진(288 전 방식: fit 파일만 없는 테스트 사진)과 fit 있는 사진으로 공부방·과외쌤 펼친 카드, 마이샵을 **1280·390**으로 캡처. 카드 목록 1장(안 바뀜).
- `npm run verify:photo-nofit-square`(새), `verify:tutor-search-fields`, `verify:tutor-region-unit`, `verify:shop-page`, `verify:tutor-basic-required`, `verify:photo-exif-nocrop`, 빌드 등 **모든 검사 초록**.
- 커밋은 고친 파일만 `git add <파일>`. **`git add -A` 금지.**
- **브랜치에만 push.** merge 금지. force-push 금지. docs 커밋 금지(시키지 않으면).

### 보고에 적을 것
1. 브랜치·커밋 해시
2. 고친 파일과 줄 범위
3. 올린 잠금(전·후 해시)과 바꾼 기대값 2줄
4. 검사 결과(모두 초록)
5. 캡처 경로
6. 범위 밖이라 멈춘 것이 있으면 그 내용
