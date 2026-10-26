# [309] 토큰화 P3 잔여 — zip-bridge / home-popup / promo-catalog

- **과제:** 309
- **브랜치:** `cursor/309-tokenize-p3-bridge-popup-catalog-20261026`
- **RESTORE_BASE:** `e483f1ccf8d2039faad5a9ea30c084b4e7698893`
- **base 확인:** `git fetch` 후 `git rev-parse origin/main` = `e483f1ccf8d2039faad5a9ea30c084b4e7698893`
- **상태:** 검수 대기. 이 세션은 자기 커밋을 승인하지 않는다. merge / Deploy 하지 않음.

## 지시서 원문

> [309] 토큰화 P3 잔여 — zip-bridge / home-popup / promo-catalog (px→--space-*)
> base = 308c merge 후 main `e483f1ccf8d2039faad5a9ea30c084b4e7698893`. dirty는 오너 로컬 — 건드리지 말 것.
> 307 worklog 「손대지 않은 파일 (후속 후보)」 중 3개. mypage-ops·home-promo는 이번 제외.
>
> 3개 CSS의 간격 px 하드코딩(margin*/padding*/gap/row-gap/column-gap, inset·scroll-padding 등)을 `tokens.css`의 `var(--space-*)`로 바꾼다.
> 스케일 밖 값(6·10·14·18·28px 등)은 화면 확인 후 최근접 `--space-*`. 최근접이 분명히 깨지면 raw 유지 + 「유지(의도적 비스케일)」.
> 시각 동등 우선. before/after 스크린샷 필수.
> 문구·라우팅·JS·PHP·API·PG·셀렉터 구조·색·타이포·radius 변경 없음. `tokens.css` 수정·신규 토큰 없음.
> stage5b `--s-*` 사용 금지. 음수 margin은 `calc(-1 * var(--space-N))`. 1px 보정은 유지.
> 0 / auto / %·vw·calc(레이아웃 폭) / border·radius·font-size·line-height·width·height·top/left(위치)는 대상 아님.
> 파일별 한 커밋: zip-bridge → home-popup → promo-catalog. push · PR. merge / Deploy 금지.

## 토큰 스케일

`html { font-size: 16px }` (`home.css`) 기준 rem = px.

| px | 4 | 8 | 12 | 16 | 20 | 24 | 32 | 40 | 48 | 64 | 80 |
|----|---|---|----|----|----|----|----|----|----|----|-----|
| tok | `--space-1` | `-2` | `-3` | `-4` | `-5` | `-6` | `-8` | `-10` | `-12` | `-16` | `-20` |

7·9·11·14 없음.

## 카운트 방법

간격 속성: `margin`/`padding`/`gap`/`row-gap`/`column-gap`/`inset`/`scroll-padding`/`scroll-margin`과 그 longhand.
선언 값에 `Npx`가 있으면 px 선언 1건. `var(--space` 등장 횟수는 값 치환 수와 맞춘다.

```
rg -n -e "margin|padding|gap|inset|scroll-padding|scroll-margin" preview/home-ui/src/styles/zip-bridge.css preview/home-ui/src/styles/home-popup.css preview/home-ui/src/styles/promo-catalog.css preview/home-ui/src/styles/home-promo.css
```

px 선언만 세려고, 위 속성 줄에서 `\dpx`가 있는 선언만 집계했다. `top`/`right`/`bottom`/`left`(위치), `width`/`height`, `font-size`, `line-height`, `border`, `radius`는 제외.

## 파일별 결과

### 1. zip-bridge.css

| 지표 | 수정 전 | 수정 후 |
|------|--------|--------|
| px 선언 | 19 | 1 |
| var(--space-*) | 0 | 26 |

- **값 치환:** 26 (px 토큰 27개 중 2px 1개 유지)
- 정확 배수(4/8/12/16/20/24/32/40)는 1:1.
- 음수: `margin-top: -4px` → `calc(-1 * var(--space-1))` (pattern-band)

### 2. home-popup.css

| 지표 | 수정 전 | 수정 후 |
|------|--------|--------|
| px 선언 | 37 | 0 |
| var(--space-*) | 0 | 54 |

- **값 치환:** 54
- 위치(`top`/`right`/`bottom`/`left`)·폭·높이·글자 크기는 그대로. 예: 닫기 버튼 `top/right: 14px`, 워터마크 `bottom`, 오브 `right: -40px`.

### 3. promo-catalog.css

| 지표 | 수정 전 | 수정 후 |
|------|--------|--------|
| px 선언 | 5 | 0 |
| var(--space-*) | 0 | 7 |

- **값 치환:** 7. 전부 4px 배수 1:1. 비스케일 없음.

### home-promo.css (확인만, 수정 없음)

간격 속성의 px 선언 0. 간격은 rem. `var(--space` 2건은 원래 있음. 309b 후보 `mypage-ops.css`는 열지 않음.

## 유지 (의도적 비스케일)

| 파일 | 선택자 | 값 | 사유 |
|------|--------|----|------|
| zip-bridge.css | `.uds-theme .fake-tag` | `padding`의 `2px` (가로는 `--space-1`) | 정책의 2px 유지. `--space-1`(4px)로 올리면 세로 패딩이 두 배. 화면에서 `fake-tag` 사용처 없음 |

그 외 간격 px는 남지 않음. 후 카운트(zip 1 / popup 0 / catalog 0)와 이 목록이 일치한다.

## 비스케일 매핑 (이전 → 이후)

동률이면 같은 선언·인접 간격의 리듬을 따랐다. 고정 높이 카드(공지 480, 이벤트 히어로 210, 광고 360)는 패딩이 커져 내용이 줄지 않는 쪽을 골랐다. 화면에서 붙거나 줄바꿈이 난 선언은 없었다.

### zip-bridge.css

| 이전 | 이후 | 선택 |
|------|------|------|
| 6px (fake-tag padding 가로, margin-left) | `--space-1` (4) | 동률. 유지한 세로 2px에 맞춰 8 대신 4 |
| 6px (`.section-chip` gap) | `--space-2` (8) | 동률. 칩 가로 8px 리듬. 화면 패딩은 `udx-std-apply.css`가 `0 0.375rem`으로 덮어 변화 없음 |
| 3px (`.section-chip` padding 세로) | `--space-1` (4) | 최근접. 같은 이유로 화면 패딩은 덮임 |
| 14px (공지 아코디언 head/panel 세로) | `--space-4` (16) | 동률. 같은 패딩의 16px에 맞춤 |
| 18px (공지 아코디언 왼쪽) | `--space-5` (20) | 동률. 왼쪽 강조선 여백이 오른쪽보다 큰 관계를 유지. `#/support/notice`는 등록 공지가 없어 그 행은 화면에 없음 |

### home-popup.css

| 이전 | 이후 | 선택 |
|------|------|------|
| 10px (`.home-popup__frame` gap) | `--space-3` (12) | 동률. 카드 안 12px 스택 |
| 6px (스위치 gap·버튼 세로 패딩) | `--space-2` (8) | 동률. 4px로 줄이면 알약이 붙음 |
| 22 / 26 / 18 / 28px (공지 카드 padding) | `--space-5` / `-6` / `-4` / `-6` (20/24/16/24) | 22·18은 동률이고 고정 높이에서 줄어드는 쪽. 26은 최근접 24. 28은 동률이고 24 (같은 파일 히어로와 동일) |
| 14px (head margin, indent, list margin, actions gap, coral margin, period margin, aside gap) | `--space-3` (12) | 동률. 본문 margin 12와 맞춤 |
| 18px (list padding-left) | `--space-4` (16) | 동률 |
| 18px (CTA padding 가로) | `--space-5` (20) | 동률. 버튼이 줄지 않게. 390 광고에서 두 버튼 줄바꿈 없음 |
| 22px (actions margin-top) | `--space-5` (20) | 동률. 고정 높이 |
| 3px (배지 padding 세로) | `--space-1` (4) | 최근접 +1px |
| 10px (칩 padding 가로) | `--space-2` (8) | 동률. 세로 4px와 함께 컴팩트 |
| 28px (히어로 padding 세로, 광고 aside padding 위) | `--space-6` (24) | 동률. 히어로는 같은 선언의 24px와 통일. aside는 아래 20px보다 32가 더 벌어진다 |
| 46px (광고 본문 padding 위) | `--space-12` (48) | 최근접 (40은 6px 차이) |
| 22px (광고 본문 padding 좌우) | `--space-5` (20) | 동률. 위가 48로 늘어나므로 가로는 키우지 않음 |

## 화면

로컬 `http://127.0.0.1:5174`. pageerror 0 (콘솔 error·예외 0).

- zip-bridge: `#/support`, `#/guide`, `#/community` (concern-app). 공지 아코디언은 `#/support/notice`인데 등록 공지 0건.
- home-popup: `?popupDemo=`는 `isAdminUser()`일 때만 엔진이 연다. 이 환경은 `/api` 프록시(127.0.0.1:8080)가 실패해 공개 팝업도 안 떴다. `#/guest`에 `mount.js`와 같은 카드 마크업을 붙여 `home-popup.css`가 적용된 상태를 찍었다. 공지 샷만 미리보기 스위치(set-a/유형)를 포함한다.
- promo-catalog: `#/promo/study-room` (`.promo-app`).

| 화면 | 1440 before / after | 390 before / after |
|------|---------------------|--------------------|
| support | `shots-309/before/support-1440.png` | `support-390.png` |
| support notice | `support-notice-1440.png` | `support-notice-390.png` |
| guide | `guide-1440.png` | `guide-390.png` |
| community | `community-1440.png` | `community-390.png` |
| promo study-room | `promo-study-room-1440.png` | `promo-study-room-390.png` |
| popup notice | `popup-notice-1440.png` | `popup-notice-390.png` |
| popup ad | `popup-ad-1440.png` | `popup-ad-390.png` |
| popup event | `popup-event-1440.png` | `popup-event-390.png` |

after는 같은 파일명으로 `shots-309/after/`.

회귀: `#/community` · `#/guide` · `#/support` 종이겹·타일 문법이 유지됐다. support·guide·community·promo는 4px 배수 1:1이라 1440·390 샘플 비교가 0에 가깝다(guide 1440 샘플 3, community 1440 샘플 13, 나머지 0). 팝업은 비스케일 2–4px만 움직였고, 390에서 버튼 줄바꿈·잘림은 없었다.

## 빌드

`preview/home-ui`에서 `npm run build` 통과 (exit 0). esbuild 경고 `font-size: var(--text-xs)`는 이번 diff의 간격 선언이 아니다.

## 범위 확인

- `tokens.css` diff 0. 새 토큰 없음.
- `var(--s-*)` 사용 0. zip-bridge 안의 `--s-*` 정의(stage5b 값)는 간격 속성이 아니라 그대로 둠.
- JS/PHP/색/타이포/radius/셀렉터 구조 변경 없음.
- `mypage-ops.css` 미수정. `home-promo.css` 미수정.
- 오너 dirty는 커밋하지 않음. stash 없음.

## 복원

```bash
git restore --source=HEAD -- preview/home-ui/src/styles/zip-bridge.css preview/home-ui/src/styles/home-popup.css preview/home-ui/src/styles/promo-catalog.css
```

커밋을 되돌릴 때 base는 `e483f1ccf8d2039faad5a9ea30c084b4e7698893`. push 이후 force-push 금지. 그때는 `-r2` 브랜치 또는 보고.

## AC

- [x] base = `e483f1ccf8d2039faad5a9ea30c084b4e7698893` · 브랜치 `cursor/309-tokenize-p3-bridge-popup-catalog-20261026`
- [x] dirty 목록 변경·커밋 0
- [x] 허용 3 CSS + worklog/shots만 · tokens.css 0 · `--s-*` 사용 0
- [x] 파일별 전/후 카운트 · 유지 목록 일치 · 비스케일 매핑 기록
- [x] before/after 샷 1440·390 · 커뮤니티·이용안내·고객센터 회귀 0
- [x] 빌드 통과 · PR · merge 안 함
