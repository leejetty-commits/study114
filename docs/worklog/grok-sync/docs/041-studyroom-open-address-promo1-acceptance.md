# 041 · 티켓 040 수락 — 공부방 개설주소 → 홍보지역1

- 작성일: 2026-09-24 (KST)
- 대상: [040](040-studyroom-open-address-promo1-ticket.md) · 정책 [031](031-studyroom-open-address-promo1-policy.md)
- 상태: **로컬 수락** (push / `build:dothome` / 커밋 없음 — Cursor 보고와 동일)
- 검수: Cursor 보고 + `study-room-basic-form.js` diff(+106/−5) 대조

---

## 0. 한 줄

개설주소(사업장 카카오) 확정 → 홍보1 자동 채움, 홍보1 수동 수정 플래그면 재확정해도 덮지 않음, 개설≠홍보1 안내 고정 카피. 본인주소·홍보2·3 분리. **수락.**

---

## 1. 대조

| 040 요구 | 결과 |
|----------|------|
| 개설 확정 → `saved_regions[0]` 자동 채움 | `fillPromo1FromOpening` — business 카카오 콜백에서 `applyBusinessResult` 직후 호출. 단지→`complex`/`region_id=90`/래미안역삼, 동 재확정→`dong`/역삼1동/`90` |
| 수동 수정 플래그 → 덮지 않음 | `data-promo1-manual=1` (슬롯0 카카오·동/단지 라디오). 논현1동(`91`) 유지, 개설 삼성1동(`92`) 재확정해도 홍보1 유지 |
| 안내 카피 | 「수업은 개설주소에서만 진행됩니다. 지금 바꾼 건 홍보·찾기 대표 지역입니다.」 (`PROMO1_MISMATCH_COPY` / `[data-promo1-mismatch]`) |
| 본인주소 분리 | 집주소 서초대로→방배로만 변경, 개설·홍보1 불변 |
| 홍보2·3 | 자동채움 없음 · 빈 칸 유지 |
| 파일 allowlist | **주:** `preview/shared/study-room-basic-form.js` (+106/−5). 040으로 `signup-basic.js` 미수정(보고 일치) |
| 새 API/테이블/ALTER | 없음 |
| push/빌드/커밋 | 안 함 |

### 라우팅

- 진입·새로고침: `#/signup/basic?role=study_room`
- 개설 확정 후 같은 해시 · `window.open` 0
- 저장·다음: 기존 `#/signup/complete`
- 상세: 같은 탭 `#/register/lesson` · `#/register/facility`

### API (증거)

`POST /api/auth/basic-register.php` `role=study_room` → 200 `{ok:true, kind:"study_room", id:4}`

| 키 | 값 |
|----|-----|
| `address_text` | 테헤란로 512 (삼성동), 개설 `region_id` **92** |
| `home_address` | 방배로 100 · zip 06672 |
| `saved_regions[0]` | `is_primary:true`, `region_basis_type:"dong"`, `region_id:"91"` (논현) |
| `saved_regions` 2·3 | 빈 칸 |
| DB `study_rooms.id=4` | `region_id=92` |
| DB `study_room_regions` | slot1만 `region_id=91`, `is_primary=1` |
| seed | promo1(`91`)과 일치 · 개설(`92`)과 다름 — 분기 케이스로서 모순 아님 |

로컬 계정: `ticket040.room.1790182604@study114.test` (user 17, room 4)

---

## 2. 구현 요지 (코드)

- `fillPromo1FromOpening` — `data-promo1-manual`이면 `refreshPromo1Mismatch`만, 아니면 개설 basis로 슬롯0 `applySlotResult`
- `openingDiffersFromPromo1` — 개설 vs 홍보1 (basis · region_id/complex_id/라벨)
- 슬롯0 카카오·basis 라디오 → 수동 플래그 + 안내 갱신
- 본인주소(`home`) 콜백은 기존 경로만 (홍보1 채움 없음)

---

## 3. 주의 (수락은 유지)

워킹트리 `signup-basic.js`는 **030 시·군 + 학생 기본 WIP** 등으로 이미 dirty(+117/−37). 040 커밋 시에는 **`study-room-basic-form.js`만** 스테이징할 것. auth WIP·030과 한 커밋 금지.

공유 폼이 `study-room-ui` step-basic / home 임베드에도 물린다. 가입 경로에서 수락했고, 등록 UI는 공유 레이어 회귀로 본다. 나중에 등록 화면에서 개설→홍보1만 한 번 더 눌러 보면 충분.

---

## 4. 사용자 스모크 (로컬·프리뷰)

1. 공부방 가입 기본 → 개설만 확정 → 홍보1 자동 · 안내 없음  
2. 홍보1만 다른 동으로 → 안내 뜸 → 개설 다시 확정해도 홍보1 유지  
3. 본인주소만 변경 → 개설·홍보1 그대로  
4. 저장 → `address_text`≠`saved_regions[0].region_id` 가능(의도) · DB 개설 vs 홍보1 분리

---

## 다음

가입 QA 버그 시리즈(030~039) + 040까지 **로컬 수락 완료**.  
커밋·push·`build:dothome`는 사용자가 「커밋해」「푸시해」「빌드해」「배포해」라고 할 때만.  
잔여(선택): 038에서 남긴 빈 상세 저장 시 `curriculum cannot be null` 서버 보정 — **별도 티켓**.
