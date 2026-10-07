# 023 · A~F 이후 잔여 작업 마스터

- 작성일: 2026-09-24 (KST)
- 갱신: 2026-09-24 — `20b7be8` 닷홈 배포 성공
- 선행: [008](008-student-mypage-renewal-master-plan.md) · [022](022-student-mypage-renewal-ticket-f-acceptance.md)
- 상태: **A~F+G main 배포 완료** · 학부모 로그인 운영 스모크 잔여 ([028](028-student-mypage-afg-deploy-ops-checklist.md))
- 정본: 노션 [학생 마이페이지 구조 및 프로필 입력 기준](https://app.notion.com/p/5b76f666474845128bf04e4aa9ac5486) · 19장 · 15장 §2-2

---

## 0. 한 줄

학생 마이페이지 **A~F+G**가 `20b7be8`로 `origin/main` · 닷홈 배포됨.  
auth·학생찾기·기타는 커밋에 없음.  
다음 제품 티켓은 **별도 승인** 전까지 열지 않음.

---

## 1. 우선순위

| 순번 | 티켓 | 내용 | 문서 | 상태 |
|------|------|------|------|------|
| 1 | G | 쪽지설정 `open`/`paused` | [024](024-student-mypage-memo-settings-save.md) · [026](026-student-mypage-memo-settings-acceptance.md) | 로컬 수락 → **배포됨** |
| 2 | H | 커밋 분리·배포 준비 | [025](025-student-mypage-af-commit-deploy-prep.md) · [027](027-student-mypage-af-commit-prep-acceptance.md) | 준비 수락 |
| 2b | 배포 | mypage만 커밋·푸시·빌드 | [028](028-student-mypage-afg-deploy-ops-checklist.md) | **`20b7be8` · Actions #324 성공** |
| 3 | I | 학생찾기 「한 줄 요청문」 (이미 parent `16b5b8f`에 있을 수 있음) | 004–007 | **별도 확인·미개방** |
| 4 | chore | GUARDIAN_* · dead publish | — | 미포함 |
| 5 | 후속 | 찜·비교 / 쪽지함 / 계정 **내용** | — | 미개방 |
| 6 | 후속 | 가입·14장 | — | auth WIP · 마이페이지와 합치지 않음 |

---

## 2. 배포 요약

- commit: `20b7be8`
- push: `16b5b8f..20b7be8` → `origin/main`
- 운영: `index-DYAUdb2O.js` + `index-Dss9eNVR.css`
- 잔여 점검: 학부모 로그인 후 028 §3

---

## 3. 공통 규칙

1. Cursor에는 티켓 전문만.
2. push/build는 사용자 명시 단어만.
3. 로컬 SSOT = `study114-ds/docs`. 노션은 요청 시에만.
