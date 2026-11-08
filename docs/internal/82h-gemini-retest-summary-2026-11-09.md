# 82h — Gemini 보안 **재점검** 요약 (2026-11-09)

**원본:** `82h-gemini-retest-raw-2026-11-09.md`  
**지시문:** `82f-external-ai-retest-after-remediation-prompt.md`  
**1차 대비:** `82b-gemini-audit-summary-2026-11-08.md`  
**최종 취합:** `82j-external-retest-consolidation-2026-11-09.md`  
**상태:** ✅ 원본 보관·요약 완료 · 취합 대기(Genspark)

---

## 한 줄 결론

**Critical/High 재현 0.** Gemini는 R1~R5·R7·R8/R20·R9/R22·R11/R27·R21을 **전부 「해소」**로 표기. ChatGPT(`82g`)가 전부 「미확인」인 것과 **정반대** → 취합 때 **증거 깊이·과장 여부**를 가려야 함. 「완벽하게」「철저히」문구는 1차와 같이 **할인**해서 읽는다.

---

## 표에 나온 판정 (Gemini 주장)

| 판정 | ID | 우리가 읽는 법 |
|------|-----|----------------|
| **해소** | R1, R2, R3, R4, R5, R7, R8/R20, R9/R22, R11/R27, R21 | 헤더·게이트·API는 **가능하면 내부 curl로 교차**. OAuth·IDOR·번들은 계정/코드 없이 「해소」확정은 과할 수 있음 |
| 표에 없음 | R6, R10, R12, R23~R26 등 | Gemini가 체크리스트를 **일부만** 채움 → 미기재≠해소 |
| 재현됨 | **없음** | — |

---

## Critical/High 재현

- Critical 재현: **0**
- High 재현: **0** (1차 High 후보였던 관리 API를 「해소」로 보고)

---

## 조치 후 좋아진 점 (Gemini 요약)

1. HTTPS 강제 · HSTS · nosniff · X-Frame  
2. CSP Enforce + 네이버 지도/지오코딩 정상  
3. `/#/admin` 게이트 · `/api/admin/*` 401/403 · OAuth state/return_to  

## 남거나 새로 본 점 (Gemini 요약)

1. 공개 영역 방어선이 견고해졌다고 평가  
2. 로그인 후 IDOR 교차는 계정 후(후속 B)  
3. git purge 안 함·재발급 · 번들 실키 없음  

---

## 1차(`82b`)·ChatGPT(`82g`) 대비

| 구분 | 1차 Gemini | 2차 Gemini | 2차 ChatGPT |
|------|------------|------------|-------------|
| Critical/High 재현 | 0 | 0 | 0 |
| 톤 | 「전반 양호」과장 주의 | 「완벽·철저·해소」다수 → **할인** | 전부 미확인·솔직 |
| 실측 주장 | 구조 추정 위주 | 헤더·admin·API·지도까지 **해소** 주장 | HTTP 자체 불가 |

---

## 취합(`82j`)에 넣을 때

- Gemini 칸: 재현 0 · **해소 주장 다수** · 표 미기재 ID는 미확인으로 둘 것  
- ChatGPT와 충돌: 동일 항목을 「해소 vs 미확인」 → **내부 재확인(curl/브라우저)이 중재**  
- R21 IDOR「해소」: 게스트 관찰 수준이면 OK, **교차 IDOR는 후속 B**  
- R9/R22「해소」: start URL 관찰만이면 부분 확인 · 변조 실로그인은 지시상 금지였음
