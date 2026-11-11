# 362 재작성 8차 C — 15–22 재작성 (2026-11-12)

## 지시 (승인 `ㅇㅋ`)
- A `efe18129` · B `79145586` 이후 C만 → 커밋 → A~C push
- 15–22: 고정틀·부록 없음, 사례 1, H2 4~6(+Q&A), Q&A 형태 다양
- 「바뀌면」 중복 → 단일 15일 문구
- 20: 교습형태·인력 절 삭제
- 01–14와 교차 유사·본문 near-dup 해소
- body-core≥2300, unique≥2700 / noSp≥2000
- 02/03 폴더·merge·force 없음

## 본문 작업
- 15–22 전면 재작성(주제 절 + 사례 1 + Q&A 끝)
- 교차 유사·파일 내 near-dup 문장을 동의어가 아닌 다른 문장으로 교체
- 01–14 중 교차 FAIL 유발 문장도 일부 조정(12 등)
- frontmatter `chars` sync

## verify
- `docs/content/info-room/01-startup` → **PASS 22/22**
- `tmp/fail-samples-r8` → **FAIL 0/7** (A 유지)

## 범위
- `docs/content/info-room/01-startup/` 01~22(C 본선 15~22, 교차용 01~14 일부) + 본 worklog
- 미포함: verify 스크립트 · fail-samples · tmp · merge
