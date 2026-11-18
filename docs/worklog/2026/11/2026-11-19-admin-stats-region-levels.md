# 12b 관리자 통계 지역표 3단계

기준: `origin/main` `bd8f9fc8`. 지시서: `origin/docs/reapply-2026-11-17` `docs/handoff/12b-admin-stats-region-levels.md` (`68b64c04`).

## 바뀐 파일

- `src/Admin/AdminStatsRepository.php`
- `preview/home-ui/src/admin/a28-stats.js`
- `docs/worklog/2026/11/2026-11-19-admin-stats-region-levels.md`

`public/api/admin/stats.php`와 `src/Region/*`, CSS는 고치지 않았다. 토글 버튼 클래스는 같은 화면에 있던 `btn btn--secondary btn--sm`이다.

## 규칙 위치

- R0 빈 시·도는 미분류: `AdminStatsRepository.php:305-309`
- R1 시·군·구 미지정: `AdminStatsRepository.php:490-491`
- R2 구가 있는 시 목록: `AdminStatsRepository.php:464-478`
- R3 일반구: `AdminStatsRepository.php:493-494`
- R4 전남광주 광주: `AdminStatsRepository.php:496-503`
- R5 상위 시 행: `AdminStatsRepository.php:505-506`
- R6 나머지: `AdminStatsRepository.php:509`
- 1단계 합은 2단계 합: `AdminStatsRepository.php:533-543`
- 3단계가 있는 2단계 합은 3단계 합: `AdminStatsRepository.php:556-577`
- 전체 합계는 1단계 합 + 미분류: `AdminStatsRepository.php:442-450`
- 2·3단계 정렬, 미지정은 맨 끝: `AdminStatsRepository.php:607-621`
- 화면 제목 「지역」, 접힌 행, 토글: `a28-stats.js:79`, `:88-107`, `:194-203`, `:345-364`

## 검사

| 항목 | 결과 |
|---|---|
| `php -l src/Admin/AdminStatsRepository.php` | 통과. 로컬 PATH에는 php가 없어 Docker `php:8.2-cli`로 실행했다. |
| sqlite 073 284행 + 078 `12200` 광주, 가짜 카드 | 통과. 수원시 장안구는 경기도 › 수원시 › 장안구. 과외쌤 수원시는 구 미지정. 서울·세종 시·도 행은 시·군·구 미지정. 광주 `12200`은 구 미지정, `12330`은 광산구. 경기도 광주시는 3단계가 없고 전남광주와 섞이지 않는다. 광주광역시는 별도 1단계다. 1단계·2단계·전체 합계 등식이 맞았다. |
| 화면 토글 | 로컬 DOM에서 처음에는 접히고, 1단계를 열면 2단계만 보이며, 1단계를 닫으면 3단계까지 숨고 자식 버튼이 ▸로 돌아갔다. 최고관리자 로그인 클릭은 하지 않았다. |
| `npm run build:dothome` | 통과. 추적된 빌드 산출물은 바뀌지 않았고, 새로 생긴 산출물은 커밋하지 않았다. 묶음에 `data-stats-region-toggle`이 들어 있다. |

배포 뒤 종현 확인: 12b-region-check.sql (1)~(4) 결과와 화면 대조.
