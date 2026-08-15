# 정렬 기능 DB 실반영 + 겉구현/DB 미적용 전수 점검 보고서

작성일: 2026-08-16  
**상태 갱신:** 운영 041/042 **적용됨** · 코드 배포 #146 ·  nonetheless **운영 마감 미완료** 항목 잔존  
런북: [44-list-sort-ops-runbook.md](44-list-sort-ops-runbook.md)  
스냅샷: [verify-snapshots/041-ops-2026-08-16.md](verify-snapshots/041-ops-2026-08-16.md)

---

## ① 041 마이그레이션 상태

### 파일 상태
| 파일 | 역할 |
|------|------|
| `sql/schema/041_list_sort_counters.sql` | 멱등 ADD COLUMN |
| `sql/schema/041_list_sort_counters.verify.sql` | 검증 |
| `sql/schema/042_user_recommendations.sql` | 추천 이력 테이블 |
| `src/Admin/ListSortCountersMigrateService.php` | apply-041 (+042) |
| `docs/internal/44-list-sort-ops-runbook.md` | 운영 반영·rollback |

### 실제 DB 적용 여부
| 환경 | 상태 |
|------|------|
| 로컬 Docker | 적용 |
| **운영 닷홈** | **적용됨** (SHOW + recommendations ready=true) |

### 적용 후 검증
- verify SQL + 스냅샷 폴더에 결과 보관
- tutor 진단: `041_ops_tutor_exposure_diagnose.sql`

---

## ② 완료 수준 (갱신)

| 항목 | 상태 |
|------|------|
| UI | 완료 |
| 서버 정렬 | 부분완료 (tutor 노출 0건으로 UX 미검증) |
| DB 스키마 운영 | **완료** |
| 추천 쓰기 API | 운영 로그인 검증 **PASS** (room) |
| Home Basic | mock 금지 코드 반영 · 배포/브라우저 재확인 필요 |
| rollback 문서 | **완료** (44) |

---

## ③ 남은 미완료
1. tutor 노출 0건 — 진단 SQL 결과 원문 보관·확정
2. tutor SKY/recommend **화면** 검증 (데이터 확보 후)
3. Home Basic mock 금지 배포 후 브라우저 확인
4. verify SQL 전문 붙여넣기 (스냅샷 B칸)

상세 전수 표는 초기 점검 시점 기록을 유지하되, 041 항목은 **해결됨**으로 본다.
