# 290-2 찾기 화면 공부방·과외쌤 카드 → 확대카드 공통 로직 연결

- 과제: 290-2
- 브랜치: cursor/290-2-provider-item-wire-20261024
- 작성: 2026-10-24

## 원인

`1ac704f` 이후 `bindDetailDecisionEvents`가 공부방·과외쌤 카드 클릭 시
항상 `resolveDetailItem(kind, id)`만 호출했다.
이 함수는 home-ui 전역 `previewState.studyRoomFind / tutorFind` 슬롯을 본다.
search-ui 찾기 화면의 검색 결과는 search-ui 자체 `previewState.activeResultItems /
searchExposureItems`에 담기며, 두 풀 사이에는 연결이 없었다.
결과: 검색 목록의 최신 2–3건(home-ui 슬롯에 미러된 항목) 외 카드 클릭 시
`item = null`이 되어 확대카드가 열리지 않았다.

학생 카드는 이미 `getStudentItem` 콜백 주입 방식으로 해결돼 있었다.

## 변경 줄

### `preview/home-ui/src/detail-decision/index.js` (+2 / -2)

- **88줄** JSDoc에 `getProviderItem?: (kind, id) => object|undefined` 추가,
  파라미터 분해에 `getProviderItem` 추가
- **121줄**, **133줄**: `resolveDetailItem(kind, id)` 앞에
  `getProviderItem?.(kind, id) ||` 삽입

### `preview/search-ui/src/screens/search-page.js` (+16 / -0)

- **285–296줄** `findSearchProviderItem(kind, id)` 함수 추가
  - `getCurrentTab()` 으로 현재 탭 확인
  - tab='room'이면 `kind === 'study_room'`일 때만, tab='tutor'이면 `kind === 'tutor'`일 때만 탐색 → 다른 종류면 `null` 반환
  - `previewState.activeResultItems` → `searchExposureItems` 순서로 `Number(x.id) === Number(id)` 비교
- **311줄**, **430줄**: `bindDetailDecisionEvents` 두 호출에
  `getProviderItem: findSearchProviderItem` 주입

## 확인 결과

| 체크 | 결과 |
|---|---|
| `node --check` (두 파일) | ✅ 통과 |
| `verify:shop-page` | ✅ 통과 |
| `verify:detail-card-all-fields` | 117 passed, 25 failed — main 기준과 동일 (과외쌤 원생수·성별 기존 미충족, 290-2와 무관) |

## 배포 전 할 일

없음. 서버·DB 수정 없음.
