# 계정 문맥 분리 잠금 — 공부방 ≠ 과외쌤

**상태: 정책 잠금 (2026-08-22)** — 예외 없음  
**코드:** `ProviderCheckoutService` · `PaidBadgeRepository` · `PaidBadgeResolver` · schema `055`/`056`  
**교차:** [57-paid-badges-api-contract.md](./57-paid-badges-api-contract.md) · [55-card-visual-lock.md](./55-card-visual-lock.md)

---

## 한 줄 정본

> 공부방과 과외쌤은 같은 사람이 운영할 수 있어도 **같은 계정이 아니다**.  
> 모든 상품, 배지, 후기, 쪽지, 노출, 권한은 **각 계정 문맥에서만** 독립 처리한다.

---

## 1. 계정 분리

| 문맥 | 의미 |
|------|------|
| 공부방 계정 | `provider_type=study_room` + `provider_id` |
| 과외쌤 계정 | `provider_type=tutor` + `provider_id` |

같은 `users.id`가 양쪽 프로필을 소유할 수 있어도, 상품·권한·노출·후기·쪽지·배지 귀속은 **공유하지 않는다**.

---

## 2. Hot / paid_badges

- 공부방 Hot ≠ 과외쌤 Hot  
- **Hot은 이름만 공통일 뿐, 적용 권리는 계정별로 독립이다**
- 구매 시 `provider_type` + `provider_id` **필수**
- `paid_badges[]`는 SearchService가 **해당 카드의 type+id**로만 계산
- 금지: 방 우선/쌤 우선 fallback · 한 order로 양쪽에 적용 · user_id만으로 대상 추론

허용 코드:
- study_room: `hot`, `subject_track`
- tutor: `hot`, `jjokjipge`, `sky`

---

## 3. Prime / Pick / 후기 / 쪽지

동일 원칙.  
`provider_position_subscriptions`도 `provider_type`+`provider_id`로 문맥 분리 (schema 056).  
후기(`provider_reviews.provider_type`)·쪽지 스코프도 대상별 분리 — 소유자 합산 UI 금지.

---

## 4. DB 강제

| 테이블 | 분리 키 |
|--------|---------|
| `provider_paid_badges` | `provider_type`, `provider_id`, `badge_code` |
| `provider_payment_orders` | `provider_type`, `provider_id` (position/badge 필수) |
| `provider_position_subscriptions` | `provider_type`, `provider_id` |

---

## 5. 금지 구현 체크

- [ ] user_id만으로 Hot 대상 선택
- [ ] provider_type 없이 badge 계산
- [ ] checkout 후 대상 추론
- [ ] 클라이언트 방/쌤 우선순위
- [ ] 후기/쪽지 소유자 합쳐 보기
