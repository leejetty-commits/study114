# 275 마이샵 홍보사진 고정 칸 (윗단 2칸 · 아랫단 3칸)

> **상태: 지시서 (2026-10-21, 종현 확정 규칙).** 이 문서에 적힌 것만 한다. 범위 밖이 필요하면 **고치지 말고 멈추고 보고**(7장). 273 때처럼 멈춤 조건을 넘기고 진행하면 불합격이다.

- 작업 번호: 275
- 기준: `main` **`9d41304a`** (273 병합). 새 브랜치 **`cursor/275-myshop-photo-slots`** 를 여기서 만든다.
- 모델: grok-4.7 high만.
- 금지: force-push, `main` 병합·배포, `git add -A`, 운영 DB·운영 파일 쓰기, 원본 사진 파일 수정.
- 시안: `/workspace/study114/audits/myshop-photos/mockup-1280.png`, `mockup-390.png` (사진 3장일 때).
- 이전 점검 자료: `/workspace/study114/audits/myshop-photos/` (지금 모습 `local-room1-*photo-*.png`).

> 쉬운 말 안내: 지금 마이샵은 사진 수에 따라 큰 사진 하나와 작은 썸네일이 들쭉날쭉 보이고, 사진이 잘리고, 올린 순서도 바뀝니다. 이제 **사진 칸을 고정**합니다. 위에 2칸, 아래에 3칸. 사진은 올린 순서대로 왼쪽부터 들어가고, 잘리지 않으며, 남는 빈 곳은 같은 사진을 흐리게 깔아 채웁니다.

---

## 0. 종현 확정 규칙 (바꾸지 말 것)

| # | 항목 | 확정 |
|---|---|---|
| 1 | 장수 | 공부방 상세정보1 홍보사진 **최대 5장** (`preview/shared/promo-image.js:14` `maxCount: 5`, 서버 저장 `StudyRoomRegisterService.php:1391` 은 이미 5). |
| 2 | 윗단 | **1·2번 사진.** 마이샵 **첫 부분**. 본문 폭을 **2등분**, 칸 비율 **4:3**. |
| 3 | 아랫단 | **3~5번 사진.** 마이샵 **맨 아래**. 본문 폭을 **3등분**, 칸 비율 **1:1**, 사진 사이 약간의 여백. |
| 4 | 칸 고정 | 칸 크기는 **사진 수와 상관없이 항상 같다.** 왼쪽부터 채우고 남는 칸은 비운다. 사진이 적어도 **사진 폭이 넓어지지 않는다.** |
| 5 | 사진 넣는 법 | **자르지 않는다.** 사진 전체를 칸 안에 넣는다(`object-fit: contain`). 남는 빈 곳은 **같은 사진을 흐리게 깔아** 채운다. 흐린 배경은 `basic_720` 파일을 쓴다. **원본 파일은 바꾸지 않는다**(CSS로만). |
| 6 | 휴대폰(≤720px) | 윗단 **2칸 그대로**. 아랫단은 **한 줄 2칸씩**(3번·4번 / 5번). |
| 7 | 순서 | **상세정보1에 올린 순서**(`sort_order`). 종류(대표·내부·시설·기타)로 다시 정렬하지 않는다. 대표사진(cover)도 맨 앞으로 끌어오지 않는다. |
| 8 | 서버 상한 | 공개 읽기 `StudyRoomPublicReadService.php` 사진 상한 12 → **5**. |
| 9 | 1장 | 1장일 때도 윗단 1번 칸에 그린다. |
| 10 | 같은 렌더러 | 주인 미리보기(`study-room-reg/screens.js`)와 공개 페이지(`myshop/public-shell.js`)는 **같은 함수**(`renderMyshopShowcase`)로 그린다. 이미 같으므로 그 함수만 고친다. |
| 11 | 안내 | `study-room-ui/src/promo-photos.js` 에는 **안내 한 줄만** 더한다: 「1·2번 사진은 마이샵 맨 위, 3~5번은 맨 아래에 보여요」. |
| 12 | 범위 밖 | 목록 **카드 사진·로고**는 별도 지시서. 이번엔 건드리지 않는다. |

### 0-1. 종현 확정 2026-10-21 (추가 결정)
- **0장**: **윗단 자체를 그리지 않는다.** 기본 이미지(`ROOM_DEFAULT_BASIC`)도 쓰지 않는다. 아랫단도 없음. 마이샵은 이름 카드(`.shop-hero__card`)부터 시작.
- **1~2장**: 아랫단(3~5번)은 사진이 없으므로 **섹션을 그리지 않는다.** 3장 이상이면 3칸을 다 그리고 남는 칸은 빈 칸.
- **빈 칸 모양**: 옅은 바탕(`#f5f5f4`) + 둥근 모서리, 글자 없음. 누를 수 없음. **테두리 없음.**
- **윗단 액자 테두리** (사진 있는 칸만):
  - 안쪽 흰 여백 **6px**(`padding: 6px; background: #fff`).
  - 바깥 **1px 연회색 선**: 기존 토큰 `var(--uds-line)`(`home-ui/src/styles/tokens.css:188` → `--product-line` `#e5e7eb`, `:44`). 토큰이 없는 화면이면 `#E3E8EF`. 즉 `border: 1px solid var(--uds-line, #E3E8EF)`.
  - 모서리 **6px**, 아주 엷은 그림자(예: `0 1px 2px rgb(15 23 42 / 0.06)`).
  - **4:3은 사진 영역 기준**(테두리·여백 안쪽). 두 칸 합친 폭(여백·선·사이 간격 포함)은 **본문 폭을 넘지 않는다.**
  - 아랫단(3~5번)은 테두리 없음.
- **아랫단 위치**: `SHOP_SECTION_ORDER` 맨 끝(`inquiry` 다음). 제목은 지금 쓰던 「사진으로 보는 공간」.
- **사진 누르면**: 지금처럼 크게 보기(lightbox). 큰 화면도 자르지 않고 원본 비율.

---

## 1. 지금 코드 (9d41304a, 행 번호 확인함)

| 곳 | 지금 | 문제 |
|---|---|---|
| `src/StudyRoom/StudyRoomPublicReadService.php:317-379` `publicImages()` | `ORDER BY (image_type = 'cover') DESC, sort_order ASC, id ASC LIMIT 12` (`:332-333`, 예비 쿼리 `:343-344`). 응답에 `image_path`(prime_1280 → basic_720 → image_path 순으로 고른 한 개)만 넣고 `basic_720_path` 는 안 넣음(`:361-376`) | 대표사진이 맨 앞으로 와서 순서가 깨짐. 12장. 흐린 배경용 `basic_720` 이 공개 페이지에 안 옴 |
| `preview/home-ui/src/myshop/public-model.js:19-79` `normalizeImages()` | `basic_720_path` 가 없으면 `path`(=prime_1280)로 채움(`:34`). 그 뒤 `image_path_prime`·`image_path`·`image_path_basic`(`:67-77`)를 **추가 사진으로 또 넣음** | 서버가 `image_path` 를 cover로 주므로 같은 경로면 걸러지지만, 경로가 다르면(예: prime vs basic) **같은 사진이 두 번** 들어갈 위험 |
| `preview/home-ui/src/study-room-reg/shop-formatters.js:188-190` `imgSrc()` | basic_720 우선 | 큰 칸에 작은 파일. 흐린 배경과 본 사진을 나눠야 함 |
| `shop-formatters.js:212-220` `splitHeroAndGallery()` | cover → Hero, 나머지를 interior→facility→other 로 **다시 정렬** | 올린 순서가 깨짐 |
| `preview/home-ui/src/study-room-reg/shop-view-model.js:60-72` `SHOP_FALLBACK_MATRIX.heroImage`, `:97-112` `resolveHeroGalleryWithFallback()`, `:172-174` heroSrc, `:229-234` galleryItems, `:272-283` VM `hero.imageSrc`·`gallery.items`, `:323-324` `shopSectionHasContent('gallery')`, `:37-53` `SHOP_SECTION_KEYS` | Hero 1장 + Gallery 나머지 구조 | 새 구조(윗단 2 / 아랫단 3)로 바꿔야 함 |
| `preview/home-ui/src/study-room-reg/myshop-render.js:38-48` Hero `<img>`, `:92-118` Gallery(큰 사진 1 + 썸네일), `:230-243` `byKey` | Hero 16:9 cover 1장 + Gallery | 칸 고정 아님 |
| `preview/home-ui/src/styles/myshop.css:62-75` `.shop-hero__media`(16:9, cover), `:77-82` default, `:374-430` `.shop-gallery*`(16:10 cover, 썸네일 `auto-fill minmax(5.5rem,1fr)`) | 잘림(cover), 사진 수에 따라 칸 수·폭이 바뀜 | |
| `scripts/verify-shop-page.mjs:9,20,164-176,300,309-340` | 옛 구조(내부 우선, Hero+Gallery 4장)를 검사 | 새 규칙으로 바꿔야 함 |
| `docs/internal/54-shop-page-lock.md:33,48-54` | 옛 Hero/Gallery 규칙 | 정본 문구 고침 |

---

## 2. 시작 조건
1. `git fetch` 후 `origin/main` 이 `9d41304a` 인지 확인. 다르면 멈추고 보고.
2. `git switch -c cursor/275-myshop-photo-slots 9d41304a`. `git status` 깨끗.

---

## 3. 수정

### 3-1. 서버: 순서·5장·basic_720 내려주기
- `StudyRoomPublicReadService.php:332`·`:343`: `ORDER BY sort_order ASC, id ASC` (cover 우선 빼기). `:333`·`:344`: `LIMIT 5`.
- `:371-376` 결과에 두 칸 추가: `'prime_1280_path' => 원래 prime_1280(없으면 '')`, `'basic_720_path' => 원래 basic_720(없으면 '')`. 기존 `image_path` 고르는 방식(`:361-369`)과 다른 칸은 그대로.
- `:114` `$cover = $images[0]['image_path']` 는 **바꾸지 않는다**(카드·목록용, 범위 밖). 단, 순서가 바뀌어 `$cover` 가 대표사진이 아니게 되면 → **멈추고 보고**(7장 3번). 고칠 방법 제안만 적는다(예: `$images` 에서 `image_type === 'cover'` 를 먼저 찾기).
- DB·업로드·저장 코드(`StudyRoomRegisterService.php`)는 건드리지 않는다.

### 3-2. 공개 페이지 정리
- `public-model.js` `normalizeImages()`:
  - `item.images` 가 1장 이상이면 **그것만** 쓴다. `item.gallery`(`:54-65`)·`image_path_*`(`:67-77`)는 `images` 가 비었을 때만 예비로 쓴다(같은 사진 두 번 방지).
  - `basic_720_path` 는 서버 값이 있을 때만, 없으면 빈 값(`:34` 의 `|| path` 빼기). `prime_1280_path` 도 같음.
  - 최대 5장으로 자른다.

### 3-3. 사진 목록 만들기 (순서 그대로)
- `shop-formatters.js`:
  - `collectShopPhotos()`(`:196-206`): 각 사진에 `src`(본 사진: prime_1280 → image_path → basic_720 순), `blurSrc`(흐린 배경: basic_720 → src), `type`, `title` 을 담는다. `sort_order` 가 있으면 그 순서로, 없으면 들어온 순서 그대로. **최대 5장.**
  - `splitHeroAndGallery()`(`:212-220`)는 **지우고** `splitPhotoSlots(photos)` 로 바꾼다: `{ top: [p1, p2], bottom: [p3, p4, p5] }`. 종류 정렬 없음, cover 끌어오기 없음.
- 주인 미리보기의 `registerState.images` 순서는 `promo-photos.js:95`·`:158` 이 이미 `sort_order` 를 1부터 매긴다. 이것을 그대로 따른다.

### 3-4. 화면 모델
- `shop-view-model.js`:
  - `resolveHeroGalleryWithFallback()`(`:97-112`) → `resolvePhotoSlots(photos)`: `{ top, bottom, ruleId }`. ruleId = `no_photos`(윗단·아랫단 모두 없음) | `top_only`(1~2장) | `top_and_bottom`(3~5장).
  - `SHOP_FALLBACK_MATRIX.heroImage`(`:60-72`)를 새 규칙 3줄로 바꾼다(키 이름 `heroImage` 는 유지해도 됨).
  - VM: `hero.photos`(윗단 2칸 배열, 빈 칸은 `null`), `hero.photos` 가 빈 배열이면 윗단 없음(0장), `photosBottom.items`(3칸 배열, 빈 칸 `null`). 기존 `hero.imageSrc`·`imageIsDefault` 는 마이샵에서 쓰지 않는다(다른 곳에서 쓰면 그대로 두고 보고).
  - `SHOP_SECTION_KEYS`(`:37-50`): `'gallery'` 를 `'inquiry'` 다음 **맨 끝**으로 옮긴다. `shopSectionHasContent('gallery')`(`:323-324`) = 3번 사진이 있을 때만 true.

### 3-5. 그리기
- `myshop-render.js`:
  - Hero(`:38-48`): `.shop-hero__media` 자리에 **윗단** `<div class="shop-photos shop-photos--top" data-shop-photos="top">` + 칸 2개. 그 아래 `.shop-hero__card`(이름·슬로건)는 그대로.
  - Gallery(`:92-118`): **아랫단** `<div class="shop-photos shop-photos--bottom" data-shop-photos="bottom">` + 칸 3개. 섹션 제목 「사진으로 보는 공간」 유지.
  - 사진 칸 하나:
    ```html
    <button type="button" class="shop-photo" data-shop-thumb="{src}" data-shop-photo-index="{1~5}" aria-label="사진 {n} 크게 보기"
            style="--shop-photo-blur:url('{blurSrc}')">
      <img src="{src}" alt="" loading="lazy" data-shop-fallback="{blurSrc}" onerror="…지금과 같은 1회 대체…" />
    </button>
    ```
    빈 칸: `<div class="shop-photo shop-photo--empty" aria-hidden="true"></div>`.
  - 0장: 윗단 `<div>` 자체를 출력하지 않는다(`.shop-hero__card` 만).
  - 윗단 사진 칸은 액자 구조: `<button class="shop-photo shop-photo--framed"><span class="shop-photo__area" style="--shop-photo-blur:…"><img …></span></button>` — 흐린 배경과 contain은 `__area` 안에서, 액자(흰 여백·선·그림자)는 바깥 버튼에.
  - 캡션(`shop-gallery__cap`)은 칸 안에 지금처럼 보여도 되고, 사진을 가리지 않게 아래 왼쪽 작은 글자로.
  - lightbox(`:250-290`)는 그대로. `data-shop-thumb` 를 계속 쓰므로 고칠 필요 없음.
- `myshop.css`:
  - `:62-82` `.shop-hero__media*` 와 `:374-430` `.shop-gallery*` 를 새 규칙으로 바꾼다(옛 클래스는 지워도 됨).
  ```css
  .shop-photos { display: grid; gap: 0.5rem; }
  .shop-photos--top { grid-template-columns: repeat(2, 1fr); }
  .shop-photos--bottom { grid-template-columns: repeat(3, 1fr); }
  .shop-photos--top .shop-photo { aspect-ratio: 4 / 3; }
  .shop-photos--bottom .shop-photo { aspect-ratio: 1 / 1; }
  .shop-photo { position: relative; overflow: hidden; border: 0; padding: 0; border-radius: 0.8rem; background: #f5f5f4; cursor: zoom-in; }
  .shop-photo::before { content: ''; position: absolute; inset: -12px; background: var(--shop-photo-blur) center / cover no-repeat; filter: blur(14px) brightness(0.92); }
  .shop-photo img { position: relative; width: 100%; height: 100%; object-fit: contain; display: block; }
  .shop-photo--empty { cursor: default; }
  .shop-photo--empty::before { content: none; }
  /* 윗단 액자: 4:3은 사진 영역(__area) 기준 */
  .shop-photos--top .shop-photo { aspect-ratio: auto; }
  .shop-photo--framed { padding: 6px; background: #fff; border: 1px solid var(--uds-line, #E3E8EF); border-radius: 6px; box-shadow: 0 1px 2px rgb(15 23 42 / 0.06); min-width: 0; }
  .shop-photo--framed::before { content: none; }
  .shop-photo__area { position: relative; display: block; overflow: hidden; aspect-ratio: 4 / 3; border-radius: 3px; }
  .shop-photo__area::before { content: ''; position: absolute; inset: -12px; background: var(--shop-photo-blur) center / cover no-repeat; filter: blur(14px) brightness(0.92); }
  .shop-photos--top .shop-photo--empty { aspect-ratio: 4 / 3; } /* 빈 칸: 테두리 없이 사진 영역 크기만 */
  @media (max-width: 720px) { .shop-photos--bottom { grid-template-columns: repeat(2, 1fr); } }
  ```
  (값은 보기 좋게 조금 바꿔도 되지만 **칸 수·비율·contain·흐린 배경·고정 폭**은 그대로.)
  - 본문 폭은 지금 `.shop`(`:3`, `max-width: 58rem` `:21`)을 그대로 쓴다. 칸 폭은 사진 수와 상관없이 `1fr`.

### 3-6. 등록 화면 안내 한 줄
- `preview/study-room-ui/src/promo-photos.js` 사진 블록(`:55-80` 부근 `register-photo-block__count` 근처)에 `<p class="form-hint">1·2번 사진은 마이샵 맨 위, 3~5번은 맨 아래에 보여요</p>` 한 줄. 그 밖은 건드리지 않는다.

### 3-7. 검사·정본
- `scripts/verify-shop-page.mjs`: 옛 검사(`:300` 내부 우선, `:309-340` Hero/Gallery 장수, `:326` 내부 우선)를 새 규칙으로 바꾼다: 0~5장 각각 윗단·아랫단 칸 수(2/3, 빈 칸 수), 순서 = sort_order, cover가 3번에 있어도 3번 칸, 6장 넣어도 5장, `object-fit: contain` 문자열, `--shop-photo-blur` 가 basic_720 경로.
- `docs/internal/54-shop-page-lock.md:33`(섹션 순서), `:48-54`(사진 규칙 표)를 새 규칙으로. 「2026-10-21 종현 확정 275」 한 줄.

---

## 4. 하지 않는 것
- 목록·홈 **카드 사진·로고**, `exposure-render.js`, `StudyRoomPublicReadService.php:114` `$cover`·`:175-181` 카드용 칸.
- 사진 업로드·저장·자르기·파일 만들기(`StudyRoomRegisterService.php`, 이미지 변환 코드), DB 스키마, 원본 파일.
- 사진 순서 바꾸기 화면(끌어 옮기기) 새로 만들기.
- 마이샵의 다른 섹션 내용·순서(gallery 를 끝으로 옮기는 것 말고).
- 과외쌤 화면.

---

## 5. 검사 (우동공과2 로컬, **새 테스트 공부방 계정만**, 실결제·운영 쓰기 없음)

사진 준비: 가로로 긴 사진(예: 2000×800), 세로로 긴 사진(800×2000), 정사각형, 보통 4:3. basic_720 이 따로 만들어지는 실제 업로드 경로로 올린다.

1. **장수별** — 사진 0·1·2·3·4·5장 각각, **1280과 390**, **주인 미리보기와 공개 페이지 둘 다**(같은 모습이어야 함):
   - 윗단 칸 2개, 아랫단 칸 3개(3장 이상일 때만). 빈 칸 수 = 맞는지.
   - 칸 폭·높이(px)가 0~5장 사이에서 **모두 같음**(윗단 4:3, 아랫단 1:1, ±1px).
   - 390: 윗단 2칸 한 줄, 아랫단 2칸씩(3·4 / 5).
   - 가로 넘침 0(`scrollWidth === innerWidth`).
   - **0장**: `[data-shop-photos="top"]`·`[data-shop-photos="bottom"]` 둘 다 **없음**, 기본 이미지 `<img>` 없음, 이름 카드가 맨 위.
1-1. **윗단 액자** (1280·390, 1장·2장·5장):
   - 사진 칸: 안쪽 흰 여백 6px(`padding`), `border` 1px, 색 = `--uds-line` 계산값(`rgb(229, 231, 235)`) 또는 `#E3E8EF`, `border-radius` 6px, `box-shadow` 있음(엷게).
   - **사진 영역(`.shop-photo__area`) 폭:높이 = 4:3**(±1px). 바깥 칸 비율이 아니라 안쪽 기준.
   - 두 칸 오른쪽 끝 ≤ 본문(`.shop`) 안쪽 오른쪽 끝, 가로 넘침 0.
   - 1장일 때 2번 빈 칸: 테두리·그림자·흰 여백 **없음**, 크기는 1번 사진 영역과 같음.
   - 아랫단 칸: 테두리 없음.
2. **자르지 않음** — 가로·세로로 긴 사진이 칸 안에 **전체** 보임(`object-fit: contain`), 남는 곳은 같은 사진이 흐리게 깔림. 흐린 배경 URL = 그 사진의 `basic_720_path`.
3. **순서** — 대표사진(cover)을 3번째로 올린 계정: 마이샵 3번 칸(아랫단 첫 칸)에 보임. 종류가 섞여도 올린 순서 그대로.
4. **5장 상한** — DB에 사진 6행이 있는 계정(새 테스트 계정에만 직접 넣음): 공개 API `images` 5개, 화면 5장.
5. **같은 사진 두 번 없음** — 공개 페이지 `normalizeImages` 결과에 같은 사진 없음(prime·basic 경로가 다른 경우 포함).
6. **원본 그대로** — 검사 전후 업로드 파일 해시 같음.
7. **안내 한 줄** — 공부방 상세정보1 사진 블록에 문구 보임(1280·390).
8. **크게 보기** — 칸 누르면 lightbox 열림, 빈 칸은 안 열림.
9. **범위 밖 그대로** — 홈·찾기 카드 사진 바뀌기 전과 같음(9d41304a와 스크린샷 비교).
10. 빌드(home-ui·study-room-ui), `verify:shop-page` 통과, `verify:study-room-*`·`verify:paid-*`·`verify:pickprime-purchase-gate` 는 `9d41304a` 와 결과 같음.

---

## 6. 허용 파일

| # | 파일 | 할 일 |
|---|---|---|
| 1 | `src/StudyRoom/StudyRoomPublicReadService.php` | `:332-333`, `:343-344`, `:371-376` 만 (3-1) |
| 2 | `preview/home-ui/src/myshop/public-model.js` | `normalizeImages()` `:19-79` 만 (3-2) |
| 3 | `preview/home-ui/src/study-room-reg/shop-formatters.js` | `:188-220` 사진 함수만 (3-3) |
| 4 | `preview/home-ui/src/study-room-reg/shop-view-model.js` | 사진·섹션 순서 부분만 (3-4) |
| 5 | `preview/home-ui/src/study-room-reg/myshop-render.js` | Hero 사진 `:38-48`, Gallery `:92-118` (3-5) |
| 6 | `preview/home-ui/src/styles/myshop.css` | `:62-82`, `:374-430` + 새 `.shop-photo*` (3-5) |
| 7 | `preview/study-room-ui/src/promo-photos.js` | 안내 한 줄 (3-6) |
| 8 | `scripts/verify-shop-page.mjs` | 3-7 |
| 9 | `docs/internal/54-shop-page-lock.md` | 3-7 |

`screens.js`·`public-shell.js` 는 같은 렌더러를 부르므로 **고치지 않는다.** 고쳐야 하면 멈추고 보고.

---

## 7. 멈추고 보고할 때 (⚠ 반드시 지킨다)

아래에 걸리면 **그 자리에서 멈추고** 무엇이 왜 필요한지(파일:줄)만 보고한다. 추측으로 진행하지 않는다.

1. 6장 허용 파일 밖, 또는 허용 파일의 적힌 부분 밖을 고쳐야 할 때.
2. 주인 미리보기와 공개 페이지가 같은 함수로 그려지지 않거나, 둘의 사진 목록 순서가 다를 때.
3. 서버 순서를 바꾸면 카드·목록 대표사진(`:114` `$cover`)이나 픽·프라임 「대표사진」 판정이 바뀔 때.
4. `basic_720_path` 가 DB에 없는(NULL) 사진이 있어 흐린 배경을 못 깔 때 — 이때 `src` 로 대신 깔고 몇 장인지 보고(파일 만들기 금지).
5. 사진 1~5장 중 칸 크기가 하나라도 달라질 때, 사진이 잘릴 때, 액자 테두리를 넣으면 사진 영역 4:3이나 본문 폭을 못 지킬 때.
6. 5장 검사 중 하나라도 실패할 때.

---

## 8. 커밋 (같은 브랜치에 차례로)
- `275-1 fix(api): 마이샵 사진 올린 순서·최대 5장·basic_720 내려주기` (1번)
- `275-2 fix(myshop): 사진 목록 올린 순서 그대로·같은 사진 두 번 막기` (2·3번)
- `275-3 feat(myshop): 윗단 2칸·아랫단 3칸 고정, contain + 흐린 배경` (4·5·6번)
- `275-4 feat(register): 홍보사진 위치 안내 한 줄` (7번)
- `275-5 test/docs: 마이샵 사진 칸 검사·정본 54` (8·9번)
- 파일 이름으로 add → `git push origin cursor/275-myshop-photo-slots` (force 아님) → **멈춤.** main 병합 금지.

---

## 9. 완료 보고 형식
1. 브랜치, 시작(`9d41304a`), 커밋 해시 전부(순서대로), push 뒤 끝 해시.
2. 바뀐 파일:줄. 서버 PHP 바뀐 부분 원문.
3. 5장 1번 표: 장수(0~5) × 1280/390 × 주인/공개 → 윗단 사진 영역 크기, 아랫단 칸 크기, 빈 칸 수, 가로 넘침. 1-1 액자 값(여백·선 색·모서리·그림자·사진 영역 비율). 대표 스크린샷 경로.
4. 5장 2~9번 결과(긴 사진 스크린샷, 순서 계정 결과, API 장수, 해시 비교).
5. 빌드·검사 결과, `9d41304a` 에서도 실패하던 목록 따로.
6. 7장 멈춤 조건에 걸린 것: 「없었다」 또는 걸린 항목·멈춘 지점.
7. 범위 확인: 「6장 밖 파일, 카드 사진·로고, 업로드·저장, DB, 원본 파일은 건드리지 않았습니다. force-push·main 병합 하지 않았습니다.」

---

## 추가 허용 (2026-10-21 06:15, 우동공과2 — Cursor 멈춤 보고 반영)

- 허용 파일 추가: `src/StudyRoom/StudyRoomPublicReadService.php` **114행 한 줄(대표 경로 고르는 줄)만**. 사진 목록은 올린 순서(`sort_order ASC, id ASC`) 그대로 두고, 대표 경로는 `image_type === 'cover'`인 사진을 먼저 찾아 쓴다. cover가 없으면 지금처럼 첫 장을 쓴다.
- 목적: 홈·찾기 카드와 목록의 대표사진이 지금과 똑같이 유지되게 한다. 175~177행과 `TierRequirement.php`는 고치지 않는다.
- 검사 추가: 대표사진을 3번째로 올린 계정에서 마이샵은 올린 순서로 보이고, 홈·찾기 카드 사진은 바뀌기 전과 같다.
- 그 밖에 새로 고쳐야 할 줄이 나오면 다시 멈추고 보고한다.
