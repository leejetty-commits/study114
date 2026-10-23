# 홍보 페이지 v2 전용 폰트 출처

적용 범위: 홍보 랜딩 3페이지(`promo/study-room`, `promo/tutor`, `promo/parent`) 헤드라인·악센트 한정.  
본문은 앱 폰트(`--font-sans`) 그대로. 외부 CDN 없음. 로컬 `/assets/promo/fonts/`만 사용.  
승인: 종현 2026-10-24 (공통 디자인 매뉴얼 홍보 랜딩 3페이지 한정 예외).

---

| 항목 | G마켓 산스 Bold / Medium | 나눔손글씨 펜 |
|---|---|---|
| **파일** | `gmarket-sans-bold.woff2` / `gmarket-sans-medium.woff2` | `nanum-pen.woff2` |
| **CSS family** | `'PV2 Gmarket Sans'` (weight 700 / 500) | `'PV2 Nanum Pen'` (weight 400) |
| **저작권자** | © 2019 eBay Korea (현 Gmarket) | © 2010 NHN Corporation (NAVER) |
| **제작** | Sandoll | Sandoll |
| **라이선스** | SIL OFL 1.1 | SIL OFL 1.1 |
| **원본 배포처** | <https://corp.gmarket.com/fonts/> | <https://fonts.google.com/specimen/Nanum+Pen+Script> |
| **라이선스 전문** | `public/assets/promo/fonts/OFL-gmarket-sans.txt` | `public/assets/promo/fonts/OFL-nanum-pen.txt` |
| **서브셋 범위** | KS X 1001 한글 2,350자 + ASCII + 한글 자모 + 자주 쓰는 문장부호(·「」…"" 등) | 같은 범위(나눔손글씨 펜 원본엔 `·「」` 글리프 없음 — 해당 문자는 폴백 폰트로 표시) |
| **예약 이름 처리** | 수정본이므로 원본 family 이름 `"GmarketSans"` 대신 `"PV2 Gmarket Sans"` 사용 (OFL §1 조건) | 마찬가지로 `"PV2 Nanum Pen"` 사용 |

## 적용 클래스

| 폰트 | 클래스 | 용도 |
|---|---|---|
| G마켓 산스 700 | `.pv2-h1`, `.pv2-h2` | 페이지 대·중 제목 |
| G마켓 산스 500 | `.pv2-c h3`, `.pv2-t h3`, `.pv2-step h3` | 카드·단계 제목 |
| 나눔손글씨 펜 400 | `.pv2-hand` | 히어로 h1 키워드 악센트 |

G마켓 산스는 300/500/700만 있음 → `font-weight:800` 미사용(가짜 굵기 방지).  
2,350자 서브셋에 없는 드문 음절은 폴백 폰트로 표시됨 — 정상 동작.
