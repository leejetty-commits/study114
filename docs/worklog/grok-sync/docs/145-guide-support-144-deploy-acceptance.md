# 145 · 144 배포 수락 — 이용안내·고객센터 「공개」→「노출」

- 작성: 2026-09-25 12:59 KST
- 선행: [144](144-guide-support-142-deploy-ticket.md) · [143](143-guide-support-142-acceptance.md) · [142](142-guide-support-public-to-exposure-ticket.md) · [130](130-copy-public-hidden-to-exposure-backlog.md)
- 상태: **배포 수락** · 이용안내·고객센터 카피 트랙(130→142) **닫음**
- 커밋: `f154183b5dab4d7391f98180996d94d432468ca4`
- 부모: `f42d89e`
- 메시지: `copy(guide,support): 등록·공개→등록·노출, drop review/detail gates`
- Actions: **Deploy to dothome #339** · success
- 파일 4: `guide/copy.js` · `guide/screens.js` · `support/support-copy.js` · `policy-copy.js`

---

## 판정

144 게이트와 **일치**. 보완지시 없음.

| 항목 | 결과 |
|---|---|
| 범위 | origin/main `f42d89e..f154183` = 위 4파일만 (+95/−99) |
| dirty | `study-room-reg/screens.js` · docs/046·047·README **미커밋 유지** |
| 이용안내 | 좌메뉴·등록 본문 **등록·노출** · 기본 노출·상세 보완·무심사 |
| 정책 | 약관 **등록 정보와 노출** · 연락처/학생 「공개」·게시물 숨김 유지 |
| 손님 홈 | 지도 1/0/0 유지(회귀 없음) |
| FAQ 메모 | FAQ 본문에 「노출 상태」문구는 없음. 해당 카피는 공급자 체크리스트용으로 번들에 포함(의도된 위치). 쪽지 「받음/안받음」은 FAQ 본문 스모크 항목이 아님 → **비차단** |

---

## 남은 일 (별 트랙)

- 마스터 팝업 CRUD 스모크 (128)
- 내 등록·관리자 「숨김/공개」 잔재 ([127](127-status-vocabulary-audit.md))
- 오후 스모크: 과외쌤 조회수 · 학생찾기 위치
