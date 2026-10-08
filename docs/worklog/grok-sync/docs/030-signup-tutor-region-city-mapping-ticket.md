# 030 · 가입 티켓 1 — 과외쌤 시·군 지역 매핑

- 작성일: 2026-09-24 (KST)
- 선행 소견: [029](029-signup-ops-findings-notion-vs-bugs.md)
- 정본: 과외 희망/활동지역 = **시·군(시) 단위** (14장·UDX). 노션 충돌 시 **최근 문서** 우선.
- 재현 역할: **과외쌤(tutor) 가입·기본등록** (사용자 확인). 공부방 분기는 미확인·본 티켓 제외.
- 상태: **로컬 수락** → [032](032-signup-tutor-region-city-mapping-acceptance.md)

---

## 0. 한 줄 목적

과외쌤 기본등록에서 **광역(도/광역시) → 시·군**을 고른 뒤 「선택한 시에 매핑된 지역이 없습니다.」로 **다음이 막히는 버그**를 고친다.  
저장 payload의 `region_id`(또는 동일 의미 키)가 **선택한 시·군에 실제로 매핑**되게 한다.

---

## 1. 도메인 잠금 (역할별 축 — 섞지 말 것)

| 역할 | 지역 축 | 본 티켓 |
|------|---------|---------|
| **과외쌤** | **시·군** (예: 경기도 의정부시) | **포함** |
| 학생 · 희망유형=과외 | 시 단위(동일 계열 매핑이면 공유 레이어만) | **공유 모듈이면 같이 고쳐도 됨**. 학생 전용 UI/공부방 희망 축은 건드리지 말 것 |
| **공부방** | **행정동** + **아파트단지** 두 축 | **제외** (한 줄도 변경 금지) |

공부방 `region_basis` / dong / complex 분기, 학생 「희망지역 동·단지」 UI는 **이번 범위 밖**.

---

## 2. 재현 (운영·로컬 동일 기대)

1. 가입 → 역할 **과외쌤** 선택 → 기본등록(활동지역) 화면.
2. 광역에서 **경기도**(또는 동일 재현 가능한 도) 선택.
3. 시·군에서 **의정부시**(또는 목록에 보이는 시·군) 선택.
4. 다음/저장 시 alert: **「선택한 시에 매핑된 지역이 없습니다.」** → 진행 불가.

**첨부:** 사용자가 Cursor 채팅에 스크린샷을 **직접** 붙인다 (의정부시 선택 + alert). 경로 추정 금지.

---

## 3. 코드 출발점 (조사·수정 허용 범위)

이미 확인된 축:

- `preview/auth-ui/src/screens/signup-basic.js`
  - import: `buildSidoCityOptions`, `KOREA_SIDOS` ← `preview/shared/korea-sidos.js`
  - `regionIdForSido(sido)` — `signupState.cities` label 완전일치 또는 `regions` label prefix로 id 조회. **실패 시** alert 「선택한 시에 매핑된 지역이 없습니다.」
  - 과외쌤 UI: `getCityUnits` · `renderTutorRegionSlot` · `bindTutorRegionSlotEvents` (활동지역 슬롯)
- `preview/shared/korea-sidos.js`
  - `buildCityUnitOptions` / `buildSidoCityOptions`
  - `renderProvinceCityOptions` — units에 있는 시만 쓰거나, 없으면 static `prov.cities`
  - `regionIdFromSelection(parent, cityLabel, units)` — `units`에서 `kind==='city'` + sido_code + label로 id

**의심 원인 (가설, Cursor가 증거로 확정):**

1. UI는 static 시 목록(의정부시)을 보여 주는데 API `cities`/`units`에 해당 row가 없어 `regionIdFromSelection` / `regionIdForSido`가 빈 id.
2. label 불일치 (`의정부시` vs `의정부`, `경기도 의정부시` 한 칸 vs sido+city 분리).
3. 과외쌤 슬롯은 `regionIdFromSelection`을 쓰는데, 학생·다른 분기는 `regionIdForSido`만 써서 **한 축만** 깨짐 — 둘 다 시·군이면 **같은 해석 함수**로 통일하는 쪽이 맞음.

Cursor는 가설을 코드·네트워크로 확정한 뒤 최소 수정. 추측으로 데이터 전체를 갈아엎지 말 것.

---

## 4. 포함

1. 과외쌤 기본등록 **활동지역(시·군)** 선택 → `region_id` 매핑 성공 → 다음/저장 진행.
2. 경기도 **의정부시** 포함, 동일 패턴 시·군 다수에서 alert 없이 id가 잡히는지 점검.
3. 매핑에 쓰는 공유 모듈(`korea-sidos.js` 등) 수정이 필요하면 **시·군 해석만** 고친다.
4. cities API가 비어 있거나 불완전하면: (A) API/시드 보완 **또는** (B) UI가 고른 static 시를 서버가 아는 id로 해석하는 경로 — **둘 중 기존 아키텍처에 맞는 최소안**. 새 테이블·새 엔드포인트는 **중단·보고**.
5. 라우팅 + 저장 요청에 `region_id`(및 화면이 쓰는 시·군 라벨)가 실리는지 증거.

---

## 5. 제외 (한 줄이라도 건드리면 거부)

- 공부방 가입/기본등록의 **행정동·아파트단지** UI·저장·`region_basis`
- 학생 mypage / 학생찾기 / Stage5B / memo_status
- 완료 화면 `—` 디버그 칸 (→ 티켓 2)
- `window.open` / 게스트 상세 플래시 (→ 티켓 3)
- 상세정보1·2 빈 저장·카피 (→ 티켓 4)
- auth WIP와 mypage를 **한 커밋으로 섞기**
- push / `build:dothome` / 배포
- 광역·시·군 UX를 동·단지로 바꾸기, Daum 우편번호 전면 도입 등 **축 변경**

---

## 6. 완료 전 필수 점검

### 6-1. 라우팅·역할

1. 역할 **과외쌤** → 기본등록 활동지역 화면 진입·새로고침 유지.
2. 시·군 선택 후 다음 단계(또는 저장 성공)로 넘어감. alert 「선택한 시에 매핑된 지역이 없습니다.」 **재현 케이스에서 사라짐**.
3. 공부방 동·단지 화면 **회귀 없음**(손대지 않았으면 “미변경”으로 명시).

### 6-2. API·데이터

1. 선택값 → payload에 **숫자(또는 기존 형식) region_id** 포함, 빈 문자열/누락으로 막지 않음.
2. 의정부시(재현 케이스)에 대해 units/cities/regions 중 **어느 소스가 id를 주는지** 한 줄로 보고.
3. 네트워크 200(또는 기존 성공 코드). 권한·스키마 구멍 보이면 중단·보고.

### 6-3. 예상외

중단·보고·승인 대기. 공부방 축·mypage·배포로 범위 확장 금지.

---

## 7. 보고 형식 (Cursor → 우동공과2)

1. 원인 한 줄 (label mismatch / cities 누락 / 함수 불일치 등)
2. 변경 파일 allowlist
3. 의정부시(또는 동등 재현) 전후: alert 유무 + payload `region_id`
4. 공부방·학생 mypage diff = 0 확인
5. push/빌드 안 함 명시

---

## 8. Cursor 붙여넣기용 전문

아래 블록을 Cursor에 **그대로** 붙이고, 사용자는 **재현 스크린샷을 채팅에 직접 첨부**한다.

```
[티켓 030 · 과외쌤 시·군 지역 매핑만]

목적: 과외쌤 가입·기본등록에서 광역→시·군(예: 경기도 의정부시) 선택 후
「선택한 시에 매핑된 지역이 없습니다.」로 막히는 버그 수정.
선택한 시·군 → region_id 매핑이 되어 다음/저장이 되게 할 것.

도메인 잠금:
- 과외쌤 지역 축 = 시·군 만. (본 티켓)
- 공부방 = 행정동 + 아파트단지 두 축 → 절대 수정 금지.
- 학생 mypage / 학생찾기 / 완료화면 — / window.open / 상세 빈저장 = 다른 티켓. 손대지 말 것.

재현: 가입→역할 과외쌤→기본등록 활동지역→경기도→의정부시→다음/저장→위 alert.
사용자가 첨부한 스크린샷을 근거로 할 것.

출발 파일(최소):
- preview/auth-ui/src/screens/signup-basic.js
  (regionIdForSido, getCityUnits, renderTutorRegionSlot, 해당 alert)
- preview/shared/korea-sidos.js
  (buildCityUnitOptions, renderProvinceCityOptions, regionIdFromSelection)

할 일:
1) 원인 확정 (UI static 시 vs API cities/units 불일치, label 불일치, 과외쌤 슬롯 vs regionIdForSido 경로 불일치 등)
2) 최소 수정으로 의정부시 포함 시·군 매핑 복구
3) 공유 시·군 해석이 학생「희망유형=과외」에도 쓰이면 같은 버그면 공유 레이어만 함께 수정. 공부방 동·단지는 금지
4) 새 테이블/새 엔드포인트/축 변경이면 중단·보고
5) push, build:dothome, 배포 금지. mypage와 커밋 섞지 말 것

완료 보고: 원인 한 줄, 파일 목록, 의정부시 region_id 증거, 공부방/mypage diff 0, push 안 함.
```
