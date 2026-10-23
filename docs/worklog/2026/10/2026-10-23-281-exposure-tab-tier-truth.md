# 281 — 노출 탭·등록점검·경고 띠를 tier-check 기준으로 (프론트만)

- 날짜: 2026-10-23
- 브랜치: `cursor/281-exposure-tab-tier-truth-20261023`
- 기준: origin/main `9defe76a` (지시서 재배치 커밋). 지시서: `docs/worklog/grok-sync/docs/281-cursor-directive-exposure-tab-tier-truth.md`
- 사용자 결정(같은 날): SearchService·StudyRoomHubRepository는 **이번에 고치지 않음**. 찾기 화면 `prime_eligible`은 **282**에서. 허용 목록 중 마이페이지 노출 탭·등록점검 문구·노란 경고 띠(프론트)만.

## 지시서 원문 요지

- 노출 탭·등록점검이 픽·프라임 조건을 `expanded_complete`로 말하던 것을 서버 tier-check(`can_buy`·`missing` 라벨)로 맞춘다.
- 구매 뒤 필수 비면 **경고만**(저장·카드 노출 유지).
- 금지: TierRequirement·tier-check API·결제·DB·목록 밖 파일. merge·force-push·`git add -A`·운영 사이트 금지.

## 한 일

| 커밋 | 내용 |
|---|---|
| `c5687deb` | 281 fix(exposure): tutor/room format·store·tutor screens 노출 탭, preview-data `prime_eligible` |
| `432af82e` | 281 fix(copy): 등록점검 대학 hint |
| `6bd7b6fa` | 281 feat(hub): 이용 중 픽/프라임 + missing 시 허브 노란 띠 + 작업기록·스크린샷 |

Search/`prime_eligible` PHP는 손대지 않음.

## 검수

- 단위: `node tmp/281-unit-tier-matrix.mjs` — PASS (missing 라벨·「외 n」·소스에 옛 문구 없음).
- 스크린샷: `docs/worklog/2026/10/assets/281-before|after/` — **비회원** 노출·마이페이지 접근 시 로그인 유도 (1280·390). 비회원 막이는 전/후 동일(의도).
- **미촬영(보고)**: 과외쌤·공부방 로그인·이용 중 경고 띠·tier-check 화면 비교 — 로컬 `127.0.0.1:8080` API가 꺼져 있어 세션·tier-check·status 캐시를 못 씀. 지시서 「없으면 화면 확인은 건너뛰고 단위 확인만」에 따름. 결제·운영 쓰기 없음.

## 배포 전 사용자 할 일

- 없음(프론트만). main 병합·배포는 승인 후.

## 승인

- (대기) 커밋 hash 단위 승인.

## 10-24 보완 (그록봇 정리)

- `c672e5e8`: 경고 띠 missing 라벨 중복 제거 + 단위 테스트. `tmp/281-unit-tier-matrix` 전 항목 PASS(카드 문구, can_buy 사용, uniqueMissing 중복 제거).
- 10-24 00시대 폴더 정리 중 워크트리가 지워졌다가 백업 브랜치 `backup/local-wt-281-exposure-tab-tier-truth-20261024`에서 복구됨. 코드는 백업과 동일함을 확인.
- 로그인 계정 스크린샷 24장(`281-before|after/281-*`): 공부방·과외쌤 × 경고띠/노출-빈/노출-픽만 × 1280/390 × 전/후.
  - 전 화면은 `9defe76a`(281 첫 커밋의 부모)를 임시 워크트리로 띄워 촬영, 후 화면은 HEAD로 촬영. 복사 없음.
  - 경고 띠는 새 테스트 계정 tutor_warn2(id 27)·room_warn2(id 23)로 조건을 맞춰 촬영. 후 화면에만 띠가 보임(정상).
  - 공부방 노출-빈-1280, 노출-픽만-390은 281이 바꾸지 않은 등록점검 화면이라 전후 그림이 같음(정상).
  - 기존 비회원 before `guest-*` 6장은 로그인 계정 장면으로 교체하며 삭제. after의 guest-* 6장은 비회원 막 증거로 유지.
- 종현 확인 후 main 병합(2026-10-24).