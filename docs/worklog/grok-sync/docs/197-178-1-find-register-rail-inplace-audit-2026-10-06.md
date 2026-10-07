# 178-1 찾기·등록 인페이지 레일 — 점검지시문 (읽기 전용)

일자: 2026-10-06  
대상 PC: `D:\work\study114` (origin/main, HEAD는 `git rev-parse HEAD`로 보고)  
금지: 수정 · 커밋 · 푸시 · `build:dothome` · 배포 · 노션 기록

## 잠긴 정책 (docs/178-planner-decisions-locked-2026-09-27 §1 · B)

찾기·등록에서 우측 레일 클릭 시, **가능하면 그 화면에 남기거나 인페이지**(팝업·오버레이).  
앱 분리(home-ui ↔ 찾기·등록)는 유지하되, **메인으로 튀는 이탈을 줄인다.**

형제(이미 끝): 178-5 → 티켓 195(이용안내 찜·쪽지 인페이지 팝업).  
이번 범위는 **찾기(`search_right_rail`)·등록(`register_right_rail`) 레일**만.

## 우동공과2 사전 대조 (GitHub `main`, 2026-10-06 — 박스 로컬은 origin보다 뒤처짐, 신뢰하지 말 것)

| 경로 | 관찰 |
| :--- | :--- |
| `preview/search-ui/src/layout.js` | `renderRightRailSidebar('search_right_rail', { linkMode:'absolute', homeBase: HOME_UI_BASE })` |
| `preview/tutor-ui`·`study-room-ui` `layout.js` | `renderRegisterRightRail({… homeBase })` → 내부 `linkMode:'absolute'` 강제 |
| `preview/home-ui/src/right-rail.js` | `absolute`면 일반 링크 = `homeBase/#path` + `data-util-href` → **같은 탭으로 home-ui 이탈** |
| 동 파일 | 찾기·등록·상세의 **고민방 경로**는 `target=_blank` 새 탭(같은 탭 가로채기 회피) |
| 동 파일 | 가이드 일부(`peek`: compare/safe/registration) = **인페이지 오버레이** + 「자세히」만 새 탭 |
| 동 파일 | 고민방 방/베스트 제목 버튼 = 레일 읽기 팝업(인페이지). `leave=blank`면 팝업 안 게시판 이동은 새 탭 |
| 정보글 배너 | `leaveInNewTab` when absolute |

사전 결론(교차 전): **정책 대비 부분 적용.** 인페이지(가이드 peek·고민/정보 팝업)는 있으나, 일반 CTA·absolute `data-util-href`는 여전히 메인 이탈. 178-1 미완.

## Cursor에 요청하는 점검 (읽기 전용)

1. `git rev-parse HEAD` · `git status -sb` · `origin/main`과 동일 여부.
2. 슬롯별 호출처 표: `search_right_rail` / `register_right_rail` / (참고) `detail_right_rail` — 파일·함수·`linkMode`·`homeBase`.
3. `right-rail.js`에서 클릭 결과 분류표(항목마다 하나):
   - **A** 인페이지(오버레이·팝업, 앱 유지)
   - **B** 같은 탭 → home-ui(메인 이탈)
   - **C** 새 탭 → home-ui
   - **D** 찾기·등록 앱 내부 해시만
   - **E** 기타(명시)
4. 대상 항목: 고민방 방 제목·더보기·HOT 카드·HOT CTA · 베스트 줄 · 시즌/가이드 액션 카드 · 「이용안내에서 자세히」 · 정보글 배너·팝업 내 이동 · 영상 열기(있으면).
5. 2026-09-27 잠금 이후 **178-1을 의도한 커밋/주석**이 있는지(`git log -S linkMode -- preview/home-ui/src/right-rail.js` 등). 있으면 SHA·한 줄.
6. 정책 B 대비: **MATCH / PARTIAL / ERROR(여전히 불필요 이탈 많음)** 중 하나 + 근거 3줄.
7. 수정 티켓이 필요하면 **파일 allowlist 후보만**(구현 금지). 불필요하면 「이미 충족」+증거.

## 보고 형식

```
HEAD:
status:
슬롯 호출표:
클릭 분류표:
9/27 이후 관련 커밋:
정책대비: MATCH|PARTIAL|ERROR
allowlist 후보(또는 불필요):
못 본 것:
```

## 금지·주의

- 새 정책 제안 금지. 잠금 B와 코드 차이만.
- 지도·현재위치·홍보2·3·사이트오류-5 범위 금지.
- 178-6(상세 레일 구성)·7(등록중=게스트)·8(게스트 찾기)은 **언급만**, 이번 점검 범위 밖.


## [2026-10-06] Cursor 교차 = 자체점검과 동일 · PARTIAL
- HEAD 45a14e1. 찾기 absolute·등록 renderRegisterRightRail absolute 유지.
- A: 방/더보기/베스트/가이드peek/정보제목. C: HOT·HOT CTA·게시판보기·이용안내자세히.
- 의도 커밋 23ffecd(peek+고민 새탭), d20a549(팝업). 호출부 absolute 해소 없음.
- 「진행」→ 슬롯별 남기기/팝업/새탭 확정 후 수정 지시문.


## [2026-10-06] 178-1 슬롯 잠금
- 종현 t1416: 찾기·등록에서 남은 C(HOT·게시판보기·이용안내자세히) → 인페이지. docs/198.
- 다음: 사이트오류-32 지시문 → Cursor.
