# 316 — 홈 팝업 듀얼 UX (아래 조작 · 머리 끌기 · 뒤장 불투명 제거)

- **과제:** 316
- **브랜치:** `cursor/316-home-popup-dual-ux-20261027`
- **base:** `d9b9ed27` (315 병합 후 main)
- **RESTORE_BASE:** `d9b9ed27`

## 지시 원문 (요약)

1. 홈 팝업 떠 있어도 카드 밖 홈 클릭·스크롤 가능
2. 이벤트 카드: `.home-popup__hero`(색 머리)를 잡고 끌기
3. 듀얼 뒤 카드 `opacity: 0.92` 제거

## 수정 파일

| 파일 | 변경 |
|------|------|
| `preview/home-ui/src/styles/home-popup.css` | `.home-popup` + `__backdrop` → `pointer-events: none`; `__card` + `__switch` → `pointer-events: auto`; dual 뒤 카드 `opacity: 0.92` 제거 |
| `preview/home-ui/src/home-popup/mount.js` | 이벤트 `__hero`, 공지 `__head`, 광고 `__ad-aside`에 `data-drag-handle` 추가 |

## 검증

- 빌드: exit 0
- shop-page: 71/71 PASS
- dirty: `.cursor/rules/work-routine.mdc` (오너 로컬, 미커밋)

## 동작 요약

- **클릭 통과**: 루트·backdrop `pointer-events: none`, 카드·스위치만 `pointer-events: auto` → 팝업 바깥은 홈으로 통과
- **핸들 위치**: `data-drag-handle`이 `findHandle()`에서 최우선 탐색됨. 이벤트=hero, 공지=head, 광고=ad-aside. `draggable-dialog.js` 85행에서 button/a/input은 드래그 시작 제외 → 닫기 버튼 충돌 없음
- **opacity 제거**: 뒤 카드 불투명. 오프셋 `translate(26px, 20px)` 유지
