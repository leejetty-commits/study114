# 073 · Cursor 통합 — 학생 가입: 메일 새탭 안내 + 공부방 희망지역 주소피커

- 작성일: 2026-09-24 (KST)
- 소견: [070](070-signup-mail-tab-student-hope-region-findings.md)
- 분할 원본(이관): [071](071-student-studyroom-hope-region-address-ticket.md) · [072](072-signup-verify-email-tab-guidance-ticket.md) → **본 문서가 Cursor 정본**
- 정본: 2장 · 14장 · UDX-STD-002 · [035/036](036-signup-detail-same-tab-acceptance.md)(앱 안 `_blank`와 축 분리)
- 상태: **로컬 기능 수락** → [077](077-signup-073-mail-guidance-hope-region-acceptance.md) (push/`build:dothome` **금지** · 커밋 시 스테이징 게이트)
- **069 홈 배포(063+067)와 커밋·스테이지 절대 분리**

---

## 0. 한 줄

학생 신규 가입 점검(070)의 두 축을 **한 작업**으로 고친다.

1. **메일 확인 대기 화면**에 「새 창에서 이어가기 · 이 탭은 닫아도 됨」 안내(필수). 탭 자동 동기화는 제외.  
2. Basic · 희망유형=**공부방 찾기**의 희망지역(행정동·아파트단지) **샘플 제거** → **홍보지역과 동급** 주소 선택. 표기: **~동** / **~아파트·N단지**.

---

## 1. 배경·정책 (요약)

| # | 사실·잠금 |
|---|-----------|
| A | Gmail 등에서 확인 링크 → **새 탭/창**은 정상. 이어가기는 **메일로 열린 쪽**. 첫 탭 `verify-email?send=1`은 잔여(닫아도 됨). |
| B | 유저가 이 동선에 익숙하다고 가정하지 않음 → **안내 카피 필수**(070 §1.1). |
| C | 035는 앱 **안** `window.open(_blank)` 이어하기. 이번은 **메일 클라이언트 새 탭** + 대기화면 카피. |
| D | 공부방 희망지역 샘플 = **버그**. 14장·2장: 행정동 또는 단지에서 멈춤 · 홍보지역과 같은 알고리즘 · 번지·호 미저장. |
| E | 코드 후보: `signup-basic.js` `complexList()` 하드코드 폴백 · `regionList` 빈약. 공용: `address-region-match.js` · 개설/홍보1 피커 · Region API. |

첨부(재현):  
`docs/assets/070-signup-verify-email-tabs.png` · `docs/assets/070-student-hope-complex-samples.png`  
(Cursor 채팅에 사용자가 직접 첨부해도 됨.)

---

## 2. Part A — 메일 새탭 안내 카피 (구 072)

### 2.1 필수 — `verify-email?send=1` 대기 화면
「확인 메일을 보냈습니다…」 **바로 아래**에 눈에 띄는 안내 블록:

- **메일 안의 링크를 누르면 새 창(또는 새 탭)이 열립니다.**
- **가입은 그 새 창에서 이어서 진행하세요.** 이 화면(탭)은 닫아도 됩니다.
- 스팸함 안내와 한 블록에 묶어도 됨. 「메일 다시 보내기」·쿨다운 **유지**.

문장 다듬기 OK · 의도 유지.

### 2.2 권장 — 확인 메일 본문
링크 근처 한 줄: **이 링크를 누르면 브라우저에 새 창이 열릴 수 있습니다. 열린 창에서 가입을 계속하세요.**

### 2.3 선택 — 확인 직후 중간 화면
이미 Basic으로 떨어지면 생략. 「이메일 확인 완료」 화면이 있으면: **이메일 확인이 끝났습니다. 이 창에서 기본정보를 이어서 입력하세요.**

### 2.4 Part A 제외
- BroadcastChannel / 원래 탭 자동 focus·닫기·동기화
- 035 같은 탭 이어하기 회귀 깨기

---

## 3. Part B — 공부방 희망지역 주소피커 (구 071)

희망유형 = **공부방 찾기** 블록만(과외쌤 시 기준은 **회귀만**).

### 3.1 행정동 기준
- 홍보지역 행정동 피커와 **동일 컴포넌트/API**(또는 동급)로 **실데이터** 선택.
- 「샘플 주소 N」·하드코드 대치 소수 목록 **금지**.
- 저장·표시 라벨 = **~동**에서 멈춤.

### 3.2 아파트단지 기준
- 홍보지역 단지 축과 **동일 알고리즘**(검색 → 단지명).
- `complexList()` 하드코드 폴백으로 UI 채우기 **금지**. 소스 비면 **빈 상태+안내**(가짜 샘플 아님).
- 표기: **~아파트 · N단지** 수준. 번지·호 미저장.

### 3.3 구현 지침
- 출발: `preview/auth-ui/src/screens/signup-basic.js` (study_room 희망지역 · `complexList` · `renderRegionSelect` / basis chips).
- 공용 재사용 우선: `preview/shared/address-region-match.js`, 개설·홍보1 주소/지역 피커, Region/단지 API.
- 복제 하드코드 목록 금지.
- 과외쌤 찾기 `activity_city`(시) 블록: 이번 티켓에서 시 매핑 전면 재작업 **금지**(030 축 분리).

### 3.4 Part B 제외
- 정방향 지도 geocode로 땜질
- 학생 희망지역 다중 슬롯 UX 전면 개편(이번은 공부방 찾기 **현재 1축 UI**를 실데이터로)

---

## 4. 공통 게이트 (A+B)

1. **로컬만.** push / `build:dothome` / origin 반영 **금지**.
2. **069 allowlist(홈 9파일)와 stage·커밋 섞지 말 것.**
3. auth/signup 워킹트리에 다른 WIP가 있으면 **본 티켓 hunk만** (`git add -p` 또는 파일 단위). `git add -A` **거부**.
4. 한 작업 보고로 A+B 모두 닫을 것(파일 목록에 Part 표기).

### 예상 터치(확정 아님 · 보고에 실제만)
```
preview/auth-ui/src/screens/signup-basic.js
preview/auth-ui/… verify-email 관련 화면
(메일 템플릿 PHP/뷰 — 본문 카피 시)
preview/shared/address-region-match.js 등 공용 피커(재사용 시)
(+ 최소 CSS)
```

### 절대 제외
```
preview/home-ui/** (069)
preview/shared/naver-map.js · search-map.js · search-find-surface.js (067) — 희망지역과 무관하면
preview/search-ui/src/search-tier-render.js · exposure-render (063)
ProviderUsage · helpers · teaser · tmp · _verify
```

---

## 5. 스모크

**Part A**
1. 가입 → 메일 발송 화면: 새 창 이어가기 안내가 **본문에서 바로 보임**
2. (가능하면) 실메일 본문 한 줄
3. 메일 링크 → 새 탭 Basic 진입 회귀

**Part B**
4. Basic → 공부방 찾기 → 행정동: 대치 **외** 동 검색·선택 · 샘플 N 없음
5. 아파트단지: 실단지 검색·선택 · 소수 샘플 고정 아님
6. 저장 라벨 깊이 ~동 / 단지명
7. 과외쌤 찾기 희망지역(시) 회귀

**보고**
- 파일 목록(Part A/B 구분) · 최종 카피 전문 · 공용 피커 재사용 여부 · 폴백 제거 · push 안 함 · 069 미포함 확인

---

## 6. Cursor 붙여넣기 (통합 정본)

```
[티켓 073 · 학생가입 통합 · 메일새탭안내 + 공부방희망지역 주소피커 · 로컬만]

소견 070. 구 071+072 통합 정본. push/build 금지.
069 홈(063/067) allowlist·커밋과 절대 섞지 말 것. git add -A 거부. 본 티켓 hunk만.

══ Part A · 메일 확인 새탭 안내 (필수) ══
정책: 메일 링크→새 탭은 정상. 이어가기는 새 창. 유저 익숙 가정 금지 → 안내 필수.
탭 자동동기화(BroadcastChannel 등) 이번 제외. 035 앱내 _blank 축과 혼동 금지.

verify-email?send=1 「확인 메일 보냄」바로 아래에 눈에 띄는 안내:
「메일 안의 링크를 누르면 새 창(또는 새 탭)이 열립니다.
가입은 그 새 창에서 이어서 진행하세요. 이 화면(탭)은 닫아도 됩니다.」
스팸함 안내와 묶어도 됨. 메일 다시보내기·쿨다운 유지.
권장: 확인 메일 본문에도 같은 취지 한 줄.
선택: 확인완료 중간화면 있으면 「이 창에서 기본정보를 이어서 입력하세요.」

══ Part B · 공부방 희망지역 = 홍보지역급 주소피커 ══
증상: 희망유형=공부방 찾기 → 행정동·아파트단지 모두 샘플 몇 개만(하드코드/시드).
잠금: 홍보지역과 동급 주소 알고리즘·UI/API. 공용 피커 재사용 우선.
표기: 행정동=~동 · 단지=~아파트·N단지. 도로명 번지·호 저장 금지(2장).
signup-basic.js complexList() 하드코드 폴백으로 UI 채우기 금지 → 비면 빈상태+안내.
「샘플 주소 N」문구 금지.
과외쌤 찾기(시 기준)는 회귀만. 030 시매핑 전면 재작업 금지.
정방향 geocode 땜질 금지.

출발 후보:
preview/auth-ui/src/screens/signup-basic.js
verify-email 화면 · (메일템플릿)
preview/shared/address-region-match.js · 개설/홍보1 피커 · Region/단지 API

첨부: 070 스크린샷(대기탭·희망지역 샘플). Cursor에 사용자가 직접 첨부 가능.

스모크:
A) 대기화면 안내 보임 · (가능시)메일본문 · 링크→Basic
B) 타동·타단지 실선택 · 샘플없음 · 라벨깊이 · 과외시 회귀
보고: 파일(A/B) · 카피전문 · 공용재사용여부 · 폴백제거 · 069미포함 · push안함
```
