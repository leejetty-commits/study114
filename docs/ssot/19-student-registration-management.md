# 19장 — 학생(학부모) 의뢰 등록 관리

**상태: UX·실행 1차 잠금** (Notion · Cursor · **home-ui 19a ✅** · API △)  
**작성:** 2026-07-04  
**역할:** `guardian_student` 역할의 **자녀(students) 의뢰** — **저장 / 공개 / 수정 / 숨김 / 삭제 lifecycle**  
**연동:** [22장](22-platform-lifecycle-principles.md) · [24장](24-detail-decision-layer.md) · [30장](30-first-route-map-and-screen-inventory.md) · [4장](04-member-db-and-role-profiles.md) · [14장](14-registration-input-flow.md) · [13장](13-search-page-fields.md) · [15장](15-mypage-structure.md) · [16장](16-messages-structure-proposal.md) · [18장](18-paid-services-rough.md)  
**후속:** [20장](20-study-room-registration-management.md) · [21장](21-tutor-registration-management.md)  
**프리뷰:** `preview/auth-ui/` · `preview/home-ui/` P15-03 → P19-xx  
**코드 정본:** [§13](#13-코드-정본-1차) · [부록 A](#부록-a-url-hash--kebab-case)

> **범위 재정의 (Notion 6-0):** 19장은 14장 입력 필드를 **다시 정의하지 않는다.**  
> **14장 §4를 참조**한 뒤 **상태·권한·공개 관리 lifecycle** 만 잠근다.

---

## 0. 핵심 문장 (잠금)

- **대상:** 학부모(`guardian_student`)만 · `guardian_user_id` 기준 **1 : 자녀 N** (4§7)
- **운영 단위:** 「폼 작성」이 아니라 **자녀 카드** — 전환 → 저장 / 공개 / 수정 / 숨김 / 삭제
- **저장 ≠ 공개:** `exposure_status` — `draft`는 학생찾기 **미노출** · `published`만 13장 노출
- **민감정보:** `student_name` 비공개 · `gender` · `birth_year`는 관리 화면·DB 축 · 검색은 `public_display_name`
- **학생 비교검색:** **없음** (6·11·13장 — 학부모 비교는 공부방·과외만)

**한 줄:** 19장 = **자녀 카드 기반 lifecycle 관리** · 14장 = **입력 필드 정의**.

### 0-1. 플랫폼 공통 원칙 (적용)

**원본:** [22장](22-platform-lifecycle-principles.md)

| 22장 원칙 | 19장 적용 |
|-----------|-----------|
| 운영자 심사·승인·반려 없음 | 학부모가 **직접** 공개·숨김·삭제 |
| 체크리스트 자동 판정 | P19-04 공개 게이트 (기본+상세 필수) |
| 자기확인 | P19-04 미리보기·공개 confirm |
| 당사자 합의 접촉 | 16장 · 학부모↔공급자 |
| `profile_status.pending` | **해당 없음** — 학생은 `exposure_status` (4장) |

---

## 1. 목적 (Notion 6-1)

학생 의뢰는 **민감정보 보호**가 핵심이다. 등록 폼(14장)과 별도로 **저장 → 공개 → 수정 → 숨김 → 삭제** 흐름을 한 세트로 잠근다.

| 축 | 19장 | 타 장 |
|----|------|-------|
| lifecycle · `exposure_status` | ○ | 4장 enum 정의 |
| 자녀 카드 · 전환 | ○ | 14장 필드 목록 |
| 기본/상세 **단계 분리** | ○ | auth-ui 첫 입력 |
| P15-03 · 숫자 연동 | ○ | P15-01 레이아웃 |
| 학생 **비교표** | **✕** | 11장 |

---

## 2. 운영 패러다임 (Notion 6-5)

1. 학부모는 **자녀를 먼저 고른다** (카드 · 전환).
2. 선택한 자녀에 대해 **저장 / 공개 / 수정 / 숨김 / 삭제**를 한다.
3. 「작성하기」 단일 폼이 아니라 **관리형** UI — P19-02 허브 + 상단 메뉴(§3).
4. **학생 비교검색 UI 없음** — 의뢰는 수요 리스트로만 노출(13장).

---

## 3. 상단 메뉴 · 페이지 묶음 (Notion 6-2 · 6-3)

자녀 1명 선택 후(P19-02) **공통 상단 메뉴** — 탭 또는 세그먼트.

| # | Notion 메뉴 | 페이지 묶음 | P19 | 비고 |
|---|-------------|-------------|-----|------|
| 1 | **기본등록** | 학생 기본등록 | P19-03a | 14§4-1 **기본 축** |
| 2 | **상세등록** | 학생 상세등록 | P19-03b | 14§4-1 **상세 축** · `preferred_tutor_gender` 등 |
| 3 | **공개설정** | 공개설정 | P19-05 | visibility · 공개 정책 |
| 4 | **미리보기** | 의뢰 미리보기 | P19-04 | 13§7-4 리스트 행 미리보기 |
| 5 | **저장목록** | 임시저장 목록 | P19-01† | `draft` 필터 · 전체 목록 탭 |
| 6 | **공개중 관리** | 공개중/숨김 관리 | P19-01‡ | `published` / `hidden` |
| 7 | — | **자녀별 전환** | P19-01 / P19-02 | 카드 클릭 · 드롭다운 |

†‡ P19-01 목록 **탭 변형** — 별도 라우트 필수 아님.

### 3-1. P19-xx 정본 (메뉴와 매핑)

| ID | 화면명 | Notion 대응 | 15장 |
|----|--------|-------------|------|
| P19-01 | **자녀 목록·전환** | 저장목록 + 공개중 관리 + 자녀 전환 | **P15-03** |
| P19-02 | **자녀 관리 허브** | 상단 메뉴 shell · 다음 할 일 | P15-03 → |
| P19-03a | **기본등록** | 기본등록 | §3 #1 |
| P19-03b | **상세등록** | 상세등록 | §3 #2 |
| P19-04 | **미리보기·공개 확인** | 미리보기 + 공개 게이트 | §3 #4 |
| P19-05 | **공개설정** | 공개설정 | §3 #3 |
| P19-06 | **숨김·삭제** | 공개중 관리 내 액션 | §3 #6 |

### 3-2. UI 3층 (16장 handoff)

| 층 | 예 |
|----|-----|
| **화면** | P19-01 · P19-02 · P19-03a/b |
| **탭 변형** | P19-02 상단 6메뉴 · P19-01 draft/published/hidden |
| **오버레이** | P19-04 공개 confirm · P19-06 삭제 confirm |

---

## 4. lifecycle · 상태 연동 (Notion 6-4)

### 4-1. 상태 머신 (`exposure_status`)

```
         ┌─────────┐
  저장   │  draft  │◄── 임시저장 (저장목록)
         └────┬────┘
              │ P19-04 공개 (기본+상세 필수 OK)
              ▼
         ┌───────────┐
   ┌────►│ published │────┐   공개중 관리
   │    └─────┬─────┘    │
   │          │ 숨김      │
   │          ▼          │
   │    ┌──────────┐     │
   └────│  hidden  │     │
        └────┬─────┘     │
             │ 재공개     │
             └────────────┘
             │ 삭제
             ▼
        ┌───────────┐
        │  deleted  │
        └───────────┘
```

| status | 학생찾기 | P19-01 탭 | P15-01 숫자 |
|--------|:--------:|-----------|-------------|
| `draft` | ✕ | 저장목록 | **임시저장** |
| `published` | ○ | 공개중 | **공개중** |
| `hidden` | ✕ | 숨김 | **숨김** △ |
| `deleted` | ✕ | (제외) | — |

△ P15-01 홈 **1차:** 공개중·임시저장만 강조 · **숨김**은 P19-01·공개중 관리에서 상세(15장 §4-3 확장 후순위).

### 4-2. 강조 상태·컬럼 (Notion 6-4)

필드 전체는 **14장 §4 역할별 기본등록 표** 우선 · 아래는 19장 **운영상 강조** 컬럼.

| 컬럼 | 역할 |
|------|------|
| `guardian_user_id` | 학부모 1 : 자녀 N · **카드 소유** |
| `exposure_status` | draft / published / hidden / deleted |
| `gender` | 학생 성별 · 기본등록 축 |
| `birth_year` | 출생연도 · 기본·관리 화면 |
| `public_display_name` | 블라인드 공개명 · 검색·쪽지 |
| `preferred_tutor_gender` | **기본등록 ✕** · **상세등록(공개 전)** (13§5 · Notion 6-4) |

### 4-3. 자녀 카드 액션 (관리 단위)

| 카드 액션 | 결과 |
|-----------|------|
| **전환** | P19-02 해당 자녀 |
| **수정** | P19-03a/b |
| **공개** | P19-04 (필수 충족 시) |
| **숨김** | P19-06 → `hidden` |
| **삭제** | P19-06 → `deleted` |

---

## 5. 기본등록 vs 상세등록 · 공개 게이트

14장 §4-1을 **두 단계**로 나눠 19장에서 운영한다. (Notion 상단 메뉴 #1·#2)

### 5-1. 기본등록 (P19-03a · auth-ui 첫 자녀)

임시 저장 가능 · **공개만으로는 부족**.

| 항목 | DB |
|------|-----|
| 희망 유형 | `preferred_lesson_type` |
| 학생 성별 | `gender` |
| 출생연도 | `birth_year` |
| 학교급/학년 | `grade_level` |
| 희망 지역 | regions + note |
| 희망 과목 | `student_subject_targets` |
| 희망 수업장소 | `student_preferred_lesson_places` |
| 희망 수업인원 | `preferred_student_count_group` |
| 수업형태 | `lesson_format` |
| 주 횟수 · 1회 시간 | `lessons_per_week` · `minutes_per_lesson` |
| 희망 강의스타일 | badges |
| 수업예산 | `preferred_fee_amount` / `preferred_studyroom_fee_amount` |
| 공개 표시명 | `public_display_name` |

> `school_name` — 1차 제외 (14장).

### 5-2. 상세등록 (P19-03b · 공개 전)

| 항목 | DB | 비고 |
|------|-----|------|
| 희망 과외쌤 성별 | `preferred_tutor_gender` | **기본등록 아님** (13§5) |
| 요청문·특이요청 | `request_*` + visibility | P19-05와 연동 가능 |

### 5-3. 공개(P19-04) 필수

**기본등록 §5-1 전항 + 상세등록 §5-2** 충족 후 공개.  
미충족 → 공개 버튼 disabled · **어느 메뉴(기본/상세)에서 채울지** 안내.

| 동작 | status |
|------|--------|
| 임시 저장 | `draft` 유지 |
| 공개하기 | `published` + `published_at` |
| 숨김 | `hidden` |
| 재공개 | `published` |
| 삭제 | `deleted` |

### 5-4. 미리보기 (P19-04)

학생찾기 **리스트 행** 동일 축 (13§7-4) — 이미지 없음 · 비교 없음.

---

## 6. 공개설정 · 요청문 (P19-05)

| 필드 | visibility | 기본 |
|------|------------|------|
| `request_summary` | `private` · `paid_only` | `private` |
| `special_request_note` | `private` · `paid_only` | `private` |

- `paid_only` = **공급자 유료 열람** 조건 (18·13장) · **학부모 과금 ✕**
- 본문 저장은 **공개 필수 아님**

---

## 7. 19장이 다루지 않는 것

| 항목 | 장 |
|------|-----|
| 입력 위젯·**입력 유효성** 규칙 상세 | 14장 |
| `students` DDL | 4장 |
| 학생찾기 필터 UI | 13장 |
| 공급자 메모·게이트 | 16·18장 |
| 학생 **비교검색** | 6·11장 **제외** |
| 공부방·과외 등록 | 20·21장 |

---

## 8. 진입·연동

### 8-1. 15장

| 진입 | 화면 |
|------|------|
| P15-01 · 자녀 0 | P19-01 자녀 추가 |
| P15-02 · P15-03 | P19-01 |

### 8-2. 14장 · auth-ui

| 시점 | 담당 |
|------|------|
| 가입 **첫 자녀** 기본등록 | auth-ui `#/signup/basic` |
| 2명째+ · 가입 후 | P19-03a |
| 상세·공개 | P19-03b · P19-04 (공급자 14§3-6 상세등록과 **별개**) |

### 8-3. 13·16·18장

- `published`만 학생찾기
- 학부모→공급자 선연락 free (16§1-2)
- 학부모 유료 UI ✕ (18§0)

---

## 9. 역할·권한

| 기능 | guardian | 공급자 |
|------|:--------:|:------:|
| P19-xx | ○ | ✕ |
| 타인 students | ✕ | 리스트만(13) |

---

## 10. 1차 포함 / 제외 (19a)

### 포함 — home-ui

- [x] P19-01 카드 · draft/published/hidden 탭 · 전환
- [x] P19-02 허브 · **상단 메뉴** shell · 빠른 이동
- [x] P19-03a 기본 · P19-03b 상세 · 임시저장
- [x] P19-04 미리보기 + 공개 게이트 (기본+상세)
- [x] P19-05 공개설정 · visibility
- [x] P19-06 숨김·삭제 (P19-02 허브 흡수)
- [x] home-ui · P19 reg-mgmt shell · auth-ui 연동

### 포함 — 백엔드 · 후속 (△)

- [ ] students API · auth-ui import 동기화
- [ ] P15-01 **숨김** 숫자 연동

### 10-1. 프리뷰 구현 상태 (2026-07-06)

| P19 | home-ui | 비고 |
|-----|---------|------|
| P19-01 | ✅ | sessionStorage seed |
| P19-02 | ✅ | 허브 · 위험 구역 |
| P19-03a/b | ✅ | home-ui 폼 (auth-ui 1차 자녀 별도) |
| P19-04 | ✅ | 학생찾기 미리보기 · 공개 게이트 |
| P19-05 | ✅ | visibility · P24-04 연동 규칙 |
| P19-06 | ✅ | P19-02 흡수 |

### 제외 · 후순위

- 학생 사진 · 비교 · 공개 예약 · deleted 복구 · 운영자 강제 숨김

---

## 11. 구현 우선순위

**1차 (완료):** §10 home-ui 표 — P19-01~06 shell.

**2차 (△):**

1. P15-01 **숨김** 숫자 연동
2. students API · auth-ui store 동기화
3. [24장](24-detail-decision-layer.md) P24-04 학습 요청 카드 실시간 반영

---

## 12. 20·21장 분할

| 장 | 대상 | 15장 |
|----|------|------|
| **19** | students | P15-03 |
| **20** | study_rooms | P15-04 |
| **21** | tutors | P15-05 |

패턴: **카드/목록 → 허브(상단 메뉴) → 기본/상세 → 공개 lifecycle**.

---

## 13. 코드 정본 (1차)

| 항목 | 경로 | SSOT |
|------|------|------|
| **copy · 탭 · visibility · 허브** | `preview/home-ui/src/student-reg/student-reg-copy.js` | §3 · §5 · §10 |
| **라우트 · P19-xx ID** | `student-reg/router.js` | §3-1 · 부록 A |
| **화면 · 폼 · 허브** | `student-reg/screens.js` | P19-01~05 |
| **라벨 · exposure 행** | `student-reg/format.js` | §5 · 13§7-4 |
| **store · lifecycle** | `student-reg/store.js` | §4 |
| **22장 copy** | `lifecycle-copy.js` | §0 · footnote |
| **auth-ui 1차 자녀** | `shared/student-auth-bridge.js` | §8-2 |
| **P15-03 진입** | `mypage/preview-data.js` · P15 shell | §8-1 |
| **P24 학습 요청** | `detail-decision/` P24-04 | 24§9 |

**저장:** students = `sessionStorage` `[임시]` · API/auth-ui 동기화 △.

**프리뷰 vs 백엔드:**

| 구분 | UI (home-ui) | API |
|------|:------------:|:---:|
| P19-01~06 shell | ✅ | △ |
| auth-ui 첫 자녀 import | ✅ | △ |

검증: [home-ui/DOC-CHECKLIST.md](../../preview/home-ui/DOC-CHECKLIST.md) §19장 · [30장 §8](30-first-route-map-and-screen-inventory.md#8-인벤토리--19--20--21장-등록운영-home-ui).

---

## 부록 A. URL (hash · kebab-case)

> **1차 프리뷰 정본:** `#/mypage/registrations/students/*` · `student-reg/router.js`

| 경로 | P19 |
|------|-----|
| `#/mypage/registrations/students` | P19-01 |
| `#/mypage/registrations/students/:id` | P19-02 |
| `.../students/:id/basic` | P19-03a |
| `.../students/:id/detail` | P19-03b |
| `.../students/:id/publish` | P19-04 (모달 가능) |
| `.../students/:id/settings` | P19-05 |

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-07-04 | 19장 초안 — P19-xx · lifecycle |
| 2026-07-04 | **Notion §6 반영** — 범위 재정의 · 상단 6메뉴 · 기본/상세 분리 · 카드 관리형 · `preferred_tutor_gender` 상세 · 비교검색 ✕ |
| 2026-07-06 | **home-ui 1차** · §10-1 · auth-ui 연동 |
| 2026-07-06 | **UX·실행 1차 잠금** — §13 코드 정본 · `student-reg-copy.js` · 30장 §8 연동 |

---

*충돌 시 [22장](22-platform-lifecycle-principles.md) 우선.*
