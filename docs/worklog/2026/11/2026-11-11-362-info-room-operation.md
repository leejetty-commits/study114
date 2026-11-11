# 362 배치2 — 공부방 운영 팁 (2026-11-11)

## 지시 요점
- 배치1 push 승인 후 진행 · 카테고리 「창업」=`startup` 메타 반영(DB 미반영)
- worktree: `D:\work\study114\.wt\362-info-room` (기존 `D:\work\study114-.wt\362-info-room`에서 이전; `move`는 Permission denied → remove+add)
- 배치2: 운영팁 20건+ · 커밋만 · push 승인 후

## 선행
- 배치1 push: `7db9f95b` → `origin/work/362-info-room-content`
- 카테고리 메타 커밋(미push): `822afb80` `362 batch1: category_suggest를 startup(창업)으로 맞춤`

## 산출
- `docs/content/info-room/02-operation/` 22건 (`topic: operation`, `category_suggest: know-how`)
- `docs/content/info-room/_sources/02-operation-sources.md`
- 이 worklog

## verify
```
node scripts/verify-info-room-content.mjs docs/content/info-room/02-operation
→ PASS (22 pass / 0 fail)
Char distribution: min=2605 avg=2684 max=2728
Title similarity warnings: (none)
```

## 셀프검수 체크리스트 (글마다)

| 글 | 글자 수 | `##` 4+ | 요약 3 | 사례 | 체크 5+ | URL 0 | 기준일 | 복사 | 중복 없음 | 판정 |
|---|---|---|---|---|---|---|---|---|---|---|
| 01–22 | 2605–2728 | 7 | Y | Y | 6 | Y | Y | 무일치 | Y | PASS |

## 복사 표본 (특징 문장 정확일치 검색 · 무일치)

| 글 | 표본 | 일치 |
|---|---|---|
| 01 | 좋은 상담은 말이 많은 상담이 아니라, 같은 그림을 그리는 상담입니다 | 무 |
| 02 | 꾸준함은 양보다 리듬입니다 | 무 |
| 04 | 규칙이 분명할수록 예외 처리가 쉬워집니다 | 무 |
| 05 | 미납은 인격 문제가 아니라 일정 문제입니다 | 무 |
| 06 | 재등록은 이벤트가 아니라 평소 운영의 성적표입니다 | 무 |
| 07 | 좋은 시간표는 가득 찬 표가 아니라, 지켜질 표입니다 | 무 |
| 10 | 1인 원장의 경쟁력은 성실함이 아니라 지속 가능한 리듬입니다 | 무 |
| 12 | 끝나는 방식도 브랜드입니다 | 무 |
| 13 | 작은 숙제가 꾸준히 돌아오는 쪽이 큰 숙제보다 강합니다 | 무 |
| 15 | 매끄러운 등하원이 조용한 홍보가 됩니다 | 무 |
| 16 | 짧은 기록이 긴 기억을 이깁니다 | 무 |
| 17 | 불만은 공격이 아니라 신호일 때가 많습니다 | 무 |
| 18 | 반환은 끝까지의 서비스입니다 | 무 |
| 19 | 아이들의 50분은 원장님의 멀티태스킹보다 소중합니다 | 무 |
| 20 | 작은 월간 리뷰가 큰 방학 개편보다 자주 효과를 냅니다 | 무 |
| 21 | 전환을 사건으로 대하면 개학이 덜 버겁습니다 | 무 |
| 22 | 건강한 결석이 장기 출석을 지킵니다 | 무 |
| (+5) | 레벨테스트·시험기·특강·형제동반·생활지도 마무리 문장 | 무 |

## 배치 공통

| # | 항목 | 결과 |
|---|---|---|
| 1 | 건수 20+ | PASS 22 |
| 2 | verify PASS | PASS |
| 3 | 복사 표본 20+ 무일치 | PASS |
| 4 | `_sources` | PASS |
| 5 | uncertain_facts | PASS (반환 비율·교습시간·감염 지침 등) |
| 6 | 앱 코드 diff 0 | PASS |

## 주제 중복
- 창업(신고·사업자)·홍보(플레이스·맘카페) 미포함
- 제목 유사도 경고 0

## 표본 검수 추천 3건
1. `01-sangdam-daebon.md`
2. `05-minap-daeeung.md`
3. `18-banhwan-silmu.md`

## 미해결
- `startup` 카테고리 DB·UI 반영은 별도 티켓
- 배치1 카테고리 커밋 `822afb80` push 대기
- 배치2 push 대기

## 발견 목록
- `git worktree move` Windows Permission denied → remove+add로 동일 경로 목표 달성
