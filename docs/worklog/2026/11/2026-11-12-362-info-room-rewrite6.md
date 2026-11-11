# 362 재작성 6차 — verify 보강 · 법령문장 · 09~14 재작성 (2026-11-12)

## 지시 (승인)
- 브랜치: `work/362-info-room-content` (HEAD 당시 `82fb2f61`)
- ① verify: SENT_NORM_MIN=15, exact-dup, 법령예외 동일문 ≥2 FAIL, 「바뀌면」×2, H2순서≥3, appendix≥2, Q&A 뒤 절
- ② 법령: 09/10/11/14 단일조건 15일 형식 · 09 교습장소 · 03·05 「개인과외교습자는」접두 (기존 반영 유지)
- ③ **09~14만** 재작성 (고정틀 금지, 주제형 H2 4~6, Q&A→체크리스트, 고유 2700+/noSp 2000+)
- ④ 01~08은 교차유사·글내 near-dup만 최소 수정
- 재개: 14만 고쳐 12와 겹치는 2쌍 제거 (12 미수정)
- 금지: 15~22·02/03·고정틀·동의어 회피·merge·force push
- 완료: 01~14 PASS + fail-samples-r6 전부 FAIL → commit/push (머지 없음)

## verify (01~14)
```
Result: PASS (14 pass / 0 fail)
unique with-space min=2715 avg=2900 max=3669
unique no-space   min=2021 avg=2172 max=2804
```

## 실패샘플 (`tmp/fail-samples-r6/`) — 5/5 FAIL
| 파일 | 잡힌 이슈(요지) |
|---|---|
| `01-exact-dup.md` | exact-dup · cross-sim · 길이 |
| `02-synonym-pad.md` | appendix≥2 · cross-sim · 길이 |
| `frame-a.md` / `frame-b.md` / `frame-c.md` | h2-order shared×3 · shared paras 100% · 길이 |

## 09~14 공백 포함 본문 글자 수 (frontmatter 제외)
| 파일 | body with-space | unique with-space (chars) |
|---|---:|---:|
| 09-interior-dongseon.md | 2823 | 2758 |
| 10-gyojae-system.md | 2865 | 2776 |
| 11-cheot-3months.md | 2845 | 2760 |
| 12-silpae-gyohun.md | 2819 | 2728 |
| 13-hakwonbeop-jorye.md | 2826 | 2715 |
| 14-imdae-juggeo.md | 2814 | 2723 |

## 본문 요지
- 09~14: 주제형 H2·사례·Q&A 직전 체크리스트, 단일조건 15일(09·14 교습장소 / 10 과목 / 11 교습비등)
- 01~08: 교차·글내 중복 문장만 최소 수정
- 14 재개: 상가·오피스텔 불가·처분·합의 확인처 문장을 12와 안 겹치게 교체

## 범위
- `scripts/verify-info-room-content.mjs`
- `docs/content/info-room/01-startup/01`~`14`
- `tmp/fail-samples-r6/`
- worklog: 본 문서
- 미포함: tmp/*.mjs 작업 스크립트, 15~22, 02·03, main 머지
