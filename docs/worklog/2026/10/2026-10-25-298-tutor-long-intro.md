# 298 과외쌤 카드 소개를 intro_long 으로

**과제 ID:** 298  
**브랜치:** `cursor/298-tutor-long-intro-20261025`  
**기준:** `origin/main` `a1d621ee`  
**작업일:** 2026-10-25

## 지시서 요지

과외쌤 소개 칸이 공부방과 같이 `intro_long`을 쓴다. 프라임 카드는 한 줄 말줄임, 확대카드는 전문, 픽 카드는 소개 없음(`showIntro: false` 유지). `intro_short` 응답과 컬럼은 남긴다.

홈 카드가 `tutorSearchCardFields`에서 `intro_long`을 버리므로, 사용자 확인으로 이 파일 한 줄을 허용 범위에 넣었다. `exposure-bridge.js`는 그 반환값을 그대로 펼치므로 고치지 않았다.

## 수정

| 파일 | 내용 |
| --- | --- |
| `preview/home-ui/src/exposure-render.js` 561·580 | 소개 값을 `item.intro_long`으로. 빈 값은 `labeled`가 「—」로 둔다 |
| `preview/home-ui/src/detail-decision/tutor-detail.js` 60 | 확대카드 소개 = `intro_long` 전문 |
| `src/Search/SearchService.php` 964·1053 | SELECT·응답에 `intro_long`. `intro_short` 유지. 컬럼은 `008_tutors.sql`에 있어 columnCache 가드는 쓰지 않음 |
| `preview/search-ui/src/search-exposure-mapper.js` 102 | `intro_long`은 그 칸만. summary·`intro_short`로 대체하지 않음 |
| `preview/home-ui/src/home-basic-live.js` 112 | `tutorSearchCardFields`에 `intro_long` 추가. 공부방 56줄은 그대로 |
| `docs/ssot/11-main-exposure-and-compare.md` | 과외쌤 소개 = `intro_long` |
| `docs/internal/73-tutor-basic-card-lock.md` 180·322·533 | 프라임 소개 = `intro_short` 서술을 이번 결정으로 갱신 |

## 과외쌤 항목을 만드는 곳

| 위치 | 처리 |
| --- | --- |
| `exposure-render.js` | 소개 = `intro_long` |
| `tutor-detail.js` | 소개 = `intro_long` |
| `SearchService.php` searchTutors | `intro_long` 응답 추가 |
| `search-exposure-mapper.js` 과외쌤 | `intro_long` 명시 |
| `home-basic-live.js` `tutorSearchCardFields` | `intro_long` 전달 |
| `exposure-bridge.js` `mapTutorItem` | 목록을 펼치므로 수정 없음 |
| `myshop/public-model.js` | 공부방만. 확인만 |
| `tutor-reg/format.js` `tutorToExposureRow` | 아직 `intro_short`만. 허용 파일 밖이라 두지 않음 |

## 확인

- `php -l src/Search/SearchService.php`: No syntax errors detected.
- Node·Playwright·화면 스크린샷은 지시서대로 이 PC에서 하지 않았다. 어시스턴트 확인 대상이다.
- 픽 `showIntro: false`와 주교재(294)는 바꾸지 않았다. 561줄을 `intro_long`으로 맞춰도 픽 화면에는 소개 줄이 없다.

## 승인

| 커밋 | 승인자 | 일시 |
| --- | --- | --- |
| (이번 커밋들) | 승인 대기 | |
