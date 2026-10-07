# 040 · 공부방 개설주소 → 홍보지역1(대표) 자동채움

- 작성일: 2026-09-24 (KST)
- 정책 정본: [031](031-studyroom-open-address-promo1-policy.md)
- 관련: [038](038-signup-detail-save-means-progress-policy.md) (저장=진행 — 본 티켓과 무관, 혼동 금지)
- 상태: **로컬 수락** → [041](041-studyroom-open-address-promo1-acceptance.md) (push / `build:dothome` 금지)
- 범위 한 줄: **공부방 기본등록**에서 개설주소 확정 시 홍보1을 채우고, 수정·경고만. 과외쌤·학생·상세1·2·031 외 UX 금지.

---

## 0. 한 줄 목적

공부방 **개설주소(수업 장소 SSOT)** 를 카카오 등으로 확정하면 **홍보지역1(대표)** 이 같은 장소에서 **자동으로 채워지게** 한다.  
홍보1은 **잠그지 않고** 수정 가능. 개설 ≠ 홍보1이면 안내만. 홍보2·3·본인주소는 기존 유지.

---

## 1. 도메인 잠금 (031)

| 항목 | 규칙 |
|------|------|
| 개설주소 (`address_text` 등) | **수업 장소 정본**. 홍보1을 바꿔도 개설은 안 바뀜 |
| 홍보지역1 | 개설에서 **자동 채움(기본값)** · **수정 가능** |
| 행정동 vs 아파트단지 | 주소 재입력이 아니라 **홍보·찾기 노출 단위** (`region_basis_type` dong\|complex) |
| 본인주소 (`home_address*`) | 개설·홍보와 **무관·별도** |
| 홍보2·3 | **선택** 유지 |
| 개설≠홍보1 범위 강제(같은 동만 등) | **1차 금지** — 경고 카피만 |
| 과외쌤 시·군 | **절대 수정 금지** (030과 분리) |

카피(개설≠홍보1일 때, 문장 고정 가능):

> 수업은 개설주소에서만 진행됩니다. 지금 바꾼 건 홍보·찾기 대표 지역입니다.

---

## 2. 코드 출발점 (allowlist 후보)

공유 폼이 여러 UI에 물려 있다. **공유 레이어를 고치면 가입·등록·임베드가 같이 간다** — 그게 의도. 과외/학생 폼은 건드리지 말 것.

| 파일 | 역할 |
|------|------|
| `preview/shared/study-room-basic-form.js` | **주 전장.** `address_text` 개설 · `saved_regions[0]` 홍보1 · `renderPromoSlot` · `bindStudyRoomBasicFields` · `collect`/`validate` |
| `preview/auth-ui/src/screens/signup-basic.js` | 역할 `study_room` 기본등록 래퍼 · `basicRegisterApi` · `study114.regionRegister.seed` (promo1 시드) — **최소** |
| `preview/study-room-ui/src/screens/step-basic.js` | 동일 공유 폼 사용 시 **회귀만** (불필요하면 diff 0) |
| `preview/home-ui/src/study-room-reg/*` | 임베드/포맷터가 공유 폼을 쓰면 **회귀만** |

PHP/API: 기존 공부방 기본등록 저장 경로만. **새 엔드포인트·새 테이블 금지.**  
`saved_regions[0]` · `address_text` · `region_id`/`complex_id`/`region_basis_type` 가 기존 계약대로 실리는지 확인. 스키마 ALTER 필요 시 **중단·보고**.

---

## 3. 포함 (해야 할 일)

### 3-1. UX · 자동채움

1. 사용자가 **개설주소**를 검색·확정하면 (기존 카카오 콜백 지점):
   - 홍보1 슬롯을 **비어 있거나, 아직 “사용자가 홍보1만 따로 고친 적 없을 때”** 개설 파생값으로 채운다.
   - 파생: 행정동 `region_id` (+ 가능하면 라벨). 단지 DB에 매칭되면 `complex` 선택지 제공, 기본은 **dong** 또는 매칭 확실하면 complex — **기존 masters/regions·complexes 조회 방식 재사용**, 새 geo API 금지.
2. 홍보1에 **동/단지 단위 선택**이 이미 있으면 그걸 쓰고, 개설 확정 후 단위만 고르면 홍보1이 갱신되게.
3. 사용자가 홍보1을 개설과 다르게 바꾸면:
   - 개설주소 필드는 유지
   - 경고 문구 표시 (위 카피)
   - 이후 개설주소를 **다시** 바꾸면: (A) 홍보1을 다시 덮을지 (B) “홍보1 수동 수정됨”이면 덮지 않을지 — **기본 권장: 수동 수정 플래그가 있으면 덮지 않고, 개설만 갱신 + “홍보1이 개설과 다릅니다” 유지.** 플래그 없으면 개설 따라 홍보1 재채움.
4. 홍보2·3: 자동채움 **하지 않음**. 선택·기존 검증 유지.
5. 본인주소 변경이 홍보1·개설을 건드리면 **버그** — 금지.

### 3-2. 검증 · 저장

1. 홍보1 필수·2·3 선택 규칙 **유지** (`validateStudyRoomBasicFields`).
2. 개설만 채우고 홍보1이 비면: 자동채움이 실패한 것 — 저장 막기 전 **개설→홍보1 채움 재시도** 또는 명확한 에러. “홍보1만 또 검색하라”로 퇴행하지 말 것(자동채움이 목적인데).
3. 빈 상세 저장(037/038)과 무관. 기본등록 필수(개설·홍보1)는 유지.

### 3-3. 라우팅 · API 필수 점검 (보고에 증거)

**라우팅**

1. 가입: `#`/역할 `study_room` → 기본등록 폼 진입·새로고침 유지.
2. 개설주소 확정 → 홍보1 UI가 채워진 채 **같은 화면** (불필요한 해시 점프·새 창 없음).
3. 저장·다음 → 기존 완료/이어가기 경로 유지 (035 같은 탭 회귀 없음).
4. `study-room-ui` 기본 개요/수정에서 같은 폼을 쓰면: 개설 수정→홍보1 동작 동일 · `/register/lesson` 등 상세 라우트 **회귀 없음**.

**API**

1. `basicRegisterApi('study_room', …)` (또는 기존 동일) 요청 body에:
   - `address_text` (및 zip/line2) = 개설
   - `home_address*` = 본인 (개설과 다름을 증거로 한 케이스)
   - `saved_regions[0]`: `is_primary` true · `region_basis_type` · `region_id` 및/또는 `complex_id` · 라벨/주소 필드가 **자동채움 또는 수정 후 값**과 일치
   - `saved_regions[1],[2]` 비어 있으면 선택 그대로
2. 응답 200(또는 기존 성공) · `study_room_id` 등 기존 필드.
3. 재조회/완료 화면 seed(`study114.regionRegister.seed`)가 promo1과 모순 없으면 성공.
4. **네트워크에 과외쌤 cities-only payload·학생 mypage PATCH가 섞이면 실패.**

---

## 4. 제외 (한 줄이라도 거부)

- 과외쌤 활동지역 시·군 · 학생 희망지역 · 학생찾기 · mypage A–G
- 상세정보1·2 카피/빈저장 · 031 외 가입 버그 재작업
- 개설≠홍보1 **같은 동 강제** · silent draft · 창 닫기=저장
- 새 테이블 · 새 공개 게이트 · Daum/카카오 전면 교체(기존 `kakao-postcode` 유지)
- push / `build:dothome` · dirty(030~037·auth WIP)와 **한 커밋 섞기**

---

## 5. 완료 보고 형식 (Cursor → 우동공과2)

1. 원인/접근 한 줄 (어느 콜백에서 홍보1을 채웠는지)
2. 변경 파일 allowlist
3. 시나리오 증거:
   - 개설만 입력 → 홍보1 자동 채움 (동 또는 단지)
   - 홍보1을 다른 단지/동으로 수정 → 개설 유지 + 경고 문구
   - 본인주소만 변경 → 개설·홍보1 불변
   - 홍보2·3 비움 저장 가능
4. **라우팅** 체크리스트 통과 여부
5. **API** 요청 핵심 키 스냅샷 (address_text, home_address, saved_regions[0])
6. push/빌드 안 함 · 과외/학생 diff 0

---

## 6. Cursor 붙여넣기용 전문

```
[티켓 040 · 공부방 개설주소 → 홍보지역1 자동채움만]

정책(031): 개설주소 = 수업 장소 SSOT. 확정 시 홍보1(대표) 자동 채움.
홍보1은 잠그지 않음(수정 가능). 개설≠홍보1이면 안내만:
「수업은 개설주소에서만 진행됩니다. 지금 바꾼 건 홍보·찾기 대표 지역입니다.」
동/단지는 홍보 노출 단위(region_basis_type). 본인주소 별도. 홍보2·3 선택.
같은 동 강제·과외쌤 시·군·학생·상세1·2·push·build:dothome 금지.

주 파일: preview/shared/study-room-basic-form.js
래퍼 최소: preview/auth-ui/src/screens/signup-basic.js
회귀: study-room-ui step-basic / home-ui study-room-reg (공유 폼 쓰면)

할 일:
1) 개설주소(카카오 확정) → saved_regions[0] 자동 채움 (region_id/complex + basis)
2) 홍보1 수동 수정 플래그: 있으면 개설 재확정 시 홍보1 덮지 않음 + 경고 유지. 없으면 개설 따라 재채움
3) 본인주소·홍보2·3·과외/학생 폼 금지
4) 새 API/테이블 금지. ALTER 필요 시 중단·보고

필수 점검(보고에 증거):
[라우팅] study_room 기본등록 진입·새로고침 / 개설 확정 후 같은 화면 /
저장·다음 기존 경로 / study-room-ui 상세 라우트 회귀 없음 / 새 창 없음
[API] basicRegister(study_room) body에 address_text·home_address*·saved_regions[0]
(is_primary, region_basis_type, region_id|complex_id) / 200 / seed 모순 없음

완료 보고: 접근 한 줄, 파일, 시나리오 3종, 라우팅·API 증거, push 안 함.
```
