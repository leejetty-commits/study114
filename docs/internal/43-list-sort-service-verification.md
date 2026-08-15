# 서비스 반영 완료 보고 — 정렬/카운트/SKY (실DB 기준)

작성: 2026-08-16  
갱신: 운영 041/042 적용·배포 #146·추천 로그인 검증 PASS  
런북: [44-list-sort-ops-runbook.md](44-list-sort-ops-runbook.md)  
스냅샷: [verify-snapshots/041-ops-2026-08-16.md](verify-snapshots/041-ops-2026-08-16.md)

---

## ① 실제 DB 반영

| 환경 | 040 | 041 | 042 | 판정 |
|------|-----|-----|-----|------|
| 로컬 | 적용 | 적용 | 적용 | 완료 |
| **운영** | 적용 | **적용** | **적용** | 스키마 **완료** |

## ② 실제 서비스 동작

| 기능 | 운영 |
|------|------|
| room 검색/정렬 | 200 · 500 해소 |
| sky 방어 | room/student → latest |
| recommendations ready | true |
| 추천 토글(로그인) | **PASS** (study_room) |
| tutor 목록 | **total=0** → SKY/recommend UX 미검증 |
| Home Basic mock | **금지로 코드 변경** (배포 필요) |

## ③ UI만 / fallback
- Search 0-fallback 코드 잔존하나 운영 스키마 적용으로 실경로 사용
- Home Basic mock → **금지 조치**(빈 목록+에러)
- wish 등 자리표시 → 임시 유지(별도)

## ④~⑥
운영 반영/rollback → **44 런북**.  
tutor 0건 → 노출조건(`published`+`expanded_complete`) 데이터 이슈 우세 · 진단 SQL 실행 필요.

## ⑦ 최종 판정 (갱신)

**부분완료** (스키마·배포·추천 API 정합은 진전, tutor 노출·Home Basic 배포 확인·verify 원문 보관은 미완)

운영 마감 완료가 되려면:
1. tutor 진단 SQL 결과 스냅샷 첨부
2. Home Basic mock 금지 배포 + 브라우저 확인
3. (가능 시) expanded_complete tutor 확보 후 sky/recommend 화면 확인
