# 공개 샵 · 마이샵 — 라우팅·복귀 정책

**본문 SSOT:** [51-shop-page-redesign.md](./51-shop-page-redesign.md) — **단일 ShopPage**  
원장 마이페이지「마이샵」탭과 `#/myshop/study-room/:id` 공개 진입은 **같은 본문**을 본다.  
이 문서는 **라우팅·복귀 스냅샷**만 다룬다.

**기준일:** 2026-08-21  
**관련:** [47-study-room-home-card-map.md](./47-study-room-home-card-map.md) · `myshop/*` · `study-room-reg/myshop-render.js`

---

## 0. 역할 정리

| 화면 | 누구 | 무엇 |
| --- | --- | --- |
| 내 등록 → 마이샵 탭 | 원장 | **같은 ShopPage** (남에게 보여줄 결과물) |
| `#/myshop/study-room/:id` | 학부모·공부방·과외쌤·게스트 | **같은 ShopPage** |

바깥 셸(복귀 버튼·마이페이지 탭)만 다를 수 있다. 본문 구조·데코·카피 분기 금지.

---

## 1. 위치 / 플로우

| 해야 함 | 하지 말 것 |
| --- | --- |
| 바디 **전체**를 쓰는 **독립 상세 페이지** | 좌측 서랍형 |
| 탐색 흐름의 **최종 본편** | 인라인 확장만으로 본편 대체 |

---

## 2. 진입 단계 (3단)

```
미니카드 → 확대카드 → 샵(공개 ShopPage)
```

| 입력 | 결과 |
| --- | --- |
| 배너 / 카드 본문 | 확대카드 |
| 「공부방 둘러보기」 CTA | `#/myshop/study-room/:id` |

---

## 3. 복귀 · 스냅샷

`sessionStorage` 키: `study114:myshop-return-snapshot` (v1)  
구현: `myshop/return-snapshot.js` · `navigate.js` · `public-shell.js`

---

## 4. 수용 기준

- [x] 확대카드 CTA로만 공개 샵 진입
- [x] 공개 샵 = 독립 풀페이지
- [x] 상단 복귀 + 스냅샷 복원
- [x] **원장 마이샵 본문 = 공개 샵 본문 (단일 렌더)**
- [x] 빈 섹션 숨김 · enum 라벨화 · 주소 원문 비노출
- [ ] 문의 CTA 정교화 (상태 문구 이후 라운드)
