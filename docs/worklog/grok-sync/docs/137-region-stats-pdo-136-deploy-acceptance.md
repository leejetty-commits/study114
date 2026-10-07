# 137 · 136 배포 수락 — PDO 이름 분리 · dothome #337 (조건부)

- 작성: 2026-09-25 05:31 KST
- 선행: [136](136-region-stats-pdo-134-deploy-ticket.md) · [135](135-region-stats-pdo-134-acceptance.md)
- 상태: **조건부 수락** — push·학생/공부방 200 OK. **과외쌤 서울시·지도 API 여전히 500** → [138](138-tutor-region-like-drop-label-fixup.md)
- SHA: `origin/main` = `db4cde227b030b195a723c7ae7811302694dabe9`
- Actions: Deploy to dothome **#337** · success

---

## 수락한 것

| 항목 | 결과 |
|------|------|
| FF push · 파일 1개 | SearchService.php만 |
| 학생 `preferred_region` 서울시 | **200** · total 0 |
| 공부방 대치동 | **200** · total 1 |
| PDO 이름 중복 | 학생 쪽에서 해소 확인 |
| 허수 47/62/128 | 없음. 실패 시 「—」 |

---

## 열린 하자

과외쌤 `tutor_region_label=서울시` → **500**.  
이름 중복을 푼 뒤 쿼리가 실제 실행되면서, `regions`에 **없는 `label` 컬럼**을 LIKE에 넣어 실패.

스키마(`sql/schema/001_init.sql`): `regions` = `sido_name` · `sigungu_name` · `dong_name` 만. `label` 없음.  
공부방·학생 필터는 이미 이 세 칸만 씀.

`region-stats`는 세 축을 한 요청에서 호출 → 과외쌤에서 전체 500 → 게스트 박스 전부 「—」.

---

## 다음

138: 과외쌤 LIKE 컬럼 목록에서 `label` 제거 → 시·구·동만 (학생과 동일).
