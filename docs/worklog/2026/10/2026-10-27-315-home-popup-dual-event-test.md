# 315 — 홈 팝업 동시 2장 이벤트 테스트

| 항목 | 내용 |
|------|------|
| 과제 | 315 |
| 브랜치 | `cursor/315-home-popup-dual-event-test-20261027` |
| 베이스 | `5a28747a` (main) |
| 일자 | 2026-10-27 |
| 작업자 | Cursor 메인 에이전트 |
| 위험도 | 중 (엔진·게이트·마운트 3파일 동시 수정 + SQL 시드) |

## 지시서 원문 요약

1. engine: `pickHomePopups` — 후보 배열(최대 limit, 기본 2) 반환
2. gate: `closedViews` 배열, `resolveHomePopups()` 반환 0-2개, `resolveHomePopup()` 래퍼 유지
3. mount: `resolveHomePopups()` 사용, backdrop click / Esc 닫기 제거, 버튼만 닫기, 카드별 개별 닫기
4. CSS: `.home-popup--dual` 클래스 — grid 겹침 + transform 오프셋(26px, 20px) + opacity 0.92
5. SQL seed: event 2건 (sortOrder 10/20, 14일 간 유효)

## 수정 파일

| 파일 | 변경 |
|------|------|
| `preview/home-ui/src/home-popup/engine.js` | `pickHomePopups()` 추가 (배열 반환, limit 옵션) |
| `preview/home-ui/src/home-popup/gate.js` | `closedView→closedViews`, `resolveHomePopups()` 신규, `resolveHomePopup()` 래퍼화 |
| `preview/home-ui/src/home-popup/mount.js` | 전면 재작성: 다중 카드 mount, backdrop/Esc 닫기 제거, 카드별 closeCard, aria id 인덱스화 |
| `preview/home-ui/src/styles/home-popup.css` | `.home-popup--dual` grid 겹침 룰 추가 |
| `sql/seeds/315_home_popup_dual_event_test.sql` | 이벤트 A/B 2건 INSERT + 롤백 DELETE |

## 변경하지 않은 파일 (확인)

- `rail-popup.js` — 금지 항목, 미접촉
- `content.js` — 읽기 전용
- `tokens.css` — 금지 항목, 미접촉

## 하위 호환

- `resolveHomePopup()` 유지 → `site-ops-chrome.js`의 `shouldSuppressOpsPopup()` 정상
- `pickHomePopup()` 유지 → 기존 호출자 영향 없음
- `markHomePopupClosed()` 시그니처 동일

## 빌드

- `npm run build:dothome` — exit 0 (기존 경고만, 새 에러 없음)
- `npm run verify:shop-page` — 71/71 PASS

## 배포 전 사용자 할 일

- **운영 DB:** `sql/seeds/315_home_popup_dual_event_test.sql` 실행 (phpMyAdmin)
- 테스트 완료 후 시드 데이터 롤백 (파일 하단 DELETE 문)

## 검수 요청

- 셀프 승인 불가. 사용자 승인 대기.
