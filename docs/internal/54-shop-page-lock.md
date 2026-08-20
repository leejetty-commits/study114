# ShopPage 고정화 정본 (Lock)

**기준일:** 2026-08-21  
**지위:** ShopPage 작업의 **정본(SSOT)**. 시안·꾸미기보다 포맷 붕괴 방지 우선.  
**검증(머지 게이트):** `npm run verify:shop-page` (= `node scripts/run-verify-shop-page.mjs`)  
- CI: `.github/workflows/shop-page-gate.yml` (PR + `main` push)  
- 배포: `deploy.yml`에서도 동일 가드 — **실패 시 FTP 배포 불가**  
- GitHub → Settings → Branches → `main` 보호에 **`ShopPage gate / verify:shop-page`** 를 required check로 추가 권장

한 줄: *지금은 샵을 더 꾸밀 단계가 아니라, 이 포맷이 다시 안 무너지게 잠그는 단계다.*

---

## 레드라인 (절대 금지 4)

| # | 금지 | 이유 |
| --- | --- | --- |
| 1 | **섹션 순서 변경** | `SHOP_SECTION_ORDER` 외 임의 재배치 → 밀도 케이스·회귀 전부 |
| 2 | **raw를 렌더에서 직접 만짐** | ad-hoc 분기 재증식. 반드시 `buildShopViewModel` → `renderShopViewModel` |
| 3 | **owner / public 본문 분기** | 마이샵 ≠ 공개 샵이 되는 순간 제품 실패. 셸(복귀 버튼)만 공개 전용 |
| 4 | **금지키 노출** | `home_address*` · `address_text` · `gender` · `contact_phone` · `contact_email` — 시안이 예뻐도 한 번 새면 실패 |

위반 PR은 `verify:shop-page` 또는 리뷰에서 반려.

---

## 1) ViewModel 계약 (코드 상수)

파일: `preview/home-ui/src/study-room-reg/shop-view-model.js`

```
SHOP_SECTION_ORDER =
  hero → facts → signature → gallery → classes
  → career → trust → facilities → livingArea → social → inquiry
```

- **매핑만:** `buildShopViewModel(raw, room)`
- **렌더만:** `renderShopViewModel(vm)` (`myshop-render.js`)
- `data-shop-section` = 위 키와 동일

과외쌤: `meta.offeringsAlias = 'classes'` 여지만 둠. **지금 일반화하지 않음.**  
**다음 확장 우선순위:** 과외쌤 ≪ **등록점검(마이샵 완성도) 강화**.

---

## 2) Fallback matrix

상수: `SHOP_FALLBACK_MATRIX` + `resolveHeroGalleryWithFallback` / `resolveHeroCopy`

| 상황 | 규칙 ID | 결과 |
| --- | --- | --- |
| 사진 0 | `no_photos` | Hero 기본 SVG · Gallery 숨김 |
| 사진 있음 · cover 없음 | `no_cover_first_photo` | 첫 장 Hero · 나머지 Gallery |
| cover 있음 | `cover` | cover → Hero |
| 슬로건만 / 한줄만 / 동일 | `slogan_only` / `intro_only` / `same` | 중복 없이 Hero 카피 |
| 수업 0 · 월수업료만 | `no_classes_fee_tile` | classes 숨김 · facts 가격 타일 |
| 홍보지역 1 | `one` | 「X 생활권」 |

---

## 3) 등록점검 ↔ 마이샵 완성도 (다음 확장 우선)

파일: `shop-completeness.js`  
UI: 등록점검 **「마이샵 완성도」** — 공개 필수와 분리.

샵이 비어 보이면 **이유 문장**을 상단에 직접 표시한다.  
예: `지금 샵이 얇아 보이는 이유: 대표사진 없음 · 수업 카드 없음`

| id | 라벨 | 비어 보일 때 이유 |
| --- | --- | --- |
| cover | 대표사진 | 대표사진이 없어 Hero가 기본 이미지로만 보입니다 |
| intro_short | 한 줄 소개 | 한 줄 소개가 없어 Hero 리드가 비어 보입니다 |
| classes | 수업상세 | 수업 카드가 없어 「수업 안내」 섹션이 숨겨집니다 |
| teaching_style | 지도 스타일 | 지도 스타일이 없어 「매력」 섹션이 약하거나 숨겨집니다 |
| fee | 월 평균 수업료 | 가격대가 Quick Facts에 안 나옵니다 |
| living | 생활권 | 생활권 문장이 Hero·위치에서 빠집니다 |

---

## 4) 회귀 테스트 기본 세트 (게이트)

`npm run verify:shop-page` 필수:

- owner/public HTML 동일
- 섹션 순서 = `SHOP_SECTION_ORDER`
- 금지키 비노출
- 수업/사진 반복
- ViewModel · fallback · 완성도
- 렌더 route 분기 없음

---

## 5) 관련 파일

| 파일 | 역할 |
| --- | --- |
| `shop-view-model.js` | shape · fallback · mapper |
| `shop-formatters.js` | 표시값 변환 |
| `shop-completeness.js` | 마이샵 완성도 |
| `myshop-render.js` | VM → HTML |
| `screens.js` | 등록점검 UI |
| `scripts/verify-shop-page.mjs` | 회귀 |
| `.github/workflows/shop-page-gate.yml` | PR/main 게이트 |
| `.cursor/rules/shop-page-lock.mdc` | 에이전트 레드라인 |
