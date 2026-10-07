# 143 · 142 이용안내·고객센터 「공개」→「노출」 — 로컬 수락

- 작성: 2026-09-25 12:10 KST
- 선행: [142](142-guide-support-public-to-exposure-ticket.md) · [130](130-copy-public-hidden-to-exposure-backlog.md)
- 상태: **배포 완료** → [145](145-guide-support-144-deploy-acceptance.md) · `f154183` · #339
- 기준 HEAD: `f42d89e` · 브랜치 `feat/student-mypage-a-g` · stage 없음

---

## 판정

142 잠금과 **일치**. 보완지시 없음.

| 항목 | 결과 |
|---|---|
| 범위 | allowlist 4파일만 142 변경 (+95/−99). community·mypage·SearchService·admin 미수정 |
| dirty 잔여 | `study-room-reg/screens.js`(공백만) · repo `docs/046`·`047`·`README` — **미포함·그대로** |
| 메뉴 | 「등록·공개」→「등록·노출」(잔여 0) |
| 정책 | 가입 필수정보 → 기본 노출 · 상세=보완 · 심사·승인 없음 |
| 게이트 제거 | 공개하기 / 공개 상태 전환 / 공개 전 필수 / 상세 충족 게이트 없음 |
| 고객센터 | 카드 「노출 상태」 · 「사전 심사 없음」·학생 「공개 범위」 유지 |
| 정책 고지 | 「등록 정보와 노출」 · 신뢰정보 「노출」 · 연락처 비공개·게시물 숨김 유지 |
| 라우트 | `/guide/register` 등 해시 rename 없음 |
| 잔여 「공개」 | 전부 **KEEP**(개인정보·연락처·법령 고지·학생 범위·운영 숨김). FIX=0 |

Cursor 보고 스모크(`127.0.0.1:5174` · guide/support/community)와 기계 대조 결과 동일.

---

## 다음 (사람)

1. 커밋할 때 **위 4파일만** stage. dirty 잔여 넣지 말 것.
2. 배포 지시: [144](144-guide-support-142-deploy-ticket.md).
3. 내 등록·관리자 「숨김/공개」 잔재는 [127](127-status-vocabulary-audit.md) 후순위.
