# 356 `has_live_later_extension` 1단계 조사 보고 (2026-11-13)

지시: `docs/worklog/grok-sync/docs/356-refund-later-extension-2026-11-11.md`  
브랜치: `work/356-refund-later-extension` (main `3c6a26d0`)  
**1단계만.** 코드 수정 0 · 실제 환불/PG 0 · 운영 DB 0 · push/PR/머지 안 함.

## 증상 확정 (한 줄)

**확정:** `has_live_later_extension`은 327 도입 때 docblock에만 선언됐고, `calculate()`·`buildPositionCalcInput()` 어디에서도 읽히지 않으며, 뒤에 살아 있는 연장이 있어도 앞 주문 환불이 막히지 않는다. 앞 주문을 환불(submit)하면 `freezePositionSubscription`이 구독 `end_exclusive_on`을 오늘(또는 seg_start)로 잘라 **뒤 extend 구간이 노출에서 끊긴다.**

---

## 1. 도입 의도

| 출처 | 내용 |
|------|------|
| 커밋 `07382301` / `f34ae41e` (2026-10-28, 327) | `PositionRefundCalculator` 신규. docblock에 `has_live_later_extension?: bool` **추가만**. 본문·RefundService·테스트에 사용처 없음 |
| `docs/worklog/grok-sync/327-position-refund-notes.md` | extend = **추가 구간만** 환불. `segment_started_on`·재구성 언급. **뒤 연장 존재 시 앞 주문 처리 규칙·`has_live_later_extension` 설명 없음** |
| `docs/ssot/18d` 48~56 | extend: 이전 구간은 대상 아님. **「뒤에 연장이 있는 앞 주문 환불」 규칙 없음** |
| `git log -S` / 저장소 검색 | PHP에서 해당 식별자는 **docblock 1곳만**. 356 지시서·INDEX에만 추가로 등장 |

**해석:** 327 설계 시 「뒤 연장 플래그」를 넣으려다 **미구현으로 남은 자리**로 보는 것이 타당. 의도 문서화는 없음.

---

## 2. 시나리오 a·b·c (로컬 DB · eligibility만)

환경: Docker `study114_dev` · Asia/Seoul · 오늘 **2026-11-13**  
시드(로컬만): 프라임 new 30일 + extend 30일, 구독 `end_exclusive_on`=extend 끝.  
**submit 미호출.** 조회: `RefundService::checkEligibility` (API GET과 동일 경로).

| ID | 구간 | 요청 | eligibility | refund_won | reason | 환불 후 노출(예측·submit 미실행) | 뒤 주문 |
|----|------|------|-------------|------------|--------|----------------------------------|--------|
| **(a)** 신규 주문 | `[2026-11-03, 2026-12-03)` 진행 중 | 신규 환불 자격 | **eligible true** | **19000** | `after_start_prorata` | `freeze` → `end_exclusive_on=2026-11-13`. extend `seg_start=2026-12-03`과 **빈 구간·연장 노출 상실** | extend는 `paid` 유지, 자격은 별도 |
| **(b)** 연장 주문 | `[2026-12-03, 2027-01-02)` 시작 전 | 연장 환불 자격 | **eligible true** | **30000** | `before_start_full` | `freeze` → end=`2026-12-03`(연장 seg_start). **신규 구간은 유지** | 신규는 별도 |
| **(c)** 둘 다 | 동일 시드 | 신규·연장 각각 자격 | (a)+(b)와 동일 응답 | 위와 같음 | — | **순서로 위험:** 신규부터 submit하면 구독이 잘려 연장이 무력화. 연장만 먼저면 안전에 가까움 | 미적용 상태에서는 둘 다 eligible |

### 계산기 플래그 무효 증명

동일 입력에 `has_live_later_extension: true`를 넣어도 **생략과 결과 identical** (`refund_won`·`reason` 동일).

### API 확인 요지

- 경로: `GET /api/paid/refund.php?order_ref=…` ≡ `RefundService::checkEligibility`  
- 로컬 직접 호출 결과 위 표. HTTP curl은 세션 로그인 필요 — 동일 서비스 메서드로 대체(PG·submit 0).

### freeze 코드 (읽기만)

`RefundService::freezePositionSubscription` (≈660~677):  
`newEnd = segStart > today ? segStart : today` — **grant_mode와 무관**, 뒤 주문 존재 여부 미검사.

---

## 3. 18d · Notion 34·34-1과의 불일치

| # | 점 | 설명 |
|---|-----|------|
| 1 | 18d 공백 | 「뒤에 살아 있는 extend가 있는 앞 주문」 환불 허용/차단/재계산 **미정의**. 현재 구현은 **허용+구독 절단** |
| 2 | 34·34-1 정합 | 문서는 extend **자기 추가 구간만** 다룸. 앞 주문 환불이 뒤 구간을 깨는 부작용은 정본에 없음 → **구현이 문서보다 앞서 위험한 동작** |
| 3 | 플래그 사문화 | docblock만 있고 동작 0 → 18d에도 플래그 언급 없음(일관되게 미구현) |
| 4 | 일할액 자체 | (a)(b)의 금액·reason은 18d 단일 구간 규칙과는 **일치**. 문제는 **체인 환불 부작용** |

---

## 4. 수정안 (종현 선택용)

| 안 | 요약 | 사용자 문구 예 | 영향 파일 | 위험 |
|----|------|----------------|-----------|------|
| **A** | 뒤 live extend 있으면 **앞 주문 환불 차단**. 「연장 주문부터 환불하세요」 | `뒤에 이어진 연장 결제가 있어 이 건은 환불할 수 없습니다. 연장 건부터 환불해 주세요.` | `RefundService` (eligibility·submit 가드), `PositionRefundCalculator` 또는 서비스에서 later-extend 조회, verify, 18d | 앞 구간만 환불하고 싶은 사용자 불만. 조회 쿼리 정확도 |
| **B** | 앞·뒤 **묶음 환불** (한 번에 신청) | `이어진 연장 결제와 함께 환불됩니다.` | `RefundService` submit 루프, UI breakdown, verify, 18d | 금액·PG·철회 복잡도↑. 부분 철회 어려움 |
| **C** | 앞 환불 시 **뒤 구간 당겨 재계산** (구독·뒤 주문 snapshot/seg 조정) | `앞 기간 환불 후 연장 시작일이 당겨집니다.` | `RefundService` freeze, 주문 snapshot, checkout 가정과 충돌 가능, verify, 18d | 데이터 재기록 위험 큼. 철회·관리자 정합 난이도 최고 |

**권장(조사자):** 단기 **A** (차단·안내)로 돈·노출 사고를 막고, 필요 시 장기 C는 별도 설계. B는 제품/회계 합의 필요.

---

## 5. 운영 확인용 SELECT 초안 (**실행 금지** · 종현 승인 후)

```sql
-- 같은 provider·sku에 grant_mode=new(또는 앞 주문)와 이후 extend가 모두 paid/refund_requested인 체인
-- 값·이메일·실명 출력 금지. 건수만 먼저 권장.

SELECT
  o_new.provider_type,
  o_new.provider_id,
  o_new.product_id,
  o_new.order_ref AS earlier_ref,
  o_ext.order_ref AS later_extend_ref,
  o_new.status AS earlier_status,
  o_ext.status AS later_status,
  JSON_UNQUOTE(JSON_EXTRACT(o_new.price_snapshot_json, '$.end_exclusive_on')) AS earlier_end,
  JSON_UNQUOTE(JSON_EXTRACT(o_ext.price_snapshot_json, '$.segment_started_on')) AS ext_seg_start,
  JSON_UNQUOTE(JSON_EXTRACT(o_ext.price_snapshot_json, '$.end_exclusive_on')) AS ext_end
FROM provider_payment_orders o_new
JOIN provider_payment_orders o_ext
  ON o_ext.user_id = o_new.user_id
 AND o_ext.provider_type = o_new.provider_type
 AND o_ext.provider_id = o_new.provider_id
 AND o_ext.product_id = o_new.product_id
 AND o_ext.product_kind = 'position'
 AND o_ext.paid_at > o_new.paid_at
WHERE o_new.product_kind = 'position'
  AND o_new.status IN ('paid', 'refund_requested', 'refunded')
  AND o_ext.status IN ('paid', 'refund_requested')
  AND JSON_UNQUOTE(JSON_EXTRACT(o_ext.price_snapshot_json, '$.grant_mode')) = 'extend'
  AND (
    JSON_UNQUOTE(JSON_EXTRACT(o_new.price_snapshot_json, '$.grant_mode')) IN ('new', 'extend')
    OR JSON_EXTRACT(o_new.price_snapshot_json, '$.grant_mode') IS NULL
  )
ORDER BY o_new.paid_at DESC
LIMIT 100;
```

---

## 발견 목록 (범위 밖 · 미수정)

- `buildPositionCalcInput()`이 docblock의 `linked_badge_addons`도 채우지 않음(배지 추가는 다른 경로). 356 범위 밖.
- `freezePositionSubscription`에서 `$grantMode` 분기 본문이 new/extend **동일** (사실상 dead distinction).

---

## 셀프검수 체크리스트

| # | 항목 | 결과 | 근거 |
|---|---|---|---|
| 1 | 키 도입 의도 확인(커밋·문서) | **PASS** | `07382301` docblock only · 327 notes·18d에 키 설명 없음 |
| 2 | 시나리오 a·b·c 결과 표 | **PASS** | 위 표 · 로컬 eligibility |
| 3 | 18d와 불일치 목록 | **PASS** | §3 |
| 4 | 수정안 2~3개, 영향 파일 | **PASS** | A/B/C §4 |
| 5 | 운영 확인용 SELECT 초안(미실행) | **PASS** | §5 |
| 6 | 코드 diff 0, PG 호출 0 | **PASS** | 코드 미수정 · submit 미호출 · verify만 |

## 검증 명령

- `php scripts/verify-position-refund.php` → **PASS 28 / FAIL 0**
- `node scripts/verify-refund-apply.mjs` → **111 passed, 0 failed**

## 종현 결정 (2026-11-13)

1. 수정안 **A** 확정 — 뒤에 살아 있는 연장이 있으면 앞 주문 환불 차단.  
2. 운영 SELECT **실행하지 않음** (사례 없음).

---

## 2단계 구현 (2026-11-13 · 안 A)

지시 원문 요지: eligibility·submit 가드 · 안내 문구 고정 · verify a/b · 18d 종현 확정 반영 · 로컬 재현만 · PG·운영 DB 금지 · push/PR 허용 · 머지 금지.

### 구현

| 파일 | 내용 |
|------|------|
| `RefundService::hasLiveLaterExtension` | 같은 user·provider·product에서 `paid_at` 이후 `grant_mode=extend` + status `paid\|refund_requested` 존재 여부 |
| `buildPositionCalcInput` | `has_live_later_extension` 키 주입 |
| `PositionRefundCalculator::calculate` | 플래그 true → `refundable false` · `has_live_later_extension` |
| `denyMessage` | 「뒤에 이어진 연장 결제가 있어 이 건은 환불할 수 없습니다. 연장 건을 먼저 환불해 주세요.」 |
| eligibility / submit | 기존 calc 경로로 동일 가드 (별도 submit 우회 없음) |
| `verify-position-refund.php` | P29–P31 (a 차단) · P32–P34 (b 연장 허용) |
| `docs/ssot/18d-position-refund-lock.md` | 종현 확정(2026-11-13, 안 A) 절·reason 표 |

### 로컬 재현 (eligibility만 · submit/PG 0)

시드: 프라임 new 30일 + extend 30일 · Docker `study114_dev` · 오늘 2026-11-13

| ID | 결과 |
|----|------|
| **(a)** 앞(new) | `eligible false` · `refund_won 0` · `has_live_later_extension` · 안내 문구 일치 |
| **(b)** 연장 | `eligible true` · `refund_won 30000` · `before_start_full` |

### 셀프검수 체크리스트 (2단계)

| # | 항목 | 결과 | 근거 |
|---|---|---|---|
| 1 | 안 A만 구현 | **PASS** | B/C 코드 0 |
| 2 | eligibility·submit 가드 | **PASS** | calc 입력 플래그 → checkPositionEligibility / submitPosition |
| 3 | 안내 문구 고정 | **PASS** | denyMessage + 로컬 probe message |
| 4 | verify a/b | **PASS** | P29–P34 |
| 5 | 18d 종현 확정 | **PASS** | 상태줄·extend 절·reason 표 |
| 6 | PG·운영 SELECT 0 | **PASS** | 로컬만 · 운영 미실행 |
| 7 | main 합침 | **PASS** | merge `a7753e49` (충돌 없음) |

### 검증 명령 (2단계)

- `D:\php8.2\php.exe scripts/verify-position-refund.php` → **PASS 34 / FAIL 0**
- `node scripts/verify-refund-apply.mjs` → **111 passed, 0 failed**
- 로컬 probe (커밋 제외) → assert ALL_OK

---

```
[최종검수 패키지 — 356-2]
브랜치 / 커밋: work/356-refund-later-extension / 2c51826c
변경 파일: docs/ssot/18d · worklog 356 · verify-position-refund · PositionRefundCalculator · RefundService (+ stage1 docs commit 63d3f475)
diff 요약:
  - PositionRefundCalculator: has_live_later_extension true면 환불 차단
  - RefundService: later-extend 조회·calc 입력·denyMessage
  - verify-position-refund: 시나리오 a/b (P29–P34)
  - 18d: 종현 확정 2026-11-13 안 A
  - worklog: 2단계 기록
테스트: verify-position-refund.php → PASS 34 / FAIL 0; verify-refund-apply.mjs → PASS 111 / FAIL 0
스크린샷: 없음
API 확인: 로컬 eligibility (a) blocked has_live_later_extension + 안내문구; (b) before_start_full 30000. submit/PG/운영 SELECT 0.
셀프검수 체크리스트: 2단계 1~7 PASS
미해결·종현 결정 필요: 없음 (머지만 종현)
```

