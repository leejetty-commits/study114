# 20장 — 공부방 등록·운영 관리

**상태: UX·실행 1차 잠금** (Notion · Cursor · **home-ui 20a ✅** · API/DDL △)  
**작성:** 2026-07-06  
**역할:** `study_room` 역할의 **공부방(study_rooms) 프로필** — **저장 / 공개 / 수정 / 숨김 / 상담조정 / 삭제 lifecycle** 및 **노출·상담·상품 연결 운영**  
**연동:** [22장](22-platform-lifecycle-principles.md) · [24장](24-detail-decision-layer.md) · [30장](30-first-route-map-and-screen-inventory.md) · [5장](05-study-room-db.md) · [11장](11-main-exposure-and-compare.md) · [13장](13-search-page-fields.md) · [15장](15-mypage-structure.md) · [16장](16-messages-structure-proposal.md) · [18장](18-paid-services-rough.md) · [19장](19-student-registration-management.md) · [21장](21-tutor-registration-management.md)  
**후속:** [21장](21-tutor-registration-management.md) (과외 운영센터 · 20장 동형)  
**프리뷰:** `preview/study-room-ui/` (입력) · `preview/home-ui/` P15-04 → P20-xx  
**코드 정본:** [§14](#14-코드-정본-1차) · [부록 A](#부록-a-url-hash--kebab-case)

> **범위 재정의 (19장 §0 동형):** 20장은 5장·study-room-ui 입력 필드를 **다시 정의하지 않는다.**  
> **5장 + `preview/study-room-ui/`를 참조**한 뒤 **상태·권한·공개·노출·상담 lifecycle** 만 잠근다.

---

## 0. 핵심 문장 (잠금 방향)

- **대상:** 공부방 원장(`study_room`) · `study_rooms.user_id` 기준 **1 : 공부방 N**
- **운영 단위:** 「등록 폼」이 아니라 **공부방 카드** — 전환 → 저장 / 공개 / 수정 / 숨김 / 상담조정 / 삭제
- **저장 ≠ 공개:** `profile_status` — `draft`는 검색·상세 **미노출** · `published`만 11·13장 노출
- **공개 ≠ 상담:** **노출(`profile_status`)** 과 **문의 수용(`inquiry_status`)** 은 **분리** · 둘 다 **원장이 직접 선택**
- **비교검색:** **있음** (6·11·13장 — 학생 19장과 대비)

**한 줄:** 20장 = **공부방 카드 기반 lifecycle + 노출·상담·상품 운영센터** · 5장 + study-room-ui = **입력 필드 정의**.

### 0-1. 플랫폼 공통 원칙 (적용)

**원본:** [22장](22-platform-lifecycle-principles.md) · 마이페이지 요약 [15장 §0](15-mypage-structure.md#0-등록공개-공통-원칙-요약)

| 22장 원칙 | 20장 적용 |
|-----------|-----------|
| 운영자 심사·승인·반려 없음 | 원장 **직접** `profile_status` · `inquiry_status` 전환 |
| 공개 준비 미완료 | P20-01 탭 · **체크리스트 계산** — `pending` **아님** |
| `profile_status.pending` | **deprecated** · [5장 §4-2](05-study-room-db.md#4-2-profile_status--pending-deprecated) · UI 미사용 |
| 자기확인 | P20-04 학부모 시점 confirm |
| 상담 vs 공개 분리 | `profile_status` + `inquiry_status` (원장 선택) |
| 당사자 합의 접촉 | 16장 |
| 제출자료 | `study_room_verification_documents` — **저장·표시만** · [P15-10](15-mypage-structure.md#2-1-p15-10-제출자료-상태) 1차 **△ 후순위** |

**공부방 공개 흐름:** 원장 입력 → 체크리스트 → 자기확인 → **직접 공개** → 학부모 판단 → 당사자 합의.

---

## 1. 5장 · study-room-ui와의 경계

| 축 | SSOT | 20장 |
|----|------|------|
| 테이블·컬럼·enum 정의 | **5장** | 참조만 |
| 등록 6단계 폼·입력 유효성 | **study-room-ui** | 참조만 |
| lifecycle · 운영센터 UI | — | **20장** |
| `inquiry_status` 추가 | 5장 부록 또는 migration | **20장에서 요구** `[DDL 1차]` |

20장 화면에서 **필드 목록을 다시 나열하지 않는다.** P20-03은 **요약 · 부족 항목 · 수정 딥링크**만 제공한다.

---

## 2. 목적

공부방은 학부모에게 **비교·판단 가능한 샵 프로필**(5장)이다. 등록 UI(study-room-ui)와 별도로 **저장 → 상세보강 → 미리보기 → 공개 → 숨김/상담조정 → 노출강화** 흐름을 한 세트로 잠근다.

**운영센터 컨셉:** 건강검진표 + 노출 조종판 — 원장이 「지금 공개 중인가 · 무엇이 부족한가 · 상담 받는가」에 즉답.

| 축 | 20장 | 타 장 |
|----|------|-------|
| lifecycle · `profile_status` | ○ | 5장 enum 정의 |
| `inquiry_status` | ○ | **원장 선택** · 1차 DDL |
| 공부방 카드 · 전환 | ○ | study-room-ui |
| 기본/상세 **입력** | **✕** | study-room-ui |
| **상태판** · 완성도 · 노출 가능성 | ○ | 11장 |
| **비교검색** 미리보기 | ○ | 11장 |
| 유료 Prime/Pick **CTA** | ○ | 18장 |

---

## 3. 19장과 20장의 대응

| 19장 | 20장 |
|------|------|
| P19-01 자녀 목록 | P20-01 공부방 목록 |
| P19-02 자녀 허브 | P20-02 **운영 허브·상태판** |
| P19-03a/b 기본·상세 | P20-03a/b **브리지** → study-room-ui |
| P19-04 미리보기·공개 | P20-04 검색·비교 미리보기 · 공개 |
| P19-05 공개설정 | P20-05 **노출·상담** (+ 위험동작 흡수 가능) |
| P19-06 숨김·삭제 | P20-06 **논리 ID** · 1차 UI는 P20-05·허브에 흡수 가능 |

### 3-1. 상단 메뉴 (공부방 1곳 선택 후)

19장·P19 프리뷰와 동일 UX 패턴 — 사이드바 · 모바일 가로 탭 `[공통 reg-mgmt shell]`.

| # | 메뉴 | P20 |
|---|------|-----|
| 1 | **운영 홈 (상태판)** | P20-02 |
| 2 | **기본정보** | P20-03a → study-room-ui `basic` · `location` |
| 3 | **상세정보** | P20-03b → `lesson` · `career` · `facility` |
| 4 | **미리보기·공개** | P20-04 |
| 5 | **노출·상담 수용** | P20-05 |
| 6 | **유료·상품** | P15-09 · 18장 CTA (별도 풀스크린 ✕) |

### 3-2. P20-xx 정본

| ID | 화면명 | 15장 |
|----|--------|------|
| P20-01 | 공부방 목록·전환 | **P15-04** |
| P20-02 | 운영 허브·**상태판** | P15-04 → |
| P20-03a | 기본정보 브리지 | §3 #2 |
| P20-03b | 상세정보 브리지 | §3 #3 |
| P20-04 | 미리보기·공개·**자기확인** | §3 #4 |
| P20-05 | 노출·**상담 수용** (+ 상품 CTA 블록) | §3 #5 |
| P20-06 | 숨김·삭제·상담전환 (논리) | §3 액션 |

### 3-3. P20-01 목록 탭

| 탭 | 기준 | 비고 |
|----|------|------|
| 전체 | — | |
| 저장 | `profile_status = draft` | 화면 문구: **저장중** |
| 공개중 | `published` | |
| 숨김 | `hidden` | |
| **공개 준비 미완료** | 체크리스트 미충족 **계산값** | DB 상태 ✕ · 「반려」✕ |

> **금지 UI 문구:** 검토중 · 반려 · 보완 요청 · 심사 대기.  
> **권장:** 「공개 준비 미완료」「필수 항목 미완료」「공개 전 확인 필요」.

---

## 4. lifecycle · 상태 (2축 + UI 계산)

### 4-1. 축 A — 공개 상태 `profile_status` (5장)

> 공부방은 학생(19장)과 달리 **`exposure_status`를 쓰지 않는다.** 5장 `profile_status`가 SSOT이다.

```
         ┌─────────┐
  저장   │  draft  │◄── study-room-ui 임시저장
         └────┬────┘
              │ P20-04 공개 (체크리스트 OK + 자기확인)
              ▼
         ┌───────────┐
   ┌────►│ published │◄────┐
   │    └─────┬─────┘     │  원장 직접 전환 · 운영자 승인 없음
   │          │ 숨김       │
   │          ▼            │
   │    ┌──────────┐      │
   └────│  hidden  │──────┘
        └────┬─────┘
             │ soft delete (원장)
             ▼
        deleted_at
```

| `profile_status` | 화면 문구 | 검색·상세 | 누가 변경 | P20-01 탭 |
|------------------|-----------|:---------:|:---------:|-----------|
| `draft` | 저장중 | ✕ | 원장 | 저장 |
| `published` | 공개중 | ○ | 원장 | 공개중 |
| `hidden` | 숨김 | ✕ | 원장 | 숨김 |
| `pending` | **deprecated — 20장 UI 미사용** | — | — | — |

**`pending`:** [22장 §3](22-platform-lifecycle-principles.md#3-profile_statuspending-공부방과외--deprecated) · [5장 §4-2](05-study-room-db.md#4-2-profile_status--pending-deprecated). enum 유지 · 운영자 검수 의미 **금지** · 「공개 준비 미완료」와 **별개**.

### 4-2. 공개 준비 — UI 계산값 (DB 저장 ✕)

| 계산 상태 | 조건 | 용도 |
|-----------|------|------|
| **공개 가능** | 필수 체크리스트 충족 | P20-04 버튼 활성 |
| **공개 준비 미완료** | 필수 항목 부족 | P20-01 탭 · 상태판 안내 |
| **상세 보강 권장** | 공개 가능하나 품질 항목 부족 | 한 줄 진단 · Prime CTA 전 |
| **노출 강화 가능** | 상세 충분 + `published` | 18장 CTA |

시스템이 **자동 표시**한다. 운영자 판단·반려가 **아니다**.

### 4-3. 축 B — 상담 수용 상태 `inquiry_status` `[1차 DDL · API]`

**플랫폼이 판단·승인하는 값이 아니다.** 공부방 원장이 **현재 상담 수용 여부를 직접 선택**하는 운영 상태.

> **쪽지 빈도 ([16§1-3](16-messages-structure-proposal.md#1-3-역할별-접촉-채널-비중-원본--2026-07-06)):** `inquiry_status`는 **쪽지 왕래량·대화 활성도가 아니다.** 공부방에서 쪽지는 **저빈도** 보조 채널이며, 본 축은 학부모에게 「**지금 신규 문의를 받을 수 있는지**」를 알려주는 **표지판**이다. P20-05에서 쪽지함은 **보조 링크** 수준.

| code | 화면 문구 | 의미 |
|------|-----------|------|
| `open` | 상담 가능 | 문의·쪽지 CTA 정상 |
| `paused` | 상담 중지 | 노출 유지 · 신규 문의 제한 |
| `capacity_full` | 정원 마감 | 자리 없음 안내 |
| `waiting_only` | 대기 문의 가능 | 대기자 문의만 |

**조합 예 (`published` 유지 시):**

| `inquiry_status` | 학부모 UI |
|------------------|-----------|
| `open` | 문의하기 |
| `capacity_full` | 「현재 정원 마감」 |
| `waiting_only` | 「대기 문의하기」 |
| `paused` | 문의 CTA 비활성 + 안내 |

DDL: `study_rooms.inquiry_status` ENUM — migration **1차 포함** `[sql/schema 후속 파일]`.

### 4-4. `detail_completion_status` (5장)

| 값 | P20 연동 |
|----|----------|
| `basic_only` | 상세 보강 권장 · Prime 후보 △ |
| `expanded_in_progress` | 체크리스트 · 상태판 |
| `expanded_complete` | 공개 게이트 · 노출 강화 후보 |

### 4-5. 프로필 완성도 % `[UI 계산 · DB 컬럼 후순위]`

예: 「완성도 72% · 필수 7개 중 5개 완료」 — `detail_completion_status` · 이미지 · 소개문 길이 · 과목/지역 등 **정책 기반 계산**. DB `profile_completion_score` **1차 미도입**.

### 4-6. 노출 가능 여부 `[UI 계산 · DB 플래그 후순위]`

`is_search_visible` 등 **1차 DDL 없음**. 11·13장 규칙 + `published` + 필수 필드로 **판정 결과만 표시**.

---

## 5. P20-03 브리지 · 공개 게이트

### 5-1. study-room-ui ↔ P20

| study-room-ui | P20 |
|---------------|-----|
| `#/register/basic` · `location` | P20-03a |
| `#/register/lesson` · `career` · `facility` | P20-03b |

각 화면: **현재 요약** · **부족 항목** · **「수정하기」→ 딥링크** (부록 C).

### 5-2. 공개 필수 체크리스트 (시스템 조건 · 심사 ✕)

5장 · study-room-ui DOC-CHECKLIST 기준 **최소 후보:**

| 항목 |
|------|
| `study_room_name` |
| `region_id` / `study_room_regions` |
| `study_room_subject_targets` |
| `lesson_place_type` 등 수업 방식 |
| `detail_completion_status` 기준 `[expanded_complete 여부 — 합의 후 수치화]` |
| 대표 이미지 1장 이상 |
| `intro_short` 또는 `intro_long` 최소 길이 |
| 문의·연락 방식 |

미충족 → **공개 버튼 비활성** + 부족 항목 링크. **반려 메시지 형태 ✕**.

### 5-2-1. 공개 게이트 · `detail_completion_status` `[프리뷰 잠금 · 2026-07-06]`

| 환경 | 정책 |
|------|------|
| **운영 DB (5장)** | `expanded_complete` 권장 — Prime/Pick 후보 |
| **home-ui 프리뷰 store** | **1차:** `expanded_complete` 필수 — draft 시나리오 체험용 |
| **완화 시** | store `getPublishReadiness`만 조정 · SSOT enum **변경 ✕** |

> 「합의 후 수치화」= **DB/API 확정 전** 프리뷰는 위 표대로. 완화는 코드 store 한정.

### 5-2-2. UI 금지 문구 (21§3-3 · 22§7 연동)

| ✕ | ○ |
|---|---|
| Pick/Prime **후보** · 검증 완료 | Pick/Prime **신청 가능** · **조건 N개 부족** |
| 심사·반려·검수중 | 공개 준비 미완료 · 자기확인 |

### 5-3. P20-04 미리보기 · 자기확인 (심사 ✕)

**1차 MVP 포함.**

1. **검색 결과 카드** 미리보기 (13장)
2. **비교검색 카드** 미리보기 (11장)
3. **공개 confirm** — 「학부모에게 이렇게 보입니다」+ 체크 3~4개:
   - 위치·주소 공개 범위
   - 연락·문의 방식 표시
   - 수업 대상·과목·소개문 노출
4. 원장 **직접 「공개하기」** → `published` + `published_at`

> 공개 confirm은 **플랫폼 심사가 아니라 원장 본인의 자기확인**이다.

| 종류 | 1차 | 후순위 |
|------|-----|--------|
| 검색 카드 | ○ | |
| 비교 카드 | ○ | |
| 상세·모바일·지도 카드 | △ | |

---

## 6. P20-02 상태판 (1차 필수)

원장이 **폼보다 먼저** 보는 화면. 줄이지 않는다.

1. **한 줄 진단** — 노출·품질·상품 가능성
2. **공개 준비** — N/M 체크리스트 (§5-2)
3. **현재 공개 상태** — `profile_status` + 안내
4. **노출 가능 매트릭스** — 기본검색 / 비교 / Prime / Pick · **불가 시 이유** (Notion §16-2)
5. **상담 수용 상태** — `inquiry_status` (쪽지 빈도 ✕ · [16§1-3](16-messages-structure-proposal.md#1-3-역할별-접촉-채널-비중-원본--2026-07-06))
6. **빠른 이동** — P20-03~05

---

## 7. P20-05 노출·상담 수용 · P20-06

### 7-1. P20-05

**화면명:** 노출·**상담 수용**·상품 — 「쪽지 활성화」가 아니라 **문의 가능 여부** + **노출** 중심.

**권장 블록 순서 (1차):**

1. 검색 노출 상태
2. 비교검색 표시 상태
3. 지도/지역 노출 상태
4. **상담 수용 상태** — `inquiry_status` 원장 선택
5. 정원/대기 문의 상태 (enum 조합 안내)
6. Prime/Pick **상품 CTA** (18장)
7. **쪽지함** — **보조 링크** (P16-01) · 운영센터 **주인공 ✕**

- 노출 가능 조건 **표시** (계산값)
- **1차:** 숨김 · 상담중지 · 정원 마감 · 삭제(위험 구역) — P20-06 **논리 흡수 가능**

### 7-2. P20-06 (논리 ID)

P19-06 대응. 코드·문서 **재사용**을 위해 ID 유지. 라우트 분리는 후순위.

---

## 8. 20장이 다루지 않는 것

| 항목 | 장 |
|------|-----|
| 입력 폼·6단계 상세 | 5장 · study-room-ui |
| 운영자 **심사·승인·반려** | **플랫폼 원칙 ✕** |
| `exposure_status` (공부방) | 19장(students) 전용 |
| 검색 필터 UI | 13장 |
| 결제·에스크로 | 18장 |
| 학생·과외 lifecycle | 19·21장 |

---

## 9. 진입·연동

| 진입 | 화면 |
|------|------|
| P15-01 · 공부방 0 | study-room-ui 또는 P20-01 |
| P15-02 · P15-04 | P20-01 |
| GNB 공부방등록 | study-room-ui |

공개·숨김·상담: **home-ui P20-xx**. 필드 수정: **study-room-ui** (부록 C).

---

## 10. 역할·권한

| 기능 | study_room | 학부모 |
|------|:----------:|:------:|
| P20-xx · lifecycle 전환 | ○ | ✕ |
| `inquiry_status` 변경 | ○ (본인 공부방) | ✕ |
| 공개 프로필 열람 | — | ○ |

---

## 11. 1차 MVP (20a)

### 포함 — home-ui

- [x] P20-01 카드 · 탭(전체/저장/공개/숨김/**공개 준비 미완료**)
- [x] P20-02 **상태판** (§6 · 상담 수용 블록 · 상태 CTA)
- [x] P20-04 **검색+비교** 미리보기 탭 + **자기확인** + `profile_status` 전환
- [x] P20-03a/b 브리지 + **딥링크 규약** (부록 C)
- [x] P20-05 노출·상담 · `inquiry_status` · 상품 CTA · §7-1 블록 순서
- [x] P20-06 동작 (P20-05 위험 구역 흡수)
- [x] home-ui · P19 reg-mgmt shell · [22장](22-platform-lifecycle-principles.md) copy
- [x] P15-04 · preview-data CTA 연동

### 포함 — 백엔드 · 후속 (△)

- [ ] **`inquiry_status` DDL + API** (원장 PATCH)
- [ ] study-room-ui ↔ P20 store **동기화**
- [ ] P15-10 공부방 제출자료 (△ 후순위)

### 11-1. 프리뷰 구현 상태 (2026-07-06)

| P20 | home-ui | 비고 |
|-----|---------|------|
| P20-01 | ✅ | sessionStorage seed |
| P20-02 | ✅ | §6 블록 · `getHubCtas` |
| P20-03 | ✅ | study-room-ui 딥링크 |
| P20-04 | ✅ | Basic / Compare 탭 |
| P20-05 | ✅ | §7-1 순서 · P16 보조 링크 |
| P20-06 | ✅ | P20-05 흡수 |

### 제외 · 후순위

- 운영자 심사 워크플로 · `pending` UI
- `profile_completion_score` · `is_*_visible` DDL
- 5종 미리보기 전부 · 실시간 카드 프리뷰
- 결제 · 통계 · AI · Pick **배정** · 변경 이력

---

## 12. 구현 우선순위

**1차 (완료):** §11 home-ui 표 — P20-01~06 shell.

**2차 (코드):**

1. P21 동형 갭 메우기 (21§14-1) — **21장 코드 착수 전**
2. `inquiry_status` migration · PATCH API
3. study-room-ui store 연동
4. [24장](24-detail-decision-layer.md) 공부방 상세 모달

---

## 13. 합의 이력 (2026-07-06)

| # | 주제 | 결론 |
|---|------|------|
| 1 | `exposure_status` 신설 | **✕** · `profile_status` 유지 |
| 2 | URL | **`study-rooms`** |
| 3 | P20-03 | **브리지** · 폼 재구현 ✕ |
| 4 | `pending` | **deprecated** · 5장 §4-2 · 20/21 UI 미사용 · [22장 §3](22-platform-lifecycle-principles.md#3-profile_statuspending-공부방과외--deprecated) |
| 5 | 공개 준비 미완료 | **체크리스트 계산** · DB·반려 ✕ |
| 6 | `inquiry_status` | **1차 DDL/API** · 원장 선택 |
| 7 | inquiry enum | `open` · `paused` · `capacity_full` · `waiting_only` |
| 8 | 상태판·자기확인·딥링크 | **1차 MVP** |
| 9 | P20-06 | 논리 ID 유지 · UI는 P20-05 흡수 가능 |
| 10 | 유료·상품 | P15-09 CTA · P20-07 풀스크린 ✕ |
| 11 | 운영자 심사 | **✕** · [22장](22-platform-lifecycle-principles.md) |

---

## 14. 코드 정본 (1차)

| 항목 | 경로 | SSOT |
|------|------|------|
| **copy · 탭 · inquiry · Pick/Prime** | `preview/home-ui/src/study-room-reg/study-room-reg-copy.js` | §3-3 · §4-3 · §6 · §7 |
| **라우트 · P20-xx ID** | `study-room-reg/router.js` | §3-2 · 부록 A |
| **화면 · 상태판 · 미리보기** | `study-room-reg/screens.js` | P20-01~05 |
| **매트릭스 · inquiry · 딥링크** | `study-room-reg/format.js` | §6 · §7 · 부록 C |
| **store · lifecycle** | `study-room-reg/store.js` | §4 · §5 |
| **22장 copy** | `lifecycle-copy.js` | §0 · 공개 confirm |
| **P15-04 진입** | `mypage/preview-data.js` · P15 shell | §9 |
| **tutor-ui 브리지** | `nav-config.js` · 부록 C | §5 |

**저장:** study_rooms = `sessionStorage` `[임시]` · study-room-ui/API 동기화 △ · `inquiry_status` DDL/API △.

**프리뷰 vs 백엔드:**

| 구분 | UI (home-ui) | API·DDL |
|------|:------------:|:-------:|
| P20-01~06 shell | ✅ | △ |
| `inquiry_status` PATCH | ✅ (sessionStorage) | △ |
| study-room-ui ↔ store 동기화 | △ | △ |

검증: [home-ui/DOC-CHECKLIST.md](../../preview/home-ui/DOC-CHECKLIST.md) §20장 · [30장 §8](30-first-route-map-and-screen-inventory.md#8-인벤토리--19--20--21장-등록운영-home-ui).

---

## 부록 A. URL (hash · kebab-case)

> **1차 프리뷰 정본:** `#/mypage/registrations/study-rooms/*` · `study-room-reg/router.js`

| 경로 | P20 |
|------|-----|
| `#/mypage/registrations/study-rooms` | P20-01 |
| `#/mypage/registrations/study-rooms/:id` | P20-02 |
| `.../study-rooms/:id/basic` | P20-03a |
| `.../study-rooms/:id/detail` | P20-03b |
| `.../study-rooms/:id/publish` | P20-04 |
| `.../study-rooms/:id/exposure` | P20-05 |

---

## 부록 B. study-room-ui 단계

| P20 | study-room-ui hash |
|-----|-------------------|
| P20-03a | `#/register/basic` · `#/register/location` |
| P20-03b | `#/register/lesson` · `#/register/career` · `#/register/facility` |

---

## 부록 C. 딥링크 규약 `[1차 잠금]`

home-ui P20 → study-room-ui 수정 진입 · 완료 후 복귀.

```
{STUDY_ROOM_UI_BASE}/#/register/{step}?room_id={id}&return_to={urlencoded_home_ui_hash}
```

| 파라미터 | 설명 |
|----------|------|
| `step` | `basic` · `location` · `lesson` · `career` · `facility` |
| `room_id` | `study_rooms.id` |
| `return_to` | 예: `%23/mypage/registrations/study-rooms/1` |

study-room-ui는 저장·완료 후 `return_to`가 있으면 해당 hash로 이동. **auth-ui ↔ 19장 student bridge와 동형.**

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-07-06 | 20장 초안 |
| 2026-07-06 | **Notion·Cursor 합의** — `profile_status` · `inquiry_status` 2축 · [22장](22-platform-lifecycle-principles.md) · pending deprecated · 공개 준비 미완료 · 자기확인 · 딥링크 |
| 2026-07-06 | 제출자료 원칙 · 입력 유효성 용어 · Pick 배정 |
| 2026-07-06 | **16§1-3** · P20-05 상담 **수용** · 쪽지 보조 · 블록 순서 |
| 2026-07-06 | **home-ui 1차** · §11-1 · §5-2-1 게이트 · 금지 문구 · 24장 연동 |
| 2026-07-06 | **UX·실행 1차 잠금** — §14 코드 정본 · `study-room-reg-copy.js` · 30장 §8 연동 |

---

*충돌 시 [22장](22-platform-lifecycle-principles.md) 우선.*
