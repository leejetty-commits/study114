# Part D — 모바일 세로형 카드 (`≤600px`)

| 항목 | 내용 |
|------|------|
| 과제 ID | part-d-card-vertical-mobile |
| 날짜 | 2026-11-07 |
| 브랜치 | `feat/part-d-card-vertical-mobile` |
| 담당 | Cursor 메인 에이전트 |

---

## 지시 원문

> "구현하고 난뒤 두번의 정밀검수를 실시하라"
> (전 세션: "다음 4번째 파트를 시작하자. 데스크탑 웹사이트에는 영향을 끼쳐선 안된다. 모바일 최적화가 목표이다.")

---

## 목표

`≤600px` 에서 `expo-hcard`를 **세로형** 레이아웃으로 전환.
- 이미지: 풀폭·4:3 비율, 카드 맨 위
- 본문: 이미지 아래 (2행)
- 사이드(신뢰뱃지+버튼): 본문 아래 (3행)
- **`≥601px` 완전 무관** (데스크톱·태블릿 안전)

---

## 수정 파일

- `preview/search-ui/src/styles/search-visily.css`

---

## 기존 ≤600px 문제점

| 문제 | 설명 |
|------|------|
| 2열 그리드 유지 | `grid-template-columns: 5.75rem minmax(0,1fr)` 에서 변경 없음 |
| 이미지 행만 조정 | `grid-row: 1; align-self: start` → 이미지는 row 1에만, body/side는 여전히 col 2 |
| 과외쌤 절대 뱃지 | trust-rail `position: absolute; top: calc(0.55rem + 5.75rem + 0.2rem)` 로 이미지 아래 겹쳐 배치 |

---

## 구현 내용

### 케스케이드 설계

```
Base (.expo-hcard)          : grid-template-columns: 6.75rem minmax(0,1fr)
≤720px (.expo-hcard)        : grid-template-columns: 5.75rem minmax(0,1fr)
≤600px (.expo-hcard)  ← NEW : grid-template-columns: 1fr   (세로형)
```

### CSS 변경 (`@media (max-width: 600px)` 블록 전면 교체)

```css
/* 1. 카드: 1열 그리드 */
.expo-hcard,
.expo-basic.expo-hcard {           /* home-listings.css (0,2,0) 패딩 override 대응 */
  grid-template-columns: 1fr;
  row-gap: 0;
  padding: 0;
  overflow: hidden;                /* 이미지가 카드 border-radius에서 클리핑 */
}

/* 2. 이미지: 1행·풀폭·4:3 비율 */
.expo-hcard__media-wrap,
.expo-basic--study_room .expo-hcard__media-wrap,
.expo-basic--tutor .expo-hcard__media-wrap,
.expo-basic--student .expo-hcard__media-wrap {
  grid-column: 1; grid-row: 1;
  width: 100%; height: auto;
  aspect-ratio: 4 / 3;
  border-radius: 0;
}

/* 3. 본문: 2행 */
.expo-hcard__body { grid-column: 1; grid-row: 2; padding: 0.55rem 0.65rem 0.15rem; }

/* 4. 사이드: 3행·왼쪽 정렬 */
.expo-hcard__side { grid-column: 1; grid-row: 3; justify-content: flex-start; padding: 0.2rem 0.65rem 0.5rem; }

/* 5. 신뢰 뱃지 간격 (기존 유지) */
/* 6. 과외쌤 절대위치 뱃지 규칙 삭제 → 사이드(3행)에 자연 배치 */
```

---

## 1차 정밀검수 — CSS 케스케이드·특이도

| 체크 항목 | 결과 |
|-----------|------|
| `≥601px` 무관 (media query 내부에만) | ✅ |
| ≤600px block이 ≤720px block보다 나중 (동특이도·후발 우선) | ✅ |
| `home-listings.css .expo-basic.expo-hcard { padding }` (0,2,0) override | 🔧 초기 누락 → `.expo-basic.expo-hcard` 병기로 수정 |
| 이미지 (study_room·tutor·student) (0,2,0) 셀렉터 적용 | ✅ |
| `expo-hcard__body` 충돌 없음 (home-listings에 미존재) | ✅ |
| `expo-hcard__side` 충돌 없음 (home-listings에 미존재) | ✅ |
| 과외쌤 trust-rail: 기존 absolute 규칙 삭제 → base(static)으로 복귀 | ✅ |
| hover 그림자: overflow:hidden은 box-shadow 클리핑 안 함 | ✅ |
| expo-hcard__badge: media-wrap 내부, media-wrap의 position:relative로 처리 | ✅ |

**발견·수정**: `home-listings.css .expo-basic.expo-hcard { padding: 0.55rem 0.65rem }` (특이도 0,2,0)이 `.expo-hcard { padding: 0 }` (0,1,0)을 덮어쓰는 버그 → 카드 셀렉터에 `.expo-basic.expo-hcard` 병기로 수정.

---

## 2차 정밀검수 — 빌드·산출물

| 체크 항목 | 결과 |
|-----------|------|
| 빌드 성공 (`npm run build:dothome`) | ✅ exit 0 |
| ShopPage 게이트 (`npm run verify:shop-page`) | ✅ 71/71 |
| `index-C_JFMQEX.css` (home-ui) 에 `.expo-basic.expo-hcard{...padding:0}` 포함 | ✅ |
| `index-viXd6Wfr.css` (search-ui) 에 `aspect-ratio:4 / 3; grid-row:2; grid-row:3` 포함 | ✅ |
| `≥601px` 에 해당 규칙 없음 (media query 외부 무변경) | ✅ |

---

## 승인 기록

| 단계 | 날짜/시각 | 내용 |
|------|-----------|------|
| 지시 접수 | 2026-11-07 15:32 | "구현하고 난뒤 두번의 정밀검수를 실시하라" |
| 구현 완료 | 2026-11-07 15:41 | CSS 수정, 1·2차 검수 완료, PR #103 머지·배포 |
| 사용자 피드백 | 2026-11-07 18:32 | "베이직카드가 픽·프라임처럼 커져서 안돼. 가로형으로 두는게 맞아." |
| **롤백 결정** | 2026-11-07 18:34 | Part D 전면 롤백 — Basic 카드는 모바일에서도 가로형 유지 |

## 롤백 사유

Basic 카드(`expo-hcard`)를 세로형으로 전환하면 **Prime·Pick 카드와 크기 위계가 무너짐**.
- Prime/Pick: 대형 세로형 카드 (의도된 큰 노출)
- Basic: 소형 가로형 카드 (compact list 형태 유지 필요)
모바일에서도 카드 타입별 크기 위계는 반드시 보존해야 함.

`search-visily.css ≤600px` 블록을 Part D 이전 상태로 완전 복원.
