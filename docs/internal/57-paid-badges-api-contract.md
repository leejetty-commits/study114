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
| Resolver + 055 테이블 | **계약·스키마 잠금** |
| Checkout → 행 INSERT | **미연결** (`badge_addon` 주문은 여전히 선행 조건 throw) |
| 운영 활성 행 데이터 | **보통 비어 있음** → 카드에 유료 배지 미표시가 정상 |

샘플(`exposure-data.js`)의 paid_badges는 **시각 검증용**이며 live 완료가 아님.

---

## 6. 설계 다음 단계 (이번 라운드 범위 밖)

1. 055 운영 DB 적용  
2. checkout fulfill 시 `provider_paid_badges` INSERT (Prime/Pick 기간 종속)  
3. 만료 job / 관리자 회수
