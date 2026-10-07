# 070 · 점검 소견 — 메일 확인 새 창 · 학생 희망지역 샘플

- 작성일: 2026-09-24 (KST)
- 출처: 사용자 운영 점검(학생 신규 가입) · 첨부 `assets/070-*.png`
- 정본: [2장](https://app.notion.com/p/89c3638d40054134b0d7dd30fea7f562) · [14장](https://app.notion.com/p/58b3afc52add4409a6568d573702f366) · [029](029-signup-ops-findings-notion-vs-bugs.md) · [035/036](036-signup-detail-same-tab-acceptance.md)
- 상태: **소견 잠금** · Cursor 통합 정본 → [073](073-signup-student-mail-guidance-hope-region-unified-ticket.md) (구 071+072)
- **069 배포와 분리** (auth dirty · 홈 063/067과 섞지 말 것)

---

## 1. 메일 확인 후 우동공과 창이 두 개 — 답

**두 번째(메일 링크로 열린) 창·탭에서 이어가는 것이 맞다.**

| 구분 | 설명 |
|------|------|
| 원인 | Gmail 등 메일 앱에서 확인 링크를 누르면 **브라우저가 새 탭/새 창을 연다**. 앱이 원래 가입 탭으로 강제 네비게이션할 수 없다. |
| 올바른 진행 | 링크를 눌러 **새로 뜬** `study114.net/auth/…` 쪽에서 학생 Basic 등으로 계속. 세션·확인 결과가 그쪽에 잡힌다. |
| 첫 번째 창 | `…/signup/verify-email?send=1`(확인 메일 보냄)에 **남을 수 있음**. 잔여 대기 화면이며, 거기서 다시 진행할 필요 없다(닫아도 됨). |
| 035와의 관계 | 035는 앱 **안** `window.open(_blank)`「상세 이어하기」를 같은 탭으로 고친 것. **메일 클라이언트가 연 새 탭**과는 다른 축. |

### 1.1 UX · 안내 (정책 잠금 — 2026-09-24)

유저가 이 동선에 **모두 익숙하다고 보지 않는다.** 메일 링크 → 새 탭은 기술적으로 정상이지만, **안내 카피가 없으면** 창이 두 개일 때 어느 쪽에서 할지 헤맨다.

| 잠금 | 내용 |
|------|------|
| 필수 | `verify-email?send=1` 대기 화면에 **새 창에서 이어가기 · 이 탭은 닫아도 됨** 명시 ([073](073-signup-student-mail-guidance-hope-region-unified-ticket.md) Part A) |
| 권장 | 확인 메일 본문에도 동일 취지 한 줄 |
| 후순위 | 원래 탭 자동 동기화(BroadcastChannel 등) — **지금 필수 아님** |


### 1.2 재질문 (2026-09-24) — 「같은 창에서 이어갈 수 없나」

- **메일 앱이 링크를 새 탭으로 여는 것**을 우리 사이트가 막을 수는 거의 없음(Gmail 등 동작).
- **새로 열린 탭에서 가입을 이어가는 것**은 이미 정상 설계 · 안내 카피 배포됨.
- **원래 대기 탭이 확인 완료를 감지해 기본정보로 넘어가게** 하는 것(BroadcastChannel / storage)은 **기술적으로 중간 난이도·구현 가능**. 073에서는 후순위로 뺐음. 이탈감 완화용이면 **선택 작업**으로 열 수 있음.

첨부: ![verify tabs](assets/070-signup-verify-email-tabs.png)

---


### 1.3 정책 잠금 (2026-09-24) — 「기존 탭 자동 잠금」

사용자: 메일앱이 새 탭을 열면 **기존 대기 탭을 잠그고**, 확인 후 **그 탭에서** 기본정보로 이어가기.  
구현: [088](088-signup-verify-wait-tab-lock-continue-ticket.md). 브라우저 탭 OS 잠금·새 탭 차단은 불가. 대기 UI 잠금 + 탭 간 신호.

## 2. 학생 · 공부방 찾기 · 희망지역 샘플 — 판정

**버그.** 희망유형=`공부방 찾기`일 때 행정동·아파트단지 모두 **하드코드/시드 샘플 몇 개**만 보인다.  
14장·2장: 공부방 희망지역 = **행정동 또는 아파트단지**에서 멈추고, **홍보지역과 같은 주소 선택 알고리즘**이어야 한다.

| 모드 | 사용자 잠금(이번) | 현상 |
|------|-------------------|------|
| 행정동 기준 | **~동**까지 표기·선택 | 샘플 주소 N(대치동) / 소수의 동 목록 |
| 아파트단지 기준 | **~아파트 · N단지**까지 | 대치삼성·동부센트레빌·대치현대 등 소수 샘플 |

코드 축(기확인, `ljh_work` dirty 포함): `preview/auth-ui/src/screens/signup-basic.js` — `complexList()`가 API `signupState.complexes` 비면 **2건 하드코드 폴백**; `regionList()`도 regions 비면 빈약/폴백 가능. 홍보지역 UI(`address-region-match` / 개설·홍보1 검색 UX)와 **미연결**.

첨부: ![complex samples](assets/070-student-hope-complex-samples.png)

---

## 3. 다음

- Cursor: **[073 통합 상세지시](073-signup-student-mail-guidance-hope-region-unified-ticket.md)** (메일안내 Part A + 희망지역 Part B).
- 탭 자동동기화는 후순위. 069 홈 배포와 분리.
