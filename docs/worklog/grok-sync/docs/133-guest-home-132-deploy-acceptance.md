# 133 · 132 배포 수락 — 게스트 홈 fb3bbf5 · dothome #336 (조건부)

- 작성: 2026-09-25 05:22 KST
- 선행: [132](132-guest-home-129-deploy-ticket.md) · [131](131-guest-home-129-acceptance.md)
- 상태: **조건부 수락** — push·파일·화면 vacant/프라임 크기 OK. **지도 숫자 API 운영 500** → 후속 [134](134-region-stats-pdo-named-param-fixup.md)
- SHA: `origin/main` = `fb3bbf531917d1d49c2d671971be500f5f964602` (부모 `8eaf74d`)
- Actions: Deploy to dothome **#336** · success (~1분 39초)

---

## 수락한 것

| 항목 | 결과 |
|------|------|
| push FF · 새 커밋 없음 | `8eaf74d..fb3bbf5` → main |
| allowlist 10파일 | 보고와 일치 · dirty 미포함 |
| 허수 47/62/128 | 운영에도 없음. 실패 시 「—」 |
| 현재위치 라벨 | 공부방 서울 강남구 대치동 · 과외 서울시 |
| 프라임 첫 크기 | 359×263 ≈ 16:9×1.3 |
| 프라임/픽 실0 | 샘플1+빈2 / 샘플1+빈4 |
| 베이직·학생 | 실등록 있으면 목록만(빈칸 패딩 없음) |
| 찾기 랜딩 | 공부방·과외 샘플1+「등록하면…」 · 학생은 hope 선택 후 김○○ 티저 |

---

## 열린 하자 (배포 패키지 밖 · 기존 검색 SQL)

`POST /api/search/region-stats.php` 운영 **500** (Apache HTML).  
같은 필터로 `search.php` 치면 공부방·대치동은 200·total 1, **과외쌤 서울시·학생 서울시만 500**.

원인(코드·닷홈 PDO): SQL에 같은 이름 자리표시자를 여러 번 쓰는데, 닷홈 PDO는 이름 파라미터를 **한 번만** 바인딩함.

- 과외: `:tutor_region_like` × 4
- 학생: `:preferred_region_like_ps` × 3 · `:preferred_region_like_pt` × 3

`guestAxisCounts()`가 세 축을 한 요청에서 호출하므로, 과외/학생 실패가 **지도 API 전체 500** → 박스 전부 「—」.

화면 폴백(「—」, 허수 금지)은 129 잠금대로 **정상**. 숫자는 고쳐야 함 → 134.

로그인 홈은 이번 스모크 미실시(사용자 보고).

---

## 판정

배포 자체는 수락. **지도 실숫자는 미완** — 134로 자리표시자 이름만 분리하면 됨(스키마·UI 변경 없음).
