# 317 — 홈 팝업 깔개 투명 (no dimming)

- **과제:** 317
- **브랜치:** `cursor/317-home-popup-clear-backdrop-20261027`
- **base:** `70736a2b` (316 병합 후 main)
- **RESTORE_BASE:** `70736a2b`

## 지시 원문 (요약)

홈 팝업 뒤 홈 화면이 어둡게 가려지지 않게 — 깔개(backdrop) 투명화.

## 수정 파일

| 파일 | 변경 |
|------|------|
| `preview/home-ui/src/styles/home-popup.css` | `.home-popup__backdrop` background: `rgba(28,25,23,0.46)` → `transparent` |

## 검증

- 빌드: exit 0
- shop-page: 71/71 PASS
- dirty: `.cursor/rules/work-routine.mdc` (오너 로컬, 미커밋)

## 변경 전/후

- **전:** `background: rgba(28, 25, 23, 0.46);` — 반투명 검은 깔개로 홈 화면 어두움
- **후:** `background: transparent;` — 깔개 투명, 홈 화면 선명하게 보임
- `pointer-events: none` 유지 — 클릭 통과(316) 그대로
- 듀얼 오프셋·머리 끌기·뒤장 불투명·닫기 버튼만 — 변화 없음
