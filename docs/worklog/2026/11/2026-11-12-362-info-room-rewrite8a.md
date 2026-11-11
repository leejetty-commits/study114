# 362 재작성 8차 A — verify 재작성 · fail-samples-r8 (2026-11-12)

## 지시 (승인 `ㅇㅋ`)
- 브랜치: `work/362-info-room-content` (HEAD 당시 `689f9100`)
- 순서: **A→commit → B→commit → C→commit → push**
- A만: `scripts/verify-info-room-content.mjs` 재작성 + fail-samples-r8
- 금지: synonym 회피 · verifying-down · 예외 추가 · 고정틀 · 02/03 폴더 · merge/force

## A verify 규칙 요약
- 동일틀: 종류+문단수구간 순서 **또는** 대응 제목 3-gram≥50% → ≥3파일 FAIL
- 절 크기: 문단≥6 **또는** 점유≥40% FAIL
- 부록: 사례 뒤~Q&A 직전 · 문단≤2 절 ≥2 FAIL
- 문장 3-gram≥50% (noSp≥15) · 글내 법령 포함 · 글간은 예외 제외
- 법령묶음: 한 문단 `제N조` ≥3 FAIL
- 본문 core≥2300 (H2/체크/Q&A/홍보 제외·중복제거)
- 접두사 필터 있어도 비교는 폴더 전체

## fail-samples-r8 — 7/7 FAIL (길이 PASS · 규칙 1개씩)
| 파일 | 의도 |
|---|---|
| 01~03-same-frame-* | h2-frame shared by 3 |
| 04-section-paras | section paras≥6 |
| 05-appendix-pos | appendix(positional)≥2 |
| 06-near-dup | near-dup sentences in-file |
| 07-law-cluster | law-exception cluster ≥3 |

## 스모크
- `tmp/fail-samples-r8`: FAIL 7/7 (의도 규칙만)
- `docs/content/info-room/01-startup`: FAIL 0/22 (B·C 전)

## 범위
- verify + fail-samples-r8 + 본 worklog
- 미포함: 본문 01~22 · tmp/*.mjs · merge
