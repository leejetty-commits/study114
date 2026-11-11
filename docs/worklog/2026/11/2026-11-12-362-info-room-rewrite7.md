# 362 재작성 7차 — verify 보강 · 03·06~08·10·12·13 (2026-11-12)

## 지시 (승인)
- 브랜치: `work/362-info-room-content` (HEAD 당시 `8532bccb`)
- 대상만: 03·06·07·08·10·12·13 + `scripts/verify-info-room-content.mjs`
- 미수정: 01·02·04·05·09·11·14 · 15~22 · 02/03 폴더
- 06~08 고정틀 제거·절 종류/순서 상이 · 불가 문장 통일 · 13 15일 범위 · 12 법령묶음 해체 · 10 보강
- verify: 절종류 비교 · 부록 부분일치 · 비교최소15 · 본문2300 · 법령묶음≥3 · 」공백+조사 FAIL
- fail-sample-r7 추가 · commit/push · merge 없음

## verify 01~14 (필터)
```
Result: PASS (14 pass / 0 fail)
```

## 폴더 전체(01~22) — 15~22 FAIL 목록
| 파일 | 요지 |
|---|---|
| 15 | near-dup · 「바뀌면」×2 · appendix≥2 · cross |
| 16 | exact/near-dup · appendix≥2 · cross |
| 17 | exact/near-dup · appendix≥2 |
| 18 | exact/near-dup · appendix≥2 · cross |
| 19 | exact/near-dup · appendix≥2 · cross |
| 20 | near-dup · 「바뀌면」×2 · appendix≥2 · cross |
| 21 | exact/near-dup · 「바뀌면」×2 · appendix≥2 · cross |
| 22 | exact/near-dup · appendix≥2 |

(전체 실행 시 04·05·14도 15~22와의 cross-sim으로 FAIL로 표시될 수 있음. 01~14 단독 필터는 14/14 PASS.)

## fail-samples-r7 — 6/6 FAIL
| 파일 | 의도 |
|---|---|
| 01~03-frame-jungri | 제목 끝「정리」틀 · h2-order×3 |
| 04-appendix-memo | 「바로 적용 메모」부록≥2 |
| 05-short-restate | 15자급 exact-dup 재진술 |
| 06-law-cluster | 한 문단 법령 묶음≥3 |

## 수정 파일 본문·chars
| 파일 | body with-space | chars(unique) |
|---|---:|---:|
| 03-jip-vs-sangga.md | 3109 | 2882 |
| 06-gyoseupbi-geshi.md | 2806 | 2715 |
| 07-saeopja-segeum.md | 2848 | 2755 |
| 08-boheom-anjeon.md | 2840 | 2755 |
| 10-gyojae-system.md | 2988 | 2896 |
| 12-silpae-gyohun.md | 2886 | 2794 |
| 13-hakwonbeop-jorye.md | 2898 | 2786 |

## 범위
- verify + 위 본문 7편 + fail-samples-r7 + 본 worklog
- 미포함: tmp/*.mjs, 15~22, merge
