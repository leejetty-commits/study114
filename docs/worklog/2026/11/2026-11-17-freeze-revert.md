# 2026-11-17 freeze revert (#234→#228)

## 지시
로그인 상태 앱 간 이동 시 탭 멈춤. `#234→#228` 순서로 `git revert -m 1`, 매번 빌드 후 공부방 홈→공부방찾기 확인. 풀리면 즉시 중지·PR. 머지는 검수 후.

## 재현·측정
- 로컬 `serve-preview.cjs` (`127.0.0.1:8099`, `public/` + API→study114.net)
- 계정: 테스트rm1 (공부방)
- 판정: `bootStudyRoomHome` cache-hit + `viewsAfterList` 경로에 임시 카운터 `__bootCacheHit` (PR 코드에는 없음)
- 스냅샷 `study114.snap.v1`의 `roomHomeList`가 TTL(3분) 안일 때만 루프 재현

## 결과

| 단계 | 머지 | revert 커밋 | `__bootCacheHit` | 판정 |
|------|------|-------------|------------------|------|
| #234 | `7b72293f` | `19b7a430` | 203 (abort) | 여전함 |
| #233 | `87962b39` | `f1242b39` | 203 | 여전함 |
| #232 | `3693e6fc` | `e3af6dca` | 203 | 여전함 |
| #231 | `3237f574` | `3bb8d42b` | 203 | 여전함 |
| #230 | `9b4b5d52` | `815b7ff2` | 203 | 여전함 |
| #229 | `46c1fed9` | `738fc840` | (단독 실측 생략·지도 geocode만) | — |
| #228 | `23d907c1` | `7dfe7c66` | 0 | **풀림** |

## 원인
`#228`의 `roomListByKey` cache-hit + `viewsAfterList:true`가 `ensureLifetimeViews().then(rerender)`를 매번 새로 만들어 `afterSearchPageMount`→boot 무한 microtask 루프.

## 확인 캡처
- `docs/worklog/2026/11/shots-freeze-revert/after-228-search-room.png` — #228 revert 후 홈→공부방찾기, 로그인 유지·화면 정상

## 브랜치
`revert/freeze-2026-11-17` — `#234`~`#228` revert 7개. tip `7dfe7c66`.
