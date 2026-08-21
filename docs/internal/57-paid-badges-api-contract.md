# paid_badges[] API 계약 (2026-08-22 잠금)

**상태: API 계약 잠금 · entitlement 실데이터 주입은 운영 데이터 준비 후**  
**코드 SSOT:** `src/Paid/PaidBadgeResolver.php` · `preview/home-ui/src/card-visual.js`  
**스키마:** `sql/schema/055_provider_paid_badges.sql`  
**교차:** `docs/internal/55-card-visual-lock.md` · Notion 18장 §0-A

---

## 1. 원칙

| 계층 | 역할 |
|------|------|
| DB `provider_paid_badges` | entitlement 기간 행 |
| `PaidBadgeResolver` | 활성 코드 해석 · 금지코드 필터 |
| Search API `items[].paid_badges` | **클라이언트 정본** |
| `home-basic-live` | pass-through 배열 |
| `resolvePaidPromoBadges` | 배열만 신뢰 · 대학명 추론 금지 |

클라이언트가 entitlement·학력·문구로 유료 배지를 **유추하면 안 됨**.

---

## 2. 값 체계

### 공부방
| code | 표시 |
|------|------|
| `hot` | Hot |
| `subject_track` | 단과 |

### 과외쌤
| code | 표시 |
|------|------|
| `hot` | Hot |
| `jjokjipge` | 쪽집게 |
| `sky` | SKY |

**구 alias:** `picked` → 서버/클라 모두 `jjokjipge`로 정규화.

### 금지 (paid_badges에 넣지 않음)
`recommend` · `new` · 신뢰코드 · `전문` · 대학명 기반 자동 SKY

---

## 3. 활성 조건

```
starts_on <= CURDATE() < end_exclusive_on
```

provider_type + provider_id 기준. New는 **paid_badges가 아님** (published_at 7일 클라 자동).

---

## 4. API shape

```json
{
  "id": 101,
  "title": "…",
  "recommend_count": 4,
  "review_count": 2,
  "paid_badges": ["hot", "subject_track"],
  "published_at": "2026-08-20T12:00:00+09:00"
}
```

값 없음: `"paid_badges": []` (필드 생략 금지 — SearchService는 항상 배열).

---

## 5. live 연결 상태 (정직)

| 구간 | 상태 |
|------|------|
| API 필드 `paid_badges` | **연결됨** (SearchService) |
| Resolver + 055 테이블 | **스키마 잠금** (`status`·`revoked_at` 포함 · 055b 멱등 보강) |
| Checkout → 행 INSERT | **코드 연결됨** — `fulfillBadgeAddon` → `PaidBadgeRepository::grantFromOrder` |
| 선행 조건 | 활성 Prime/Pick + 공급자 프로필 + 055 테이블 적용 |
| 운영 DB 행 / HTTP 실응답 | **환경 의존** — 로컬에 PHP/DB 없으면 미증명 · `smoke-paid-badges-live.php` |
| 렌더 관통 (API shape) | `npm run smoke:paid-badges-proof` |

샘플(`exposure-data.js`) paid_badges는 **시각 검증용** — 운영 완료 주장에 쓰지 않음.

---

## 6. fulfill 매핑 · 정책

| product_id | provider | badge_code |
|------------|----------|------------|
| hot | study_room 우선, 없으면 tutor | hot |
| subject_track | study_room only | subject_track |
| jjokjipge (`picked` alias) | tutor only | jjokjipge |
| sky | tutor only | sky |

- 기간: 활성 포지션 중 가장 늦은 `end_exclusive_on`에 종속  
- 중복: 동일 활성 코드 → 기간 연장  
- 환불/취소: `revokeByOrderRef` → `status=revoked`  
- 만료: resolver 날짜 필터 (배치 삭제 불필요)

---

## 7. 다음 단계 (운영 실증)

1. 운영/스테이징 DB에 055(+055b) 적용  
2. `php scripts/smoke-paid-badges-live.php --grant` 또는 checkout complete  
3. 검색 API·Basic·확대·비교에서 동일 값 확인  
4. Prime/Pick **슬롯 live**는 별도 과제
