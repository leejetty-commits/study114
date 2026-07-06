# 24장 — 상세 판단 레이어 (Detail Decision Layer)

**상태: UX 1차 잠금 · 실행 SSOT 1차 잠금** (Notion · Cursor · **2026-07-06 B안 · §20-1~2**)  
**작성:** 2026-07-06  
**역할:** 검색·카드·비교·찜에서 진입한 **Viewer**가 공부방·과외쌤·학생(요청)을 **한 화면에서 판단**하고 **다음 행동(CTA)** 으로 이어지게 하는 **소비자-facing 상세 UX**  
**연동:** [11장](11-main-exposure-and-compare.md) · [13장](13-search-page-fields.md) · [16장](16-messages-structure-proposal.md) · [17장](17-customer-center-and-safe-guide.md) · [18장](18-paid-services-rough.md) · [19장](19-student-registration-management.md) · [20장](20-study-room-registration-management.md) · [21장](21-tutor-registration-management.md) · [22장](22-platform-lifecycle-principles.md)  
**프리뷰:** `preview/home-ui/` · `preview/search-ui/` · [DOC-CHECKLIST](../../preview/home-ui/DOC-CHECKLIST.md) P24  
**코드 정본:** `preview/home-ui/src/detail-decision/` · legacy `student-detail-modal.js` → **이관 후 폐기** (§20-2 #5)

> **장 번호 (B안):** 상세 UX 제안은 **22장 본문이 아님**. [22장](22-platform-lifecycle-principles.md) = lifecycle·정책 **횡단 원칙** · **24장** = 상세 모달·판단 레이어.  
> Notion 「22장-상세 모달·상세페이지 구조 개요」 검토 내용은 **본 문서(24장)로 승격**한다.

> **범위 재정의:** 24장은 11·13·16·18·20·21장의 필드·권한·enum을 **재정의하지 않는다.**  
> **기존 SSOT의 소비자 화면 번역** — UI 배치 · CTA · copy · 잠금 해제 표현만 잠근다.

---

## 0. 핵심 문장 (잠금)

24장은 공부방·과외쌤·학생을 단순 정보 열람 화면이 아니라, **Viewer**가 **조건 적합성 · 신뢰정보 · 접촉 가능성 · 다음 행동**을 한 화면에서 판단하는 **상세 판단 레이어**로 정의한다.

1. **1차 MVP**의 상세 SSOT는 **상세 모달**이며, 별도 URL 상세페이지는 **장기 확장**으로 둔다.
2. 필드·권한·enum은 11·13·16·18·20·21장을 재정의하지 않고, 24장은 **UI 배치 · CTA · copy · 잠금 해제 표현**만 잠근다.
3. 상세는 많이 보여주는 화면이 아니라, **결정에 필요한 것을 먼저** 보여주는 화면이다.

**내부 기획명:** Detail Decision Layer · Detail Decision OS  
**사용자-facing:** **상세 판단 레이어** · 학생만 **학습 요청 카드**

---

## 1. 이 장의 역할과 범위

### 1-1. 21장과의 대칭

| 구분 | 21장 (공급자 운영) | 24장 (소비자 판단) |
|------|-------------------|-------------------|
| 주체 | 과외쌤 · 원장 · (학부모 등록) | **Viewer** (학부모 · 과외 · Guest) |
| 질문 | 「내가 어떻게 운영·노출·접근하나」 | 「**이 대상이 나와 맞고, 지금 무엇을 할 수 있나**」 |
| 핵심 패널 | P21-05 학생 접근·쪽지 **조종판** | **Contact Eligibility Panel** (상대 시점) |
| 미리보기 | P21-04 **4모드** (본인 시점) | **공개 상세** (Viewer 시점 · §16) |

### 1-2. 24장이 **하지 않는 것**

| ✕ | 원본 SSOT |
|---|-----------|
| 접촉 권한·방향 재정의 | [16장 §8](16-messages-structure-proposal.md) |
| free/paid · 기간형·횟수권 · SKU | [18장](18-paid-services-rough.md) |
| `profile_status` · `inquiry_status` · `exposure_status` enum | [5·8·20·21장](20-study-room-registration-management.md) |
| 검색·비교 **필드 목록** | [11·13장](13-search-page-fields.md) |
| 학생 공개 범위·`paid_only` visibility | [13§8 · 19장](19-student-registration-management.md) |
| lifecycle 심사·용어 | [22장](22-platform-lifecycle-principles.md) |
| 운영자 심사·승인 UI | **1차 제외** (§14) |
| 상세 안 **쪽지/메모 작성 폼** | [P16-03 · P16-04](16-messages-structure-proposal.md) — CTA만 |

### 1-3. 24장이 **하는 것**

| ○ | 내용 |
|---|------|
| **Modal First** 상세 정보 구조 | §2 |
| **Viewer × Target** 판단·CTA | §4 |
| **3초 판단바** · Trust Strip · Fit Card · Contact Panel | §5 |
| 타입별 상세 (공부방 / 과외 / 학습 요청 카드) | §6~§9 |
| CTA 활성/비활성 · Unlock 표현 | §10~§12 |
| Compare-Aware · Decision Handoff | §13 |
| 20·21 운영 결과의 **소비자 표현** | §15 |
| MVP · 구현 순서 · URL/state · `detail-decision/` | §19~§20 · 부록 B/C |

---

## 2. 1차 기준: Modal First, Page Later

| 항목 | 1차 MVP | 장기 |
|------|---------|------|
| SSOT | **상세 모달** (overlay · full-screen mobile) | 별도 URL 상세페이지 |
| 진입 | 검색 · 메인 · 비교 · 찜 · Prime/Pick 카드 | SEO · 공유 링크 |
| 정보 구조·CTA | **모달 기준으로 먼저 잠금** | URL 상세도 **동일 블록 순서** 상속 |

**이유:** 구현 속도 · 검색/비교 흐름 유지 · 모바일 자연스러움 · 「판단」 UX가 SEO보다 1차 우선.

**1차 state:** 상세 모달은 **client state** 로만 연다 — hash 상세 URL **제공 ✕** (부록 C).

---

## 3. 공통 원칙

### 3-1. 상세 = **판단** 화면 (읽기 ✕)

Viewer가 상세에서 끝내야 할 **4가지 판단:**

| 축 | Viewer 질문 |
|----|-------------|
| **조건 적합성** | 내 지역/과목/학년/방식과 맞나? |
| **신뢰 가능성** | 공개된 정보로 판단할 만한가? (플랫폼 보증 ✕) |
| **접촉 가능성** | 지금 쪽지·메모·상담을 할 수 있나? |
| **다음 행동** | 찜 · 비교 · 쪽지 · 메모 중 무엇? |

**권장 블록 순서 (데스크톱):**

1. 상단 요약 · **3초 판단바**
2. (선택) **Entry Context Ribbon**
3. **핵심 조건**
4. **Match Fit Card** (전제 충족 시)
5. **Trust Strip** · 신뢰정보 카드
6. 상세 설명 · 사진 · (접힌) 지도
7. **Contact Eligibility Panel** · **접촉 가능 배지**
8. **Sticky CTA Bar**
9. Micro Safety Copy · (과외) 첫 수업 체크 · 17장 링크

**모바일:** Sticky CTA · Contact Panel · Fit을 **스크롤 전** 또는 **고정 영역**에 우선 배치 (타입별 §7~§9).

### 3-2. CTA 밀도

| 규칙 | 내용 |
|------|------|
| 주 CTA | **1개** (filled) |
| 보조 CTA | **최대 2개** (outline/ghost) |
| Sticky | 주 CTA 1 + 보조 1~2 |

### 3-3. Unlock, Don’t Block

유료·권한·공개 부족 시 「안 됩니다」만 ✕ → **해제 조건 N단계** + CTA ([21§7-3](21-tutor-registration-management.md#7-3-잠금-해제형-카드) 동형).

### 3-4. 금지 표현 (22장 §7 연동)

검증 완료 · 인증쌤 · 플랫폼 승인 · 심사 통과 · **신뢰도 점수** · Pick **후보**(등급명)

**권장:** 제출자료 공개 · 신뢰정보 N개 공개 · 학력정보 공개 · **플랫폼 보증 아님**

---

## 4. Viewer × Target 매트릭스 `[잠금 · 24장 중심축]`

상세는 **Target 유형**만으로 결정되지 않는다. **Viewer × Target**에 따라 1순위 판단·CTA가 달라진다.

| Viewer → Target | 1순위 판단 | 1순위 CTA | 2순위 | 3순위 |
|-----------------|-----------|-----------|-------|-------|
| **학부모 → 과외쌤** | Fit + **신뢰** | **쪽지** | 찜 | 비교 |
| **학부모 → 공부방** | Fit + **상담 수용** | **상담/쪽지** | 찜 | 비교 |
| **과외쌤 → 학생** | Fit + **접촉 권한** | **메모** | 저장 | 권한 안내 |
| **Guest → 공급자** | 조건 요약 | **로그인 유도** | — | — |
| **본인 → 자기 프로필** | 운영 링크 | **운영센터** (19/20/21) | (optional) Dual Preview | — |

> **16§1-3:** 공부방 = 상담 수용 **저빈도 쪽지** · 과외 = **접촉 가능성 고빈도** — Viewer×Target과 일치.

---

## 5. 공통 Shell 컴포넌트

### 5-1. 3초 판단바 (Above-the-fold)

스크롤 전 **5토큰 이내** 핵심 판단.

**예 (과외 · 학부모 viewer):**

```
강남구 · 중등 수학 · 방문 가능 · 쪽지 가능 · 신뢰정보 3개 공개
```

**예 (공부방):**

```
대치동 · 초등~중등 · 수학 · 신규 상담 가능 · 월 45만원~
```

**예 (학습 요청 카드 · 과외 viewer):**

```
중2 · 수학 · 강남구 · 대면 · 메모 가능
```

### 5-2. Entry Context Ribbon (1차 · 경량)

| 1차 ○ | 1차 △/후순위 |
|-------|-------------|
| 비교 중 **2/3** | 「강남구·수학 필터 결과에서 열림」 |
| 찜 목록에서 열림 | Prime/Pick 슬롯 맥락 |
| 검색 결과에서 열림 | 추천 알고리즘 암시 ✕ |

### 5-3. Match Fit Card

> **Fit Card는 추천 알고리즘이 아니라, Viewer·Target **입력값 교집합** 표시 UI다.**

| Viewer 상태 | Fit Card |
|-------------|----------|
| 학부모 + **선택 자녀** | 「우리 아이와 맞는 점」 / 「확인 필요」 |
| 과외 + **본인 프로필 published** | 「내 수업 조건과 맞는 점」 |
| Guest / 기준 데이터 없음 | **숨김** 또는 「로그인 후 맞춤 확인」 1줄 |

**Negative Fit (권장):** 맞는 점만 ✕ — 「희망 지역(송파)과 활동 시(강남)가 다를 수 있음」 등 **확인 필요** 1~2줄.

### 5-4. Trust Strip

얇은 한 줄 — **공개 선택된** 신뢰정보만 카운트.

| ○ | ✕ |
|---|---|
| 신뢰정보 **3개 공개** · 제출자료 **1개 공개** | 신뢰정보 **8/10 입력** (운영 UI 전용) |
| 「사용자가 공개한 신뢰정보 포함 · **플랫폼 보증 아님**」 | 신뢰도 점수 · 등급 · 순위 |

> **규칙:** 입력됐지만 **비공개**인 항목은 Trust Strip·신뢰 카운트에 **포함하지 않는다.**

### 5-5. Contact Eligibility Panel

「**지금 가능한 행동**」 — 16·18·21장의 **소비자 번역**.

| 표시 | 의미 |
|------|------|
| ✓ | 지금 가능 |
| 🔒 | 조건 미충족 + **Unlock 카드** |

**접촉 가능 배지** (사용자-facing 명칭 · Contact Temperature ✕):

답장 가능 · 쪽지 시작 가능 · 메모 가능 · **접촉 불가**

### 5-6. Sticky CTA Bar (모바일 필수)

스크롤 중 하단 고정 · §4 Viewer×Target **1순위 CTA** 1개 filled.

### 5-7. Thread Prelude (경계)

CTA 직전 **1줄 예시**만 허용 — 실제 작성 UI ✕.

```
예: 「안녕하세요, 중2 수학 상담드립니다…」
```

→ 탭 시 **P16-03** (첫 메모) / **P16-04** (게이트)로 이동.

### 5-8. Micro Safety Copy (17장)

**후보 풀** — 상세/CTA 맥락에 맞는 **1문장만** 노출 (과잉 나열 ✕):

- 「첫 연락은 우동공과 쪽지함에서 시작하세요.」
- 「학생 연락처는 필요한 시점에만 공유하세요.」
- 「공개된 제출자료는 사용자가 직접 등록한 정보입니다.」
- 「우동공과는 과외 성과를 **보증하지 않습니다**.」
- 「학생 정보는 보호자가 공개한 범위 안에서만 표시됩니다.」

> Trust Strip·Micro Safety 모두 **「플랫폼 보증 아님」** 톤 유지 (§11).

---

## 6. P24-xx 화면 목록

| ID | 화면명 | 대상 |
|----|--------|------|
| **P24-01** | 공통 상세 모달 Shell | 3종 공통 뼈대 |
| **P24-02** | 공부방 상세 | study_room |
| **P24-03** | 과외쌤 상세 | tutor |
| **P24-04** | **학습 요청 카드** | student |

> **P22-xx 사용 ✕** — 22장 = lifecycle 원칙.

---

## 7. P24-02 공부방 상세

**정체성:** 동네 **학습공간** 상세 — 「우리 아이가 **다닐 만한가**?」

### 7-1. 20장 연동

| 20장 운영 (공급자) | 24장 상세 (Viewer) |
|-------------------|-------------------|
| `inquiry_status` | **상담 수용 배지** (3초 판단바 **1순위**) |
| `profile_status` published | 상세 노출 · CTA 활성 |
| 노출·Prime/Pick | Trust·조건 표시 (부스트 CTA는 18장) |

**상담 수용 예:** 신규 상담 가능 · 대기 등록 가능 · 정원 마감 · 상담 일시 제한

### 7-2. 블록 우선순위

1. 3초 판단 + **상담 수용 배지**
2. 핵심 조건 (학년 · 과목 · 가격 · 방식)
3. Match Fit (학부모+자녀)
4. Trust Strip · 시설·운영 요약
5. 사진 · 소개
6. **지도 — 접기(Accordion)** — 첫 화면 지도 풀 ✕
7. Contact Panel · Sticky CTA

### 7-3. CTA (학부모 viewer)

| 순위 | CTA |
|------|-----|
| 1 | **상담/쪽지** (inquiry 허용 시) |
| 2 | 찜 |
| 3 | 비교 |

`inquiry_status` = 상담 불가 시: 주 CTA → 「현재 상담 제한」 + 쪽지 보조 또는 비활성 (20장 enum 참조).

---

## 8. P24-03 과외쌤 상세

**정체성:** **조건형 수업자** 상세 — 「조건이 맞고 **지금 접촉 가능한가**?」

### 8-1. 21장 P21-05 미러 `[잠금]`

| 21장 키 (운영자) | 24장 (Viewer) |
|-----------------|---------------|
| `reply` ✓ | 학부모 **쪽지 보내기** 활성 |
| `basic` ✓ | 프로필 Basic 노출 (상세 자체) |
| `student_struct` ✓ | (과외 viewer→학생 시) 구조화 정보 |
| `cold_memo` 🔒 | **먼저 메모** 잠김 → P16-04 Unlock |
| `request_doc` 🔒 | 요청문 **blur** + Unlock |
| `pick` / `prime` 🔒 | Prime/Pick CTA는 상세 **후순위** (18장) |

### 8-2. 블록 우선순위

1. 3초 판단 + **접촉 가능 배지**
2. 대표 과목 · 지역 · 대상 · 가격
3. Match Fit
4. **수업 스타일 칩** ([13장](13-search-page-fields.md) `teaching_style_badges` 참조)
5. Trust Strip · 신뢰정보 카드
6. 소개 · 경력 · 수업 방식
7. Contact Eligibility Panel
8. Sticky CTA · Thread Prelude 1줄
9. 「첫 수업 전 확인」→ [17장](17-customer-center-and-safe-guide.md) G1~G4 링크

### 8-3. CTA (학부모 viewer)

| 순위 | CTA |
|------|-----|
| 1 | **쪽지** |
| 2 | 찜 |
| 3 | 비교 |

### 8-4. Dual Preview Toggle (1차 **필수 범위 제외**)

**본인 프로필** viewer만 · **optional 실험** (MVP 완료 판정 **포함 ✕**):

「학부모에게 보이는 모습 ↔ 운영 정보」 — [P21-04 4모드](21-tutor-registration-management.md#5-3-p21-04-미리보기--자기확인-심사-)와 중복 최소화.

> §14 1차 제외와 모순 ✕ — **기본 상세에는 없음** · 본인 viewer에서만 후순위 검토.

---

## 9. P24-04 학습 요청 카드

**정체성:** 학생 **프로필 ✕** — 보호자가 공개한 범위의 **과외 연결용 조건 카드**.

> 학생 상세는 학생 개인을 소개하는 프로필이 아니라, 보호자가 공개한 범위 안에서 과외 연결에 필요한 조건만 보여주는 **학습 요청 카드**로 정의한다.

### 9-1. 원칙 (19·13·22 연동)

| ✕ | ○ |
|---|---|
| 실명·연락처·학교명 상세·주소 상세 | 학년 · 과목 · **구/동** 지역 |
| 공부방/과외와 **동일 Shell** | **축소 Shell** |
| 「학생 상세페이지」 copy | **학습 요청 카드** |

### 9-2. Viewer별 표시 (13§8 · 16§8)

| 필드 | Guest | free 공급자 | paid 공급자 |
|------|-------|-------------|-------------|
| 구조화 조건 | 제한 | ○ | ○ |
| `request_summary` | 로그인 유도 | visibility 따름 | `paid_only` 시 ○ |
| `special_request` | ✕ | ✕ | `paid_only` visibility + **paid 권한** 시 blur 해제 |

프리뷰(이관 전): `preview/home-ui/src/student-detail-modal.js` — **P24-04 로직만 이관** · 정본 ✕ (§20-2 #5).

### 9-3. CTA (과외 viewer)

| 순위 | CTA |
|------|-----|
| 1 | **메모 보내기** (paid · P16-04) |
| 2 | 저장 |
| 3 | 권한 안내 → P15-09 |

---

## 10. CTA 활성/비활성 규칙

CTA = **AND** 조건. 24장은 조합만 표기 — enum 원본은 타 장.

| CTA | 공통 비활성 조건 (예) |
|-----|----------------------|
| 쪽지 (학부모→공급) | Guest · 대상 `hidden`/`draft` |
| 메모 (공급→학생) | free 공급 · 메모권 0 · 학생 비공개 · P16-04 |
| 상담 (공부방) | `inquiry_status` = 상담 불가 |
| 찜/비교 | Guest → 로그인 유도 ([6장](06-phase1-menu-structure.md)) |
| 요청문 열람 | 필드 `paid_only` visibility **인데** viewer **paid 권한 없음** → blur + Unlock (18§4 · P16-04) |

---

## 11. Trust Strip 표시 규칙

| 항목 | 규칙 |
|------|------|
| 카운트 대상 | **Viewer에게 공개된** 신뢰 항목만 |
| 학력·경력·제출자료 | P15-10 **공개 선택 ON** 만 |
| 후기 | 1차: 「후기 준비중」 또는 미표시 |
| freshness | 「최근 수정 N일 전」 — **운영 신뢰 점수 ✕** · freshness 힌트 △ |
| 필수 Micro copy | 「플랫폼 보증 아님」 1줄 |

---

## 12. Match Fit 표시 규칙

| 규칙 | 내용 |
|------|------|
| 계산 | Viewer·Target **필드 교집합** (지역 · 과목 · 학년 · 장소 · 시간대 등) |
| 알고리즘 | **1차 ✕** — 규칙 기반 UI만 |
| Negative | 「확인 필요」 1~2줄 권장 |
| Guest | Fit Card **숨김** 또는 로그인 CTA |

---

## 13. Compare-Aware · Decision Handoff

### 13-1. Compare-Aware

- 상단/Sticky: **비교담기** · 「현재 **N**/3 비교 중」
- 비교 표 [11장](11-main-exposure-and-compare.md) 필드와 **핵심 조건 블록** 정렬
- `compare-modal.js` · search-ui 상태 연동 `[구현]`

### 13-2. Decision Handoff (모달 닫을 때)

| 구분 | 1차 MVP | 2차 |
|------|---------|-----|
| **비교 담기** | Toast 「**비교에 추가됨**」 (Compare-Aware 최소 피드백) | 「비교 2/3 열기」 등 확장 |
| 찜 · 쪽지 · 메모 handoff | ✕ | Toast · deep link |

> 1차: **비교 토스트만** 포함 (§19). 나머지 handoff는 2차.

---

## 14. 1차 제외 항목

| 항목 | 사유 |
|------|------|
| 별도 URL SEO 상세 | Modal First |
| 후기 풀 · 별점 집계 | 11장 후순위 |
| 지도 풀스크린 첫 화면 | §7-2 |
| 실시간 채팅 | 16장 범위 밖 |
| 운영자/관리자 상세 UX | 22장 lifecycle과 분리 |
| 필터 맥락 Ribbon (상세) | §5-2 후순위 |
| Dual Preview Toggle | §8-4 — **1차 필수 ✕** · 본인 viewer optional만 |
| 상세 내 쪽지 **작성 폼** | P16-03 |

---

## 15. 20·21·24 연결 표

| 운영장 | 공급자가 관리 | 24장 Viewer가 보는 결과 |
|--------|--------------|------------------------|
| [20장](20-study-room-registration-management.md) | 프로필 · 위치 · 가격 · **inquiry_status** · 노출 | 조건 · **상담 수용** · CTA |
| [21장](21-tutor-registration-management.md) | 프로필 · 신뢰 · **학생 접근권** · 메모권 · 노출 | 신뢰 Strip · **접촉 Panel** · CTA |
| [19장](19-student-registration-management.md) | 공개 범위 · 요청 조건 | **학습 요청 카드** · blur · 메모 CTA |

**정책 체인:** [16장](16-messages-structure-proposal.md) 접촉 규칙 → [18장](18-paid-services-rough.md) 유료 → [21장](21-tutor-registration-management.md) 운영 조종판 → **24장** 상세 접촉 가능성

---

## 16. Public Preview Logic (21 ↔ 24)

| Viewer | 과외 상세에서 보는 것 |
|--------|----------------------|
| **Guest** | 제한 Basic · CTA 로그인 |
| **학부모 free** | Basic + **쪽지** CTA |
| **학부모 paid** | **1차:** free와 **동일 — 쪽지만** · placeholder CTA ✕ · **2차:** 18장 유료 모델 확정 후 분기 (24장이 18장보다 먼저 paid CTA 정의 ✕) |
| **과외 본인** | 운영센터 링크 · (optional) P21-04 연동 |
| **관리자** | 1차 **별도 상세 UX ✕** |

P21-04 **4모드** (Basic · Pick · 상세 · 비교행) = 공급자 **자기확인** · P24 = **Viewer 실제 노출** — 필드는 11·13 동일 · **레이아웃·CTA**만 Viewer 기준.

---

## 17. 타입별 정체성 요약

| 유형 | 상세 정체성 | 핵심 질문 | 주 CTA |
|------|-------------|-----------|--------|
| 공부방 | 동네 학습공간 | 다닐 만한가? | 상담/쪽지 |
| 과외쌤 | 조건형 수업자 | 맞고 접촉 가능한가? | 쪽지 |
| 학생 | **학습 요청 카드** | 맞는 학생인가? | 메모 |

---

## 18. 충돌 해결 우선순위 `[잠금 · 2026-07-06]`

| 충돌 유형 | 우선 SSOT |
|-----------|-----------|
| 필드 정의 · DB enum · 접촉 권한 · free/paid | **11 · 13 · 16 · 18 · 20 · 21 · 22** |
| UI 배치 · CTA 순서 · copy · Unlock 표현 · Shell 블록 순서 | **24장** |

> 24장은 **정책 원본 ✕** · **소비자-facing 번역 레이어** ○ (§15 정책 체인).

---

## 19. 1차 MVP (24a)

### 포함 — UX Shell (home-ui 24a ✅)

- [x] **P24-01** 공통 상세 모달 Shell (부록 A 블록 순서)
- [x] **3초 판단바** (§5-1 · 타입별 예시)
- [x] **Entry Context Ribbon** — 비교 N/3 (§5-2 최소)
- [x] **Match Fit Card** 조건부 (§12)
- [x] **Trust Strip** — P24-B06 · `lifecycle-copy.js` (§11)
- [x] **Contact Eligibility Panel** — P24-B05 (§5-5)
- [x] **Sticky CTA Bar** — P24-B07 (§5-6)
- [x] **Micro Safety** — `#/support/safe` 링크 (§5-8)
- [x] **P24-02** 공부방 — `inquiry_status` 배지 (§7-1)
- [x] **P24-03** 과외 — P21-05 미러 Contact Panel (§8-1)
- [x] **P24-04** 학생 — `student-request-card.js` 축소 Shell (§9)
- [x] **Compare-Aware** — toast · Sticky N/3 · 「비교 N/3 열기」(§13-1 · §13-2)
- [x] 상세 모달 안 **쪽지/메모 작성 폼 ✕** — CTA → P16-03/04 (§14)
- [x] **1차 client state only** — hash 상세 URL ✕ (부록 C)

### 포함 — 후순위 · optional (1차 완료 판정 ✕)

- [ ] Entry Context — 필터 맥락 · Prime/Pick 슬롯 Ribbon (§5-2 △)
- [ ] **Dual Preview Toggle** — 본인 viewer only (§8-4)
- [ ] Decision Handoff — 찜/쪽지/메모 Toast (§13-2 **2차**)
- [x] Decision Handoff — 「비교 2/3 열기」toast CTA (§13-2 · 25장 handoff-utils)
- [ ] freshness 「N일 전」 (§11 △)
- [ ] **search-ui** 카드 → P24 Shell smoke (§20-1 optional)
- [ ] 별도 URL SEO 상세 (§14 · 부록 C 2차)

### 19-1. 프리뷰 구현 상태 (2026-07-06 · [30장](30-first-route-map-and-screen-inventory.md) 동기화)

| P24 | home-ui (1차 완료 판정) | 비고 |
|-----|-------------------------|------|
| P24-01 | ✅ | `detail-decision/detail-shell.js` |
| P24-02 | ✅ | `studyroom-detail.js` |
| P24-03 | ✅ | `tutor-detail.js` |
| P24-04 | ✅ | `student-request-card.js` |
| P24-B05~B07 | ✅ | `detail-utils.js` · shell Sticky CTA |
| P24-08 Compare | ✅ | toast · sticky `buildCompareAwareBar` · compare-open |
| search-ui | ✅ | compare bar · 결과행 handoff · P24 상세 2차 |

---

## 20. 구현 우선순위 · 1차 잠금 `[2026-07-06]`

### 20-1. 패키지 · 완료 판정

| 구분 | 규약 |
|------|------|
| **1차 완료 판정** | **`preview/home-ui`** — 메인·학부모·과외 화면에서 P24 모달 |
| Shell 인터페이스 | home-ui **전용 ✕** — **search-ui에서도 호출 가능**한 export |
| **1차 optional** | search-ui 카드 → 동일 Shell **smoke path** (완료 판정 **포함 ✕**) |
| **2차** | search-ui 필터/비교 state와 **완전 연동** |

### 20-2. 코드 순서 · 파일 · 의사결정 (1차 잠금)

**순서:**

1. **P24-01** — `detail-decision/` 디렉터리 · Shell container
2. **P24-04** — `student-request-card.js` (legacy 이관)
3. **P24-03** — `tutor-detail.js`
4. **P24-02** — `studyroom-detail.js`
5. **Compare-Aware** + **「비교에 추가됨」 토스트**
6. **Public Preview Logic** — §16 (학부모 paid = free와 동일 **쪽지**)
7. Dual Preview · handoff 확장 · SEO URL · search-ui full — **2차**

**파일 정본 (`preview/home-ui/src/detail-decision/`):**

| 파일 | P코드 | 역할 |
|------|-------|------|
| `detail-shell.js` | P24-01 | 공통 modal container · Sticky CTA · Ribbon |
| `detail-utils.js` | — | Fit · Trust · Contact · CTA/Fit/Trust 보조 |
| `student-request-card.js` | P24-04 | 학습 요청 카드 · **축소 Shell** |
| `tutor-detail.js` | P24-03 | 과외 상세 variant |
| `studyroom-detail.js` | P24-02 | 공부방 상세 variant |

> 단일 `detail-modal.js` 1차 정본 **✕** — Shell·타입·보조 로직 **분리 필수**.

**1차 잠금 의사결정 (5항):**

| # | 항목 | 결론 |
|---|------|------|
| 1 | P24-01 위치 | **`detail-decision/`** 디렉터리 정본 |
| 2 | home vs search | **home-ui** 완료 판정 · search-ui **optional smoke** |
| 3 | 학부모 paid CTA | 1차 **쪽지 = free** · paid CTA는 **18장 후** |
| 4 | Handoff Toast | **비교 추가됨**만 1차 · 나머지 2차 |
| 5 | student 이관 | P24-01 Shell 위 **P24-04 축소 Shell** · `student-detail-modal.js` **정본 ✕** |

---

## 부록 A — P24-01 Shell 와이어 (공통)

```
┌─ Entry Context Ribbon (optional) ─────────────┐
├─ Header: 이름 · 유형 · 지역 · 대표 태그 ────────┤
├─ 3초 판단바 ──────────────────────────────────┤
├─ 핵심 조건 그리드 ────────────────────────────┤
├─ Match Fit Card (조건부) ─────────────────────┤
├─ Trust Strip ─────────────────────────────────┤
├─ 본문: 소개 · 칩 · 사진 · (접힌 지도) ──────────┤
├─ Contact Eligibility Panel ─────────────────┤
├─ Micro Safety · 17 링크 ──────────────────────┤
└─ Sticky CTA Bar ──────────────────────────────┘
```

---

## 부록 B — 코드 매핑표 (P24-xx) `[1차 잠금 · 2026-07-06 · 30장 동기화]`

**정본 루트:** `preview/home-ui/src/detail-decision/`

| P코드 | type | 대상 | 1차 파일 | SSOT | UI |
|-------|------|------|----------|------|:--:|
| P24-01 | screen | 공통 Shell (모달) | `detail-shell.js` | 부록 A · §5 | ✅ |
| — | — | Fit · CTA 보조 | `detail-utils.js` | §5 · §10~§12 | ✅ |
| P24-02 | block | 공부방 상세 | `studyroom-detail.js` | §7 | ✅ |
| P24-03 | block | 과외 상세 | `tutor-detail.js` | §8 | ✅ |
| P24-04 | block | 학습 요청 카드 | `student-request-card.js` | §9 | ✅ |
| P24-B05 | block | Contact Panel | `detail-utils.js` | §5-5 · 21§7 | ✅ |
| P24-B06 | block | Trust Strip | `detail-utils.js` · `lifecycle-copy.js` | §11 · 22§7 | ✅ |
| P24-B07 | block | Sticky CTA | `detail-shell.js` | §5-6 | ✅ |
| P24-08 | block | Compare-aware | toast · sticky · `compare-modal.js` | §13 | ✅ |
| — | — | 카드→상세 (home-ui) | `exposure-render.js` 등 | §20-1 | ✅ |
| — | — | 카드→상세 (search-ui) | Shell export smoke | §20-1 optional | △ |

**legacy (이관 완료):**

| 파일 | 처리 |
|------|------|
| `student-detail-modal.js` | **정본 ✕** — P24-04 + shell로 이관 |

> 추적: [home-ui/DOC-CHECKLIST.md](../../preview/home-ui/DOC-CHECKLIST.md) P24 · [30장 §9](30-first-route-map-and-screen-inventory.md#9-인벤토리--24장-상세-판단-modal-first)

---

## 부록 C. URL · client state 규약 `[1차 잠금 · 2026-07-06]`

### C-1. 1차 MVP

| 항목 | 규약 |
|------|------|
| 상세 SSOT | **모달 overlay** (모바일 full-screen) |
| URL | **hash 상세 URL 제공 ✕** |
| state | 검색·메인·비교·찜에서 연 모달 = **client state** (닫으면 소멸) |
| 공유·SEO | **2차** — Modal First 유지 후 별도 URL 검토 (§2) |

### C-2. 2차 검토 후보 (미잠금)

| hash 예시 | 용도 |
|-----------|------|
| `#/search?detail=tutor:{id}` | 과외 상세 딥링크 |
| `#/search?detail=studyroom:{id}` | 공부방 상세 |
| `#/students?request={id}` | 학습 요청 카드 |
| `#/compare?detail=tutor:{id}` | 비교 중 상세 |

> 2차 도입 시 **§3-1 블록 순서·§4 CTA** 를 URL 상세에 **동일 상속** (§2).

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-07-06 | 초안 — B안(22 유지 · 24 분리) · Notion·Cursor 합의 · P24-xx · Viewer×Target · 21 미러 |
| 2026-07-06 | **실행 SSOT** — §18 충돌 · §19 MVP · §20 구현순 · 부록 B/C · §10·§5-8·§8-4 보정 · UX 1차 잠금 |
| 2026-07-06 | **§19·부록 B** — home-ui 24a ✅ · P24-B05~07 블록 ID · [30장](30-first-route-map-and-screen-inventory.md) 연동 |

---

## 최종 잠금 문장

24장 = **Viewer × Target** 기준 **상세 판단 레이어**. enum·권한은 타 장 · **UI·CTA·copy·Unlock** 은 24장.  
1차 = **Modal First + client state only** · **`detail-decision/`** · home-ui 완료 판정.  
순서: P24-01 Shell → P24-04 → P24-03 → P24-02 → Compare + 「비교에 추가됨」 toast.  
학부모 paid CTA = free(**쪽지**) · 18장 후 분기 · `student-detail-modal.js` 정본 ✕.

---

*필드·권한 충돌 → **11·13·16·18·20·21·22 우선** · UI 배치·CTA·copy·Unlock → **24장**.*
