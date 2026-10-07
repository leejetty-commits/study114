# 141 · 140 배포 수락 — 과외 label 제거 · dothome #338

- 작성: 2026-09-25 05:42 KST
- 선행: [140](140-tutor-region-label-138-deploy-ticket.md) · [139](139-tutor-region-label-138-acceptance.md)
- 상태: **수락** (운영)
- SHA: `origin/main` = `f42d89e8a15dc55c852c973e0783e6b4a5dfd160` (부모 `db4cde2`)
- Actions: Deploy to dothome **#338** · success

---

## 스모크 (study114.net)

| 요청 | 결과 |
|------|------|
| POST region-stats `{}` | **200** · 공부방 1 · 과외 0 · 학생 0 · axes 대치동/서울시/서울시 |
| search tutor 서울시 | **200** · total 0 |
| search student 서울시 | **200** · total 0 |
| search room 대치동 | **200** · total 1 |
| `#/guest` 지도 박스 | **1 / 0 / 0** · 「—」·47/62/128 아님 |

파일 1개 · dirty 미커밋.

---

## 게스트 홈 허수 걷어내기 트랙 정리

| 단계 | SHA · Actions | 결과 |
|------|---------------|------|
| 129 구현 | `fb3bbf5` · #336 | 조건부(지도 500) |
| 134 PDO 이름 | `db4cde2` · #337 | 학생 OK · 과외 label 500 |
| 138 label 제거 | `f42d89e` · #338 | **지도 실수 완료** |

이 축은 여기서 닫음. 예정 작업(노션 정본·127·130·마스터 팝업 스모크 등)은 추후.
